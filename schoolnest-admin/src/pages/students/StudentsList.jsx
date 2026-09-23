// ============================================================
// [SCHOOL ADMIN PORTAL] — Student Management
// Enroll students, view/edit profiles, transfer, graduate,
// regenerate parent linking codes. Depends on Classes & Arms
// already existing (Academic Setup).
// ============================================================
import React, { useState, useEffect } from 'react'
import { Plus, GraduationCap, Search, ArrowRightLeft, Award, Link2, Copy, Check, Filter, ScanLine } from 'lucide-react'
import { COLORS, formatDate } from '../../theme'
import { apiFetch } from '../../api'
import { Button, Badge, Spinner, ErrorBanner, Field, Input, Select, EmptyState } from '../../components/ui'
import Modal from '../../components/Modal'
import StudentProfileDrawer from './StudentProfileDrawer'
import BulkEnrollScan from './BulkEnrollScan'
import InfiniteScrollSentinel from '../../components/InfiniteScrollSentinel'
import { useInfiniteScroll } from '../../hooks/useInfiniteScroll'

export default function StudentsList({ baseUrl, token, subdomain }) {
  const opts = { token, subdomain }
  const [students, setStudents] = useState([])
  const [classes, setClasses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [classFilter, setClassFilter] = useState('')
  const [showEnroll, setShowEnroll] = useState(false)
  const [newCredentials, setNewCredentials] = useState(null)
  const [selectedStudentId, setSelectedStudentId] = useState(null)
  const [showBulkScan, setShowBulkScan] = useState(false)
  

  async function load() {
    setLoading(true); setError('')
    try {
      const [studentsData, classesData] = await Promise.all([
        apiFetch(baseUrl, '/students', opts),
        apiFetch(baseUrl, '/classes', opts),
      ])
      setStudents(studentsData); setClasses(classesData)
    } catch (err) { setError(err.message) } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [baseUrl, token, subdomain])

  const filtered = students.filter((s) => {
    const matchesSearch = s.fullName.toLowerCase().includes(search.toLowerCase()) || s.studentIdNumber.toLowerCase().includes(search.toLowerCase())
    const matchesClass = !classFilter || s.currentClassId === classFilter
    return matchesSearch && matchesClass
  })

  const { visibleItems: visibleStudents, hasMore, sentinelRef } = useInfiniteScroll(filtered, 15)


  if (loading) return <Spinner label="Loading students…" />

  return (
    <div>
      <ErrorBanner message={error} />
      {showBulkScan && (
        <BulkEnrollScan baseUrl={baseUrl} opts={{ token, subdomain }} classes={classes} onClose={() => setShowBulkScan(false)} onDone={load} />
      )}

      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <div className="flex items-center gap-2 flex-1">
          <div className="relative max-w-xs flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: COLORS.textSecondary }} />
            <Input placeholder="Search by name or ID…" className="pl-8" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Select value={classFilter} onChange={(e) => setClassFilter(e.target.value)} style={{ maxWidth: 160 }}>
            <option value="">All classes</option>
            {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
        </div>
        <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={() => setShowBulkScan(true)}><ScanLine size={15} /> Bulk Enroll (Scan)</Button>
            <Button onClick={() => setShowEnroll(true)}><Plus size={15} /> Enroll Student</Button>
        </div>
      </div>

      {filtered.length === 0 && <EmptyState icon={GraduationCap} title="No students found" sub="Enroll your first student to get started." />}

      {filtered.length > 0 && (
        <div className="bg-white rounded overflow-hidden" style={{ border: `1px solid ${COLORS.border}` }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ backgroundColor: COLORS.surface, borderBottom: `1px solid ${COLORS.border}` }}>
                {['Student ID', 'Name', 'Class', 'Gender', 'Status', 'Enrolled'].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wide" style={{ color: COLORS.textSecondary }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visibleStudents.map((s) => (
                <tr key={s.id} onClick={() => setSelectedStudentId(s.id)} className="cursor-pointer hover:bg-gray-50" style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                  <td className="px-4 py-3" style={{ color: COLORS.textPrimary, fontFamily: "'IBM Plex Mono', monospace" }}>{s.studentIdNumber}</td>
                  <td className="px-4 py-3 font-medium" style={{ color: COLORS.textPrimary }}>{s.fullName}</td>
                  <td className="px-4 py-3" style={{ color: COLORS.textSecondary }}>{s.currentArm?.class?.name} {s.currentArm?.name}</td>
                  <td className="px-4 py-3 capitalize" style={{ color: COLORS.textSecondary }}>{s.gender}</td>
                  <td className="px-4 py-3">
                    {s.isGraduated ? <Badge tone="neutral">Graduated</Badge> : s.isActive ? <Badge tone="green">Active</Badge> : <Badge tone="red">Inactive</Badge>}
                  </td>
                  <td className="px-4 py-3 text-xs" style={{ color: COLORS.textSecondary }}>{formatDate(s.enrolledAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <InfiniteScrollSentinel sentinelRef={sentinelRef} hasMore={hasMore} />
        </div>
      )}

      {showEnroll && (
        <EnrollModal baseUrl={baseUrl} opts={opts} classes={classes} onClose={() => setShowEnroll(false)}
          onSaved={load} onCreated={setNewCredentials} />
      )}
      {newCredentials && <EnrollmentResultModal result={newCredentials} onClose={() => setNewCredentials(null)} />}
      {selectedStudentId && (
        <StudentProfileDrawer baseUrl={baseUrl} opts={opts} studentId={selectedStudentId} classes={classes}
          onClose={() => setSelectedStudentId(null)} onChanged={load} />
      )}
    </div>
  )
}

// ============================================================
// [SCHOOL ADMIN PORTAL] — Enroll Student modal (UPDATED)
// Now supports linking a parent at enrollment time — either an
// existing parent account, or creating a brand-new one inline.
// Both paths trigger a linking code + credentials by email, and
// both are shown here on success as a fallback/backup copy.
// ============================================================

function EnrollModal({ baseUrl, opts, classes, onClose, onSaved, onCreated }) {
  const [fullName, setFullName] = useState('')
  const [dateOfBirth, setDateOfBirth] = useState('')
  const [gender, setGender] = useState('male')
  const [classId, setClassId] = useState('')
  const [armId, setArmId] = useState('')

  const [linkParent, setLinkParent] = useState(false)
  const [parentMode, setParentMode] = useState('new') // 'new' | 'existing'
  const [parents, setParents] = useState([])
  const [loadingParents, setLoadingParents] = useState(false)
  const [parentId, setParentId] = useState('')
  const [parentFullName, setParentFullName] = useState('')
  const [parentEmail, setParentEmail] = useState('')
  const [parentPhone, setParentPhone] = useState('')
  const [relationship, setRelationship] = useState('')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const selectedClass = classes.find((c) => c.id === classId)

  useEffect(() => {
    if (linkParent && parentMode === 'existing' && parents.length === 0) {
      setLoadingParents(true)
      apiFetch(baseUrl, '/parents', opts)
        .then(setParents)
        .catch((e) => setError(e.message))
        .finally(() => setLoadingParents(false))
    }
  }, [linkParent, parentMode])

  function resetParentFields() {
    setParentId(''); setParentFullName(''); setParentEmail(''); setParentPhone(''); setRelationship('')
  }

  async function submit(e) {
    e.preventDefault()
    setLoading(true); setError('')

    const body = { fullName, dateOfBirth, gender, currentClassId: classId, currentArmId: armId }

    if (linkParent) {
      if (!relationship) { setError('Relationship is required to link a parent.'); setLoading(false); return }
      body.relationship = relationship
      if (parentMode === 'existing') {
        if (!parentId) { setError('Select a parent.'); setLoading(false); return }
        body.parentId = parentId
      } else {
        if (!parentFullName || !parentEmail || !parentPhone) { setError('Fill in all new parent details.'); setLoading(false); return }
        body.parentFullName = parentFullName
        body.parentEmail = parentEmail
        body.parentPhone = parentPhone
      }
    }

    try {
      const data = await apiFetch(baseUrl, '/students', { ...opts, method: 'POST', body })
      onSaved()
      onClose()
      onCreated({
        fullName,
        studentIdNumber: data.student.studentIdNumber,
        tempPassword: data.tempPassword,
        link: data.link,
        parentTempPassword: data.parentTempPassword,
      })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal title="Enroll student" onClose={onClose} width="max-w-lg">
      <ErrorBanner message={error} />
      <form onSubmit={submit}>
        <Field label="Full name">
          <Input value={fullName} onChange={(e) => setFullName(e.target.value)} required />
        </Field>
        <Field label="Date of birth">
          <Input type="date" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} required />
        </Field>
        <Field label="Gender">
          <Select value={gender} onChange={(e) => setGender(e.target.value)}>
            <option value="male">Male</option>
            <option value="female">Female</option>
          </Select>
        </Field>
        <Field label="Class">
          <Select value={classId} onChange={(e) => { setClassId(e.target.value); setArmId('') }} required>
            <option value="">Select a class…</option>
            {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
        </Field>
        <Field label="Arm">
          <Select value={armId} onChange={(e) => setArmId(e.target.value)} required disabled={!selectedClass}>
            <option value="">Select an arm…</option>
            {selectedClass?.arms.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </Select>
        </Field>

        <div className="my-4 pt-4" style={{ borderTop: `1px solid ${COLORS.border}` }}>
          <label className="flex items-center gap-2.5 text-sm cursor-pointer" style={{ color: COLORS.textPrimary }}>
            <input
              type="checkbox"
              checked={linkParent}
              onChange={(e) => { setLinkParent(e.target.checked); resetParentFields() }}
            />
            Link a parent now
          </label>
          <p className="text-xs mt-1" style={{ color: COLORS.textSecondary }}>
            Optional — you can always link a parent later from the student's profile instead.
          </p>
        </div>

        {linkParent && (
          <div className="rounded p-4 mb-4" style={{ backgroundColor: COLORS.surface }}>
            <div className="flex rounded p-1 mb-4" style={{ backgroundColor: '#fff', border: `1px solid ${COLORS.border}` }}>
              {[{ key: 'new', label: 'Create new parent' }, { key: 'existing', label: 'Use existing parent' }].map((m) => (
                <button
                  key={m.key}
                  type="button"
                  onClick={() => { setParentMode(m.key); resetParentFields() }}
                  className="flex-1 py-2 rounded text-xs font-medium transition-colors"
                  style={{
                    backgroundColor: parentMode === m.key ? COLORS.navyAccent : 'transparent',
                    color: parentMode === m.key ? '#fff' : COLORS.textSecondary,
                  }}
                >
                  {m.label}
                </button>
              ))}
            </div>

            {parentMode === 'existing' && (
              <Field label="Parent">
                {loadingParents ? (
                  <div className="text-xs py-2" style={{ color: COLORS.textSecondary }}>Loading parents…</div>
                ) : (
                  <Select value={parentId} onChange={(e) => setParentId(e.target.value)} required>
                    <option value="">Select a parent…</option>
                    {parents.map((p) => <option key={p.id} value={p.id}>{p.fullName} — {p.email}</option>)}
                  </Select>
                )}
              </Field>
            )}

            {parentMode === 'new' && (
              <>
                <Field label="Parent full name">
                  <Input value={parentFullName} onChange={(e) => setParentFullName(e.target.value)} required />
                </Field>
                <Field label="Parent email">
                  <Input type="email" value={parentEmail} onChange={(e) => setParentEmail(e.target.value)} required />
                </Field>
                <Field label="Parent phone">
                  <Input value={parentPhone} onChange={(e) => setParentPhone(e.target.value)} required />
                </Field>
              </>
            )}

            <Field label="Relationship">
              <Input placeholder="e.g. Father, Mother, Guardian" value={relationship} onChange={(e) => setRelationship(e.target.value)} required />
            </Field>
          </div>
        )}

        <Button type="submit" full loading={loading}>Enroll student</Button>
      </form>
    </Modal>
  )
}

function EnrollmentResultModal({ result, onClose }) {
  const [copied, setCopied] = useState('')

  function copy(label, text) {
    navigator.clipboard.writeText(text)
    setCopied(label)
    setTimeout(() => setCopied(''), 2000)
  }

  const studentCredentials = `Student ID: ${result.studentIdNumber}\nTemporary password: ${result.tempPassword}`
  const parentCredentials = result.parentTempPassword
    ? `Parent email login\nTemporary password: ${result.parentTempPassword}`
    : ''
  const linkingCode = result.link?.linkingCode

  return (
    <Modal title="Student enrolled" onClose={onClose}>
      <p className="text-sm mb-4" style={{ color: COLORS.textSecondary }}>
        <strong style={{ color: COLORS.textPrimary }}>{result.fullName}</strong> is enrolled. They log in with their Student ID, not an email.
      </p>

      <div className="rounded p-4 mb-3" style={{ backgroundColor: COLORS.surface, fontFamily: "'IBM Plex Mono', monospace" }}>
        <div className="text-xs mb-1" style={{ color: COLORS.textSecondary }}>Student ID (login)</div>
        <div className="text-sm mb-3 font-semibold" style={{ color: COLORS.textPrimary }}>{result.studentIdNumber}</div>
        <div className="text-xs mb-1" style={{ color: COLORS.textSecondary }}>Temporary password</div>
        <div className="text-sm font-semibold" style={{ color: COLORS.textPrimary }}>{result.tempPassword}</div>
      </div>
      <Button size="sm" variant="ghost" full onClick={() => copy('student', studentCredentials)}>
        {copied === 'student' ? <Check size={13} /> : <Copy size={13} />} {copied === 'student' ? 'Copied' : 'Copy student credentials'}
      </Button>

      {result.parentTempPassword && (
        <>
          <div className="rounded p-4 mt-4 mb-3" style={{ backgroundColor: COLORS.surface, fontFamily: "'IBM Plex Mono', monospace" }}>
            <div className="text-xs mb-1" style={{ color: COLORS.textSecondary }}>New parent account — temporary password</div>
            <div className="text-sm font-semibold" style={{ color: COLORS.textPrimary }}>{result.parentTempPassword}</div>
          </div>
          <Button size="sm" variant="ghost" full onClick={() => copy('parent', parentCredentials)}>
            {copied === 'parent' ? <Check size={13} /> : <Copy size={13} />} {copied === 'parent' ? 'Copied' : 'Copy parent credentials'}
          </Button>
        </>
      )}

      {linkingCode && (
        <>
          <div className="rounded p-4 mt-4" style={{ backgroundColor: COLORS.surface }}>
            <div className="text-xs mb-2" style={{ color: COLORS.textSecondary }}>Parent linking code — also emailed to the parent</div>
            <div
              className="text-2xl font-semibold text-center py-3 rounded"
              style={{ backgroundColor: '#fff', color: COLORS.navyAccent, fontFamily: "'IBM Plex Mono', monospace", letterSpacing: '0.1em', border: `1px solid ${COLORS.border}` }}
            >
              {linkingCode}
            </div>
          </div>
        </>
      )}
    </Modal>
  )
}