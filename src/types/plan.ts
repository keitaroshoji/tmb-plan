// ==================== AI生成プラン型 ====================

export interface PhaseAction {
  title: string
  description: string
  owner?: string // 担当ロール
}

export type ActivityCategory = '初期設定' | 'マニュアル作成' | 'マニュアル活用' | '効果測定' | 'その他'
export const ACTIVITY_CATEGORIES: ActivityCategory[] = ['初期設定', 'マニュアル作成', 'マニュアル活用', '効果測定', 'その他']

export interface Phase {
  name: string        // フェーズ名（例: "導入準備期"）
  period: string      // 期間（例: "1〜3ヶ月目"）
  goal: string        // ゴール
  actions: PhaseAction[]
  kpi?: string        // このフェーズのKPI
  categoryActivities?: {
    初期設定: string[]
    マニュアル作成: string[]
    マニュアル活用: string[]
    効果測定: string[]
    その他: string[]
  }
}

export interface MonthlyMilestone {
  month: number       // 1〜12
  title: string
  goal?: string       // 月次ゴール
  actions: string[]
  isReviewPoint: boolean
}

export interface CaseStudy {
  companyName: string
  industry?: string
  companySize: string
  challenge: string
  solution: string
  effect: string      // 定量効果
  qualitativeEffect?: string // 定性効果
  matchScore?: number // マッチングスコア（内部用）
  url?: string        // 事例ページURL
}

export interface BarrierAction {
  challenge: string   // 想定課題
  counter: string     // 対処策（詳しく）
}

export interface DeviceRecommendation {
  productName: string
  productKey: string
  reason: string
  recommendedCount: number
  monthlyUnitPrice: number
  initialCost: number
  contractMonths: number
}

export interface UseCaseProposal {
  title: string
  description: string
  priority: 'high' | 'medium' | 'low'
  effort: 'easy' | 'medium' | 'hard'
}

export interface RoadmapPhase {
  phase: string
  period: string
  theme: string
  currentUsageExpansion: string  // 既存用途の深化
  newUseCase: string             // 新規用途の追加
  milestone: string
}

export interface CounterScript {
  objection: string
  counter: string
  supportingData?: string
  proposalAction: string
}

export interface BottleneckHint {
  area: string
  hint: string
  severity: '要確認' | '注意' | '参考'
}

export interface GeneratedPlan {
  theme: string                  // 運用テーマ（1行）
  summary: string                // サマリー（後方互換用）
  projectOverview?: string       // プロジェクト概要（300文字程度）
  promotionPoints?: string       // 推進上のポイント（300文字程度）
  phases: Phase[]                // 運用フェーズ（4個）
  schedule: MonthlyMilestone[]   // 12ヶ月マイルストーン
  barrierActions: BarrierAction[]  // 運用課題と対処策
  kpiTargets: { kpi: string; target: string; timing: string }[]

  // v2追加フィールド（オプショナル）
  useCaseProposals?: UseCaseProposal[]
  roadmap?: RoadmapPhase[]
  counterScripts?: CounterScript[]
  bottleneckHints?: BottleneckHint[]
  usageScenarios?: UsageScenario[]
  featureStories?: FeatureStory[]
  manualUsagePairs?: ManualUsagePair[]
}

export interface UsageScenario {
  manualTitle: string   // マニュアルのタイトル例
  user: string          // 誰が使うか
  scene: string         // どのようなシーンで
  effect: string        // どのような効果が出るか
}

export interface FeatureStory {
  feature: string       // 活用するTeachme Biz機能名
  user: string          // 誰が（業種固有の役職・立場）
  scene: string         // どんな場面・困りごと（現場感ある描写）
  effect: string        // どう変わるか（即時効果＋組織的な変化）
}

export interface ManualUsagePair {
  targetUser: string   // 誰のために（対象者）※左右共通
  // 左カード: 作るマニュアル
  manualTitle: string  // マニュアルタイトル
  content: string      // どんな内容（収録する手順・情報の概要。1〜2文）
  // 右カード: こう使う
  feature: string      // 活用するTeachme Biz機能名
  scene: string        // どのようなシーンで使うか（1〜2文）
  effect: string       // どういう効果が出るか（1〜2文）
}
