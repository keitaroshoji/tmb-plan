'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { useWizardStore } from '@/src/store/wizardStore'
import { Button } from '@/src/components/ui/Button'
import { ChoiceCard } from '@/src/components/ui/ChoiceCard'
import { DeviceType, EnvironmentCondition } from '@/src/types/answers'

const DEVICE_TYPES: { value: DeviceType; label: string; icon: string; desc: string }[] = [
  { value: 'smartphone', label: 'スマートフォン', icon: '📱', desc: '移動しながら確認。現場での手軽な参照に最適' },
  { value: 'tablet', label: 'タブレット', icon: '📲', desc: '大画面で見やすく、固定設置にも対応' },
  { value: 'pc', label: 'PC・ノートPC', icon: '💻', desc: 'オフィス・デスクワーク中心の業務に' },
  { value: 'large_monitor', label: '大型モニター', icon: '🖥️', desc: '店舗・現場での常時表示・顧客向け案内' },
]

const ENV_CONDITIONS: { value: EnvironmentCondition; label: string; icon: string; desc: string }[] = [
  { value: 'normal', label: '通常環境', icon: '✅', desc: '特別な条件なし' },
  { value: 'water_humidity', label: '水・湿気への配慮が必要', icon: '💧', desc: '厨房・洗い場・屋外' },
  { value: 'dust_dirt', label: '粉塵・汚れへの配慮が必要', icon: '🌫️', desc: '製造現場・建設・農業' },
  { value: 'hygiene', label: '衛生管理が必要', icon: '🧴', desc: '医療・食品・美容系' },
  { value: 'food_factory', label: '食品工場規格への準拠', icon: '🏭', desc: '金属探知機対応・食品安全基準' },
  { value: 'outdoor_sunlight', label: '屋外・直射日光下での使用', icon: '☀️', desc: '高輝度ディスプレイが必要' },
  { value: 'low_temperature', label: '低温環境での使用', icon: '🧊', desc: '冷蔵・冷凍倉庫など' },
]

export function Step06DeviceEnv() {
  const router = useRouter()
  const { answers, updateAnswers, nextStep, prevStep } = useWizardStore()

  const toggleDevice = (v: DeviceType) => {
    const current = answers.deviceTypes
    updateAnswers({ deviceTypes: current.includes(v) ? current.filter((d) => d !== v) : [...current, v] })
  }

  const toggleEnv = (v: EnvironmentCondition) => {
    if (v === 'normal') {
      updateAnswers({ environmentConditions: ['normal'] })
      return
    }
    const current = answers.environmentConditions.filter((e) => e !== 'normal')
    updateAnswers({
      environmentConditions: current.includes(v) ? current.filter((e) => e !== v) : [...current, v],
    })
  }

  const hasSpecial = answers.environmentConditions.some((e) => e !== 'normal')
  const isOnlyNormal = answers.environmentConditions.length === 1 && answers.environmentConditions[0] === 'normal'
  const canProceed = answers.deviceTypes.length > 0 && answers.environmentConditions.length > 0

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-bold text-gray-900">デバイス・利用環境</h1>
        <p className="mt-1 text-sm text-gray-500">使用するデバイスと利用環境を選択してください</p>
      </div>

      {/* デバイス種別 */}
      <div className="space-y-3">
        <label className="text-sm font-semibold text-gray-700">使用するデバイス <span className="text-red-500">*</span>（複数可）</label>
        <div className="grid grid-cols-1 gap-2">
          {DEVICE_TYPES.map((item) => (
            <ChoiceCard
              key={item.value}
              label={item.label}
              description={item.desc}
              icon={item.icon}
              selected={answers.deviceTypes.includes(item.value)}
              onClick={() => toggleDevice(item.value)}
            />
          ))}
        </div>
      </div>

      {/* 利用環境 */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <label className="text-sm font-semibold text-gray-700">利用環境の条件 <span className="text-red-500">*</span></label>
          {hasSpecial && (
            <span className="text-xs bg-orange-100 text-orange-700 border border-orange-200 rounded-full px-2.5 py-0.5 font-medium">
              複数選択可
            </span>
          )}
        </div>
        <div className="grid grid-cols-1 gap-2">
          {ENV_CONDITIONS.map((item) => {
            const isNormal = item.value === 'normal'
            const disabled = isNormal ? hasSpecial : isOnlyNormal
            return (
              <ChoiceCard
                key={item.value}
                label={item.label}
                description={item.desc}
                icon={item.icon}
                selected={answers.environmentConditions.includes(item.value)}
                onClick={() => toggleEnv(item.value)}
                disabled={disabled}
              />
            )
          })}
        </div>
        {hasSpecial && (
          <p className="text-xs text-orange-600 flex items-center gap-1.5">
            <span>⚠️</span>
            特別な環境条件が選択されています。デバイスの推奨プランに、ケース・フィルム等の特別対応品の示唆が追加されます。
          </p>
        )}
      </div>

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={() => { prevStep(); router.push('/wizard?step=6') }}>
          ← 戻る
        </Button>
        <Button onClick={() => { nextStep(); router.push('/wizard?step=8') }} disabled={!canProceed} size="lg">
          次へ →
        </Button>
      </div>
    </div>
  )
}
