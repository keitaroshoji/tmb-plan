import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic()

const SYSTEM_PROMPT = `あなたはTeachme BizのCS担当者向けアシスタントです。
顧客との議事録・ヒアリングメモ・メールなどのテキストから、
提案書作成に必要な情報をJSON形式で抽出してください。
ボトルネック（推進上の障壁）も可能な限り示唆してください。
必ずJSONのみを返し、説明文は不要です。`

const JSON_SCHEMA = `JSONのみ返してください:
{"companyName":"企業名（不明ならnull）","industry":"agriculture|fishing|mining|construction|manufacturing|utility|it|logistics|retail|finance|real_estate|professional|food_service|beauty|education|medical|other|null","companySize":"under50|under200|under500|under1000|over1000|null","challenges":["次のキーから選択: talent_development|standardization|knowledge_transfer|manual_creation|foreign_staff|cost_reduction|iso_compliance|multi_store|remote_management|security|env_not_ready"],"primaryGoal":"reduce_training_time|standardize_quality|eliminate_dependency|reduce_cost|improve_compliance|support_foreign_staff|dx_promotion|null","currentUseCases":"現在の用途（自由記述、なければnull）","usageStatus":"none|partial|active|expanding|null","operationalBarriers":["no_time_for_creation","no_team_structure","low_it_literacy","hard_to_involve","migration_burden","no_creation_knowhow","maintenance_concern","low_adoption_concern"],"bottleneckHints":[{"area":"端末環境|体制|リテラシー|既存マニュアル|更新運用|その他","hint":"確認すべき内容","severity":"要確認|注意|参考"}],"missingFields":["不足しているフィールド名"],"rawInsights":"メモから読み取れたその他の重要な情報"}`

export async function POST(req: NextRequest) {
  try {
    const { memoText }: { memoText: string } = await req.json()

    if (!memoText?.trim()) {
      return NextResponse.json({ error: 'メモを入力してください' }, { status: 400 })
    }

    // メモが長すぎる場合は最初の3000文字に制限
    const truncatedMemo = memoText.slice(0, 3000)

    const message = await client.messages.create(
      {
        model: 'claude-haiku-4-5-20251001',
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
            content: `以下のメモから情報を抽出してください:\n\n---\n${truncatedMemo}\n---\n\n${JSON_SCHEMA}`,
          },
        ],
      },
      { timeout: 8000 }
    )

    const text = message.content[0].type === 'text' ? message.content[0].text : ''
    const jsonMatch = text.match(/```json\n?([\s\S]*?)\n?```/) || text.match(/(\{[\s\S]*\})/)
    const jsonStr = jsonMatch ? (jsonMatch[1] ?? jsonMatch[0]) : text

    let extracted: Record<string, unknown>
    try {
      extracted = JSON.parse(jsonStr)
    } catch {
      return NextResponse.json({ error: 'メモの解析に失敗しました' }, { status: 500 })
    }
    return NextResponse.json({ extracted })
  } catch (err) {
    console.error('Memo analysis error:', err)
    return NextResponse.json({ error: 'メモの解析に失敗しました' }, { status: 500 })
  }
}
