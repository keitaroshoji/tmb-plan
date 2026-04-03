'use client'

import React, { Suspense, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { WizardShell } from '@/src/components/wizard/WizardShell'
import { StepRouter } from '@/src/components/wizard/StepRouter'
import { useWizardStore, TOTAL_STEPS } from '@/src/store/wizardStore'

function WizardContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { setStep, isComplete } = useWizardStore()

  useEffect(() => {
    if (isComplete) {
      router.replace('/result')
      return
    }
    const stepParam = parseInt(searchParams.get('step') ?? '1')
    const step = Math.min(Math.max(stepParam, 1), TOTAL_STEPS)
    setStep(step)
  }, [searchParams, isComplete, router, setStep])

  return (
    <WizardShell>
      <StepRouter />
    </WizardShell>
  )
}

export default function WizardPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin h-8 w-8 rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    }>
      <WizardContent />
    </Suspense>
  )
}
