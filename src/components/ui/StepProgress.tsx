'use client'

import React from 'react'
import { TOTAL_STEPS } from '@/src/store/wizardStore'

const STEP_LABELS = [
  '基本情報',
  '経営課題',
  '導入目的',
  '運用課題',
  '活用シーン',
  'デバイス',
  '運用スタイル',
]

interface StepProgressProps {
  currentStep: number
}

export function StepProgress({ currentStep }: StepProgressProps) {
  const progress = (currentStep / TOTAL_STEPS) * 100

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-xs text-gray-500">
        <span>Step {currentStep} / {TOTAL_STEPS}</span>
        <span>{STEP_LABELS[currentStep - 1]}</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-gray-200">
        <div
          className="h-full rounded-full bg-blue-600 transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  )
}
