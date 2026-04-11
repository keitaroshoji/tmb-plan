'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { useWizardStore } from '@/src/store/wizardStore'
import { Button } from '@/src/components/ui/Button'
import { ChoiceCard } from '@/src/components/ui/ChoiceCard'
import { Challenge } from '@/src/types/answers'

const CHALLENGES: { value: Challenge; label: string; icon: string; desc: string }[] = [
  { value: 'talent_development', label: '人材育成・研修の効率化', icon: '👨‍🎓', desc: 'OJT時間の削減、育成コストの圧縮' },
  { value: 'standardization', label: '品質・サービスの標準化', icon: '⚖️', desc: '拠点間・スタッフ間のばらつき解消' },
  { value: 'knowledge_transfer', label: '技術・ノウハウの伝承', icon: '🧠', desc: '熟練者の知識を組織資産として残す' },
  { value: 'manual_creation', label: 'マニュアル作成・更新の負担', icon: '📝', desc: '紙・Excel管理からの脱却' },
  { value: 'foreign_staff', label: '外国人・多様な人材への教育', icon: '🌍', desc: '言語・リテラシーの壁を越えた教育' },
  { value: 'cost_reduction', label: 'コスト削減', icon: '💰', desc: '研修費・印刷費・移動費の削減' },
  { value: 'iso_compliance', label: 'ISO・法令対応', icon: '📋', desc: '品質管理文書の整備・更新管理' },
  { value: 'multi_store', label: '多店舗・多拠点への展開', icon: '🏢', desc: '全拠点への均一な情報共有' },
  { value: 'remote_management', label: '遠隔管理・モニタリング', icon: '📡', desc: '現場の状況を本部からリアルタイム把握' },
  { value: 'security', label: 'セキュリティ強化', icon: '🔒', desc: '情報漏洩防止、端末管理' },
]

export function Step02Challenges() {
  const router = useRouter()
  const { answers, updateAnswers, nextStep, prevStep } = useWizardStore()

  const toggle = (v: Challenge) => {
    const current = answers.challenges
    updateAnswers({
      challenges: current.includes(v) ? current.filter((c) => c !== v) : [...current, v],
    })
  }

  const canProceed = answers.challenges.length > 0

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-bold text-gray-900">経営課題</h1>
        <p className="mt-1 text-sm text-gray-500">現在抱えている課題をすべて選択してください（複数可）</p>
      </div>

      <div className="grid grid-cols-1 gap-2">
        {CHALLENGES.map((item) => (
          <ChoiceCard
            key={item.value}
            label={item.label}
            description={item.desc}
            icon={item.icon}
            selected={answers.challenges.includes(item.value)}
            onClick={() => toggle(item.value)}
            variant="checkbox"
          />
        ))}
      </div>

      {answers.challenges.length > 0 && (
        <p className="text-xs text-blue-600">{answers.challenges.length}件選択中</p>
      )}

      {/* 自由記入欄 */}
      <div className="space-y-2">
        <label className="text-sm font-semibold text-gray-700">
          その他・補足
          <span className="ml-2 text-xs font-normal text-gray-400">（任意）</span>
        </label>
        <textarea
          value={answers.challengeNote ?? ''}
          onChange={(e) => updateAnswers({ challengeNote: e.target.value })}
          placeholder="上記に当てはまらない課題や、詳細な状況を自由にご記入ください"
          rows={3}
          className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
        />
      </div>

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={() => { prevStep(); router.push('/wizard?step=1') }}>
          ← 戻る
        </Button>
        <Button onClick={() => { nextStep(); router.push('/wizard?step=3') }} disabled={!canProceed} size="lg">
          次へ →
        </Button>
      </div>
    </div>
  )
}
