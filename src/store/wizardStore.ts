import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { TmbWizardAnswers, INITIAL_ANSWERS } from '@/src/types/answers'
import { GeneratedPlan, CaseStudy } from '@/src/types/plan'

export const TOTAL_STEPS = 6

// メモ解析・社名解析の抽出結果
export interface ExtractedProfile {
  companyName?: string
  industry?: string
  subIndustry?: string
  companySize?: string
  challenges?: string[]
  primaryGoal?: string
  currentUseCases?: string
  bottleneckHints?: { area: string; hint: string; severity: string }[]
  missingFields?: string[]
  confidence?: 'high' | 'medium' | 'low'
}

export type RoadmapStartPoint = 'none' | 'partial' | 'active' | 'expanding'

interface WizardState {
  currentStep: number
  answers: TmbWizardAnswers
  isComplete: boolean
  isEditMode: boolean   // 再策定モード中フラグ
  isGenerating: boolean
  generatedPlan: GeneratedPlan | null
  matchedCases: CaseStudy[]

  // v2追加状態
  extractedProfile: ExtractedProfile | null  // 社名解析・メモ解析の結果
  roadmapStartPoint: RoadmapStartPoint        // ロードマップ開始点

  // Navigation
  setStep: (step: number) => void
  nextStep: () => void
  prevStep: () => void

  // Answers
  updateAnswers: (partial: Partial<TmbWizardAnswers>) => void

  // Completion
  completeWizard: () => void
  setGenerating: (v: boolean) => void
  setPlan: (plan: GeneratedPlan) => void
  setCases: (cases: CaseStudy[]) => void

  // v2追加メソッド
  setExtractedProfile: (profile: ExtractedProfile | null) => void
  setRoadmapStartPoint: (point: RoadmapStartPoint) => void

  // Plan management
  clearPlan: () => void

  // Reset
  resetWizard: () => void
  startEdit: (step: number) => void
  cancelEdit: () => void
}

export const useWizardStore = create<WizardState>()(
  persist(
    (set, get) => ({
      currentStep: 1,
      answers: INITIAL_ANSWERS,
      isComplete: false,
      isEditMode: false,
      isGenerating: false,
      generatedPlan: null,
      matchedCases: [],
      extractedProfile: null,
      roadmapStartPoint: 'none',

      setStep: (step) => set({ currentStep: step }),
      nextStep: () => {
        const next = Math.min(get().currentStep + 1, TOTAL_STEPS)
        set({ currentStep: next })
      },
      prevStep: () => {
        const prev = Math.max(get().currentStep - 1, 1)
        set({ currentStep: prev })
      },

      updateAnswers: (partial) =>
        set((state) => ({ answers: { ...state.answers, ...partial } })),

      completeWizard: () => set({ isComplete: true, isEditMode: false }),
      setGenerating: (v) => set({ isGenerating: v }),
      setPlan: (plan) => set({ generatedPlan: plan }),
      setCases: (cases) => set({ matchedCases: cases }),

      setExtractedProfile: (profile) => set({ extractedProfile: profile }),
      setRoadmapStartPoint: (point) => set({ roadmapStartPoint: point }),

      clearPlan: () => set({ generatedPlan: null }),

      resetWizard: () =>
        set({
          currentStep: 1,
          answers: INITIAL_ANSWERS,
          isComplete: false,
          isEditMode: false,
          isGenerating: false,
          generatedPlan: null,
          matchedCases: [],
          extractedProfile: null,
          roadmapStartPoint: 'none',
        }),

      startEdit: (step) =>
        set({ currentStep: step, isComplete: false, isEditMode: true, generatedPlan: null }),

      cancelEdit: () =>
        set({ isComplete: true, isEditMode: false }),
    }),
    {
      name: 'tmb-wizard-store',
      storage: createJSONStorage(() => {
        // localStorage へのアクセスを try-catch でラップ（プライベートブラウジング等での SSR エラー対策）
        try {
          return localStorage
        } catch {
          // フォールバック: インメモリストレージ
          const mem: Record<string, string> = {}
          return {
            getItem: (k: string) => mem[k] ?? null,
            setItem: (k: string, v: string) => { mem[k] = v },
            removeItem: (k: string) => { delete mem[k] },
          }
        }
      }),
      version: 6,
      migrate: (persistedState: unknown, version: number) => {
        let state = persistedState as WizardState
        if (version <= 1) {
          // v1→v2: 新フィールドを追加
          state = {
            ...state,
            extractedProfile: null,
            roadmapStartPoint: 'none' as RoadmapStartPoint,
            answers: {
              ...state.answers,
              entryMode: 'manual' as const,
              subIndustry: null,
              departmentNote: '',
              usageStatus: null,
              currentUseCases: '',
              memoText: '',
            },
          }
        }
        if (version <= 2) {
          // v2→v3: projectStartDate を追加
          state = {
            ...state,
            answers: {
              ...state.answers,
              projectStartDate: '',
            },
          }
        }
        if (version <= 3) {
          // v3→v4: contractPlan / contractAddons を追加
          state = {
            ...state,
            answers: {
              ...state.answers,
              contractPlan: null,
              contractAddons: [],
            },
          }
        }
        if (version <= 4) {
          // v4→v5: targetDepartments / *Note フィールドを追加
          state = {
            ...state,
            answers: {
              ...state.answers,
              targetDepartments: [],
              challengeNote: '',
              goalNote: '',
              barrierNote: '',
            },
          }
        }
        if (version <= 5) {
          // v5→v6: ステップ数を8→6に変更、currentStep をリセット
          state = {
            ...state,
            currentStep: 1,
          }
        }
        return state
      },
    }
  )
)
