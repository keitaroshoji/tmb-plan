import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { TmbWizardAnswers } from '@/src/types/answers'
import { GeneratedPlan } from '@/src/types/plan'

export const maxDuration = 60

const client = new Anthropic()

// ==================== 定数 ====================

const SYSTEM_PROMPT_CORE = 'あなたはTeachme Bizの運用支援専門家です。SaaSの導入・定着支援の豊富な経験を持ち、業種・規模・課題に応じた最適な運用プランを提案できます。必ずJSON形式のみで回答してください。'

const SYSTEM_PROMPT_EXTRAS = 'あなたはTeachme Bizの営業・CS支援の専門家です。顧客情報をもとに、用途提案・ロードマップ・カウンタースクリプト・ボトルネック示唆をJSON形式のみで出力してください。'

// コアプラン用スキーマ（コンパクト）
const CORE_SCHEMA = `JSONのみ。scheduleのactionsは各月1件のみ:
{"summary":"2文以内","phases":[{"name":"名","period":"期間","goal":"1文","kpi":"KPI","actions":[{"title":"名","description":"1文","owner":"担当"}]}],"schedule":[{"month":1,"title":"テーマ","actions":["アクション1件のみ"],"isReviewPoint":false}],"barrierActions":["1文"],"kpiTargets":[{"kpi":"名","target":"値","timing":"時期"}]}`

// v2補助情報用スキーマ
const EXTRAS_SCHEMA = `JSONのみ:
{"useCaseProposals":[{"title":"用途","description":"1〜2文","priority":"high|medium|low","effort":"easy|medium|hard"}],"roadmap":[{"phase":"名","period":"〇ヶ月目","theme":"テーマ","currentUsageExpansion":"既存深化","newUseCase":"新規用途","milestone":"達成目標"}],"counterScripts":[{"objection":"懸念","counter":"トーク","supportingData":"データ","proposalAction":"アクション"}],"bottleneckHints":[{"area":"端末環境|体制|リテラシー|既存マニュアル|更新運用","hint":"内容","severity":"要確認|注意|参考"}]}`

// ==================== ラベルマップ ====================

const INDUSTRY_LABELS: Record<string, string> = {
  food_service: '飲食・フードサービス', retail: '小売・流通', manufacturing: '製造・工場',
  logistics: '物流・配送', medical: '医療・介護・福祉', beauty: 'ビューティー・サロン',
  education: '教育・研修', it: 'IT・情報通信', real_estate: '不動産・建設',
  finance: '金融・保険', other: 'その他',
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
  time_reduction: '時間削減', cost_reduction: 'コスト削減',
  quality_improvement: '品質・合格率向上', turnover_reduction: '定着率向上・離職率低下',
}

const PERIOD_LABELS: Record<string, string> = {
  '3months': '3ヶ月', '6months': '6ヶ月', '12months': '1年',
}

const USAGE_STATUS_LABELS: Record<string, string> = {
  none: 'まだ使っていない（ゼロから）', partial: '一部部門で試用中',
  active: '特定の用途で本格稼働中', expanding: '複数部門で展開中',
}

// ==================== プロンプト構築 ====================

function buildContext(answers: TmbWizardAnswers): string {
  const challenges = answers.challenges.map((c) => CHALLENGE_LABELS[c] ?? c).join('、')
  const barriers = answers.operationalBarriers.map((b) => BARRIER_LABELS[b] ?? b).join('、')
  const goal = GOAL_LABELS[answers.primaryGoal ?? ''] ?? answers.primaryGoal
  const kpi = KPI_LABELS[answers.priorityKpi ?? ''] ?? answers.priorityKpi
  const period = PERIOD_LABELS[answers.planningPeriod ?? ''] ?? answers.planningPeriod
  const phaseCount = period === '3ヶ月' ? 3 : period === '6ヶ月' ? 3 : 4
  const monthCount = period === '3ヶ月' ? 3 : period === '6ヶ月' ? 6 : 12

  const industryLabel = INDUSTRY_LABELS[answers.industry ?? ''] ?? answers.industry
  const subIndustryLabel = answers.subIndustry ? (SUB_INDUSTRY_LABELS[answers.subIndustry] ?? answers.subIndustry) : null
  const industryStr = subIndustryLabel ? `${industryLabel}（${subIndustryLabel}）` : industryLabel
  const usageStatusLabel = USAGE_STATUS_LABELS[answers.usageStatus ?? ''] ?? null

  const lines = [
    `企業:${answers.companyName} 業種:${industryStr}`,
    `規模:${answers.companySize} ${answers.locationCount}拠点×${answers.staffPerLocation}名 FC:${answers.isFranchise ? 'あり' : 'なし'}`,
    answers.departmentNote ? `対象部門:${answers.departmentNote}` : '',
    `課題:${challenges || 'なし'}`,
    `目的:${goal} KPI:${kpi}${answers.targetValue ? ` 目標:${answers.targetValue}` : ''}`,
    `重点期間:${period}`,
    barriers ? `運用障壁:${barriers}` : '',
    usageStatusLabel ? `現在の利用状況:${usageStatusLabel}` : '',
    answers.currentUseCases ? `現在の用途:${answers.currentUseCases}` : '',
    `フェーズ${phaseCount}個・スケジュール${monthCount}ヶ月分で生成。`,
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
  try {
    const answers: TmbWizardAnswers = await req.json()
    const context = buildContext(answers)

    // コアプラン (Sonnet) と v2補助情報 (Haiku) を並列実行
    const [coreResult, extrasResult] = await Promise.allSettled([
      client.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 4096,
        system: [{ type: 'text', text: SYSTEM_PROMPT_CORE, cache_control: { type: 'ephemeral' } }],
        messages: [{ role: 'user', content: `${context}\n\n${CORE_SCHEMA}` }],
      }),
      client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1536,
        system: [{ type: 'text', text: SYSTEM_PROMPT_EXTRAS, cache_control: { type: 'ephemeral' } }],
        messages: [{ role: 'user', content: `${context}\n\n用途提案3〜5件・ロードマップ・カウンタースクリプト3件・ボトルネック示唆2〜4件を生成。\n${EXTRAS_SCHEMA}` }],
      }),
    ])

    // コアプランのパース（必須）
    if (coreResult.status === 'rejected') {
      throw new Error('コアプラン生成に失敗しました')
    }
    const coreText = coreResult.value.content[0].type === 'text' ? coreResult.value.content[0].text : ''
    const core = parseJson(coreText)

    // v2補助情報のパース（失敗しても続行）
    let extras: Record<string, unknown> = {}
    if (extrasResult.status === 'fulfilled') {
      const extrasText = extrasResult.value.content[0].type === 'text' ? extrasResult.value.content[0].text : ''
      try { extras = parseJson(extrasText) } catch { /* 無視して続行 */ }
    }

    const plan: GeneratedPlan = {
      summary: (core.summary as string) ?? '',
      phases: (core.phases as GeneratedPlan['phases']) ?? [],
      schedule: (core.schedule as GeneratedPlan['schedule']) ?? [],
      barrierActions: (core.barrierActions as string[]) ?? [],
      kpiTargets: (core.kpiTargets as GeneratedPlan['kpiTargets']) ?? [],
      useCaseProposals: extras.useCaseProposals as GeneratedPlan['useCaseProposals'],
      roadmap: extras.roadmap as GeneratedPlan['roadmap'],
      counterScripts: extras.counterScripts as GeneratedPlan['counterScripts'],
      bottleneckHints: extras.bottleneckHints as GeneratedPlan['bottleneckHints'],
    }

    return NextResponse.json({ plan })
  } catch (err) {
    console.error('Plan generation error:', err)
    return NextResponse.json({ error: 'プランの生成に失敗しました' }, { status: 500 })
  }
}
