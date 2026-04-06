'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { useWizardStore } from '@/src/store/wizardStore'
import { Button } from '@/src/components/ui/Button'
import { ChoiceCard } from '@/src/components/ui/ChoiceCard'
import { UseCase, ManualType, ManualQuality } from '@/src/types/answers'

const USE_CASES: { value: UseCase; label: string; icon: string; desc: string }[] = [
  { value: 'manual_viewing', label: 'マニュアル・手順書の閲覧', icon: '📖', desc: '現場でスマホやタブレットから確認' },
  { value: 'video_shooting', label: '動画マニュアルの撮影・作成', icon: '🎥', desc: '実作業を動画で記録してマニュアル化' },
  { value: 'onboarding', label: '新人・異動者のオンボーディング', icon: '🎓', desc: '入社・異動時の教育・自己学習' },
  { value: 'pos_business_app', label: 'POS・業務アプリとの併用', icon: '💻', desc: '業務システム操作と並行して参照' },
  { value: 'customer_display', label: '顧客向け情報表示', icon: '📺', desc: 'メニュー・サービス案内を顧客に表示' },
  { value: 'team_communication', label: 'チームコミュニケーション', icon: '💬', desc: '連絡・申し送り・ナレッジ共有' },
  { value: 'skill_assessment', label: 'スキル評価・テスト', icon: '✅', desc: '習熟度確認・資格試験対策' },
]

const MANUAL_TYPES: { value: ManualType; label: string; icon: string }[] = [
  { value: 'work_procedure', label: '作業・業務手順', icon: '🔧' },
  { value: 'customer_service', label: '接客・サービスロール', icon: '🤝' },
  { value: 'system_operation', label: 'システム・機器操作', icon: '💻' },
  { value: 'safety_rules', label: '安全・衛生規程', icon: '⚠️' },
  { value: 'quality_check', label: '品質チェック・検査', icon: '🔍' },
  { value: 'other', label: 'その他', icon: '📋' },
]

export function Step05UseCases() {
  const router = useRouter()
  const { answers, updateAnswers, nextStep, prevStep } = useWizardStore()

  const toggleUseCase = (v: UseCase) => {
    const current = answers.useCases
    updateAnswers({ useCases: current.includes(v) ? current.filter((u) => u !== v) : [...current, v] })
  }

  const toggleManualType = (v: ManualType) => {
    const current = answers.manualTypes
    updateAnswers({ manualTypes: current.includes(v) ? current.filter((m) => m !== v) : [...current, v] })
  }

  const canProceed = answers.useCases.length > 0 && answers.manualTypes.length > 0 && answers.manualQuality !== null

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-bold text-gray-900">活用シーン・マニュアル</h1>
        <p className="mt-1 text-sm text-gray-500">Teachme Bizの主な活用方法を選択してください</p>
      </div>

      {/* 活用シーン */}
      <div className="space-y-3">
        <label className="text-sm font-semibold text-gray-700">活用シーン <span className="text-red-500">*</span>（複数可）</label>
        <div className="grid grid-cols-1 gap-2">
          {USE_CASES.map((item) => (
            <ChoiceCard
              key={item.value}
              label={item.label}
              description={item.desc}
              icon={item.icon}
              selected={answers.useCases.includes(item.value)}
              onClick={() => toggleUseCase(item.value)}
              variant="checkbox"
            />
          ))}
        </div>
      </div>

      {/* マニュアル種類 */}
      <div className="space-y-3">
        <label className="text-sm font-semibold text-gray-700">マニュアルの種類 <span className="text-red-500">*</span>（複数可）</label>
        <div className="grid grid-cols-2 gap-2">
          {MANUAL_TYPES.map((item) => (
            <ChoiceCard
              key={item.value}
              label={item.label}
              icon={item.icon}
              selected={answers.manualTypes.includes(item.value)}
              onClick={() => toggleManualType(item.value)}
              variant="checkbox"
            />
          ))}
        </div>
      </div>

      {/* マニュアル品質 */}
      <div className="space-y-3">
        <label className="text-sm font-semibold text-gray-700">マニュアル作成の方針 <span className="text-red-500">*</span></label>
        <div className="grid grid-cols-2 gap-3">
          <ChoiceCard
            label="かんたん・手軽に"
            description="スマホで撮影してすぐ共有。まず作ることを優先"
            icon="📸"
            selected={answers.manualQuality === 'casual'}
            onClick={() => updateAnswers({ manualQuality: 'casual' })}
          />
          <ChoiceCard
            label="しっかり・高品質に"
            description="動画・ナレーション・テロップを活用。品質重視"
            icon="🎬"
            selected={answers.manualQuality === 'rich'}
            onClick={() => updateAnswers({ manualQuality: 'rich' })}
          />
        </div>
      </div>

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={() => { prevStep(); router.push('/wizard?step=5') }}>
          ← 戻る
        </Button>
        <Button onClick={() => { nextStep(); router.push('/wizard?step=7') }} disabled={!canProceed} size="lg">
          次へ →
        </Button>
      </div>
    </div>
  )
}
