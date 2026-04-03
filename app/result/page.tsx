'use client'

import React, { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useWizardStore } from '@/src/store/wizardStore'
import { matchCaseStudies } from '@/src/lib/case-matcher'
import { recommendDevicePlan, DevicePlan } from '@/src/lib/device-recommender'
import { CaseStudy, GeneratedPlan, ACTIVITY_CATEGORIES, BarrierAction, Phase } from '@/src/types/plan'
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

// ==================== 矢羽型ヘッダー ====================

function ChevronHeader({ label, period, index, total }: {
  label: string; period: string; index: number; total: number
}) {
  const color = PHASE_COLORS[index % PHASE_COLORS.length]
  const isLast = index === total - 1
  const A = 18
  const clipPath = index === 0
    ? `polygon(0 0, calc(100% - ${A}px) 0, 100% 50%, calc(100% - ${A}px) 100%, 0 100%)`
    : isLast
    ? `polygon(${A}px 0, 100% 0, 100% 100%, ${A}px 100%, 0 50%)`
    : `polygon(${A}px 0, calc(100% - ${A}px) 0, 100% 50%, calc(100% - ${A}px) 100%, ${A}px 100%, 0 50%)`

  return (
    <div style={{ background: color.bg, clipPath }} className="flex flex-col items-center justify-center py-3 px-6 min-h-[62px]">
      <span className="text-white font-bold text-sm leading-tight text-center">{label}</span>
      <span className="text-white/75 text-xs mt-0.5">{period}</span>
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

function DeviceVisual({ answers, devicePlan }: {
  answers: TmbWizardAnswers
  devicePlan: DevicePlan
}) {
  const DEVICE_ICONS: Record<string, string> = {
    smartphone: '📱', tablet: '📟', pc: '💻', large_monitor: '🖥️',
  }
  const DEVICE_LABELS: Record<string, string> = {
    smartphone: 'スマートフォン', tablet: 'タブレット', pc: 'PC', large_monitor: '大型モニター',
  }
  const hqDevices = answers.headquartersDevicesByType
  const storeDevices = answers.currentDevicesByType
  const hqTotal = Object.values(hqDevices).reduce<number>((s, v) => s + (v ?? 0), 0)
  const storeTotal = Object.values(storeDevices).reduce<number>((s, v) => s + (v ?? 0), 0)

  return (
    <div className="space-y-7">
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

      {/* 配置図 */}
      <div className="grid grid-cols-2 gap-6">
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-2xl">🏢</span>
            <span className="font-bold text-blue-900 text-base">本社・管理部門</span>
          </div>
          {hqTotal > 0 ? (
            <div className="space-y-2">
              {(Object.entries(hqDevices) as [string, number | undefined][]).filter(([, v]) => (v ?? 0) > 0).map(([type, count]) => (
                <div key={type} className="flex items-center gap-2.5 bg-white/60 rounded-lg px-3 py-2">
                  <span className="text-xl">{DEVICE_ICONS[type] ?? '📦'}</span>
                  <span className="text-sm text-blue-800">{DEVICE_LABELS[type] ?? type}</span>
                  <span className="ml-auto font-bold text-blue-900">{count ?? 0}台</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white/60 rounded-lg px-3 py-3 text-sm text-blue-400 italic">端末情報なし（管理者PC等を別途ご準備ください）</div>
          )}
        </div>

        <div className="rounded-xl border border-green-200 bg-green-50 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🏪</span>
              <span className="font-bold text-green-900 text-base">現場（1拠点あたり）</span>
            </div>
            <span className="text-xs bg-green-200 text-green-800 px-2.5 py-1 rounded-full font-semibold">
              × {answers.locationCount}拠点
            </span>
          </div>
          {storeTotal > 0 ? (
            <div className="space-y-2">
              {(Object.entries(storeDevices) as [string, number | undefined][]).filter(([, v]) => (v ?? 0) > 0).map(([type, count]) => (
                <div key={type} className="flex items-center gap-2.5 bg-white/60 rounded-lg px-3 py-2">
                  <span className="text-xl">{DEVICE_ICONS[type] ?? '📦'}</span>
                  <span className="text-sm text-green-800">{DEVICE_LABELS[type] ?? type}</span>
                  <span className="ml-auto font-bold text-green-900">{count ?? 0}台</span>
                </div>
              ))}
              <div className="flex items-center gap-2.5 bg-white/60 rounded-lg px-3 py-2 mt-3">
                <span className="text-xl">👥</span>
                <span className="text-sm text-green-800">スタッフ数</span>
                <span className="ml-auto font-bold text-green-900">{answers.staffPerLocation}名</span>
              </div>
            </div>
          ) : (
            <div className="bg-white/60 rounded-lg px-3 py-3 text-sm text-green-400 italic">
              端末情報なし（{answers.locationCount}拠点 × {answers.staffPerLocation}名/拠点）
            </div>
          )}
        </div>
      </div>

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
  const [devicePlan, setDevicePlan] = useState<DevicePlan | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [downloading, setDownloading] = useState(false)
  const [partialPlan, setPartialPlan] = useState<Partial<GeneratedPlan>>({})
  const [sectionReady, setSectionReady] = useState({ phases: false, schedule: false, barrier: false })
  const accumulatedRef = useRef<Partial<GeneratedPlan>>({})

  useEffect(() => {
    if (!isComplete) { router.replace('/wizard?step=1'); return }
    setCases(matchCaseStudies(answers, 3))
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

        {/* ==================== 3. 全体スケジュール（矢羽型 4×5） ==================== */}
        <section>
          <SectionHeading icon="🗓️" title="全体スケジュール案" sub="3ヶ月ごとのフェーズ / 主要活動カテゴリ別" />
          {(plan?.phases?.length ?? 0) > 0 ? (
            <div className="rounded-xl bg-white border border-gray-200 overflow-hidden shadow-sm">
              <table className="w-full border-collapse">
                <colgroup>
                  <col style={{ width: '180px' }} />
                  {plan!.phases!.map((_, i) => <col key={i} />)}
                </colgroup>
                <thead>
                  <tr>
                    <th className="bg-gray-100 border-b border-r border-gray-200 px-4 py-3">
                      <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">活動カテゴリ</span>
                    </th>
                    {plan!.phases!.map((phase, i) => (
                      <th key={i} className={`border-b border-gray-200 p-0 ${i < plan!.phases!.length - 1 ? 'border-r' : ''}`}>
                        <ChevronHeader label={phase.name} period={phase.period} index={i} total={plan!.phases!.length} />
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
          <SectionHeading icon="📅" title="各月スケジュール" sub="12ヶ月の取り組みテーマ・ゴール一覧" />
          {(plan?.schedule?.length ?? 0) > 0 ? (
            <div className="rounded-xl bg-white border border-gray-200 overflow-hidden shadow-sm">
              <div className="grid bg-gray-800 text-white text-xs font-semibold uppercase tracking-wide"
                style={{ gridTemplateColumns: '64px 140px 1fr 1fr 1.5fr 88px' }}>
                {['月', 'フェーズ', 'テーマ', 'ゴール', '主要アクション', '効果測定'].map((h, i) => (
                  <div key={h} className={`px-4 py-3 ${i < 5 ? 'border-r border-gray-700' : ''}`}>{h}</div>
                ))}
              </div>
              {plan!.schedule!.map((m) => {
                const phaseIdx = getPhaseIndex(m.month, plan!.phases ?? [])
                const phase = (plan!.phases ?? [])[phaseIdx]
                const color = PHASE_COLORS[phaseIdx % PHASE_COLORS.length]
                return (
                  <div key={m.month}
                    className="grid border-b border-gray-100 last:border-b-0 hover:bg-blue-50/20 transition-colors"
                    style={{ gridTemplateColumns: '64px 140px 1fr 1fr 1.5fr 88px' }}>
                    <div className="px-4 py-3 border-r border-gray-100 flex items-center">
                      <span className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
                        style={{ background: color.bg }}>{m.month}</span>
                    </div>
                    <div className="px-3 py-3 border-r border-gray-100 flex items-center">
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
                        style={{ background: color.light, color: color.text }}>
                        {phase?.name ?? `P${phaseIdx + 1}`}
                      </span>
                    </div>
                    <div className="px-4 py-3 border-r border-gray-100 flex items-center">
                      <p className="text-sm font-semibold text-gray-800 leading-snug">{m.title}</p>
                    </div>
                    <div className="px-4 py-3 border-r border-gray-100 flex items-center">
                      <p className="text-xs text-gray-600 leading-relaxed">{m.goal ?? ''}</p>
                    </div>
                    <div className="px-4 py-3 border-r border-gray-100 flex items-center">
                      <ul className="space-y-0.5">
                        {m.actions.slice(0, 2).map((a, ai) => (
                          <li key={ai} className="text-xs text-gray-600">• {a}</li>
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

