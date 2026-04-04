import PptxGenJS from 'pptxgenjs'
import { TmbWizardAnswers } from '@/src/types/answers'
import { GeneratedPlan, ACTIVITY_CATEGORIES, Phase } from '@/src/types/plan'
import { DevicePlan } from './device-recommender'
import {
  INDUSTRY_LABELS, SUB_INDUSTRY_LABELS, COMPANY_SIZE_LABELS,
  CHALLENGE_LABELS, GOAL_LABELS, KPI_LABELS, USAGE_STATUS_LABELS,
  BARRIER_LABELS,
} from '@/src/data/labels'

// ==================== カラー定数 ====================

const BLUE         = '1E40AF'
const BLUE_LIGHT   = 'DBEAFE'
const BLUE_TEXT    = '1E3A8A'
const GREEN        = '065F46'
const GREEN_LIGHT  = 'D1FAE5'
const GREEN_TEXT   = '064E3B'
const AMBER        = '92400E'
const AMBER_LIGHT  = 'FEF3C7'
const AMBER_TEXT   = '78350F'
const PURPLE       = '4C1D95'
const PURPLE_LIGHT = 'EDE9FE'
const PURPLE_TEXT  = '3B0764'
const RED_DARK     = 'B91C1C'
const DARK         = '1F2937'
const GRAY         = '6B7280'
const GRAY_LIGHT   = 'F3F4F6'
const WHITE        = 'FFFFFF'
const GRAY13       = '374151'  // 13ヶ月目以降カラー
const GRAY13_LIGHT = 'F9FAFB'

const PHASE_COLORS = [
  { bg: BLUE,   light: BLUE_LIGHT,   text: BLUE_TEXT   },
  { bg: GREEN,  light: GREEN_LIGHT,  text: GREEN_TEXT  },
  { bg: AMBER,  light: AMBER_LIGHT,  text: AMBER_TEXT  },
  { bg: PURPLE, light: PURPLE_LIGHT, text: PURPLE_TEXT },
]

// スライドサイズ: LAYOUT_WIDE 16:9 = 13.33" × 7.5"
const SW     = 13.33
const SH     = 7.5
const HDR_H  = 0.85
const MG     = 0.3
const CW     = SW - MG * 2   // 12.73"

// ==================== 型エイリアス ====================

type Sl = ReturnType<InstanceType<typeof PptxGenJS>['addSlide']>

// ==================== ユーティリティ ====================

function addHeader(sl: Sl, prs: PptxGenJS, title: string, sub?: string) {
  sl.addShape(prs.ShapeType.rect, {
    x: 0, y: 0, w: SW, h: HDR_H,
    fill: { color: BLUE }, line: { color: BLUE, width: 0 },
  })
  sl.addText(title, {
    x: MG, y: 0, w: 8, h: HDR_H,
    fontSize: 22, bold: true, color: WHITE, valign: 'middle',
  })
  if (sub) {
    sl.addText(sub, {
      x: 8.2, y: 0, w: SW - 8.5, h: HDR_H,
      fontSize: 10, color: BLUE_LIGHT, valign: 'middle', align: 'right',
    })
  }
}

function secBar(sl: Sl, prs: PptxGenJS, x: number, y: number, w: number, text: string, color = BLUE) {
  sl.addShape(prs.ShapeType.rect, {
    x, y, w, h: 0.3,
    fill: { color }, line: { color, width: 0 },
  })
  sl.addText(text, {
    x: x + 0.1, y, w: w - 0.15, h: 0.3,
    fontSize: 9, bold: true, color: WHITE, valign: 'middle',
  })
}

function monthToCalLabel(startYYYYMM: string, offset: number): string {
  if (!startYYYYMM || !/^\d{4}-\d{2}$/.test(startYYYYMM)) return ''
  const [y, m] = startYYYYMM.split('-').map(Number)
  if (m < 1 || m > 12) return ''
  const total = y * 12 + m - 1 + offset
  return `${Math.floor(total / 12)}/${(total % 12) + 1}`
}

function getPhaseIdx(month: number, phases: Phase[]): number {
  for (let i = 0; i < phases.length; i++) {
    const ns = phases[i].period.match(/\d+/g)?.map(Number) ?? []
    if (ns.length >= 2 && month >= ns[0] && month <= ns[1]) return i
    if (ns.length === 1 && month === ns[0]) return i
  }
  return Math.min(Math.floor((month - 1) / 3), (phases.length || 4) - 1)
}

// ==================== Slide 1: 前提情報 ====================

function addPremiseSlide(prs: PptxGenJS, answers: TmbWizardAnswers) {
  const sl = prs.addSlide()
  sl.background = { color: WHITE }

  const company    = answers.companyName || '顧客'
  const industry   = INDUSTRY_LABELS[answers.industry ?? ''] ?? ''
  const subInd     = answers.subIndustry ? (SUB_INDUSTRY_LABELS[answers.subIndustry] ?? '') : ''
  const industryStr = [industry, subInd].filter(Boolean).join(' › ')
  const size       = COMPANY_SIZE_LABELS[answers.companySize ?? ''] ?? ''

  addHeader(sl, prs, '前提情報', `${company} 様`)

  const Y0 = HDR_H + 0.12
  const LX = MG, LW = 6.0
  const RX = MG + LW + 0.23, RW = SW - MG * 2 - LW - 0.23

  // ===== 左カラム: 企業情報 + 障壁 =====
  let ly = Y0

  secBar(sl, prs, LX, ly, LW, '企業・組織情報', BLUE)
  ly += 0.33

  const orgRows: [string, string][] = [
    ['業種',   industryStr || '—'],
    ['企業規模', size || '—'],
    ['拠点数',  `${answers.locationCount} 拠点`],
    ['FC',     answers.isFranchise ? 'あり（FC本部・加盟店）' : 'なし'],
  ]
  if (answers.departmentNote) orgRows.push(['対象部門', answers.departmentNote])
  if (answers.projectStartDate) {
    const [y, m] = answers.projectStartDate.split('-')
    orgRows.push(['開始予定', `${y}年 ${parseInt(m, 10)}月`])
  }

  orgRows.forEach(([label, value], i) => {
    const ry = ly + i * 0.37
    sl.addShape(prs.ShapeType.rect, {
      x: LX, y: ry, w: LW, h: 0.36,
      fill: { color: i % 2 === 0 ? GRAY_LIGHT : WHITE },
      line: { color: 'E5E7EB', width: 0.5 },
    })
    sl.addText(label, { x: LX + 0.1, y: ry + 0.04, w: 1.35, h: 0.28, fontSize: 8.5, color: GRAY, bold: true, valign: 'middle' })
    sl.addText(value, { x: LX + 1.5, y: ry + 0.04, w: LW - 1.6, h: 0.28, fontSize: 9, color: DARK, valign: 'middle' })
  })
  ly += orgRows.length * 0.37 + 0.25

  secBar(sl, prs, LX, ly, LW, '推進上の障壁', RED_DARK)
  ly += 0.33
  answers.operationalBarriers.map(b => BARRIER_LABELS[b] ?? b).slice(0, 5).forEach((b, i) => {
    sl.addText(`• ${b}`, { x: LX + 0.12, y: ly + i * 0.31, w: LW - 0.22, h: 0.29, fontSize: 8.5, color: DARK })
  })

  // ===== 右カラム: 課題 + 目的KPI =====
  let ry = Y0

  secBar(sl, prs, RX, ry, RW, '経営課題', BLUE)
  ry += 0.33
  const challenges = answers.challenges.map(c => CHALLENGE_LABELS[c] ?? c)
  challenges.slice(0, 5).forEach((c, i) => {
    sl.addText(`• ${c}`, { x: RX + 0.12, y: ry + i * 0.31, w: RW - 0.22, h: 0.29, fontSize: 8.5, color: DARK })
  })
  ry += Math.min(challenges.length, 5) * 0.31 + 0.25

  secBar(sl, prs, RX, ry, RW, '導入目的・KPI', BLUE)
  ry += 0.33
  const goals       = (answers.primaryGoals ?? []).map(g => GOAL_LABELS[g] ?? g).join('、')
  const kpi         = KPI_LABELS[answers.priorityKpi ?? ''] ?? ''
  const usageStatus = USAGE_STATUS_LABELS[answers.usageStatus ?? ''] ?? ''

  const goalRows: [string, string][] = [['目的', goals], ['優先KPI', kpi]]
  if (answers.targetValue) goalRows.push(['目標値', answers.targetValue])
  if (usageStatus) goalRows.push(['利用状況', usageStatus])

  goalRows.forEach(([label, value], i) => {
    const rowY = ry + i * 0.37
    sl.addShape(prs.ShapeType.rect, {
      x: RX, y: rowY, w: RW, h: 0.36,
      fill: { color: i % 2 === 0 ? GRAY_LIGHT : WHITE },
      line: { color: 'E5E7EB', width: 0.5 },
    })
    sl.addText(label, { x: RX + 0.1, y: rowY + 0.04, w: 1.2, h: 0.28, fontSize: 8.5, color: GRAY, bold: true, valign: 'middle' })
    sl.addText(value, { x: RX + 1.35, y: rowY + 0.04, w: RW - 1.45, h: 0.28, fontSize: 9, color: DARK, valign: 'middle' })
  })
}

// ==================== Slide 2: プランサマリー＋マニュアル活用イメージ ====================

function addSummarySlide(prs: PptxGenJS, plan: GeneratedPlan) {
  const sl = prs.addSlide()
  sl.background = { color: WHITE }

  addHeader(sl, prs, 'プランサマリー')

  const Y0  = HDR_H + 0.12
  const LX  = MG
  const LW  = (CW - 0.2) / 2   // ≈ 6.265"
  const RX  = LX + LW + 0.2
  const RW  = LW

  // --- プロジェクト概要 ---
  sl.addShape(prs.ShapeType.rect, {
    x: LX, y: Y0, w: LW, h: 0.3,
    fill: { color: BLUE }, line: { color: BLUE, width: 0 },
  })
  sl.addText('プロジェクト概要', {
    x: LX + 0.1, y: Y0, w: LW - 0.15, h: 0.3,
    fontSize: 9, bold: true, color: WHITE, valign: 'middle',
  })
  sl.addShape(prs.ShapeType.rect, {
    x: LX, y: Y0 + 0.3, w: LW, h: 2.0,
    fill: { color: BLUE_LIGHT }, line: { color: 'BFDBFE', width: 0.5 },
  })
  sl.addText(plan.projectOverview ?? plan.summary ?? '', {
    x: LX + 0.14, y: Y0 + 0.36, w: LW - 0.28, h: 1.88,
    fontSize: 9, color: BLUE_TEXT, valign: 'top', align: 'left',
  })

  // --- 推進上のポイント ---
  sl.addShape(prs.ShapeType.rect, {
    x: RX, y: Y0, w: RW, h: 0.3,
    fill: { color: AMBER }, line: { color: AMBER, width: 0 },
  })
  sl.addText('推進上のポイント', {
    x: RX + 0.1, y: Y0, w: RW - 0.15, h: 0.3,
    fontSize: 9, bold: true, color: WHITE, valign: 'middle',
  })
  sl.addShape(prs.ShapeType.rect, {
    x: RX, y: Y0 + 0.3, w: RW, h: 2.0,
    fill: { color: AMBER_LIGHT }, line: { color: 'FDE68A', width: 0.5 },
  })
  sl.addText(plan.promotionPoints ?? '', {
    x: RX + 0.14, y: Y0 + 0.36, w: RW - 0.28, h: 1.88,
    fontSize: 9, color: AMBER_TEXT, valign: 'top', align: 'left',
  })

  // --- マニュアル活用イメージ ---
  const MY = Y0 + 2.45
  sl.addShape(prs.ShapeType.rect, {
    x: MG, y: MY, w: CW, h: 0.3,
    fill: { color: BLUE }, line: { color: BLUE, width: 0 },
  })
  sl.addText('マニュアル活用イメージ', {
    x: MG + 0.1, y: MY, w: CW - 0.2, h: 0.3,
    fontSize: 9, bold: true, color: WHITE, valign: 'middle',
  })

  const scenarios = plan.usageScenarios ?? []
  const cardW  = (CW - 0.15 * 3) / 4   // 4列
  const cardY  = MY + 0.33
  const cardH  = SH - cardY - 0.18

  scenarios.slice(0, 4).forEach((s, i) => {
    const cx = MG + i * (cardW + 0.15)

    sl.addShape(prs.ShapeType.rect, {
      x: cx, y: cardY, w: cardW, h: 0.3,
      fill: { color: BLUE }, line: { color: BLUE, width: 0 },
    })
    sl.addText(s.manualTitle, {
      x: cx + 0.07, y: cardY, w: cardW - 0.1, h: 0.3,
      fontSize: 7.5, bold: true, color: WHITE, valign: 'middle',
    })

    sl.addShape(prs.ShapeType.rect, {
      x: cx, y: cardY + 0.3, w: cardW, h: cardH - 0.3,
      fill: { color: GRAY_LIGHT }, line: { color: 'E5E7EB', width: 0.5 },
    })

    const rowH = (cardH - 0.3) / 3
    const labelRows: [string, string][] = [['誰が', s.user], ['場面', s.scene], ['効果', s.effect]]
    labelRows.forEach(([label, text], ri) => {
      const inY = cardY + 0.33 + ri * rowH
      sl.addText(label, { x: cx + 0.08, y: inY, w: 0.48, h: 0.22, fontSize: 7.5, color: GRAY, bold: true })
      sl.addText(text, { x: cx + 0.58, y: inY, w: cardW - 0.66, h: rowH - 0.06, fontSize: 7.5, color: DARK, valign: 'top' })
    })
  })
}

// ==================== Slide 3: 全体スケジュール案 ====================

function addPhaseScheduleSlide(prs: PptxGenJS, plan: GeneratedPlan, answers: TmbWizardAnswers) {
  const sl = prs.addSlide()
  sl.background = { color: WHITE }

  addHeader(sl, prs, '全体スケジュール案', '4フェーズの活動計画')

  const phases    = plan.phases ?? []
  const Y0        = HDR_H + 0.1
  const LABEL_W   = 1.4
  const PHASE_W   = (CW - LABEL_W) / Math.max(phases.length, 1)   // ≈ 2.83"
  const PHASE_HDR = 0.75
  const CAT_H     = (SH - Y0 - PHASE_HDR - 0.05) / ACTIVITY_CATEGORIES.length  // ≈ 1.17"

  // フェーズヘッダー
  phases.forEach((phase, pi) => {
    const px    = MG + LABEL_W + pi * PHASE_W
    const color = PHASE_COLORS[pi % PHASE_COLORS.length]

    sl.addShape(prs.ShapeType.rect, {
      x: px, y: Y0, w: PHASE_W - 0.06, h: PHASE_HDR,
      fill: { color: color.bg }, line: { color: color.bg, width: 0 },
    })
    sl.addText(phase.name, {
      x: px, y: Y0 + 0.04, w: PHASE_W - 0.06, h: 0.3,
      fontSize: 10, bold: true, color: WHITE, align: 'center', valign: 'middle',
    })
    sl.addText(phase.period, {
      x: px, y: Y0 + 0.36, w: PHASE_W - 0.06, h: 0.22,
      fontSize: 8.5, color: 'BFDBFE', align: 'center',
    })
    if (answers.projectStartDate) {
      const ns = phase.period.match(/\d+/g)?.map(Number) ?? []
      if (ns.length >= 2) {
        const from = monthToCalLabel(answers.projectStartDate, ns[0] - 1)
        const to   = monthToCalLabel(answers.projectStartDate, ns[1] - 1)
        sl.addText(`${from}〜${to}`, {
          x: px, y: Y0 + 0.56, w: PHASE_W - 0.06, h: 0.17,
          fontSize: 7.5, color: 'BFDBFE', align: 'center',
        })
      }
    }
  })

  // カテゴリ行
  const catY0 = Y0 + PHASE_HDR + 0.02
  ACTIVITY_CATEGORIES.forEach((cat, ci) => {
    const rowY  = catY0 + ci * CAT_H
    const isEven = ci % 2 === 0

    // カテゴリラベルセル
    sl.addShape(prs.ShapeType.rect, {
      x: MG, y: rowY, w: LABEL_W, h: CAT_H - 0.05,
      fill: { color: isEven ? '1E3A8A' : BLUE }, line: { color: BLUE, width: 0 },
    })
    sl.addText(cat, {
      x: MG, y: rowY, w: LABEL_W, h: CAT_H - 0.05,
      fontSize: 9, bold: true, color: WHITE, align: 'center', valign: 'middle',
    })

    // フェーズごとの活動セル
    phases.forEach((phase, pi) => {
      const cx     = MG + LABEL_W + pi * PHASE_W
      const color  = PHASE_COLORS[pi % PHASE_COLORS.length]
      const items  = phase.categoryActivities?.[cat] ?? []

      sl.addShape(prs.ShapeType.rect, {
        x: cx, y: rowY, w: PHASE_W - 0.06, h: CAT_H - 0.05,
        fill: { color: isEven ? color.light : WHITE },
        line: { color: 'E5E7EB', width: 0.5 },
      })
      sl.addText(items.slice(0, 2).map(a => `• ${a}`).join('\n'), {
        x: cx + 0.08, y: rowY + 0.06, w: PHASE_W - 0.2, h: CAT_H - 0.15,
        fontSize: 8, color: DARK, align: 'left', valign: 'top',
      })
    })
  })
}

// ==================== Slide 4/5: 各月スケジュール（前半・後半） ====================

function addMonthlySlide(
  prs: PptxGenJS,
  plan: GeneratedPlan,
  answers: TmbWizardAnswers,
  monthNums: number[],
  title: string,
) {
  const sl = prs.addSlide()
  sl.background = { color: WHITE }

  addHeader(sl, prs, title)

  const phases = plan.phases ?? []

  const COL_MONTH  = 0.82
  const COL_PHASE  = 1.55
  const COL_TITLE  = 3.3
  const COL_ACTION = CW - COL_MONTH - COL_PHASE - COL_TITLE   // ≈ 7.06"

  const HDR_ROW_H  = 0.35
  const DATA_ROW_H = (SH - HDR_H - HDR_ROW_H - 0.12) / monthNums.length

  const tableY = HDR_H + 0.08
  const tableX = MG

  // テーブルヘッダー行
  sl.addShape(prs.ShapeType.rect, {
    x: tableX, y: tableY, w: CW, h: HDR_ROW_H,
    fill: { color: DARK }, line: { color: DARK, width: 0 },
  })
  let hx = tableX
  for (const { text, w } of [
    { text: '月', w: COL_MONTH },
    { text: 'フェーズ', w: COL_PHASE },
    { text: 'テーマ', w: COL_TITLE },
    { text: '主要アクション', w: COL_ACTION },
  ]) {
    sl.addText(text, {
      x: hx + 0.08, y: tableY, w: w, h: HDR_ROW_H,
      fontSize: 8.5, bold: true, color: WHITE, valign: 'middle',
    })
    hx += w
  }

  // データ行
  const allSchedule = plan.schedule ?? []
  monthNums.forEach((monthNum, ri) => {
    const m = allSchedule.find(s => s.month === monthNum)
    if (!m) return

    const isAfter13 = m.month >= 13
    const pi        = isAfter13 ? phases.length - 1 : getPhaseIdx(m.month, phases)
    const phase     = phases[pi]
    const color     = isAfter13
      ? { bg: GRAY13, light: GRAY13_LIGHT, text: DARK }
      : PHASE_COLORS[pi % PHASE_COLORS.length]
    const rowY      = tableY + HDR_ROW_H + ri * DATA_ROW_H
    const rowBg     = isAfter13 ? GRAY13_LIGHT : (ri % 2 === 0 ? WHITE : BLUE_LIGHT)

    sl.addShape(prs.ShapeType.rect, {
      x: tableX, y: rowY, w: CW, h: DATA_ROW_H,
      fill: { color: rowBg }, line: { color: 'E5E7EB', width: 0.5 },
    })

    let cx = tableX

    // 月 (円 + カレンダーラベル)
    const circleSize = Math.min(DATA_ROW_H * 0.65, 0.52)
    const circleX    = cx + (COL_MONTH - circleSize) / 2
    const circleY    = rowY + (DATA_ROW_H - circleSize) / 2 - 0.08
    sl.addShape(prs.ShapeType.ellipse, {
      x: circleX, y: circleY, w: circleSize, h: circleSize,
      fill: { color: color.bg }, line: { color: color.bg, width: 0 },
    })
    sl.addText(isAfter13 ? '…' : String(m.month), {
      x: circleX, y: circleY, w: circleSize, h: circleSize,
      fontSize: 9, bold: true, color: WHITE, align: 'center', valign: 'middle',
    })
    if (answers.projectStartDate) {
      const calStr = isAfter13
        ? monthToCalLabel(answers.projectStartDate, 12) + '〜'
        : monthToCalLabel(answers.projectStartDate, m.month - 1)
      sl.addText(calStr, {
        x: cx + 0.02, y: circleY + circleSize + 0.02, w: COL_MONTH - 0.04, h: 0.18,
        fontSize: 6.5, color: color.bg, align: 'center', bold: true,
      })
    }
    cx += COL_MONTH

    // フェーズタグ
    const tagH = 0.26, tagW = COL_PHASE - 0.18
    sl.addShape(prs.ShapeType.rect, {
      x: cx + 0.09, y: rowY + (DATA_ROW_H - tagH) / 2, w: tagW, h: tagH,
      fill: { color: isAfter13 ? 'E5E7EB' : color.light },
      line: { color: 'E5E7EB', width: 0 },
    })
    sl.addText(isAfter13 ? '13ヶ月目以降' : (phase?.name ?? `P${pi + 1}`), {
      x: cx + 0.09, y: rowY + (DATA_ROW_H - tagH) / 2, w: tagW, h: tagH,
      fontSize: 7.5, color: isAfter13 ? GRAY : color.text, align: 'center', valign: 'middle', bold: true,
    })
    cx += COL_PHASE

    // テーマ
    sl.addText(m.title, {
      x: cx + 0.08, y: rowY + 0.04, w: COL_TITLE - 0.14, h: DATA_ROW_H - 0.08,
      fontSize: 9, bold: !isAfter13, color: isAfter13 ? GRAY : DARK, valign: 'middle',
    })
    cx += COL_TITLE

    // アクション（2件）
    const actText = m.actions.slice(0, 2).map(a => `• ${a}`).join('\n')
    sl.addText(actText, {
      x: cx + 0.08, y: rowY + 0.04, w: COL_ACTION - 0.14, h: DATA_ROW_H - 0.08,
      fontSize: 7.5, color: DARK, valign: 'top', align: 'left',
    })
  })
}

// ==================== Slide 6: デバイス配置イメージ ====================

function addDeviceSlide(prs: PptxGenJS, devicePlan: DevicePlan) {
  const sl = prs.addSlide()
  sl.background = { color: WHITE }

  addHeader(sl, prs, 'デバイス配置イメージ', `運用スタイル: ${devicePlan.operationStyleLabel}`)

  const Y0 = HDR_H + 0.18

  // --- 台数サマリー (3ボックス) ---
  const BOX_W   = 3.5
  const BOX_H   = 1.05
  const boxGap  = (CW - BOX_W * 3) / 2
  const boxes = [
    { label: '理想台数',   value: `${devicePlan.idealDeviceCount}`,   bg: BLUE_LIGHT,  text: BLUE  },
    { label: '現在の台数', value: `${devicePlan.currentDeviceCount}`, bg: GRAY_LIGHT,  text: GRAY  },
    { label: '不足台数',   value: `${devicePlan.shortfallCount}`,     bg: GREEN_LIGHT, text: GREEN },
  ]
  boxes.forEach((box, i) => {
    const bx = MG + i * (BOX_W + boxGap)
    sl.addShape(prs.ShapeType.rect, {
      x: bx, y: Y0, w: BOX_W, h: BOX_H,
      fill: { color: box.bg }, line: { color: 'E5E7EB', width: 0.5 },
    })
    sl.addText(box.label, { x: bx, y: Y0 + 0.1, w: BOX_W, h: 0.26, fontSize: 9, color: box.text, align: 'center' })
    sl.addText(box.value, { x: bx, y: Y0 + 0.32, w: BOX_W * 0.85, h: 0.52, fontSize: 30, bold: true, color: box.text, align: 'right' })
    sl.addText('台', { x: bx + BOX_W * 0.85, y: Y0 + 0.58, w: BOX_W * 0.12, h: 0.26, fontSize: 11, color: box.text })
  })

  // --- 推奨製品 ---
  const PROD_Y = Y0 + BOX_H + 0.25
  secBar(sl, prs, MG, PROD_Y, CW, '推奨製品', BLUE)

  const products = devicePlan.recommendedProducts.slice(0, 3)
  products.forEach((p, i) => {
    const py = PROD_Y + 0.33 + i * 0.62
    sl.addShape(prs.ShapeType.rect, {
      x: MG, y: py, w: CW, h: 0.58,
      fill: { color: i === 0 ? BLUE_LIGHT : WHITE },
      line: { color: 'E5E7EB', width: 0.5 },
    })
    sl.addText(p.productName, { x: MG + 0.12, y: py + 0.05, w: 5.5, h: 0.26, fontSize: 10, bold: true, color: DARK })
    sl.addText(p.reason,      { x: MG + 0.12, y: py + 0.31, w: 8.0, h: 0.2,  fontSize: 8,  color: GRAY })
    sl.addText(`¥${p.monthlyUnitPrice.toLocaleString()}/月・台`, {
      x: MG + 8.5, y: py + 0.05, w: CW - 8.6, h: 0.5,
      fontSize: 12, bold: true, color: BLUE, align: 'right', valign: 'middle',
    })
  })

  // --- アクセサリーヒント（あれば最大1件） ---
  if (devicePlan.accessoryHints?.length) {
    const AHY = PROD_Y + 0.33 + products.length * 0.62 + 0.15
    secBar(sl, prs, MG, AHY, CW, '特別環境向けアクセサリー推奨', AMBER)
    devicePlan.accessoryHints.slice(0, 1).forEach((hint, i) => {
      sl.addText(`【${hint.condition}】 ${hint.items.join('  /  ')}`, {
        x: MG + 0.12, y: AHY + 0.33 + i * 0.28, w: CW - 0.2, h: 0.26, fontSize: 8.5, color: DARK,
      })
    })
  }

  // --- 注記 ---
  sl.addText('※ デバイスレンタルサービス料金（Studist提供）の概算です。実際の見積は別途ご案内します。', {
    x: MG, y: SH - 0.3, w: CW, h: 0.25,
    fontSize: 7.5, color: GRAY, italic: true,
  })
}

// ==================== エントリポイント ====================

export async function generatePptBuffer(
  answers: TmbWizardAnswers,
  plan: GeneratedPlan,
  _cases: unknown[],
  devicePlan: DevicePlan,
): Promise<Buffer> {
  const prs = new PptxGenJS()
  prs.layout = 'LAYOUT_WIDE'
  prs.title  = `${answers.companyName || '顧客'} 運用プランご提案`

  const allMonths   = (plan.schedule ?? []).map(s => s.month)
  const firstHalf   = allMonths.filter(m => m >= 1 && m <= 6)
  const secondHalf  = allMonths.filter(m => m >= 7)

  addPremiseSlide(prs, answers)
  addSummarySlide(prs, plan)
  addPhaseScheduleSlide(prs, plan, answers)
  addMonthlySlide(prs, plan, answers, firstHalf,  '各月スケジュール（前半：1〜6ヶ月目）')
  addMonthlySlide(prs, plan, answers, secondHalf, '各月スケジュール（後半：7〜12ヶ月目＋中長期）')
  addDeviceSlide(prs, devicePlan)

  const buffer = await prs.write({ outputType: 'nodebuffer' }) as Buffer
  return buffer
}
