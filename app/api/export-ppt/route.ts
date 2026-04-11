import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { TmbWizardAnswers } from '@/src/types/answers'
import { GeneratedPlan, CaseStudy } from '@/src/types/plan'
import { DevicePlan } from '@/src/lib/device-recommender'
import { generatePptBuffer } from '@/src/lib/ppt-generator'

export const maxDuration = 90

const client = new Anthropic()

// ==================== PPT向けテキスト簡素化ヘルパー ====================

/** Claude に JSON を投げて簡素化済み JSON を返す（失敗時は null） */
async function callSimplify<T>(inputObj: T, rules: string, maxTokens = 1024): Promise<T | null> {
  const prompt = `以下のJSONのテキスト値をPowerPoint向けに簡素化してください。

【ルール】
${rules}

入力JSON:
${JSON.stringify(inputObj, null, 2)}

出力: 同じキー構造のJSONのみ返してください。説明文は不要です。`

  try {
    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: maxTokens,
      system: 'あなたはJSON変換の専門家です。入力JSONと同じキー構造のJSONのみ返してください。',
      messages: [{ role: 'user', content: prompt }],
    })
    const raw = message.content[0].type === 'text' ? message.content[0].text : ''
    const m = raw.match(/```json\n?([\s\S]*?)\n?```/) || raw.match(/(\{[\s\S]*\})/)
    const jsonStr = m ? (m[1] ?? m[0]) : raw.trim()
    return JSON.parse(jsonStr) as T
  } catch (e) {
    console.warn('[simplify] parse/API error:', e)
    return null
  }
}

// ==================== PPT向けテキスト簡素化（2分割呼び出し） ====================

async function simplifyPlanForPpt(plan: GeneratedPlan): Promise<GeneratedPlan> {
  const RULES_OVERVIEW = `・語尾を体言止めにする（「〜します」→省略、「〜が重要です」→「〜が重要」）
・文字数を元の70〜80%程度に削減（20〜30%削減）
・内容・意味は変えない
・\\n（改行）はそのまま維持する`

  const RULES_ACTIONS = `・語尾を体言止めにする（「〜します」→「〜の実施」、「〜を行います」→「〜を実施」）
・各アクション文字数を元の60〜75%程度に削減
・箇条書きの意味・内容は変えない`

  // ── Call 1: 概要テキスト（projectOverview / promotionPoints / barrierCounters / manualScenes/Effects） ──
  const overviewInput = {
    projectOverview: plan.projectOverview ?? '',
    promotionPoints: plan.promotionPoints ?? '',
    barrierCounters: (plan.barrierActions ?? []).map(b => b.counter),
    manualScenes:    (plan.manualUsagePairs ?? []).map(p => p.scene),
    manualEffects:   (plan.manualUsagePairs ?? []).map(p => p.effect),
  }
  const simplifiedOverview = await callSimplify(overviewInput, RULES_OVERVIEW, 1500)

  // ── Call 2: スケジュールアクション（13ヶ月分 × 2件） ──
  const scheduleInput = {
    actions: (plan.schedule ?? []).map(s => s.actions.slice(0, 2)),
  }
  const simplifiedSchedule = await callSimplify(scheduleInput, RULES_ACTIONS, 2000)

  // ── マージ ──
  return {
    ...plan,
    projectOverview: simplifiedOverview?.projectOverview || plan.projectOverview,
    promotionPoints: simplifiedOverview?.promotionPoints || plan.promotionPoints,
    schedule: (plan.schedule ?? []).map((s, i) => ({
      ...s,
      actions: simplifiedSchedule?.actions[i] ?? s.actions,
    })),
    barrierActions: (plan.barrierActions ?? []).map((b, i) => ({
      ...b,
      counter: simplifiedOverview?.barrierCounters[i] ?? b.counter,
    })),
    manualUsagePairs: (plan.manualUsagePairs ?? []).map((p, i) => ({
      ...p,
      scene:  simplifiedOverview?.manualScenes[i]  ?? p.scene,
      effect: simplifiedOverview?.manualEffects[i] ?? p.effect,
    })),
  }
}

// ==================== エンドポイント ====================

export async function POST(req: NextRequest) {
  try {
    const { answers, plan, cases, devicePlan }: {
      answers: TmbWizardAnswers
      plan: GeneratedPlan
      cases: CaseStudy[]
      devicePlan: DevicePlan
    } = await req.json()

    if (!answers || !plan) {
      return NextResponse.json({ error: '必要なデータが不足しています' }, { status: 400 })
    }

    // PPT向けに文章を簡素化してからバッファ生成
    const simplifiedPlan = await simplifyPlanForPpt(plan)
    const buffer = await generatePptBuffer(answers, simplifiedPlan, cases ?? [], devicePlan)

    const safeName = (answers.companyName || '顧客').replace(/[/\\?%*:|"<>]/g, '_').slice(0, 50)
    const filename = `TeachmeBiz_運用プラン_${safeName}_${new Date().toISOString().slice(0, 10)}.pptx`

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
      },
    })
  } catch (err) {
    console.error('PPT generation error:', err)
    return NextResponse.json({ error: 'PPTの生成に失敗しました' }, { status: 500 })
  }
}
