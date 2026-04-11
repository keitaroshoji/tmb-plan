// ==================== Teachme Biz プラン定義 ====================
// 新旧8プランの機能可用性マトリックス

export type TmbPlanId =
  | 'old_starter'          // 旧・スターター
  | 'old_basic'            // 旧・ベーシック
  | 'old_corporate'        // 旧・コーポレート
  | 'old_corporate_plus'   // 旧・コーポレート+
  | 'new_entry'            // 現・エントリー
  | 'new_business'         // 現・ビジネス
  | 'new_enterprise'       // 現・エンタープライズ
  | 'new_enterprise_plus'  // 現・エンタープライズ+

export type TmbFeatureId =
  | 'teachme_ai'            // Teachme AI
  | 'auto_translation'      // 自動翻訳
  | 'video_storage'         // 動画容量追加
  | 'portal'                // ポータル機能
  | 'training'              // トレーニング機能
  | 'approval_workflow'     // 承認ワークフロー（多段階）
  | 'sso'                   // SSO
  | 'ip_restriction'        // IP制限
  | 'external_publish'      // 外部公開追加
  | 'external_publish_plus' // アクセス制限付き外部公開プラス
  | 'teachme_player'        // Teachme Player
  | 'my_skill'              // マイスキル

// std: 標準搭載（常に利用可）
// opt: 有料オプション（追加契約で利用可）
// na:  利用不可（追加不可）
export type FeatureAvailability = 'std' | 'opt' | 'na'

export interface TmbPlanDefinition {
  id: TmbPlanId
  label: string          // 表示名（現・/旧・ プレフィックス付き）
  shortLabel: string     // 短縮名（ドロップダウン用）
  isNew: boolean         // 新プランか旧プランか
  monthlyFee: number     // 月額料金（円）
  basicIds: number       // 基本付帯ID数
  features: Record<TmbFeatureId, FeatureAvailability>
}

export const FEATURE_LABELS: Record<TmbFeatureId, string> = {
  teachme_ai:            'Teachme AI',
  auto_translation:      '自動翻訳',
  video_storage:         '動画容量追加',
  portal:                'ポータル機能',
  training:              'トレーニング機能',
  approval_workflow:     '承認ワークフロー（多段階）',
  sso:                   'SSO（シングルサインオン）',
  ip_restriction:        'IP制限',
  external_publish:      '外部公開追加',
  external_publish_plus: 'アクセス制限付き外部公開プラス',
  teachme_player:        'Teachme Player',
  my_skill:              'マイスキル',
}

// 機能の説明（運用提案に使用）
export const FEATURE_DESCRIPTIONS: Record<TmbFeatureId, string> = {
  teachme_ai:            'AIによるドラフト作成・かんたんAI検索・AIアシスト機能',
  auto_translation:      'マニュアルの自動多言語翻訳（外国人スタッフ対応）',
  video_storage:         '動画マニュアルの大容量保存・管理',
  portal:                '部門・用途別のポータルページ作成・配信',
  training:              'テスト・確認テスト・修了管理・習熟度管理',
  approval_workflow:     'マニュアル公開前の多段階承認フロー',
  sso:                   'Active Directory等との連携によるシングルサインオン',
  ip_restriction:        'アクセス許可IPアドレスの制限管理',
  external_publish:      '社外・取引先・アルバイト等へのマニュアル公開',
  external_publish_plus: 'アクセス制限付きでの外部公開（特定ユーザーのみ）',
  teachme_player:        '専用アプリでのオフライン閲覧・ハンズフリー操作',
  my_skill:              '個人のスキル・習熟度の記録・管理',
}

export const TMB_PLANS: TmbPlanDefinition[] = [
  // ── 旧プラン ──────────────────────────────────────────
  {
    id: 'old_starter',
    label: '旧・スタータープラン',
    shortLabel: '旧・スターター（60 ID付帯）',
    isNew: false,
    monthlyFee: 59800,
    basicIds: 60,
    features: {
      teachme_ai:            'opt',
      auto_translation:      'opt',
      video_storage:         'opt',
      portal:                'opt',
      training:              'na',
      approval_workflow:     'na',
      sso:                   'opt',
      ip_restriction:        'opt',
      external_publish:      'opt',
      external_publish_plus: 'opt',
      teachme_player:        'opt',
      my_skill:              'opt',
    },
  },
  {
    id: 'old_basic',
    label: '旧・ベーシックプラン',
    shortLabel: '旧・ベーシック（180 ID付帯）',
    isNew: false,
    monthlyFee: 119800,
    basicIds: 180,
    features: {
      teachme_ai:            'opt',
      auto_translation:      'opt',
      video_storage:         'opt',
      portal:                'std',
      training:              'std',
      approval_workflow:     'std',
      sso:                   'opt',
      ip_restriction:        'opt',
      external_publish:      'opt',
      external_publish_plus: 'opt',
      teachme_player:        'opt',
      my_skill:              'opt',
    },
  },
  {
    id: 'old_corporate',
    label: '旧・コーポレートプラン',
    shortLabel: '旧・コーポレート（600 ID付帯）',
    isNew: false,
    monthlyFee: 319800,
    basicIds: 600,
    features: {
      teachme_ai:            'opt',
      auto_translation:      'opt',
      video_storage:         'opt',
      portal:                'std',
      training:              'std',
      approval_workflow:     'std',
      sso:                   'std',
      ip_restriction:        'std',
      external_publish:      'opt',
      external_publish_plus: 'opt',
      teachme_player:        'opt',
      my_skill:              'opt',
    },
  },
  {
    id: 'old_corporate_plus',
    label: '旧・コーポレートプラスプラン',
    shortLabel: '旧・コーポレート+（20,000 ID付帯）',
    isNew: false,
    monthlyFee: 700000,
    basicIds: 20000,
    features: {
      teachme_ai:            'opt',
      auto_translation:      'opt',
      video_storage:         'opt',
      portal:                'std',
      training:              'std',
      approval_workflow:     'std',
      sso:                   'std',
      ip_restriction:        'std',
      external_publish:      'opt',
      external_publish_plus: 'opt',
      teachme_player:        'opt',
      my_skill:              'opt',
    },
  },
  // ── 新プラン ──────────────────────────────────────────
  {
    id: 'new_entry',
    label: '現・エントリープラン',
    shortLabel: '現・エントリー（50 ID付帯）',
    isNew: true,
    monthlyFee: 89800,
    basicIds: 50,
    features: {
      teachme_ai:            'std',
      auto_translation:      'std',
      video_storage:         'std',
      portal:                'opt',
      training:              'opt',
      approval_workflow:     'opt',
      sso:                   'opt',
      ip_restriction:        'opt',
      external_publish:      'opt',
      external_publish_plus: 'opt',
      teachme_player:        'opt',
      my_skill:              'opt',
    },
  },
  {
    id: 'new_business',
    label: '現・ビジネスプラン',
    shortLabel: '現・ビジネス（200 ID付帯）',
    isNew: true,
    monthlyFee: 199800,
    basicIds: 200,
    features: {
      teachme_ai:            'std',
      auto_translation:      'std',
      video_storage:         'std',
      portal:                'std',
      training:              'std',
      approval_workflow:     'std',
      sso:                   'opt',
      ip_restriction:        'opt',
      external_publish:      'opt',
      external_publish_plus: 'opt',
      teachme_player:        'opt',
      my_skill:              'opt',
    },
  },
  {
    id: 'new_enterprise',
    label: '現・エンタープライズプラン',
    shortLabel: '現・エンタープライズ（600 ID付帯）',
    isNew: true,
    monthlyFee: 439800,
    basicIds: 600,
    features: {
      teachme_ai:            'std',
      auto_translation:      'std',
      video_storage:         'std',
      portal:                'std',
      training:              'std',
      approval_workflow:     'std',
      sso:                   'std',
      ip_restriction:        'std',
      external_publish:      'opt',
      external_publish_plus: 'opt',
      teachme_player:        'opt',
      my_skill:              'opt',
    },
  },
  {
    id: 'new_enterprise_plus',
    label: '現・エンタープライズプラスプラン',
    shortLabel: '現・エンタープライズ+（20,000 ID付帯）',
    isNew: true,
    monthlyFee: 1060000,
    basicIds: 20000,
    features: {
      teachme_ai:            'std',
      auto_translation:      'std',
      video_storage:         'std',
      portal:                'std',
      training:              'std',
      approval_workflow:     'std',
      sso:                   'std',
      ip_restriction:        'std',
      external_publish:      'opt',
      external_publish_plus: 'opt',
      teachme_player:        'opt',
      my_skill:              'opt',
    },
  },
]

// ── ユーティリティ ────────────────────────────────────────

/** プランIDからプラン定義を取得 */
export function getPlanById(id: TmbPlanId): TmbPlanDefinition | undefined {
  return TMB_PLANS.find((p) => p.id === id)
}

/**
 * 利用可能な機能IDセットを返す
 * std は無条件、opt はaddons に含まれている場合のみ、na は常に除外
 */
export function getAvailableFeatures(
  planId: TmbPlanId,
  addons: TmbFeatureId[]
): TmbFeatureId[] {
  const plan = getPlanById(planId)
  if (!plan) return []
  return (Object.keys(plan.features) as TmbFeatureId[]).filter((f) => {
    const avail = plan.features[f]
    if (avail === 'std') return true
    if (avail === 'opt') return addons.includes(f)
    return false // na
  })
}

/**
 * 利用可能・オプション未追加・利用不可の3グループに分けて返す
 */
export function getFeatureGroups(
  planId: TmbPlanId,
  addons: TmbFeatureId[]
): {
  available: TmbFeatureId[]   // std + opted-in
  optAvailable: TmbFeatureId[] // opt で addons に含まれているもの
  optNotAdded: TmbFeatureId[] // opt で addons に含まれていないもの
  unavailable: TmbFeatureId[] // na
} {
  const plan = getPlanById(planId)
  if (!plan) return { available: [], optAvailable: [], optNotAdded: [], unavailable: [] }
  const available: TmbFeatureId[] = []
  const optAvailable: TmbFeatureId[] = []
  const optNotAdded: TmbFeatureId[] = []
  const unavailable: TmbFeatureId[] = []

  for (const f of Object.keys(plan.features) as TmbFeatureId[]) {
    const avail = plan.features[f]
    if (avail === 'std') {
      available.push(f)
    } else if (avail === 'opt') {
      if (addons.includes(f)) {
        available.push(f)
        optAvailable.push(f)
      } else {
        optNotAdded.push(f)
      }
    } else {
      unavailable.push(f)
    }
  }
  return { available, optAvailable, optNotAdded, unavailable }
}
