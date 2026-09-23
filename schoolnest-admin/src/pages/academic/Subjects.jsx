// ============================================================
// [SCHOOL ADMIN PORTAL] — Subjects (UPDATED)
// Adds bulk "All classes / All arms" assignment, and a proper
// confirm modal instead of window.confirm.
// ============================================================
import React, { useState, useEffect } from 'react'
import { Plus, BookOpen, Trash2 } from 'lucide-react'
import { COLORS } from '../../theme'
import { apiFetch } from '../../api'
import { Button, Spinner, ErrorBanner, Field, Input, Select, EmptyState } from '../../components/ui'
import Modal from '../../components/Modal'
import ConfirmModal from '../../components/ConfirmModal'

const ALL = '__ALL__'

export default function Subjects({ baseUrl, token, subdomain }) {
  const opts = { token, subdomain }
  const [subjects, setSubjects] = useState([])
  const [classes, setClasses] = useState([])
  const [staff, setStaff] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showSubjectModal, setShowSubjectModal] = useState(false)
  const [showAssignModal, setShowAssignModal] = useState(null)
  const [confirmRemove, setConfirmRemove] = useState(null)

  async function load() {
    setLoading(true); setError('')
    try {
      const [subjectsData, classesData, staffData] = await Promise.all([
        apiFetch(baseUrl, '/subjects', opts),
        apiFetch(baseUrl, '/classes', opts),
        apiFetch(baseUrl, '/staff', opts),
      ])
      setSubjects(subjectsData); setClasses(classesData)
      setStaff(staffData.filter((s) => s.role === 'teacher'))
    } catch (err) { setError(err.message) } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [baseUrl, token, subdomain])

  async function confirmRemoveNow() {
    const id = confirmRemove
    setConfirmRemove(null)
    try { await apiFetch(baseUrl, `/subject-mappings/${id}`, { ...opts, method: 'DELETE' }); await load() }
    catch (err) { setError(err.message) }
  }

  if (loading) return <Spinner label="Loading subjects…" />

  return (
    <div>
      <ErrorBanner message={error} />
      <div className="flex justify-end mb-4">
        <Button onClick={() => setShowSubjectModal(true)}><Plus size={15} /> New Subject</Button>
      </div>

      {subjects.length === 0 && <EmptyState icon={BookOpen} title="No subjects yet" sub="Add your first subject, e.g. Mathematics." />}

      <div className="space-y-3">
        {subjects.map((s) => (
          <div key={s.id} className="bg-white rounded" style={{ border: `1px solid ${COLORS.border}` }}>
            <div className="px-5 py-3.5 flex items-center justify-between" style={{ borderBottom: `1px solid ${COLORS.border}` }}>
              <span className="text-sm font-semibold" style={{ color: COLORS.textPrimary }}>{s.name}</span>
              <Button size="sm" variant="ghost" onClick={() => setShowAssignModal(s.id)}><Plus size={13} /> Assign to class</Button>
            </div>
            <div className="p-4">
              {(!s.subjectMappings || s.subjectMappings.length === 0) && (
                <span className="text-xs" style={{ color: COLORS.textSecondary }}>Not assigned to any class yet.</span>
              )}
              <div className="flex flex-wrap gap-2">
                {s.subjectMappings?.map((m) => (
                  <div key={m.id} className="flex items-center gap-2 px-3 py-1.5 rounded text-xs" style={{ backgroundColor: COLORS.surface }}>
                    <span style={{ color: COLORS.textPrimary }}>{m.class.name} {m.arm.name}</span>
                    <span style={{ color: COLORS.textSecondary }}>· {m.teacher.fullName}</span>
                    <button onClick={() => setConfirmRemove(m.id)}><Trash2 size={12} style={{ color: COLORS.red }} /></button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {showSubjectModal && <SubjectModal baseUrl={baseUrl} opts={opts} onClose={() => setShowSubjectModal(false)} onSaved={load} />}
      {showAssignModal && (
        <AssignModal baseUrl={baseUrl} opts={opts} subjectId={showAssignModal} classes={classes} staff={staff}
          onClose={() => setShowAssignModal(null)} onSaved={load} />
      )}
      {confirmRemove && (
        <ConfirmModal title="Remove subject from class" message="Teachers will lose access to enter scores for this subject in this class." confirmLabel="Remove" tone="red"
          onCancel={() => setConfirmRemove(null)} onConfirm={confirmRemoveNow} />
      )}
    </div>
  )
}

function SubjectModal({ baseUrl, opts, onClose, onSaved }) {
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function submit(e) {
    e.preventDefault()
    setLoading(true); setError('')
    try { await apiFetch(baseUrl, '/subjects', { ...opts, method: 'POST', body: { name } }); onSaved(); onClose() }
    catch (err) { setError(err.message) } finally { setLoading(false) }
  }

  return (
    <Modal title="New subject" onClose={onClose}>
      <ErrorBanner message={error} />
      <form onSubmit={submit}>
        <Field label="Subject name"><Input placeholder="e.g. Mathematics" value={name} onChange={(e) => setName(e.target.value)} required /></Field>
        <Button type="submit" full loading={loading}>Create subject</Button>
      </form>
    </Modal>
  )
}

// Expands the class/arm selection — including "All classes" and "All arms
// in this class" — into the full list of {classId, armId} pairs to assign.
function resolvePairs(classId, armId, classes) {
  if (classId === ALL) {
    return classes.flatMap((c) => c.arms.map((a) => ({ classId: c.id, armId: a.id })))
  }
  const cls = classes.find((c) => c.id === classId)
  if (!cls) return []
  if (armId === ALL) return cls.arms.map((a) => ({ classId: cls.id, armId: a.id }))
  const arm = cls.arms.find((a) => a.id === armId)
  return arm ? [{ classId: cls.id, armId: arm.id }] : []
}

function AssignModal({ baseUrl, opts, subjectId, classes, staff, onClose, onSaved }) {
  const [classId, setClassId] = useState('')
  const [armId, setArmId] = useState('')
  const [teacherId, setTeacherId] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)
  const selectedClass = classes.find((c) => c.id === classId)

  async function submit(e) {
    e.preventDefault()
    setLoading(true); setError(''); setResult(null)
    const pairs = resolvePairs(classId, armId, classes)
    if (pairs.length === 0) { setError('No matching classes/arms found.'); setLoading(false); return }

    let assigned = 0, skipped = 0
    for (const pair of pairs) {
      try {
        await apiFetch(baseUrl, `/subjects/${subjectId}/assign`, { ...opts, method: 'POST', body: { classId: pair.classId, armId: pair.armId, teacherId } })
        assigned++
      } catch { skipped++ } // most commonly "already assigned" — skip rather than abort the batch
    }
    setResult({ assigned, skipped })
    setLoading(false)
    onSaved()
  }

  if (result) {
    return (
      <Modal title="Assignment complete" onClose={onClose}>
        <p className="text-sm mb-4" style={{ color: COLORS.textSecondary }}>
          Assigned to <strong style={{ color: COLORS.green }}>{result.assigned}</strong> class-arm{result.assigned !== 1 ? 's' : ''}.
          {result.skipped > 0 && <> {result.skipped} were skipped (already assigned).</>}
        </p>
        <Button full onClick={onClose}>Done</Button>
      </Modal>
    )
  }

  return (
    <Modal title="Assign subject to class" onClose={onClose}>
      <ErrorBanner message={error} />
      <form onSubmit={submit}>
        <Field label="Class">
          <Select value={classId} onChange={(e) => { setClassId(e.target.value); setArmId('') }} required>
            <option value="">Select a class…</option>
            <option value={ALL}>All classes</option>
            {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
        </Field>
        {classId && classId !== ALL && (
          <Field label="Arm">
            <Select value={armId} onChange={(e) => setArmId(e.target.value)} required>
              <option value="">Select an arm…</option>
              <option value={ALL}>All arms in {selectedClass?.name}</option>
              {selectedClass?.arms.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </Select>
          </Field>
        )}
        {classId === ALL && (
          <p className="text-xs mb-4" style={{ color: COLORS.textSecondary }}>This assigns the subject to every arm in every class in the school.</p>
        )}
        <Field label="Teacher">
          <Select value={teacherId} onChange={(e) => setTeacherId(e.target.value)} required>
            <option value="">Select a teacher…</option>
            {staff.map((t) => <option key={t.id} value={t.id}>{t.fullName}</option>)}
          </Select>
        </Field>
        <Button type="submit" full loading={loading}>Assign</Button>
      </form>
    </Modal>
  )
}