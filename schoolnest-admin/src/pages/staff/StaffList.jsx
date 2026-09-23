// ============================================================
// [SCHOOL ADMIN PORTAL] — Staff Management
// Create, view, update, deactivate/reactivate staff accounts,
// reset passwords. Teachers created here become assignable in
// Academic Setup > Subjects.
// ============================================================
import React, { useState, useEffect } from 'react'
import { Plus, Users, Key, UserX, UserCheck, Search, Copy, Check } from 'lucide-react'
import { COLORS, formatDate } from '../../theme'
import { apiFetch } from '../../api'
import { Button, Badge, Spinner, ErrorBanner, Field, Input, Select, EmptyState } from '../../components/ui'
import Modal from '../../components/Modal'
import ConfirmModal from '../../components/ConfirmModal'
import InfiniteScrollSentinel from '../../components/InfiniteScrollSentinel'
import { useInfiniteScroll } from '../../hooks/useInfiniteScroll'

const ROLE_LABELS = { teacher: 'Teacher', accountant: 'Accountant', class_teacher: 'Class Teacher', school_admin: 'School Admin' }

export default function StaffList({ baseUrl, token, subdomain }) {
  const opts = { token, subdomain }
  const [staff, setStaff] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [newCredentials, setNewCredentials] = useState(null) // { fullName, email, tempPassword }
  const [busyId, setBusyId] = useState(null)
  const [confirmAction, setConfirmAction] = useState(null)

  async function load() {
    setLoading(true); setError('')
    try {
      const data = await apiFetch(baseUrl, '/staff', opts)
      setStaff(data)
    } catch (err) { setError(err.message) } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [baseUrl, token, subdomain])

//   async function toggleActive(s) {
//     setBusyId(s.id)
//     try {
//       await apiFetch(baseUrl, `/staff/${s.id}/${s.isActive ? 'deactivate' : 'reactivate'}`, { ...opts, method: 'PATCH' })
//       await load()
//     } catch (err) { setError(err.message) } finally { setBusyId(null) }
//   }


  // async function resetPassword(s) {
  //   if (!window.confirm(`Generate a new temporary password for ${s.fullName}?`)) return
  //   setBusyId(s.id)
  //   try {
  //     const data = await apiFetch(baseUrl, `/staff/${s.id}/reset-password`, { ...opts, method: 'POST' })
  //     setNewCredentials({ fullName: s.fullName, email: s.email, tempPassword: data.tempPassword })
  //   } catch (err) { setError(err.message) } finally { setBusyId(null) }
  // }

// add: import ConfirmModal from '../../components/ConfirmModal'
// add state: const [confirmAction, setConfirmAction] = useState(null) // { type: 'toggle'|'reset', staff }

async function runConfirmed() {
  const { type, staff: s } = confirmAction
  setConfirmAction(null); setBusyId(s.id)
  try {
    if (type === 'toggle') {
      await apiFetch(baseUrl, `/staff/${s.id}/${s.isActive ? 'deactivate' : 'reactivate'}`, { ...opts, method: 'PATCH' })
      await load()
    } else {
      const data = await apiFetch(baseUrl, `/staff/${s.id}/reset-password`, { ...opts, method: 'POST' })
      setNewCredentials({ fullName: s.fullName, email: s.email, tempPassword: data.tempPassword })
    }
  } catch (err) { setError(err.message) } finally { setBusyId(null) }
}
// change buttons: onClick={() => setConfirmAction({ type: 'reset', staff: s })} and { type: 'toggle', staff: s }
// add render:


// In CredentialsModal, update the intro paragraph:


  const filtered = staff.filter((s) => s.fullName.toLowerCase().includes(search.toLowerCase()) || s.email.toLowerCase().includes(search.toLowerCase()))
  const { visibleItems: visibleStaff, hasMore, sentinelRef } = useInfiniteScroll(filtered, 15)

  if (loading) return <Spinner label="Loading staff…" />

  return (
    <div>
      <ErrorBanner message={error} />

      <div className="flex items-center justify-between mb-4 gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: COLORS.textSecondary }} />
          <Input placeholder="Search staff…" className="pl-8" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Button onClick={() => setShowCreate(true)}><Plus size={15} /> New Staff</Button>
      </div>

      {filtered.length === 0 && <EmptyState icon={Users} title="No staff yet" sub="Add your first teacher or accountant." />}

      {filtered.length > 0 && (
        <div className="bg-white rounded overflow-hidden" style={{ border: `1px solid ${COLORS.border}` }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ backgroundColor: COLORS.surface, borderBottom: `1px solid ${COLORS.border}` }}>
                {['Name', 'Email', 'Role', 'Status', 'Last login', ''].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wide" style={{ color: COLORS.textSecondary }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visibleStaff.map((s) => (
                <tr key={s.id} style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                  <td className="px-4 py-3 font-medium" style={{ color: COLORS.textPrimary }}>{s.fullName}</td>
                  <td className="px-4 py-3" style={{ color: COLORS.textSecondary }}>{s.email}</td>
                  <td className="px-4 py-3"><Badge tone="neutral">{ROLE_LABELS[s.role] || s.role}</Badge></td>
                  <td className="px-4 py-3">{s.isActive ? <Badge tone="green">Active</Badge> : <Badge tone="red">Inactive</Badge>}</td>
                  <td className="px-4 py-3 text-xs" style={{ color: COLORS.textSecondary }}>{s.lastLoginAt ? formatDate(s.lastLoginAt) : 'Never'}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      <button onClick={() => setConfirmAction({ type: 'reset', staff: s })} disabled={busyId === s.id} className="p-1.5 rounded hover:bg-gray-100" title="Reset password">
                        <Key size={14} style={{ color: COLORS.textSecondary }} />
                      </button>
                      <button onClick={() => setConfirmAction({ type: 'toggle', staff: s })} disabled={busyId === s.id} className="p-1.5 rounded hover:bg-gray-100" title={s.isActive ? 'Deactivate' : 'Reactivate'}>
                        {s.isActive ? <UserX size={14} style={{ color: COLORS.red }} /> : <UserCheck size={14} style={{ color: COLORS.green }} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <InfiniteScrollSentinel sentinelRef={sentinelRef} hasMore={hasMore} />
        </div>
      )}

      {showCreate && <CreateStaffModal baseUrl={baseUrl} opts={opts} onClose={() => setShowCreate(false)} onSaved={load} onCreated={setNewCredentials} />}
      {newCredentials && <CredentialsModal credentials={newCredentials} onClose={() => setNewCredentials(null)} />}
      {confirmAction && (
        <ConfirmModal
          title={confirmAction.type === 'toggle' ? (confirmAction.staff.isActive ? 'Deactivate staff' : 'Reactivate staff') : 'Reset password'}
          message={confirmAction.type === 'toggle'
            ? `${confirmAction.staff.isActive ? 'Deactivate' : 'Reactivate'} ${confirmAction.staff.fullName}'s account?`
            : `Generate a new temporary password for ${confirmAction.staff.fullName}?`}
          confirmLabel={confirmAction.type === 'toggle' ? (confirmAction.staff.isActive ? 'Deactivate' : 'Reactivate') : 'Reset password'}
          tone={confirmAction.type === 'toggle' && confirmAction.staff.isActive ? 'red' : 'navy'}
          onCancel={() => setConfirmAction(null)} onConfirm={runConfirmed} />
      )}
    </div>
  )
}

function CreateStaffModal({ baseUrl, opts, onClose, onSaved, onCreated }) {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [role, setRole] = useState('teacher')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function submit(e) {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      const data = await apiFetch(baseUrl, '/staff', { ...opts, method: 'POST', body: { fullName, email, phone, role } })
      onSaved()
      onClose()
      onCreated({ fullName, email, tempPassword: data.tempPassword })
    } catch (err) { setError(err.message) } finally { setLoading(false) }
  }

  return (
    <Modal title="New staff account" onClose={onClose}>
      <ErrorBanner message={error} />
      <form onSubmit={submit}>
        <Field label="Full name"><Input value={fullName} onChange={(e) => setFullName(e.target.value)} required /></Field>
        <Field label="Email"><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></Field>
        <Field label="Phone"><Input value={phone} onChange={(e) => setPhone(e.target.value)} required /></Field>
        <Field label="Role">
          <Select value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="teacher">Teacher</option>
            <option value="class_teacher">Class Teacher</option>
            <option value="accountant">Accountant</option>
          </Select>
        </Field>
        <Button type="submit" full loading={loading}>Create account</Button>
      </form>
    </Modal>
  )
}

function CredentialsModal({ credentials, onClose }) {
  const [copied, setCopied] = useState(false)

  function copy() {
    navigator.clipboard.writeText(`Email: ${credentials.email}\nTemporary password: ${credentials.tempPassword}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Modal title="Account created" onClose={onClose}>
      <p className="text-sm mb-4" style={{ color: COLORS.textSecondary }}>
        We've also emailed these credentials to <strong style={{ color: COLORS.textPrimary }}>{credentials.email}</strong>. Share this copy as a backup.
      </p>
      <div className="rounded p-4 mb-4" style={{ backgroundColor: COLORS.surface, fontFamily: "'IBM Plex Mono', monospace" }}>
        <div className="text-xs mb-1" style={{ color: COLORS.textSecondary }}>Email</div>
        <div className="text-sm mb-3" style={{ color: COLORS.textPrimary }}>{credentials.email}</div>
        <div className="text-xs mb-1" style={{ color: COLORS.textSecondary }}>Temporary password</div>
        <div className="text-sm font-semibold" style={{ color: COLORS.textPrimary }}>{credentials.tempPassword}</div>
      </div>
      <Button full onClick={copy}>
        {copied ? <Check size={14} /> : <Copy size={14} />}
        {copied ? 'Copied' : 'Copy credentials'}
      </Button>
    </Modal>
  )
}