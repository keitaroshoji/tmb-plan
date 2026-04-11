import { TmbWizardAnswers } from '@/src/types/answers'
import { HELPFUL_RESOURCES, HelpfulResource } from '@/src/data/helpful-resources'

function scoreResource(resource: HelpfulResource, answers: TmbWizardAnswers): number {
  let score = resource.baseScore

  // 業種マッチ
  if (resource.industries.includes('all') || resource.industries.includes(answers.industry ?? '')) {
    if (!resource.industries.includes('all')) score += 15
  } else {
    return 0 // 業種不一致は除外
  }

  // 課題マッチ
  const challengeMatch = answers.challenges.filter((c) => resource.challenges.includes(c))
  score += challengeMatch.length * 10

  // 利用状況マッチ
  if (resource.usageStatuses.includes('all') || resource.usageStatuses.includes(answers.usageStatus ?? '')) {
    if (!resource.usageStatuses.includes('all')) score += 8
  }

  // 運用障壁マッチ
  const barrierMatch = answers.operationalBarriers.filter((b) => resource.barriers.includes(b))
  score += barrierMatch.length * 6

  // 企業規模マッチ
  if (resource.companySizes.includes('all') || resource.companySizes.includes(answers.companySize ?? '')) {
    if (!resource.companySizes.includes('all')) score += 5
  }

  return score
}

export function matchResources(answers: TmbWizardAnswers, maxResults = 3): HelpfulResource[] {
  return HELPFUL_RESOURCES
    .map((r) => ({ resource: r, score: scoreResource(r, answers) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults)
    .map(({ resource }) => resource)
}
