'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useWizardStore, ExtractedProfile } from '@/src/store/wizardStore'
import { Button } from '@/src/components/ui/Button'
import { ChoiceCard } from '@/src/components/ui/ChoiceCard'
import { Industry, CompanySize, ManufacturingRegulation } from '@/src/types/answers'
import { RETAIL_SUB_INDUSTRIES, getSubIndustriesForIndustry } from '@/src/data/industry-segments'
import { getDepartmentsForIndustry } from '@/src/data/industry-departments'

const INDUSTRIES: { value: Industry; label: string; icon: string }[] = [
  { value: 'agriculture',  label: '農業・林業',                    icon: '🌾' },
  { value: 'fishing',      label: '漁業',                          icon: '🐟' },
  { value: 'mining',       label: '鉱業・採石業',                   icon: '⛏️' },
  { value: 'construction', label: '建設業',                        icon: '🏗️' },
  { value: 'manufacturing',label: '製造業',                        icon: '🏭' },
  { value: 'utility',      label: '電気・ガス・熱供給・水道業',       icon: '⚡' },
  { value: 'it',           label: '情報通信業',                     icon: '💻' },
  { value: 'logistics',    label: '運輸業・郵便業',                  icon: '🚚' },
  { value: 'retail',       label: '卸売業・小売業',                  icon: '🛍️' },
  { value: 'finance',      label: '金融業・保険業',                  icon: '💰' },
  { value: 'real_estate',  label: '不動産業・物品賃貸業',             icon: '🏠' },
  { value: 'professional', label: '学術研究・専門・技術サービス業',    icon: '🔬' },
  { value: 'food_service', label: '宿泊業・飲食サービス業',           icon: '🍽️' },
  { value: 'beauty',       label: '生活関連サービス業・娯楽業',        icon: '💄' },
  { value: 'education',    label: '教育・学習支援業',                 icon: '📚' },
  { value: 'medical',      label: '医療・福祉',                     icon: '🏥' },
  { value: 'other',        label: 'サービス業（その他）・公務',        icon: '📋' },
]

const MANUFACTURING_REGULATIONS: { value: ManufacturingRegulation; label: string; desc: string }[] = [
  { value: 'iso9001',   label: 'ISO 9001',      desc: '品質マネジメントシステム（汎用）' },
  { value: 'iatf16949', label: 'IATF 16949',    desc: '自動車産業向け品質管理規格' },
  { value: 'gmp_qms',  label: 'GMP / QMS省令', desc: '医薬品・医療機器製造（薬機法）' },
  { value: 'iso14001',  label: 'ISO 14001',      desc: '環境マネジメントシステム' },
  { value: 'other',     label: 'その他の規格',    desc: 'HACCP、ISO 45001 など' },
]

const SIZES: { value: CompanySize; label: string; desc: string }[] = [
  { value: 'under50', label: '〜50名', desc: 'スタートアップ・中小企業' },
  { value: 'under200', label: '50〜200名', desc: '中小〜中堅企業' },
  { value: 'under500', label: '200〜500名', desc: '中堅企業' },
  { value: 'under1000', label: '500〜1,000名', desc: '大企業' },
  { value: 'over1000', label: '1,000名以上', desc: '大企業・グループ企業' },
]

export function Step01BasicInfo() {
  const router = useRouter()
  const { answers, updateAnswers, nextStep, extractedProfile } = useWizardStore()
  const [locationInput, setLocationInput] = useState(String(answers.locationCount ?? 1))

  const subIndustries = getSubIndustriesForIndustry(answers.industry)
  const requiresSubIndustry = subIndustries.length > 0
  const departments = getDepartmentsForIndustry(answers.industry)

  const toggleDepartment = (value: string) => {
    const current = answers.targetDepartments ?? []
    updateAnswers({
      targetDepartments: current.includes(value)
        ? current.filter((d) => d !== value)
        : [...current, value],
    })
  }

  const canProceed =
    answers.companyName.trim().length > 0 &&
    answers.industry !== null &&
    (!requiresSubIndustry || answers.subIndustry !== null) &&
    answers.companySize !== null &&
    answers.isFranchise !== null

  const handleNext = () => {
    nextStep()
    router.push('/wizard?step=2')
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-bold text-gray-900">基本情報</h1>
        <p className="mt-1 text-sm text-gray-500">顧客企業の基本情報を入力してください</p>
      </div>

      {/* AI推定バナー（社名/メモ入力モード時） */}
      {extractedProfile && (answers.entryMode === 'company' || answers.entryMode === 'memo' || answers.entryMode === 'file') && (
        <div className="rounded-lg bg-blue-50 border border-blue-200 px-4 py-3">
          <p className="text-xs font-semibold text-blue-700 mb-1">
            {answers.entryMode === 'company' ? '🔍 社名からAIが情報を推定しました'
              : answers.entryMode === 'file' ? '📄 ファイルからAIが情報を抽出しました'
              : '📋 メモからAIが情報を抽出しました'}
          </p>
          <p className="text-xs text-blue-600">
            {extractedProfile.confidence === 'high' ? '信頼度: 高' : extractedProfile.confidence === 'medium' ? '信頼度: 中' : '信頼度: 低'}
            {extractedProfile.missingFields?.length ? ` ／ 要確認: ${extractedProfile.missingFields.join('、')}` : ''}
          </p>
          {extractedProfile.missingFields?.length ? (
            <p className="text-xs text-blue-500 mt-1">以下の情報を確認・補完してください</p>
          ) : null}
        </div>
      )}

      {/* 企業名 */}
      <div className="space-y-2">
        <label className="text-sm font-semibold text-gray-700">企業名 <span className="text-orange-500">*</span></label>
        <input
          type="text"
          value={answers.companyName}
          onChange={(e) => updateAnswers({ companyName: e.target.value })}
          placeholder="例：株式会社〇〇"
          className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      {/* 業種 */}
      <div className="space-y-3">
        <label className="text-sm font-semibold text-gray-700">業種 <span className="text-orange-500">*</span></label>
        <div className="grid grid-cols-2 gap-2">
          {INDUSTRIES.map((item) => (
            <ChoiceCard
              key={item.value}
              label={item.label}
              icon={item.icon}
              selected={answers.industry === item.value}
              onClick={() => updateAnswers({ industry: item.value, subIndustry: null })}
            />
          ))}
        </div>
      </div>

      {/* サブ業種（小売業など選択時） */}
      {requiresSubIndustry && (
        <div className="space-y-3">
          <label className="text-sm font-semibold text-gray-700">
            業態・セグメント <span className="text-orange-500">*</span>
            <span className="ml-2 text-xs font-normal text-gray-400">（より精度の高いプランを生成します）</span>
          </label>
          <div className="grid grid-cols-1 gap-2">
            {subIndustries.map((item) => {
              const segment = RETAIL_SUB_INDUSTRIES.find((s) => s.value === item.value)
              return (
                <ChoiceCard
                  key={item.value}
                  label={item.label}
                  icon={item.icon}
                  description={segment ? `${segment.managementModel}｜${segment.standardizationTarget}` : undefined}
                  selected={answers.subIndustry === item.value}
                  onClick={() => updateAnswers({ subIndustry: item.value })}
                />
              )
            })}
          </div>
          {/* 選択済みセグメントの「初手の問い」表示 */}
          {answers.subIndustry && (() => {
            const seg = RETAIL_SUB_INDUSTRIES.find((s) => s.value === answers.subIndustry)
            return seg ? (
              <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3">
                <p className="text-xs font-semibold text-amber-700 mb-0.5">このセグメントの初手の問い</p>
                <p className="text-sm text-amber-800">{seg.openingQuestion}</p>
              </div>
            ) : null
          })()}
        </div>
      )}

      {/* 製造業向け規格（製造業選択時のみ） */}
      {answers.industry === 'manufacturing' && (
        <div className="space-y-3">
          <label className="text-sm font-semibold text-gray-700">
            考慮すべき規格・基準
            <span className="ml-2 text-xs font-normal text-gray-400">（任意・該当するものを選択）</span>
          </label>
          <div className="grid grid-cols-1 gap-2">
            {MANUFACTURING_REGULATIONS.map((item) => {
              const selected = answers.manufacturingRegulations.includes(item.value)
              return (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => {
                    const regs = answers.manufacturingRegulations
                    updateAnswers({
                      manufacturingRegulations: selected
                        ? regs.filter((r) => r !== item.value)
                        : [...regs, item.value],
                    })
                  }}
                  className={`w-full text-left rounded-lg border px-4 py-3 transition-colors ${
                    selected
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className={`text-sm font-semibold ${selected ? 'text-blue-700' : 'text-gray-800'}`}>
                        {item.label}
                      </span>
                      <span className="ml-2 text-xs text-gray-400">{item.desc}</span>
                    </div>
                    {selected && <span className="text-blue-500 text-sm">✓</span>}
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* 活用対象部門（業種選択後に表示） */}
      {answers.industry && departments.length > 0 && (
        <div className="space-y-3">
          <div>
            <label className="text-sm font-semibold text-gray-700">
              Teachme Biz活用を想定する部門
              <span className="ml-2 text-xs font-normal text-gray-400">（複数選択可・任意）</span>
            </label>
            <p className="mt-0.5 text-xs text-gray-400">選択した部門に合わせた運用シナリオを提案します</p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {departments.map((dept) => {
              const selected = (answers.targetDepartments ?? []).includes(dept.value)
              return (
                <button
                  key={dept.value}
                  type="button"
                  onClick={() => toggleDepartment(dept.value)}
                  className={`flex items-center gap-2 rounded-lg border px-3 py-2.5 text-left text-sm transition-colors ${
                    selected
                      ? 'border-blue-500 bg-blue-50 text-blue-700 font-medium'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span>{dept.icon}</span>
                  <span>{dept.label}</span>
                  {selected && <span className="ml-auto text-blue-500 text-xs">✓</span>}
                </button>
              )
            })}
          </div>
          {(answers.targetDepartments ?? []).length > 0 && (
            <p className="text-xs text-blue-600">{(answers.targetDepartments ?? []).length}部門選択中</p>
          )}
        </div>
      )}

      {/* 企業規模 + 拠点数（2カラム） */}
      <div className="grid grid-cols-2 gap-5 items-start">
        {/* 企業規模 */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700">従業員規模 <span className="text-orange-500">*</span></label>
          <div className="flex flex-col gap-1.5">
            {SIZES.map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => updateAnswers({ companySize: item.value })}
                className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
                  answers.companySize === item.value
                    ? 'border-blue-500 bg-blue-50 text-blue-700 font-medium'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="flex-1 font-medium text-sm">{item.label}</span>
                {answers.companySize === item.value && <span className="text-blue-500 text-xs">✓</span>}
              </button>
            ))}
          </div>
        </div>

        {/* 拠点数 + FC + 開始年月 */}
        <div className="space-y-4">
          {/* 拠点数 */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-gray-700">拠点・店舗数</label>
            <p className="text-xs text-gray-400">活用を想定する拠点・店舗数</p>
            <div className="flex items-center gap-2">
              <input
                type="text"
                inputMode="numeric"
                value={locationInput}
                onChange={(e) => {
                  const raw = e.target.value.replace(/[^0-9]/g, '')
                  setLocationInput(raw)
                  const val = parseInt(raw, 10)
                  if (!isNaN(val) && val >= 1) updateAnswers({ locationCount: val })
                }}
                onBlur={() => {
                  const val = parseInt(locationInput, 10)
                  const fixed = isNaN(val) || val < 1 ? 1 : val
                  setLocationInput(String(fixed))
                  updateAnswers({ locationCount: fixed })
                }}
                placeholder="例：5"
                className="w-24 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-500">拠点</span>
            </div>
          </div>

          {/* FC */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-gray-700">FC事業者？ <span className="text-orange-500">*</span></label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => updateAnswers({ isFranchise: true })}
                className={`flex-1 rounded-lg border py-2 text-sm font-medium transition-colors ${
                  answers.isFranchise === true
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                }`}
              >
                🏪 あり
              </button>
              <button
                type="button"
                onClick={() => updateAnswers({ isFranchise: false })}
                className={`flex-1 rounded-lg border py-2 text-sm font-medium transition-colors ${
                  answers.isFranchise === false
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                }`}
              >
                🏢 なし
              </button>
            </div>
          </div>

          {/* プロジェクト開始年月 */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-gray-700">
              開始年月
              <span className="ml-1.5 text-xs font-normal text-gray-400">（任意）</span>
            </label>
            <p className="text-xs text-gray-400">スケジュールのカレンダー表記に使用</p>
            <div className="flex items-center gap-1.5">
              <select
                value={answers.projectStartDate ? answers.projectStartDate.split('-')[0] : ''}
                onChange={(e) => {
                  const year = e.target.value
                  const month = answers.projectStartDate ? answers.projectStartDate.split('-')[1] : '01'
                  updateAnswers({ projectStartDate: year ? `${year}-${month}` : '' })
                }}
                className="rounded-lg border border-gray-300 px-2 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">年</option>
                {Array.from({ length: 8 }, (_, i) => 2025 + i).map((y) => (
                  <option key={y} value={String(y)}>{y}</option>
                ))}
              </select>
              <span className="text-xs text-gray-400">年</span>
              <select
                value={answers.projectStartDate ? answers.projectStartDate.split('-')[1] : ''}
                onChange={(e) => {
                  const month = e.target.value
                  const year = answers.projectStartDate ? answers.projectStartDate.split('-')[0] : String(new Date().getFullYear())
                  updateAnswers({ projectStartDate: month && year ? `${year}-${month.padStart(2, '0')}` : '' })
                }}
                className="rounded-lg border border-gray-300 px-2 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">月</option>
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                  <option key={m} value={String(m).padStart(2, '0')}>{m}</option>
                ))}
              </select>
              <span className="text-xs text-gray-400">月</span>
            </div>
          </div>
        </div>
      </div>

      {/* 大企業向け部門入力 */}
      {answers.companySize === 'over1000' && (
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700">
            対象部門・事業部
            <span className="ml-2 text-xs font-normal text-gray-400">（任意）</span>
          </label>
          <input
            type="text"
            value={answers.departmentNote}
            onChange={(e) => updateAnswers({ departmentNote: e.target.value })}
            placeholder="例：製造本部 品質管理部、または全社展開"
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      )}

      <div className="flex justify-end pt-4">
        <Button onClick={handleNext} disabled={!canProceed} size="lg">
          次へ →
        </Button>
      </div>
    </div>
  )
}
