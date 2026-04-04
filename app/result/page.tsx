'use client'

import React, { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useWizardStore } from '@/src/store/wizardStore'
import { matchCaseStudies, matchCaseHints, CaseHint } from '@/src/lib/case-matcher'
import { matchInsights } from '@/src/lib/insight-matcher'
import { recommendDevicePlan, DevicePlan } from '@/src/lib/device-recommender'
import { CaseStudy, GeneratedPlan, ACTIVITY_CATEGORIES, BarrierAction, Phase, UsageScenario } from '@/src/types/plan'
import { TmbWizardAnswers } from '@/src/types/answers'
import { Button } from '@/src/components/ui/Button'

// ==================== 型ガード ====================

function isBarrierAction(v: unknown): v is BarrierAction {
  return typeof v === 'object' && v !== null && 'challenge' in v && 'counter' in v
}

function normalizeBarrierActions(raw: unknown[]): BarrierAction[] {
  return raw.map((v) =>
    isBarrierAction(v) ? v : { challenge: String(v), counter: '' }
  )
}

// ==================== フェーズカラー ====================

const PHASE_COLORS = [
  { bg: '#1E40AF', light: '#DBEAFE', text: '#1E3A8A' },
  { bg: '#065F46', light: '#D1FAE5', text: '#064E3B' },
  { bg: '#92400E', light: '#FEF3C7', text: '#78350F' },
  { bg: '#4C1D95', light: '#EDE9FE', text: '#3B0764' },
]

// ==================== カレンダー日付計算 ====================

function addMonthsToDate(startYYYYMM: string, offsetMonths: number): string {
  if (!startYYYYMM) return ''
  const [yearStr, monthStr] = startYYYYMM.split('-')
  const totalMonths = parseInt(yearStr, 10) * 12 + parseInt(monthStr, 10) - 1 + offsetMonths
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
    <div style={{ background: color.bg, clipPath }} className="flex flex-col items-center justify-center py-3 px-6 min-h-[68px]">
      <span className="text-white font-bold text-sm leading-tight text-center">{label}</span>
      <span className="text-white/80 text-xs mt-0.5">{period}</span>
      {calendarPeriod && <span className="text-white/60 text-xs mt-0.5">{calendarPeriod}</span>}
    </div>
  )
}

// ==================== カテゴリアイコン ====================

const CAT_ICONS: Record<string, string> = {
  初期設定: '⚙️', マニュアル作成: '📝', マニュアル活用: '📖', 効果測定: '📊', その他: '💬',
}

// ==================== セクション見出し ====================

function SectionHeading({ icon, title, sub }: { icon: string; title: string; sub?: string }) {
  return (
    <div className="flex items-end gap-3 mb-5">
      <span className="text-2xl leading-none">{icon}</span>
      <div className="leading-tight">
        <h2 className="text-xl font-bold text-gray-900">{title}</h2>
        {sub && <p className="text-sm text-gray-500 mt-0.5">{sub}</p>}
      </div>
      <div className="flex-1 border-b border-gray-200 mb-0.5" />
    </div>
  )
}

// ==================== セクションスケルトン ====================

function SectionSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="rounded-xl bg-white border border-gray-200 p-8 shadow-sm animate-pulse">
      <div className="flex items-center gap-2 mb-5">
        <div className="h-3 w-3 rounded-full bg-blue-300 animate-bounce" style={{ animationDelay: '0ms' }} />
        <div className="h-3 w-3 rounded-full bg-blue-200 animate-bounce" style={{ animationDelay: '150ms' }} />
        <div className="h-3 w-3 rounded-full bg-blue-100 animate-bounce" style={{ animationDelay: '300ms' }} />
        <span className="text-xs text-gray-400 ml-1">生成中...</span>
      </div>
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="h-3 bg-gray-100 rounded" style={{ width: `${90 - i * 10}%` }} />
        ))}
      </div>
    </div>
  )
}

// ==================== デバイス配置ビジュアル ====================

const DEVICE_ICONS: Record<string, string> = {
  smartphone: '📱', tablet: '📟', pc: '💻', large_monitor: '🖥️',
}
const DEVICE_LABELS: Record<string, string> = {
  smartphone: 'スマートフォン', tablet: 'タブレット', pc: 'PC', large_monitor: '大型モニター',
}

// ==================== 前提情報ラベルマップ ====================

const INDUSTRY_LABELS_MAP: Record<string, string> = {
  agriculture: '農業・林業', fishing: '漁業', mining: '鉱業・採石業',
  construction: '建設業', manufacturing: '製造業', utility: '電気・ガス・熱供給・水道業',
  it: '情報通信業', logistics: '運輸業・郵便業', retail: '卸売業・小売業',
  finance: '金融業・保険業', real_estate: '不動産業・物品賃貸業',
  professional: '学術研究・専門・技術サービス業', food_service: '宿泊業・飲食サービス業',
  beauty: '生活関連サービス業・娯楽業', education: '教育・学習支援業',
  medical: '医療・福祉', other: 'サービス業（その他）・公務',
}
const SUB_INDUSTRY_LABELS_MAP: Record<string, string> = {
  gms_supermarket: 'GMS・スーパー', convenience: 'コンビニ（FC）', apparel: 'アパレル',
  electronics: '家電量販', auto_dealer: '自動車販売', home_center: 'ホームセンター',
}
const COMPANY_SIZE_LABELS_MAP: Record<string, string> = {
  under50: '50名未満', under200: '50〜200名未満', under500: '200〜500名未満',
  under1000: '500〜1000名未満', over1000: '1000名以上',
}
const CHALLENGE_LABELS_MAP: Record<string, string> = {
  talent_development: '人材育成・研修の効率化', standardization: '品質・サービスの標準化',
  knowledge_transfer: '技術・ノウハウの伝承', manual_creation: 'マニュアル作成・更新の負担',
  foreign_staff: '外国人・多様な人材への教育', cost_reduction: 'コスト削減',
  iso_compliance: 'ISO・法令対応', multi_store: '多店舗・多拠点への展開',
  remote_management: '遠隔管理・モニタリング', security: 'セキュリティ強化',
}
const GOAL_LABELS_MAP: Record<string, string> = {
  reduce_training_time: '研修・教育時間の削減', standardize_quality: '品質・サービスの標準化',
  eliminate_dependency: '業務の属人化解消', reduce_cost: 'コスト削減',
  improve_compliance: 'コンプライアンス対応', support_foreign_staff: '外国人・多様な人材支援',
  dx_promotion: '現場DX推進',
}
const KPI_LABELS_MAP: Record<string, string> = {
  time_reduction: '工数削減', cost_reduction: 'コスト削減',
  quality_improvement: '品質・合格率向上', turnover_reduction: '定着率向上・離職率低下',
}
const USAGE_STATUS_LABELS_MAP: Record<string, string> = {
  none: 'まだ使っていない（ゼロから）', partial: '一部部門で試用中',
  active: '特定の用途で本格稼働中', expanding: '複数部門で展開中',
}
const BARRIER_LABELS_MAP: Record<string, string> = {
  no_time_for_creation: 'マニュアル作成の時間が工面できない',
  no_team_structure: '推進担当者・体制が整っていない',
  low_it_literacy: '現場スタッフのITリテラシーが低い',
  hard_to_involve: '経営層・現場の巻き込みが難しい',
  migration_burden: '既存マニュアル（紙・Excel）の移行が膨大',
  no_creation_knowhow: 'マニュアル作成のノウハウがない',
  maintenance_concern: '継続的な更新・メンテナンスが続かない',
  low_adoption_concern: '利用促進・定着が見込めない',
}
const USE_CASE_LABELS_MAP: Record<string, string> = {
  manual_viewing: 'マニュアル閲覧', video_shooting: '動画撮影・作成',
  pos_business_app: 'POS・業務アプリ連携', customer_display: '顧客向け案内表示',
  team_communication: 'チームコミュニケーション', onboarding: '新人オンボーディング',
  skill_assessment: 'スキルチェック・テスト',
}
const MANUAL_TYPE_LABELS_MAP: Record<string, string> = {
  work_procedure: '業務手順書', customer_service: '接客・サービスマニュアル',
  system_operation: 'システム操作マニュアル', safety_rules: '安全・衛生規則',
  quality_check: '品質チェックリスト', other: 'その他',
}
const MANUAL_QUALITY_LABELS_MAP: Record<string, string> = {
  casual: 'スピード重視（手軽に作成）', rich: '品質重視（リッチなコンテンツ）',
}
const ENV_CONDITION_LABELS_MAP: Record<string, string> = {
  normal: '通常環境', water_humidity: '水・湿気への配慮が必要',
  dust_dirt: '粉塵・汚れへの配慮が必要', hygiene: '衛生管理が必要',
  food_factory: '食品工場規格への準拠', outdoor_sunlight: '屋外・直射日光下',
  low_temperature: '低温環境',
}
const OPERATION_STYLE_LABELS_MAP: Record<string, string> = {
  group_training: '集合研修タイプ（10人に1台）', group_shared: 'グループ共有タイプ（3人に1台）',
  workplace_unit: '職場単位タイプ（拠点ごと2〜3台）', individual: '個人割り振りタイプ（1人1台）',
  byod: 'BYODタイプ（個人端末活用）',
}

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
  const industryLabel = answers.industry ? (INDUSTRY_LABELS_MAP[answers.industry] ?? answers.industry) : null
  const subLabel = answers.subIndustry ? (SUB_INDUSTRY_LABELS_MAP[answers.subIndustry] ?? answers.subIndustry) : null
  const industryStr = [industryLabel, subLabel].filter(Boolean).join(' › ')

  return (
    <div className="grid grid-cols-2 gap-5">
      {/* 企業情報 */}
      <PremiseSection title="企業・組織情報" icon="🏢">
        <PremiseRow label="企業名" value={answers.companyName || '—'} />
        <PremiseRow label="業種" value={industryStr || '—'} />
        <PremiseRow label="企業規模" value={answers.companySize ? COMPANY_SIZE_LABELS_MAP[answers.companySize] : '—'} />
        <PremiseRow label="拠点数" value={`${answers.locationCount}拠点`} />
        <PremiseRow label="FC・フランチャイズ" value={answers.isFranchise === true ? 'あり' : answers.isFranchise === false ? 'なし' : '—'} />
        {answers.departmentNote && <PremiseRow label="対象部門・事業部" value={answers.departmentNote} />}
        {answers.projectStartDate && <PremiseRow label="プロジェクト開始" value={addMonthsToDate(answers.projectStartDate, 0)} />}
      </PremiseSection>

      {/* 経営課題 */}
      <PremiseSection title="経営課題" icon="⚠️">
        <div className="py-2">
          <TagList items={answers.challenges.map((c) => CHALLENGE_LABELS_MAP[c] ?? c)} />
        </div>
      </PremiseSection>

      {/* 導入目的・期待効果 */}
      <PremiseSection title="導入目的・期待効果" icon="🎯">
        <PremiseRow label="導入目的" value={<TagList items={answers.primaryGoals.map((g) => GOAL_LABELS_MAP[g] ?? g)} />} />
        <PremiseRow label="優先KPI" value={answers.priorityKpi ? KPI_LABELS_MAP[answers.priorityKpi] : '—'} />
        {answers.targetValue && <PremiseRow label="目標値" value={answers.targetValue} />}
        <PremiseRow label="現在の利用状況" value={answers.usageStatus ? USAGE_STATUS_LABELS_MAP[answers.usageStatus] : '—'} />
        {answers.currentUseCases && <PremiseRow label="現在の用途" value={answers.currentUseCases} />}
      </PremiseSection>

      {/* 運用障壁 */}
      <PremiseSection title="推進上の障壁" icon="🚧">
        <div className="py-2">
          <TagList items={answers.operationalBarriers.map((b) => BARRIER_LABELS_MAP[b] ?? b)} />
        </div>
      </PremiseSection>

      {/* 活用シーン・マニュアル */}
      <PremiseSection title="活用シーン・マニュアル" icon="📋">
        <PremiseRow label="活用シーン" value={<TagList items={answers.useCases.map((u) => USE_CASE_LABELS_MAP[u] ?? u)} />} />
        <PremiseRow label="マニュアル種類" value={<TagList items={answers.manualTypes.map((m) => MANUAL_TYPE_LABELS_MAP[m] ?? m)} />} />
        <PremiseRow label="作成方針" value={answers.manualQuality ? MANUAL_QUALITY_LABELS_MAP[answers.manualQuality] : '—'} />
      </PremiseSection>

      {/* デバイス・運用スタイル */}
      <PremiseSection title="デバイス・運用スタイル" icon="📱">
        <PremiseRow label="使用デバイス" value={<TagList items={answers.deviceTypes.map((d) => DEVICE_LABELS[d] ?? d)} />} />
        <PremiseRow label="利用環境" value={<TagList items={answers.environmentConditions.map((e) => ENV_CONDITION_LABELS_MAP[e] ?? e)} />} />
        <PremiseRow label="運用スタイル" value={answers.operationStyle ? OPERATION_STYLE_LABELS_MAP[answers.operationStyle] : '—'} />
        <PremiseRow label="スタッフ数/拠点" value={`${answers.staffPerLocation}名`} />
      </PremiseSection>
    </div>
  )
}

function DeviceIconGrid({ type, count, textColor }: { type: string; count: number; textColor: string }) {
  const icon = DEVICE_ICONS[type] ?? '📦'
  const label = DEVICE_LABELS[type] ?? type
  const MAX = 10
  const shown = Math.min(count, MAX)
  const overflow = count > MAX ? count - MAX : 0
  return (
    <div className="flex items-center gap-2 bg-white/70 rounded-lg px-3 py-2">
      <div className="flex flex-wrap gap-0.5 min-w-0">
        {Array.from({ length: shown }).map((_, i) => (
          <span key={i} className="text-lg leading-none">{icon}</span>
        ))}
        {overflow > 0 && <span className={`text-xs font-bold ${textColor} self-end ml-0.5`}>+{overflow}</span>}
      </div>
      <div className="ml-auto shrink-0 text-right">
        <p className={`text-xs font-medium ${textColor}`}>{label}</p>
        <p className={`text-lg font-bold ${textColor}`}>{count}<span className="text-xs font-normal ml-0.5">台</span></p>
      </div>
    </div>
  )
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
                    <DeviceIconGrid key={type} type={type} count={count ?? 0} textColor="text-blue-800" />
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

        {/* 店舗カード群 */}
        <div className={`grid gap-4 mt-1 ${shownStores === 1 ? 'grid-cols-1 max-w-lg mx-auto' : shownStores === 2 ? 'grid-cols-2' : shownStores === 3 ? 'grid-cols-3' : 'grid-cols-4'}`}>
          {Array.from({ length: shownStores }).map((_, idx) => (
            <div key={idx} className="rounded-xl border-2 border-green-300 bg-green-50 p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-1.5">
                  <span className="text-xl">🏪</span>
                  <span className="font-bold text-green-900 text-sm">
                    {locationCount === 1 ? '現場' : `拠点 ${idx + 1}`}
                  </span>
                </div>
                <span className="text-xs bg-green-200 text-green-800 px-2 py-0.5 rounded-full font-medium">
                  {staffPerLocation}名
                </span>
              </div>
              {storeTotal > 0 ? (
                <div className="space-y-1.5">
                  {(Object.entries(storeDevices) as [string, number | undefined][])
                    .filter(([, v]) => (v ?? 0) > 0)
                    .map(([type, count]) => (
                      <DeviceIconGrid key={type} type={type} count={count ?? 0} textColor="text-green-800" />
                    ))}
                </div>
              ) : (
                <p className="text-xs text-green-400 italic">端末情報なし</p>
              )}
            </div>
          ))}
          {hiddenStores > 0 && (
            <div className="rounded-xl border-2 border-dashed border-green-200 bg-green-50/40 p-4 flex flex-col items-center justify-center min-h-[100px]">
              <span className="text-2xl text-green-400">+{hiddenStores}</span>
              <span className="text-xs text-green-500 mt-1">拠点（同構成）</span>
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
  const { answers, isComplete, resetWizard, generatedPlan, setPlan, isGenerating, setGenerating } = useWizardStore()
  const [cases, setCases] = useState<CaseStudy[]>([])
  const [caseHints, setCaseHints] = useState<CaseHint[]>([])
  const [insightHints, setInsightHints] = useState<{ label: string; url?: string }[]>([])
  const [devicePlan, setDevicePlan] = useState<DevicePlan | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [downloading, setDownloading] = useState(false)
  const [partialPlan, setPartialPlan] = useState<Partial<GeneratedPlan>>({})
  const [sectionReady, setSectionReady] = useState({ phases: false, schedule: false, barrier: false })
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

    try {
      const res = await fetch('/api/generate-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(answers),
      })
      if (!res.ok || !res.body) throw new Error()

      const reader = res.body.getReader()
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
            } else if (event.type === 'usage') {
              acc.usageScenarios = event.usageScenarios as GeneratedPlan['usageScenarios']
              setPartialPlan({ ...acc })
            } else if (event.type === 'extras') {
              acc.useCaseProposals = event.useCaseProposals as GeneratedPlan['useCaseProposals']
              acc.roadmap = event.roadmap as GeneratedPlan['roadmap']
              acc.counterScripts = event.counterScripts as GeneratedPlan['counterScripts']
              acc.bottleneckHints = event.bottleneckHints as GeneratedPlan['bottleneckHints']
              setPartialPlan({ ...acc })
            } else if (event.type === 'done') {
              setPlan(accumulatedRef.current as GeneratedPlan)
            }
          } catch { /* skip malformed */ }
        }
      }
    } catch {
      setError('プランの生成に失敗しました。再試行してください。')
    } finally {
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

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-red-500">{error}</p>
          <Button onClick={generatePlan}>再試行</Button>
        </div>
      </div>
    )
  }

  const plan = Object.keys(partialPlan).length > 0 ? partialPlan : generatedPlan
  const barrierActions = plan?.barrierActions ? normalizeBarrierActions(plan.barrierActions as unknown[]) : []

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ==================== ヘッダー ==================== */}
      <header className="sticky top-0 z-20 bg-white border-b border-gray-200 shadow-sm">
        <div className="mx-auto max-w-[1760px] px-8 py-3 flex items-center justify-between">
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
            <Button size="sm" onClick={handleDownloadPpt} disabled={!generatedPlan || downloading} loading={downloading}
              className="bg-green-600 hover:bg-green-700">
              📊 PPTをダウンロード
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1760px] px-8 py-10 space-y-12">

        {/* ==================== 1. タイトル ==================== */}
        <section className="rounded-2xl bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700 px-10 py-10">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-blue-200 text-sm font-medium mb-3 tracking-wide">Teachme Biz 12ヶ月 運用プランご提案</p>
              <h1 className="text-5xl font-bold text-white leading-tight">
                {answers.companyName} 様
              </h1>
              <h2 className="text-3xl font-semibold text-blue-100 mt-2">運用プラン</h2>
              {plan?.theme && (
                <div className="mt-5 inline-block bg-white/15 rounded-xl px-5 py-3">
                  <p className="text-white text-lg font-medium leading-relaxed">{plan.theme}</p>
                </div>
              )}
            </div>
            <div className="text-right text-blue-200 text-sm space-y-1.5 shrink-0 ml-10 mt-2">
              <p className="text-base font-medium text-white">12ヶ月プラン</p>
              <p>{answers.locationCount}拠点 / 計{answers.locationCount * answers.staffPerLocation}名</p>
              <p>作成日: {new Date().toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>
          </div>
        </section>

        {/* ==================== 1.5. 前提情報 ==================== */}
        <section>
          <SectionHeading icon="📝" title="前提情報" sub="ヒアリング内容の整理" />
          <PremiseInfo answers={answers} />
        </section>

        {/* ==================== 2. サマリー ==================== */}
        <section>
          <SectionHeading icon="📋" title="プランサマリー" />
          {plan?.summary
            ? <div className="rounded-xl bg-white border border-gray-200 px-8 py-6 shadow-sm">
                <p className="text-gray-800 text-base leading-[1.9]">{plan.summary}</p>
              </div>
            : isGenerating && <SectionSkeleton rows={4} />
          }
        </section>

        {/* ==================== 3. マニュアル活用イメージ ==================== */}
        <section>
          <SectionHeading icon="📖" title="マニュアル活用イメージ" sub="どんなマニュアルを、誰が、どのシーンで使い、どんな効果を出すか" />
          {(plan?.usageScenarios?.length ?? 0) > 0 ? (
            <div className="grid grid-cols-2 gap-5">
              {(plan!.usageScenarios as UsageScenario[]).map((s, i) => (
                <div key={i} className="rounded-xl bg-white border border-gray-200 overflow-hidden shadow-sm">
                  <div className="bg-blue-700 px-5 py-3 flex items-center gap-2">
                    <span className="text-blue-200 text-sm">📄</span>
                    <p className="text-white font-bold text-sm leading-snug">{s.manualTitle}</p>
                  </div>
                  <div className="p-5 space-y-2.5">
                    <div className="flex items-start gap-2.5">
                      <span className="text-xs font-bold text-gray-400 w-14 shrink-0 mt-0.5">誰が</span>
                      <p className="text-sm text-gray-800">{s.user}</p>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <span className="text-xs font-bold text-gray-400 w-14 shrink-0 mt-0.5">シーン</span>
                      <p className="text-sm text-gray-700 leading-relaxed">{s.scene}</p>
                    </div>
                    <div className="flex items-start gap-2.5 rounded-lg bg-green-50 border border-green-200 px-3 py-2">
                      <span className="text-xs font-bold text-green-600 w-14 shrink-0 mt-0.5">効果</span>
                      <p className="text-sm text-green-800 font-medium leading-relaxed">{s.effect}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : isGenerating && <SectionSkeleton rows={4} />}
        </section>

        {/* ==================== 4. 全体スケジュール（矢羽型） ==================== */}
        <section>
          <SectionHeading icon="🗓️" title="全体スケジュール案" sub="3ヶ月ごとのフェーズ / 主要活動カテゴリ別" />
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
                                    <span className="leading-relaxed">{item}</span>
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
          ) : isGenerating && <SectionSkeleton rows={6} />}
        </section>

        {/* ==================== 4. 各月スケジュール ==================== */}
        <section>
          <SectionHeading icon="📅" title="各月スケジュール" sub="12ヶ月の取り組みテーマ・ゴール一覧＋13ヶ月目以降の展望" />
          {(plan?.schedule?.length ?? 0) > 0 ? (
            <div className="rounded-xl bg-white border border-gray-200 overflow-hidden shadow-sm">
              <div className="grid bg-gray-800 text-white text-xs font-semibold uppercase tracking-wide"
                style={{ gridTemplateColumns: '80px 180px 1fr 2fr 88px' }}>
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
                return (
                  <div key={m.month}
                    className={`grid border-b border-gray-100 last:border-b-0 transition-colors ${isAfter13 ? 'bg-gray-50 hover:bg-gray-100/60' : 'hover:bg-blue-50/20'}`}
                    style={{ gridTemplateColumns: '80px 180px 1fr 2fr 88px' }}>
                    <div className="px-3 py-3 border-r border-gray-100 flex flex-col items-center justify-center gap-0.5">
                      <span className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
                        style={{ background: color.bg }}>
                        {isAfter13 ? '…' : m.month}
                      </span>
                      {calendarLabel && (
                        <span className="text-center text-gray-400 leading-tight" style={{ fontSize: '10px' }}>{calendarLabel}</span>
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
                        {m.actions.slice(0, 3).map((a, ai) => (
                          <li key={ai} className="text-xs text-gray-600 flex gap-1.5">
                            <span className="text-gray-400 shrink-0">•</span>
                            <span className="leading-relaxed">{a}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="px-3 py-3 flex items-center justify-center">
                      {m.isReviewPoint && (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-semibold">✓ 測定</span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : isGenerating && <SectionSkeleton rows={8} />}
        </section>

        {/* ==================== 5. 運用課題への対処策 ==================== */}
        <section>
          <SectionHeading icon="🔧" title="運用課題への対処策" sub="想定される課題と具体的な対処方法" />
          {barrierActions.length > 0 ? (
            <div className="grid grid-cols-2 gap-5">
              {barrierActions.map((item, i) => (
                <div key={i} className="rounded-xl bg-white border border-gray-200 overflow-hidden shadow-sm">
                  <div className="bg-red-50 border-b border-red-100 px-5 py-3.5 flex items-start gap-2.5">
                    <span className="text-red-500 font-bold shrink-0 mt-0.5">⚠</span>
                    <p className="text-sm font-semibold text-red-800 leading-snug">{item.challenge}</p>
                  </div>
                  <div className="px-5 py-4 flex items-start gap-2.5">
                    <span className="text-green-500 font-bold shrink-0 mt-0.5">✓</span>
                    <p className="text-sm text-gray-700 leading-relaxed">{item.counter}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : isGenerating && <SectionSkeleton rows={4} />}
        </section>

        {/* ==================== 6. 類似他社事例 ==================== */}
        {cases.length > 0 && (
          <section>
            <SectionHeading icon="🏢" title="類似他社事例" sub="業種・規模・課題が近い活用事例" />
            <div className="grid grid-cols-3 gap-6">
              {cases.map((cs, i) => (
                <div key={i} className="rounded-xl bg-white border border-gray-200 overflow-hidden shadow-sm flex flex-col">
                  <div className="bg-gray-800 px-5 py-4">
                    <p className="text-white font-bold text-base">{cs.companyName}</p>
                    <p className="text-gray-400 text-xs mt-0.5">{cs.companySize}</p>
                  </div>
                  <div className="p-5 space-y-3.5 flex-1">
                    <div>
                      <p className="text-xs font-bold text-red-600 mb-1">課題</p>
                      <p className="text-sm text-gray-600 leading-relaxed">{cs.challenge}</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-blue-600 mb-1">施策</p>
                      <p className="text-sm text-gray-600 leading-relaxed">{cs.solution}</p>
                    </div>
                    <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3">
                      <p className="text-xs font-bold text-green-700 mb-0.5">効果</p>
                      <p className="text-sm text-green-800 font-semibold">{cs.effect}</p>
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
        <div className="rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 p-10 text-center">
          <p className="text-white font-bold text-2xl mb-2">提案資料（PowerPoint）をダウンロード</p>
          <p className="text-blue-100 text-sm mb-6">上記の内容がすべて含まれたPowerPointファイルを生成します</p>
          <Button size="lg" onClick={handleDownloadPpt} disabled={!plan || downloading} loading={downloading}
            className="bg-white text-blue-600 hover:bg-blue-50 font-bold px-10">
            📊 PPTをダウンロード
          </Button>
        </div>

      </main>
    </div>
  )
}

