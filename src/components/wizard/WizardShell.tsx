'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { StepProgress } from '@/src/components/ui/StepProgress'
import { WizardSidebar } from '@/src/components/wizard/WizardSidebar'
import { useWizardStore } from '@/src/store/wizardStore'

interface WizardShellProps {
  children: React.ReactNode
}

export function WizardShell({ children }: WizardShellProps) {
  const router = useRouter()
  const { currentStep, isEditMode, answers, cancelEdit } = useWizardStore()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white border-b border-gray-200">
        <div className="mx-auto max-w-5xl px-6 py-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded bg-blue-600 flex items-center justify-center">
                <span className="text-white text-xs font-bold">T</span>
              </div>
              <span className="text-sm font-semibold text-gray-700">Teachme Biz 運用プランニング</span>
            </div>
          </div>
          <StepProgress currentStep={currentStep} />
        </div>
      </header>

      {/* 再策定バナー */}
      {isEditMode && (
        <div className="bg-amber-50 border-b border-amber-200">
          <div className="mx-auto max-w-5xl px-6 py-2.5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-sm text-amber-800">
              <span className="text-base">✏️</span>
              <span>
                <span className="font-semibold">{answers.companyName || '前回の企業'}</span>
                の情報を更新しています。変更したい項目を修正して、最後まで進むと新しい運用プランが生成されます。
              </span>
            </div>
            <button
              type="button"
              onClick={() => { cancelEdit(); router.push('/result') }}
              className="shrink-0 text-xs text-amber-600 hover:text-amber-800 underline whitespace-nowrap"
            >
              キャンセルして前回プランに戻る
            </button>
          </div>
        </div>
      )}

      {/* Content + Sidebar */}
      <div className="mx-auto max-w-5xl px-6 py-8 flex gap-8 items-start">
        {/* メインコンテンツ */}
        <main className="flex-1 min-w-0">
          {children}
        </main>

        {/* サイドバー（xl以上で表示） */}
        <WizardSidebar />
      </div>
    </div>
  )
}
