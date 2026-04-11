'use client'

import React from 'react'

// 3章構成: どのステップがどの章に属するか
const CHAPTERS: { label: string; steps: number[]; icon: string }[] = [
  { label: '企業・プラン情報', steps: [1, 2], icon: '🏢' },
  { label: '課題・目標',       steps: [3],    icon: '🎯' },
  { label: '活用詳細',         steps: [4, 5, 6], icon: '📋' },
]

function getChapterIndex(step: number): number {
  return CHAPTERS.findIndex((ch) => ch.steps.includes(step))
}

interface StepProgressProps {
  currentStep: number
}

export function StepProgress({ currentStep }: StepProgressProps) {
  const currentChapter = getChapterIndex(currentStep)
  const totalStepsInChapter = CHAPTERS[currentChapter]?.steps.length ?? 1
  const stepIndexInChapter = CHAPTERS[currentChapter]?.steps.indexOf(currentStep) ?? 0

  return (
    <div className="space-y-2">
      {/* 章ドット */}
      <div className="flex items-center gap-0">
        {CHAPTERS.map((chapter, ci) => {
          const isDone = ci < currentChapter
          const isActive = ci === currentChapter
          return (
            <React.Fragment key={ci}>
              {ci > 0 && (
                <div className={`flex-1 h-0.5 transition-colors ${isDone ? 'bg-blue-500' : 'bg-gray-200'}`} />
              )}
              <div className="flex flex-col items-center gap-0.5 shrink-0">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all
                  ${isActive
                    ? 'bg-blue-600 text-white ring-2 ring-blue-200 ring-offset-1'
                    : isDone
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-400'
                  }`}
                >
                  {isDone ? '✓' : chapter.icon}
                </div>
                <span className={`text-[10px] leading-none whitespace-nowrap font-medium ${
                  isActive ? 'text-blue-600' : isDone ? 'text-blue-400' : 'text-gray-400'
                }`}>
                  {chapter.label}
                </span>
              </div>
            </React.Fragment>
          )
        })}
      </div>

      {/* 章内ステッププログレスバー */}
      {totalStepsInChapter > 1 && (
        <div className="flex items-center gap-1 pl-1">
          {CHAPTERS[currentChapter].steps.map((_, si) => (
            <div
              key={si}
              className={`h-1 flex-1 rounded-full transition-colors ${
                si <= stepIndexInChapter ? 'bg-blue-400' : 'bg-gray-200'
              }`}
            />
          ))}
          <span className="text-[10px] text-gray-400 ml-1 shrink-0">
            {stepIndexInChapter + 1}/{totalStepsInChapter}
          </span>
        </div>
      )}
    </div>
  )
}
