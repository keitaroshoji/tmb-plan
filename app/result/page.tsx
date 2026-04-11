'use client'

import React, { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useWizardStore } from '@/src/store/wizardStore'
import { matchCaseStudies, matchCaseHints, CaseHint } from '@/src/lib/case-matcher'
import { matchInsights } from '@/src/lib/insight-matcher'
import { recommendDevicePlan, DevicePlan } from '@/src/lib/device-recommender'
import { CaseStudy, GeneratedPlan, ACTIVITY_CATEGORIES, BarrierAction, Phase, UsageScenario, FeatureStory, ManualUsagePair } from '@/src/types/plan'
import { TmbWizardAnswers } from '@/src/types/answers'
import { Button } from '@/src/components/ui/Button'
import {
  INDUSTRY_LABELS, SUB_INDUSTRY_LABELS, COMPANY_SIZE_LABELS, CHALLENGE_LABELS,
  GOAL_LABELS, KPI_LABELS, USAGE_STATUS_LABELS, BARRIER_LABELS,
  USE_CASE_LABELS, MANUAL_TYPE_LABELS, MANUAL_QUALITY_LABELS,
  ENV_CONDITION_LABELS, OPERATION_STYLE_LABELS,
} from '@/src/data/labels'
import { GmpWarningBanner, SectionHeading, SectionSkeleton, SectionFailed } from '@/src/components/result/shared'
import { PlanFeatureSection } from '@/src/components/result/PlanFeatureSection'
import { getPlanById, TmbPlanId } from '@/src/data/tmb-plans'
import { getDepartmentsForIndustry } from '@/src/data/industry-departments'
import { isGmpRelevant } from '@/src/lib/gmp-detector'
import { matchResources } from '@/src/lib/resource-matcher'
import { HelpfulResource } from '@/src/data/helpful-resources'

// ==================== 型ガード ====================

function isBarrierAction(v: unknown): v is BarrierAction {
  return (
    typeof v === 'object' && v !== null &&
    'challenge' in v && typeof (v as Record<string, unknown>).challenge === 'string' &&
    'counter' in v && typeof (v as Record<string, unknown>).counter === 'string'
  )
}

function normalizeBarrierActions(raw: unknown[]): BarrierAction[] {
  return raw.map((v) =>
    isBarrierAction(v) ? v : { challenge: String(v), counter: '' }
  )
}

// ==================== フェーズカラー ====================

const PHASE_COLORS = [
  { bg: '#2563EB', light: '#EFF6FF', text: '#1D4ED8' },
  { bg: '#0284C7', light: '#F0F9FF', text: '#0369A1' },
  { bg: '#1D4ED8', light: '#DBEAFE', text: '#1E40AF' },
  { bg: '#D97706', light: '#FFFBEB', text: '#B45309' },
]

// ==================== カレンダー日付計算 ====================

function addMonthsToDate(startYYYYMM: string, offsetMonths: number): string {
  if (!startYYYYMM || !/^\d{4}-\d{2}$/.test(startYYYYMM)) return ''
  const [yearStr, monthStr] = startYYYYMM.split('-')
  const year = parseInt(yearStr, 10)
  const month = parseInt(monthStr, 10)
  if (month < 1 || month > 12) return ''
  const totalMonths = year * 12 + month - 1 + offsetMonths
  const y = Math.floor(totalMonths / 12)
  const m = (totalMonths % 12) + 1
  return `${y}年${m}月`
}

function phaseCalendarRange(startYYYYMM: string, period: string): string {
  if (!startYYYYMM) return ''
  const nums = period.match(/\d+/g)?.map(Number) ?? []
  if (nums.length >= 2) {
    const from = addMonthsToDate(startYYYYMM, nums[0] - 1)
    const to   = addMonthsToDate(startYYYYMM, nums[1] - 1)
    return `${from}〜${to}`
  }
  if (nums.length === 1) return addMonthsToDate(startYYYYMM, nums[0] - 1)
  return ''
}

// ==================== 矢羽型ヘッダー ====================

function ChevronHeader({ label, period, calendarPeriod, index }: {
  label: string; period: string; calendarPeriod?: string; index: number; total: number
}) {
  const color = PHASE_COLORS[index % PHASE_COLORS.length]
  const A = 18
  const clipPath = `polygon(0 0, calc(100% - ${A}px) 0, 100% 50%, calc(100% - ${A}px) 100%, 0 100%)`

  return (
    <div style={{ background: color.bg, clipPath }} className="flex flex-col items-center justify-center py-3 px-6 h-[84px]">
      <span className="text-white font-bold text-sm leading-tight text-center">{label}</span>
      <span className="text-white/80 text-xs mt-0.5">{period}</span>
      {/* calendarPeriod が無い場合も同じ行数を確保して高さを統一する */}
      <span className="text-white/90 text-[11px] font-semibold mt-0.5 tracking-wide">{calendarPeriod ?? '\u00A0'}</span>
    </div>
  )
}

// ==================== カテゴリアイコン ====================

const CAT_ICONS: Record<string, string> = {
  初期設定: '⚙️', マニュアル作成: '📝', マニュアル活用: '📖', 効果測定: '📊', その他: '💬',
}

// ==================== デバイス配置ビジュアル ====================

const DEVICE_ICONS: Record<string, string> = {
  smartphone: '📱', tablet: '📟', pc: '💻', large_monitor: '🖥️',
}
const DEVICE_LABELS: Record<string, string> = {
  smartphone: 'スマートフォン', tablet: 'タブレット', pc: 'PC', large_monitor: '大型モニター',
}

// ラベルマップは src/data/labels.ts から import（上部）

// ==================== 前提情報コンポーネント ====================

function PremiseRow({ label, value }: { label: string; value: React.ReactNode }) {
  if (!value || (Array.isArray(value) && value.length === 0)) return null
  return (
    <div className="flex gap-3 py-2 border-b border-gray-100 last:border-0">
      <span className="text-xs font-semibold text-gray-500 shrink-0 w-36 pt-0.5">{label}</span>
      <div className="text-sm text-gray-800 leading-relaxed">{value}</div>
    </div>
  )
}

function TagList({ items }: { items: string[] }) {
  if (items.length === 0) return null
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item, i) => (
        <span key={i} className="inline-block bg-blue-50 border border-blue-200 text-blue-700 text-xs font-medium rounded-full px-2.5 py-0.5">{item}</span>
      ))}
    </div>
  )
}

function PremiseSection({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-white border border-gray-200 overflow-hidden shadow-sm">
      <div className="bg-gray-50 border-b border-gray-200 px-5 py-3 flex items-center gap-2">
        <span className="text-base">{icon}</span>
        <span className="text-sm font-bold text-gray-700">{title}</span>
      </div>
      <div className="px-5 py-2">{children}</div>
    </div>
  )
}

function PremiseInfo({ answers }: { answers: TmbWizardAnswers }) {
  const industryLabel = answers.industry ? (INDUSTRY_LABELS[answers.industry] ?? answers.industry) : null
  const subLabel = answers.subIndustry ? (SUB_INDUSTRY_LABELS[answers.subIndustry] ?? answers.subIndustry) : null
  const industryStr = [industryLabel, subLabel].filter(Boolean).join(' › ')

  return (
    <div className="grid grid-cols-2 gap-5">
      {/* 企業情報 */}
      <PremiseSection title="企業・組織情報" icon="🏢">
        <PremiseRow label="企業名" value={answers.companyName || '—'} />
        <PremiseRow label="業種" value={industryStr || '—'} />
        <PremiseRow label="企業規模" value={answers.companySize ? COMPANY_SIZE_LABELS[answers.companySize] : '—'} />
        <PremiseRow label="拠点数" value={`${answers.locationCount}拠点`} />
        <PremiseRow label="FC・フランチャイズ" value={answers.isFranchise === true ? 'あり' : answers.isFranchise === false ? 'なし' : '—'} />
        {answers.industry === 'manufacturing' && answers.manufacturingRegulations.length > 0 && (
          <PremiseRow label="適用規格" value={
            <TagList items={answers.manufacturingRegulations.map((r) => {
              const labels: Record<string, string> = {
                iso9001: 'ISO 9001', iatf16949: 'IATF 16949',
                gmp_qms: 'GMP / QMS省令', iso14001: 'ISO 14001', other: 'その他規格',
              }
              return labels[r] ?? r
            })} />
          } />
        )}
        {(answers.targetDepartments ?? []).length > 0 && (
          <PremiseRow label="活用対象部門" value={
            <TagList items={
              getDepartmentsForIndustry(answers.industry)
                .filter((d) => (answers.targetDepartments ?? []).includes(d.value))
                .map((d) => d.label)
            } />
          } />
        )}
        {answers.departmentNote && <PremiseRow label="対象部門・事業部（備考）" value={answers.departmentNote} />}
        {answers.projectStartDate && <PremiseRow label="プロジェクト開始" value={addMonthsToDate(answers.projectStartDate, 0)} />}
      </PremiseSection>

      {/* 経営課題 */}
      <PremiseSection title="経営課題" icon="⚠️">
        <div className="py-2">
          <TagList items={answers.challenges.map((c) => CHALLENGE_LABELS[c] ?? c)} />
        </div>
      </PremiseSection>

      {/* 導入目的・期待効果 */}
      <PremiseSection title="導入目的・期待効果" icon="🎯">
        <PremiseRow label="導入目的" value={<TagList items={answers.primaryGoals.map((g) => GOAL_LABELS[g] ?? g)} />} />
        <PremiseRow label="優先KPI" value={answers.priorityKpi ? KPI_LABELS[answers.priorityKpi] : '—'} />
        {answers.targetValue && <PremiseRow label="目標値" value={answers.targetValue} />}
        <PremiseRow label="現在の利用状況" value={answers.usageStatus ? USAGE_STATUS_LABELS[answers.usageStatus] : '—'} />
        {answers.currentUseCases && <PremiseRow label="現在の用途" value={answers.currentUseCases} />}
      </PremiseSection>

      {/* 運用障壁 */}
      <PremiseSection title="推進上の障壁" icon="🚧">
        <div className="py-2">
          <TagList items={answers.operationalBarriers.map((b) => BARRIER_LABELS[b] ?? b)} />
        </div>
      </PremiseSection>

      {/* 活用シーン・マニュアル */}
      <PremiseSection title="活用シーン・マニュアル" icon="📋">
        <PremiseRow label="活用シーン" value={<TagList items={answers.useCases.map((u) => USE_CASE_LABELS[u] ?? u)} />} />
        <PremiseRow label="マニュアル種類" value={<TagList items={answers.manualTypes.map((m) => MANUAL_TYPE_LABELS[m] ?? m)} />} />
        <PremiseRow label="作成方針" value={answers.manualQuality ? MANUAL_QUALITY_LABELS[answers.manualQuality] : '—'} />
      </PremiseSection>

      {/* デバイス・運用スタイル */}
      <PremiseSection title="デバイス・運用スタイル" icon="📱">
        <PremiseRow label="使用デバイス" value={<TagList items={answers.deviceTypes.map((d) => DEVICE_LABELS[d] ?? d)} />} />
        <PremiseRow label="利用環境" value={<TagList items={answers.environmentConditions.map((e) => ENV_CONDITION_LABELS[e] ?? e)} />} />
        <PremiseRow label="運用スタイル" value={answers.operationStyle ? OPERATION_STYLE_LABELS[answers.operationStyle] : '—'} />
        <PremiseRow label="スタッフ数/拠点" value={`${answers.staffPerLocation}名`} />
      </PremiseSection>
    </div>
  )
}

// 保有デバイスアイコン群（青）
function OwnedDeviceIcons({ type, count }: { type: string; count: number }) {
  const icon = DEVICE_ICONS[type] ?? '📦'
  const label = DEVICE_LABELS[type] ?? type
  const MAX = 8
  const shown = Math.min(count, MAX)
  const overflow = count > MAX ? count - MAX : 0
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {Array.from({ length: shown }).map((_, i) => (
        <span key={i} title={label}
          className="w-8 h-8 rounded-lg bg-blue-100 border border-blue-300 flex items-center justify-center text-base shadow-sm">
          {icon}
        </span>
      ))}
      {overflow > 0 && (
        <span className="text-xs font-bold text-blue-600 self-end">+{overflow}</span>
      )}
    </div>
  )
}

// 不足デバイスアイコン群（赤破線）
function ShortageDeviceIcons({ count, icon }: { count: number; icon: string }) {
  const MAX = 8
  const shown = Math.min(count, MAX)
  const overflow = count > MAX ? count - MAX : 0
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {Array.from({ length: shown }).map((_, i) => (
        <span key={i}
          className="w-8 h-8 rounded-lg border-2 border-dashed border-orange-400 bg-orange-50 flex items-center justify-center text-base opacity-60">
          {icon}
        </span>
      ))}
      {overflow > 0 && (
        <span className="text-xs font-bold text-orange-600 self-end">+{overflow}</span>
      )}
    </div>
  )
}

// ==================== デバイス整備状況アセスメント ====================

type ReadinessLevel = 'ok' | 'byod' | 'minor' | 'moderate' | 'critical' | 'unknown'

interface ReadinessInfo {
  level: ReadinessLevel
  icon: string
  status: string
  title: string
  body: string
  action: string
  bg: string
  border: string
  txt: string
  badgeBg: string
  badgeTxt: string
}

function getDeviceReadiness(devicePlan: DevicePlan): ReadinessInfo {
  const { idealDeviceCount: ideal, currentDeviceCount: current, shortfallCount: shortfall, operationStyleLabel } = devicePlan
  const styleShort = operationStyleLabel.replace(/（.*?）/, '').trim()

  if (ideal === 0) {
    return {
      level: 'byod', icon: '✅', status: '運用環境：問題なし',
      title: 'BYODタイプ — 追加端末不要',
      body: '個人端末（スマートフォン等）を活用する運用スタイルのため、デバイス調達コストは発生しません。',
      action: 'スタッフへのアプリインストール案内・ログイン付与を1ヶ月目の初期アクションに組み込んでください。',
      bg: 'bg-blue-50', border: 'border-blue-200', txt: 'text-blue-800',
      badgeBg: 'bg-blue-100', badgeTxt: 'text-blue-700',
    }
  }
  if (current === 0 && shortfall > 0) {
    return {
      level: 'unknown', icon: '❓', status: '端末情報未入力 — 評価不可',
      title: '現在の保有台数が未確認です',
      body: '端末保有数が入力されていないため、運用環境の充足状況を評価できません。実際の保有数を確認してください。',
      action: '保有台数を確認した上でウィザードの「運用スタイル・現状確認」から再入力すると正確な評価が行えます。',
      bg: 'bg-gray-50', border: 'border-gray-200', txt: 'text-gray-700',
      badgeBg: 'bg-gray-200', badgeTxt: 'text-gray-600',
    }
  }
  if (shortfall === 0) {
    return {
      level: 'ok', icon: '✅', status: '運用環境：充足',
      title: `端末は十分に揃っています（${current}台）`,
      body: `現在の台数で「${styleShort}」の計画通りの運用を開始できます。追加調達なしで全拠点への展開が可能です。`,
      action: '端末の初期設定・アプリ配布・ログイン付与を1ヶ月目のアクションに確実に組み込んでください。',
      bg: 'bg-blue-50', border: 'border-blue-200', txt: 'text-blue-800',
      badgeBg: 'bg-blue-100', badgeTxt: 'text-blue-700',
    }
  }
  const ratio = Math.round((shortfall / ideal) * 100)
  if (shortfall <= Math.ceil(ideal * 0.3)) {
    return {
      level: 'minor', icon: '⚠️', status: '軽微な不足あり',
      title: `${shortfall}台不足 — 優先拠点から先行導入が可能`,
      body: `不足は理想台数の${ratio}%程度です。現状の${current}台を使って主要拠点・部門から先行導入し、残りを段階調達するアプローチが現実的です。`,
      action: '保有端末で優先拠点から先行スタートし、不足分の調達・納期を1〜2ヶ月目のアクションに入れることを推奨します。',
      bg: 'bg-amber-50', border: 'border-amber-200', txt: 'text-amber-800',
      badgeBg: 'bg-amber-100', badgeTxt: 'text-amber-700',
    }
  }
  if (shortfall <= Math.ceil(ideal * 0.6)) {
    return {
      level: 'moderate', icon: '⚠️', status: '要対応 — 端末不足が運用に影響',
      title: `${shortfall}台不足（理想の${ratio}%が未充足）`,
      body: `現状の${current}台では「${styleShort}」の全面展開が困難です。運用目標の達成には端末調達が前提条件となり、調達が遅れると事業課題の解決も遅延するリスクがあります。`,
      action: '端末調達計画を1ヶ月目の最優先タスクに設定し、調達完了までは保有端末でのパイロット運用に絞ることを推奨します。',
      bg: 'bg-orange-50', border: 'border-orange-200', txt: 'text-orange-800',
      badgeBg: 'bg-orange-100', badgeTxt: 'text-orange-700',
    }
  }
  return {
    level: 'critical', icon: '❌', status: '要対応 — 計画した運用の開始が困難',
    title: `${shortfall}台不足（現状は理想の${100 - ratio}%にとどまる）`,
    body: `現状${current}台は理想${ideal}台の${100 - ratio}%にすぎません。このままでは「${styleShort}」での本格運用は開始できず、現場でのマニュアル活用が進まないリスクが高く、事業課題の解決が大幅に遅延します。`,
    action: '端末調達を最優先課題として経営層に提案し、調達予算・スケジュールを初月のアクションに確定させることを強く推奨します。',
    bg: 'bg-orange-50', border: 'border-orange-200', txt: 'text-orange-800',
    badgeBg: 'bg-orange-100', badgeTxt: 'text-orange-700',
  }
}

function DeviceVisual({ answers, devicePlan }: {
  answers: TmbWizardAnswers
  devicePlan: DevicePlan
}) {
  const hqDevices = answers.headquartersDevicesByType
  const storeDevices = answers.currentDevicesByType
  const hqTotal = Object.values(hqDevices).reduce<number>((s, v) => s + (v ?? 0), 0)
  const storeTotal = Object.values(storeDevices).reduce<number>((s, v) => s + (v ?? 0), 0)
  const locationCount = answers.locationCount ?? 1
  const staffPerLocation = answers.staffPerLocation ?? 0
  const idealPerLocation = Math.ceil(devicePlan.idealDeviceCount / locationCount)
  const shortagePerLocation = Math.max(0, idealPerLocation - storeTotal)
  const primaryDeviceType = answers.deviceTypes?.[0] ?? 'smartphone'

  // 表示する店舗カード数（最大4枚、残りは省略）
  const shownStores = Math.min(locationCount, 4)
  const hiddenStores = locationCount - shownStores

  return (
    <div className="space-y-8">
      {/* 数値サマリー */}
      <div className="grid grid-cols-3 gap-5">
        {[
          { label: '理想台数', value: `${devicePlan.idealDeviceCount}台`, bg: 'bg-blue-50', border: 'border-blue-200', txt: 'text-blue-700' },
          { label: '現在の台数', value: `${devicePlan.currentDeviceCount}台`, bg: 'bg-gray-50', border: 'border-gray-200', txt: 'text-gray-700' },
          { label: '不足台数', value: `${devicePlan.shortfallCount}台`, bg: 'bg-amber-50', border: 'border-amber-200', txt: 'text-amber-700' },
        ].map((item) => (
          <div key={item.label} className={`rounded-xl ${item.bg} border ${item.border} p-5 text-center`}>
            <p className={`text-xs font-medium ${item.txt}`}>{item.label}</p>
            <p className={`text-4xl font-bold ${item.txt} mt-2`}>{item.value}</p>
          </div>
        ))}
      </div>

      {/* 運用環境整備アセスメント */}
      {(() => {
        const r = getDeviceReadiness(devicePlan)
        return (
          <div className={`rounded-xl border-2 ${r.border} ${r.bg} p-5`}>
            <div className="flex items-center gap-3 mb-3">
              <span className="text-xl">{r.icon}</span>
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${r.badgeBg} ${r.badgeTxt}`}>{r.status}</span>
            </div>
            <p className={`text-sm font-bold ${r.txt} mb-1.5 leading-snug`}>{r.title}</p>
            <p className={`text-sm ${r.txt} leading-relaxed mb-3`}>{r.body}</p>
            <div className={`flex items-start gap-2 rounded-lg bg-white/60 px-3.5 py-2.5 border ${r.border}`}>
              <span className={`text-xs font-bold ${r.badgeTxt} shrink-0 mt-0.5`}>推奨アクション</span>
              <p className={`text-xs ${r.txt} leading-relaxed`}>{r.action}</p>
            </div>
          </div>
        )
      })()}

      {/* 本社→店舗 階層ダイアグラム */}
      <div>
        <p className="text-sm font-bold text-gray-600 mb-4">端末配置イメージ</p>

        {/* 本社カード */}
        <div className="flex justify-center mb-2">
          <div className="rounded-xl border-2 border-blue-300 bg-blue-50 p-5 w-full max-w-lg">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-2xl">🏢</span>
              <span className="font-bold text-blue-900 text-base">本社・管理部門</span>
              {hqTotal > 0 && (
                <span className="ml-auto text-xs bg-blue-200 text-blue-800 px-2.5 py-1 rounded-full font-semibold">
                  計 {hqTotal}台
                </span>
              )}
            </div>
            {hqTotal > 0 ? (
              <div className="space-y-2">
                {(Object.entries(hqDevices) as [string, number | undefined][])
                  .filter(([, v]) => (v ?? 0) > 0)
                  .map(([type, count]) => (
                    <OwnedDeviceIcons key={type} type={type} count={count ?? 0} />
                  ))}
              </div>
            ) : (
              <p className="text-sm text-blue-400 italic bg-white/60 rounded-lg px-3 py-2">端末情報なし（管理者PC等を別途ご準備ください）</p>
            )}
          </div>
        </div>

        {/* 接続線 */}
        <div className="flex justify-center">
          <div className="flex flex-col items-center">
            <div className="w-0.5 h-6 bg-gray-300" />
            <div className="w-3 h-3 border-b-2 border-r-2 border-gray-400 rotate-45 -mt-2" />
          </div>
        </div>

        {/* 全拠点ラベル */}
        <div className="flex justify-center mb-2 mt-1">
          <div className="inline-flex items-center gap-2 bg-gray-100 border border-gray-300 rounded-full px-4 py-1.5">
            <span className="text-sm font-bold text-gray-700">全 {locationCount} 拠点</span>
            <span className="text-xs text-gray-500">（スタッフ {staffPerLocation}名 / 拠点）</span>
          </div>
        </div>

        {/* 接続線 */}
        <div className="flex justify-center">
          <div className="flex flex-col items-center">
            <div className="w-0.5 h-4 bg-gray-300" />
          </div>
        </div>

        {/* 凡例 */}
        <div className="flex items-center gap-4 mb-3 px-1">
          <div className="flex items-center gap-1.5">
            <span className="w-5 h-5 rounded bg-blue-100 border border-blue-300 inline-block" />
            <span className="text-xs font-medium text-gray-600">保有端末</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-5 h-5 rounded border-2 border-dashed border-orange-400 bg-orange-50 inline-block opacity-70" />
            <span className="text-xs font-medium text-gray-600">不足端末（追加調達が必要）</span>
          </div>
        </div>

        {/* 店舗カード群 */}
        <div className={`grid gap-4 mt-1 ${shownStores === 1 ? 'grid-cols-1 max-w-lg mx-auto' : shownStores === 2 ? 'grid-cols-2' : shownStores === 3 ? 'grid-cols-3' : 'grid-cols-4'}`}>
          {Array.from({ length: shownStores }).map((_, idx) => (
            <div key={idx} className="rounded-xl border-2 border-blue-300 bg-blue-50 p-4">
              {/* ヘッダー */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-xl">🏪</span>
                  <span className="font-bold text-blue-900 text-sm">
                    {locationCount === 1 ? '現場' : `拠点 ${idx + 1}`}
                  </span>
                </div>
                <span className="text-xs bg-blue-200 text-blue-800 px-2 py-0.5 rounded-full font-medium">
                  {staffPerLocation}名
                </span>
              </div>
              {/* 台数バッジ行 */}
              <div className="flex gap-1.5 mb-3 flex-wrap">
                <span className="text-[11px] font-semibold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">理想 {idealPerLocation}台</span>
                <span className="text-[11px] font-semibold bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">保有 {storeTotal}台</span>
                {shortagePerLocation > 0 && (
                  <span className="text-[11px] font-semibold bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">不足 {shortagePerLocation}台</span>
                )}
              </div>
              {/* 保有端末（青）*/}
              {storeTotal > 0 ? (
                <div className="space-y-1.5">
                  {(Object.entries(storeDevices) as [string, number | undefined][])
                    .filter(([, v]) => (v ?? 0) > 0)
                    .map(([type, count]) => (
                      <OwnedDeviceIcons key={type} type={type} count={count ?? 0} />
                    ))}
                </div>
              ) : (
                <p className="text-xs text-blue-400 italic">端末情報なし</p>
              )}
              {/* 不足端末（赤破線）*/}
              {shortagePerLocation > 0 && (
                <div className="mt-2 pt-2 border-t border-dashed border-orange-200">
                  <ShortageDeviceIcons count={shortagePerLocation} icon={DEVICE_ICONS[primaryDeviceType] ?? '📦'} />
                </div>
              )}
            </div>
          ))}
          {hiddenStores > 0 && (
            <div className="rounded-xl border-2 border-dashed border-blue-200 bg-blue-50/40 p-4 flex flex-col items-center justify-center min-h-[100px]">
              <span className="text-2xl text-blue-400">+{hiddenStores}</span>
              <span className="text-xs text-blue-500 mt-1">拠点（同構成）</span>
            </div>
          )}
        </div>
      </div>

      {/* 特別環境対応アクセサリー示唆 */}
      {devicePlan.accessoryHints.length > 0 && (
        <div className="rounded-xl border-2 border-orange-200 bg-orange-50 p-5 space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">⚠️</span>
            <p className="text-sm font-bold text-orange-800">特別環境への対応品（ケース・フィルム等）</p>
          </div>
          {devicePlan.accessoryHints.map((hint, i) => (
            <div key={i}>
              <p className="text-xs font-semibold text-orange-700 mb-2">📍 {hint.condition}</p>
              <ul className="space-y-1.5">
                {hint.items.map((item, j) => (
                  <li key={j} className="flex items-center gap-2 text-sm text-orange-900">
                    <span className="text-orange-400 shrink-0">•</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <p className="text-xs text-orange-600 border-t border-orange-200 pt-3">
            ※ 上記は端末本体に加えて別途ご検討いただくことを推奨するアクセサリーです。導入環境に合わせてご確認ください。
          </p>
        </div>
      )}

      {/* 推奨製品 */}
      {devicePlan.recommendedProducts.length > 0 && (
        <div>
          <p className="text-sm font-bold text-gray-700 mb-3">推奨製品</p>
          <div className="space-y-2">
            {devicePlan.recommendedProducts.map((p, i) => (
              <div key={i} className={`flex items-center justify-between rounded-xl px-5 py-4 ${i === 0 ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50 border border-gray-200'}`}>
                <div>
                  <p className="text-sm font-semibold text-gray-800">{p.productName}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{p.reason}</p>
                </div>
                <p className="text-base font-bold text-blue-600 whitespace-nowrap ml-6">
                  ¥{p.monthlyUnitPrice.toLocaleString()}<span className="text-xs font-normal text-gray-500">/月・台</span>
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* コスト */}
      <div className="rounded-xl bg-gray-50 border border-gray-200 p-6 space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">月額費用（不足{devicePlan.shortfallCount}台 × メイン端末）</span>
          <span className="font-semibold text-gray-900">¥{devicePlan.estimatedMonthlyCost.toLocaleString()}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">初期費用（キッティング）</span>
          <span className="font-semibold text-gray-900">¥{devicePlan.estimatedInitialCost.toLocaleString()}</span>
        </div>
        <div className="border-t pt-3 flex justify-between items-baseline">
          <span className="font-bold text-gray-800">年間総額（税込）</span>
          <span className="font-bold text-blue-600 text-2xl">¥{devicePlan.estimatedTotalCost12m.toLocaleString()}</span>
        </div>
      </div>
    </div>
  )
}

// ==================== フェーズindex計算 ====================

function getPhaseIndex(month: number, phases: Phase[]): number {
  for (let i = 0; i < phases.length; i++) {
    const nums = phases[i].period.match(/\d+/g)?.map(Number) ?? []
    if (nums.length >= 2 && month >= nums[0] && month <= nums[1]) return i
    if (nums.length === 1 && month === nums[0]) return i
  }
  return Math.min(Math.floor((month - 1) / 3), (phases.length || 4) - 1)
}

// ==================== メインページ ====================

export default function ResultPage() {
  const router = useRouter()
  const { answers, isComplete, resetWizard, generatedPlan, setPlan, clearPlan, isGenerating, setGenerating, startEdit } = useWizardStore()
  const [cases, setCases] = useState<CaseStudy[]>([])
  const [caseHints, setCaseHints] = useState<CaseHint[]>([])
  const [insightHints, setInsightHints] = useState<{ label: string; url?: string }[]>([])
  const [devicePlan, setDevicePlan] = useState<DevicePlan | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [downloading, setDownloading] = useState(false)
  const [partialPlan, setPartialPlan] = useState<Partial<GeneratedPlan>>({})
  const [sectionReady, setSectionReady] = useState({ phases: false, schedule: false, barrier: false })
  const [extraPairs, setExtraPairs] = useState<ManualUsagePair[]>([])
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const accumulatedRef = useRef<Partial<GeneratedPlan>>({})

  useEffect(() => {
    if (!isComplete) { router.replace('/wizard?step=1'); return }
    setCases(matchCaseStudies(answers, 3))
    setCaseHints(matchCaseHints(answers, 3, 8))
    setInsightHints(
      matchInsights(answers, 6).map((i) => ({ label: `${i.company}: ${i.tip}`, url: i.source }))
    )
    setDevicePlan(recommendDevicePlan(answers))
    if (!generatedPlan) generatePlan()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isComplete])

  const generatePlan = async () => {
    setGenerating(true)
    setError(null)
    accumulatedRef.current = {}
    setPartialPlan({})
    setSectionReady({ phases: false, schedule: false, barrier: false })

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 120_000) // 120秒タイムアウト
    let reader: ReadableStreamDefaultReader<Uint8Array> | null = null

    try {
      const res = await fetch('/api/generate-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(answers),
        signal: controller.signal,
      })
      if (!res.ok || !res.body) throw new Error()

      reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const json = line.slice(6).trim()
          if (!json) continue
          try {
            const event = JSON.parse(json) as Record<string, unknown>
            const acc = accumulatedRef.current

            if (event.type === 'phases') {
              acc.theme = event.theme as string
              acc.summary = event.summary as string
              acc.phases = event.phases as GeneratedPlan['phases']
              setPartialPlan({ ...acc })
              setSectionReady(prev => ({ ...prev, phases: true }))
            } else if (event.type === 'schedule') {
              acc.schedule = event.schedule as GeneratedPlan['schedule']
              setPartialPlan({ ...acc })
              setSectionReady(prev => ({ ...prev, schedule: true }))
            } else if (event.type === 'barrier') {
              acc.barrierActions = event.barrierActions as GeneratedPlan['barrierActions']
              acc.kpiTargets = event.kpiTargets as GeneratedPlan['kpiTargets']
              setPartialPlan({ ...acc })
              setSectionReady(prev => ({ ...prev, barrier: true }))
            } else if (event.type === 'summary_detail') {
              acc.projectOverview = event.projectOverview as string | undefined
              acc.promotionPoints = event.promotionPoints as string | undefined
              setPartialPlan({ ...acc })
            } else if (event.type === 'usage') {
              acc.usageScenarios = event.usageScenarios as GeneratedPlan['usageScenarios']
              setPartialPlan({ ...acc })
            } else if (event.type === 'feature_stories') {
              acc.featureStories = event.featureStories as GeneratedPlan['featureStories']
              setPartialPlan({ ...acc })
            } else if (event.type === 'manual_usage_pairs') {
              acc.manualUsagePairs = event.manualUsagePairs as GeneratedPlan['manualUsagePairs']
              setPartialPlan({ ...acc })
            } else if (event.type === 'done') {
              setPlan(accumulatedRef.current as GeneratedPlan)
            }
          } catch { /* skip malformed */ }
        }
      }
    } catch (e) {
      const isAbort = e instanceof DOMException && e.name === 'AbortError'
      setError(isAbort ? 'タイムアウトしました。再試行してください。' : 'プランの生成に失敗しました。再試行してください。')
    } finally {
      clearTimeout(timeoutId)
      reader?.cancel().catch(() => {/* ignore */})
      setGenerating(false)
    }
  }

  const handleDownloadPpt = async () => {
    if (!generatedPlan || !devicePlan) return
    setDownloading(true)
    try {
      const res = await fetch('/api/export-ppt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers, plan: generatedPlan, cases, devicePlan }),
      })
      if (!res.ok) throw new Error()
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `TeachmeBiz_運用プラン_${answers.companyName}_${new Date().toISOString().slice(0, 10)}.pptx`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      alert('PPTのダウンロードに失敗しました')
    } finally {
      setDownloading(false)
    }
  }

  const handleLoadMore = async () => {
    if (!answers || isLoadingMore) return
    setIsLoadingMore(true)
    try {
      const allPairs = [...(plan?.manualUsagePairs ?? []), ...extraPairs]
      const existingTitles = allPairs.map((p) => p.manualTitle)
      const existingFeatures = allPairs.map((p) => p.feature)
      const res = await fetch('/api/generate-more-scenarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers, existingTitles, existingFeatures }),
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      setExtraPairs((prev) => [...prev, ...(data.manualUsagePairs ?? [])])
    } catch {
      // silently fail
    } finally {
      setIsLoadingMore(false)
    }
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-orange-600">{error}</p>
          <Button onClick={generatePlan}>再試行</Button>
        </div>
      </div>
    )
  }

  const plan = Object.keys(partialPlan).length > 0 ? partialPlan : generatedPlan
  const barrierActions = plan?.barrierActions ? normalizeBarrierActions(plan.barrierActions as unknown[]) : []

  const recommendedResources = React.useMemo(
    () => (answers ? matchResources(answers, 3) : []),
    [answers]
  )

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ==================== ヘッダー ==================== */}
      <header className="sticky top-0 z-20 bg-white border-b border-gray-200 shadow-sm">
        <div className="mx-auto max-w-[1600px] px-16 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-7 w-7 rounded bg-blue-600 flex items-center justify-center">
              <span className="text-white text-xs font-bold">T</span>
            </div>
            <span className="text-sm font-semibold text-gray-700">{answers.companyName} 様 — 運用プラン</span>
          </div>
          <div className="flex items-center gap-3">
            {isGenerating && (
              <div className="flex items-center gap-2 text-blue-600 text-sm">
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                <span className="font-medium">
                  {!sectionReady.phases ? 'フェーズ生成中...' : !sectionReady.schedule ? 'スケジュール生成中...' : !sectionReady.barrier ? '課題分析中...' : '仕上げ中...'}
                </span>
              </div>
            )}
            <Button variant="outline" size="sm" onClick={() => { resetWizard(); router.push('/') }}>最初から</Button>
            <Button variant="outline" size="sm"
              onClick={() => { startEdit(1); router.push('/wizard?step=1') }}
              disabled={isGenerating}>
              ✏️ 情報を更新して再策定
            </Button>

            <Button size="sm" onClick={handleDownloadPpt} disabled={!generatedPlan || downloading} loading={downloading}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-sm">
              📊 PPTをダウンロード
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1600px] px-16 py-10 space-y-16">

        {/* ==================== 1. タイトル ==================== */}
        {(() => {
          const isUncontracted = answers.contractPlan === 'uncontracted'
          const contractPlanDef = answers.contractPlan && !isUncontracted
            ? getPlanById(answers.contractPlan as TmbPlanId)
            : null
          return (
            <section className="rounded-xl bg-white border border-gray-200 shadow-sm px-8 py-7">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-blue-600 text-xs font-semibold mb-2 tracking-widest uppercase">Teachme Biz 運用プランご提案</p>
                  <h1 className="text-3xl font-bold text-gray-900 leading-tight">
                    {answers.companyName} 様
                  </h1>
                  <p className="text-base font-medium text-gray-500 mt-1">12ヶ月 運用プラン</p>

                  {/* 契約プランバッジ */}
                  {(contractPlanDef || isUncontracted) && (
                    <div className="mt-4 flex flex-wrap items-center gap-3">
                      <div className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold shadow-sm ${
                        isUncontracted
                          ? 'bg-gray-400 text-white'
                          : contractPlanDef!.isNew
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-700 text-white'
                      }`}>
                        <span>🔧</span>
                        {isUncontracted ? (
                          <span>未契約</span>
                        ) : (
                          <>
                            <span>{contractPlanDef!.label}</span>
                            <span className="opacity-80 font-normal text-xs border-l border-white/30 pl-2">
                              ¥{contractPlanDef!.monthlyFee.toLocaleString()}/月
                            </span>
                          </>
                        )}
                      </div>
                      {!isUncontracted && (answers.contractAddons ?? []).length > 0 && (
                        <span className="text-xs text-gray-500">
                          + オプション {(answers.contractAddons ?? []).length}件追加
                        </span>
                      )}
                    </div>
                  )}

                  {plan?.theme && (
                    <div className="mt-3 inline-block bg-blue-50 border border-blue-200 rounded-lg px-4 py-2.5">
                      <p className="text-blue-800 text-sm font-medium leading-relaxed">{plan.theme}</p>
                    </div>
                  )}
                </div>
                <div className="text-right text-gray-400 text-sm space-y-1 shrink-0 ml-10 mt-1">
                  <p className="text-sm font-semibold text-gray-600">{answers.locationCount}拠点 / 計{answers.locationCount * answers.staffPerLocation}名</p>
                  <p className="text-xs">作成日: {new Date().toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </div>
              </div>
            </section>
          )
        })()}

        {/* ==================== 1.5. 前提情報 ==================== */}
        <section>
          <SectionHeading icon="📝" title="前提情報" sub="ヒアリング内容の整理" />
          <PremiseInfo answers={answers} />
        </section>

        {/* ==================== 1.7. 契約プランと利用可能機能 ==================== */}
        {answers.contractPlan && (
          <section>
            <SectionHeading icon="🔧" title="契約プランと利用可能機能" sub="このプランニングの前提となる機能構成" />
            <PlanFeatureSection
              contractPlan={answers.contractPlan}
              contractAddons={answers.contractAddons ?? []}
            />
          </section>
        )}

        {/* ==================== 2. サマリー ==================== */}
        <section>
          <SectionHeading icon="📋" title="プランサマリー" />
          {(plan?.projectOverview || plan?.promotionPoints || plan?.summary)
            ? (
              <div className="grid grid-cols-2 gap-5">
                {/* プロジェクト概要 */}
                <div className="rounded-xl bg-white border border-gray-200 overflow-hidden shadow-sm">
                  <div className="flex items-center gap-2 bg-gray-50 border-b border-gray-200 px-5 py-3">
                    <div className="h-2 w-2 rounded-full bg-blue-500 shrink-0" />
                    <h3 className="text-gray-700 font-bold text-sm">プロジェクト概要</h3>
                  </div>
                  <div className="px-6 py-5 space-y-2">
                    {(plan.projectOverview ?? plan.summary ?? '').split('\n').filter(Boolean).map((line, i) => (
                      <p key={i} className="text-gray-700 text-sm leading-[1.9]">{line}</p>
                    ))}
                  </div>
                </div>
                {/* 推進上のポイント：未着信の間はスケルトン表示 */}
                {plan.promotionPoints ? (
                  <div className="rounded-xl bg-white border border-gray-200 overflow-hidden shadow-sm">
                    <div className="flex items-center gap-2 bg-gray-50 border-b border-gray-200 px-5 py-3">
                      <div className="h-2 w-2 rounded-full bg-amber-500 shrink-0" />
                      <h3 className="text-gray-700 font-bold text-sm">推進上のポイント</h3>
                    </div>
                    <div className="px-6 py-5 space-y-2">
                      {(plan.promotionPoints ?? '').split('\n').filter(Boolean).map((line, i) => (
                        <p key={i} className="text-gray-700 text-sm leading-[1.9]">{line}</p>
                      ))}
                    </div>
                  </div>
                ) : isGenerating ? (
                  <SectionSkeleton rows={4} />
                ) : null}
              </div>
            )
            : isGenerating && <SectionSkeleton rows={4} />
          }
        </section>

        {/* ==================== 2.5. KPI目標 ==================== */}
        {(plan?.kpiTargets?.length ?? 0) > 0 ? (
          <section>
            <SectionHeading icon="🎯" title="KPI目標" sub="12ヶ月プランで達成を目指す数値目標" />
            <div className="grid grid-cols-3 gap-5">
              {(plan!.kpiTargets as { kpi: string; target: string; timing: string }[]).map((k, i) => (
                <div key={i} className="rounded-xl bg-white border border-gray-200 overflow-hidden shadow-sm">
                  <div className="bg-blue-600 px-5 py-3">
                    <p className="text-white font-bold text-sm leading-snug">{k.kpi}</p>
                  </div>
                  <div className="px-5 py-4">
                    <p className="text-2xl font-bold text-blue-600 mb-1.5 leading-tight">{k.target}</p>
                    <p className="text-xs text-gray-500 leading-relaxed">{k.timing}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ) : isGenerating && (
          <section>
            <SectionHeading icon="🎯" title="KPI目標" sub="12ヶ月プランで達成を目指す数値目標" />
            <SectionSkeleton rows={2} />
          </section>
        )}

        {/* ==================== 3. 活用シナリオ ==================== */}
        <section>
          <SectionHeading icon="🎬" title="活用シナリオ提案" sub="誰のために・何を作り・どう使うか — CSのシナリオ知識を可視化" />
          {isGmpRelevant(answers) && <GmpWarningBanner />}
          {(() => {
            const allPairs = [...(plan?.manualUsagePairs ?? []), ...extraPairs]
            if (allPairs.length > 0) {
              return (
                <div className="space-y-5">
                  {allPairs.map((pair, i) => (
                    <div key={i} className="rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                      {/* 共通ヘッダー: 対象者 */}
                      <div className="bg-gray-800 px-5 py-3 flex items-center gap-2">
                        <span className="text-white text-sm">👤</span>
                        <span className="text-white font-bold text-sm">{pair.targetUser}</span>
                      </div>
                      {/* ペアカード */}
                      <div className="grid grid-cols-2 divide-x divide-gray-200 bg-white">
                        {/* 左: 作るマニュアル */}
                        <div className="p-5">
                          <div className="flex items-center gap-2 mb-3">
                            <span className="text-base">📄</span>
                            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">作るマニュアル</span>
                          </div>
                          <p className="font-bold text-gray-900 text-sm mb-2">{pair.manualTitle}</p>
                          <p className="text-sm text-gray-600 leading-relaxed">{pair.content}</p>
                        </div>
                        {/* 右: こう使う */}
                        <div className="p-5">
                          <div className="flex items-center gap-2 mb-3">
                            <span className="text-base">⚡</span>
                            <span className="inline-block bg-blue-600 text-white text-[11px] font-semibold rounded-full px-2.5 py-0.5 leading-tight">{pair.feature}</span>
                          </div>
                          <p className="text-sm text-gray-700 leading-relaxed mb-2">{pair.scene}</p>
                          <div className="rounded-lg bg-blue-50 border border-blue-200 px-3 py-2">
                            <p className="text-sm text-blue-800 font-medium leading-relaxed">{pair.effect}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {/* さらに追加ボタン */}
                  <div className="flex justify-center pt-2">
                    <button
                      onClick={handleLoadMore}
                      disabled={isLoadingMore}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-full border-2 border-blue-300 text-blue-600 font-semibold text-sm hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {isLoadingMore ? (
                        <>
                          <span className="inline-block h-4 w-4 rounded-full border-2 border-blue-400 border-t-transparent animate-spin" />
                          生成中...
                        </>
                      ) : (
                        <>＋ さらに別のシナリオを追加する</>
                      )}
                    </button>
                  </div>
                </div>
              )
            }
            if (isGenerating) return <SectionSkeleton rows={4} />
            return null
          })()}
        </section>

        {/* ==================== 4. 年間スケジュール（四半期） ==================== */}
        <section>
          <SectionHeading icon="🗓️" title="年間スケジュール（四半期）" sub="3ヶ月ごとのフェーズ / 主要活動カテゴリ別" />
          {(plan?.phases?.length ?? 0) > 0 ? (
            <div className="rounded-xl bg-white border border-gray-200 overflow-hidden shadow-sm">
              <table className="w-full border-collapse table-fixed">
                <colgroup>
                  <col style={{ width: '180px', minWidth: '180px' }} />
                  {plan!.phases!.map((_, i) => (
                    <col key={i} style={{ width: `${(100 / plan!.phases!.length).toFixed(2)}%` }} />
                  ))}
                </colgroup>
                <thead>
                  <tr>
                    <th className="bg-gray-100 border-b border-r border-gray-200 px-4 py-3">
                      <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">活動カテゴリ</span>
                    </th>
                    {plan!.phases!.map((phase, i) => (
                      <th key={i} className={`border-b border-gray-200 p-0 ${i < plan!.phases!.length - 1 ? 'border-r' : ''}`}>
                        <ChevronHeader
                          label={phase.name}
                          period={phase.period}
                          calendarPeriod={phaseCalendarRange(answers.projectStartDate, phase.period)}
                          index={i}
                          total={plan!.phases!.length}
                        />
                      </th>
                    ))}
                  </tr>
                  <tr>
                    <td className="bg-gray-50 border-b border-r border-gray-200 px-4 py-2.5">
                      <span className="text-xs font-bold text-gray-500">フェーズゴール</span>
                    </td>
                    {plan!.phases!.map((phase, i) => {
                      const c = PHASE_COLORS[i % PHASE_COLORS.length]
                      return (
                        <td key={i} className={`border-b border-gray-200 px-4 py-2.5 ${i < plan!.phases!.length - 1 ? 'border-r' : ''}`}
                          style={{ background: c.light }}>
                          <p className="text-xs font-medium leading-relaxed" style={{ color: c.text }}>{phase.goal}</p>
                        </td>
                      )
                    })}
                  </tr>
                </thead>
                <tbody>
                  {ACTIVITY_CATEGORIES.map((cat, rowIdx) => (
                    <tr key={cat} className={rowIdx % 2 === 1 ? 'bg-gray-50/40' : 'bg-white'}>
                      <td className="border-b border-r border-gray-100 px-4 py-3 last:border-b-0">
                        <div className="flex items-center gap-2">
                          <span className="text-base">{CAT_ICONS[cat]}</span>
                          <span className="text-xs font-semibold text-gray-700">{cat}</span>
                        </div>
                      </td>
                      {plan!.phases!.map((phase, colIdx) => {
                        const items: string[] = phase.categoryActivities?.[cat]
                          ?? (rowIdx === 4 ? phase.actions.slice(0, 2).map(a => a.title) : [])
                        return (
                          <td key={colIdx}
                            className={`border-b border-gray-100 px-4 py-3 align-top ${colIdx < plan!.phases!.length - 1 ? 'border-r' : ''}`}>
                            {items.filter(Boolean).length > 0 ? (
                              <ul className="space-y-1.5">
                                {items.filter(Boolean).slice(0, 3).map((item, k) => (
                                  <li key={k} className="text-xs text-gray-700 flex gap-1.5">
                                    <span className="text-gray-400 shrink-0 mt-0.5">•</span>
                                    <span className="leading-snug">{item}</span>
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <span className="text-xs text-gray-300">—</span>
                            )}
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                  <tr className="bg-gray-50">
                    <td className="border-r border-gray-200 px-4 py-2.5">
                      <span className="text-xs font-bold text-gray-500">KPI目標</span>
                    </td>
                    {plan!.phases!.map((phase, i) => (
                      <td key={i} className={`px-4 py-2.5 ${i < plan!.phases!.length - 1 ? 'border-r border-gray-200' : ''}`}>
                        {phase.kpi && <p className="text-xs text-blue-700 font-medium">{phase.kpi}</p>}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          ) : isGenerating ? <SectionSkeleton rows={6} /> : <SectionFailed />}
        </section>

        {/* ==================== 4. 月次スケジュール ==================== */}
        <section>
          <SectionHeading icon="📅" title="月次スケジュール" sub="12ヶ月の取り組みテーマ・ゴール一覧＋13ヶ月目以降の展望" />
          {(plan?.schedule?.length ?? 0) > 0 ? (
            <div className="rounded-xl bg-white border border-gray-200 overflow-hidden shadow-sm">
              <div className="grid bg-gray-700 text-white text-xs font-semibold uppercase tracking-wide"
                style={{ gridTemplateColumns: '100px 180px 1fr 2fr 88px' }}>
                {['月', 'フェーズ', 'テーマ', '主要アクション', '効果測定'].map((h, i) => (
                  <div key={h} className={`px-4 py-3 ${i < 4 ? 'border-r border-gray-700' : ''}`}>{h}</div>
                ))}
              </div>
              {plan!.schedule!.map((m) => {
                const isAfter13 = m.month >= 13
                const phaseIdx = isAfter13 ? (plan!.phases ?? []).length - 1 : getPhaseIndex(m.month, plan!.phases ?? [])
                const phase = (plan!.phases ?? [])[phaseIdx]
                const color = isAfter13 ? { bg: '#374151', light: '#F3F4F6', text: '#111827' } : PHASE_COLORS[phaseIdx % PHASE_COLORS.length]
                const calendarLabel = answers.projectStartDate
                  ? isAfter13
                    ? addMonthsToDate(answers.projectStartDate, 12) + '〜'
                    : addMonthsToDate(answers.projectStartDate, m.month - 1)
                  : null
                const isReview = m.isReviewPoint && !isAfter13
                return (
                  <div key={m.month}
                    className={`grid border-b last:border-b-0 transition-colors
                      ${isAfter13 ? 'bg-gray-50 border-gray-100 hover:bg-gray-100/60' :
                        isReview ? 'bg-blue-50 border-blue-200 hover:bg-blue-50' :
                        'border-gray-100 hover:bg-blue-50/20'}`}
                    style={{ gridTemplateColumns: '100px 180px 1fr 2fr 88px' }}>
                    <div className="px-3 py-3 border-r border-gray-100 flex flex-col items-center justify-center gap-0.5">
                      <span className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
                        style={{ background: color.bg }}>
                        {isAfter13 ? '…' : m.month}
                      </span>
                      <span className="text-[10px] font-semibold text-gray-500 leading-tight">
                        {isAfter13 ? '13ヶ月目〜' : `${m.month}ヶ月目`}
                      </span>
                      {calendarLabel && (
                        <span className="text-[11px] font-bold leading-tight text-center" style={{ color: color.bg }}>{calendarLabel}</span>
                      )}
                    </div>
                    <div className="px-3 py-3 border-r border-gray-100 flex items-center">
                      {isAfter13 ? (
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-gray-200 text-gray-700">13ヶ月目以降</span>
                      ) : (
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
                          style={{ background: color.light, color: color.text }}>
                          {phase?.name ?? `P${phaseIdx + 1}`}
                        </span>
                      )}
                    </div>
                    <div className="px-4 py-3 border-r border-gray-100 flex items-center">
                      <p className={`text-sm leading-snug ${isAfter13 ? 'font-medium text-gray-600 italic' : 'font-semibold text-gray-800'}`}>{m.title}</p>
                    </div>
                    <div className="px-4 py-3 border-r border-gray-100 flex items-center">
                      <ul className="space-y-1">
                        {m.actions.slice(0, 2).map((a, ai) => (
                          <li key={ai} className="text-xs text-gray-600 flex gap-1.5">
                            <span className="text-gray-400 shrink-0 mt-0.5">•</span>
                            <span className="line-clamp-2 leading-relaxed">{a}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="px-3 py-3 flex items-center justify-center">
                      {m.isReviewPoint && (
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-semibold">✓ 測定</span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : isGenerating ? <SectionSkeleton rows={8} /> : <SectionFailed />}
        </section>

        {/* ==================== 5. 運用課題への対処策 ==================== */}
        <section>
          <SectionHeading icon="🔧" title="運用課題への対処策" sub="想定される課題と具体的な対処方法" />
          {barrierActions.length > 0 ? (
            <div className="grid grid-cols-2 gap-5">
              {barrierActions.map((item, i) => (
                <div key={i} className="rounded-xl bg-white border border-gray-200 overflow-hidden shadow-sm">
                  <div className="bg-orange-50 border-b border-orange-100 px-5 py-3.5 flex items-start gap-2.5">
                    <span className="text-orange-500 font-bold shrink-0 mt-0.5">⚠</span>
                    <p className="text-sm font-semibold text-orange-800 leading-snug">{item.challenge}</p>
                  </div>
                  <div className="px-5 py-4 flex items-start gap-2.5">
                    <span className="text-blue-500 font-bold shrink-0 mt-0.5">✓</span>
                    <p className="text-sm text-gray-700 leading-relaxed">{item.counter}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : isGenerating ? <SectionSkeleton rows={4} /> : <SectionFailed />}
        </section>

        {/* ==================== お役立ち資料 ==================== */}
        {recommendedResources.length > 0 && (
          <section>
            <SectionHeading icon="📚" title="お役立ち資料" sub="入力内容をもとに、参考になりそうな資料をピックアップしました" />
            <div className="space-y-3">
              {recommendedResources.map((r: HelpfulResource) => (
                <div key={r.id} className="rounded-xl bg-white border border-gray-200 shadow-sm px-5 py-4 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="font-bold text-gray-900 text-sm leading-snug">{r.title}</p>
                    <p className="text-xs text-gray-500 mt-1 leading-relaxed">{r.description}</p>
                  </div>
                  <a
                    href={r.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors whitespace-nowrap"
                  >
                    資料を見る
                    <span className="text-white/80">↗</span>
                  </a>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ==================== 6. 類似他社事例 ==================== */}
        {cases.length > 0 && (
          <section>
            <SectionHeading icon="🏢" title="類似他社事例" sub="業種・規模・課題が近い活用事例" />
            <div className="grid grid-cols-3 gap-6">
              {cases.map((cs, i) => (
                <div key={i} className="rounded-xl bg-white border border-gray-200 overflow-hidden shadow-sm flex flex-col">
                  <div className="bg-gray-50 border-b border-gray-200 px-5 py-4">
                    <p className="text-gray-800 font-bold text-base">{cs.companyName}</p>
                    <p className="text-gray-400 text-xs mt-0.5">{cs.companySize}</p>
                  </div>
                  <div className="p-5 space-y-3.5 flex-1">
                    <div>
                      <p className="text-xs font-bold text-orange-600 mb-1">課題</p>
                      <p className="text-sm text-gray-600 leading-relaxed">{cs.challenge}</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-blue-600 mb-1">施策</p>
                      <p className="text-sm text-gray-600 leading-relaxed">{cs.solution}</p>
                    </div>
                    <div className="rounded-lg bg-blue-50 border border-blue-200 px-4 py-3">
                      <p className="text-xs font-bold text-blue-700 mb-0.5">効果</p>
                      <p className="text-sm text-blue-800 font-semibold">{cs.effect}</p>
                    </div>
                  </div>
                  {cs.url && (
                    <div className="px-5 pb-4">
                      <a href={cs.url} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 hover:underline">
                        事例ページを見る <span className="text-blue-400">↗</span>
                      </a>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* その他のヒント */}
            {(caseHints.length > 0 || insightHints.length > 0) && (
              <div className="mt-6 rounded-xl bg-gray-50 border border-gray-200 px-7 py-6">
                <p className="text-sm font-bold text-gray-700 mb-4">💡 その他のヒント — 運用イメージの参考になる事例・知見</p>
                <div className="grid grid-cols-2 gap-x-10 gap-y-1.5">
                  {caseHints.map((h, i) => (
                    <div key={`case-${i}`} className="flex items-start gap-2 text-sm text-gray-700">
                      <span className="text-gray-400 shrink-0 mt-0.5">•</span>
                      <span className="leading-relaxed">
                        {h.url ? (
                          <a href={h.url} target="_blank" rel="noopener noreferrer"
                            className="text-blue-600 hover:underline hover:text-blue-800">
                            {h.label}
                          </a>
                        ) : h.label}
                      </span>
                    </div>
                  ))}
                  {insightHints.map((h, i) => (
                    <div key={`insight-${i}`} className="flex items-start gap-2 text-sm text-gray-700">
                      <span className="text-gray-400 shrink-0 mt-0.5">•</span>
                      <span className="leading-relaxed">
                        {h.url ? (
                          <a href={h.url} target="_blank" rel="noopener noreferrer"
                            className="text-blue-600 hover:underline hover:text-blue-800">
                            {h.label}
                          </a>
                        ) : h.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        {/* ==================== 7. デバイス推奨プラン ==================== */}
        {devicePlan && (
          <section>
            <SectionHeading icon="📱" title="デバイス推奨プラン" sub={`運用スタイル: ${devicePlan.operationStyleLabel}`} />
            <div className="rounded-xl bg-white border border-gray-200 p-8 shadow-sm">
              <DeviceVisual answers={answers} devicePlan={devicePlan} />
            </div>
          </section>
        )}

        {/* ==================== PPTダウンロードCTA ==================== */}
        <div className="rounded-xl bg-white border border-gray-200 shadow-sm p-8 text-center">
          <p className="text-gray-900 font-bold text-xl mb-1.5">提案資料（PowerPoint）をダウンロード</p>
          <p className="text-gray-500 text-sm mb-6">上記の内容がすべて含まれたPowerPointファイルを生成します</p>
          <Button size="lg" onClick={handleDownloadPpt} disabled={!plan || downloading} loading={downloading}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-10 shadow-sm text-base">
            📊 PPTをダウンロード
          </Button>
        </div>

      </main>
    </div>
  )
}

