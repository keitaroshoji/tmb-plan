'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { useWizardStore } from '@/src/store/wizardStore'
import { Button } from '@/src/components/ui/Button'
import { ChoiceCard } from '@/src/components/ui/ChoiceCard'
import { OperationalBarrier } from '@/src/types/answers'

const BARRIERS: { value: OperationalBarrier; label: string; icon: string; desc: string }[] = [
  { value: 'no_time_for_creation', label: 'マニュアル作成の時間が工面できない', icon: '⏰', desc: '日常業務が忙しくコンテンツ作成が後回しになる' },
  { value: 'no_team_structure', label: '推進担当者・体制が整っていない', icon: '👥', desc: '専任者がおらず、誰が推進するか不明確' },
  { value: 'low_it_literacy', label: '現場スタッフのITリテラシーが低い', icon: '📱', desc: 'スマホ・アプリ操作に不慣れなスタッフが多い' },
  { value: 'hard_to_involve', label: '経営層・現場の巻き込みが難しい', icon: '🤝', desc: '導入への理解・協力を得るのが困難' },
  { value: 'migration_burden', label: '既存マニュアル（紙・Excel）の移行が膨大', icon: '📦', desc: '大量の既存資料のデジタル化が課題' },
  { value: 'no_creation_knowhow', label: 'マニュアル作成のノウハウがない', icon: '🔧', desc: '何をどう書けばいいか分からない' },
  { value: 'maintenance_concern', label: '継続的な更新・メンテナンスが続かない', icon: '🔄', desc: '作っても更新されず陳腐化してしまう懸念' },
  { value: 'low_adoption_concern', label: '利用促進・定着が見込めない', icon: '📉', desc: '作っても現場で使われないかもしれない' },
]

export function Step04Barriers() {
  const router = useRouter()
  const { answers, updateAnswers, nextStep, prevStep } = useWizardStore()

  const toggle = (v: OperationalBarrier) => {
    const current = answers.operationalBarriers
    updateAnswers({
      operationalBarriers: current.includes(v) ? current.filter((b) => b !== v) : [...current, v],
    })
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-bold text-gray-900">運用課題</h1>
        <p className="mt-1 text-sm text-gray-500">
          プロジェクト推進上の障壁を選択してください。これらへの対処策を運用プランに盛り込みます。（任意・複数可）
        </p>
      </div>

      <div className="grid grid-cols-1 gap-2">
        {BARRIERS.map((item) => (
          <ChoiceCard
            key={item.value}
            label={item.label}
            description={item.desc}
            icon={item.icon}
            selected={answers.operationalBarriers.includes(item.value)}
            onClick={() => toggle(item.value)}
          />
        ))}
      </div>

      {answers.operationalBarriers.length > 0 && (
        <p className="text-xs text-blue-600">{answers.operationalBarriers.length}件選択中</p>
      )}

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={() => { prevStep(); router.push('/wizard?step=4') }}>
          ← 戻る
        </Button>
        <Button onClick={() => { nextStep(); router.push('/wizard?step=6') }} size="lg">
          次へ →（スキップ可）
        </Button>
      </div>
    </div>
  )
}
