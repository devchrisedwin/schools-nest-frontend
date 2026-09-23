// ============================================================
// [SHARED — pre-login] — Register a New School (UPDATED)
// Adds an optional referral code field.
// ============================================================
import React, { useState, useEffect, useRef } from 'react'
import { ArrowLeft, Check, X as XIcon, Gift } from 'lucide-react'
import { COLORS } from '../theme'
import { apiFetch } from '../api'
import { Button, ErrorBanner, Field, Input } from './ui'

export default function RegisterSchoolScreen({ baseUrl, onBack, onRegistered }) {
  const [form, setForm] = useState({
    name: '', email: '', phone: '', address: '', subdomain: '', adminFullName: '', adminPassword: '', referralCode: '',
  })
  const [availability, setAvailability] = useState(null)
  const [suggestions, setSuggestions] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const debounceRef = useRef(null)

  function set(key, value) { setForm({ ...form, [key]: value }) }

  useEffect(() => {
    const clean = form.subdomain.trim().toLowerCase()
    if (clean.length < 3) { setAvailability(null); setSuggestions([]); return }
    setAvailability('checking')
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await apiFetch(baseUrl, `/schools/check-subdomain?name=${encodeURIComponent(clean)}`)
        if (res.available) { setAvailability('available'); setSuggestions([]) }
        else {
          setAvailability('taken')
          const sug = await apiFetch(baseUrl, `/schools/suggest-subdomains?name=${encodeURIComponent(clean)}`)
          setSuggestions(sug.suggestions || [])
        }
      } catch { setAvailability(null) }
    }, 400)
  }, [form.subdomain])

  async function submit(e) {
    e.preventDefault()
    if (availability === 'taken') { setError('Choose an available subdomain before continuing.'); return }
    setLoading(true); setError('')
    try {
      const body = { ...form, subdomain: form.subdomain.trim().toLowerCase() }
      if (!body.referralCode.trim()) delete body.referralCode
      await apiFetch(baseUrl, '/schools/register', { method: 'POST', body })
      onRegistered({ subdomain: form.subdomain.trim().toLowerCase(), identifier: form.email })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-10" style={{ backgroundColor: COLORS.navyDeep }}>
      <div className="w-full max-w-md">
        <button onClick={onBack} className="flex items-center gap-1.5 text-sm mb-4" style={{ color: COLORS.textOnNavyMuted }}>
          <ArrowLeft size={15} /> Back to sign in
        </button>

        <div className="bg-white rounded-lg p-7">
          <h2 className="text-base font-semibold mb-1" style={{ color: COLORS.textPrimary }}>Register your school</h2>
          <p className="text-xs mb-5" style={{ color: COLORS.textSecondary }}>
            Creates your school and your own School Admin account, with a 30-day free trial — no card required.
          </p>

          <ErrorBanner message={error} />

          <form onSubmit={submit}>
            <Field label="School name"><Input value={form.name} onChange={(e) => set('name', e.target.value)} required /></Field>

            <Field label="School subdomain">
              <div className="relative">
                <Input
                  value={form.subdomain}
                  onChange={(e) => set('subdomain', e.target.value.replace(/[^a-z0-9-]/gi, '').toLowerCase())}
                  placeholder="e.g. greenfield"
                  style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                  required
                />
                {availability === 'checking' && <span className="text-xs absolute right-3 top-1/2 -translate-y-1/2" style={{ color: COLORS.textSecondary }}>checking…</span>}
                {availability === 'available' && <Check size={16} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: COLORS.green }} />}
                {availability === 'taken' && <XIcon size={16} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: COLORS.red }} />}
              </div>
              {availability === 'taken' && suggestions.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {suggestions.map((s) => (
                    <button key={s} type="button" onClick={() => set('subdomain', s)}
                      className="text-xs px-2 py-1 rounded" style={{ backgroundColor: COLORS.surface, color: COLORS.navyAccent, fontFamily: "'IBM Plex Mono', monospace" }}>
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </Field>

            <Field label="School email"><Input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} required /></Field>
            <Field label="School phone"><Input value={form.phone} onChange={(e) => set('phone', e.target.value)} required /></Field>
            <Field label="Address"><Input value={form.address} onChange={(e) => set('address', e.target.value)} required /></Field>

            <div className="pt-3 mt-1" style={{ borderTop: `1px solid ${COLORS.border}` }}>
              <p className="text-xs font-medium mb-3" style={{ color: COLORS.textSecondary }}>Your admin account</p>
              <Field label="Your full name"><Input value={form.adminFullName} onChange={(e) => set('adminFullName', e.target.value)} required /></Field>
              <Field label="Choose a password"><Input type="password" value={form.adminPassword} onChange={(e) => set('adminPassword', e.target.value)} minLength={8} required /></Field>
            </div>

            <div className="pt-3 mt-1" style={{ borderTop: `1px solid ${COLORS.border}` }}>
              <Field label={
                <span className="flex items-center gap-1.5"><Gift size={13} /> Referral code (optional)</span>
              }>
                <Input
                  value={form.referralCode}
                  onChange={(e) => set('referralCode', e.target.value)}
                  placeholder="Have a code from another school?"
                  style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                />
              </Field>
            </div>

            <Button type="submit" full loading={loading}>Create my school</Button>
          </form>
        </div>
      </div>
    </div>
  )
}