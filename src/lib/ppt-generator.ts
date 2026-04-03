import PptxGenJS from 'pptxgenjs'
import { TmbWizardAnswers } from '@/src/types/answers'
import { GeneratedPlan, CaseStudy } from '@/src/types/plan'
import { DevicePlan } from './device-recommender'

const BLUE = '1E40AF'
const LIGHT_BLUE = 'DBEAFE'
const DARK = '1F2937'
const GRAY = '6B7280'
const WHITE = 'FFFFFF'
const GREEN = '059669'
const LIGHT_GREEN = 'D1FAE5'

function addTitleSlide(prs: PptxGenJS, answers: TmbWizardAnswers) {
  const slide = prs.addSlide()
  slide.background = { color: BLUE }

  // タイトル
  slide.addText('Teachme Biz\n運用プランのご提案', {
    x: 0.8, y: 1.2, w: 8.4, h: 1.8,
    fontSize: 32, bold: true, color: WHITE,
    align: 'left', valign: 'middle',
  })

  // 顧客名
  slide.addText(answers.companyName + ' 様', {
    x: 0.8, y: 3.2, w: 8.4, h: 0.6,
    fontSize: 20, color: LIGHT_BLUE, align: 'left',
  })

  // 日付
  const today = new Date().toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' })
  slide.addText(today, {
    x: 0.8, y: 4.0, w: 8.4, h: 0.4,
    fontSize: 12, color: LIGHT_BLUE, align: 'left',
  })
}

function addChallengeSummarySlide(prs: PptxGenJS, answers: TmbWizardAnswers) {
  const slide = prs.addSlide()
  slide.background = { color: WHITE }

  slide.addText('顧客課題の整理', {
    x: 0.5, y: 0.3, w: 9, h: 0.6,
    fontSize: 20, bold: true, color: BLUE,
  })
  slide.addShape(prs.ShapeType.line, { x: 0.5, y: 0.95, w: 9, h: 0, line: { color: BLUE, width: 2 } })

  const CHALLENGE_LABELS: Record<string, string> = {
    talent_development: '人材育成・研修の効率化',
    standardization: '品質・サービスの標準化',
    knowledge_transfer: '技術・ノウハウの伝承',
    manual_creation: 'マニュアル作成・更新の負担',
    foreign_staff: '外国人・多様な人材への教育',
    cost_reduction: 'コスト削減',
    iso_compliance: 'ISO・法令対応',
    multi_store: '多店舗・多拠点への展開',
    remote_management: '遠隔管理・モニタリング',
    security: 'セキュリティ強化',
  }

  // 経営課題
  slide.addText('■ 経営課題', { x: 0.5, y: 1.1, w: 4, h: 0.35, fontSize: 12, bold: true, color: BLUE })
  answers.challenges.slice(0, 5).forEach((c, i) => {
    slide.addText(`• ${CHALLENGE_LABELS[c] ?? c}`, {
      x: 0.5, y: 1.5 + i * 0.38, w: 4.2, h: 0.35,
      fontSize: 11, color: DARK,
    })
  })

  // 導入目的
  const GOAL_LABELS: Record<string, string> = {
    reduce_training_time: '研修・教育時間の削減',
    standardize_quality: '品質・サービスの標準化',
    eliminate_dependency: '業務の属人化解消',
    reduce_cost: 'コスト削減',
    improve_compliance: 'コンプライアンス対応',
    support_foreign_staff: '外国人・多様な人材支援',
    dx_promotion: '現場DX推進',
  }
  slide.addText('■ 導入目的・KPI', { x: 5.0, y: 1.1, w: 4, h: 0.35, fontSize: 12, bold: true, color: BLUE })
  slide.addText(`目的: ${GOAL_LABELS[answers.primaryGoal ?? ''] ?? ''}`, { x: 5.0, y: 1.5, w: 4.2, h: 0.35, fontSize: 11, color: DARK })
  if (answers.targetValue) {
    slide.addText(`目標: ${answers.targetValue}`, { x: 5.0, y: 1.9, w: 4.2, h: 0.35, fontSize: 11, color: DARK })
  }

  // 企業概要バナー
  slide.addShape(prs.ShapeType.rect, { x: 0.5, y: 4.5, w: 9, h: 0.8, fill: { color: LIGHT_BLUE } })
  const PERIOD_LABELS: Record<string, string> = { '3months': '3ヶ月', '6months': '6ヶ月', '12months': '1年' }
  slide.addText(
    `${answers.companyName}  ／  ${answers.locationCount}拠点  ／  ${answers.isFranchise ? 'FC事業者' : '独立事業'}  ／  重点期間: ${PERIOD_LABELS[answers.planningPeriod ?? ''] ?? ''}`,
    { x: 0.5, y: 4.55, w: 9, h: 0.6, fontSize: 11, color: BLUE, bold: true, align: 'center' }
  )
}

function addOperationPlanSlide(prs: PptxGenJS, plan: GeneratedPlan) {
  const slide = prs.addSlide()
  slide.background = { color: WHITE }

  slide.addText('推奨 運用プラン', {
    x: 0.5, y: 0.3, w: 9, h: 0.6,
    fontSize: 20, bold: true, color: BLUE,
  })
  slide.addShape(prs.ShapeType.line, { x: 0.5, y: 0.95, w: 9, h: 0, line: { color: BLUE, width: 2 } })

  if (plan.summary) {
    slide.addText(plan.summary, {
      x: 0.5, y: 1.05, w: 9, h: 0.55,
      fontSize: 10, color: GRAY, italic: true,
    })
  }

  const colW = 9 / Math.max(plan.phases.length, 1)
  plan.phases.forEach((phase, i) => {
    const x = 0.5 + i * colW
    const y = 1.7

    // フェーズヘッダー
    slide.addShape(prs.ShapeType.rect, { x, y, w: colW - 0.1, h: 0.5, fill: { color: BLUE } })
    slide.addText(phase.name, {
      x, y, w: colW - 0.1, h: 0.5,
      fontSize: 10, bold: true, color: WHITE, align: 'center', valign: 'middle',
    })

    // 期間
    slide.addText(phase.period, {
      x, y: y + 0.52, w: colW - 0.1, h: 0.3,
      fontSize: 9, color: BLUE, align: 'center',
    })

    // ゴール
    slide.addShape(prs.ShapeType.rect, { x, y: y + 0.84, w: colW - 0.1, h: 0.48, fill: { color: LIGHT_BLUE } })
    slide.addText(phase.goal, {
      x, y: y + 0.84, w: colW - 0.1, h: 0.48,
      fontSize: 9, color: BLUE, align: 'center', valign: 'middle',
    })

    // アクション
    phase.actions.slice(0, 3).forEach((action, j) => {
      slide.addText(`▸ ${action.title}`, {
        x: x + 0.05, y: y + 1.4 + j * 0.55, w: colW - 0.15, h: 0.25,
        fontSize: 9, bold: true, color: DARK,
      })
      slide.addText(action.description, {
        x: x + 0.1, y: y + 1.65 + j * 0.55, w: colW - 0.2, h: 0.25,
        fontSize: 8, color: GRAY,
      })
    })
  })
}

function addScheduleSlide(prs: PptxGenJS, plan: GeneratedPlan) {
  const slide = prs.addSlide()
  slide.background = { color: WHITE }

  slide.addText('年間スケジュール', {
    x: 0.5, y: 0.3, w: 9, h: 0.6,
    fontSize: 20, bold: true, color: BLUE,
  })
  slide.addShape(prs.ShapeType.line, { x: 0.5, y: 0.95, w: 9, h: 0, line: { color: BLUE, width: 2 } })

  const months = plan.schedule.slice(0, 12)
  const cols = months.length <= 6 ? months.length : 6
  const rows = Math.ceil(months.length / cols)
  const cellW = 9 / cols
  const cellH = (4.5) / rows

  months.forEach((m, i) => {
    const col = i % cols
    const row = Math.floor(i / cols)
    const x = 0.5 + col * cellW
    const y = 1.1 + row * cellH

    const bgColor = m.isReviewPoint ? LIGHT_GREEN : LIGHT_BLUE
    const borderColor = m.isReviewPoint ? GREEN : BLUE

    slide.addShape(prs.ShapeType.rect, { x, y, w: cellW - 0.08, h: cellH - 0.08, fill: { color: bgColor }, line: { color: borderColor, width: 1 } })
    slide.addText(`${m.month}ヶ月目`, { x, y: y + 0.04, w: cellW - 0.08, h: 0.22, fontSize: 8, bold: true, color: borderColor, align: 'center' })
    slide.addText(m.title, { x: x + 0.05, y: y + 0.26, w: cellW - 0.13, h: 0.22, fontSize: 8, bold: true, color: DARK, align: 'center' })

    const actionsText = m.actions.slice(0, 2).map((a) => `• ${a}`).join('\n')
    slide.addText(actionsText, {
      x: x + 0.05, y: y + 0.5, w: cellW - 0.13, h: cellH - 0.65,
      fontSize: 7, color: DARK, align: 'left',
    })

    if (m.isReviewPoint) {
      slide.addText('📊 効果測定', {
        x, y: y + cellH - 0.26, w: cellW - 0.08, h: 0.2,
        fontSize: 7, bold: true, color: GREEN, align: 'center',
      })
    }
  })
}

function addCaseStudySlide(prs: PptxGenJS, cases: CaseStudy[], slideIndex: number) {
  const cs = cases[slideIndex]
  if (!cs) return

  const slide = prs.addSlide()
  slide.background = { color: WHITE }

  slide.addText(`導入事例 ${slideIndex + 1}`, {
    x: 0.5, y: 0.3, w: 9, h: 0.6,
    fontSize: 20, bold: true, color: BLUE,
  })
  slide.addShape(prs.ShapeType.line, { x: 0.5, y: 0.95, w: 9, h: 0, line: { color: BLUE, width: 2 } })

  // 企業情報
  slide.addShape(prs.ShapeType.rect, { x: 0.5, y: 1.0, w: 9, h: 0.55, fill: { color: BLUE } })
  slide.addText(`${cs.companyName}  ／  ${cs.industry}  ／  ${cs.companySize}`, {
    x: 0.5, y: 1.0, w: 9, h: 0.55,
    fontSize: 13, bold: true, color: WHITE, align: 'center', valign: 'middle',
  })

  // 課題・施策・効果の3列
  const sections = [
    { label: '課題', text: cs.challenge, color: '#FEE2E2', borderColor: '#EF4444' },
    { label: '施策', text: cs.solution, color: '#EFF6FF', borderColor: BLUE },
    { label: '効果', text: cs.effect, color: LIGHT_GREEN, borderColor: GREEN },
  ]

  sections.forEach((sec, i) => {
    const x = 0.5 + i * 3.05
    slide.addShape(prs.ShapeType.rect, { x, y: 1.7, w: 2.9, h: 0.4, fill: { color: sec.borderColor } })
    slide.addText(sec.label, { x, y: 1.7, w: 2.9, h: 0.4, fontSize: 12, bold: true, color: WHITE, align: 'center', valign: 'middle' })
    slide.addShape(prs.ShapeType.rect, { x, y: 2.15, w: 2.9, h: 2.5, fill: { color: sec.color }, line: { color: sec.borderColor, width: 1 } })
    slide.addText(sec.text, { x: x + 0.1, y: 2.2, w: 2.7, h: 2.4, fontSize: 10, color: DARK, align: 'left', valign: 'top' })
  })

  // 定性効果
  if (cs.qualitativeEffect) {
    slide.addText(`💬 ${cs.qualitativeEffect}`, {
      x: 0.5, y: 4.8, w: 9, h: 0.45,
      fontSize: 10, color: GRAY, italic: true,
    })
  }
}

function addDeviceSlide(prs: PptxGenJS, devicePlan: DevicePlan) {
  const slide = prs.addSlide()
  slide.background = { color: WHITE }

  slide.addText('デバイス推奨プラン', {
    x: 0.5, y: 0.3, w: 9, h: 0.6,
    fontSize: 20, bold: true, color: BLUE,
  })
  slide.addShape(prs.ShapeType.line, { x: 0.5, y: 0.95, w: 9, h: 0, line: { color: BLUE, width: 2 } })

  // 運用スタイル
  slide.addText(`運用スタイル: ${devicePlan.operationStyleLabel}`, {
    x: 0.5, y: 1.05, w: 9, h: 0.35,
    fontSize: 11, color: BLUE, bold: true,
  })

  // 台数サマリー
  slide.addShape(prs.ShapeType.rect, { x: 0.5, y: 1.45, w: 2.6, h: 1.0, fill: { color: LIGHT_BLUE } })
  slide.addText('理想台数', { x: 0.5, y: 1.5, w: 2.6, h: 0.3, fontSize: 9, color: BLUE, align: 'center' })
  slide.addText(`${devicePlan.idealDeviceCount} 台`, { x: 0.5, y: 1.8, w: 2.6, h: 0.5, fontSize: 22, bold: true, color: BLUE, align: 'center' })

  slide.addShape(prs.ShapeType.rect, { x: 3.3, y: 1.45, w: 2.6, h: 1.0, fill: { color: '#F3F4F6' } })
  slide.addText('現在の台数', { x: 3.3, y: 1.5, w: 2.6, h: 0.3, fontSize: 9, color: GRAY, align: 'center' })
  slide.addText(`${devicePlan.currentDeviceCount} 台`, { x: 3.3, y: 1.8, w: 2.6, h: 0.5, fontSize: 22, bold: true, color: GRAY, align: 'center' })

  slide.addShape(prs.ShapeType.rect, { x: 6.1, y: 1.45, w: 2.9, h: 1.0, fill: { color: LIGHT_GREEN } })
  slide.addText('不足台数', { x: 6.1, y: 1.5, w: 2.9, h: 0.3, fontSize: 9, color: GREEN, align: 'center' })
  slide.addText(`${devicePlan.shortfallCount} 台`, { x: 6.1, y: 1.8, w: 2.9, h: 0.5, fontSize: 22, bold: true, color: GREEN, align: 'center' })

  // 推奨製品
  slide.addText('■ 推奨製品', { x: 0.5, y: 2.65, w: 9, h: 0.35, fontSize: 12, bold: true, color: DARK })
  devicePlan.recommendedProducts.slice(0, 3).forEach((p, i) => {
    slide.addShape(prs.ShapeType.rect, { x: 0.5, y: 3.05 + i * 0.55, w: 9, h: 0.48, fill: { color: i === 0 ? LIGHT_BLUE : '#F9FAFB' }, line: { color: '#E5E7EB', width: 1 } })
    slide.addText(p.productName, { x: 0.7, y: 3.1 + i * 0.55, w: 4, h: 0.22, fontSize: 10, bold: true, color: DARK })
    slide.addText(p.reason, { x: 0.7, y: 3.3 + i * 0.55, w: 5.5, h: 0.18, fontSize: 8, color: GRAY })
    slide.addText(`¥${p.monthlyUnitPrice.toLocaleString()}/月・台`, { x: 6.8, y: 3.1 + i * 0.55, w: 2.5, h: 0.38, fontSize: 11, bold: true, color: BLUE, align: 'right', valign: 'middle' })
  })
}

function addInvestmentSummarySlide(prs: PptxGenJS, devicePlan: DevicePlan) {
  const slide = prs.addSlide()
  slide.background = { color: WHITE }

  slide.addText('投資サマリー', {
    x: 0.5, y: 0.3, w: 9, h: 0.6,
    fontSize: 20, bold: true, color: BLUE,
  })
  slide.addShape(prs.ShapeType.line, { x: 0.5, y: 0.95, w: 9, h: 0, line: { color: BLUE, width: 2 } })

  const items = [
    { label: '月額費用（税抜）', value: `¥${devicePlan.estimatedMonthlyCost.toLocaleString()}` },
    { label: '初期費用（キッティング）', value: `¥${devicePlan.estimatedInitialCost.toLocaleString()}` },
    { label: '年間総額（12ヶ月）', value: `¥${devicePlan.estimatedTotalCost12m.toLocaleString()}`, highlight: true },
    { label: '税込年間総額（10%）', value: `¥${Math.ceil(devicePlan.estimatedTotalCost12m * 1.1).toLocaleString()}`, highlight: true },
  ]

  items.forEach((item, i) => {
    const y = 1.2 + i * 0.85
    const bgColor = item.highlight ? LIGHT_BLUE : '#F9FAFB'
    const textColor = item.highlight ? BLUE : DARK
    slide.addShape(prs.ShapeType.rect, { x: 1, y, w: 8, h: 0.7, fill: { color: bgColor }, line: { color: '#E5E7EB', width: 1 } })
    slide.addText(item.label, { x: 1.2, y, w: 4, h: 0.7, fontSize: 12, color: GRAY, valign: 'middle' })
    slide.addText(item.value, { x: 5, y, w: 3.8, h: 0.7, fontSize: 16, bold: item.highlight, color: textColor, align: 'right', valign: 'middle' })
  })

  slide.addText('※ デバイスレンタルサービス料金（Studist提供）の概算です。実際の見積は別途ご案内します。', {
    x: 0.5, y: 4.8, w: 9, h: 0.35,
    fontSize: 9, color: GRAY, italic: true,
  })
}

function addUseCaseProposalsSlide(prs: PptxGenJS, plan: GeneratedPlan) {
  if (!plan.useCaseProposals?.length) return
  const slide = prs.addSlide()
  slide.background = { color: WHITE }

  slide.addText('用途提案', {
    x: 0.5, y: 0.3, w: 9, h: 0.6,
    fontSize: 20, bold: true, color: BLUE,
  })
  slide.addShape(prs.ShapeType.line, { x: 0.5, y: 0.95, w: 9, h: 0, line: { color: BLUE, width: 2 } })

  const PRIORITY_COLORS: Record<string, string> = { high: 'FEE2E2', medium: 'FEF3C7', low: 'F3F4F6' }
  const EFFORT_LABELS: Record<string, string> = { easy: '導入: 簡単', medium: '導入: 中程度', hard: '導入: 難しい' }

  const proposals = plan.useCaseProposals.slice(0, 6)
  const cols = Math.min(proposals.length, 3)
  const colW = 9 / cols

  proposals.forEach((p, i) => {
    const col = i % cols
    const row = Math.floor(i / cols)
    const x = 0.5 + col * colW
    const y = 1.1 + row * 1.8
    const bgColor = PRIORITY_COLORS[p.priority] ?? PRIORITY_COLORS.medium

    slide.addShape(prs.ShapeType.rect, {
      x, y, w: colW - 0.15, h: 1.6,
      fill: { color: bgColor }, line: { color: '#E5E7EB', width: 1 },
    })
    slide.addText(p.title, {
      x: x + 0.1, y: y + 0.1, w: colW - 0.35, h: 0.35,
      fontSize: 11, bold: true, color: DARK,
    })
    slide.addText(EFFORT_LABELS[p.effort] ?? '', {
      x: x + 0.1, y: y + 0.45, w: colW - 0.35, h: 0.25,
      fontSize: 9, color: GRAY,
    })
    slide.addText(p.description, {
      x: x + 0.1, y: y + 0.7, w: colW - 0.35, h: 0.8,
      fontSize: 9, color: DARK, align: 'left', valign: 'top',
    })
  })
}

function addRoadmapSlide(prs: PptxGenJS, plan: GeneratedPlan) {
  if (!plan.roadmap?.length) return
  const slide = prs.addSlide()
  slide.background = { color: WHITE }

  slide.addText('ロードマップ', {
    x: 0.5, y: 0.3, w: 9, h: 0.6,
    fontSize: 20, bold: true, color: BLUE,
  })
  slide.addShape(prs.ShapeType.line, { x: 0.5, y: 0.95, w: 9, h: 0, line: { color: BLUE, width: 2 } })

  const phases = plan.roadmap.slice(0, 4)
  const colW = 9 / phases.length

  phases.forEach((phase, i) => {
    const x = 0.5 + i * colW
    const isFirst = i === 0

    // フェーズヘッダー
    slide.addShape(prs.ShapeType.rect, {
      x, y: 1.05, w: colW - 0.1, h: 0.5,
      fill: { color: isFirst ? BLUE : '4B5563' },
    })
    slide.addText(`${phase.phase}\n${phase.period}`, {
      x: x + 0.05, y: 1.05, w: colW - 0.2, h: 0.5,
      fontSize: 9, bold: true, color: WHITE, align: 'center', valign: 'middle',
    })

    // テーマ
    slide.addText(phase.theme, {
      x: x + 0.05, y: 1.62, w: colW - 0.2, h: 0.3,
      fontSize: 9, bold: true, color: DARK,
    })

    // 既存深化
    if (phase.currentUsageExpansion) {
      slide.addShape(prs.ShapeType.rect, { x: x + 0.05, y: 1.98, w: colW - 0.2, h: 0.25, fill: { color: LIGHT_BLUE } })
      slide.addText('既存の深化', { x: x + 0.08, y: 1.98, w: colW - 0.26, h: 0.25, fontSize: 7.5, bold: true, color: BLUE })
      slide.addText(phase.currentUsageExpansion, {
        x: x + 0.05, y: 2.25, w: colW - 0.2, h: 0.7,
        fontSize: 8, color: DARK, valign: 'top',
      })
    }

    // 新規用途
    if (phase.newUseCase) {
      slide.addShape(prs.ShapeType.rect, { x: x + 0.05, y: 3.0, w: colW - 0.2, h: 0.25, fill: { color: LIGHT_GREEN } })
      slide.addText('新規用途', { x: x + 0.08, y: 3.0, w: colW - 0.26, h: 0.25, fontSize: 7.5, bold: true, color: GREEN })
      slide.addText(phase.newUseCase, {
        x: x + 0.05, y: 3.27, w: colW - 0.2, h: 0.7,
        fontSize: 8, color: DARK, valign: 'top',
      })
    }

    // マイルストーン
    slide.addShape(prs.ShapeType.rect, { x: x + 0.05, y: 4.05, w: colW - 0.2, h: 0.5, fill: { color: 'F9FAFB' }, line: { color: '#E5E7EB', width: 1 } })
    slide.addText(phase.milestone, {
      x: x + 0.1, y: 4.05, w: colW - 0.3, h: 0.5,
      fontSize: 8, color: GRAY, valign: 'middle',
    })

    // 矢印
    if (i < phases.length - 1) {
      slide.addText('→', {
        x: x + colW - 0.2, y: 2.5, w: 0.25, h: 0.3,
        fontSize: 14, color: GRAY, align: 'center', bold: true,
      })
    }
  })
}

export async function generatePptBuffer(
  answers: TmbWizardAnswers,
  plan: GeneratedPlan,
  cases: CaseStudy[],
  devicePlan: DevicePlan
): Promise<Buffer> {
  const prs = new PptxGenJS()
  prs.layout = 'LAYOUT_WIDE' // 16:9
  prs.title = `${answers.companyName} 運用プランご提案`

  addTitleSlide(prs, answers)
  addChallengeSummarySlide(prs, answers)
  addOperationPlanSlide(prs, plan)
  addScheduleSlide(prs, plan)

  // v2: 用途提案・ロードマップ（あれば）
  if (plan.useCaseProposals?.length) addUseCaseProposalsSlide(prs, plan)
  if (plan.roadmap?.length) addRoadmapSlide(prs, plan)

  // 事例スライド（最大2件）
  cases.slice(0, 2).forEach((_, i) => addCaseStudySlide(prs, cases, i))

  addDeviceSlide(prs, devicePlan)
  addInvestmentSummarySlide(prs, devicePlan)

  const buffer = await prs.write({ outputType: 'nodebuffer' }) as Buffer
  return buffer
}
