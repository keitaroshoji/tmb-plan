import { TmbWizardAnswers } from '@/src/types/answers'

export function isGmpRelevant(answers: TmbWizardAnswers): boolean {
  // 製造業で GMP/QMS を明示的に選択した場合のみ
  return (
    answers.industry === 'manufacturing' &&
    (answers.manufacturingRegulations ?? []).includes('gmp_qms')
  )
}
