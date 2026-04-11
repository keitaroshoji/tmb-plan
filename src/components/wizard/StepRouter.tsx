'use client'

import React from 'react'
import { useWizardStore } from '@/src/store/wizardStore'
import { Step01BasicInfo } from './steps/Step01BasicInfo'
import { StepCurrentUsage } from './steps/StepCurrentUsage'
import { StepChallengesGoalsBarriers } from './steps/StepChallengesGoalsBarriers'
import { Step05UseCases } from './steps/Step05UseCases'
import { Step06DeviceEnv } from './steps/Step06DeviceEnv'
import { Step07Operations } from './steps/Step07Operations'

export function StepRouter() {
  const currentStep = useWizardStore((s) => s.currentStep)

  switch (currentStep) {
    case 1: return <Step01BasicInfo />
    case 2: return <StepCurrentUsage />
    case 3: return <StepChallengesGoalsBarriers />
    case 4: return <Step05UseCases />
    case 5: return <Step06DeviceEnv />
    case 6: return <Step07Operations />
    default: return <Step01BasicInfo />
  }
}
