// ==================== ユーザー深堀りインタビューから抽出した運用知見 ====================
// 出典: https://help.teachme.jp/hc/ja/sections/4411358376601

import { Industry, Challenge, OperationalBarrier } from '@/src/types/answers'

export interface InterviewInsight {
  id: string
  company: string
  industry: Industry
  challenges: Challenge[]
  barriers: OperationalBarrier[]
  tip: string        // 1〜2文の実践的ヒント
  source: string     // 記事URL
}

export const INTERVIEW_INSIGHTS: InterviewInsight[] = [
  // ==================== スタディスト経理ユニット ====================
  {
    id: 'studist-01',
    company: 'スタディスト（自社経理ユニット）',
    industry: 'professional',
    challenges: ['talent_development', 'standardization'],
    barriers: ['no_team_structure'],
    tip: '推進担当を2名に絞り「二人三脚」で深く関与する体制が、短期間でのITツール全社展開を可能にした。担当者が少人数でも徹底的に関与することで推進力が生まれる。',
    source: 'https://help.teachme.jp/hc/ja/articles/4416656868889',
  },
  {
    id: 'studist-02',
    company: 'スタディスト（自社経理ユニット）',
    industry: 'professional',
    challenges: ['standardization', 'talent_development'],
    barriers: ['low_adoption_concern'],
    tip: '「社員が迷わないマニュアル」を作るには第一印象の良さが重要。マニュアルを開いた瞬間の見やすさ・シンプルさが定着を左右するため、写真・動画を活用した視覚的なわかりやすさに投資する。',
    source: 'https://help.teachme.jp/hc/ja/articles/4419528425497',
  },

  // ==================== 製菓メーカー様 ====================
  {
    id: 'seika-01',
    company: '製菓メーカー（匿名）',
    industry: 'manufacturing',
    challenges: ['standardization', 'iso_compliance'],
    barriers: ['low_it_literacy', 'no_creation_knowhow'],
    tip: '本格展開前に小規模なPoC（検証導入）を実施し、現場での「使いやすさ」を徹底的に確認する。現場スタッフが実際に使えるかを最優先に検証することで、後の大規模展開がスムーズになる。',
    source: 'https://help.teachme.jp/hc/ja/articles/4414068148633',
  },
  {
    id: 'seika-02',
    company: '製菓メーカー（匿名）',
    industry: 'manufacturing',
    challenges: ['iso_compliance', 'standardization'],
    barriers: ['no_team_structure'],
    tip: 'ISO認証対応には承認ワークフロー機能が有効。工場ごとに承認権限のあるアカウントを設定し、担当者が内容を精査して承認する運用を確立すると、コンプライアンスと現場自律性が両立できる。',
    source: 'https://help.teachme.jp/hc/ja/articles/4414089671577',
  },
  {
    id: 'seika-03',
    company: '製菓メーカー（匿名）',
    industry: 'manufacturing',
    challenges: ['standardization', 'knowledge_transfer'],
    barriers: ['migration_burden', 'no_time_for_creation'],
    tip: '既存マニュアルの移行は「載せ換え」から始めると1本あたり10分程度で完了できる。慣れた担当者であれば2〜3時間で1本作成可能なレベルに達するため、まず移行完了を優先してから質を上げる方針が有効。',
    source: 'https://help.teachme.jp/hc/ja/articles/4414089671577',
  },
  {
    id: 'seika-04',
    company: '製菓メーカー（匿名）',
    industry: 'manufacturing',
    challenges: ['multi_store', 'standardization'],
    barriers: ['low_adoption_concern', 'hard_to_involve'],
    tip: '全工場展開で気づいた失敗は「拠点ごとの温度差を無視した一律展開」。成功した拠点の担当者を他拠点の推進役として活用し、横断的なサポート体制を作ることで全体浸透が加速した。',
    source: 'https://help.teachme.jp/hc/ja/articles/4414090098841',
  },

  // ==================== ラーメン魁力屋様 ====================
  {
    id: 'kairokuya-01',
    company: 'ラーメン魁力屋',
    industry: 'food_service',
    challenges: ['standardization', 'multi_store'],
    barriers: ['hard_to_involve', 'low_adoption_concern'],
    tip: '法令・外部要因（HACCPの義務化）を「巻き込みのフック」として活用。現場スタッフが「やらなければならない理由」が明確になることで、抵抗感なく新しいマニュアルを受け入れてもらえた。',
    source: 'https://help.teachme.jp/hc/ja/articles/4607883627801',
  },
  {
    id: 'kairokuya-02',
    company: 'ラーメン魁力屋',
    industry: 'food_service',
    challenges: ['standardization', 'talent_development'],
    barriers: ['low_adoption_concern', 'low_it_literacy'],
    tip: '事前配信→説明会→店舗での復習という「反転学習」アプローチで、ベテランスタッフへの浸透を実現。HACCPマニュアルを機にTeachme Biz自体の認知も促進された。',
    source: 'https://help.teachme.jp/hc/ja/articles/4607883627801',
  },
  {
    id: 'kairokuya-03',
    company: 'ラーメン魁力屋',
    industry: 'food_service',
    challenges: ['standardization', 'knowledge_transfer'],
    barriers: ['maintenance_concern', 'low_adoption_concern'],
    tip: '「マニュアルを作る」という意識から「自社としての基準を作る」という意識に転換することで、100店舗超での多様な流儀を統一する推進力が生まれる。マニュアルは目的ではなく手段として位置づける。',
    source: 'https://help.teachme.jp/hc/ja/articles/4608528570777',
  },

  // ==================== ミツボシコーポレーション様 ====================
  {
    id: 'mitsuhoshi-01',
    company: 'ミツボシコーポレーション',
    industry: 'retail',
    challenges: ['knowledge_transfer', 'standardization'],
    barriers: ['hard_to_involve'],
    tip: '社長自らが旗振り役となり「会社一体」でDXを推進する体制が、短期間での全社展開を実現。トップダウンのコミットメントが現場の抵抗を大幅に減らした。',
    source: 'https://help.teachme.jp/hc/ja/articles/7979685535769',
  },
  {
    id: 'mitsuhoshi-02',
    company: 'ミツボシコーポレーション',
    industry: 'retail',
    challenges: ['knowledge_transfer', 'talent_development'],
    barriers: ['no_team_structure', 'migration_burden'],
    tip: '個人のノートやPCに分散していたノウハウを「まず集める」ことから着手。業務引き継ぎの困難さを具体的な痛点として経営層に示すことで、Teachme Biz導入の必要性を説得できた。',
    source: 'https://help.teachme.jp/hc/ja/articles/7979685535769',
  },

  // ==================== グリーンライフ産業様 ====================
  {
    id: 'greenlife-01',
    company: 'グリーンライフ産業',
    industry: 'construction',
    challenges: ['knowledge_transfer', 'talent_development'],
    barriers: ['low_it_literacy'],
    tip: 'デジタル化に抵抗のある職人へのアプローチは「まずスマホに慣れてもらう」ことから。趣味（釣りの情報検索など）でスマホを使う体験から始め、徐々にTeachme Bizへ誘導する段階的アプローチが有効。',
    source: 'https://help.teachme.jp/hc/ja/articles/38903301580313',
  },
  {
    id: 'greenlife-02',
    company: 'グリーンライフ産業',
    industry: 'construction',
    challenges: ['cost_reduction', 'standardization'],
    barriers: ['migration_burden', 'no_time_for_creation'],
    tip: 'Teachme Bizのマニュアルフル活用でA4用紙20,000枚・移動時間200時間の削減を実現。紙マニュアルからの移行は「削減できるコスト」を数値化して示すと、社内承認が得やすくなる。',
    source: 'https://help.teachme.jp/hc/ja/articles/38903301580313',
  },

  // ==================== アイテック株式会社様 ====================
  {
    id: 'aitec-01',
    company: 'アイテック',
    industry: 'manufacturing',
    challenges: ['knowledge_transfer', 'talent_development'],
    barriers: ['no_creation_knowhow', 'maintenance_concern'],
    tip: '製造現場の暗黙知・属人化ノウハウは「まず動画で可視化」することが第一歩。デジタル化された知見はその後のAI活用や体系的な技術伝承の基盤になる。Teachme Biz Award 2022中小企業賞受賞事例。',
    source: 'https://help.teachme.jp/hc/ja/articles/30090882082073',
  },
  {
    id: 'aitec-02',
    company: 'アイテック',
    industry: 'manufacturing',
    challenges: ['foreign_staff', 'talent_development'],
    barriers: ['low_it_literacy'],
    tip: 'ミャンマー人技能実習生への技術習得支援にTeachme Bizのポータルページを活用。言語の壁がある外国人スタッフへの教育は、動画マニュアルとポータルによるコンテンツ整理が特に効果的。',
    source: 'https://help.teachme.jp/hc/ja/articles/30090967415321',
  },

  // ==================== 福岡運輸様 ====================
  {
    id: 'fukuokaunyu-01',
    company: '福岡運輸',
    industry: 'logistics',
    challenges: ['talent_development', 'standardization'],
    barriers: ['low_adoption_concern', 'maintenance_concern'],
    tip: '運用方針の見直し（運用の再設計）が転機となり、Teachme Bizが全社必須ツールへ昇格。教育の効率化と質向上を実現し、全社KPIにもインパクトを与えることができた。',
    source: 'https://help.teachme.jp/hc/ja/articles/38903403034905',
  },

  // ==================== サンベルクス様 ====================
  {
    id: 'sunvelx-01',
    company: 'サンベルクス（食品スーパー）',
    industry: 'retail',
    challenges: ['talent_development', 'standardization'],
    barriers: ['low_adoption_concern'],
    tip: '食品スーパーでのTeachme Biz活用で作業効率化と人時生産性の向上を達成。現場での活用を推進するには「使って良かった」という小さな成功体験を積み重ねることが定着の鍵。',
    source: 'https://help.teachme.jp/hc/ja/articles/29371605288089',
  },
]
