'use client'

import React from 'react'
import { StepProgress } from '@/src/components/ui/StepProgress'
import { useWizardStore } from '@/src/store/wizardStore'

interface WizardShellProps {
  children: React.ReactNode
}

export function WizardShell({ children }: WizardShellProps) {
  const currentStep = useWizardStore((s) => s.currentStep)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white border-b border-gray-200">
        <div className="mx-auto max-w-2xl px-6 py-3">
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

      {/* Content */}
      <main className="mx-auto max-w-2xl px-6 py-8">
        {children}
      </main>
    </div>
  )
}
