import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

export const maxDuration = 60

const client = new Anthropic()

const SYSTEM_PROMPT = `あなたはTeachme BizのCS担当者向けアシスタントです。
顧客との議事録・ヒアリングメモ・会社案内・提案資料などのテキストから、
提案書作成に必要な情報をJSON形式で抽出してください。
ボトルネック（推進上の障壁）も可能な限り示唆してください。
必ずJSONのみを返し、説明文は不要です。`

const JSON_SCHEMA = `JSONのみ返してください:
{"companyName":"企業名（不明ならnull）","industry":"agriculture|fishing|mining|construction|manufacturing|utility|it|logistics|retail|finance|real_estate|professional|food_service|beauty|education|medical|other|null","companySize":"under50|under200|under500|under1000|over1000|null","challenges":["次のキーから選択: talent_development|standardization|knowledge_transfer|manual_creation|foreign_staff|cost_reduction|iso_compliance|multi_store|remote_management|security"],"primaryGoal":"reduce_training_time|standardize_quality|eliminate_dependency|reduce_cost|improve_compliance|support_foreign_staff|dx_promotion|null","currentUseCases":"現在の用途（自由記述、なければnull）","usageStatus":"none|partial|active|expanding|null","operationalBarriers":["no_time_for_creation","no_team_structure","low_it_literacy","hard_to_involve","migration_burden","no_creation_knowhow","maintenance_concern","low_adoption_concern"],"bottleneckHints":[{"area":"端末環境|体制|リテラシー|既存マニュアル|更新運用|その他","hint":"確認すべき内容","severity":"要確認|注意|参考"}],"missingFields":["不足しているフィールド名"],"rawInsights":"資料から読み取れたその他の重要な情報"}`

/** Buffer から PDF テキストを抽出 */
async function extractPdfText(buffer: Buffer): Promise<string> {
  // Dynamic import で Next.js のバンドルエラーを回避
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const pdfParse = require('pdf-parse') as (buf: Buffer) => Promise<{ text: string }>
  const data = await pdfParse(buffer)
  return data.text
}

/** Buffer から PPTX / DOCX テキストを抽出 */
async function extractOfficeText(buffer: Buffer): Promise<string> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const officeParser = require('officeparser') as {
    parseOffice: (input: Buffer, callback: (text: string, err: Error | null) => void) => void
  }
  return new Promise((resolve, reject) => {
    officeParser.parseOffice(buffer, (text, err) => {
      if (err) reject(err)
      else resolve(text ?? '')
    })
  })
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'ファイルが見つかりません' }, { status: 400 })
    }

    const filename = file.name.toLowerCase()
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // ファイルサイズ制限: 20MB
    if (buffer.byteLength > 20 * 1024 * 1024) {
      return NextResponse.json({ error: 'ファイルサイズは20MB以内にしてください' }, { status: 400 })
    }

    // テキスト抽出
    let rawText = ''
    try {
      if (filename.endsWith('.pdf')) {
        rawText = await extractPdfText(buffer)
      } else if (
        filename.endsWith('.pptx') ||
        filename.endsWith('.ppt') ||
        filename.endsWith('.docx') ||
        filename.endsWith('.doc')
      ) {
        rawText = await extractOfficeText(buffer)
      } else {
        return NextResponse.json(
          { error: 'PDF・PPT・PPTX・DOC・DOCXファイルのみ対応しています' },
          { status: 400 }
        )
      }
    } catch (extractErr) {
      console.error('Text extraction error:', extractErr)
      return NextResponse.json(
        { error: 'ファイルのテキスト抽出に失敗しました。別のファイルを試してください。' },
        { status: 422 }
      )
    }

    // テキストが空の場合
    const trimmedText = rawText.replace(/\s+/g, ' ').trim()
    if (trimmedText.length < 10) {
      return NextResponse.json(
        { error: 'ファイルからテキストを読み取れませんでした。テキストが含まれているファイルを使用してください。' },
        { status: 422 }
      )
    }

    // 長すぎる場合は先頭 5000 文字に制限（PPT は情報量が多い）
    const truncated = trimmedText.slice(0, 5000)

    // analyze-memo と同じプロンプトで解析
    const message = await client.messages.create({
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
          content: `以下の資料（${filename}）から情報を抽出してください:\n\n---\n${truncated}\n---\n\n${JSON_SCHEMA}`,
        },
      ],
    })

    const text = message.content[0].type === 'text' ? message.content[0].text : ''
    const jsonMatch = text.match(/```json\n?([\s\S]*?)\n?```/) || text.match(/(\{[\s\S]*\})/)
    const jsonStr = jsonMatch ? (jsonMatch[1] ?? jsonMatch[0]) : text

    let extracted: Record<string, unknown>
    try {
      extracted = JSON.parse(jsonStr)
    } catch {
      return NextResponse.json({ error: '資料の解析に失敗しました' }, { status: 500 })
    }

    return NextResponse.json({
      extracted,
      meta: {
        filename: file.name,
        filesize: buffer.byteLength,
        extractedChars: trimmedText.length,
        truncated: trimmedText.length > 5000,
      },
    })
  } catch (err) {
    console.error('File analysis error:', err)
    return NextResponse.json({ error: '資料の解析に失敗しました' }, { status: 500 })
  }
}
