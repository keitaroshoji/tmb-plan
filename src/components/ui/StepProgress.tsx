'use client'

import React from 'react'
import { TOTAL_STEPS } from '@/src/store/wizardStore'

const STEP_LABELS = [
  '基本情報',
  '経営課題',
  '導入目的',
  '利用状況',
  '運用課題',
  '活用シーン',
  'デバイス',
  '運用スタイル',
]

interface StepProgressProps {
  currentStep: number
}

export function StepProgress({ currentStep }: StepProgressProps) {
  return (
    <div className="space-y-2">
      {/* ステップドット */}
      <div className="flex items-center gap-0">
        {STEP_LABELS.map((label, i) => {
          const step = i + 1
          const isDone = step < currentStep
          const isActive = step === currentStep
          return (
            <React.Fragment key={step}>
              {i > 0 && (
                <div className={`flex-1 h-0.5 ${isDone ? 'bg-blue-500' : 'bg-gray-200'}`} />
              )}
              <div className="flex flex-col items-center gap-0.5 shrink-0">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold transition-all
                  ${isActive ? 'bg-blue-600 text-white ring-2 ring-blue-200 ring-offset-1' : isDone ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
                  {isDone ? '✓' : step}
                </div>
                <span className={`text-[9px] leading-none whitespace-nowrap ${isActive ? 'text-blue-600 font-semibold' : isDone ? 'text-blue-400' : 'text-gray-400'}`}>
                  {label}
                </span>
              </div>
            </React.Fragment>
          )
        })}
      </div>
    </div>
  )
}
