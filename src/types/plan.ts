// ==================== AI生成プラン型 ====================

export interface PhaseAction {
  title: string
  description: string
  owner?: string // 担当ロール
}

export interface Phase {
  name: string        // フェーズ名（例: "導入準備期"）
  period: string      // 期間（例: "1〜2ヶ月目"）
  goal: string        // ゴール
  actions: PhaseAction[]
  kpi?: string        // このフェーズのKPI
}

export interface MonthlyMilestone {
  month: number       // 1〜12
  title: string
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
  summary: string               // エグゼクティブサマリー（2〜3文）
  phases: Phase[]               // 運用フェーズ（3〜4個）
  schedule: MonthlyMilestone[]  // 12ヶ月マイルストーン
  barrierActions: string[]      // 運用課題への対処アクション
  kpiTargets: { kpi: string; target: string; timing: string }[]

  // v2追加フィールド（オプショナル）
  useCaseProposals?: UseCaseProposal[]
  roadmap?: RoadmapPhase[]
  counterScripts?: CounterScript[]
  bottleneckHints?: BottleneckHint[]
}
