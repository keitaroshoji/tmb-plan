import { NextRequest } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { TmbWizardAnswers } from '@/src/types/answers'
import { matchCaseStudies } from '@/src/lib/case-matcher'
import { matchInsights } from '@/src/lib/insight-matcher'

export const maxDuration = 90

const client = new Anthropic()
const MODEL = 'claude-haiku-4-5-20251001'

// ==================== システムプロンプト ====================

const SYSTEM_PLAN = 'あなたはTeachme Bizの運用支援専門家です。JSON形式のみで回答してください。'
const SYSTEM_EXTRAS = 'あなたはTeachme Bizの営業・CS支援の専門家です。JSON形式のみで出力してください。'

// ==================== スキーマ（分割） ====================

const SCHEMA_PHASES = `JSONのみ（4フェーズ必須。categoryActivitiesは全カテゴリ・全フェーズに必ず1件以上記入）:
{"theme":"テーマ1行","summary":"サマリー300字","phases":[{"name":"名","period":"1〜3ヶ月目","goal":"ゴール1文","kpi":"KPI","actions":[{"title":"名","description":"1文","owner":"担当"}],"categoryActivities":{"初期設定":["具体的な活動"],"マニュアル作成":["具体的な活動"],"マニュアル活用":["具体的な活動"],"効果測定":["具体的な活動"],"その他":["具体的な活動"]}}]}`

const SCHEMA_SCHEDULE = `JSONのみ（month=1〜12の12ヶ月分＋month=13として13ヶ月目以降の中長期取り組みを1件追加、計13件）:
{"schedule":[{"month":1,"title":"月テーマ","actions":["アクション1","アクション2","アクション3"],"isReviewPoint":false},{"month":13,"title":"13ヶ月目以降の取り組みテーマ","actions":["中長期アクション1","中長期アクション2","中長期アクション3"],"isReviewPoint":true}]}`

const SCHEMA_USAGE = `JSONのみ:
{"usageScenarios":[{"manualTitle":"マニュアルのタイトル例","user":"誰が使うか（役職・立場）","scene":"どのようなシーンで使うか","effect":"どのような効果・成果が出るか"}]}`

const SCHEMA_BARRIER = `JSONのみ:
{"barrierActions":[{"challenge":"課題","counter":"対処策1文"}],"kpiTargets":[{"kpi":"名","target":"値","timing":"時期"}]}`

const SCHEMA_EXTRAS = `JSONのみ:
{"useCaseProposals":[{"title":"用途","description":"1〜2文","priority":"high|medium|low","effort":"easy|medium|hard"}],"roadmap":[{"phase":"名","period":"〇ヶ月目","theme":"テーマ","currentUsageExpansion":"既存深化","newUseCase":"新規用途","milestone":"達成目標"}],"counterScripts":[{"objection":"懸念","counter":"トーク","supportingData":"データ","proposalAction":"アクション"}],"bottleneckHints":[{"area":"端末環境|体制|リテラシー|既存マニュアル|更新運用","hint":"内容","severity":"要確認|注意|参考"}]}`

// ==================== ラベルマップ ====================

const INDUSTRY_LABELS: Record<string, string> = {
  agriculture: '農業・林業', fishing: '漁業', mining: '鉱業・採石業',
  construction: '建設業', manufacturing: '製造業', utility: '電気・ガス・熱供給・水道業',
  it: '情報通信業', logistics: '運輸業・郵便業', retail: '卸売業・小売業',
  finance: '金融業・保険業', real_estate: '不動産業・物品賃貸業',
  professional: '学術研究・専門・技術サービス業', food_service: '宿泊業・飲食サービス業',
  beauty: '生活関連サービス業・娯楽業', education: '教育・学習支援業',
  medical: '医療・福祉', other: 'サービス業（その他）・公務',
}

const SUB_INDUSTRY_LABELS: Record<string, string> = {
  gms_supermarket: 'GMS・スーパー', convenience: 'コンビニ（FC）', apparel: 'アパレル',
  electronics: '家電量販', auto_dealer: '自動車販売', home_center: 'ホームセンター',
}

const CHALLENGE_LABELS: Record<string, string> = {
  talent_development: '人材育成・研修の効率化', standardization: '品質・サービスの標準化',
  knowledge_transfer: '技術・ノウハウの伝承', manual_creation: 'マニュアル作成・更新の負担',
  foreign_staff: '外国人・多様な人材への教育', cost_reduction: 'コスト削減',
  iso_compliance: 'ISO・法令対応', multi_store: '多店舗・多拠点への展開',
  remote_management: '遠隔管理・モニタリング', security: 'セキュリティ強化',
}

const GOAL_LABELS: Record<string, string> = {
  reduce_training_time: '研修・教育時間の削減', standardize_quality: '品質・サービスの標準化',
  eliminate_dependency: '業務の属人化解消', reduce_cost: 'コスト削減',
  improve_compliance: 'コンプライアンス対応', support_foreign_staff: '外国人・多様な人材支援',
  dx_promotion: '現場DX推進',
}

const BARRIER_LABELS: Record<string, string> = {
  no_time_for_creation: 'マニュアル作成の時間が工面できない',
  no_team_structure: '推進担当者・体制が整っていない',
  low_it_literacy: '現場スタッフのITリテラシーが低い',
  hard_to_involve: '経営層・現場の巻き込みが難しい',
  migration_burden: '既存マニュアル（紙・Excel）の移行が膨大',
  no_creation_knowhow: 'マニュアル作成のノウハウがない',
  maintenance_concern: '継続的な更新・メンテナンスが続かない',
  low_adoption_concern: '利用促進・定着が見込めない',
}

const KPI_LABELS: Record<string, string> = {
  time_reduction: '工数削減', cost_reduction: 'コスト削減',
  quality_improvement: '品質・合格率向上', turnover_reduction: '定着率向上・離職率低下',
}

const USAGE_STATUS_LABELS: Record<string, string> = {
  none: 'まだ使っていない（ゼロから）', partial: '一部部門で試用中',
  active: '特定の用途で本格稼働中', expanding: '複数部門で展開中',
}

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

  // 類似事例（上位3件）をコンパクトに挿入
  const similarCases = matchCaseStudies(answers, 3)
  const casesStr = similarCases.length > 0
    ? '類似事例:\n' + similarCases.map((c) => `・${c.companyName}（${c.companySize}）: ${c.effect}`).join('\n')
    : ''

  // インタビュー知見（上位3件）をコンパクトに挿入
  const insights = matchInsights(answers, 3)
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

      // 4並列 Haiku コール
      const callA = client.messages.create({
        model: MODEL,
        max_tokens: 8192,
        system: [{ type: 'text', text: SYSTEM_PLAN, cache_control: { type: 'ephemeral' } }],
        messages: [{ role: 'user', content: `${context}\n\n4フェーズ生成。categoryActivitiesは全5カテゴリ×全4フェーズすべてに具体的な活動を1件以上必ず記入すること。活動内容は「現場担当者が無理なく取り組める」現実的でマイルドなトーンにすること。初期フェーズほど小さな成功体験を重視し、負担感を感じさせない表現・粒度にすること。\n${SCHEMA_PHASES}` }],
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
        messages: [{ role: 'user', content: `${context}\n\n12ヶ月スケジュール生成（各月actionsは必ず3件）＋month=13として13ヶ月目以降の中長期取り組みを1件追加すること。アクションは「現場がストレスなく実行できる」現実的で小さなステップにすること。最初の数ヶ月は特にシンプルに抑え、段階的に難易度を上げること。月ごとのテーマも「〜を始める」「〜を試す」など取り組みやすい語感にすること。\n${SCHEMA_SCHEDULE}` }],
      }).then((r) => {
        try {
          const text = r.content[0].type === 'text' ? r.content[0].text : ''
          if (r.stop_reason === 'max_tokens') console.error('[callB] max_tokens hit, JSON may be truncated')
          send('schedule', parseJson(text))
        } catch (e) { console.error('[callB] parse error:', e); send('schedule', {}) }
      }).catch((e) => { console.error('[callB] API error:', e); send('schedule', {}) })

      const callC = client.messages.create({
        model: MODEL,
        max_tokens: 800,
        system: [{ type: 'text', text: SYSTEM_PLAN, cache_control: { type: 'ephemeral' } }],
        messages: [{ role: 'user', content: `${context}\n\n運用障壁3件・KPI目標3件生成。\n${SCHEMA_BARRIER}` }],
      }).then((r) => {
        try {
          const text = r.content[0].type === 'text' ? r.content[0].text : ''
          send('barrier', parseJson(text))
        } catch { send('barrier', {}) }
      }).catch(() => send('barrier', {}))

      const callD = client.messages.create({
        model: MODEL,
        max_tokens: 1200,
        system: [{ type: 'text', text: SYSTEM_EXTRAS, cache_control: { type: 'ephemeral' } }],
        messages: [{ role: 'user', content: `${context}\n\n用途提案3〜5件・ロードマップ・カウンタースクリプト3件・ボトルネック示唆2〜4件。\n${SCHEMA_EXTRAS}` }],
      }).then((r) => {
        try {
          const text = r.content[0].type === 'text' ? r.content[0].text : ''
          send('extras', parseJson(text))
        } catch { send('extras', {}) }
      }).catch(() => send('extras', {}))

      const callE = client.messages.create({
        model: MODEL,
        max_tokens: 1500,
        system: [{ type: 'text', text: SYSTEM_PLAN, cache_control: { type: 'ephemeral' } }],
        messages: [{ role: 'user', content: `${context}\n\nこの企業が実際にTeachme Bizで作成・活用するマニュアルの具体例を5〜6件生成。業種・課題・現場に合った具体的なマニュアルタイトルと活用シーンを記入すること。\n${SCHEMA_USAGE}` }],
      }).then((r) => {
        try {
          const text = r.content[0].type === 'text' ? r.content[0].text : ''
          send('usage', parseJson(text))
        } catch { send('usage', {}) }
      }).catch(() => send('usage', {}))

      await Promise.all([callA, callB, callC, callD, callE])
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
