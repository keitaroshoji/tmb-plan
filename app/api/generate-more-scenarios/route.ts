import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { TmbWizardAnswers } from '@/src/types/answers'
import { INDUSTRY_LABELS, CHALLENGE_LABELS } from '@/src/data/labels'

export const maxDuration = 30

const client = new Anthropic()

export async function POST(req: NextRequest) {
  try {
    const { answers, existingTitles, existingFeatures }: {
      answers: TmbWizardAnswers
      existingTitles: string[]
      existingFeatures: string[]
    } = await req.json()

    const industryLabel = INDUSTRY_LABELS[answers.industry ?? ''] ?? answers.industry
    const challenges = answers.challenges.map((c) => CHALLENGE_LABELS[c] ?? c).join('、')

    const avoidStr = [
      existingTitles.length > 0 ? `以下のマニュアルタイトルはすでに出ているので使わないこと：${existingTitles.join('、')}` : '',
      existingFeatures.length > 0 ? `以下の機能はすでに使ったので別の機能を優先すること：${existingFeatures.join('、')}` : '',
    ].filter(Boolean).join('\n')

    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1200,
      messages: [{
        role: 'user',
        content: `企業:${answers.companyName} 業種:${industryLabel} 規模:${answers.companySize} 課題:${challenges}\n\n${avoidStr}\n\n上記とは異なる切り口で「マニュアル活用シナリオ」を3件生成。targetUserは業種固有の具体的な立場で。JSONのみ（3件）:\n{"manualUsagePairs":[{"targetUser":"誰のために","manualTitle":"マニュアルタイトル","content":"内容概要（1〜2文）","feature":"Teachme Biz機能名","scene":"活用シーン（1〜2文）","effect":"効果（1〜2文）"}]}`,
      }],
    })

    const text = message.content[0].type === 'text' ? message.content[0].text : ''
    const jsonMatch = text.match(/```(?:json)?\n?([\s\S]*?)\n?```/) || text.match(/(\{[\s\S]*\})/)
    const jsonStr = (jsonMatch?.[1] ?? jsonMatch?.[0] ?? text).trim()
    const parsed = JSON.parse(jsonStr)

    return NextResponse.json({ manualUsagePairs: parsed.manualUsagePairs ?? [] })
  } catch (err) {
    console.error('Generate more scenarios error:', err)
    return NextResponse.json({ error: '追加シナリオの生成に失敗しました' }, { status: 500 })
  }
}
