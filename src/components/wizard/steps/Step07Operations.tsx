'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useWizardStore } from '@/src/store/wizardStore'
import { Button } from '@/src/components/ui/Button'
import { ChoiceCard } from '@/src/components/ui/ChoiceCard'
import { OperationStyle, DeviceType } from '@/src/types/answers'

const OPERATION_STYLES: {
  value: OperationStyle
  label: string
  icon: string
  desc: string
  ratio: string
}[] = [
  { value: 'group_training', label: '集合研修タイプ', icon: '🎓', desc: '研修時にまとめて使用。普段は共有端末', ratio: '10人に1台程度' },
  { value: 'group_shared', label: 'グループ共有タイプ', icon: '👥', desc: 'チーム内で共有。必要時に使う', ratio: '3人に1台程度' },
  { value: 'workplace_unit', label: '職場単位タイプ', icon: '🏢', desc: '拠点・部門ごとに固定配置', ratio: '拠点ごとに2〜3台' },
  { value: 'individual', label: '個人割り振りタイプ', icon: '👤', desc: '1人1台。自分のタイミングで参照', ratio: '1人1台' },
  { value: 'byod', label: 'BYODタイプ', icon: '📱', desc: '個人のスマホを活用。追加端末コストなし', ratio: '追加端末不要' },
]

const DEVICE_LABELS: Record<DeviceType, string> = {
  smartphone: 'スマートフォン',
  tablet: 'タブレット',
  pc: 'PC',
  large_monitor: '大型モニター',
}

export function Step07Operations() {
  const router = useRouter()
  const { answers, updateAnswers, completeWizard, prevStep, setGenerating } = useWizardStore()
  const [staffInput, setStaffInput] = useState(String(answers.staffPerLocation ?? 1))

  const handleSubmit = async () => {
    completeWizard()
    setGenerating(true)
    router.push('/result')
  }

  const canProceed = answers.operationStyle !== null && answers.staffPerLocation > 0

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-bold text-gray-900">運用スタイル・現状確認</h1>
        <p className="mt-1 text-sm text-gray-500">デバイスの運用方法と現在の保有状況を入力してください</p>
      </div>

      {/* 運用スタイル */}
      <div className="space-y-3">
        <label className="text-sm font-semibold text-gray-700">運用スタイル <span className="text-red-500">*</span></label>
        <div className="grid grid-cols-1 gap-2">
          {OPERATION_STYLES.map((item) => (
            <ChoiceCard
              key={item.value}
              label={item.label}
              description={`${item.desc}（目安: ${item.ratio}）`}
              icon={item.icon}
              selected={answers.operationStyle === item.value}
              onClick={() => updateAnswers({ operationStyle: item.value })}
            />
          ))}
        </div>
      </div>

      {/* スタッフ数 */}
      <div className="space-y-2">
        <label className="text-sm font-semibold text-gray-700">拠点あたりのスタッフ数 <span className="text-red-500">*</span></label>
        <div className="flex items-center gap-3">
          <input
            type="text"
            inputMode="numeric"
            value={staffInput}
            onChange={(e) => {
              const raw = e.target.value.replace(/[^0-9]/g, '')
              setStaffInput(raw)
              const val = parseInt(raw, 10)
              if (!isNaN(val) && val >= 1) updateAnswers({ staffPerLocation: val })
            }}
            onBlur={() => {
              const val = parseInt(staffInput, 10)
              const fixed = isNaN(val) || val < 1 ? 1 : val
              setStaffInput(String(fixed))
              updateAnswers({ staffPerLocation: fixed })
            }}
            className="w-28 rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-500">名</span>
        </div>
      </div>

      {/* 現在の端末保有数（選択したデバイス種別ごと） */}
      {answers.deviceTypes.length > 0 && (
        <div className="space-y-3">
          <label className="text-sm font-semibold text-gray-700">現在の端末保有数（任意）</label>
          <div className="rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs text-gray-500 font-medium">デバイス</th>
                  <th className="px-4 py-2 text-center text-xs text-gray-500 font-medium">店舗（1拠点あたり）</th>
                  <th className="px-4 py-2 text-center text-xs text-gray-500 font-medium">本部・本社</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {answers.deviceTypes.map((dtype) => (
                  <tr key={dtype}>
                    <td className="px-4 py-2 font-medium text-gray-700">{DEVICE_LABELS[dtype]}</td>
                    <td className="px-4 py-2 text-center">
                      <input
                        type="number"
                        min={0}
                        value={answers.currentDevicesByType[dtype] ?? 0}
                        onChange={(e) =>
                          updateAnswers({
                            currentDevicesByType: {
                              ...answers.currentDevicesByType,
                              [dtype]: parseInt(e.target.value) || 0,
                            },
                          })
                        }
                        className="w-16 rounded border border-gray-300 px-2 py-1 text-center text-sm focus:border-blue-500 focus:outline-none"
                      />
                    </td>
                    <td className="px-4 py-2 text-center">
                      <input
                        type="number"
                        min={0}
                        value={answers.headquartersDevicesByType[dtype] ?? 0}
                        onChange={(e) =>
                          updateAnswers({
                            headquartersDevicesByType: {
                              ...answers.headquartersDevicesByType,
                              [dtype]: parseInt(e.target.value) || 0,
                            },
                          })
                        }
                        className="w-16 rounded border border-gray-300 px-2 py-1 text-center text-sm focus:border-blue-500 focus:outline-none"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={() => { prevStep(); router.push('/wizard?step=5') }}>
          ← 戻る
        </Button>
        <Button onClick={handleSubmit} disabled={!canProceed} size="lg" className="bg-green-600 hover:bg-green-700">
          プランを生成する ✨
        </Button>
      </div>
    </div>
  )
}
