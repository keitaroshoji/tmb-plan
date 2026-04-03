'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useWizardStore } from '@/src/store/wizardStore'
import { matchCaseStudies } from '@/src/lib/case-matcher'
import { recommendDevicePlan, DevicePlan } from '@/src/lib/device-recommender'
import { GeneratedPlan, CaseStudy } from '@/src/types/plan'
import { Button } from '@/src/components/ui/Button'
import { UseCaseSection } from '@/src/components/result/UseCaseSection'
import { RoadmapSection } from '@/src/components/result/RoadmapSection'
import { BottleneckSection } from '@/src/components/result/BottleneckSection'
import { CounterScriptSection } from '@/src/components/result/CounterScriptSection'
import { RoadmapStartPoint } from '@/src/store/wizardStore'

export default function ResultPage() {
  const router = useRouter()
  const { answers, isComplete, resetWizard, generatedPlan, setPlan, isGenerating, setGenerating, roadmapStartPoint, setRoadmapStartPoint } = useWizardStore()
  const [cases, setCases] = useState<CaseStudy[]>([])
  const [devicePlan, setDevicePlan] = useState<DevicePlan | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [downloading, setDownloading] = useState(false)

  useEffect(() => {
    if (!isComplete) {
      router.replace('/wizard?step=1')
      return
    }

    // 事例マッチング・デバイス試算（即時）
    const matched = matchCaseStudies(answers, 3)
    setCases(matched)
    const device = recommendDevicePlan(answers)
    setDevicePlan(device)

    // プラン未生成なら生成
    if (!generatedPlan) {
      generatePlan()
    }
  }, [isComplete])

  const generatePlan = async () => {
    setGenerating(true)
    setError(null)
    try {
      const res = await fetch('/api/generate-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(answers),
      })
      if (!res.ok) throw new Error('生成に失敗しました')
      const { plan } = await res.json()
      setPlan(plan)
    } catch (e) {
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
      if (!res.ok) throw new Error('PPT生成に失敗しました')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `TeachmeBiz_運用プラン_${answers.companyName}_${new Date().toISOString().slice(0, 10)}.pptx`
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      alert('PPTのダウンロードに失敗しました')
    } finally {
      setDownloading(false)
    }
  }

  if (isGenerating) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
            <svg className="h-8 w-8 animate-spin text-blue-600" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
          </div>
          <p className="text-lg font-semibold text-gray-800">AIがプランを生成中...</p>
          <p className="text-sm text-gray-500">{answers.companyName}様の情報を分析しています</p>
        </div>
      </div>
    )
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

  const plan = generatedPlan

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm">
        <div className="mx-auto max-w-4xl px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded bg-blue-600 flex items-center justify-center">
              <span className="text-white text-xs font-bold">T</span>
            </div>
            <span className="text-sm font-semibold text-gray-700">
              {answers.companyName} 様 - 運用プラン
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={() => { resetWizard(); router.push('/') }}>
              最初から
            </Button>
            <Button
              size="sm"
              onClick={handleDownloadPpt}
              disabled={!plan || downloading}
              loading={downloading}
              className="bg-green-600 hover:bg-green-700"
            >
              📊 PPTをダウンロード
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8 space-y-8">

        {/* サマリー */}
        {plan?.summary && (
          <div className="rounded-xl bg-blue-50 border border-blue-200 p-5">
            <h2 className="text-sm font-semibold text-blue-700 mb-2">📋 プランサマリー</h2>
            <p className="text-sm text-blue-900 leading-relaxed">{plan.summary}</p>
          </div>
        )}

        {/* 運用プラン */}
        {plan && (
          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-4">🎯 推奨 運用プラン</h2>
            <div className={`grid gap-4 grid-cols-1 md:grid-cols-${Math.min(plan.phases.length, 4)}`}>
              {plan.phases.map((phase, i) => (
                <div key={i} className="rounded-xl border border-gray-200 overflow-hidden">
                  <div className="bg-blue-600 px-4 py-2.5">
                    <p className="text-white font-bold text-sm">{phase.name}</p>
                    <p className="text-blue-200 text-xs">{phase.period}</p>
                  </div>
                  <div className="p-4 space-y-3">
                    <div className="rounded-lg bg-blue-50 px-3 py-2">
                      <p className="text-xs text-blue-700 font-medium">ゴール</p>
                      <p className="text-xs text-blue-900 mt-0.5">{phase.goal}</p>
                    </div>
                    {phase.kpi && (
                      <div>
                        <p className="text-xs text-gray-500 font-medium">KPI</p>
                        <p className="text-xs text-gray-700">{phase.kpi}</p>
                      </div>
                    )}
                    <div className="space-y-2">
                      {phase.actions.map((action, j) => (
                        <div key={j}>
                          <p className="text-xs font-semibold text-gray-800">▸ {action.title}</p>
                          <p className="text-xs text-gray-500 ml-3">{action.description}</p>
                          {action.owner && <p className="text-xs text-blue-500 ml-3">担当: {action.owner}</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 運用課題への対処 */}
        {plan && plan.barrierActions.length > 0 && (
          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-4">🔧 運用課題への対処策</h2>
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 space-y-2">
              {plan.barrierActions.map((action, i) => (
                <div key={i} className="flex gap-2">
                  <span className="text-amber-500 font-bold text-sm">✓</span>
                  <p className="text-sm text-amber-900">{action}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ボトルネック示唆 */}
        {plan?.bottleneckHints && plan.bottleneckHints.length > 0 && (
          <BottleneckSection hints={plan.bottleneckHints} />
        )}

        {/* 用途提案 */}
        {plan?.useCaseProposals && plan.useCaseProposals.length > 0 && (
          <UseCaseSection proposals={plan.useCaseProposals} />
        )}

        {/* ロードマップ */}
        {plan?.roadmap && plan.roadmap.length > 0 && (
          <RoadmapSection
            roadmap={plan.roadmap}
            startPoint={roadmapStartPoint}
            onStartPointChange={(point) => setRoadmapStartPoint(point)}
          />
        )}

        {/* カウンタースクリプト */}
        {plan?.counterScripts && plan.counterScripts.length > 0 && (
          <CounterScriptSection scripts={plan.counterScripts} />
        )}

        {/* 年間スケジュール */}
        {plan && plan.schedule.length > 0 && (
          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-4">📅 年間スケジュール</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {plan.schedule.map((m) => (
                <div
                  key={m.month}
                  className={`rounded-lg border p-3 ${m.isReviewPoint ? 'border-green-300 bg-green-50' : 'border-gray-200 bg-white'}`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-xs font-bold ${m.isReviewPoint ? 'text-green-600' : 'text-blue-600'}`}>
                      {m.month}ヶ月目
                    </span>
                    {m.isReviewPoint && <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded">📊 効果測定</span>}
                  </div>
                  <p className="text-xs font-semibold text-gray-800 mb-1">{m.title}</p>
                  <ul className="space-y-0.5">
                    {m.actions.slice(0, 2).map((a, i) => (
                      <li key={i} className="text-xs text-gray-500">• {a}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 類似事例 */}
        {cases.length > 0 && (
          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-4">🏢 類似他社事例</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {cases.map((cs, i) => (
                <div key={i} className="rounded-xl border border-gray-200 bg-white overflow-hidden">
                  <div className="bg-gray-800 px-4 py-2.5">
                    <p className="text-white font-bold text-sm">{cs.companyName}</p>
                    <p className="text-gray-300 text-xs">{cs.companySize}</p>
                  </div>
                  <div className="p-4 space-y-3">
                    <div>
                      <p className="text-xs font-semibold text-red-600 mb-0.5">課題</p>
                      <p className="text-xs text-gray-600 leading-relaxed">{cs.challenge}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-blue-600 mb-0.5">施策</p>
                      <p className="text-xs text-gray-600 leading-relaxed">{cs.solution}</p>
                    </div>
                    <div className="rounded-lg bg-green-50 border border-green-200 px-3 py-2">
                      <p className="text-xs font-semibold text-green-700 mb-0.5">効果</p>
                      <p className="text-xs text-green-800 font-medium">{cs.effect}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* デバイス試算 */}
        {devicePlan && (
          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-4">📱 デバイス推奨プラン</h2>
            <div className="rounded-xl border border-gray-200 bg-white p-6 space-y-5">
              <p className="text-sm text-gray-600">運用スタイル: <strong>{devicePlan.operationStyleLabel}</strong></p>

              {/* 台数 */}
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: '理想台数', value: `${devicePlan.idealDeviceCount}台`, color: 'blue' },
                  { label: '現在の台数', value: `${devicePlan.currentDeviceCount}台`, color: 'gray' },
                  { label: '不足台数', value: `${devicePlan.shortfallCount}台`, color: 'green' },
                ].map((item) => (
                  <div key={item.label} className={`rounded-lg bg-${item.color}-50 border border-${item.color}-200 p-4 text-center`}>
                    <p className={`text-xs text-${item.color}-600 font-medium`}>{item.label}</p>
                    <p className={`text-2xl font-bold text-${item.color}-700 mt-1`}>{item.value}</p>
                  </div>
                ))}
              </div>

              {/* 推奨製品 */}
              <div className="space-y-2">
                <p className="text-sm font-semibold text-gray-700">推奨製品</p>
                {devicePlan.recommendedProducts.map((p, i) => (
                  <div key={i} className={`flex items-center justify-between rounded-lg px-4 py-3 ${i === 0 ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50 border border-gray-200'}`}>
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{p.productName}</p>
                      <p className="text-xs text-gray-500">{p.reason}</p>
                    </div>
                    <p className="text-sm font-bold text-blue-600">¥{p.monthlyUnitPrice.toLocaleString()}<span className="text-xs font-normal">/月・台</span></p>
                  </div>
                ))}
              </div>

              {/* コスト */}
              <div className="rounded-lg bg-gray-50 p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">月額費用（不足{devicePlan.shortfallCount}台）</span>
                  <span className="font-semibold">¥{devicePlan.estimatedMonthlyCost.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">初期費用（キッティング）</span>
                  <span className="font-semibold">¥{devicePlan.estimatedInitialCost.toLocaleString()}</span>
                </div>
                <div className="border-t pt-2 flex justify-between text-sm">
                  <span className="font-semibold text-gray-800">年間総額（税込）</span>
                  <span className="font-bold text-blue-600 text-base">¥{Math.ceil(devicePlan.estimatedTotalCost12m * 1.1).toLocaleString()}</span>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* PPTダウンロードCTA */}
        <div className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-center">
          <p className="text-white font-bold text-lg mb-2">提案資料（PPT）をダウンロード</p>
          <p className="text-blue-100 text-sm mb-4">上記の内容がすべて含まれたPowerPointファイルを生成します</p>
          <Button
            size="lg"
            onClick={handleDownloadPpt}
            disabled={!plan || downloading}
            loading={downloading}
            className="bg-white text-blue-600 hover:bg-blue-50"
          >
            📊 PPTをダウンロード
          </Button>
        </div>

      </main>
    </div>
  )
}
