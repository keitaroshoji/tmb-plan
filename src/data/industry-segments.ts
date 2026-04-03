// ==================== 業種サブセグメント定義 ====================

export type RetailSubIndustry =
  | 'gms_supermarket'  // GMS・スーパー
  | 'convenience'      // コンビニ
  | 'apparel'          // アパレル
  | 'electronics'      // 家電量販
  | 'auto_dealer'      // 自動車販売
  | 'home_center'      // ホームセンター

export interface SubIndustrySegment {
  value: RetailSubIndustry
  label: string
  icon: string
  managementModel: string  // 経営モデル
  businessStructure: string // ビジネス構造
  standardizationTarget: string // 標準化対象
  openingQuestion: string  // 初手の問い
  challengeStructure: string // 課題構造
  solutionApproach: string   // 解決策の運用案
  bottleneckHints: string[]  // ボトルネックヒント
  referenceCases: string[]   // 参照事例
}

export const RETAIL_SUB_INDUSTRIES: SubIndustrySegment[] = [
  {
    value: 'gms_supermarket',
    label: 'GMS・スーパー',
    icon: '🛒',
    managementModel: '直営',
    businessStructure: '回転率',
    standardizationTarget: 'ヒト＋ルール＋モノ',
    openingQuestion: '店長が新人教育に1日何時間使っていますか？',
    challengeStructure:
      '多品種・高頻度の品出し・接客業務において、新人教育が属人化しており、店長や先輩スタッフの指導時間が膨大になっている。',
    solutionApproach:
      'まず新人入店〜独り立ちまでの教育マニュアルをデジタル化し、店長の指導負担を削減。次に惣菜・青果などの部門ごとの業務手順を標準化し、品質の均一化を図る。',
    bottleneckHints: [
      '店長・SVによる個別指導への依存度が高い可能性があります',
      'パート・アルバイト比率が高く、ITリテラシーのばらつきに注意が必要です',
      '部門ごとに独自ルールがあり、統一マニュアル作成に時間がかかる可能性があります',
    ],
    referenceCases: ['カインズ', 'ライフコーポレーション'],
  },
  {
    value: 'convenience',
    label: 'コンビニ（FC）',
    icon: '🏪',
    managementModel: 'FC',
    businessStructure: '回転率',
    standardizationTarget: 'ルール＋ヒト＋モノ',
    openingQuestion: '本部からの通知が現場に届いた証跡、残せていますか？',
    challengeStructure:
      'FC本部と加盟店オーナーの間での情報伝達ロスが発生しており、本部ルールが現場で徹底されないことで品質・コンプライアンスリスクが生じている。',
    solutionApproach:
      '本部からの業務通達・手順変更をTeachme Bizで配信し、既読確認・理解テストで伝達エビデンスを残す。加盟店オーナー向けの閲覧レポートで本部が状況を一元把握できる体制を作る。',
    bottleneckHints: [
      '本部と加盟店の利害が一致しない場合、推進が難航する可能性があります',
      '加盟店オーナーのITリテラシーにばらつきがあります',
      '既存の通達・マニュアル（紙・FAX）からの移行に抵抗が出やすいです',
    ],
    referenceCases: ['セブン-イレブン（FC本部）', 'ファミリーマート（FC本部）'],
  },
  {
    value: 'apparel',
    label: 'アパレル',
    icon: '👗',
    managementModel: '直営',
    businessStructure: '接客価値／回転率',
    standardizationTarget: 'ヒト＋ルール',
    openingQuestion: '新商品の知識、発売前に全スタッフに届いていますか？',
    challengeStructure:
      '季節ごとの新商品・シーズンセールの知識をスタッフ全員に事前共有することが難しく、接客品質に店舗・スタッフ間でばらつきが生じている。',
    solutionApproach:
      '新商品・シーズン情報のマニュアルを発売2週間前に一斉配信し、スタッフの事前学習を実現。コーディネート提案ロールプレイ動画で接客品質を標準化する。',
    bottleneckHints: [
      '季節・トレンドの変化が早く、マニュアル更新が追いつかない可能性があります',
      '部分的に利用中の場合でも、活用率が低い店舗が多い傾向があります',
      'スマホBYOD運用の場合、プライベート端末利用のルール整備が必要です',
    ],
    referenceCases: ['ユナイテッドアローズ', 'BEAMS'],
  },
  {
    value: 'electronics',
    label: '家電量販',
    icon: '📺',
    managementModel: '直営',
    businessStructure: '接客価値',
    standardizationTarget: 'ヒト',
    openingQuestion: '新製品の発売初日、全スタッフが機能説明できますか？',
    challengeStructure:
      '新製品・新技術の情報量が多く、販売スタッフへの製品知識共有がメーカー研修だけでは追いつかない。特に若手・中途入社スタッフの知識レベルに大きな差がある。',
    solutionApproach:
      '製品カテゴリ別の知識マニュアルをTeachme Bizで一元管理し、新製品発売時に即時配信。動画での操作デモを活用し、短時間でのキャッチアップを実現する。',
    bottleneckHints: [
      '製品知識の深さが求められるため、マニュアル作成にかかるスキルと時間が高めです',
      'メーカー提供資料との二重管理になる可能性があります',
      '売場担当者の入れ替わりが多く、継続的な更新体制の構築が課題になります',
    ],
    referenceCases: ['ヤマダ電機', 'エディオン'],
  },
  {
    value: 'auto_dealer',
    label: '自動車販売',
    icon: '🚗',
    managementModel: 'ディーラー',
    businessStructure: '接客価値',
    standardizationTarget: 'ヒト＋ルール',
    openingQuestion: '商談プロセスの属人化、成約率のスタッフ依存は大きいですか？',
    challengeStructure:
      '商談力が一部のベテラン営業担当者に依存しており、若手・中途社員の成約率が低い。試乗説明や納車手順など法的手続きを含む業務の標準化も求められている。',
    solutionApproach:
      'トップ営業の商談プロセスをステップ化してマニュアル化し、若手が参考にできる「商談の型」を作る。納車手順・保険説明など法的手続きに関するマニュアルでコンプライアンスも強化する。',
    bottleneckHints: [
      'ベテラン担当者がノウハウをマニュアル化することへの抵抗感がある可能性があります',
      '顧客情報・商談内容が含まれるため、セキュリティポリシーの確認が必要です',
      'ディーラー本社と各販売店の温度感の差が推進障壁になりやすいです',
    ],
    referenceCases: ['トヨタカローラ（各販売店）', 'Honda Cars（各販売店）'],
  },
  {
    value: 'home_center',
    label: 'ホームセンター',
    icon: '🔧',
    managementModel: '直営',
    businessStructure: '接客価値',
    standardizationTarget: 'ヒト＋ルール',
    openingQuestion: 'どのスタッフでも担当カテゴリの相談に答えられますか？',
    challengeStructure:
      'DIU・園芸・ペット・建材など専門性の高いカテゴリが多く、担当外の商品知識が不足するスタッフが多い。専門知識を持つベテランへの依存が高く、異動・退職時のリスクが大きい。',
    solutionApproach:
      'カテゴリ別の専門知識マニュアルをTeachme Bizで整備し、どのスタッフでも基本的な相談に対応できる体制を作る。ベテランのノウハウを動画マニュアルとして可視化・蓄積する。',
    bottleneckHints: [
      'カテゴリ数が多く、初期のマニュアル整備に相当な工数が必要です',
      'ベテランスタッフのITリテラシーが低い場合、動画撮影の協力を得るのが難しいことがあります',
      '部門をまたぐ推進体制（誰が主導するか）の明確化が必要です',
    ],
    referenceCases: ['カインズ', 'コーナン商事'],
  },
]

// 業種ごとのサブセグメントマップ（将来の拡張用）
export const SUB_INDUSTRY_MAP: Partial<Record<string, typeof RETAIL_SUB_INDUSTRIES>> = {
  retail: RETAIL_SUB_INDUSTRIES,
}

export function getSubIndustriesForIndustry(industry: string | null): typeof RETAIL_SUB_INDUSTRIES {
  if (!industry) return []
  return SUB_INDUSTRY_MAP[industry] ?? []
}

export function getSubIndustrySegment(value: RetailSubIndustry): SubIndustrySegment | undefined {
  return RETAIL_SUB_INDUSTRIES.find((s) => s.value === value)
}
