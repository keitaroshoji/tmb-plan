'use client'

import React from 'react'
import { BottleneckHint } from '@/src/types/plan'

const SEVERITY_STYLES = {
  '要確認': { bg: 'bg-red-50', border: 'border-red-300', badge: 'bg-red-100 text-red-700', icon: '🔴' },
  '注意': { bg: 'bg-amber-50', border: 'border-amber-300', badge: 'bg-amber-100 text-amber-700', icon: '🟡' },
  '参考': { bg: 'bg-blue-50', border: 'border-blue-200', badge: 'bg-blue-100 text-blue-600', icon: '🔵' },
}

interface Props {
  hints: BottleneckHint[]
}

export function BottleneckSection({ hints }: Props) {
  if (!hints?.length) return null

  return (
    <section>
      <h2 className="text-lg font-bold text-gray-900 mb-2">⚠️ 運用ボトルネック示唆</h2>
      <p className="text-sm text-gray-500 mb-4">推進前に確認・対処しておくべき事項です</p>
      <div className="space-y-2">
        {hints.map((h, i) => {
          const style = SEVERITY_STYLES[h.severity] ?? SEVERITY_STYLES['参考']
          return (
            <div key={i} className={`rounded-lg border ${style.border} ${style.bg} px-4 py-3 flex items-start gap-3`}>
              <span className="text-base mt-0.5">{style.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-xs font-semibold text-gray-700">{h.area}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${style.badge}`}>{h.severity}</span>
                </div>
                <p className="text-sm text-gray-700">{h.hint}</p>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
