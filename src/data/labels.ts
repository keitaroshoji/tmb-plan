// ==================== 共有ラベルマップ ====================
// route.ts と result/page.tsx の両方から参照する唯一の定義ファイル

export const INDUSTRY_LABELS: Record<string, string> = {
  agriculture: '農業・林業', fishing: '漁業', mining: '鉱業・採石業',
  construction: '建設業', manufacturing: '製造業', utility: '電気・ガス・熱供給・水道業',
  it: '情報通信業', logistics: '運輸業・郵便業', retail: '卸売業・小売業',
  finance: '金融業・保険業', real_estate: '不動産業・物品賃貸業',
  professional: '学術研究・専門・技術サービス業', food_service: '宿泊業・飲食サービス業',
  beauty: '生活関連サービス業・娯楽業', education: '教育・学習支援業',
  medical: '医療・福祉', other: 'サービス業（その他）・公務',
}

export const SUB_INDUSTRY_LABELS: Record<string, string> = {
  gms_supermarket: 'GMS・スーパー', convenience: 'コンビニ（FC）', apparel: 'アパレル',
  electronics: '家電量販', auto_dealer: '自動車販売', home_center: 'ホームセンター',
}

export const COMPANY_SIZE_LABELS: Record<string, string> = {
  under50: '50名未満', under200: '50〜200名未満', under500: '200〜500名未満',
  under1000: '500〜1000名未満', over1000: '1000名以上',
}

export const CHALLENGE_LABELS: Record<string, string> = {
  talent_development: '人材育成・研修の効率化', standardization: '品質・サービスの標準化',
  knowledge_transfer: '技術・ノウハウの伝承', manual_creation: 'マニュアル作成・更新の負担',
  foreign_staff: '外国人・多様な人材への教育', cost_reduction: 'コスト削減',
  iso_compliance: 'ISO・法令対応', multi_store: '多店舗・多拠点への展開',
  remote_management: '遠隔管理・モニタリング', security: 'セキュリティ強化',
  env_not_ready: '利用環境（端末や通信等）が十分整備されていない',
}

export const GOAL_LABELS: Record<string, string> = {
  reduce_training_time: '研修・教育時間の削減', standardize_quality: '品質・サービスの標準化',
  eliminate_dependency: '業務の属人化解消', reduce_cost: 'コスト削減',
  improve_compliance: 'コンプライアンス対応', support_foreign_staff: '外国人・多様な人材支援',
  dx_promotion: '現場DX推進',
}

export const KPI_LABELS: Record<string, string> = {
  time_reduction: '工数削減', cost_reduction: 'コスト削減',
  quality_improvement: '品質・合格率向上', turnover_reduction: '定着率向上・離職率低下',
}

export const USAGE_STATUS_LABELS: Record<string, string> = {
  none: 'まだ使っていない（ゼロから）', partial: '一部部門で試用中',
  active: '特定の用途で本格稼働中', expanding: '複数部門で展開中',
}

export const BARRIER_LABELS: Record<string, string> = {
  no_time_for_creation: 'マニュアル作成の時間が工面できない',
  no_team_structure: '推進担当者・体制が整っていない',
  low_it_literacy: '現場スタッフのITリテラシーが低い',
  hard_to_involve: '経営層・現場の巻き込みが難しい',
  migration_burden: '既存マニュアル（紙・Excel）の移行が膨大',
  no_creation_knowhow: 'マニュアル作成のノウハウがない',
  maintenance_concern: '継続的な更新・メンテナンスが続かない',
  low_adoption_concern: '利用促進・定着が見込めない',
  device_shortage: '端末・通信環境が十分に整備されていない',
}

export const USE_CASE_LABELS: Record<string, string> = {
  manual_viewing: 'マニュアル閲覧', video_shooting: '動画撮影・作成',
  pos_business_app: 'POS・業務アプリ連携', customer_display: '顧客向け案内表示',
  team_communication: 'チームコミュニケーション', onboarding: '新人オンボーディング',
  skill_assessment: 'スキルチェック・テスト',
}

export const MANUAL_TYPE_LABELS: Record<string, string> = {
  work_procedure: '業務手順書', customer_service: '接客・サービスマニュアル',
  system_operation: 'システム操作マニュアル', safety_rules: '安全・衛生規則',
  quality_check: '品質チェックリスト', other: 'その他',
}

export const MANUAL_QUALITY_LABELS: Record<string, string> = {
  casual: 'スピード重視（手軽に作成）', rich: '品質重視（リッチなコンテンツ）',
}

export const ENV_CONDITION_LABELS: Record<string, string> = {
  normal: '通常環境', water_humidity: '水・湿気への配慮が必要',
  dust_dirt: '粉塵・汚れへの配慮が必要', hygiene: '衛生管理が必要',
  food_factory: '食品工場規格への準拠', outdoor_sunlight: '屋外・直射日光下',
  low_temperature: '低温環境',
}

export const OPERATION_STYLE_LABELS: Record<string, string> = {
  group_training: '集合研修タイプ（10人に1台）', group_shared: 'グループ共有タイプ（3人に1台）',
  workplace_unit: '職場単位タイプ（拠点ごと2〜3台）', individual: '個人割り振りタイプ（1人1台）',
  byod: 'BYODタイプ（個人端末活用）',
}
