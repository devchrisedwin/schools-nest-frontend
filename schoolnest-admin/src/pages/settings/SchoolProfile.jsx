// ============================================================
// [SCHOOL ADMIN PORTAL] — School Profile
// The "real" Settings: name, motto, address, phone, logo upload.
// Separate from the small API-connection config (plug icon, topbar).
// ============================================================
import React, { useState, useEffect, useRef } from 'react'
import { Upload, Save, School } from 'lucide-react'
import { COLORS } from '../../theme'
import { apiFetch } from '../../api'
import { Button, Spinner, ErrorBanner, Field, Input } from '../../components/ui'
import { UserCircle2 } from 'lucide-react'

export default function SchoolProfile({ baseUrl, token, subdomain, schoolId, avatarUrl, onAvatarUpdated }) {
  const opts = { token, subdomain }
  const [school, setSchool] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)
  const fileInputRef = useRef(null)
  const [form, setForm] = useState({ name: '', motto: '', address: '', phone: '', logoUrl: '' })
  const avatarInputRef = useRef(null)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)

  async function load() {
    setLoading(true); setError('')
    try {
      const data = await apiFetch(baseUrl, `/schools/${schoolId}`, opts)
      setSchool(data)
      setForm({ name: data.name || '', motto: data.motto || '', address: data.address || '', phone: data.phone || '', logoUrl: data.logoUrl || '' })
    } catch (err) { setError(err.message) } finally { setLoading(false) }
  }
 useEffect(() => {
  if (!schoolId) return // don't fire /schools/undefined — wait for a real id
  load()
}, [schoolId])

  function set(key, value) { setForm({ ...form, [key]: value }); setSaved(false) }

  async function handleLogoSelect(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true); setError('')
    try {
      const body = new FormData()
      body.append('file', file)
      const data = await apiFetch(baseUrl, '/uploads/image', { ...opts, method: 'POST', body, isFormData: true })
      set('logoUrl', data.url)
    } catch (err) { setError(err.message) } finally { setUploading(false) }
  }

  async function handleAvatarSelect(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingAvatar(true); setError('')
    try {
      const body = new FormData()
      body.append('file', file)
      const uploadRes = await apiFetch(baseUrl, '/uploads/image', { token, subdomain, method: 'POST', body, isFormData: true })
      await apiFetch(baseUrl, '/users/me/avatar', { token, subdomain, method: 'PATCH', body: { avatarUrl: uploadRes.url } })
      onAvatarUpdated(uploadRes.url)
    } catch (err) { setError(err.message) } finally { setUploadingAvatar(false) }
  }

  async function save(e) {
    e.preventDefault()
    setSaving(true); setError(''); setSaved(false)
    try { await apiFetch(baseUrl, `/schools/${schoolId}`, { ...opts, method: 'PATCH', body: form }); setSaved(true) }
    catch (err) { setError(err.message) } finally { setSaving(false) }
  }

  if (loading) return <Spinner label="Loading school profile…" />
  if (!schoolId) {
  return (
    <div className="text-sm" style={{ color: COLORS.textSecondary }}>
      Loading your school information…
    </div>
  )
}

  return (
    <div className="max-w-xl">
      <ErrorBanner message={error} />
      <div className="bg-white rounded p-6" style={{ border: `1px solid ${COLORS.border}` }}>
        <h3 className="text-sm font-semibold mb-4" style={{ color: COLORS.textPrimary }}>My Profile</h3>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0" style={{ backgroundColor: COLORS.surface, border: `1px solid ${COLORS.border}` }}>
            {avatarUrl ? <img src={avatarUrl} alt="Your profile" className="w-full h-full object-cover" /> : <UserCircle2 size={26} style={{ color: COLORS.textSecondary }} />}
          </div>
          <div>
            <input ref={avatarInputRef} type="file" accept="image/*" onChange={handleAvatarSelect} className="hidden" />
            <Button size="sm" variant="ghost" onClick={() => avatarInputRef.current?.click()} loading={uploadingAvatar}>
              <Upload size={13} /> {avatarUrl ? 'Change photo' : 'Upload photo'}
            </Button>
            <p className="text-xs mt-1.5" style={{ color: COLORS.textSecondary }}>Appears next to your name in the top bar.</p>
          </div>
        </div>
      </div>
      <div className="bg-white rounded p-6" style={{ border: `1px solid ${COLORS.border}` }}>
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded flex items-center justify-center overflow-hidden flex-shrink-0" style={{ backgroundColor: COLORS.surface, border: `1px solid ${COLORS.border}` }}>
            {form.logoUrl ? <img src={form.logoUrl} alt="School logo" className="w-full h-full object-cover" /> : <School size={22} style={{ color: COLORS.textSecondary }} />}
          </div>
          <div>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleLogoSelect} className="hidden" />
            <Button size="sm" variant="ghost" onClick={() => fileInputRef.current?.click()} loading={uploading}><Upload size={13} /> {form.logoUrl ? 'Change logo' : 'Upload logo'}</Button>
            <p className="text-xs mt-1.5" style={{ color: COLORS.textSecondary }}>PNG or JPG, up to 5MB. Appears on report cards and the login screen.</p>
          </div>
        </div>
        <form onSubmit={save}>
          <Field label="School name"><Input value={form.name} onChange={(e) => set('name', e.target.value)} required /></Field>
          <Field label="Motto"><Input value={form.motto} onChange={(e) => set('motto', e.target.value)} placeholder="e.g. Excellence Through Discipline" /></Field>
          <Field label="Address"><Input value={form.address} onChange={(e) => set('address', e.target.value)} /></Field>
          <Field label="Phone"><Input value={form.phone} onChange={(e) => set('phone', e.target.value)} /></Field>
          <div className="rounded px-3 py-2.5 mb-4 text-xs" style={{ backgroundColor: COLORS.surface, color: COLORS.textSecondary, fontFamily: "'IBM Plex Mono', monospace" }}>
            Subdomain: {school?.subdomain} — contact support to change this.
          </div>
          <div className="flex items-center gap-3">
            <Button type="submit" loading={saving}><Save size={14} /> Save changes</Button>
            {saved && <span className="text-xs" style={{ color: COLORS.green }}>Saved</span>}
          </div>
        </form>
      </div>
    </div>
  )
}