'use client'

import React from 'react'
import { useWizardStore } from '@/src/store/wizardStore'
import { Step01BasicInfo } from './steps/Step01BasicInfo'
import { Step02Challenges } from './steps/Step02Challenges'
import { Step03Goals } from './steps/Step03Goals'
import { StepCurrentUsage } from './steps/StepCurrentUsage'
import { Step04Barriers } from './steps/Step04Barriers'
import { Step05UseCases } from './steps/Step05UseCases'
import { Step06DeviceEnv } from './steps/Step06DeviceEnv'
import { Step07Operations } from './steps/Step07Operations'

export function StepRouter() {
  const currentStep = useWizardStore((s) => s.currentStep)

  switch (currentStep) {
    case 1: return <Step01BasicInfo />
    case 2: return <Step02Challenges />
    case 3: return <Step03Goals />
    case 4: return <StepCurrentUsage />
    case 5: return <Step04Barriers />
    case 6: return <Step05UseCases />
    case 7: return <Step06DeviceEnv />
    case 8: return <Step07Operations />
    default: return <Step01BasicInfo />
  }
}
