// ============================================================
// [SHARED] — Login (REWRITTEN)
// One login form for everyone. A single "School subdomain" text
// field determines the X-Tenant-Subdomain header — leave it blank
// to sign in as Platform Super Admin. No school search/select step
// anymore; the admin/teacher/parent/student just knows their
// school's subdomain (shown to them at registration, or given by
// their school).
// ============================================================
import React, { useState } from 'react'
import { Settings, ArrowRight } from 'lucide-react'
import { COLORS } from '../theme'
import { apiFetch } from '../api'
import { Button, ErrorBanner, Field, Input } from './ui'

export default function LoginScreen({ baseUrl, onLoggedIn, onOpenSettings, onGoToRegister, onGoToForgotPassword, initialSubdomain, initialIdentifier }) {
  const [subdomain, setSubdomain] = useState(initialSubdomain || '')
  const [identifier, setIdentifier] = useState(initialIdentifier || '')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const cleanSubdomain = subdomain.trim().toLowerCase() || undefined
      const data = await apiFetch(baseUrl, '/auth/login', {
        method: 'POST',
        body: { identifier, password },
        subdomain: cleanSubdomain,
      })
      onLoggedIn(data, cleanSubdomain ?? null)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: COLORS.navyDeep }}>
      <button onClick={onOpenSettings} className="fixed top-5 right-5 p-2 rounded" style={{ color: COLORS.textOnNavyMuted }}>
        <Settings size={18} />
      </button>

      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2.5 justify-center mb-8">
          <div className="w-9 h-9 rounded flex items-center justify-center font-semibold"
            style={{ backgroundColor: COLORS.navyAccent, color: '#fff', fontFamily: "'IBM Plex Mono', monospace" }}>SN</div>
          <span className="text-white font-semibold text-lg">Schoolnest</span>
        </div>

        <div className="bg-white rounded-lg p-7">
          <h2 className="text-base font-semibold mb-1" style={{ color: COLORS.textPrimary }}>Sign in</h2>
          <p className="text-xs mb-5" style={{ color: COLORS.textSecondary }}>
            Enter your school's subdomain below, or leave it blank if you're signing in as a Platform Super Admin.
          </p>

          <ErrorBanner message={error} />

          <form onSubmit={handleSubmit}>
            <Field label="School subdomain (optional for Super Admin)">
              <Input
                value={subdomain}
                onChange={(e) => setSubdomain(e.target.value)}
                placeholder="e.g. greenfield"
                style={{ fontFamily: "'IBM Plex Mono', monospace" }}
              />
            </Field>
            <Field label="Email, phone, or Student ID">
              <Input value={identifier} onChange={(e) => setIdentifier(e.target.value)} required />
            </Field>
            <Field label="Password">
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </Field>
            <div className="text-right mb-4 -mt-2">
              <button type="button" onClick={() => onGoToForgotPassword(subdomain)} className="text-xs font-medium" style={{ color: COLORS.navyAccent }}>
                Forgot password?
              </button>
            </div>
            <Button type="submit" full loading={loading}>Sign in</Button>
          </form>

          <div className="text-center mt-5 pt-5" style={{ borderTop: `1px solid ${COLORS.border}` }}>
            <button onClick={onGoToRegister} className="text-sm font-medium inline-flex items-center gap-1" style={{ color: COLORS.navyAccent }}>
              Register a new school <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}