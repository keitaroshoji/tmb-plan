'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { useWizardStore } from '@/src/store/wizardStore'
import { Button } from '@/src/components/ui/Button'
import { ChoiceCard } from '@/src/components/ui/ChoiceCard'
import { PrimaryGoal, KpiType } from '@/src/types/answers'

const GOALS: { value: PrimaryGoal; label: string; icon: string }[] = [
  { value: 'reduce_training_time', label: '研修・教育時間の削減', icon: '⏱️' },
  { value: 'standardize_quality', label: '品質・サービスの標準化', icon: '⚖️' },
  { value: 'eliminate_dependency', label: '業務の属人化解消', icon: '🔗' },
  { value: 'reduce_cost', label: 'コスト削減', icon: '💰' },
  { value: 'improve_compliance', label: 'コンプライアンス対応', icon: '📋' },
  { value: 'support_foreign_staff', label: '外国人・多様な人材支援', icon: '🌍' },
  { value: 'dx_promotion', label: '現場DX推進', icon: '🚀' },
]

const KPIS: { value: KpiType; label: string; icon: string }[] = [
  { value: 'time_reduction', label: '工数削減（研修・作成・問い合わせ）', icon: '⏱️' },
  { value: 'cost_reduction', label: 'コスト削減（印刷・移動・外注費等）', icon: '💰' },
  { value: 'quality_improvement', label: '品質向上（ミス率・合格率・CS）', icon: '📈' },
  { value: 'turnover_reduction', label: '定着率向上・離職率低下', icon: '👥' },
]

export function Step03Goals() {
  const router = useRouter()
  const { answers, updateAnswers, nextStep, prevStep } = useWizardStore()

  const canProceed = answers.primaryGoals.length > 0 && answers.priorityKpi !== null

  const toggleGoal = (value: PrimaryGoal) => {
    const current = answers.primaryGoals
    if (current.includes(value)) {
      updateAnswers({ primaryGoals: current.filter((g) => g !== value) })
    } else {
      updateAnswers({ primaryGoals: [...current, value] })
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-bold text-gray-900">導入目的・期待効果</h1>
        <p className="mt-1 text-sm text-gray-500">導入目的（複数選択可）と達成したいKPIを選択してください</p>
      </div>

      {/* 主目的（複数選択） */}
      <div className="space-y-3">
        <label className="text-sm font-semibold text-gray-700">
          導入の目的 <span className="text-red-500">*</span>
          <span className="ml-2 text-xs font-normal text-gray-400">（複数選択可）</span>
        </label>
        <div className="grid grid-cols-1 gap-2">
          {GOALS.map((item) => (
            <ChoiceCard
              key={item.value}
              label={item.label}
              icon={item.icon}
              selected={answers.primaryGoals.includes(item.value)}
              onClick={() => toggleGoal(item.value)}
            />
          ))}
        </div>
      </div>

      {/* 優先KPI */}
      <div className="space-y-3">
        <label className="text-sm font-semibold text-gray-700">優先KPI <span className="text-red-500">*</span></label>
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

      {/* 目標値 */}
      <div className="space-y-2">
        <label className="text-sm font-semibold text-gray-700">目標値（任意）</label>
        <input
          type="text"
          value={answers.targetValue}
          onChange={(e) => updateAnswers({ targetValue: e.target.value })}
          placeholder="例：研修時間を50%削減、月間問い合わせを100件→20件に"
          className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={() => { prevStep(); router.push('/wizard?step=2') }}>
          ← 戻る
        </Button>
        <Button onClick={() => { nextStep(); router.push('/wizard?step=4') }} disabled={!canProceed} size="lg">
          次へ →
        </Button>
      </div>
    </div>
  )
}
