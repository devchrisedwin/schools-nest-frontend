// ============================================================
// [SCHOOL ADMIN PORTAL] — Parent Management
// Create parent accounts and view which children each is linked to.
// The actual "enter linking code" step happens in the parent's own
// mobile app, not here — this is admin-side account creation only.
// ============================================================
import React, { useState, useEffect } from 'react'
import { Plus, UserCircle2, Search, Copy, Check } from 'lucide-react'
import { COLORS } from '../../theme'
import { apiFetch } from '../../api'
import { Button, Badge, Spinner, ErrorBanner, Field, Input, EmptyState } from '../../components/ui'
import Modal from '../../components/Modal'
import InfiniteScrollSentinel from '../../components/InfiniteScrollSentinel'
import { useInfiniteScroll } from '../../hooks/useInfiniteScroll'

export default function ParentsList({ baseUrl, token, subdomain }) {
  const opts = { token, subdomain }
  const [parents, setParents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [newCredentials, setNewCredentials] = useState(null)

  async function load() {
    setLoading(true); setError('')
    try {
      const data = await apiFetch(baseUrl, '/parents', opts)
      setParents(data)
    } catch (err) { setError(err.message) } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [baseUrl, token, subdomain])

  const filtered = parents.filter((p) => p.fullName.toLowerCase().includes(search.toLowerCase()) || p.email.toLowerCase().includes(search.toLowerCase()))
  const { visibleItems: visibleParents, hasMore, sentinelRef } = useInfiniteScroll(filtered, 12)

  if (loading) return <Spinner label="Loading parents…" />

  return (
    <div>
      <ErrorBanner message={error} />
      <div className="flex items-center justify-between mb-4 gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: COLORS.textSecondary }} />
          <Input placeholder="Search parents…" className="pl-8" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Button onClick={() => setShowCreate(true)}><Plus size={15} /> New Parent</Button>
      </div>

      {filtered.length === 0 && <EmptyState icon={UserCircle2} title="No parents yet" sub="Add a parent account, then link them to a student from the student's profile." />}

      {filtered.length > 0 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {visibleParents.map((p) => (
            <div key={p.id} className="bg-white rounded p-4" style={{ border: `1px solid ${COLORS.border}` }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold" style={{ color: COLORS.textPrimary }}>{p.fullName}</span>
              </div>
              <div className="text-xs mb-3" style={{ color: COLORS.textSecondary }}>{p.email} · {p.phone}</div>
              <div className="flex flex-wrap gap-1.5">
                {(!p.studentLinks || p.studentLinks.length === 0) && (
                  <span className="text-xs" style={{ color: COLORS.textSecondary }}>No children linked yet</span>
                )}
                {p.studentLinks?.map((link) => (
                  <Badge key={link.id} tone={link.isLinked ? 'green' : 'amber'}>
                    {link.student.fullName} {!link.isLinked && '· pending'}
                  </Badge>
                ))}
              </div>
            </div>
          ))}
        </div>
        <InfiniteScrollSentinel sentinelRef={sentinelRef} hasMore={hasMore} />
        </>
      )}

      {showCreate && <CreateParentModal baseUrl={baseUrl} opts={opts} onClose={() => setShowCreate(false)} onSaved={load} onCreated={setNewCredentials} />}
      {newCredentials && <CredentialsModal credentials={newCredentials} onClose={() => setNewCredentials(null)} />}
    </div>
  )
}

function CreateParentModal({ baseUrl, opts, onClose, onSaved, onCreated }) {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function submit(e) {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      const data = await apiFetch(baseUrl, '/parents', { ...opts, method: 'POST', body: { fullName, email, phone } })
      onSaved(); onClose()
      onCreated({ fullName, email, tempPassword: data.tempPassword })
    } catch (err) { setError(err.message) } finally { setLoading(false) }
  }

  return (
    <Modal title="New parent account" onClose={onClose}>
      <ErrorBanner message={error} />
      <form onSubmit={submit}>
        <Field label="Full name"><Input value={fullName} onChange={(e) => setFullName(e.target.value)} required /></Field>
        <Field label="Email"><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></Field>
        <Field label="Phone"><Input value={phone} onChange={(e) => setPhone(e.target.value)} required /></Field>
        <p className="text-xs mb-4" style={{ color: COLORS.textSecondary }}>
          Link this parent to a student afterward from the student's profile — that's what generates the linking code they'll enter in the app.
        </p>
        <Button type="submit" full loading={loading}>Create account</Button>
      </form>
    </Modal>
  )
}

function CredentialsModal({ credentials, onClose }) {
  const [copied, setCopied] = useState(false)
  function copy() {
    navigator.clipboard.writeText(`Email: ${credentials.email}\nTemporary password: ${credentials.tempPassword}`)
    setCopied(true); setTimeout(() => setCopied(false), 2000)
  }
  return (
    <Modal title="Parent account created" onClose={onClose}>
      <p className="text-sm mb-4" style={{ color: COLORS.textSecondary }}>
        We've also emailed these credentials to <strong style={{ color: COLORS.textPrimary }}>{credentials.email}</strong>. Share this copy as a backup.
      </p>
      <div className="rounded p-4 mb-4" style={{ backgroundColor: COLORS.surface, fontFamily: "'IBM Plex Mono', monospace" }}>
        <div className="text-xs mb-1" style={{ color: COLORS.textSecondary }}>Email</div>
        <div className="text-sm mb-3" style={{ color: COLORS.textPrimary }}>{credentials.email}</div>
        <div className="text-xs mb-1" style={{ color: COLORS.textSecondary }}>Temporary password</div>
        <div className="text-sm font-semibold" style={{ color: COLORS.textPrimary }}>{credentials.tempPassword}</div>
      </div>
      <Button full onClick={copy}>{copied ? <Check size={14} /> : <Copy size={14} />} {copied ? 'Copied' : 'Copy credentials'}</Button>
    </Modal>
  )
}