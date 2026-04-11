import { NextRequest } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { TmbWizardAnswers } from '@/src/types/answers'
import { matchCaseStudies } from '@/src/lib/case-matcher'
import { matchInsights } from '@/src/lib/insight-matcher'
import {
  INDUSTRY_LABELS, SUB_INDUSTRY_LABELS, CHALLENGE_LABELS,
  GOAL_LABELS, KPI_LABELS, USAGE_STATUS_LABELS, BARRIER_LABELS,
} from '@/src/data/labels'
import {
  getPlanById,
  getFeatureGroups,
  FEATURE_LABELS,
  TmbPlanId,
  TmbFeatureId,
} from '@/src/data/tmb-plans'
import { getDepartmentsForIndustry } from '@/src/data/industry-departments'

export const maxDuration = 90

const client = new Anthropic()
const MODEL = 'claude-haiku-4-5-20251001'

// ==================== システムプロンプト ====================

const SYSTEM_PLAN = 'あなたはTeachme Bizの運用支援専門家です。JSON形式のみで回答してください。'

// ==================== スキーマ（分割） ====================

const SCHEMA_PHASES = `JSONのみ（4フェーズ必須、3ヶ月×4=12ヶ月。categoryActivitiesは全カテゴリ・全フェーズに必ず1〜3件記入）:
{"theme":"テーマ1行","summary":"サマリー300字","phases":[{"name":"フェーズ1名","period":"1〜3ヶ月目","goal":"ゴール1文","kpi":"KPI","actions":[{"title":"名","description":"1文","owner":"担当"}],"categoryActivities":{"初期設定":["15字以内"],"マニュアル作成":["15字以内"],"マニュアル活用":["15字以内"],"効果測定":["15字以内"],"その他":["15字以内"]}},{"name":"フェーズ2名","period":"4〜6ヶ月目",...},{"name":"フェーズ3名","period":"7〜9ヶ月目",...},{"name":"フェーズ4名","period":"10〜12ヶ月目",...}]}`

const SCHEMA_SCHEDULE = `JSONのみ（month=1〜12の12ヶ月分＋month=13として13ヶ月目以降の中長期取り組みを1件追加、計13件）:
{"schedule":[{"month":1,"title":"月テーマ","actions":["アクション1（40〜60字の丁寧な文章）","アクション2（40〜60字の丁寧な文章）"],"isReviewPoint":false},{"month":13,"title":"13ヶ月目以降の取り組みテーマ","actions":["中長期アクション1（40〜60字）","中長期アクション2（40〜60字）"],"isReviewPoint":true}]}`

const SCHEMA_MANUAL_USAGE_PAIRS = `JSONのみ（4件）:
{"manualUsagePairs":[{"targetUser":"誰のために（例：入社1ヶ月以内のアルバイト、夜勤帯の介護スタッフ）業種固有の具体的な表現で","manualTitle":"作るマニュアルのタイトル","content":"マニュアルに収録する手順・情報の概要（1〜2文）","feature":"活用するTeachme Biz機能名を1つだけ（例：QRコード出力、トレーニング機能、かんたんAI検索、タスク機能、承認ワークフロー、ポータルページ、自動翻訳、AIによるドラフト作成）※複数機能の組み合わせは不可","scene":"そのマニュアルをどのようなシーンで使うか（現場の状況を具体的に。1〜2文）","effect":"どういう効果が出るか（即時効果と組織的な変化。1〜2文）"}]}`

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

  // ── 契約プラン・利用可能機能 ──
  const isUncontracted = answers.contractPlan === 'uncontracted'
  // 未契約の場合は現エントリープラン相当の制約を使用
  const planId = isUncontracted ? 'new_entry' as TmbPlanId : answers.contractPlan as TmbPlanId | null
  const addons = (answers.contractAddons ?? []) as TmbFeatureId[]
  const plan = planId ? getPlanById(planId) : null
  const featureGroups = plan ? getFeatureGroups(planId!, addons) : null

  const planStr = isUncontracted
    ? `契約状況:未契約（現エントリープラン相当の機能を前提に提案すること）`
    : plan
      ? `契約プラン:${plan.label}（¥${plan.monthlyFee.toLocaleString()}/月、基本${plan.basicIds}ID）`
      : ''

  const availableFeaturesStr = featureGroups && featureGroups.available.length > 0
    ? `利用可能な機能:${featureGroups.available.map((f) => FEATURE_LABELS[f]).join('、')}`
    : ''

  const unavailableFeaturesStr = featureGroups && featureGroups.unavailable.length > 0
    ? `利用不可機能（提案に含めないこと）:${featureGroups.unavailable.map((f) => FEATURE_LABELS[f]).join('、')}`
    : ''

  const optNotAddedStr = featureGroups && featureGroups.optNotAdded.length > 0
    ? `未追加オプション（標準外・未契約）:${featureGroups.optNotAdded.map((f) => FEATURE_LABELS[f]).join('、')}`
    : ''

  // 活用対象部門
  const deptOptions = getDepartmentsForIndustry(answers.industry)
  const deptLabels = (answers.targetDepartments ?? [])
    .map((v) => deptOptions.find((d) => d.value === v)?.label ?? v)
  const deptStr = deptLabels.length > 0
    ? `活用対象部門:${deptLabels.join('、')}`
    : ''

  const lines = [
    `企業:${answers.companyName} 業種:${industryStr}`,
    `規模:${answers.companySize} ${answers.locationCount}拠点×${answers.staffPerLocation}名 FC:${answers.isFranchise ? 'あり' : 'なし'}`,
    answers.departmentNote ? `対象部門・事業部:${answers.departmentNote}` : '',
    deptStr,
    planStr,
    availableFeaturesStr,
    unavailableFeaturesStr,
    optNotAddedStr,
    `課題:${challenges || 'なし'}`,
    answers.challengeNote ? `課題補足:${answers.challengeNote}` : '',
    `目的:${goals || 'なし'} KPI:${kpi}${answers.targetValue ? ` 目標:${answers.targetValue}` : ''}`,
    answers.goalNote ? `目的補足:${answers.goalNote}` : '',
    barriers ? `運用障壁:${barriers}` : '',
    answers.barrierNote ? `障壁補足:${answers.barrierNote}` : '',
    usageStatusLabel ? `現在の利用状況:${usageStatusLabel}` : '',
    answers.currentUseCases ? `現在の用途:${answers.currentUseCases}` : '',
    answers.manufacturingRegulations?.length
      ? `適用規格:${answers.manufacturingRegulations.join('、')}`
      : '',
    casesStr,
    insightsStr,
  ]
  return lines.filter(Boolean).join('\n')
}

/** プラン制約をシステムプロンプトに追記するための文字列を生成 */
function buildPlanConstraintHint(answers: TmbWizardAnswers): string {
  const isUncontracted = answers.contractPlan === 'uncontracted'
  // 未契約の場合は現エントリープラン相当で制約を構築
  const planId = isUncontracted ? 'new_entry' as TmbPlanId : answers.contractPlan as TmbPlanId | null
  const addons = (answers.contractAddons ?? []) as TmbFeatureId[]
  const plan = planId ? getPlanById(planId) : null
  if (!plan) return ''

  const featureGroups = getFeatureGroups(planId!, addons)

  const contractLabel = isUncontracted
    ? '未契約（現エントリープラン相当の機能を前提に提案）'
    : `「${plan.label}」を契約中`

  const lines: string[] = [
    `【プラン制約】顧客は${contractLabel}です。`,
    `利用可能な機能: ${featureGroups.available.map((f) => FEATURE_LABELS[f]).join('、') || 'なし'}`,
  ]
  if (featureGroups.unavailable.length > 0) {
    lines.push(`絶対に提案に含めてはいけない機能: ${featureGroups.unavailable.map((f) => FEATURE_LABELS[f]).join('、')}`)
  }
  if (featureGroups.optNotAdded.length > 0) {
    lines.push(`未契約オプション（提案では「オプション追加で〜できます」と補足可）: ${featureGroups.optNotAdded.map((f) => FEATURE_LABELS[f]).join('、')}`)
  }
  lines.push('上記の利用可能機能のみを前提に運用シナリオを作成してください。')
  return lines.join('\n')
}

function buildUsageHint(answers: TmbWizardAnswers): string {
  switch (answers.usageStatus) {
    case 'active':
      return '重要：この企業はすでにTeachme Bizを積極活用中。1ヶ月目から「活用範囲の拡大」「効果測定の高度化」「拠点展開」を主軸に据えること。初期設定・マニュアル作成の基礎ステップは最小化し、ROI可視化と全社定着を早期に実現するフェーズ設計にすること。'
    case 'expanding':
      return '重要：この企業はTeachme Bizを一部拠点・部門で活用し、全社展開を目指している段階。1ヶ月目から残拠点・部門への横展開計画を始動し、2ヶ月目には次の拠点でのキックオフを組み込むこと。展開先ごとのオンボーディングと活用支援が中心になること。'
    case 'partial':
      return '重要：この企業はTeachme Bizを部分的に利用中。1〜2ヶ月目で既存コンテンツの整備・標準化を進め、3ヶ月目から未活用部門・拠点への展開を本格化すること。'
    default:
      return '重要：1ヶ月目からマニュアル作成を開始し、2ヶ月目には現場での活用を始めること。全体として前倒しで、早期にマニュアル運用を軌道に乗せるスケジュールにすること。'
  }
}

function parseJson(text: string): Record<string, unknown> {
  // Try to extract JSON from markdown code block first, then bare object
  const codeBlockMatch = text.match(/```(?:json)?\n?([\s\S]*?)\n?```/)
  const objectMatch = text.match(/(\{[\s\S]*\})/)
  const jsonStr = codeBlockMatch?.[1] ?? objectMatch?.[1] ?? objectMatch?.[0] ?? text
  return JSON.parse(jsonStr.trim())
}

// ==================== API ルート ====================

export async function POST(req: NextRequest) {
  const answers: TmbWizardAnswers = await req.json()
  const context = buildContext(answers)
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      type SSEEvent =
        | { type: 'phases'; theme: string; summary: string; phases: unknown[] }
        | { type: 'schedule'; schedule: unknown[] }
        | { type: 'barrier'; barrierActions?: unknown[]; kpiTargets?: unknown[] }
        | { type: 'summary_detail'; projectOverview?: string; promotionPoints?: string }
        | { type: 'manual_usage_pairs'; manualUsagePairs?: unknown[] }
        | { type: 'done' }

      const send = (event: SSEEvent) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`))
      }

      // 4並列 Haiku コール（callD廃止・callF→callCに統合）
      // Prompt Caching: contextブロックにcache_controlを付与して再利用を促進
      const ctxBlock = { type: 'text' as const, text: context, cache_control: { type: 'ephemeral' as const } }

      const usageHint = buildUsageHint(answers)
      const planConstraint = buildPlanConstraintHint(answers)

      const callA = client.messages.create({
        model: MODEL,
        max_tokens: 8192,
        system: [{ type: 'text', text: SYSTEM_PLAN, cache_control: { type: 'ephemeral' } }],
        messages: [{ role: 'user', content: [ctxBlock, { type: 'text', text: `\n\n${planConstraint}\n\n4フェーズ生成。フェーズ分割は必ず「3ヶ月×4フェーズ」（1〜3ヶ月目/4〜6ヶ月目/7〜9ヶ月目/10〜12ヶ月目）で固定すること。${usageHint}categoryActivitiesは全5カテゴリ×全4フェーズすべてに1〜3件記入すること。各活動は必ず15字以内のキーワード的な短文にすること（例：「初期テンプレ作成」「閲覧数を週次確認」「新人研修で試用」）。15字を超える活動は絶対に書かないこと。\n${SCHEMA_PHASES}` }] }],
      }).then((r) => {
        try {
          const text = r.content[0].type === 'text' ? r.content[0].text : ''
          if (r.stop_reason === 'max_tokens') console.error('[callA] max_tokens hit, JSON may be truncated')
          send({ type: 'phases', ...parseJson(text) } as SSEEvent)
        } catch (e) { console.error('[callA] parse error:', e); send({ type: 'phases', theme: '', summary: '', phases: [] }) }
      }).catch((e) => { console.error('[callA] API error:', e); send({ type: 'phases', theme: '', summary: '', phases: [] }) })

      const callB = client.messages.create({
        model: MODEL,
        max_tokens: 4096,
        system: [{ type: 'text', text: SYSTEM_PLAN, cache_control: { type: 'ephemeral' } }],
        messages: [{ role: 'user', content: [ctxBlock, { type: 'text', text: `\n\n${planConstraint}\n\n12ヶ月スケジュール生成（各月actionsは必ず2件）＋month=13として13ヶ月目以降の中長期取り組みを1件追加すること。${usageHint}各アクションは40〜60字程度の丁寧な文章で、1項目が2行を超えないよう簡潔にまとめること。「〜することで〜を実現する」など具体的で行動ベースの書き方にすること。月ごとのテーマも「〜を始める」「〜を定着させる」など語感を統一すること。\n${SCHEMA_SCHEDULE}` }] }],
      }).then((r) => {
        try {
          const text = r.content[0].type === 'text' ? r.content[0].text : ''
          if (r.stop_reason === 'max_tokens') console.error('[callB] max_tokens hit, JSON may be truncated')
          send({ type: 'schedule', ...parseJson(text) } as SSEEvent)
        } catch (e) { console.error('[callB] parse error:', e); send({ type: 'schedule', schedule: [] }) }
      }).catch((e) => { console.error('[callB] API error:', e); send({ type: 'schedule', schedule: [] }) })

      // callC: 運用障壁・KPI + プロジェクト概要・推進ポイントを統合
      const callC = client.messages.create({
        model: MODEL,
        max_tokens: 1400,
        system: [{ type: 'text', text: SYSTEM_PLAN, cache_control: { type: 'ephemeral' } }],
        messages: [{ role: 'user', content: [ctxBlock, { type: 'text', text: `\n\n${planConstraint}\n\n運用障壁3件・KPI目標3件・プロジェクト概要・推進ポイントを生成。\n${SCHEMA_BARRIER_AND_SUMMARY}` }] }],
      }).then((r) => {
        try {
          const text = r.content[0].type === 'text' ? r.content[0].text : ''
          const parsed = parseJson(text)
          send({ type: 'barrier', barrierActions: parsed.barrierActions as unknown[], kpiTargets: parsed.kpiTargets as unknown[] })
          send({ type: 'summary_detail', projectOverview: parsed.projectOverview as string | undefined, promotionPoints: parsed.promotionPoints as string | undefined })
        } catch { send({ type: 'barrier' }); send({ type: 'summary_detail' }) }
      }).catch(() => { send({ type: 'barrier' }); send({ type: 'summary_detail' }) })

      const callE = client.messages.create({
        model: MODEL,
        max_tokens: 2000,
        system: [{ type: 'text', text: SYSTEM_PLAN, cache_control: { type: 'ephemeral' } }],
        messages: [{ role: 'user', content: [ctxBlock, { type: 'text', text: `\n\n${planConstraint}\n\nこの企業の業種・規模・課題に合わせた「マニュアル活用シナリオ」を4件生成。以下を必ず守ること：\n・targetUserは業種固有の役職・立場で具体的に（「社員」「スタッフ」などの汎用語は使わない）\n・4件は異なるtargetUser・異なるmanualTitle・異なるfeatureにする\n・featureは必ず1機能だけ。「〇〇＋〇〇」のような複数機能の組み合わせ表記は禁止\n・sceneは読んだ人が「うちのことだ」と思えるリアルな現場描写にする\n・effectは即時効果だけでなく組織的な変化まで書く\n・featureは必ず上記「利用可能な機能」の中から選ぶこと\n${SCHEMA_MANUAL_USAGE_PAIRS}` }] }],
      }).then((r) => {
        try {
          const text = r.content[0].type === 'text' ? r.content[0].text : ''
          if (r.stop_reason === 'max_tokens') console.error('[callE] max_tokens hit, JSON may be truncated')
          send({ type: 'manual_usage_pairs', ...parseJson(text) } as SSEEvent)
        } catch (e) { console.error('[callE] parse error:', e); send({ type: 'manual_usage_pairs', manualUsagePairs: [] }) }
      }).catch((e) => { console.error('[callE] API error:', e); send({ type: 'manual_usage_pairs', manualUsagePairs: [] }) })

      await Promise.all([callA, callB, callC, callE])
      send({ type: 'done' })
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
