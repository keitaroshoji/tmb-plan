'use client'

import React from 'react'

// ==================== セクション見出し ====================

export function SectionHeading({ icon, title, sub }: { icon: string; title: string; sub?: string }) {
  return (
    <div className="mb-6 pb-4 border-b border-gray-200">
      <div className="flex items-center gap-3">
        <div className="w-1 h-7 rounded-full bg-blue-600 shrink-0" />
        <span className="text-xl leading-none">{icon}</span>
        <h2 className="text-lg font-bold text-gray-900">{title}</h2>
      </div>
      {sub && <p className="text-sm text-gray-400 mt-1.5 ml-[2.75rem]">{sub}</p>}
    </div>
  )
}

// ==================== セクションスケルトン ====================

export function SectionSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="rounded-xl bg-white border border-gray-200 p-8 shadow-sm animate-pulse">
      <div className="flex items-center gap-2 mb-5">
        <div className="h-3 w-3 rounded-full bg-blue-300 animate-bounce" style={{ animationDelay: '0ms' }} />
        <div className="h-3 w-3 rounded-full bg-blue-200 animate-bounce" style={{ animationDelay: '150ms' }} />
        <div className="h-3 w-3 rounded-full bg-blue-100 animate-bounce" style={{ animationDelay: '300ms' }} />
        <span className="text-xs text-gray-400 ml-1">生成中...</span>
      </div>
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="h-3 bg-gray-100 rounded" style={{ width: `${90 - i * 10}%` }} />
        ))}
      </div>
    </div>
  )
}

// ==================== セクション生成失敗 ====================

export function SectionFailed() {
  return (
    <div className="rounded-xl bg-gray-50 border border-dashed border-gray-300 px-6 py-5 text-center">
      <p className="text-sm text-gray-400">このセクションの生成に失敗しました。ヘッダーの「🔄 再生成」ボタンをお試しください。</p>
    </div>
  )
}

// ==================== GMP注記バナー ====================

export function GmpWarningBanner() {
  return (
    <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-5 py-4">
      <div className="flex items-start gap-3">
        <span className="text-lg shrink-0">⚠️</span>
        <div className="space-y-1.5">
          <p className="text-sm font-bold text-amber-800">
            GMP適用対象業務については補完的な活用を推奨
          </p>
          <p className="text-xs text-amber-700 leading-relaxed">
            医薬品・医療機器等の製造工程において法的なGMP適合（GMP省令・QMS省令）が求められる場合、Teachme Bizは教育訓練記録や手順書の整備・共有に貢献できますが、以下の要件はTeachme Bizの機能範囲外となります：電子記録・電子署名（ER/ES）規制への準拠、改ざん不能な監査証跡、認定機関による5年以上の記録保管管理、CSV（コンピュータシステムバリデーション）、逸脱・CAPA管理システム。
          </p>
          <p className="text-xs text-amber-700 leading-relaxed">
            <strong>有効な活用領域：</strong>GMP対象外の一般業務（物流・総務・間接部門等）の手順書整備、GMP対象工程の「理解促進・OJTサポート」用途、新人・外国人スタッフへの教育訓練記録補助など。提案時はGMP専用システムと併用する位置づけで提示することを推奨します。
          </p>
        </div>
      </div>
    </div>
  )
}
