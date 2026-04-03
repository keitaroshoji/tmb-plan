'use client'

import React from 'react'

interface ChoiceCardProps {
  label: string
  description?: string
  icon?: string
  selected: boolean
  onClick: () => void
  disabled?: boolean
}

export function ChoiceCard({
  label,
  description,
  icon,
  selected,
  onClick,
  disabled = false,
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
        <div
          className={`
            mt-0.5 h-4 w-4 flex-shrink-0 rounded-full border-2 transition-colors
            ${selected ? 'border-blue-500 bg-blue-500' : 'border-gray-300'}
          `}
        >
          {selected && (
            <svg className="h-full w-full text-white" viewBox="0 0 16 16" fill="currentColor">
              <path d="M6.5 11.5L3 8l1-1 2.5 2.5 5-5 1 1z" />
            </svg>
          )}
        </div>
      </div>
    </button>
  )
}
