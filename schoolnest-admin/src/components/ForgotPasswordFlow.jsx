// ============================================================
// [SHARED — pre-login] — Forgot / Reset Password
// Two-step flow: request a reset code by email, then submit the
// code + new password. Mirrors the same subdomain rule as login —
// leave subdomain blank only if you're a Super Admin.
// ============================================================
import React, { useState } from 'react'
import { ArrowLeft, Mail, KeyRound, CheckCircle2 } from 'lucide-react'
import { COLORS } from '../theme'
import { apiFetch } from '../api'
import { Button, ErrorBanner, Field, Input } from './ui'

export default function ForgotPasswordFlow({ baseUrl, onBack, initialSubdomain }) {
  const [step, setStep] = useState('request') // 'request' | 'reset' | 'done'
  const [subdomain, setSubdomain] = useState(initialSubdomain || '')
  const [identifier, setIdentifier] = useState('')
  const [code, setCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function requestCode(e) {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      await apiFetch(baseUrl, '/auth/forgot-password', {
        method: 'POST', body: { identifier }, subdomain: subdomain.trim().toLowerCase() || undefined,
      })
      setStep('reset')
    } catch (err) { setError(err.message) } finally { setLoading(false) }
  }

  async function submitReset(e) {
    e.preventDefault()
    if (newPassword.length < 8) { setError('New password must be at least 8 characters.'); return }
    setLoading(true); setError('')
    try {
      await apiFetch(baseUrl, '/auth/reset-password', { method: 'POST', body: { token: code, newPassword } })
      setStep('done')
    } catch (err) { setError(err.message) } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: COLORS.navyDeep }}>
      <div className="w-full max-w-sm">
        <button onClick={onBack} className="flex items-center gap-1.5 text-sm mb-4" style={{ color: COLORS.textOnNavyMuted }}>
          <ArrowLeft size={15} /> Back to sign in
        </button>

        <div className="bg-white rounded-lg p-7">
          {step === 'request' && (
            <>
              <div className="flex items-center gap-2 mb-1">
                <Mail size={17} style={{ color: COLORS.navyAccent }} />
                <h2 className="text-base font-semibold" style={{ color: COLORS.textPrimary }}>Reset your password</h2>
              </div>
              <p className="text-xs mb-5" style={{ color: COLORS.textSecondary }}>
                We'll email a 15-minute reset code if the details match an active account.
              </p>
              <ErrorBanner message={error} />
              <form onSubmit={requestCode}>
                <Field label="School subdomain (leave blank if Super Admin)">
                  <Input value={subdomain} onChange={(e) => setSubdomain(e.target.value)} placeholder="e.g. greenfield" style={{ fontFamily: "'IBM Plex Mono', monospace" }} />
                </Field>
                <Field label="Email or phone">
                  <Input value={identifier} onChange={(e) => setIdentifier(e.target.value)} required />
                </Field>
                <Button type="submit" full loading={loading}>Send reset code</Button>
              </form>
            </>
          )}

          {step === 'reset' && (
            <>
              <div className="flex items-center gap-2 mb-1">
                <KeyRound size={17} style={{ color: COLORS.navyAccent }} />
                <h2 className="text-base font-semibold" style={{ color: COLORS.textPrimary }}>Enter the code</h2>
              </div>
              <p className="text-xs mb-5" style={{ color: COLORS.textSecondary }}>
                Check your email for a reset code. It expires in 15 minutes.
              </p>
              <ErrorBanner message={error} />
              <form onSubmit={submitReset}>
                <Field label="Reset code">
                  <Input value={code} onChange={(e) => setCode(e.target.value)} required style={{ fontFamily: "'IBM Plex Mono', monospace" }} />
                </Field>
                <Field label="New password">
                  <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} minLength={8} required />
                </Field>
                <Button type="submit" full loading={loading}>Reset password</Button>
              </form>
            </>
          )}

          {step === 'done' && (
            <div className="text-center py-4">
              <CheckCircle2 size={28} style={{ color: COLORS.green }} className="mx-auto mb-3" />
              <p className="text-sm mb-5" style={{ color: COLORS.textPrimary }}>Password reset. You can now sign in with your new password.</p>
              <Button full onClick={onBack}>Back to sign in</Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}