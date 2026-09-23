// ============================================================
// [SUPER ADMIN PORTAL] — Announcements
// Emails every school admin, or admins at selected schools.
// No "sent history" endpoint exists on the backend for this yet —
// this screen is a compose-and-send form only, by design.
// ============================================================
import React, { useState, useEffect } from 'react'
import { Send, CheckCircle2 } from 'lucide-react'
import { COLORS } from '../../theme'
import { apiFetch } from '../../api'
import { Button, ErrorBanner, Field, Input } from '../../components/ui'

export default function AnnouncementsView({ baseUrl, token }) {
  const opts = { token }
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [scope, setScope] = useState('all') // 'all' | 'selected'
  const [schools, setSchools] = useState([])
  const [selectedIds, setSelectedIds] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)

  useEffect(() => {
    if (scope === 'selected' && schools.length === 0) {
      apiFetch(baseUrl, '/super-admin/schools?limit=100', opts).then((d) => setSchools(d.schools)).catch((e) => setError(e.message))
    }
  }, [scope])

  function toggleSchool(id) {
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])
  }

  async function submit(e) {
    e.preventDefault()
    setLoading(true); setError(''); setResult(null)
    try {
      const res = await apiFetch(baseUrl, '/super-admin/announcements', {
        ...opts, method: 'POST',
        body: { title, body, ...(scope === 'selected' ? { targetSchoolIds: selectedIds } : {}) },
      })
      setResult(res)
      setTitle(''); setBody(''); setSelectedIds([])
    } catch (err) { setError(err.message) } finally { setLoading(false) }
  }

  return (
    <div className="max-w-xl">
      <ErrorBanner message={error} />
      {result && (
        <div className="rounded px-4 py-3 mb-4 flex items-center gap-2 text-sm" style={{ backgroundColor: '#E8F5EE', color: COLORS.green }}>
          <CheckCircle2 size={15} /> Queued to {result.notificationsQueued} admin(s) across {result.schoolsTargeted} school(s).
        </div>
      )}
      <p className="text-xs mb-4" style={{ color: COLORS.textSecondary }}>
        Delivered as an in-app notification to every targeted school's admin(s) — no email is sent for announcements.
      </p>
      <div className="bg-white rounded p-5" style={{ border: `1px solid ${COLORS.border}` }}>
        <form onSubmit={submit}>
          <Field label="Title"><Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Scheduled Maintenance" required /></Field>
          <Field label="Message">
            <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={5} required
              className="w-full px-3 py-2.5 rounded text-sm" style={{ border: `1px solid ${COLORS.border}` }} />
          </Field>
          <Field label="Send to">
            <div className="flex rounded p-1" style={{ backgroundColor: COLORS.surface }}>
              {[{ key: 'all', label: 'Every school' }, { key: 'selected', label: 'Selected schools' }].map((o) => (
                <button key={o.key} type="button" onClick={() => setScope(o.key)}
                  className="flex-1 py-2 rounded text-sm font-medium"
                  style={{ backgroundColor: scope === o.key ? '#fff' : 'transparent', color: scope === o.key ? COLORS.navyAccent : COLORS.textSecondary }}>
                  {o.label}
                </button>
              ))}
            </div>
          </Field>

          {scope === 'selected' && (
            <div className="mb-4 max-h-48 overflow-y-auto rounded" style={{ border: `1px solid ${COLORS.border}` }}>
              {schools.map((s) => (
                <label key={s.id} className="flex items-center gap-2.5 px-3 py-2.5 text-sm cursor-pointer hover:bg-gray-50" style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                  <input type="checkbox" checked={selectedIds.includes(s.id)} onChange={() => toggleSchool(s.id)} />
                  <span style={{ color: COLORS.textPrimary }}>{s.name}</span>
                </label>
              ))}
            </div>
          )}

          <Button type="submit" full loading={loading} disabled={scope === 'selected' && selectedIds.length === 0}>
            <Send size={14} /> Send announcement
          </Button>
        </form>
      </div>
    </div>
  )
}