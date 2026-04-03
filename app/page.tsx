'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useWizardStore, ExtractedProfile } from '@/src/store/wizardStore'
import { TmbWizardAnswers } from '@/src/types/answers'

type Mode = 'select' | 'manual' | 'company' | 'memo'

export default function Home() {
  const router = useRouter()
  const { resetWizard, updateAnswers, setExtractedProfile } = useWizardStore()
  const [mode, setMode] = useState<Mode>('select')
  const [companyName, setCompanyName] = useState('')
  const [memoText, setMemoText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleManualStart = () => {
    resetWizard()
    updateAnswers({ entryMode: 'manual' })
    router.push('/wizard?step=1')
  }

  const handleCompanyLookup = async () => {
    if (!companyName.trim()) return
    setLoading(true)
    setError(null)
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 20000)
    try {
      const res = await fetch('/api/analyze-company', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyName: companyName.trim() }),
        signal: controller.signal,
      })
      clearTimeout(timer)
      if (!res.ok) throw new Error()
      const { profile } = await res.json()

      resetWizard()
      setExtractedProfile(profile as ExtractedProfile)

      // 抽出結果をウィザード回答に事前セット
      const partial: Partial<TmbWizardAnswers> = {
        entryMode: 'company',
        companyName: profile.companyName ?? companyName.trim(),
      }
      if (profile.industry) partial.industry = profile.industry
      if (profile.subIndustry) partial.subIndustry = profile.subIndustry
      if (profile.companySize && profile.companySize !== 'unknown') {
        partial.companySize = profile.companySize
      }
      updateAnswers(partial)
      router.push('/wizard?step=1')
    } catch (e) {
      clearTimeout(timer)
      const msg = e instanceof Error && e.name === 'AbortError'
        ? 'タイムアウトしました。手動で入力してください。'
        : '企業情報の取得に失敗しました。手動で入力してください。'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  const handleMemoAnalyze = async () => {
    if (!memoText.trim()) return
    setLoading(true)
    setError(null)
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 20000)
    try {
      const res = await fetch('/api/analyze-memo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memoText: memoText.trim() }),
        signal: controller.signal,
      })
      clearTimeout(timer)
      if (!res.ok) throw new Error()
      const { extracted } = await res.json()

      resetWizard()
      setExtractedProfile(extracted as ExtractedProfile)

      const partial: Partial<TmbWizardAnswers> = {
        entryMode: 'memo',
        memoText: memoText.trim(),
      }
      if (extracted.companyName) partial.companyName = extracted.companyName
      if (extracted.industry) partial.industry = extracted.industry
      if (extracted.companySize && extracted.companySize !== 'unknown') {
        partial.companySize = extracted.companySize
      }
      if (extracted.challenges?.length) partial.challenges = extracted.challenges
      if (extracted.primaryGoal) partial.primaryGoal = extracted.primaryGoal
      if (extracted.currentUseCases) partial.currentUseCases = extracted.currentUseCases
      if (extracted.usageStatus) partial.usageStatus = extracted.usageStatus
      if (extracted.operationalBarriers?.length) partial.operationalBarriers = extracted.operationalBarriers

      updateAnswers(partial)
      router.push('/wizard?step=1')
    } catch (e) {
      clearTimeout(timer)
      const msg = e instanceof Error && e.name === 'AbortError'
        ? 'タイムアウトしました。手動で入力してください。'
        : 'メモの解析に失敗しました。手動で入力してください。'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4 py-8">
      <div className="max-w-2xl w-full">
        {/* ヘッダー */}
        <div className="text-center mb-8">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 mb-4 shadow-lg">
            <span className="text-white text-3xl font-bold">T</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Teachme Biz</h1>
          <p className="text-sm text-gray-500 mt-1">運用プランニング支援ツール</p>
        </div>

        {mode === 'select' && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-1">入力方法を選択</h2>
              <p className="text-sm text-gray-500 mb-5">3つの方法から顧客情報を入力できます</p>

              <div className="grid grid-cols-1 gap-3">
                {/* 手動入力 */}
                <button
                  onClick={() => setMode('manual')}
                  className="flex items-start gap-4 rounded-xl border-2 border-gray-200 hover:border-blue-400 hover:bg-blue-50 p-4 text-left transition-all group"
                >
                  <span className="text-3xl mt-0.5">✏️</span>
                  <div>
                    <p className="font-semibold text-gray-800 group-hover:text-blue-700">手動入力</p>
                    <p className="text-sm text-gray-500 mt-0.5">ウィザードに従ってステップごとに入力する</p>
                  </div>
                  <span className="ml-auto text-gray-400 group-hover:text-blue-400 text-lg mt-1">→</span>
                </button>

                {/* 社名から入力 */}
                <button
                  onClick={() => setMode('company')}
                  className="flex items-start gap-4 rounded-xl border-2 border-gray-200 hover:border-blue-400 hover:bg-blue-50 p-4 text-left transition-all group"
                >
                  <span className="text-3xl mt-0.5">🔍</span>
                  <div>
                    <p className="font-semibold text-gray-800 group-hover:text-blue-700">社名から入力</p>
                    <p className="text-sm text-gray-500 mt-0.5">社名を入力するとAIが業種・規模を推定して自動入力する</p>
                  </div>
                  <span className="ml-auto text-gray-400 group-hover:text-blue-400 text-lg mt-1">→</span>
                </button>

                {/* メモから入力 */}
                <button
                  onClick={() => setMode('memo')}
                  className="flex items-start gap-4 rounded-xl border-2 border-gray-200 hover:border-blue-400 hover:bg-blue-50 p-4 text-left transition-all group"
                >
                  <span className="text-3xl mt-0.5">📋</span>
                  <div>
                    <p className="font-semibold text-gray-800 group-hover:text-blue-700">メモから入力</p>
                    <p className="text-sm text-gray-500 mt-0.5">議事録・ヒアリングメモをそのまま貼り付けてAIが情報を抽出する</p>
                  </div>
                  <span className="ml-auto text-gray-400 group-hover:text-blue-400 text-lg mt-1">→</span>
                </button>
              </div>

              <p className="text-center text-xs text-gray-400 mt-5">所要時間：約5〜10分</p>
            </div>
          </div>
        )}

        {mode === 'manual' && (
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <button onClick={() => setMode('select')} className="text-sm text-gray-500 hover:text-gray-700 mb-4 flex items-center gap-1">
              ← 戻る
            </button>
            <h2 className="text-lg font-semibold text-gray-800 mb-2">手動入力</h2>
            <p className="text-sm text-gray-600 mb-6">
              7つの質問に答えるだけで、AIが最適な運用プランと提案資料（PPT）を自動生成します。
            </p>
            <div className="space-y-2 mb-6">
              {[
                { icon: '🎯', label: '運用フェーズ設計', desc: '導入〜定着までのフェーズ計画' },
                { icon: '🗺️', label: '用途提案・ロードマップ', desc: 'AI分析による拡大提案と展開計画' },
                { icon: '🛡️', label: 'カウンタースクリプト', desc: '費用対効果・解約懸念への対処トーク' },
                { icon: '📅', label: '年間スケジュール', desc: '月次マイルストーンと効果測定タイミング' },
                { icon: '🏢', label: '類似他社事例', desc: '業種・課題が近い事例を自動マッチング' },
                { icon: '📊', label: 'PPT出力', desc: 'そのまま提案できる資料を生成' },
              ].map((item) => (
                <div key={item.label} className="flex items-start gap-3">
                  <span className="text-lg">{item.icon}</span>
                  <div>
                    <span className="text-sm font-medium text-gray-800">{item.label}</span>
                    <span className="text-xs text-gray-500 ml-2">{item.desc}</span>
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={handleManualStart}
              className="w-full rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3.5 text-base transition-colors"
            >
              ウィザードを開始する →
            </button>
          </div>
        )}

        {mode === 'company' && (
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <button onClick={() => setMode('select')} className="text-sm text-gray-500 hover:text-gray-700 mb-4 flex items-center gap-1">
              ← 戻る
            </button>
            <h2 className="text-lg font-semibold text-gray-800 mb-1">社名から入力</h2>
            <p className="text-sm text-gray-500 mb-5">社名を入力するとAIが業種・規模・想定課題を推定します</p>

            <div className="space-y-3 mb-5">
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCompanyLookup()}
                placeholder="例：株式会社カインズ"
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              {error && <p className="text-sm text-red-500">{error}</p>}
            </div>

            <button
              onClick={handleCompanyLookup}
              disabled={!companyName.trim() || loading}
              className="w-full rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-3.5 text-base transition-colors"
            >
              {loading ? '🔍 解析中...' : '🔍 企業情報を取得して開始する'}
            </button>

            <p className="text-xs text-gray-400 mt-3 text-center">
              ※ AIが推定した情報はウィザードで確認・修正できます
            </p>
          </div>
        )}

        {mode === 'memo' && (
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <button onClick={() => setMode('select')} className="text-sm text-gray-500 hover:text-gray-700 mb-4 flex items-center gap-1">
              ← 戻る
            </button>
            <h2 className="text-lg font-semibold text-gray-800 mb-1">メモから入力</h2>
            <p className="text-sm text-gray-500 mb-4">
              商談メモ・議事録・ヒアリングシートなどをそのまま貼り付けてください。
              AIが企業情報・課題・ボトルネックを自動で抽出します。
            </p>

            <textarea
              value={memoText}
              onChange={(e) => setMemoText(e.target.value)}
              placeholder="例）&#13;&#10;・株式会社〇〇様 / 小売業 / 全国50店舗&#13;&#10;・現在は紙マニュアルで運用。新人教育に時間がかかっている&#13;&#10;・IT慣れしていないスタッフが多く、導入が心配&#13;&#10;・まずは5店舗でテストしたい"
              rows={8}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
            />

            {error && <p className="text-sm text-red-500 mt-2">{error}</p>}

            <button
              onClick={handleMemoAnalyze}
              disabled={!memoText.trim() || loading}
              className="w-full mt-4 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-3.5 text-base transition-colors"
            >
              {loading ? '📋 解析中...' : '📋 メモを解析して開始する'}
            </button>

            <p className="text-xs text-gray-400 mt-3 text-center">
              ※ 抽出された情報はウィザードで確認・修正できます（最大3,000文字）
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
