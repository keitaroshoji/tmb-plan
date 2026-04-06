'use client'

import React from 'react'

interface ChoiceCardProps {
  label: string
  description?: string
  icon?: string
  selected: boolean
  onClick: () => void
  disabled?: boolean
  /** 'radio' = 単一選択（◯）, 'checkbox' = 複数選択（□） */
  variant?: 'radio' | 'checkbox'
}

export function ChoiceCard({
  label,
  description,
  icon,
  selected,
  onClick,
  disabled = false,
  variant = 'radio',
}: ChoiceCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`
        w-full text-left rounded-xl border-2 p-4 transition-all
        focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-1
        disabled:cursor-not-allowed disabled:opacity-50
        ${
          selected
            ? 'border-blue-500 bg-blue-50 shadow-sm'
            : 'border-gray-200 bg-white hover:border-blue-300 hover:bg-gray-50'
        }
      `}
    >
      <div className="flex items-start gap-3">
        {icon && <span className="text-xl flex-shrink-0">{icon}</span>}
        <div className="flex-1 min-w-0">
          <div className={`font-medium text-sm ${selected ? 'text-blue-700' : 'text-gray-800'}`}>
            {label}
          </div>
          {description && (
            <div className="mt-0.5 text-xs text-gray-500 leading-relaxed">{description}</div>
          )}
        </div>

        {/* ラジオ（◯）インジケーター */}
        {variant === 'radio' && (
          <div
            className={`
              mt-0.5 h-4 w-4 flex-shrink-0 rounded-full border-2 transition-colors flex items-center justify-center
              ${selected ? 'border-blue-500 bg-white' : 'border-gray-300 bg-white'}
            `}
          >
            {selected && (
              <div className="h-2 w-2 rounded-full bg-blue-500" />
            )}
          </div>
        )}

        {/* チェックボックス（□）インジケーター */}
        {variant === 'checkbox' && (
          <div
            className={`
              mt-0.5 h-4 w-4 flex-shrink-0 rounded border-2 transition-colors flex items-center justify-center
              ${selected ? 'border-blue-500 bg-blue-500' : 'border-gray-300 bg-white'}
            `}
          >
            {selected && (
              <svg className="h-3 w-3 text-white" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M2 6l3 3 5-5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </div>
        )}
      </div>
    </button>
  )
}
