'use client'

import React, { useEffect, useState } from 'react'

const SESSION_KEY = 'tmb_auth'

export function PasswordGate({ children }: { children: React.ReactNode }) {
  const [authed, setAuthed] = useState<boolean | null>(null)
  const [password, setPassword] = useState('')
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const stored = sessionStorage.getItem(SESSION_KEY)
    setAuthed(stored === '1')
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!password.trim()) return
    setLoading(true)
    setError(false)
    try {
      const res = await fetch('/api/verify-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      if (res.ok) {
        sessionStorage.setItem(SESSION_KEY, '1')
        setAuthed(true)
      } else {
        setError(true)
      }
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  // 初期化中
  if (authed === null) return null

  // 認証済み
  if (authed) return <>{children}</>

  // パスワード入力画面
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
      <div className="max-w-sm w-full">
        <div className="text-center mb-8">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 mb-4 shadow-lg">
            <span className="text-white text-3xl font-bold">T</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Teachme Biz</h1>
          <p className="text-sm text-gray-500 mt-1">運用プランニング支援ツール</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-base font-semibold text-gray-800 mb-1">アクセスコードを入力</h2>
          <p className="text-sm text-gray-500 mb-5">このツールはCS担当者専用です</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(false) }}
              placeholder="アクセスコード"
              className={`w-full rounded-lg border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                error ? 'border-red-400 bg-red-50' : 'border-gray-300'
              }`}
              autoFocus
            />
            {error && (
              <p className="text-sm text-red-500">アクセスコードが正しくありません</p>
            )}
            <button
              type="submit"
              disabled={!password.trim() || loading}
              className="w-full rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-3 text-sm transition-colors"
            >
              {loading ? '確認中...' : 'ツールを開く'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
