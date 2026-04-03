import { NextRequest, NextResponse } from 'next/server'
import { TmbWizardAnswers } from '@/src/types/answers'
import { GeneratedPlan, CaseStudy } from '@/src/types/plan'
import { DevicePlan } from '@/src/lib/device-recommender'
import { generatePptBuffer } from '@/src/lib/ppt-generator'

export async function POST(req: NextRequest) {
  try {
    const { answers, plan, cases, devicePlan }: {
      answers: TmbWizardAnswers
      plan: GeneratedPlan
      cases: CaseStudy[]
      devicePlan: DevicePlan
    } = await req.json()

    const buffer = await generatePptBuffer(answers, plan, cases, devicePlan)

    const filename = `TeachmeBiz_運用プラン_${answers.companyName}_${new Date().toISOString().slice(0, 10)}.pptx`

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
