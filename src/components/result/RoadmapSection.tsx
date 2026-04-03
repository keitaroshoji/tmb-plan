'use client'

import React from 'react'
import { RoadmapPhase } from '@/src/types/plan'
import { RoadmapStartPoint } from '@/src/store/wizardStore'

const START_POINT_OPTIONS: { value: RoadmapStartPoint; label: string; icon: string }[] = [
  { value: 'none', label: 'まだ使っていない（ゼロから）', icon: '🌱' },
  { value: 'partial', label: '一部部門で試用中', icon: '🔬' },
  { value: 'active', label: '特定の用途で本格稼働中', icon: '✅' },
  { value: 'expanding', label: '複数部門で展開中', icon: '🚀' },
]

const START_POINT_PHASE_OFFSET: Record<RoadmapStartPoint, number> = {
  none: 0,
  partial: 1,
  active: 2,
  expanding: 3,
}

interface Props {
  roadmap: RoadmapPhase[]
  startPoint: RoadmapStartPoint
  onStartPointChange: (point: RoadmapStartPoint) => void
}

export function RoadmapSection({ roadmap, startPoint, onStartPointChange }: Props) {
  if (!roadmap?.length) return null

  const offset = START_POINT_PHASE_OFFSET[startPoint] ?? 0
  const visiblePhases = roadmap.slice(offset)

  return (
    <section>
      <h2 className="text-lg font-bold text-gray-900 mb-2">🗺️ ロードマップ</h2>

      {/* スタート地点の確認 */}
      <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 mb-5">
        <p className="text-sm font-semibold text-blue-800 mb-3">ロードマップのスタート地点を確認します</p>
        <div className="grid grid-cols-2 gap-2">
          {START_POINT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => onStartPointChange(opt.value)}
              className={`flex items-center gap-2 rounded-lg border-2 px-3 py-2 text-left text-sm transition-all ${
                startPoint === opt.value
                  ? 'border-blue-500 bg-blue-100 font-semibold text-blue-800'
                  : 'border-blue-200 bg-white text-gray-700 hover:border-blue-300'
              }`}
            >
              <span>{opt.icon}</span>
              <span className="text-xs">{opt.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ロードマップ横スクロール */}
      <div className="overflow-x-auto pb-2">
        <div className="flex gap-3" style={{ minWidth: `${Math.max(visiblePhases.length * 220, 440)}px` }}>
          {visiblePhases.map((phase, i) => (
            <div key={i} className="flex-none w-52">
              {/* フェーズヘッダー */}
              <div className={`rounded-t-xl px-4 py-2.5 ${i === 0 ? 'bg-blue-600' : 'bg-gray-600'}`}>
                <p className="text-white font-bold text-xs">{phase.phase}</p>
                <p className={`text-xs ${i === 0 ? 'text-blue-200' : 'text-gray-300'}`}>{phase.period}</p>
              </div>
              {/* フェーズ内容 */}
              <div className="border border-t-0 border-gray-200 rounded-b-xl p-3 bg-white space-y-2.5">
                <div>
                  <p className="text-xs font-semibold text-gray-500 mb-0.5">テーマ</p>
                  <p className="text-xs text-gray-800 font-medium">{phase.theme}</p>
                </div>
                {phase.currentUsageExpansion && (
                  <div className="rounded-md bg-blue-50 px-2.5 py-2">
                    <p className="text-xs text-blue-600 font-medium mb-0.5">既存用途の深化</p>
                    <p className="text-xs text-blue-800">{phase.currentUsageExpansion}</p>
                  </div>
                )}
                {phase.newUseCase && (
                  <div className="rounded-md bg-green-50 px-2.5 py-2">
                    <p className="text-xs text-green-600 font-medium mb-0.5">新規用途の追加</p>
                    <p className="text-xs text-green-800">{phase.newUseCase}</p>
                  </div>
                )}
                <div>
                  <p className="text-xs font-semibold text-gray-500 mb-0.5">マイルストーン</p>
                  <p className="text-xs text-gray-700">{phase.milestone}</p>
                </div>
              </div>

              {/* 矢印（最後以外） */}
              {i < visiblePhases.length - 1 && (
                <div className="flex justify-end pr-1 mt-1 text-gray-400 text-base">→</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
