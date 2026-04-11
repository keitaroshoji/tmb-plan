'use client'

import React from 'react'
import {
  getPlanById,
  getFeatureGroups,
  FEATURE_LABELS,
  FEATURE_DESCRIPTIONS,
  TmbPlanId,
  TmbFeatureId,
} from '@/src/data/tmb-plans'

interface Props {
  contractPlan: string | null
  contractAddons: string[]
}

export function PlanFeatureSection({ contractPlan, contractAddons }: Props) {
  if (!contractPlan) return null

  // 未契約の場合は現エントリープラン相当として表示
  const isUncontracted = contractPlan === 'uncontracted'
  const effectivePlanId = isUncontracted ? 'new_entry' as TmbPlanId : contractPlan as TmbPlanId

  const plan = getPlanById(effectivePlanId)
  if (!plan) return null

  const addons = contractAddons as TmbFeatureId[]
  const { available, optAvailable, optNotAdded, unavailable } = getFeatureGroups(
    effectivePlanId,
    addons
  )

  // 標準搭載（stdのもの）
  const stdFeatures = available.filter((f) => !optAvailable.includes(f))

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      {/* ヘッダー */}
      <div className="mb-5">
        <h2 className="text-base font-bold text-gray-900">契約プランと利用可能機能</h2>
        <p className="mt-0.5 text-sm text-gray-500">
          このプランニングは以下の機能構成を前提に作成されています
        </p>
        {/* プランバッジ（左寄せ・機能一覧の直上） */}
        <div className={`mt-4 inline-flex items-center gap-3 rounded-lg px-4 py-2.5 ${
          isUncontracted ? 'bg-gray-400' : plan.isNew ? 'bg-blue-600' : 'bg-gray-700'
        }`}>
          {isUncontracted ? (
            <>
              <span className="text-white font-bold text-sm">未契約</span>
              <span className="text-white/60 text-xs">|</span>
              <span className="text-white/80 text-xs">現エントリープラン相当で提案</span>
            </>
          ) : (
            <>
              <span className="text-white font-bold text-sm">{plan.label}</span>
              <span className="text-white/60 text-xs">|</span>
              <span className="text-white/80 text-xs">基本 {plan.basicIds.toLocaleString()} ID</span>
              <span className="text-white/60 text-xs">|</span>
              <span className="text-white/80 text-xs font-medium">¥{plan.monthlyFee.toLocaleString()}/月</span>
            </>
          )}
        </div>
      </div>

      <div className="space-y-5">
        {/* ◎ 標準搭載 */}
        {stdFeatures.length > 0 && (
          <FeatureGroup
            icon="◎"
            label="標準搭載（追加費用なし）"
            badgeClass="bg-green-100 text-green-700"
            headerClass="text-green-800"
            features={stdFeatures}
          />
        )}

        {/* ✓ オプション追加済み */}
        {optAvailable.length > 0 && (
          <FeatureGroup
            icon="✓"
            label="オプション追加済み（利用可能）"
            badgeClass="bg-blue-100 text-blue-700"
            headerClass="text-blue-800"
            features={optAvailable}
          />
        )}

        {/* △ 未追加オプション */}
        {optNotAdded.length > 0 && (
          <FeatureGroup
            icon="△"
            label="未追加オプション（追加契約で利用可）"
            badgeClass="bg-yellow-100 text-yellow-700"
            headerClass="text-yellow-800"
            features={optNotAdded}
            muted
          />
        )}

        {/* ✕ 利用不可 */}
        {unavailable.length > 0 && (
          <FeatureGroup
            icon="✕"
            label="このプランでは利用不可"
            badgeClass="bg-red-100 text-red-600"
            headerClass="text-red-700"
            features={unavailable}
            muted
          />
        )}
      </div>

      {/* 補足 */}
      {optNotAdded.length > 0 && (
        <p className="mt-4 text-xs text-gray-400">
          △ 未追加オプションは今後の追加契約で利用可能になります。運用提案では「オプション追加で〜できます」として参考提示されます。
        </p>
      )}
    </section>
  )
}

// ── サブコンポーネント ──────────────────────────────────────

interface FeatureGroupProps {
  icon: string
  label: string
  badgeClass: string
  headerClass: string
  features: TmbFeatureId[]
  muted?: boolean
}

function FeatureGroup({ icon, label, badgeClass, headerClass, features, muted }: FeatureGroupProps) {
  return (
    <div>
      <p className={`mb-2 text-xs font-semibold ${headerClass}`}>
        {icon} {label}
      </p>
      <div className="flex flex-wrap gap-2">
        {features.map((f) => (
          <div
            key={f}
            className={`group relative cursor-default rounded-full px-3 py-1 text-xs font-medium ${badgeClass} ${muted ? 'opacity-70' : ''}`}
            title={FEATURE_DESCRIPTIONS[f]}
          >
            {FEATURE_LABELS[f]}
            {/* ツールチップ */}
            <span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 hidden w-48 -translate-x-1/2 rounded-lg bg-gray-800 px-2 py-1.5 text-xs text-white shadow-lg group-hover:block leading-snug">
              {FEATURE_DESCRIPTIONS[f]}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
