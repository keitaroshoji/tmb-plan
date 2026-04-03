'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { useWizardStore } from '@/src/store/wizardStore'
import { Button } from '@/src/components/ui/Button'
import { ChoiceCard } from '@/src/components/ui/ChoiceCard'
import { UsageStatus } from '@/src/types/answers'

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

export function StepCurrentUsage() {
  const router = useRouter()
  const { answers, updateAnswers, nextStep, prevStep } = useWizardStore()

  const handleNext = () => {
    nextStep()
    router.push('/wizard?step=5')
  }

  const handlePrev = () => {
    prevStep()
    router.push('/wizard?step=3')
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-bold text-gray-900">現在の利用状況</h1>
        <p className="mt-1 text-sm text-gray-500">
          Teachme Bizの現在の活用状況を教えてください。より的確な用途提案とロードマップを生成します。
        </p>
      </div>

      {/* 利用状況選択 */}
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
