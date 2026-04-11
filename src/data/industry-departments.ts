import { Industry } from '@/src/types/answers'

export interface DepartmentOption {
  value: string
  label: string
  icon: string
}

export const INDUSTRY_DEPARTMENTS: Record<Industry, DepartmentOption[]> = {
  agriculture: [
    { value: 'farm_ops',   label: '農場・生産管理',     icon: '🌱' },
    { value: 'quality',    label: '品質・検査管理',     icon: '🔍' },
    { value: 'logistics',  label: '出荷・物流',          icon: '🚚' },
    { value: 'sales',      label: '営業・販売',          icon: '💼' },
    { value: 'admin',      label: '総務・管理',          icon: '🏢' },
  ],
  fishing: [
    { value: 'fishing_ops', label: '漁業・養殖オペレーション', icon: '🐟' },
    { value: 'processing',  label: '加工・選別',              icon: '🔪' },
    { value: 'logistics',   label: '出荷・物流',              icon: '🚚' },
    { value: 'admin',       label: '総務・管理',              icon: '🏢' },
  ],
  mining: [
    { value: 'site_ops',   label: '採掘・現場作業',    icon: '⛏️' },
    { value: 'safety',     label: '安全管理',           icon: '🦺' },
    { value: 'equipment',  label: '設備・機械管理',     icon: '🔧' },
    { value: 'admin',      label: '総務・管理',         icon: '🏢' },
  ],
  construction: [
    { value: 'site',       label: '現場施工',           icon: '👷' },
    { value: 'quality',    label: '品質管理',           icon: '📋' },
    { value: 'safety',     label: '安全管理',           icon: '🦺' },
    { value: 'equipment',  label: '設備・資機材管理',   icon: '🔧' },
    { value: 'design',     label: '設計・積算',         icon: '📐' },
    { value: 'sales',      label: '営業・受注管理',     icon: '💼' },
    { value: 'admin',      label: '総務・管理',         icon: '🏢' },
  ],
  manufacturing: [
    { value: 'production', label: '製造・生産ライン',   icon: '🏭' },
    { value: 'quality',    label: '品質管理・検査',     icon: '🔍' },
    { value: 'maintenance',label: '設備保全',           icon: '🔧' },
    { value: 'safety',     label: '安全衛生',           icon: '🦺' },
    { value: 'logistics',  label: '物流・倉庫・購買',   icon: '📦' },
    { value: 'rd',         label: '技術・開発・設計',   icon: '⚗️' },
    { value: 'sales',      label: '営業・販売',         icon: '💼' },
    { value: 'admin',      label: '総務・人事',         icon: '🏢' },
  ],
  utility: [
    { value: 'operations', label: '設備運転・オペレーション', icon: '⚡' },
    { value: 'maintenance',label: '保守・メンテナンス',      icon: '🔧' },
    { value: 'safety',     label: '安全管理',               icon: '🦺' },
    { value: 'customer',   label: '顧客対応・営業',          icon: '📞' },
    { value: 'admin',      label: '総務・管理',              icon: '🏢' },
  ],
  it: [
    { value: 'dev',        label: '開発・エンジニア',   icon: '💻' },
    { value: 'infra',      label: 'インフラ・運用',     icon: '🖥️' },
    { value: 'support',    label: 'サポート・ヘルプデスク', icon: '🎧' },
    { value: 'sales',      label: '営業・カスタマーサクセス', icon: '💼' },
    { value: 'admin',      label: '総務・人事',         icon: '🏢' },
  ],
  logistics: [
    { value: 'driver',     label: 'ドライバー・配送',   icon: '🚚' },
    { value: 'warehouse',  label: '倉庫・仕分け',       icon: '📦' },
    { value: 'maintenance',label: '車両整備・メンテナンス', icon: '🔧' },
    { value: 'dispatch',   label: '配車・管理',         icon: '📡' },
    { value: 'admin',      label: '総務・管理',         icon: '🏢' },
  ],
  retail: [
    { value: 'store_ops',  label: '店舗運営・販売',     icon: '🛍️' },
    { value: 'backyard',   label: 'バックヤード・在庫管理', icon: '📦' },
    { value: 'cashier',    label: 'レジ・接客',         icon: '🏪' },
    { value: 'sv',         label: 'SV・エリアマネージャー', icon: '👔' },
    { value: 'hq',         label: '本部・MD・商品管理', icon: '🏢' },
    { value: 'ec',         label: 'EC・デジタル運営',   icon: '💻' },
  ],
  finance: [
    { value: 'branch',     label: '窓口・テラー・営業店', icon: '🏦' },
    { value: 'sales',      label: '営業・外回り',        icon: '💼' },
    { value: 'compliance', label: 'コンプライアンス・審査', icon: '📋' },
    { value: 'it_sys',     label: 'システム・IT',        icon: '💻' },
    { value: 'admin',      label: '総務・人事',          icon: '🏢' },
  ],
  real_estate: [
    { value: 'sales',      label: '営業・仲介',          icon: '🏠' },
    { value: 'management', label: '建物管理・PM',        icon: '🔑' },
    { value: 'construction',label: '施工管理・リノベーション', icon: '🏗️' },
    { value: 'admin',      label: '総務・管理',          icon: '🏢' },
  ],
  professional: [
    { value: 'consultant',  label: 'コンサルタント・専門職', icon: '🔬' },
    { value: 'sales',       label: '営業・提案',            icon: '💼' },
    { value: 'research',    label: '研究・開発',            icon: '⚗️' },
    { value: 'admin',       label: '総務・管理',            icon: '🏢' },
  ],
  food_service: [
    { value: 'hall',        label: 'ホール・フロント',    icon: '🍽️' },
    { value: 'kitchen',     label: 'キッチン・調理',      icon: '👨‍🍳' },
    { value: 'housekeeping',label: '客室・清掃・ハウスキーピング', icon: '🛏️' },
    { value: 'manager',     label: '店長・マネージャー',  icon: '👔' },
    { value: 'hq',          label: '本部・SV管理',        icon: '🏢' },
  ],
  beauty: [
    { value: 'stylist',     label: 'スタイリスト・施術者', icon: '✂️' },
    { value: 'reception',   label: '受付・フロント',      icon: '😊' },
    { value: 'manager',     label: '店長・マネージャー',  icon: '👔' },
    { value: 'hq',          label: '本部・SV管理',        icon: '🏢' },
  ],
  education: [
    { value: 'teacher',     label: '教員・講師',          icon: '👩‍🏫' },
    { value: 'admin_staff', label: '事務・受付',          icon: '📝' },
    { value: 'hq',          label: '本部・教務管理',      icon: '🏢' },
  ],
  medical: [
    { value: 'nursing',     label: '看護師・介護職員',    icon: '👩‍⚕️' },
    { value: 'medical_admin',label: '医療事務・受付',     icon: '📋' },
    { value: 'rehab',       label: 'リハビリ・療法士',   icon: '💪' },
    { value: 'dr',          label: '医師・薬剤師',        icon: '🩺' },
    { value: 'manager',     label: '管理職・マネージャー', icon: '👔' },
  ],
  other: [
    { value: 'sales',       label: '営業',               icon: '💼' },
    { value: 'operations',  label: '現場・オペレーション', icon: '⚙️' },
    { value: 'admin',       label: '総務・人事',          icon: '🏢' },
    { value: 'cs',          label: 'カスタマーサポート',  icon: '📞' },
    { value: 'management',  label: '管理・経営企画',      icon: '📊' },
  ],
}

export function getDepartmentsForIndustry(industry: Industry | null): DepartmentOption[] {
  if (!industry) return []
  return INDUSTRY_DEPARTMENTS[industry] ?? []
}
