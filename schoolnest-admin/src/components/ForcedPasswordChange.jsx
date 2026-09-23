import React, { useState } from 'react'
import { Lock } from 'lucide-react'
import { COLORS } from '../theme'
import { apiFetch } from '../api'
import { Button, ErrorBanner } from './ui'

export default function ForcedPasswordChange({ baseUrl, token, subdomain, onDone }) {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (newPassword.length < 8) { setError('New password must be at least 8 characters.'); return }
    setLoading(true)
    try {
      await apiFetch(baseUrl, '/auth/change-password', {
        method: 'POST', token, subdomain,
        body: { currentPassword, newPassword },
      })
      onDone()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: COLORS.navyDeep }}>
      <div className="w-full max-w-sm bg-white rounded-lg p-7">
        <div className="flex items-center gap-2 mb-1">
          <Lock size={18} style={{ color: COLORS.navyAccent }} />
          <h2 className="text-base font-semibold" style={{ color: COLORS.textPrimary }}>Set a new password</h2>
        </div>
        <p className="text-sm mb-5" style={{ color: COLORS.textSecondary }}>
          This is your first sign-in — choose a permanent password to continue.
        </p>
        <ErrorBanner message={error} />
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="text-xs font-medium block mb-1.5" style={{ color: COLORS.textSecondary }}>Temporary password</label>
            <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full px-3 py-2.5 rounded text-sm" style={{ border: `1px solid ${COLORS.border}` }} />
          </div>
          <div className="mb-5">
            <label className="text-xs font-medium block mb-1.5" style={{ color: COLORS.textSecondary }}>New password</label>
            <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-3 py-2.5 rounded text-sm" style={{ border: `1px solid ${COLORS.border}` }} />
          </div>
          <Button type="submit" full loading={loading}>Set password &amp; continue</Button>
        </form>
      </div>
    </div>
  )
}