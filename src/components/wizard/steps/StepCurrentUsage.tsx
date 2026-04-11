'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { useWizardStore } from '@/src/store/wizardStore'
import { Button } from '@/src/components/ui/Button'
import { ChoiceCard } from '@/src/components/ui/ChoiceCard'
import { UsageStatus } from '@/src/types/answers'
import {
  TMB_PLANS,
  TmbPlanId,
  TmbFeatureId,
  FEATURE_LABELS,
  FEATURE_DESCRIPTIONS,
  getPlanById,
} from '@/src/data/tmb-plans'

const USAGE_OPTIONS: { value: UsageStatus; label: string; icon: string; desc: string }[] = [
  {
    value: 'none',
    label: 'まだ使っていない',
    icon: '🌱',
    desc: 'Teachme Bizはこれから導入する',
  },
  {
    value: 'partial',
    label: '一部で試用中',
    icon: '🔬',
    desc: '特定の部門・チームで試験的に利用している',
  },
  {
    value: 'active',
    label: '特定の用途で活用中',
    icon: '✅',
    desc: '決まった用途・業務で本格的に使っている',
  },
  {
    value: 'expanding',
    label: '複数部門で展開中',
    icon: '🚀',
    desc: '複数部門・拠点に広げている段階',
  },
]

// 有料オプションとして選択できる機能（全プランで opt または na が存在するもの）
const ALL_OPT_FEATURES: TmbFeatureId[] = [
  'teachme_ai',
  'auto_translation',
  'video_storage',
  'portal',
  'training',
  'approval_workflow',
  'sso',
  'ip_restriction',
  'external_publish',
  'external_publish_plus',
  'teachme_player',
  'my_skill',
]

export function StepCurrentUsage() {
  const router = useRouter()
  const { answers, updateAnswers, nextStep, prevStep } = useWizardStore()

  const isUncontracted = answers.contractPlan === 'uncontracted'

  const selectedPlan = answers.contractPlan && !isUncontracted
    ? getPlanById(answers.contractPlan as TmbPlanId)
    : null

  // 選択中のプランで opt の機能（チェックボックス表示対象）
  const optFeatures: TmbFeatureId[] = selectedPlan
    ? ALL_OPT_FEATURES.filter((f) => selectedPlan.features[f] === 'opt')
    : []

  // 選択中のプランで na の機能
  const naFeatures: TmbFeatureId[] = selectedPlan
    ? ALL_OPT_FEATURES.filter((f) => selectedPlan.features[f] === 'na')
    : []

  const handlePlanChange = (planId: string) => {
    if (planId === 'uncontracted') {
      updateAnswers({ contractPlan: 'uncontracted', contractAddons: [] })
      return
    }
    const plan = getPlanById(planId as TmbPlanId)
    if (!plan) return
    // プランが変わったらstdのものは自動的に含まれるので、addonsはリセット
    updateAnswers({ contractPlan: planId, contractAddons: [] })
  }

  const toggleAddon = (featureId: TmbFeatureId) => {
    const current = (answers.contractAddons ?? []) as TmbFeatureId[]
    const updated = current.includes(featureId)
      ? current.filter((f) => f !== featureId)
      : [...current, featureId]
    updateAnswers({ contractAddons: updated })
  }

  const handleNext = () => {
    nextStep()
    router.push('/wizard?step=3')
  }

  const handlePrev = () => {
    prevStep()
    router.push('/wizard?step=1')
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-bold text-gray-900">契約プランと現在の利用状況</h1>
        <p className="mt-1 text-sm text-gray-500">
          契約中のプランとオプション構成を選択してください。プランに応じた運用プランを提案します。
        </p>
      </div>

      {/* ── SECTION 1: プラン選択 ── */}
      <div className="space-y-4">
        <div>
          <label className="text-sm font-semibold text-gray-700">
            現在の契約プラン
            <span className="ml-1 text-xs font-normal text-red-500">*必須</span>
          </label>
          <p className="mt-0.5 text-xs text-gray-400">
            まだ契約していない場合は「未契約」を選択してください。新規営業中の場合は、契約を想定しているプランを選択してください。わからない場合は最も近いプランを選択してください。
            <a
              href="https://docs.google.com/spreadsheets/d/1FGxGDoOgq9HE10vK9gyGali9zJxhji1KvwWMev2SBak/edit?gid=1133969164#gid=1133969164"
              target="_blank"
              rel="noopener noreferrer"
              className="ml-1 text-blue-500 underline hover:text-blue-700"
            >
              プラン詳細はこちら
            </a>
          </p>
        </div>

        <select
          value={answers.contractPlan ?? ''}
          onChange={(e) => handlePlanChange(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
        >
          <option value="">プランを選択してください</option>
          <option value="uncontracted">未契約</option>
          <optgroup label="── 現行プラン ──">
            {TMB_PLANS.filter((p) => p.isNew).map((p) => (
              <option key={p.id} value={p.id}>
                {p.shortLabel}　¥{p.monthlyFee.toLocaleString()}/月
              </option>
            ))}
          </optgroup>
          <optgroup label="── 旧プラン ──">
            {TMB_PLANS.filter((p) => !p.isNew).map((p) => (
              <option key={p.id} value={p.id}>
                {p.shortLabel}　¥{p.monthlyFee.toLocaleString()}/月
              </option>
            ))}
          </optgroup>
        </select>

        {/* 未契約選択時の案内 */}
        {isUncontracted && (
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
            <p className="text-sm text-gray-600">
              <span className="font-semibold">未契約</span> を選択しました。
              運用シナリオは <span className="font-semibold text-blue-700">現エントリープラン相当の機能</span> が使える前提で提案されます。
            </p>
          </div>
        )}

        {/* プラン選択後：機能サマリー */}
        {selectedPlan && (
          <div className="rounded-lg border border-blue-100 bg-blue-50 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-blue-800">{selectedPlan.label}</span>
              <span className="text-xs text-blue-600">
                基本 {selectedPlan.basicIds.toLocaleString()} ID付帯　¥{selectedPlan.monthlyFee.toLocaleString()}/月
              </span>
            </div>

            {/* 標準搭載機能 */}
            <div>
              <p className="text-xs font-semibold text-gray-600 mb-1">◎ 標準搭載（追加費用なし）</p>
              <div className="flex flex-wrap gap-1.5">
                {ALL_OPT_FEATURES.filter((f) => selectedPlan.features[f] === 'std').map((f) => (
                  <span
                    key={f}
                    className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs text-green-700 font-medium"
                  >
                    {FEATURE_LABELS[f]}
                  </span>
                ))}
              </div>
            </div>

            {/* 利用不可機能（旧・スターターのみ） */}
            {naFeatures.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-600 mb-1">✕ このプランでは利用不可</p>
                <div className="flex flex-wrap gap-1.5">
                  {naFeatures.map((f) => (
                    <span
                      key={f}
                      className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs text-red-600 font-medium"
                    >
                      {FEATURE_LABELS[f]}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── SECTION 2: 追加オプション ── */}
      {selectedPlan && optFeatures.length > 0 && (
        <div className="space-y-3">
          <div>
            <label className="text-sm font-semibold text-gray-700">
              追加オプション
              <span className="ml-2 text-xs font-normal text-gray-400">（任意）</span>
            </label>
            <p className="mt-0.5 text-xs text-gray-400">
              有料オプションとして追加契約しているものにチェックを入れてください
            </p>
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {optFeatures.map((featureId) => {
              const isChecked = ((answers.contractAddons ?? []) as TmbFeatureId[]).includes(featureId)
              return (
                <label
                  key={featureId}
                  className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors ${
                    isChecked
                      ? 'border-blue-400 bg-blue-50'
                      : 'border-gray-200 bg-white hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleAddon(featureId)}
                    className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600 accent-blue-600"
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-800">{FEATURE_LABELS[featureId]}</p>
                    <p className="text-xs text-gray-500 leading-snug">{FEATURE_DESCRIPTIONS[featureId]}</p>
                  </div>
                </label>
              )
            })}
          </div>
        </div>
      )}

      {/* ── SECTION 3: 利用状況 ── */}
      <div className="space-y-3">
        <label className="text-sm font-semibold text-gray-700">現在の利用状況</label>
        <div className="grid grid-cols-1 gap-2">
          {USAGE_OPTIONS.map((item) => (
            <ChoiceCard
              key={item.value}
              label={item.label}
              icon={item.icon}
              description={item.desc}
              selected={answers.usageStatus === item.value}
              onClick={() => updateAnswers({ usageStatus: item.value })}
            />
          ))}
        </div>
      </div>

      {/* 現在の用途（自由記述） */}
      {answers.usageStatus && answers.usageStatus !== 'none' && (
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700">
            具体的にどのような用途で使っていますか？
            <span className="ml-2 text-xs font-normal text-gray-400">（任意）</span>
          </label>
          <textarea
            value={answers.currentUseCases}
            onChange={(e) => updateAnswers({ currentUseCases: e.target.value })}
            placeholder="例：新人教育のみ。作業手順マニュアルを200件作成済み。本社のHR部門が中心となって運用している。"
            rows={4}
            className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
          />
          <p className="text-xs text-gray-400">具体的に書くほど、より精度の高い用途提案が生成されます</p>
        </div>
      )}

      {/* スキップ説明 */}
      {!answers.usageStatus && (
        <div className="rounded-lg bg-gray-50 border border-gray-200 px-4 py-3">
          <p className="text-xs text-gray-500">
            利用状況を選択するとAIが最適な「次の一手」となる用途提案とロードマップを生成します。
            選択しなくてもプラン生成は可能です。
          </p>
        </div>
      )}

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={handlePrev}>
          ← 戻る
        </Button>
        <Button onClick={handleNext} size="lg">
          次へ →
        </Button>
      </div>
    </div>
  )
}
