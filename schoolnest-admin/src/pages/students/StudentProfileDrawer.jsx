// ============================================================
// [SCHOOL ADMIN PORTAL] — Student Profile (side drawer) — UPDATED
// Adds "Unlink" next to each linked parent, with confirmation.
// ============================================================
import React, { useState, useEffect } from 'react'
import { X, ArrowRightLeft, Award, Link2, Unlink } from 'lucide-react'
import { COLORS, formatDate } from '../../theme'
import { apiFetch } from '../../api'
import { Button, Badge, Spinner, ErrorBanner, Field, Select, Input } from '../../components/ui'
import ConfirmModal from '../../components/ConfirmModal'

export default function StudentProfileDrawer({ baseUrl, opts, studentId, classes, onClose, onChanged }) {
  const [student, setStudent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [mode, setMode] = useState('view') // view | transfer | link
  const [busy, setBusy] = useState(false)
  const [confirmGraduate, setConfirmGraduate] = useState(false)
  const [confirmUnlink, setConfirmUnlink] = useState(null) // parentId or null

  async function load() {
    setLoading(true); setError('')
    try {
      const data = await apiFetch(baseUrl, `/students/${studentId}`, opts)
      setStudent(data)
    } catch (err) { setError(err.message) } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [studentId])

  async function confirmGraduateNow() {
    setConfirmGraduate(false); setBusy(true)
    try { await apiFetch(baseUrl, `/students/${studentId}/graduate`, { ...opts, method: 'PATCH' }); onChanged(); onClose() }
    catch (err) { setError(err.message) } finally { setBusy(false) }
  }

  async function confirmUnlinkNow() {
    const parentId = confirmUnlink
    setConfirmUnlink(null); setBusy(true)
    try {
      await apiFetch(baseUrl, `/students/${studentId}/parent-links/${parentId}`, { ...opts, method: 'DELETE' })
      await load()
    } catch (err) { setError(err.message) } finally { setBusy(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end" style={{ backgroundColor: 'rgba(11,21,38,0.5)' }} onClick={onClose}>
      <div className="w-full max-w-md h-full bg-white overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="px-6 py-4 flex items-center justify-between sticky top-0 bg-white" style={{ borderBottom: `1px solid ${COLORS.border}` }}>
          <h2 className="text-base font-semibold" style={{ color: COLORS.textPrimary }}>Student profile</h2>
          <button onClick={onClose}><X size={18} style={{ color: COLORS.textSecondary }} /></button>
        </div>

        <div className="p-6">
          <ErrorBanner message={error} />
          {loading ? <Spinner /> : student && (
            <>
              <div className="mb-6">
                <div className="text-lg font-semibold" style={{ color: COLORS.textPrimary }}>{student.fullName}</div>
                <div className="text-sm mt-0.5" style={{ color: COLORS.textSecondary, fontFamily: "'IBM Plex Mono', monospace" }}>{student.studentIdNumber}</div>
                <div className="flex items-center gap-2 mt-2">
                  <Badge tone="neutral">{student.currentArm?.class?.name} {student.currentArm?.name}</Badge>
                  {student.isGraduated ? <Badge tone="neutral">Graduated</Badge> : <Badge tone="green">Active</Badge>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-6 text-sm">
                <div><div className="text-xs mb-0.5" style={{ color: COLORS.textSecondary }}>Date of birth</div><div style={{ color: COLORS.textPrimary }}>{formatDate(student.dateOfBirth)}</div></div>
                <div><div className="text-xs mb-0.5" style={{ color: COLORS.textSecondary }}>Gender</div><div className="capitalize" style={{ color: COLORS.textPrimary }}>{student.gender}</div></div>
              </div>

              <div className="mb-6">
                <div className="text-xs font-medium uppercase tracking-wide mb-2" style={{ color: COLORS.textSecondary }}>Linked parents</div>
                {(!student.parentLinks || student.parentLinks.length === 0) && (
                  <div className="text-sm" style={{ color: COLORS.textSecondary }}>No parent linked yet.</div>
                )}
                {student.parentLinks?.map((link) => (
                  <div key={link.id} className="flex items-center justify-between py-2" style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                    <div>
                      <div className="text-sm" style={{ color: COLORS.textPrimary }}>{link.parent.fullName}</div>
                      <div className="text-xs" style={{ color: COLORS.textSecondary }}>{link.relationship}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      {link.isLinked ? <Badge tone="green">Linked</Badge> : <Badge tone="amber">Pending</Badge>}
                      <button onClick={() => setConfirmUnlink(link.parent.id)} disabled={busy} className="p-1.5 rounded hover:bg-gray-100" title="Unlink">
                        <Unlink size={14} style={{ color: COLORS.red }} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {mode === 'view' && (
                <div className="space-y-2">
                  <Button full variant="ghost" onClick={() => setMode('link')}><Link2 size={14} /> Link a parent</Button>
                  <Button full variant="ghost" onClick={() => setMode('transfer')}><ArrowRightLeft size={14} /> Transfer class</Button>
                  {!student.isGraduated && (
                    <Button full variant="ghost" onClick={() => setConfirmGraduate(true)} disabled={busy}><Award size={14} /> Mark as graduated</Button>
                  )}
                </div>
              )}

              {mode === 'transfer' && (
                <TransferForm baseUrl={baseUrl} opts={opts} studentId={studentId} classes={classes}
                  onDone={() => { setMode('view'); load(); onChanged() }} onCancel={() => setMode('view')} />
              )}
              {mode === 'link' && (
                <LinkParentForm baseUrl={baseUrl} opts={opts} studentId={studentId}
                  onDone={() => { setMode('view'); load(); onChanged() }} onCancel={() => setMode('view')} />
              )}
            </>
          )}
        </div>
      </div>

      {confirmGraduate && (
        <ConfirmModal title="Mark as graduated" message={`${student?.fullName} will be archived as graduated. All records are preserved.`}
          confirmLabel="Graduate" tone="navy" onCancel={() => setConfirmGraduate(false)} onConfirm={confirmGraduateNow} />
      )}
      {confirmUnlink && (
        <ConfirmModal title="Unlink parent" message="This parent will no longer see this student's results, attendance, or fees in their app."
          confirmLabel="Unlink" tone="red" onCancel={() => setConfirmUnlink(null)} onConfirm={confirmUnlinkNow} />
      )}
    </div>
  )
}

function TransferForm({ baseUrl, opts, studentId, classes, onDone, onCancel }) {
  const [classId, setClassId] = useState('')
  const [armId, setArmId] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const selectedClass = classes.find((c) => c.id === classId)

  async function submit(e) {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      await apiFetch(baseUrl, `/students/${studentId}/transfer`, { ...opts, method: 'PATCH', body: { classId, armId } })
      onDone()
    } catch (err) { setError(err.message) } finally { setLoading(false) }
  }

  return (
    <form onSubmit={submit} className="border-t pt-4" style={{ borderColor: COLORS.border }}>
      <ErrorBanner message={error} />
      <Field label="New class">
        <Select value={classId} onChange={(e) => { setClassId(e.target.value); setArmId('') }} required>
          <option value="">Select a class…</option>
          {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </Select>
      </Field>
      <Field label="New arm">
        <Select value={armId} onChange={(e) => setArmId(e.target.value)} required disabled={!selectedClass}>
          <option value="">Select an arm…</option>
          {selectedClass?.arms.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
        </Select>
      </Field>
      <div className="flex gap-2">
        <Button type="submit" loading={loading}>Confirm transfer</Button>
        <Button variant="ghost" type="button" onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  )
}

function LinkParentForm({ baseUrl, opts, studentId, onDone, onCancel }) {
  const [parents, setParents] = useState([])
  const [parentId, setParentId] = useState('')
  const [relationship, setRelationship] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [code, setCode] = useState(null)

  useEffect(() => {
    apiFetch(baseUrl, '/parents', opts).then(setParents).catch((e) => setError(e.message))
  }, [])

  async function submit(e) {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      const link = await apiFetch(baseUrl, `/students/${studentId}/regenerate-link-code`, { ...opts, method: 'POST', body: { parentId, relationship } })
      setCode(link.linkingCode)
    } catch (err) { setError(err.message) } finally { setLoading(false) }
  }

  if (code) {
    return (
      <div className="border-t pt-4" style={{ borderColor: COLORS.border }}>
        <div className="text-sm mb-2" style={{ color: COLORS.textSecondary }}>Also emailed to the parent — this is a backup copy:</div>
        <div className="text-2xl font-semibold text-center py-4 rounded mb-3" style={{ backgroundColor: COLORS.surface, color: COLORS.navyAccent, fontFamily: "'IBM Plex Mono', monospace", letterSpacing: '0.1em' }}>
          {code}
        </div>
        <Button full onClick={onDone}>Done</Button>
      </div>
    )
  }

  return (
    <form onSubmit={submit} className="border-t pt-4" style={{ borderColor: COLORS.border }}>
      <ErrorBanner message={error} />
      <Field label="Parent">
        <Select value={parentId} onChange={(e) => setParentId(e.target.value)} required>
          <option value="">Select a parent…</option>
          {parents.map((p) => <option key={p.id} value={p.id}>{p.fullName}</option>)}
        </Select>
      </Field>
      <Field label="Relationship">
        <Input placeholder="e.g. Father, Mother, Guardian" value={relationship} onChange={(e) => setRelationship(e.target.value)} required />
      </Field>
      <div className="flex gap-2">
        <Button type="submit" loading={loading}>Generate code</Button>
        <Button variant="ghost" type="button" onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  )
}