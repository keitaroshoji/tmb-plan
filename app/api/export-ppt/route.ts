import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { TmbWizardAnswers } from '@/src/types/answers'
import { GeneratedPlan, CaseStudy } from '@/src/types/plan'
import { DevicePlan } from '@/src/lib/device-recommender'
import { generatePptBuffer } from '@/src/lib/ppt-generator'

export const maxDuration = 90

const client = new Anthropic()

// ==================== PPT向けテキスト簡素化 ====================

/**
 * PowerPoint向けにテキストを体言止め・20〜30%短縮する
 * 対象: projectOverview / promotionPoints / schedule actions / barrierActions
 */
async function simplifyPlanForPpt(plan: GeneratedPlan): Promise<GeneratedPlan> {
  // 対象データを抽出
  const input = {
    projectOverview: plan.projectOverview ?? '',
    promotionPoints: plan.promotionPoints ?? '',
    scheduleActions: (plan.schedule ?? []).map(s => s.actions.slice(0, 2)),
    barrierCounters: (plan.barrierActions ?? []).map(b => b.counter),
    manualScenes:    (plan.manualUsagePairs ?? []).map(p => p.scene),
    manualEffects:   (plan.manualUsagePairs ?? []).map(p => p.effect),
  }

  const prompt = `以下のプレゼンテーション用テキストをPowerPoint向けに簡素化してください。

【ルール】
・語尾を体言止めにする（「〜します」→「〜」、「〜が重要です」→「〜が重要」、「〜を行う」→「〜の実施」）
・文字数を元の70〜80%程度に削減（20〜30%削減）
・内容・意味は変えない
・projectOverview / promotionPoints の \\n（改行）はそのまま維持する
・JSONのみ返す

入力:
${JSON.stringify(input, null, 2)}

出力JSON（同じキー構造で）:`

  try {
    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2048,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = message.content[0].type === 'text' ? message.content[0].text : ''
    const jsonMatch = text.match(/```json\n?([\s\S]*?)\n?```/) || text.match(/(\{[\s\S]*\})/)
    const jsonStr = jsonMatch ? (jsonMatch[1] ?? jsonMatch[0]) : text
    const simplified = JSON.parse(jsonStr) as typeof input

    // 簡素化済みデータでプランを上書き
    return {
      ...plan,
      projectOverview: simplified.projectOverview || plan.projectOverview,
      promotionPoints: simplified.promotionPoints || plan.promotionPoints,
      schedule: (plan.schedule ?? []).map((s, i) => ({
        ...s,
        actions: simplified.scheduleActions[i] ?? s.actions,
      })),
      barrierActions: (plan.barrierActions ?? []).map((b, i) => ({
        ...b,
        counter: simplified.barrierCounters[i] ?? b.counter,
      })),
      manualUsagePairs: (plan.manualUsagePairs ?? []).map((p, i) => ({
        ...p,
        scene:  simplified.manualScenes[i]  ?? p.scene,
        effect: simplified.manualEffects[i] ?? p.effect,
      })),
    }
  } catch (e) {
    // 簡素化に失敗してもオリジナルで続行
    console.warn('PPT simplification failed, using original:', e)
    return plan
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
