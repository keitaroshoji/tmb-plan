'use client'

import React from 'react'
import { UseCaseProposal } from '@/src/types/plan'

const PRIORITY_STYLES = {
  high: { label: '優先度: 高', bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', badge: 'bg-red-100 text-red-700' },
  medium: { label: '優先度: 中', bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-700', badge: 'bg-yellow-100 text-yellow-700' },
  low: { label: '優先度: 低', bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-700', badge: 'bg-gray-100 text-gray-600' },
}

const EFFORT_STYLES = {
  easy: { label: '導入: 簡単', badge: 'bg-green-100 text-green-700' },
  medium: { label: '導入: 中程度', badge: 'bg-blue-100 text-blue-700' },
  hard: { label: '導入: 難しい', badge: 'bg-purple-100 text-purple-700' },
}

interface Props {
  proposals: UseCaseProposal[]
}

export function UseCaseSection({ proposals }: Props) {
  if (!proposals?.length) return null

  return (
    <section>
      <h2 className="text-lg font-bold text-gray-900 mb-4">🗺️ 用途提案</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {proposals.map((p, i) => {
          const priorityStyle = PRIORITY_STYLES[p.priority] ?? PRIORITY_STYLES.medium
          const effortStyle = EFFORT_STYLES[p.effort] ?? EFFORT_STYLES.medium
          return (
            <div key={i} className={`rounded-xl border ${priorityStyle.border} ${priorityStyle.bg} p-4`}>
              <div className="flex items-start justify-between gap-2 mb-2">
                <p className="text-sm font-semibold text-gray-800">{p.title}</p>
                <div className="flex gap-1.5 flex-shrink-0">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${priorityStyle.badge}`}>
                    {priorityStyle.label}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${effortStyle.badge}`}>
                    {effortStyle.label}
                  </span>
                </div>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed">{p.description}</p>
            </div>
          )
        })}
      </div>
    </section>
  )
}
