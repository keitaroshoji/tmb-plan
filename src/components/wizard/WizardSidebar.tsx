'use client'

import React from 'react'
import { useWizardStore } from '@/src/store/wizardStore'
import {
  INDUSTRY_LABELS, COMPANY_SIZE_LABELS, CHALLENGE_LABELS,
  GOAL_LABELS, KPI_LABELS,
} from '@/src/data/labels'
import { getPlanById, TmbPlanId } from '@/src/data/tmb-plans'

function SidebarRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] text-gray-400 uppercase tracking-wide">{label}</span>
      <span className="text-xs text-gray-700 font-medium leading-snug">{value}</span>
    </div>
  )
}

function SidebarSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2.5">
      <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest border-b border-gray-100 pb-1">
        {title}
      </p>
      {children}
    </div>
  )
}

function TagChips({ items }: { items: string[] }) {
  if (items.length === 0) return <span className="text-xs text-gray-300">—</span>
  return (
    <div className="flex flex-wrap gap-1">
      {items.map((item, i) => (
        <span key={i} className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] text-blue-600 font-medium">
          {item}
        </span>
      ))}
    </div>
  )
}

export function WizardSidebar() {
  const { answers, currentStep } = useWizardStore()

  const industryLabel = answers.industry ? (INDUSTRY_LABELS[answers.industry] ?? answers.industry) : null
  const sizeLabel = answers.companySize ? COMPANY_SIZE_LABELS[answers.companySize] : null

  const isUncontracted = answers.contractPlan === 'uncontracted'
  const contractPlanDef = answers.contractPlan && !isUncontracted
    ? getPlanById(answers.contractPlan as TmbPlanId)
    : null
  const planLabel = isUncontracted ? '未契約' : contractPlanDef ? contractPlanDef.label : null

  const challengeLabels = answers.challenges.map((c) => CHALLENGE_LABELS[c] ?? c)
  const goalLabels = answers.primaryGoals.map((g) => GOAL_LABELS[g] ?? g)
  const kpiLabel = answers.priorityKpi ? (KPI_LABELS[answers.priorityKpi] ?? answers.priorityKpi) : null

  // 何も入力がなければサイドバー自体を非表示
  const hasAnyInput = answers.companyName || answers.industry || answers.companySize

  if (!hasAnyInput) {
    return (
      <aside className="hidden xl:block w-64 shrink-0 self-start sticky top-[80px]">
        <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-6 text-center">
          <p className="text-xs text-gray-400">入力内容がここに表示されます</p>
        </div>
      </aside>
    )
  }

  return (
    <aside className="hidden xl:block w-64 shrink-0 self-start sticky top-[80px]">
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm px-4 py-5 space-y-5">
        <p className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
          <span className="w-4 h-4 rounded bg-blue-600 flex items-center justify-center text-white text-[9px] font-bold shrink-0">T</span>
          入力サマリー
        </p>

        {/* 企業情報（step1以降） */}
        <SidebarSection title="企業情報">
          {answers.companyName && (
            <SidebarRow label="企業名" value={answers.companyName} />
          )}
          {industryLabel && (
            <SidebarRow label="業種" value={industryLabel} />
          )}
          {sizeLabel && (
            <SidebarRow label="規模" value={sizeLabel} />
          )}
          {answers.locationCount > 0 && (
            <SidebarRow label="拠点数" value={`${answers.locationCount} 拠点`} />
          )}
        </SidebarSection>

        {/* 契約プラン（step2以降） */}
        {currentStep >= 2 && planLabel && (
          <SidebarSection title="契約プラン">
            <SidebarRow
              label="プラン"
              value={
                <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                  isUncontracted
                    ? 'bg-gray-100 text-gray-500'
                    : contractPlanDef?.isNew
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-gray-100 text-gray-600'
                }`}>
                  🔧 {planLabel}
                </span>
              }
            />
          </SidebarSection>
        )}

        {/* 課題・目標（step3以降） */}
        {currentStep >= 3 && (challengeLabels.length > 0 || goalLabels.length > 0 || kpiLabel) && (
          <SidebarSection title="課題・目標">
            {challengeLabels.length > 0 && (
              <div className="space-y-1">
                <span className="text-[10px] text-gray-400 uppercase tracking-wide">経営課題</span>
                <TagChips items={challengeLabels} />
              </div>
            )}
            {goalLabels.length > 0 && (
              <div className="space-y-1">
                <span className="text-[10px] text-gray-400 uppercase tracking-wide">導入目的</span>
                <TagChips items={goalLabels} />
              </div>
            )}
            {kpiLabel && (
              <SidebarRow label="優先KPI" value={kpiLabel} />
            )}
          </SidebarSection>
        )}

        {/* 活用シーン（step4以降） */}
        {currentStep >= 4 && answers.useCases && answers.useCases.length > 0 && (
          <SidebarSection title="活用シーン">
            <SidebarRow label="件数" value={`${answers.useCases.length} シーン選択中`} />
          </SidebarSection>
        )}
      </div>
    </aside>
  )
}
