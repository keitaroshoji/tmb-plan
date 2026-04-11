import PptxGenJS from 'pptxgenjs'
import path from 'path'
import { TmbWizardAnswers } from '@/src/types/answers'
import { GeneratedPlan, ACTIVITY_CATEGORIES, Phase } from '@/src/types/plan'
import { DevicePlan } from './device-recommender'
import {
  INDUSTRY_LABELS, SUB_INDUSTRY_LABELS, COMPANY_SIZE_LABELS,
  CHALLENGE_LABELS, GOAL_LABELS, KPI_LABELS, USAGE_STATUS_LABELS,
  BARRIER_LABELS,
} from '@/src/data/labels'

// ==================== カラー定数（テンプレート準拠） ====================

const PRIMARY      = '3B88ED'   // accent1 プライマリブルー
const PRIMARY_DK   = '1244CC'   // accent2 ダークブルー
const PRIMARY_LT   = 'D6E8FB'   // ライトブルー
const ORANGE       = 'F7970F'   // accent5 オレンジ
const ORANGE_LT    = 'FEF3DC'   // ライトオレンジ
const ORANGE_DK    = 'B06B0A'   // ダークオレンジ
const GREEN        = '2D8653'   // グリーン
const GREEN_LT     = 'D1FAE5'   // ライトグリーン
const GREEN_DK     = '1B5E3A'   // ダークグリーン
const PURPLE       = '6B4FBB'   // パープル
const PURPLE_LT    = 'EDE9FE'   // ライトパープル
const PURPLE_DK    = '4C1D95'   // ダークパープル
const RED          = 'D91616'   // accent6 レッド
const DARK         = '2B2F33'   // dk1 ダークテキスト
const GRAY         = '7A848F'   // accent3 グレー
const GRAY_LT      = 'F3F4F6'   // ライトグレー
const COVER_BAR    = '3C434D'   // カバースライドの黒帯
const WHITE        = 'FFFFFF'
const GRAY13       = '4C5359'   // 13ヶ月以降
const GRAY13_LT    = 'F9FAFB'

const PHASE_COLORS = [
  { bg: PRIMARY, light: PRIMARY_LT, text: PRIMARY_DK  },
  { bg: GREEN,   light: GREEN_LT,   text: GREEN_DK    },
  { bg: ORANGE,  light: ORANGE_LT,  text: ORANGE_DK   },
  { bg: PURPLE,  light: PURPLE_LT,  text: PURPLE_DK   },
]

// ==================== スライドサイズ（LAYOUT_16x9 = 10" × 5.625"） ====================

const SW    = 10
const SH    = 5.625
const BAR_H = 0.38          // ヘッドラインバー高さ（12pt用）
const HDR_H = 0.85          // 総ヘッダー高さ（バー + メインメッセージライン）
const MG    = 0.45          // 左右余白（≈11.5mm）
const CW    = SW - MG * 2   // コンテンツ幅 ≈ 9.10"

// ==================== フォント ====================

const FONT = 'Noto Sans JP'

// ==================== 画像パス ====================

const COVER_BG_PATH    = path.join(process.cwd(), 'public', 'ppt-cover-bg.png')
const STUDIST_LOGO_PATH = path.join(process.cwd(), 'public', 'ppt-studist-logo.png')

// ==================== 型エイリアス ====================

type Sl = ReturnType<InstanceType<typeof PptxGenJS>['addSlide']>

// ==================== ユーティリティ ====================

function addHeader(sl: Sl, prs: PptxGenJS, title: string, sub?: string) {
  // ヘッドラインバー（12pt）
  sl.addShape(prs.ShapeType.rect, {
    x: 0, y: 0, w: SW, h: BAR_H,
    fill: { color: PRIMARY }, line: { color: PRIMARY, width: 0 },
  })
  sl.addText(title, {
    x: MG, y: 0, w: SW - MG, h: BAR_H,
    fontFace: FONT, fontSize: 12, bold: true, color: WHITE, valign: 'middle',
  })
  // メインメッセージライン（16pt）
  if (sub) {
    sl.addText(sub, {
      x: MG, y: BAR_H + 0.05, w: CW, h: HDR_H - BAR_H - 0.05,
      fontFace: FONT, fontSize: 16, bold: true, color: DARK, valign: 'middle',
    })
  }
}

function secBar(sl: Sl, prs: PptxGenJS, x: number, y: number, w: number, text: string, color = PRIMARY) {
  sl.addShape(prs.ShapeType.rect, {
    x, y, w, h: 0.22,
    fill: { color }, line: { color, width: 0 },
  })
  sl.addText(text, {
    x: x + 0.07, y, w: w - 0.11, h: 0.22,
    fontFace: FONT, fontSize: 7, bold: true, color: WHITE, valign: 'middle',
  })
}

function monthToCalLabel(startYYYYMM: string, offset: number): string {
  if (!startYYYYMM || !/^\d{4}-\d{2}$/.test(startYYYYMM)) return ''
  const [y, m] = startYYYYMM.split('-').map(Number)
  if (m < 1 || m > 12) return ''
  const total = y * 12 + m - 1 + offset
  return `${Math.floor(total / 12)}年${(total % 12) + 1}月`
}

function getPhaseIdx(month: number, phases: Phase[]): number {
  for (let i = 0; i < phases.length; i++) {
    const ns = phases[i].period.match(/\d+/g)?.map(Number) ?? []
    if (ns.length >= 2 && month >= ns[0] && month <= ns[1]) return i
    if (ns.length === 1 && month === ns[0]) return i
  }
  return Math.min(Math.floor((month - 1) / 3), (phases.length || 4) - 1)
}

// ==================== Slide 0: 表紙 ====================

function addCoverSlide(prs: PptxGenJS, answers: TmbWizardAnswers) {
  const sl = prs.addSlide()

  // フル背景画像
  try {
    sl.addImage({ path: COVER_BG_PATH, x: 0, y: 0, w: SW, h: SH })
  } catch {
    sl.background = { color: COVER_BAR }
  }

  // Studistロゴ
  try {
    sl.addImage({ path: STUDIST_LOGO_PATH, x: 0.732, y: 2.162, w: 1.240, h: 0.282 })
  } catch {
    // ロゴ画像が見つからない場合はスキップ
  }

  // タイトル背景バー（テンプレートの暗いバー）
  sl.addShape(prs.ShapeType.rect, {
    x: 0.756, y: 2.398, w: 8.362, h: 0.404,
    fill: { color: COVER_BAR }, line: { color: COVER_BAR, width: 0 },
  })

  // タイトルテキスト
  const company = answers.companyName || '顧客'
  sl.addText(`${company} 様　Teachme Biz 運用プランご提案`, {
    x: 0.832, y: 2.398, w: 8.210, h: 0.404,
    fontFace: FONT, fontSize: 16, bold: true, color: WHITE, valign: 'middle',
  })

  // 日付行の背景
  sl.addShape(prs.ShapeType.rect, {
    x: 0.732, y: 4.127, w: 8.362, h: 0.22,
    fill: { color: COVER_BAR }, line: { color: COVER_BAR, width: 0 },
  })

  // 提案日
  const today = new Date()
  const dateStr = `${today.getFullYear()}年${today.getMonth() + 1}月${today.getDate()}日`
  sl.addText(dateStr, {
    x: 0.832, y: 4.127, w: 4, h: 0.22,
    fontFace: FONT, fontSize: 8, color: WHITE, valign: 'middle',
  })

  // 企業名（下段）
  sl.addShape(prs.ShapeType.rect, {
    x: 0.732, y: 4.357, w: 8.362, h: 0.22,
    fill: { color: COVER_BAR }, line: { color: COVER_BAR, width: 0 },
  })
  sl.addText(company, {
    x: 0.832, y: 4.357, w: 6, h: 0.22,
    fontFace: FONT, fontSize: 9, bold: true, color: WHITE, valign: 'middle',
  })
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

  const Y0 = HDR_H + 0.09
  const LX = MG
  const LW = 4.5
  const RX = MG + LW + 0.17
  const RW = CW - LW - 0.17

  // ===== 左カラム: 企業情報 + 障壁 =====
  let ly = Y0

  secBar(sl, prs, LX, ly, LW, '企業・組織情報', PRIMARY)
  ly += 0.25

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
    const ry = ly + i * 0.28
    sl.addShape(prs.ShapeType.rect, {
      x: LX, y: ry, w: LW, h: 0.27,
      fill: { color: i % 2 === 0 ? GRAY_LT : WHITE },
      line: { color: 'E5E7EB', width: 0.5 },
    })
    sl.addText(label, { x: LX + 0.07, y: ry + 0.03, w: 1.1, h: 0.21, fontFace: FONT, fontSize: 7, color: GRAY, bold: true, valign: 'middle' })
    sl.addText(value, { x: LX + 1.2,  y: ry + 0.03, w: LW - 1.3, h: 0.21, fontFace: FONT, fontSize: 7.5, color: DARK, valign: 'middle' })
  })
  ly += orgRows.length * 0.28 + 0.19

  secBar(sl, prs, LX, ly, LW, '推進上の障壁', RED)
  ly += 0.25
  answers.operationalBarriers.map(b => BARRIER_LABELS[b] ?? b).slice(0, 5).forEach((b, i) => {
    sl.addText(`• ${b}`, { x: LX + 0.09, y: ly + i * 0.23, w: LW - 0.16, h: 0.22, fontFace: FONT, fontSize: 7, color: DARK })
  })

  // ===== 右カラム: 課題 + 目的KPI =====
  let ry2 = Y0

  secBar(sl, prs, RX, ry2, RW, '経営課題', PRIMARY)
  ry2 += 0.25
  const challenges = answers.challenges.map(c => CHALLENGE_LABELS[c] ?? c)
  challenges.slice(0, 5).forEach((c, i) => {
    sl.addText(`• ${c}`, { x: RX + 0.09, y: ry2 + i * 0.23, w: RW - 0.16, h: 0.22, fontFace: FONT, fontSize: 7, color: DARK })
  })
  ry2 += Math.min(challenges.length, 5) * 0.23 + 0.19

  secBar(sl, prs, RX, ry2, RW, '導入目的・KPI', PRIMARY)
  ry2 += 0.25
  const goals       = (answers.primaryGoals ?? []).map(g => GOAL_LABELS[g] ?? g).join('、')
  const kpi         = KPI_LABELS[answers.priorityKpi ?? ''] ?? ''
  const usageStatus = USAGE_STATUS_LABELS[answers.usageStatus ?? ''] ?? ''

  const goalRows: [string, string][] = [['目的', goals], ['優先KPI', kpi]]
  if (answers.targetValue) goalRows.push(['目標値', answers.targetValue])
  if (usageStatus) goalRows.push(['利用状況', usageStatus])

  goalRows.forEach(([label, value], i) => {
    const rowY = ry2 + i * 0.28
    sl.addShape(prs.ShapeType.rect, {
      x: RX, y: rowY, w: RW, h: 0.27,
      fill: { color: i % 2 === 0 ? GRAY_LT : WHITE },
      line: { color: 'E5E7EB', width: 0.5 },
    })
    sl.addText(label, { x: RX + 0.07, y: rowY + 0.03, w: 1.0, h: 0.21, fontFace: FONT, fontSize: 7, color: GRAY, bold: true, valign: 'middle' })
    sl.addText(value, { x: RX + 1.1,  y: rowY + 0.03, w: RW - 1.2, h: 0.21, fontFace: FONT, fontSize: 7.5, color: DARK, valign: 'middle' })
  })
}

// ==================== Slide 2: プランサマリー＋マニュアル活用イメージ ====================

function addSummarySlide(prs: PptxGenJS, plan: GeneratedPlan) {
  const sl = prs.addSlide()
  sl.background = { color: WHITE }

  addHeader(sl, prs, 'プランサマリー')

  const Y0 = HDR_H + 0.09
  const LW = (CW - 0.15) / 2
  const RX = MG + LW + 0.15

  // --- プロジェクト概要 ---
  sl.addShape(prs.ShapeType.rect, {
    x: MG, y: Y0, w: LW, h: 0.22,
    fill: { color: PRIMARY }, line: { color: PRIMARY, width: 0 },
  })
  sl.addText('プロジェクト概要', {
    x: MG + 0.07, y: Y0, w: LW - 0.11, h: 0.22,
    fontFace: FONT, fontSize: 7, bold: true, color: WHITE, valign: 'middle',
  })
  const TEXT_H = 1.1  // 概要・ポイントのテキストボックス高さ

  sl.addShape(prs.ShapeType.rect, {
    x: MG, y: Y0 + 0.22, w: LW, h: TEXT_H,
    fill: { color: PRIMARY_LT }, line: { color: 'BFDBFE', width: 0.5 },
  })
  sl.addText(plan.projectOverview ?? plan.summary ?? '', {
    x: MG + 0.10, y: Y0 + 0.27, w: LW - 0.20, h: TEXT_H - 0.10,
    fontFace: FONT, fontSize: 7, color: PRIMARY_DK, valign: 'top', align: 'left',
  })

  // --- 推進上のポイント ---
  sl.addShape(prs.ShapeType.rect, {
    x: RX, y: Y0, w: LW, h: 0.22,
    fill: { color: ORANGE }, line: { color: ORANGE, width: 0 },
  })
  sl.addText('推進上のポイント', {
    x: RX + 0.07, y: Y0, w: LW - 0.11, h: 0.22,
    fontFace: FONT, fontSize: 7, bold: true, color: WHITE, valign: 'middle',
  })
  sl.addShape(prs.ShapeType.rect, {
    x: RX, y: Y0 + 0.22, w: LW, h: TEXT_H,
    fill: { color: ORANGE_LT }, line: { color: 'FDE68A', width: 0.5 },
  })
  sl.addText(plan.promotionPoints ?? '', {
    x: RX + 0.10, y: Y0 + 0.27, w: LW - 0.20, h: TEXT_H - 0.10,
    fontFace: FONT, fontSize: 7, color: ORANGE_DK, valign: 'top', align: 'left',
  })

  // --- KPI目標 ---
  const KPI_Y = Y0 + 0.22 + TEXT_H + 0.09
  const kpiTargets = plan.kpiTargets ?? []
  if (kpiTargets.length > 0) {
    secBar(sl, prs, MG, KPI_Y, CW, 'KPI目標', GREEN)
    const kpiCardW = (CW - 0.08 * (kpiTargets.length - 1)) / kpiTargets.length
    const kpiCardH = 0.42
    kpiTargets.slice(0, 3).forEach((k, i) => {
      const kx = MG + i * (kpiCardW + 0.08)
      const ky = KPI_Y + 0.24
      sl.addShape(prs.ShapeType.rect, {
        x: kx, y: ky, w: kpiCardW, h: kpiCardH,
        fill: { color: GREEN_LT }, line: { color: 'A7F3D0', width: 0.5 },
      })
      sl.addText(k.kpi, {
        x: kx + 0.07, y: ky + 0.03, w: kpiCardW - 0.12, h: 0.16,
        fontFace: FONT, fontSize: 6.5, bold: true, color: GREEN_DK, valign: 'middle',
      })
      sl.addText(k.target, {
        x: kx + 0.07, y: ky + 0.20, w: kpiCardW - 0.12, h: 0.16,
        fontFace: FONT, fontSize: 8, bold: true, color: GREEN_DK, valign: 'middle',
      })
      sl.addText(k.timing, {
        x: kx + 0.07, y: ky + 0.32, w: kpiCardW - 0.12, h: 0.10,
        fontFace: FONT, fontSize: 5.5, color: GREEN, valign: 'middle',
      })
    })
  }

  // --- マニュアル活用イメージ ---
  const MY = KPI_Y + (kpiTargets.length > 0 ? 0.68 : 0) + 0.08
  sl.addShape(prs.ShapeType.rect, {
    x: MG, y: MY, w: CW, h: 0.22,
    fill: { color: PRIMARY }, line: { color: PRIMARY, width: 0 },
  })
  sl.addText('マニュアル活用イメージ', {
    x: MG + 0.07, y: MY, w: CW - 0.11, h: 0.22,
    fontFace: FONT, fontSize: 7, bold: true, color: WHITE, valign: 'middle',
  })

  const scenarios = plan.usageScenarios ?? []
  const cardW = (CW - 0.11 * 3) / 4
  const cardY = MY + 0.25
  const cardH = SH - cardY - 0.14

  scenarios.slice(0, 4).forEach((s, i) => {
    const cx = MG + i * (cardW + 0.11)

    sl.addShape(prs.ShapeType.rect, {
      x: cx, y: cardY, w: cardW, h: 0.22,
      fill: { color: PRIMARY }, line: { color: PRIMARY, width: 0 },
    })
    sl.addText(s.manualTitle, {
      x: cx + 0.05, y: cardY, w: cardW - 0.07, h: 0.22,
      fontFace: FONT, fontSize: 6.5, bold: true, color: WHITE, valign: 'middle',
    })

    sl.addShape(prs.ShapeType.rect, {
      x: cx, y: cardY + 0.22, w: cardW, h: cardH - 0.22,
      fill: { color: GRAY_LT }, line: { color: 'E5E7EB', width: 0.5 },
    })

    const rowH = (cardH - 0.22) / 3
    const labelRows: [string, string][] = [['誰が', s.user], ['場面', s.scene], ['効果', s.effect]]
    labelRows.forEach(([label, text], ri) => {
      const inY = cardY + 0.25 + ri * rowH
      sl.addText(label, { x: cx + 0.06, y: inY, w: 0.36, h: 0.18, fontFace: FONT, fontSize: 6.5, color: GRAY, bold: true })
      sl.addText(text,  { x: cx + 0.44, y: inY, w: cardW - 0.50, h: rowH - 0.05, fontFace: FONT, fontSize: 6.5, color: DARK, valign: 'top' })
    })
  })
}

// ==================== Slide 3: 全体スケジュール案 ====================

function addPhaseScheduleSlide(prs: PptxGenJS, plan: GeneratedPlan, answers: TmbWizardAnswers) {
  const sl = prs.addSlide()
  sl.background = { color: WHITE }

  addHeader(sl, prs, '年間スケジュール（四半期）', '4フェーズの活動計画')

  const phases   = plan.phases ?? []
  const Y0       = HDR_H + 0.08
  const LABEL_W  = 1.05
  const PHASE_W  = (CW - LABEL_W) / Math.max(phases.length, 1)
  const PHASE_HDR = 0.56
  const CAT_H    = (SH - Y0 - PHASE_HDR - 0.04) / ACTIVITY_CATEGORIES.length

  // フェーズヘッダー
  phases.forEach((phase, pi) => {
    const px    = MG + LABEL_W + pi * PHASE_W
    const color = PHASE_COLORS[pi % PHASE_COLORS.length]

    sl.addShape(prs.ShapeType.rect, {
      x: px, y: Y0, w: PHASE_W - 0.05, h: PHASE_HDR,
      fill: { color: color.bg }, line: { color: color.bg, width: 0 },
    })
    sl.addText(phase.name, {
      x: px, y: Y0 + 0.03, w: PHASE_W - 0.05, h: 0.24,
      fontFace: FONT, fontSize: 8, bold: true, color: WHITE, align: 'center', valign: 'middle',
    })
    sl.addText(phase.period, {
      x: px, y: Y0 + 0.28, w: PHASE_W - 0.05, h: 0.17,
      fontFace: FONT, fontSize: 7, color: PRIMARY_LT, align: 'center',
    })
    if (answers.projectStartDate) {
      const ns = phase.period.match(/\d+/g)?.map(Number) ?? []
      if (ns.length >= 2) {
        const from = monthToCalLabel(answers.projectStartDate, ns[0] - 1)
        const to   = monthToCalLabel(answers.projectStartDate, ns[1] - 1)
        sl.addText(`${from}〜${to}`, {
          x: px, y: Y0 + 0.42, w: PHASE_W - 0.05, h: 0.13,
          fontFace: FONT, fontSize: 6, color: PRIMARY_LT, align: 'center',
        })
      }
    }
  })

  // カテゴリ行
  const catY0 = Y0 + PHASE_HDR + 0.02
  ACTIVITY_CATEGORIES.forEach((cat, ci) => {
    const rowY   = catY0 + ci * CAT_H
    const isEven = ci % 2 === 0

    sl.addShape(prs.ShapeType.rect, {
      x: MG, y: rowY, w: LABEL_W, h: CAT_H - 0.04,
      fill: { color: isEven ? PRIMARY_DK : PRIMARY }, line: { color: PRIMARY, width: 0 },
    })
    sl.addText(cat, {
      x: MG, y: rowY, w: LABEL_W, h: CAT_H - 0.04,
      fontFace: FONT, fontSize: 7, bold: true, color: WHITE, align: 'center', valign: 'middle',
    })

    phases.forEach((phase, pi) => {
      const cx    = MG + LABEL_W + pi * PHASE_W
      const color = PHASE_COLORS[pi % PHASE_COLORS.length]
      const items = phase.categoryActivities?.[cat] ?? []

      sl.addShape(prs.ShapeType.rect, {
        x: cx, y: rowY, w: PHASE_W - 0.05, h: CAT_H - 0.04,
        fill: { color: isEven ? color.light : WHITE },
        line: { color: 'E5E7EB', width: 0.5 },
      })
      sl.addText(items.slice(0, 2).map(a => `• ${a}`).join('\n'), {
        x: cx + 0.06, y: rowY + 0.05, w: PHASE_W - 0.15, h: CAT_H - 0.12,
        fontFace: FONT, fontSize: 6.5, color: DARK, align: 'left', valign: 'top',
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

  const COL_MONTH  = 0.62
  const COL_PHASE  = 1.16
  const COL_TITLE  = 2.47
  const COL_ACTION = CW - COL_MONTH - COL_PHASE - COL_TITLE

  const HDR_ROW_H  = 0.26
  const DATA_ROW_H = (SH - HDR_H - HDR_ROW_H - 0.09) / monthNums.length

  const tableY = HDR_H + 0.06
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
      x: hx + 0.06, y: tableY, w: w, h: HDR_ROW_H,
      fontFace: FONT, fontSize: 7, bold: true, color: WHITE, valign: 'middle',
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
      ? { bg: GRAY13, light: GRAY13_LT, text: DARK }
      : PHASE_COLORS[pi % PHASE_COLORS.length]
    const rowY      = tableY + HDR_ROW_H + ri * DATA_ROW_H
    const rowBg     = isAfter13 ? GRAY13_LT : (ri % 2 === 0 ? WHITE : PRIMARY_LT)

    sl.addShape(prs.ShapeType.rect, {
      x: tableX, y: rowY, w: CW, h: DATA_ROW_H,
      fill: { color: rowBg }, line: { color: 'E5E7EB', width: 0.5 },
    })

    let cx = tableX

    // 月（円）
    const circleSize = Math.min(DATA_ROW_H * 0.65, 0.40)
    const circleX    = cx + (COL_MONTH - circleSize) / 2
    const circleY    = rowY + (DATA_ROW_H - circleSize) / 2 - 0.06
    sl.addShape(prs.ShapeType.ellipse, {
      x: circleX, y: circleY, w: circleSize, h: circleSize,
      fill: { color: color.bg }, line: { color: color.bg, width: 0 },
    })
    sl.addText(isAfter13 ? '…' : String(m.month), {
      x: circleX, y: circleY, w: circleSize, h: circleSize,
      fontFace: FONT, fontSize: 7.5, bold: true, color: WHITE, align: 'center', valign: 'middle',
    })
    // 月ラベル（カレンダー日付がある場合はそちらを優先、なければXヶ月目を表示）
    if (answers.projectStartDate) {
      const calStr = isAfter13
        ? monthToCalLabel(answers.projectStartDate, 12) + '〜'
        : monthToCalLabel(answers.projectStartDate, m.month - 1)
      // 1行目: Xヶ月目
      sl.addText(isAfter13 ? '13ヶ月〜' : `${m.month}ヶ月目`, {
        x: cx + 0.02, y: circleY + circleSize + 0.01, w: COL_MONTH - 0.04, h: 0.11,
        fontFace: FONT, fontSize: 5, color: GRAY, align: 'center',
      })
      // 2行目: YYYY年M月
      sl.addText(calStr, {
        x: cx + 0.02, y: circleY + circleSize + 0.12, w: COL_MONTH - 0.04, h: 0.12,
        fontFace: FONT, fontSize: 5.5, color: color.bg, align: 'center', bold: true,
      })
    } else {
      sl.addText(isAfter13 ? '13ヶ月〜' : `${m.month}ヶ月目`, {
        x: cx + 0.02, y: circleY + circleSize + 0.01, w: COL_MONTH - 0.04, h: 0.14,
        fontFace: FONT, fontSize: 6, color: GRAY, align: 'center',
      })
    }
    cx += COL_MONTH

    // フェーズタグ
    const tagH = 0.20, tagW = COL_PHASE - 0.14
    sl.addShape(prs.ShapeType.rect, {
      x: cx + 0.07, y: rowY + (DATA_ROW_H - tagH) / 2, w: tagW, h: tagH,
      fill: { color: isAfter13 ? 'E5E7EB' : color.light },
      line: { color: 'E5E7EB', width: 0 },
    })
    sl.addText(isAfter13 ? '13ヶ月目以降' : (phase?.name ?? `P${pi + 1}`), {
      x: cx + 0.07, y: rowY + (DATA_ROW_H - tagH) / 2, w: tagW, h: tagH,
      fontFace: FONT, fontSize: 6, color: isAfter13 ? GRAY : color.text, align: 'center', valign: 'middle', bold: true,
    })
    cx += COL_PHASE

    // テーマ
    sl.addText(m.title, {
      x: cx + 0.06, y: rowY + 0.03, w: COL_TITLE - 0.10, h: DATA_ROW_H - 0.06,
      fontFace: FONT, fontSize: 7, bold: !isAfter13, color: isAfter13 ? GRAY : DARK, valign: 'middle',
    })
    cx += COL_TITLE

    // アクション（2件）
    const actText = m.actions.slice(0, 2).map(a => `• ${a}`).join('\n')
    sl.addText(actText, {
      x: cx + 0.06, y: rowY + 0.03, w: COL_ACTION - 0.10, h: DATA_ROW_H - 0.06,
      fontFace: FONT, fontSize: 6.5, color: DARK, valign: 'top', align: 'left',
    })
  })
}

// ==================== Slide 6: デバイス配置イメージ ====================

function addDeviceSlide(prs: PptxGenJS, devicePlan: DevicePlan) {
  const sl = prs.addSlide()
  sl.background = { color: WHITE }

  addHeader(sl, prs, 'デバイス配置イメージ', `運用スタイル: ${devicePlan.operationStyleLabel}`)

  const Y0 = HDR_H + 0.14

  // --- 台数サマリー (3ボックス) ---
  const BOX_W  = 2.62
  const BOX_H  = 0.79
  const boxGap = (CW - BOX_W * 3) / 2
  const boxes = [
    { label: '理想台数',   value: `${devicePlan.idealDeviceCount}`,   bg: PRIMARY_LT, text: PRIMARY    },
    { label: '現在の台数', value: `${devicePlan.currentDeviceCount}`, bg: GRAY_LT,    text: GRAY       },
    { label: '不足台数',   value: `${devicePlan.shortfallCount}`,     bg: GREEN_LT,   text: GREEN      },
  ]
  boxes.forEach((box, i) => {
    const bx = MG + i * (BOX_W + boxGap)
    sl.addShape(prs.ShapeType.rect, {
      x: bx, y: Y0, w: BOX_W, h: BOX_H,
      fill: { color: box.bg }, line: { color: 'E5E7EB', width: 0.5 },
    })
    sl.addText(box.label, { x: bx, y: Y0 + 0.07, w: BOX_W, h: 0.20, fontFace: FONT, fontSize: 7, color: box.text, align: 'center' })
    sl.addText(box.value, { x: bx, y: Y0 + 0.24, w: BOX_W * 0.85, h: 0.40, fontFace: FONT, fontSize: 22, bold: true, color: box.text, align: 'right' })
    sl.addText('台', { x: bx + BOX_W * 0.85, y: Y0 + 0.44, w: BOX_W * 0.12, h: 0.20, fontFace: FONT, fontSize: 9, color: box.text })
  })

  // --- 運用環境整備アセスメント ---
  const ASSESS_Y = Y0 + BOX_H + 0.07
  const ASSESS_H = 0.58
  const { idealDeviceCount: ideal, currentDeviceCount: current, shortfallCount: shortfall, operationStyleLabel } = devicePlan
  const styleShort = operationStyleLabel.replace(/（.*?）/, '').trim()

  let assessColor: string
  let assessIcon: string
  let assessStatus: string
  let assessBody: string
  let assessAction: string

  if (ideal === 0) {
    assessColor = GREEN; assessIcon = '✅'; assessStatus = '運用環境：問題なし'
    assessBody = `BYODタイプのため追加端末不要。スタッフへのアプリ配布・ログイン付与を1ヶ月目に組み込んでください。`
    assessAction = ''
  } else if (current === 0 && shortfall > 0) {
    assessColor = GRAY; assessIcon = '❓'; assessStatus = '端末情報未入力 — 評価不可'
    assessBody = `現在の端末保有数が未入力のため充足状況を評価できません。実際の保有台数を確認してください。`
    assessAction = ''
  } else if (shortfall === 0) {
    assessColor = GREEN; assessIcon = '✅'; assessStatus = '運用環境：充足'
    assessBody = `現在${current}台で「${styleShort}」の計画通りの運用を開始できます。追加調達不要です。`
    assessAction = '端末初期設定・アプリ配布を1ヶ月目のアクションに組み込んでください。'
  } else {
    const ratio = Math.round((shortfall / ideal) * 100)
    if (shortfall <= Math.ceil(ideal * 0.3)) {
      assessColor = ORANGE_DK; assessIcon = '⚠️'; assessStatus = `軽微な不足あり（${shortfall}台・理想比${ratio}%）`
      assessBody = `現状${current}台で優先拠点から先行導入が可能。不足分は段階調達で対応できます。`
      assessAction = '不足分の調達・納期確認を1〜2ヶ月目のアクションに設定してください。'
    } else if (shortfall <= Math.ceil(ideal * 0.6)) {
      assessColor = RED; assessIcon = '⚠️'; assessStatus = `要対応 — 端末不足が運用に影響（${shortfall}台不足・${ratio}%未充足）`
      assessBody = `現状${current}台では「${styleShort}」の全面展開が困難。調達完了まではパイロット運用に絞ることを推奨します。`
      assessAction = '端末調達計画を1ヶ月目の最優先タスクとして経営層に提案してください。'
    } else {
      assessColor = RED; assessIcon = '❌'; assessStatus = `要対応 — 計画した運用の開始が困難（${shortfall}台不足・現状は理想の${100 - ratio}%）`
      assessBody = `このままでは「${styleShort}」での本格運用は開始できず、事業課題の解決が大幅に遅延するリスクがあります。`
      assessAction = '端末調達予算・スケジュールを最優先で確定し、初月のアクションに設定してください。'
    }
  }

  sl.addShape(prs.ShapeType.rect, {
    x: MG, y: ASSESS_Y, w: CW, h: ASSESS_H,
    fill: { color: assessColor === GREEN ? GREEN_LT : assessColor === ORANGE_DK ? ORANGE_LT : assessColor === GRAY ? GRAY_LT : 'FEE2E2' },
    line: { color: assessColor, width: 1 },
  })
  sl.addText(`${assessIcon} ${assessStatus}`, {
    x: MG + 0.10, y: ASSESS_Y + 0.05, w: CW - 0.20, h: 0.18,
    fontFace: FONT, fontSize: 7.5, bold: true, color: assessColor === GRAY ? DARK : assessColor, valign: 'middle',
  })
  sl.addText(assessBody, {
    x: MG + 0.10, y: ASSESS_Y + 0.23, w: CW - 0.20, h: 0.16,
    fontFace: FONT, fontSize: 6.5, color: DARK, valign: 'middle',
  })
  if (assessAction) {
    sl.addText(`推奨アクション: ${assessAction}`, {
      x: MG + 0.10, y: ASSESS_Y + 0.39, w: CW - 0.20, h: 0.15,
      fontFace: FONT, fontSize: 6.5, bold: true, color: assessColor === GRAY ? GRAY : assessColor, valign: 'middle',
    })
  }

  // --- 推奨製品 ---
  const PROD_Y = ASSESS_Y + ASSESS_H + 0.07
  secBar(sl, prs, MG, PROD_Y, CW, '推奨製品', PRIMARY)

  const products = devicePlan.recommendedProducts.slice(0, 3)
  products.forEach((p, i) => {
    const py = PROD_Y + 0.25 + i * 0.47
    sl.addShape(prs.ShapeType.rect, {
      x: MG, y: py, w: CW, h: 0.44,
      fill: { color: i === 0 ? PRIMARY_LT : WHITE },
      line: { color: 'E5E7EB', width: 0.5 },
    })
    sl.addText(p.productName, { x: MG + 0.09, y: py + 0.04, w: 4.0, h: 0.20, fontFace: FONT, fontSize: 8, bold: true, color: DARK })
    sl.addText(p.reason,      { x: MG + 0.09, y: py + 0.24, w: 6.0, h: 0.16, fontFace: FONT, fontSize: 6.5, color: GRAY })
    sl.addText(`¥${p.monthlyUnitPrice.toLocaleString()}/月・台`, {
      x: MG + 6.5, y: py + 0.04, w: CW - 6.6, h: 0.38,
      fontFace: FONT, fontSize: 9, bold: true, color: PRIMARY, align: 'right', valign: 'middle',
    })
  })

  // --- アクセサリーヒント（あれば最大1件） ---
  if (devicePlan.accessoryHints?.length) {
    const AHY = PROD_Y + 0.25 + products.length * 0.47 + 0.11
    secBar(sl, prs, MG, AHY, CW, '特別環境向けアクセサリー推奨', ORANGE)
    devicePlan.accessoryHints.slice(0, 1).forEach((hint, i) => {
      sl.addText(`【${hint.condition}】 ${hint.items.join('  /  ')}`, {
        x: MG + 0.09, y: AHY + 0.25 + i * 0.21, w: CW - 0.15, h: 0.20,
        fontFace: FONT, fontSize: 7, color: DARK,
      })
    })
  }

  // --- 注記 ---
  sl.addText('※ デバイスレンタルサービス料金（Studist提供）の概算です。実際の見積は別途ご案内します。', {
    x: MG, y: SH - 0.22, w: CW, h: 0.19,
    fontFace: FONT, fontSize: 6, color: GRAY, italic: true,
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
  prs.layout = 'LAYOUT_16x9'
  prs.title  = `${answers.companyName || '顧客'} 運用プランご提案`

  const allMonths  = (plan.schedule ?? []).map(s => s.month)
  const firstHalf  = allMonths.filter(m => m >= 1 && m <= 6)
  const secondHalf = allMonths.filter(m => m >= 7)

  addCoverSlide(prs, answers)
  addPremiseSlide(prs, answers)
  addSummarySlide(prs, plan)
  addPhaseScheduleSlide(prs, plan, answers)
  addMonthlySlide(prs, plan, answers, firstHalf,  '月次スケジュール（前半：1〜6ヶ月目）')
  addMonthlySlide(prs, plan, answers, secondHalf, '月次スケジュール（後半：7〜12ヶ月目＋中長期）')
  addDeviceSlide(prs, devicePlan)

  const buffer = await prs.write({ outputType: 'nodebuffer' }) as Buffer
  return buffer
}
