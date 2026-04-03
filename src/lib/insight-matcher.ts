import { TmbWizardAnswers } from '@/src/types/answers'
import { INTERVIEW_INSIGHTS, InterviewInsight } from '@/src/data/interview-insights'

function scoreInsight(insight: InterviewInsight, answers: TmbWizardAnswers): number {
  let score = 0

  // 業種マッチ
  if (insight.industry === answers.industry) score += 30

  // 運用障壁マッチ（最も重要）
  for (const barrier of insight.barriers) {
    if (answers.operationalBarriers.includes(barrier)) score += 20
  }

  // 課題マッチ
  for (const challenge of insight.challenges) {
    if (answers.challenges.includes(challenge)) score += 10
  }

  return score
}

export function matchInsights(answers: TmbWizardAnswers, topN = 3): InterviewInsight[] {
  const scored = INTERVIEW_INSIGHTS
    .map((insight) => ({ insight, score: scoreInsight(insight, answers) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topN)

  return scored.map(({ insight }) => insight)
}
