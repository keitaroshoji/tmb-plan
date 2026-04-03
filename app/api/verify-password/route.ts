import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { password }: { password: string } = await req.json()
  const correct = process.env.APP_PASSWORD

  if (!correct) {
    return NextResponse.json({ ok: true }) // 未設定なら通す
  }

  if (password === correct) {
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ ok: false }, { status: 401 })
}
