// ==================== 入力モード ====================
export type EntryMode = 'manual' | 'company' | 'memo'

// ==================== 利用状況 ====================
export type UsageStatus = 'none' | 'partial' | 'active' | 'expanding'

// ==================== 業種 ====================
export type Industry =
  | 'agriculture'       // A. 農業，林業
  | 'fishing'           // B. 漁業
  | 'mining'            // C. 鉱業，採石業
  | 'construction'      // D. 建設業
  | 'manufacturing'     // E. 製造業
  | 'utility'           // F. 電気・ガス・熱供給・水道業
  | 'it'                // G. 情報通信業
  | 'logistics'         // H. 運輸業，郵便業
  | 'retail'            // I. 卸売業，小売業
  | 'finance'           // J. 金融業，保険業
  | 'real_estate'       // K. 不動産業，物品賃貸業
  | 'professional'      // L. 学術研究，専門・技術サービス業
  | 'food_service'      // M. 宿泊業，飲食サービス業
  | 'beauty'            // N. 生活関連サービス業，娯楽業
  | 'education'         // O. 教育，学習支援業
  | 'medical'           // P. 医療，福祉
  | 'other'             // R. サービス業（他に分類されないもの）・その他

// ==================== 企業規模 ====================
export type CompanySize = 'under50' | 'under200' | 'under500' | 'under1000' | 'over1000'

// ==================== 経営課題 ====================
export type Challenge =
  | 'talent_development'
  | 'standardization'
  | 'knowledge_transfer'
  | 'manual_creation'
  | 'foreign_staff'
  | 'cost_reduction'
  | 'iso_compliance'
  | 'multi_store'
  | 'remote_management'
  | 'security'
  | 'env_not_ready'

// ==================== 導入目的 ====================
export type PrimaryGoal =
  | 'reduce_training_time'
  | 'standardize_quality'
  | 'eliminate_dependency'
  | 'reduce_cost'
  | 'improve_compliance'
  | 'support_foreign_staff'
  | 'dx_promotion'

// ==================== 優先KPI ====================
export type KpiType = 'time_reduction' | 'cost_reduction' | 'quality_improvement' | 'turnover_reduction'

// ==================== 重点期間 ====================
export type PlanningPeriod = '3months' | '6months' | '12months'

// ==================== 運用課題（推進上の障壁） ====================
export type OperationalBarrier =
  | 'no_time_for_creation'
  | 'no_team_structure'
  | 'low_it_literacy'
  | 'hard_to_involve'
  | 'migration_burden'
  | 'no_creation_knowhow'
  | 'maintenance_concern'
  | 'low_adoption_concern'

// ==================== 活用シーン ====================
export type UseCase =
  | 'manual_viewing'
  | 'video_shooting'
  | 'pos_business_app'
  | 'customer_display'
  | 'team_communication'
  | 'onboarding'
  | 'skill_assessment'

// ==================== マニュアル種類 ====================
export type ManualType =
  | 'work_procedure'
  | 'customer_service'
  | 'system_operation'
  | 'safety_rules'
  | 'quality_check'
  | 'other'

// ==================== マニュアル品質方針 ====================
export type ManualQuality = 'casual' | 'rich'

// ==================== 動画撮影環境 ====================
export type ShootingEnvironment = 'quiet' | 'noisy' | 'very_noisy'

// ==================== 動画撮影視点 ====================
export type ShootingViewpoint = 'pov' | 'third_person' | 'both'

// ==================== デバイス種別 ====================
export type DeviceType = 'smartphone' | 'tablet' | 'pc' | 'large_monitor'

// ==================== 利用環境条件 ====================
export type EnvironmentCondition =
  | 'normal'
  | 'water_humidity'
  | 'dust_dirt'
  | 'hygiene'
  | 'food_factory'
  | 'outdoor_sunlight'
  | 'low_temperature'

// ==================== 運用スタイル ====================
export type OperationStyle =
  | 'group_training'
  | 'group_shared'
  | 'workplace_unit'
  | 'individual'
  | 'byod'

// ==================== メインの回答型 ====================
export interface TmbWizardAnswers {
  // 入力モード
  entryMode: EntryMode

  // Step 1: 基本情報
  companyName: string
  industry: Industry | null
  subIndustry: string | null  // 業種サブセグメント（小売業の場合など）
  companySize: CompanySize | null
  locationCount: number
  isFranchise: boolean | null
  departmentNote: string  // 大企業の場合の部門・事業部メモ
  projectStartDate: string  // プロジェクト開始年月 "YYYY-MM"

  // Step 2: 経営課題
  challenges: Challenge[]

  // Step 3: 導入目的・期待効果
  primaryGoals: PrimaryGoal[]
  priorityKpi: KpiType | null
  targetValue: string

  // Step 3b: 現在の用途（新規）
  usageStatus: UsageStatus | null  // 現在の利用状況
  currentUseCases: string  // 現在の用途（自由記述）

  // Step 4: 運用課題（推進上の障壁）
  operationalBarriers: OperationalBarrier[]

  // Step 5: 活用シーン・マニュアル
  useCases: UseCase[]
  manualTypes: ManualType[]
  manualQuality: ManualQuality | null
  shootingEnvironment: ShootingEnvironment
  shootingViewpoint: ShootingViewpoint
  cameraCount: number

  // Step 6: デバイス・利用環境
  deviceTypes: DeviceType[]
  environmentConditions: EnvironmentCondition[]

  // Step 7: 運用スタイル・現状
  operationStyle: OperationStyle | null
  staffPerLocation: number
  currentDevicesByType: Partial<Record<DeviceType, number>>
  headquartersDevicesByType: Partial<Record<DeviceType, number>>

  // メモ貼り付けモード用
  memoText: string
}

export const INITIAL_ANSWERS: TmbWizardAnswers = {
  entryMode: 'manual',
  companyName: '',
  industry: null,
  subIndustry: null,
  companySize: null,
  locationCount: 1,
  isFranchise: null,
  departmentNote: '',
  projectStartDate: '',
  challenges: [],
  primaryGoals: [],
  priorityKpi: null,
  targetValue: '',
  usageStatus: null,
  currentUseCases: '',
  operationalBarriers: [],
  useCases: [],
  manualTypes: [],
  manualQuality: null,
  shootingEnvironment: 'quiet',
  shootingViewpoint: 'pov',
  cameraCount: 1,
  deviceTypes: [],
  environmentConditions: [],
  operationStyle: null,
  staffPerLocation: 10,
  currentDevicesByType: {},
  headquartersDevicesByType: {},
  memoText: '',
}
