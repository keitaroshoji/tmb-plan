import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic()

const SYSTEM_PROMPT = `あなたはTeachme BizのCS担当者向けアシスタントです。
企業名から、その企業のプロフィール（業種・規模・主な業務・想定課題）をJSON形式で推定してください。
必ずJSONのみを返し、説明文は不要です。`

const JSON_SCHEMA = `JSONのみ返してください:
{"companyName":"企業名","industry":"food_service|retail|manufacturing|logistics|medical|beauty|education|it|real_estate|finance|other","subIndustry":"retail選択時のみ: gms_supermarket|convenience|apparel|electronics|auto_dealer|home_center|null","companySize":"under50|under200|under500|under1000|over1000|unknown","mainBusiness":"主な業務（1〜2文）","estimatedChallenges":["想定課題1","想定課題2"],"isLargeEnterprise":false,"missingFields":["不明なフィールド名"],"confidence":"high|medium|low","notes":"補足コメント（任意）"}`

export async function POST(req: NextRequest) {
  try {
    const { companyName }: { companyName: string } = await req.json()

    if (!companyName?.trim()) {
      return NextResponse.json({ error: '企業名を入力してください' }, { status: 400 })
    }

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: [
        {
          type: 'text',
          text: SYSTEM_PROMPT,
          cache_control: { type: 'ephemeral' },
        },
      ],
      messages: [
        {
          role: 'user',
          content: `企業名: ${companyName.trim()}\n\n${JSON_SCHEMA}`,
        },
      ],
    })

    const text = message.content[0].type === 'text' ? message.content[0].text : ''
    const jsonMatch = text.match(/```json\n?([\s\S]*?)\n?```/) || text.match(/(\{[\s\S]*\})/)
    const jsonStr = jsonMatch ? (jsonMatch[1] ?? jsonMatch[0]) : text

    const profile = JSON.parse(jsonStr)
    return NextResponse.json({ profile })
  } catch (err) {
    console.error('Company analysis error:', err)
    return NextResponse.json({ error: '企業情報の解析に失敗しました' }, { status: 500 })
  }
}
