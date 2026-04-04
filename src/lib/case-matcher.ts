import { TmbWizardAnswers, CompanySize } from '@/src/types/answers'
import { CaseStudy } from '@/src/types/plan'
import { CASE_STUDIES, CaseStudyData } from '@/src/data/case-studies'

type SizeCategory = 'small' | 'medium' | 'large' | 'enterprise'

function getSizeCategory(companySize: CompanySize | null): SizeCategory {
  switch (companySize) {
    case 'under50': return 'small'
    case 'under200': return 'medium'
    case 'under500': return 'medium'
    case 'under1000': return 'large'
    case 'over1000': return 'enterprise'
    default: return 'medium'
  }
}

function scoreCase(caseStudy: CaseStudyData, answers: TmbWizardAnswers): number {
  let score = 0

  // 業種一致
  if (caseStudy.industry === answers.industry) score += 30

  // 課題一致（1件につき10pt）
  const challengeMatches = caseStudy.challenges.filter((c) => answers.challenges.includes(c))
  score += challengeMatches.length * 10

  // 企業規模近似
  const answerSize = getSizeCategory(answers.companySize)
  if (caseStudy.sizeCategory === answerSize) score += 20
  else if (
    (caseStudy.sizeCategory === 'medium' && answerSize === 'large') ||
    (caseStudy.sizeCategory === 'large' && answerSize === 'medium')
  ) score += 10

  // 活用シーン一致（1件につき5pt）
  const useCaseMatches = caseStudy.useCases.filter((u) => answers.useCases.includes(u))
  score += useCaseMatches.length * 5

  return score
}

export function matchCaseStudies(answers: TmbWizardAnswers, count = 3): CaseStudy[] {
  const scored = CASE_STUDIES.map((c) => ({
    ...c,
    matchScore: scoreCase(c, answers),
  }))

  scored.sort((a, b) => b.matchScore - a.matchScore)

  return scored.slice(0, count).map(({ industry: _i, challenges: _c, useCases: _u, sizeCategory: _s, ...rest }) => rest)
}

export interface CaseHint {
  label: string   // 表示テキスト
  url?: string    // 元記事URL
}

/** トップ3以降の事例をヒントとして返す（最大 extraCount 件） */
export function matchCaseHints(answers: TmbWizardAnswers, skip = 3, extraCount = 7): CaseHint[] {
  const scored = CASE_STUDIES.map((c) => ({
    ...c,
    matchScore: scoreCase(c, answers),
  })).filter((c) => c.matchScore > 0)

  scored.sort((a, b) => b.matchScore - a.matchScore)

  return scored.slice(skip, skip + extraCount).map((c) => ({
    label: `${c.companyName}（${c.companySize}）— ${c.effect}`,
    url: c.url,
  }))
}
