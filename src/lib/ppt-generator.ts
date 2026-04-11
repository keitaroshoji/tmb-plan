import PptxGenJS from 'pptxgenjs'
import path from 'path'
import { TmbWizardAnswers } from '@/src/types/answers'
import { GeneratedPlan, ACTIVITY_CATEGORIES, Phase, CaseStudy } from '@/src/types/plan'
import { DevicePlan } from './device-recommender'
import {
  INDUSTRY_LABELS, SUB_INDUSTRY_LABELS, COMPANY_SIZE_LABELS,
  CHALLENGE_LABELS, GOAL_LABELS, KPI_LABELS, USAGE_STATUS_LABELS,
  BARRIER_LABELS,
} from '@/src/data/labels'

// ==================== カラー定数（3系統パレット統一） ====================
// Main color family（チャコール系）
const DARK         = '2B2F33'   // メインカラー最暗 / 本文テキスト
const COVER_BAR    = '3C434D'   // メインカラー暗  / カバー・フッター
const SLATE        = '4C5359'   // メインカラー中  / 13ヶ月以降
const GRAY         = '7A848F'   // メインカラー明  / サブテキスト
const GRAY_LT      = 'F3F4F6'   // メインカラー最明 / 背景・偶数行
const GRAY_XLT     = 'F9FAFB'   // メインカラー超明 / 13ヶ月以降背景

// Sub color family（ブルー系）
const PRIMARY      = '3B88ED'   // サブカラーメイン
const PRIMARY_DK   = '1244CC'   // サブカラー暗
const PRIMARY_LT   = 'D6E8FB'   // サブカラー明
const PRIMARY_MDK  = '1A56B8'   // サブカラー中暗（Phase 4用）
const PRIMARY_MLT  = 'C7D7F5'   // サブカラー中明（Phase 4背景）

// Accent color family（オレンジ系）
const ORANGE       = 'F7970F'   // アクセントメイン
const ORANGE_LT    = 'FEF3DC'   // アクセント明
const ORANGE_DK    = 'B06B0A'   // アクセント暗

const WHITE        = 'FFFFFF'

// 13ヶ月以降（後方互換）
const GRAY13       = SLATE
const GRAY13_LT    = GRAY_XLT

// フェーズカラー：青の濃淡4段階（オレンジなし）
// Phase 1 → 薄い青、Phase 4 → 濃い青 でフェーズの進行を表現
const PHASE_BLUE_1  = '5FA8F5'   // 淡青
const PHASE_BLUE_1L = 'DAEEFF'   // 淡青（ライト）
const PHASE_BLUE_2  = PRIMARY     // '3B88ED' 中青
const PHASE_BLUE_2L = PRIMARY_LT  // 'D6E8FB'
const PHASE_BLUE_3  = PRIMARY_MDK // '1A56B8' 中濃青
const PHASE_BLUE_3L = PRIMARY_MLT // 'C7D7F5'
const PHASE_BLUE_4  = '0D3490'   // 濃紺
const PHASE_BLUE_4L = 'B8C8E8'   // 濃紺（ライト）

const PHASE_COLORS = [
  { bg: PHASE_BLUE_1, light: PHASE_BLUE_1L, text: PRIMARY_DK  },  // Phase 1: 淡青
  { bg: PHASE_BLUE_2, light: PHASE_BLUE_2L, text: PRIMARY_DK  },  // Phase 2: 中青
  { bg: PHASE_BLUE_3, light: PHASE_BLUE_3L, text: WHITE        },  // Phase 3: 中濃青
  { bg: PHASE_BLUE_4, light: PHASE_BLUE_4L, text: WHITE        },  // Phase 4: 濃紺
]

// ==================== スライドサイズ（LAYOUT_16x9 = 10" × 5.625"） ====================

const SW              = 10
const SH              = 5.625
const CX              = SW / 2               // スライド中央X = 5"
const CY              = SH / 2               // スライド中央Y = 2.8125"
const MG              = CX - 11.5 / 2.54    // 左右余白: センターから11.5cm ≈ 0.472"
const CW              = SW - MG * 2          // コンテンツ幅: 23cm ≈ 9.055"
const CONTENT_Y       = CY - 3.9 / 2.54     // コンテンツ上端: センターから上3.9cm ≈ 1.277"
const CONTENT_END     = CY + 5.9 / 2.54     // コンテンツ下端: センターから下5.9cm ≈ 5.135"
const HEADLINE_LINE_Y = CY - 6.0 / 2.54     // ヘッドラインライン: センターから上6.0cm ≈ 0.450"
const FOOTER_Y        = CY + 6.2 / 2.54     // フッター上端: センターから下6.2cm ≈ 5.253"
const FOOTER_H_VAL    = SH - FOOTER_Y        // フッター高さ ≈ 0.372"
const BRAND_COLOR     = '1A40B1'             // ヘッドラインライン・フッター色

// ==================== フォント ====================

const FONT = 'Noto Sans JP'

// ==================== 画像パス ====================

const COVER_BG_PATH     = path.join(process.cwd(), 'public', 'ppt-cover-bg.png')
const STUDIST_LOGO_PATH = path.join(process.cwd(), 'public', 'ppt-studist-logo.png')
const FOOTER_LOGO_PATH  = path.join(process.cwd(), 'public', 'ppt-footer-logo.png')

// ==================== 型エイリアス ====================

type Sl = ReturnType<InstanceType<typeof PptxGenJS>['addSlide']>

// ==================== ユーティリティ ====================

function addHeader(sl: Sl, prs: PptxGenJS, title: string, sub?: string) {
  // ヘッドラインテキスト（12pt・黒・ラインの上）
  // テキスト開始X: センターから左11.5cm = MG（余白ゼロ）
  sl.addText(title, {
    x: MG, y: HEADLINE_LINE_Y - 0.27, w: CW, h: 0.24,
    fontFace: FONT, fontSize: 12, color: DARK, valign: 'middle', margin: 0,
  })
  // ヘッドラインライン（全幅・BRAND_COLOR）
  sl.addShape(prs.ShapeType.rect, {
    x: 0, y: HEADLINE_LINE_Y, w: SW, h: 0.03,
    fill: { color: BRAND_COLOR }, line: { color: BRAND_COLOR, width: 0 },
  })
  // メインメッセージライン（16pt・太字・中央揃え）
  if (sub) {
    sl.addText(sub, {
      x: MG, y: HEADLINE_LINE_Y + 0.06, w: CW, h: CONTENT_Y - HEADLINE_LINE_Y - 0.08,
      fontFace: FONT, fontSize: 16, bold: true, color: DARK, valign: 'middle', align: 'center',
    })
  }
}

function addFooter(sl: Sl, prs: PptxGenJS) {
  const fy = FOOTER_Y
  const fh = FOOTER_H_VAL
  // フッターバー（BRAND_COLOR）
  sl.addShape(prs.ShapeType.rect, {
    x: 0, y: fy, w: SW, h: fh,
    fill: { color: BRAND_COLOR }, line: { color: BRAND_COLOR, width: 0 },
  })
  // フッターロゴ（1601×365px: アスペクト比 4.386）
  try {
    const lh = fh * 0.50                    // フッター高さの50%（上下に均等余白）
    const lw = lh * (1601 / 365)            // 実際のアスペクト比で幅を算出
    sl.addImage({ path: FOOTER_LOGO_PATH, x: MG, y: fy + (fh - lh) / 2, w: lw, h: lh })
  } catch {
    try {
      const lh = fh * 0.50
      const lw = lh * (190 / 44)            // studist-logo.png のアスペクト比
      sl.addImage({ path: STUDIST_LOGO_PATH, x: MG, y: fy + (fh - lh) / 2, w: lw, h: lh })
    } catch {
      sl.addText('studist', { x: MG, y: fy, w: 1.2, h: fh, fontFace: FONT, fontSize: 8, color: WHITE, valign: 'middle' })
    }
  }
  // Copyright
  sl.addText('Copyright (C) Studist Corporation. All Rights Reserved', {
    x: MG, y: fy, w: CW, h: fh,
    fontFace: FONT, fontSize: 6, color: WHITE, valign: 'middle', align: 'right',
  })
}

function secBar(sl: Sl, prs: PptxGenJS, x: number, y: number, w: number, text: string, color = PRIMARY) {
  sl.addShape(prs.ShapeType.rect, {
    x, y, w, h: 0.22,
    fill: { color }, line: { color, width: 0 },
  })
  sl.addText(text, {
    x: x + 0.07, y, w: w - 0.11, h: 0.22,
    fontFace: FONT, fontSize: 8, bold: false, color: WHITE, valign: 'middle',
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

  // タイトルテキスト（上下センターライン上に配置）
  const company = answers.companyName || '顧客'
  const TITLE_H = 0.45
  sl.addText(`${company} 様　Teachme Biz 運用プランご提案`, {
    x: MG, y: CY - TITLE_H / 2, w: CW, h: TITLE_H,
    fontFace: FONT, fontSize: 24, bold: true, color: DARK, valign: 'middle',
  })

  // 提案日（センターから下3.7cm・Noto Sans JP 8pt・黒文字）
  const DATE_Y = CY + 3.7 / 2.54   // ≈ 4.269"
  const today = new Date()
  const dateStr = `${today.getFullYear()}年${today.getMonth() + 1}月${today.getDate()}日`
  sl.addText(dateStr, {
    x: MG, y: DATE_Y, w: CW, h: 0.22,
    fontFace: FONT, fontSize: 8, color: DARK, valign: 'middle',
  })

  // 提案元（日付直下・「株式会社スタディスト」固定・12pt）
  sl.addText('株式会社スタディスト', {
    x: MG, y: DATE_Y + 0.24, w: CW, h: 0.30,
    fontFace: FONT, fontSize: 12, bold: false, color: DARK, valign: 'middle',
  })
}

// ==================== Slide 1: 前提情報 ====================

function addPremiseSlide(prs: PptxGenJS, answers: TmbWizardAnswers) {
  const sl = prs.addSlide()
  sl.background = { color: WHITE }

  const company     = answers.companyName || '顧客'
  const industry    = INDUSTRY_LABELS[answers.industry ?? ''] ?? ''
  const subInd      = answers.subIndustry ? (SUB_INDUSTRY_LABELS[answers.subIndustry] ?? '') : ''
  const industryStr = [industry, subInd].filter(Boolean).join(' › ')
  const size        = COMPANY_SIZE_LABELS[answers.companySize ?? ''] ?? ''

  addHeader(sl, prs, '前提情報', `${company} 様`)

  const LW = (CW - 0.20) / 2
  const RX = MG + LW + 0.20
  const RW = CW - LW - 0.20

  // フォント・行高
  const FS_HDR = 9
  const FS_LBL = 8.5
  const FS_VAL = 10
  const HDR_H  = 0.28
  const DATA_H = 0.33
  const GAP_Y  = 0.14

  type CellOpts = {
    bold?: boolean; color?: string; fill?: { color: string };
    fontFace?: string; fontSize?: number; align?: 'left' | 'center'; valign?: 'middle' | 'top'; colspan?: number
  }
  type Cell = { text: string; options: CellOpts }

  const hdrCell = (text: string, col: string, colspan = 1): Cell => ({
    text, options: { bold: false, color: WHITE, fill: { color: col }, fontFace: FONT, fontSize: FS_HDR, valign: 'middle', colspan },
  })
  const lblCell = (text: string, even: boolean): Cell => ({
    text, options: { bold: false, color: GRAY, fill: { color: even ? GRAY_LT : WHITE }, fontFace: FONT, fontSize: FS_LBL, valign: 'middle' },
  })
  const valCell = (text: string, even: boolean): Cell => ({
    text, options: { color: DARK, fill: { color: even ? GRAY_LT : WHITE }, fontFace: FONT, fontSize: FS_VAL, valign: 'middle' },
  })
  const bulletCell = (text: string, even: boolean): Cell => ({
    text, options: { color: DARK, fill: { color: even ? GRAY_LT : WHITE }, fontFace: FONT, fontSize: FS_VAL, valign: 'middle' },
  })

  // ===== 左: 企業・組織情報 =====
  const orgRows: [string, string][] = [
    ['業種',    industryStr || '—'],
    ['企業規模', size || '—'],
    ['拠点数',  `${answers.locationCount} 拠点`],
    ['FC有無',  answers.isFranchise ? 'あり（FC本部・加盟店）' : 'なし'],
  ]
  if (answers.departmentNote) orgRows.push(['対象部門', answers.departmentNote])
  if (answers.projectStartDate) {
    const [y, m] = answers.projectStartDate.split('-')
    orgRows.push(['開始予定', `${y}年 ${parseInt(m, 10)}月`])
  }

  sl.addTable(
    [
      [hdrCell('企業・組織情報', DARK, 2)],
      ...orgRows.map(([lbl, val], i) => [lblCell(lbl, i % 2 === 0), valCell(val, i % 2 === 0)]),
    ],
    {
      x: MG, y: CONTENT_Y, w: LW,
      colW: [1.10, LW - 1.10],
      rowH: [HDR_H, ...orgRows.map(() => DATA_H)],
      border: { type: 'solid', pt: 0.5, color: 'E5E7EB' },
      fontFace: FONT,
    },
  )

  // ===== 左: 推進上の障壁 =====
  const barriers = answers.operationalBarriers.map(b => BARRIER_LABELS[b] ?? b).slice(0, 5)
  const barrierY = CONTENT_Y + HDR_H + orgRows.length * DATA_H + GAP_Y

  sl.addTable(
    [
      [hdrCell('推進上の障壁', DARK)],
      ...barriers.map((b, i) => [bulletCell(`• ${b}`, i % 2 === 0)]),
    ],
    {
      x: MG, y: barrierY, w: LW,
      colW: [LW],
      rowH: [HDR_H, ...barriers.map(() => DATA_H)],
      border: { type: 'solid', pt: 0.5, color: 'E5E7EB' },
      fontFace: FONT,
    },
  )

  // ===== 右: 経営課題 =====
  const challenges = answers.challenges.map(c => CHALLENGE_LABELS[c] ?? c).slice(0, 5)

  sl.addTable(
    [
      [hdrCell('経営課題', PRIMARY)],
      ...challenges.map((c, i) => [bulletCell(`• ${c}`, i % 2 === 0)]),
    ],
    {
      x: RX, y: CONTENT_Y, w: RW,
      colW: [RW],
      rowH: [HDR_H, ...challenges.map(() => DATA_H)],
      border: { type: 'solid', pt: 0.5, color: 'E5E7EB' },
      fontFace: FONT,
    },
  )

  // ===== 右: 導入目的・KPI =====
  const goals       = (answers.primaryGoals ?? []).map(g => GOAL_LABELS[g] ?? g).join('、')
  const kpi         = KPI_LABELS[answers.priorityKpi ?? ''] ?? ''
  const usageStatus = USAGE_STATUS_LABELS[answers.usageStatus ?? ''] ?? ''
  const goalRows: [string, string][] = [['目的', goals], ['優先KPI', kpi]]
  if (answers.targetValue) goalRows.push(['目標値', answers.targetValue])
  if (usageStatus) goalRows.push(['利用状況', usageStatus])

  const goalY = CONTENT_Y + HDR_H + challenges.length * DATA_H + GAP_Y

  sl.addTable(
    [
      [hdrCell('導入目的・KPI', PRIMARY, 2)],
      ...goalRows.map(([lbl, val], i) => [lblCell(lbl, i % 2 === 0), valCell(val, i % 2 === 0)]),
    ],
    {
      x: RX, y: goalY, w: RW,
      colW: [1.00, RW - 1.00],
      rowH: [HDR_H, ...goalRows.map(() => DATA_H)],
      border: { type: 'solid', pt: 0.5, color: 'E5E7EB' },
      fontFace: FONT,
    },
  )

  addFooter(sl, prs)
}

// ==================== Slide 2: プランサマリー ====================

function addSummarySlide(prs: PptxGenJS, plan: GeneratedPlan) {
  const sl = prs.addSlide()
  sl.background = { color: WHITE }

  addHeader(sl, prs, 'プランサマリー', '運用プランの全体概要とKPI目標')

  const Y0 = CONTENT_Y
  const LW = (CW - 0.15) / 2
  const RX = MG + LW + 0.15

  // --- プロジェクト概要 ---
  sl.addShape(prs.ShapeType.rect, {
    x: MG, y: Y0, w: LW, h: 0.22,
    fill: { color: DARK }, line: { color: DARK, width: 0 },
  })
  sl.addText('プロジェクト概要', {
    x: MG + 0.07, y: Y0, w: LW - 0.11, h: 0.22,
    fontFace: FONT, fontSize: 8, bold: false, color: WHITE, valign: 'middle',
  })
  const TEXT_H = 2.10  // 概要・ポイントのテキストボックス高さ

  sl.addShape(prs.ShapeType.rect, {
    x: MG, y: Y0 + 0.22, w: LW, h: TEXT_H,
    fill: { color: GRAY_LT }, line: { color: 'E5E7EB', width: 0.5 },
  })
  sl.addText(plan.projectOverview ?? plan.summary ?? '', {
    x: MG + 0.10, y: Y0 + 0.27, w: LW - 0.20, h: TEXT_H - 0.10,
    fontFace: FONT, fontSize: 8, color: DARK, valign: 'top', align: 'left',
  })

  // --- 推進上のポイント ---
  sl.addShape(prs.ShapeType.rect, {
    x: RX, y: Y0, w: LW, h: 0.22,
    fill: { color: DARK }, line: { color: DARK, width: 0 },
  })
  sl.addText('推進上のポイント', {
    x: RX + 0.07, y: Y0, w: LW - 0.11, h: 0.22,
    fontFace: FONT, fontSize: 8, bold: false, color: WHITE, valign: 'middle',
  })
  sl.addShape(prs.ShapeType.rect, {
    x: RX, y: Y0 + 0.22, w: LW, h: TEXT_H,
    fill: { color: GRAY_LT }, line: { color: 'E5E7EB', width: 0.5 },
  })
  sl.addText(plan.promotionPoints ?? '', {
    x: RX + 0.10, y: Y0 + 0.27, w: LW - 0.20, h: TEXT_H - 0.10,
    fontFace: FONT, fontSize: 8, color: DARK, valign: 'top', align: 'left',
  })

  // --- KPI目標（青ベース・目標値のみオレンジ強調） ---
  const KPI_Y = Y0 + 0.22 + TEXT_H + 0.09
  const kpiTargets = plan.kpiTargets ?? []
  if (kpiTargets.length > 0) {
    secBar(sl, prs, MG, KPI_Y, CW, 'KPI目標', PRIMARY)
    const kpiCardW = (CW - 0.08 * (kpiTargets.length - 1)) / kpiTargets.length
    const kpiCardH = 0.60
    kpiTargets.slice(0, 3).forEach((k, i) => {
      const kx = MG + i * (kpiCardW + 0.08)
      const ky = KPI_Y + 0.24
      sl.addShape(prs.ShapeType.rect, {
        x: kx, y: ky, w: kpiCardW, h: kpiCardH,
        fill: { color: PRIMARY_LT }, line: { color: PRIMARY, width: 0.5 },
      })
      sl.addText(k.kpi, {
        x: kx + 0.07, y: ky + 0.03, w: kpiCardW - 0.12, h: 0.18,
        fontFace: FONT, fontSize: 8, bold: false, color: PRIMARY_DK, valign: 'middle',
      })
      sl.addText(k.target, {
        x: kx + 0.07, y: ky + 0.22, w: kpiCardW - 0.12, h: 0.20,
        fontFace: FONT, fontSize: 8, bold: false, color: ORANGE_DK, valign: 'middle',
      })
      sl.addText(k.timing, {
        x: kx + 0.07, y: ky + 0.44, w: kpiCardW - 0.12, h: 0.13,
        fontFace: FONT, fontSize: 8, color: GRAY, valign: 'middle',
      })
    })
  }

  addFooter(sl, prs)
}

// ==================== Slide 3: マニュアル活用イメージ ====================

function addUsageScenariosSlide(prs: PptxGenJS, plan: GeneratedPlan) {
  const sl = prs.addSlide()
  sl.background = { color: WHITE }
  addHeader(sl, prs, 'マニュアル活用イメージ', '作るマニュアル・使うシーン・生まれる効果')

  // manualUsagePairs を優先、なければ usageScenarios にフォールバック
  const pairs = plan.manualUsagePairs ?? []
  const scenarios = plan.usageScenarios ?? []
  const items = pairs.length > 0 ? pairs : scenarios.map(s => ({
    targetUser: s.user,
    manualTitle: s.manualTitle,
    content: s.scene,
    feature: '',
    scene: s.scene,
    effect: s.effect,
  }))

  const GAP = 0.14
  const cardW = (CW - GAP * 2) / 3
  const cardY = CONTENT_Y + 0.26
  const cardH = CONTENT_END - cardY - 0.05
  const TITLE_H = 0.28
  const TAG_H   = 0.22

  secBar(sl, prs, MG, CONTENT_Y, CW, 'マニュアル活用イメージ', PRIMARY)

  items.slice(0, 3).forEach((s, i) => {
    const cx = MG + i * (cardW + GAP)

    // 対象者タグ
    sl.addShape(prs.ShapeType.rect, {
      x: cx, y: cardY, w: cardW, h: TAG_H,
      fill: { color: PRIMARY_LT }, line: { color: PRIMARY_LT, width: 0 },
    })
    sl.addText(`対象: ${'targetUser' in s ? s.targetUser : ''}`, {
      x: cx + 0.06, y: cardY, w: cardW - 0.08, h: TAG_H,
      fontFace: FONT, fontSize: 8, color: PRIMARY_DK, valign: 'middle',
    })

    // カードタイトル（マニュアル名）
    sl.addShape(prs.ShapeType.rect, {
      x: cx, y: cardY + TAG_H, w: cardW, h: TITLE_H,
      fill: { color: PRIMARY }, line: { color: PRIMARY, width: 0 },
    })
    sl.addText(s.manualTitle, {
      x: cx + 0.06, y: cardY + TAG_H, w: cardW - 0.08, h: TITLE_H,
      fontFace: FONT, fontSize: 8, bold: false, color: WHITE, valign: 'middle',
    })

    // カード本体
    const bodyY = cardY + TAG_H + TITLE_H
    const bodyH = cardH - TAG_H - TITLE_H
    sl.addShape(prs.ShapeType.rect, {
      x: cx, y: bodyY, w: cardW, h: bodyH,
      fill: { color: GRAY_LT }, line: { color: 'E5E7EB', width: 0.5 },
    })

    // 3行（場面・機能・効果）
    const ROW_H = bodyH / 3
    const rowData: [string, string][] = [
      ['場面', 'scene' in s ? s.scene : ''],
      ['機能', 'feature' in s ? s.feature : ''],
      ['効果', s.effect],
    ]
    rowData.forEach(([label, text], ri) => {
      const ry = bodyY + ri * ROW_H
      if (ri > 0) {
        sl.addShape(prs.ShapeType.rect, {
          x: cx, y: ry, w: cardW, h: 0.007,
          fill: { color: 'E5E7EB' }, line: { color: 'E5E7EB', width: 0 },
        })
      }
      sl.addText(label, {
        x: cx + 0.08, y: ry + 0.05, w: 0.48, h: 0.18,
        fontFace: FONT, fontSize: 8, bold: false, color: PRIMARY, valign: 'middle',
      })
      sl.addText(text, {
        x: cx + 0.08, y: ry + 0.24, w: cardW - 0.14, h: ROW_H - 0.26,
        fontFace: FONT, fontSize: 8, color: DARK, valign: 'top', align: 'left',
      })
    })
  })

  addFooter(sl, prs)
}

// ==================== Slide 3: 全体スケジュール案 ====================

function addPhaseScheduleSlide(prs: PptxGenJS, plan: GeneratedPlan, answers: TmbWizardAnswers) {
  const sl = prs.addSlide()
  sl.background = { color: WHITE }

  addHeader(sl, prs, '年間スケジュール（四半期）', '4フェーズの活動計画')

  const phases    = plan.phases ?? []
  const LABEL_W   = 1.05
  const PHASE_W   = (CW - LABEL_W) / Math.max(phases.length, 1)
  const PHASE_HDR = 0.56
  const CAT_H     = (CONTENT_END - CONTENT_Y - PHASE_HDR) / ACTIVITY_CATEGORIES.length

  // フェーズヘッダー行
  const headerRow = [
    { text: '', options: { fill: { color: GRAY_LT } } },
    ...phases.map((phase, pi) => {
      const color = PHASE_COLORS[pi % PHASE_COLORS.length]
      let label = phase.name + '\n' + phase.period
      if (answers.projectStartDate) {
        const ns = phase.period.match(/\d+/g)?.map(Number) ?? []
        if (ns.length >= 2) {
          label += '\n' + monthToCalLabel(answers.projectStartDate, ns[0] - 1) + '〜' + monthToCalLabel(answers.projectStartDate, ns[1] - 1)
        }
      }
      return {
        text: label,
        options: {
          bold: false, color: WHITE, fill: { color: color.bg },
          align: 'center' as const, valign: 'middle' as const, fontSize: 8,
        },
      }
    }),
  ]

  // カテゴリ行
  const catRows = ACTIVITY_CATEGORIES.map((cat, ci) => {
    const isEven = ci % 2 === 0
    return [
      {
        text: cat,
        options: {
          bold: false, color: WHITE,
          fill: { color: isEven ? PRIMARY_DK : PRIMARY },
          align: 'center' as const, valign: 'middle' as const, fontSize: 8,
        },
      },
      ...phases.map((phase, pi) => {
        const color = PHASE_COLORS[pi % PHASE_COLORS.length]
        const items = phase.categoryActivities?.[cat] ?? []
        return {
          text: items.slice(0, 2).map(a => `• ${a}`).join('\n'),
          options: {
            color: DARK,
            fill: { color: isEven ? color.light : WHITE },
            align: 'left' as const, valign: 'top' as const, fontSize: 8,
          },
        }
      }),
    ]
  })

  sl.addTable([headerRow, ...catRows], {
    x: MG, y: CONTENT_Y, w: CW,
    colW: [LABEL_W, ...phases.map(() => PHASE_W)],
    rowH: [PHASE_HDR, ...ACTIVITY_CATEGORIES.map(() => CAT_H)],
    border: { type: 'solid', pt: 0.5, color: 'E5E7EB' },
    fontFace: FONT, fontSize: 8,
  })

  addFooter(sl, prs)
}

// ==================== Slide 4/5: 各月スケジュール（前半・後半） ====================

function addMonthlySlide(
  prs: PptxGenJS,
  plan: GeneratedPlan,
  answers: TmbWizardAnswers,
  monthNums: number[],
  title: string,
  subMessage?: string,
) {
  const sl = prs.addSlide()
  sl.background = { color: WHITE }

  addHeader(sl, prs, title, subMessage)

  const phases = plan.phases ?? []

  const COL_MONTH  = 0.70
  const COL_PHASE  = 1.20
  const COL_TITLE  = 2.40
  const COL_ACTION = CW - COL_MONTH - COL_PHASE - COL_TITLE

  const HDR_ROW_H  = 0.26
  const DATA_ROW_H = (CONTENT_END - CONTENT_Y - HDR_ROW_H) / monthNums.length

  const allSchedule = plan.schedule ?? []

  // ヘッダー行
  const headerRow = [
    { text: '月', options: { bold: false, color: WHITE, fill: { color: DARK }, align: 'center' as const, valign: 'middle' as const, fontSize: 8 } },
    { text: 'フェーズ', options: { bold: false, color: WHITE, fill: { color: DARK }, align: 'center' as const, valign: 'middle' as const, fontSize: 8 } },
    { text: 'テーマ', options: { bold: false, color: WHITE, fill: { color: DARK }, align: 'center' as const, valign: 'middle' as const, fontSize: 8 } },
    { text: '主要アクション', options: { bold: false, color: WHITE, fill: { color: DARK }, align: 'center' as const, valign: 'middle' as const, fontSize: 8 } },
  ]

  // データ行
  const dataRows = monthNums.map((monthNum, ri) => {
    const m = allSchedule.find(s => s.month === monthNum)
    const isAfter13 = m ? m.month >= 13 : false
    const pi    = m ? (isAfter13 ? phases.length - 1 : getPhaseIdx(m.month, phases)) : 0
    const phase = phases[pi]
    const color = isAfter13
      ? { bg: GRAY13, light: GRAY13_LT, text: DARK }
      : PHASE_COLORS[pi % PHASE_COLORS.length]
    const rowBg = isAfter13 ? GRAY13_LT : (ri % 2 === 0 ? WHITE : PRIMARY_LT)

    // 月ラベル
    let monthLabel = m ? (isAfter13 ? '13ヶ月〜' : `${m.month}ヶ月目`) : ''
    if (m && answers.projectStartDate) {
      const calStr = isAfter13
        ? monthToCalLabel(answers.projectStartDate, 12) + '〜'
        : monthToCalLabel(answers.projectStartDate, m.month - 1)
      monthLabel += '\n' + calStr
    }

    return [
      {
        text: monthLabel,
        options: { bold: false, color: color.bg, fill: { color: rowBg }, align: 'center' as const, valign: 'middle' as const, fontSize: 8 },
      },
      {
        text: isAfter13 ? '13ヶ月目以降' : (phase?.name ?? `P${pi + 1}`),
        options: { bold: false, color: isAfter13 ? GRAY : DARK, fill: { color: rowBg }, align: 'center' as const, valign: 'middle' as const, fontSize: 8 },
      },
      {
        text: m?.title ?? '',
        options: { bold: !isAfter13, color: isAfter13 ? GRAY : DARK, fill: { color: rowBg }, align: 'left' as const, valign: 'middle' as const, fontSize: 8 },
      },
      {
        text: m ? m.actions.slice(0, 2).map(a => `• ${a}`).join('\n') : '',
        options: { color: DARK, fill: { color: rowBg }, align: 'left' as const, valign: 'top' as const, fontSize: 8 },
      },
    ]
  })

  sl.addTable([headerRow, ...dataRows], {
    x: MG, y: CONTENT_Y, w: CW,
    colW: [COL_MONTH, COL_PHASE, COL_TITLE, COL_ACTION],
    rowH: [HDR_ROW_H, ...monthNums.map(() => DATA_ROW_H)],
    border: { type: 'solid', pt: 0.5, color: 'E5E7EB' },
    fontFace: FONT, fontSize: 8,
  })

  addFooter(sl, prs)
}

// ==================== Slide 6: デバイス配置イメージ ====================

function addDeviceSlide(prs: PptxGenJS, devicePlan: DevicePlan) {
  const sl = prs.addSlide()
  sl.background = { color: WHITE }

  addHeader(sl, prs, 'デバイス配置イメージ', `運用スタイル: ${devicePlan.operationStyleLabel}`)

  const Y0 = CONTENT_Y

  // --- 台数サマリー (3ボックス) ---
  const BOX_W  = 2.62
  const BOX_H  = 0.79
  const boxGap = (CW - BOX_W * 3) / 2
  const boxes = [
    { label: '理想台数',   value: `${devicePlan.idealDeviceCount}`,   bg: PRIMARY_LT, text: PRIMARY    },
    { label: '現在の台数', value: `${devicePlan.currentDeviceCount}`, bg: GRAY_LT,    text: GRAY       },
    { label: '不足台数',   value: `${devicePlan.shortfallCount}`,     bg: ORANGE_LT,  text: ORANGE_DK  },
  ]
  boxes.forEach((box, i) => {
    const bx = MG + i * (BOX_W + boxGap)
    sl.addShape(prs.ShapeType.rect, {
      x: bx, y: Y0, w: BOX_W, h: BOX_H,
      fill: { color: box.bg }, line: { color: 'E5E7EB', width: 0.5 },
    })
    sl.addText(box.label, { x: bx, y: Y0 + 0.07, w: BOX_W, h: 0.20, fontFace: FONT, fontSize: 8, color: box.text, align: 'center' })
    sl.addText(box.value, { x: bx, y: Y0 + 0.24, w: BOX_W * 0.85, h: 0.40, fontFace: FONT, fontSize: 22, bold: false, color: box.text, align: 'right' })
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
    assessColor = PRIMARY; assessIcon = '✅'; assessStatus = '運用環境：問題なし'
    assessBody = `BYODタイプのため追加端末不要。スタッフへのアプリ配布・ログイン付与を1ヶ月目に組み込んでください。`
    assessAction = ''
  } else if (current === 0 && shortfall > 0) {
    assessColor = GRAY; assessIcon = '❓'; assessStatus = '端末情報未入力 — 評価不可'
    assessBody = `現在の端末保有数が未入力のため充足状況を評価できません。実際の保有台数を確認してください。`
    assessAction = ''
  } else if (shortfall === 0) {
    assessColor = PRIMARY; assessIcon = '✅'; assessStatus = '運用環境：充足'
    assessBody = `現在${current}台で「${styleShort}」の計画通りの運用を開始できます。追加調達不要です。`
    assessAction = '端末初期設定・アプリ配布を1ヶ月目のアクションに組み込んでください。'
  } else {
    const ratio = Math.round((shortfall / ideal) * 100)
    if (shortfall <= Math.ceil(ideal * 0.3)) {
      assessColor = ORANGE; assessIcon = '⚠️'; assessStatus = `軽微な不足あり（${shortfall}台・理想比${ratio}%）`
      assessBody = `現状${current}台で優先拠点から先行導入が可能。不足分は段階調達で対応できます。`
      assessAction = '不足分の調達・納期確認を1〜2ヶ月目のアクションに設定してください。'
    } else if (shortfall <= Math.ceil(ideal * 0.6)) {
      assessColor = ORANGE_DK; assessIcon = '⚠️'; assessStatus = `要対応 — 端末不足が運用に影響（${shortfall}台不足・${ratio}%未充足）`
      assessBody = `現状${current}台では「${styleShort}」の全面展開が困難。調達完了まではパイロット運用に絞ることを推奨します。`
      assessAction = '端末調達計画を1ヶ月目の最優先タスクとして経営層に提案してください。'
    } else {
      assessColor = DARK; assessIcon = '❌'; assessStatus = `要対応 — 計画した運用の開始が困難（${shortfall}台不足・現状は理想の${100 - ratio}%）`
      assessBody = `このままでは「${styleShort}」での本格運用は開始できず、事業課題の解決が大幅に遅延するリスクがあります。`
      assessAction = '端末調達予算・スケジュールを最優先で確定し、初月のアクションに設定してください。'
    }
  }

  // アセスメント背景色マッピング（パレット内のみ）
  const assessBg =
    assessColor === PRIMARY  ? PRIMARY_LT :
    assessColor === ORANGE   ? ORANGE_LT  :
    assessColor === ORANGE_DK ? ORANGE_LT :
    assessColor === DARK     ? GRAY_LT    : GRAY_LT

  sl.addShape(prs.ShapeType.rect, {
    x: MG, y: ASSESS_Y, w: CW, h: ASSESS_H,
    fill: { color: assessBg },
    line: { color: assessColor, width: 1 },
  })
  sl.addText(`${assessIcon} ${assessStatus}`, {
    x: MG + 0.10, y: ASSESS_Y + 0.05, w: CW - 0.20, h: 0.18,
    fontFace: FONT, fontSize: 8, bold: false, color: assessColor === GRAY ? DARK : assessColor, valign: 'middle',
  })
  sl.addText(assessBody, {
    x: MG + 0.10, y: ASSESS_Y + 0.23, w: CW - 0.20, h: 0.16,
    fontFace: FONT, fontSize: 8, color: DARK, valign: 'middle',
  })
  if (assessAction) {
    sl.addText(`推奨アクション: ${assessAction}`, {
      x: MG + 0.10, y: ASSESS_Y + 0.39, w: CW - 0.20, h: 0.15,
      fontFace: FONT, fontSize: 8, bold: false, color: assessColor === GRAY ? GRAY : assessColor, valign: 'middle',
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
    sl.addText(p.productName, { x: MG + 0.09, y: py + 0.04, w: 4.0, h: 0.20, fontFace: FONT, fontSize: 8, bold: false, color: DARK })
    sl.addText(p.reason,      { x: MG + 0.09, y: py + 0.24, w: 6.0, h: 0.16, fontFace: FONT, fontSize: 8, color: GRAY })
    sl.addText(`¥${p.monthlyUnitPrice.toLocaleString()}/月・台`, {
      x: MG + 6.5, y: py + 0.04, w: CW - 6.6, h: 0.38,
      fontFace: FONT, fontSize: 9, bold: false, color: PRIMARY, align: 'right', valign: 'middle',
    })
  })

  // --- アクセサリーヒント（あれば最大1件） ---
  if (devicePlan.accessoryHints?.length) {
    const AHY = PROD_Y + 0.25 + products.length * 0.47 + 0.11
    secBar(sl, prs, MG, AHY, CW, '特別環境向けアクセサリー推奨', ORANGE)
    devicePlan.accessoryHints.slice(0, 1).forEach((hint, i) => {
      sl.addText(`【${hint.condition}】 ${hint.items.join('  /  ')}`, {
        x: MG + 0.09, y: AHY + 0.25 + i * 0.21, w: CW - 0.15, h: 0.20,
        fontFace: FONT, fontSize: 8, color: DARK,
      })
    })
  }

  // --- 注記 ---
  sl.addText('※ デバイスレンタルサービス料金（Studist提供）の概算です。実際の見積は別途ご案内します。', {
    x: MG, y: CONTENT_END - 0.19, w: CW, h: 0.19,
    fontFace: FONT, fontSize: 6, color: GRAY, italic: true,
  })

  addFooter(sl, prs)
}

// ==================== Slide 8: 他社事例 ====================

function addCaseStudiesSlide(prs: PptxGenJS, cases: CaseStudy[]) {
  const sl = prs.addSlide()
  sl.background = { color: WHITE }
  addHeader(sl, prs, '他社事例', '同業・同規模企業の導入成果')

  if (!cases || cases.length === 0) {
    sl.addText('事例データがありません', {
      x: MG, y: CONTENT_Y + 1.5, w: CW, h: 0.5,
      fontFace: FONT, fontSize: 11, color: GRAY, align: 'center',
    })
    addFooter(sl, prs)
    return
  }

  // 最大3件を横並び表形式で表示
  const caseList = cases.slice(0, 3)
  const NUM_COLS = caseList.length

  // カラム幅（会社名ラベル列 + 事例列）
  const LABEL_W  = 0.70
  const CASE_W   = (CW - LABEL_W) / NUM_COLS

  // 行定義: ヘッダー行 + 課題・解決策・効果・定量効果
  const HDR_H   = 0.35
  const ROW_H   = (CONTENT_END - CONTENT_Y - HDR_H) / 4

  type TC = { text: string; options: Record<string, unknown> }

  // 見出し行（会社名）: DARK背景・白抜き文字
  const hdr = (text: string): TC => ({
    text,
    options: { fontFace: FONT, fontSize: 8, color: WHITE, fill: { color: DARK }, valign: 'middle' as const, align: 'center' as const },
  })
  // 行ラベル（課題/解決策/効果）: GRAY_LT背景・DARK文字
  const lbl = (text: string): TC => ({
    text,
    options: { fontFace: FONT, fontSize: 8, color: DARK, fill: { color: GRAY_LT }, valign: 'middle' as const, align: 'center' as const },
  })
  // データセル: 白背景・黒文字
  const cell = (text: string): TC => ({
    text,
    options: { fontFace: FONT, fontSize: 8, color: DARK, fill: { color: WHITE }, valign: 'top' as const, align: 'left' as const },
  })

  // ヘッダー行: [空ラベル, 会社名×N]
  const headerRow: TC[] = [
    { text: '', options: { fill: { color: DARK } } },
    ...caseList.map(c => {
      const meta = [c.industry, c.companySize].filter(Boolean).join(' / ')
      return hdr(`${c.companyName}\n${meta}`)
    }),
  ]

  // データ行: [行ラベル, 各事例セル]
  const rowDefs: { label: string; key: keyof CaseStudy }[] = [
    { label: '課題',     key: 'challenge'         },
    { label: '解決策',   key: 'solution'           },
    { label: '効果',     key: 'effect'             },
    { label: '定性効果', key: 'qualitativeEffect'  },
  ]

  const dataRows = rowDefs.map(({ label, key }) => [
    lbl(label),
    ...caseList.map(c => cell(String(c[key] ?? '—'))),
  ])

  sl.addTable([headerRow, ...dataRows], {
    x: MG, y: CONTENT_Y, w: CW,
    colW: [LABEL_W, ...caseList.map(() => CASE_W)],
    rowH: [HDR_H, ...rowDefs.map(() => ROW_H)],
    border: { type: 'solid', pt: 0.5, color: 'E5E7EB' },
    fontFace: FONT,
  })

  addFooter(sl, prs)
}

// ==================== エントリポイント ====================

export async function generatePptBuffer(
  answers: TmbWizardAnswers,
  plan: GeneratedPlan,
  cases: CaseStudy[],
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
  addUsageScenariosSlide(prs, plan)
  addPhaseScheduleSlide(prs, plan, answers)
  addMonthlySlide(prs, plan, answers, firstHalf,  '月次スケジュール（前半：1〜6ヶ月目）',  '月ごとのテーマとアクションで、定着の土台をつくる')
  addMonthlySlide(prs, plan, answers, secondHalf, '月次スケジュール（後半：7〜12ヶ月目＋中長期）', '活用の深化・横展開・効果測定で成果をつないでいく')
  addDeviceSlide(prs, devicePlan)
  addCaseStudiesSlide(prs, cases)

  const buffer = await prs.write({ outputType: 'nodebuffer' }) as Buffer
  return buffer
}
