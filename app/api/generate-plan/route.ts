import { NextRequest } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { TmbWizardAnswers } from '@/src/types/answers'
import { matchCaseStudies } from '@/src/lib/case-matcher'
import { matchInsights } from '@/src/lib/insight-matcher'
import {
  INDUSTRY_LABELS, SUB_INDUSTRY_LABELS, CHALLENGE_LABELS,
  GOAL_LABELS, KPI_LABELS, USAGE_STATUS_LABELS, BARRIER_LABELS,
} from '@/src/data/labels'

export const maxDuration = 90

const client = new Anthropic()
const MODEL = 'claude-haiku-4-5-20251001'

// ==================== システムプロンプト ====================

const SYSTEM_PLAN = 'あなたはTeachme Bizの運用支援専門家です。JSON形式のみで回答してください。'

// ==================== スキーマ（分割） ====================

const SCHEMA_PHASES = `JSONのみ（4フェーズ必須。categoryActivitiesは全カテゴリ・全フェーズに必ず1件以上記入）:
{"theme":"テーマ1行","summary":"サマリー300字","phases":[{"name":"名","period":"1〜3ヶ月目","goal":"ゴール1文","kpi":"KPI","actions":[{"title":"名","description":"1文","owner":"担当"}],"categoryActivities":{"初期設定":["具体的な活動"],"マニュアル作成":["具体的な活動"],"マニュアル活用":["具体的な活動"],"効果測定":["具体的な活動"],"その他":["具体的な活動"]}}]}`

const SCHEMA_SCHEDULE = `JSONのみ（month=1〜12の12ヶ月分＋month=13として13ヶ月目以降の中長期取り組みを1件追加、計13件）:
{"schedule":[{"month":1,"title":"月テーマ","actions":["アクション1","アクション2","アクション3"],"isReviewPoint":false},{"month":13,"title":"13ヶ月目以降の取り組みテーマ","actions":["中長期アクション1","中長期アクション2","中長期アクション3"],"isReviewPoint":true}]}`

const SCHEMA_USAGE = `JSONのみ（4件）:
{"usageScenarios":[{"manualTitle":"マニュアルのタイトル例","user":"誰が使うか（役職・立場）","scene":"どのようなシーンで使うか","effect":"どのような効果・成果が出るか"}]}`

// callC: 障壁・KPI・プロジェクト概要・推進ポイントを1コールで生成（統合）
const SCHEMA_BARRIER_AND_SUMMARY = `JSONのみ:
{"barrierActions":[{"challenge":"課題","counter":"対処策1文"}],"kpiTargets":[{"kpi":"名","target":"値","timing":"時期"}],"projectOverview":"プロジェクトの目的・背景・期待効果を300字程度","promotionPoints":"推進の重要ポイント・注意点・成功の鍵を300字程度"}`

// ラベルマップは src/data/labels.ts に集約（import済み）

// ==================== コンテキスト構築 ====================

function buildContext(answers: TmbWizardAnswers): string {
  const challenges = answers.challenges.map((c) => CHALLENGE_LABELS[c] ?? c).join('、')
  const barriers = answers.operationalBarriers.map((b) => BARRIER_LABELS[b] ?? b).join('、')
  const goals = (answers.primaryGoals ?? []).map((g) => GOAL_LABELS[g] ?? g).join('、')
  const kpi = KPI_LABELS[answers.priorityKpi ?? ''] ?? answers.priorityKpi

  const industryLabel = INDUSTRY_LABELS[answers.industry ?? ''] ?? answers.industry
  const subIndustryLabel = answers.subIndustry ? (SUB_INDUSTRY_LABELS[answers.subIndustry] ?? answers.subIndustry) : null
  const industryStr = subIndustryLabel ? `${industryLabel}（${subIndustryLabel}）` : industryLabel
  const usageStatusLabel = USAGE_STATUS_LABELS[answers.usageStatus ?? ''] ?? null

  // 類似事例（上位1件）をコンパクトに挿入
  const similarCases = matchCaseStudies(answers, 1)
  const casesStr = similarCases.length > 0
    ? '類似事例:\n' + similarCases.map((c) => `・${c.companyName}（${c.companySize}）: ${c.effect}`).join('\n')
    : ''

  // インタビュー知見（上位1件）をコンパクトに挿入
  const insights = matchInsights(answers, 1)
  const insightsStr = insights.length > 0
    ? '運用知見（実際のユーザーインタビューより）:\n' + insights.map((i) => `・${i.company}: ${i.tip}`).join('\n')
    : ''

  const lines = [
    `企業:${answers.companyName} 業種:${industryStr}`,
    `規模:${answers.companySize} ${answers.locationCount}拠点×${answers.staffPerLocation}名 FC:${answers.isFranchise ? 'あり' : 'なし'}`,
    answers.departmentNote ? `対象部門:${answers.departmentNote}` : '',
    `課題:${challenges || 'なし'}`,
    `目的:${goals || 'なし'} KPI:${kpi}${answers.targetValue ? ` 目標:${answers.targetValue}` : ''}`,
    barriers ? `運用障壁:${barriers}` : '',
    usageStatusLabel ? `現在の利用状況:${usageStatusLabel}` : '',
    answers.currentUseCases ? `現在の用途:${answers.currentUseCases}` : '',
    casesStr,
    insightsStr,
  ]
  return lines.filter(Boolean).join('\n')
}

function parseJson(text: string): Record<string, unknown> {
  const jsonMatch = text.match(/```json\n?([\s\S]*?)\n?```/) || text.match(/(\{[\s\S]*\})/)
  const jsonStr = jsonMatch ? (jsonMatch[1] ?? jsonMatch[0]) : text
  return JSON.parse(jsonStr)
}

// ==================== API ルート ====================

export async function POST(req: NextRequest) {
  const answers: TmbWizardAnswers = await req.json()
  const context = buildContext(answers)
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      const send = (type: string, data: Record<string, unknown>) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type, ...data })}\n\n`))
      }

      // 4並列 Haiku コール（callD廃止・callF→callCに統合）
      // Prompt Caching: contextブロックにcache_controlを付与して再利用を促進
      const ctxBlock = { type: 'text' as const, text: context, cache_control: { type: 'ephemeral' as const } }

      const callA = client.messages.create({
        model: MODEL,
        max_tokens: 8192,
        system: [{ type: 'text', text: SYSTEM_PLAN, cache_control: { type: 'ephemeral' } }],
        messages: [{ role: 'user', content: [ctxBlock, { type: 'text', text: `\n\n4フェーズ生成。categoryActivitiesは全5カテゴリ×全4フェーズすべてに具体的な活動を1件以上必ず記入すること。活動内容は「現場担当者が無理なく取り組める」現実的でマイルドなトーンにすること。初期フェーズほど小さな成功体験を重視し、負担感を感じさせない表現・粒度にすること。\n${SCHEMA_PHASES}` }] }],
      }).then((r) => {
        try {
          const text = r.content[0].type === 'text' ? r.content[0].text : ''
          if (r.stop_reason === 'max_tokens') console.error('[callA] max_tokens hit, JSON may be truncated')
          send('phases', parseJson(text))
        } catch (e) { console.error('[callA] parse error:', e); send('phases', {}) }
      }).catch((e) => { console.error('[callA] API error:', e); send('phases', {}) })

      const callB = client.messages.create({
        model: MODEL,
        max_tokens: 4096,
        system: [{ type: 'text', text: SYSTEM_PLAN, cache_control: { type: 'ephemeral' } }],
        messages: [{ role: 'user', content: [ctxBlock, { type: 'text', text: `\n\n12ヶ月スケジュール生成（各月actionsは必ず3件、各アクションは25字以内で簡潔に）＋month=13として13ヶ月目以降の中長期取り組みを1件追加すること。アクションは「現場がストレスなく実行できる」現実的で小さなステップにすること。最初の数ヶ月は特にシンプルに抑え、段階的に難易度を上げること。月ごとのテーマも「〜を始める」「〜を試す」など取り組みやすい語感にすること。\n${SCHEMA_SCHEDULE}` }] }],
      }).then((r) => {
        try {
          const text = r.content[0].type === 'text' ? r.content[0].text : ''
          if (r.stop_reason === 'max_tokens') console.error('[callB] max_tokens hit, JSON may be truncated')
          send('schedule', parseJson(text))
        } catch (e) { console.error('[callB] parse error:', e); send('schedule', {}) }
      }).catch((e) => { console.error('[callB] API error:', e); send('schedule', {}) })

      // callC: 運用障壁・KPI + プロジェクト概要・推進ポイントを統合
      const callC = client.messages.create({
        model: MODEL,
        max_tokens: 1400,
        system: [{ type: 'text', text: SYSTEM_PLAN, cache_control: { type: 'ephemeral' } }],
        messages: [{ role: 'user', content: [ctxBlock, { type: 'text', text: `\n\n運用障壁3件・KPI目標3件・プロジェクト概要・推進ポイントを生成。\n${SCHEMA_BARRIER_AND_SUMMARY}` }] }],
      }).then((r) => {
        try {
          const text = r.content[0].type === 'text' ? r.content[0].text : ''
          const parsed = parseJson(text)
          send('barrier', { barrierActions: parsed.barrierActions, kpiTargets: parsed.kpiTargets })
          send('summary_detail', { projectOverview: parsed.projectOverview, promotionPoints: parsed.promotionPoints })
        } catch { send('barrier', {}); send('summary_detail', {}) }
      }).catch(() => { send('barrier', {}); send('summary_detail', {}) })

      const callE = client.messages.create({
        model: MODEL,
        max_tokens: 1000,
        system: [{ type: 'text', text: SYSTEM_PLAN, cache_control: { type: 'ephemeral' } }],
        messages: [{ role: 'user', content: [ctxBlock, { type: 'text', text: `\n\nこの企業が実際にTeachme Bizで作成・活用するマニュアルの具体例を4件生成。業種・課題・現場に合った具体的なマニュアルタイトルと活用シーンを記入すること。\n${SCHEMA_USAGE}` }] }],
      }).then((r) => {
        try {
          const text = r.content[0].type === 'text' ? r.content[0].text : ''
          send('usage', parseJson(text))
        } catch { send('usage', {}) }
      }).catch(() => send('usage', {}))

      await Promise.all([callA, callB, callC, callE])
      send('done', {})
      controller.close()
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}
