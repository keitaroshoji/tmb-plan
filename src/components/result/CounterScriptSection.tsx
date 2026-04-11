'use client'

import React, { useState } from 'react'
import { CounterScript } from '@/src/types/plan'

interface Props {
  scripts: CounterScript[]
}

export function CounterScriptSection({ scripts }: Props) {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  if (!scripts?.length) return null

  return (
    <section>
      <h2 className="text-lg font-bold text-gray-900 mb-2">🛡️ 費用対効果カウンタースクリプト</h2>
      <p className="text-sm text-gray-500 mb-4">顧客の懸念・解約理由への対処トークです。クリックで展開します。</p>
      <div className="space-y-2">
        {scripts.map((s, i) => (
          <div key={i} className="rounded-xl border border-gray-200 overflow-hidden">
            <button
              onClick={() => setOpenIndex(openIndex === i ? null : i)}
              className="w-full flex items-center justify-between px-4 py-3 bg-white hover:bg-gray-50 text-left transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-lg">💬</span>
                <p className="text-sm font-semibold text-gray-800">{s.objection}</p>
              </div>
              <span className="text-gray-400 text-sm">{openIndex === i ? '▲' : '▼'}</span>
            </button>
            {openIndex === i && (
              <div className="px-4 pb-4 space-y-3 border-t border-gray-100 pt-3">
                <div className="rounded-lg bg-blue-50 border border-blue-200 p-3">
                  <p className="text-xs font-semibold text-blue-700 mb-1">カウンタートーク</p>
                  <p className="text-sm text-blue-900 leading-relaxed">{s.counter}</p>
                </div>
                {s.supportingData && (
                  <div className="rounded-lg bg-blue-50 border border-blue-200 p-3">
                    <p className="text-xs font-semibold text-blue-700 mb-1">裏付けデータ・事例</p>
                    <p className="text-sm text-blue-800">{s.supportingData}</p>
                  </div>
                )}
                <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
                  <p className="text-xs font-semibold text-amber-700 mb-1">提案アクション</p>
                  <p className="text-sm text-amber-900">{s.proposalAction}</p>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}
