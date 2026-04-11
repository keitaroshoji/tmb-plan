'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { useWizardStore } from '@/src/store/wizardStore'
import { Button } from '@/src/components/ui/Button'
import { ChoiceCard } from '@/src/components/ui/ChoiceCard'
import { Challenge, PrimaryGoal, KpiType, OperationalBarrier } from '@/src/types/answers'

// ── データ定義 ────────────────────────────────────────────

const CHALLENGES: { value: Challenge; label: string; icon: string; desc: string }[] = [
  { value: 'talent_development',  label: '人材育成・研修の効率化',         icon: '👨‍🎓', desc: 'OJT時間の削減、育成コストの圧縮' },
  { value: 'standardization',     label: '品質・サービスの標準化',          icon: '⚖️',  desc: '拠点間・スタッフ間のばらつき解消' },
  { value: 'knowledge_transfer',  label: '技術・ノウハウの伝承',            icon: '🧠',  desc: '熟練者の知識を組織資産として残す' },
  { value: 'manual_creation',     label: 'マニュアル作成・更新の負担',       icon: '📝',  desc: '紙・Excel管理からの脱却' },
  { value: 'foreign_staff',       label: '外国人・多様な人材への教育',       icon: '🌍',  desc: '言語・リテラシーの壁を越えた教育' },
  { value: 'cost_reduction',      label: 'コスト削減',                     icon: '💰',  desc: '研修費・印刷費・移動費の削減' },
  { value: 'iso_compliance',      label: 'ISO・法令対応',                  icon: '📋',  desc: '品質管理文書の整備・更新管理' },
  { value: 'multi_store',         label: '多店舗・多拠点への展開',           icon: '🏢',  desc: '全拠点への均一な情報共有' },
  { value: 'remote_management',   label: '遠隔管理・モニタリング',           icon: '📡',  desc: '現場の状況を本部からリアルタイム把握' },
  { value: 'security',            label: 'セキュリティ強化',                icon: '🔒',  desc: '情報漏洩防止、端末管理' },
]

const GOALS: { value: PrimaryGoal; label: string; icon: string }[] = [
  { value: 'reduce_training_time',  label: '研修・教育時間の削減',     icon: '⏱️' },
  { value: 'standardize_quality',   label: '品質・サービスの標準化',   icon: '⚖️' },
  { value: 'eliminate_dependency',  label: '業務の属人化解消',         icon: '🔗' },
  { value: 'reduce_cost',           label: 'コスト削減',               icon: '💰' },
  { value: 'improve_compliance',    label: 'コンプライアンス対応',     icon: '📋' },
  { value: 'support_foreign_staff', label: '外国人・多様な人材支援',   icon: '🌍' },
  { value: 'dx_promotion',          label: '現場DX推進',               icon: '🚀' },
]

const KPIS: { value: KpiType; label: string; icon: string }[] = [
  { value: 'time_reduction',    label: '工数削減（研修・作成・問い合わせ）', icon: '⏱️' },
  { value: 'cost_reduction',    label: 'コスト削減（印刷・移動・外注費等）', icon: '💰' },
  { value: 'quality_improvement', label: '品質向上（ミス率・合格率・CS）',   icon: '📈' },
  { value: 'turnover_reduction',  label: '定着率向上・離職率低下',           icon: '👥' },
]

const BARRIERS: { value: OperationalBarrier; label: string; icon: string; desc: string }[] = [
  { value: 'no_time_for_creation',   label: 'マニュアル作成の時間が工面できない',   icon: '⏰', desc: '日常業務が忙しくコンテンツ作成が後回しになる' },
  { value: 'no_team_structure',      label: '推進担当者・体制が整っていない',        icon: '👥', desc: '専任者がおらず、誰が推進するか不明確' },
  { value: 'low_it_literacy',        label: '現場スタッフのITリテラシーが低い',      icon: '📱', desc: 'スマホ・アプリ操作に不慣れなスタッフが多い' },
  { value: 'hard_to_involve',        label: '経営層・現場の巻き込みが難しい',        icon: '🤝', desc: '導入への理解・協力を得るのが困難' },
  { value: 'migration_burden',       label: '既存マニュアル（紙・Excel）の移行が膨大', icon: '📦', desc: '大量の既存資料のデジタル化が課題' },
  { value: 'no_creation_knowhow',    label: 'マニュアル作成のノウハウがない',        icon: '🔧', desc: '何をどう書けばいいか分からない' },
  { value: 'maintenance_concern',    label: '継続的な更新・メンテナンスが続かない',  icon: '🔄', desc: '作っても更新されず陳腐化してしまう懸念' },
  { value: 'low_adoption_concern',   label: '利用促進・定着が見込めない',            icon: '📉', desc: '作っても現場で使われないかもしれない' },
  { value: 'device_shortage',        label: '端末・通信環境が十分に整備されていない', icon: '📶', desc: '端末不足・Wi-Fi未整備など、利用環境の課題がある' },
]

// ── セクションヘッダー ────────────────────────────────────

function SectionHeader({
  step, title, subtitle, required,
}: {
  step: string
  title: string
  subtitle: string
  required?: boolean
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="shrink-0 w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold">
        {step}
      </div>
      <div>
        <h2 className="text-base font-bold text-gray-900">
          {title}
          {required && <span className="ml-1.5 text-xs font-normal text-orange-500">*必須</span>}
        </h2>
        <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>
      </div>
    </div>
  )
}

// ── 補足メモ（常時表示） ──────────────────────────────────

function NoteField({
  value,
  onChange,
  placeholder,
}: {
  value: string
  onChange: (v: string) => void
  placeholder: string
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-semibold text-gray-700">
        その他・補足
        <span className="ml-2 text-xs font-normal text-gray-400">（任意）</span>
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={3}
        className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
      />
    </div>
  )
}

// ── メインコンポーネント ─────────────────────────────────

export function StepChallengesGoalsBarriers() {
  const router = useRouter()
  const { answers, updateAnswers, nextStep, prevStep } = useWizardStore()

  const toggleChallenge = (v: Challenge) => {
    const c = answers.challenges
    updateAnswers({ challenges: c.includes(v) ? c.filter((x) => x !== v) : [...c, v] })
  }

  const toggleGoal = (v: PrimaryGoal) => {
    const c = answers.primaryGoals
    updateAnswers({ primaryGoals: c.includes(v) ? c.filter((x) => x !== v) : [...c, v] })
  }

  const toggleBarrier = (v: OperationalBarrier) => {
    const c = answers.operationalBarriers
    updateAnswers({ operationalBarriers: c.includes(v) ? c.filter((x) => x !== v) : [...c, v] })
  }

  const canProceed =
    answers.challenges.length > 0 &&
    answers.primaryGoals.length > 0 &&
    answers.priorityKpi !== null

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-xl font-bold text-gray-900">課題・目標・推進障壁</h1>
        <p className="mt-1 text-sm text-gray-500">
          3つのセクションを一度に入力できます。①②は必須、③は任意です。
        </p>
      </div>

      {/* ① 経営課題 */}
      <section className="space-y-4">
        <SectionHeader
          step="①"
          title="経営課題"
          subtitle="現在抱えている課題をすべて選択してください（複数可）"
          required
        />
        <div className="grid grid-cols-1 gap-2">
          {CHALLENGES.map((item) => (
            <ChoiceCard
              key={item.value}
              label={item.label}
              description={item.desc}
              icon={item.icon}
              selected={answers.challenges.includes(item.value)}
              onClick={() => toggleChallenge(item.value)}
              variant="checkbox"
            />
          ))}
        </div>
        {answers.challenges.length > 0 && (
          <p className="text-xs text-blue-600">{answers.challenges.length}件選択中</p>
        )}
        <NoteField
          value={answers.challengeNote ?? ''}
          onChange={(v) => updateAnswers({ challengeNote: v })}
          placeholder="上記に当てはまらない課題や、詳細な状況を自由にご記入ください"
        />
      </section>

      <hr className="border-gray-100" />

      {/* ② 導入目的・KPI */}
      <section className="space-y-4">
        <SectionHeader
          step="②"
          title="導入目的・期待効果"
          subtitle="導入目的（複数可）と達成したいKPIを選択してください"
          required
        />

        <div>
          <p className="text-sm font-semibold text-gray-700 mb-2">
            導入の目的 <span className="text-orange-500">*</span>
            <span className="ml-2 text-xs font-normal text-gray-400">（複数選択可）</span>
          </p>
          <div className="grid grid-cols-1 gap-2">
            {GOALS.map((item) => (
              <ChoiceCard
                key={item.value}
                label={item.label}
                icon={item.icon}
                selected={answers.primaryGoals.includes(item.value)}
                onClick={() => toggleGoal(item.value)}
                variant="checkbox"
              />
            ))}
          </div>
        </div>

        <div>
          <p className="text-sm font-semibold text-gray-700 mb-2">
            優先KPI <span className="text-orange-500">*</span>
          </p>
          <div className="grid grid-cols-1 gap-2">
            {KPIS.map((item) => (
              <ChoiceCard
                key={item.value}
                label={item.label}
                icon={item.icon}
                selected={answers.priorityKpi === item.value}
                onClick={() => updateAnswers({ priorityKpi: item.value })}
              />
            ))}
          </div>
        </div>

        <div>
          <label className="text-sm font-semibold text-gray-700">
            目標値
            <span className="ml-2 text-xs font-normal text-gray-400">（任意）</span>
          </label>
          <input
            type="text"
            value={answers.targetValue}
            onChange={(e) => updateAnswers({ targetValue: e.target.value })}
            placeholder="例：研修時間を50%削減、月間問い合わせを100件→20件に"
            className="mt-1.5 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <NoteField
          value={answers.goalNote ?? ''}
          onChange={(v) => updateAnswers({ goalNote: v })}
          placeholder="上記に当てはまらない目的や、背景・期待することを自由にご記入ください"
        />
      </section>

      <hr className="border-gray-100" />

      {/* ③ 推進上の障壁 */}
      <section className="space-y-4">
        <SectionHeader
          step="③"
          title="推進上の障壁"
          subtitle="プロジェクト推進上の障壁を選択してください。対処策を運用プランに盛り込みます。（任意・複数可）"
        />
        <div className="grid grid-cols-1 gap-2">
          {BARRIERS.map((item) => (
            <ChoiceCard
              key={item.value}
              label={item.label}
              description={item.desc}
              icon={item.icon}
              selected={answers.operationalBarriers.includes(item.value)}
              onClick={() => toggleBarrier(item.value)}
              variant="checkbox"
            />
          ))}
        </div>
        {answers.operationalBarriers.length > 0 && (
          <p className="text-xs text-blue-600">{answers.operationalBarriers.length}件選択中</p>
        )}
        <NoteField
          value={answers.barrierNote ?? ''}
          onChange={(v) => updateAnswers({ barrierNote: v })}
          placeholder="上記に当てはまらない課題や、現場の状況・懸念点を自由にご記入ください"
        />
      </section>

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={() => { prevStep(); router.push('/wizard?step=2') }}>
          ← 戻る
        </Button>
        <Button
          onClick={() => { nextStep(); router.push('/wizard?step=4') }}
          disabled={!canProceed}
          size="lg"
        >
          次へ →
        </Button>
      </div>
    </div>
  )
}
