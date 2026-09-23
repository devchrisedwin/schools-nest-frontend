// ============================================================
// [SCHOOL ADMIN PORTAL] — Bulk Enroll via AI Document Scan
// Upload photos of a physical register; the backend (Gemini)
// extracts student rows; admin reviews/corrects before confirming.
// ============================================================
import React, { useState, useRef } from 'react'
import { ScanLine, Upload, Loader2, Check, AlertTriangle, Trash2 } from 'lucide-react'
import { COLORS } from '../../theme'
import { apiFetch } from '../../api'
import { Button, ErrorBanner, Input, Select } from '../../components/ui'
import Modal from '../../components/Modal'

const STEPS = { UPLOAD: 'upload', PROCESSING: 'processing', REVIEW: 'review', DONE: 'done' }

export default function BulkEnrollScan({ baseUrl, opts, classes, onClose, onDone }) {
  const [step, setStep] = useState(STEPS.UPLOAD)
  const [files, setFiles] = useState([])
  const [jobId, setJobId] = useState(null)
  const [rows, setRows] = useState([])
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)
  const fileInputRef = useRef(null)

  function handleFileSelect(e) { setFiles(Array.from(e.target.files || []).slice(0, 10)) }

  async function startScan() {
    if (files.length === 0) { setError('Select at least one image.'); return }
    setStep(STEPS.PROCESSING); setError('')
    try {
      const body = new FormData()
      files.forEach((f) => body.append('images', f))
      const { jobId } = await apiFetch(baseUrl, '/students/scan', { ...opts, method: 'POST', body, isFormData: true })
      setJobId(jobId); poll(jobId)
    } catch (err) { setError(err.message); setStep(STEPS.UPLOAD) }
  }

  function poll(jobId) {
    const interval = setInterval(async () => {
      try {
        const status = await apiFetch(baseUrl, `/students/scan/${jobId}`, opts)
        if (status.status === 'completed') {
          clearInterval(interval)
          setRows(status.extractedStudents.map((s) => ({ ...s, className: s.className || '', armName: s.armName || '' })))
          setStep(STEPS.REVIEW)
        } else if (status.status === 'failed') {
          clearInterval(interval); setError('Scan failed — try a clearer image.'); setStep(STEPS.UPLOAD)
        }
      } catch (err) { clearInterval(interval); setError(err.message); setStep(STEPS.UPLOAD) }
    }, 2500)
  }

  function updateRow(i, field, value) { setRows(rows.map((r, idx) => idx === i ? { ...r, [field]: value } : r)) }
  function removeRow(i) { setRows(rows.filter((_, idx) => idx !== i)) }

  async function confirmImport() {
    setError('')
    try {
      const students = rows.map((r) => ({ fullName: r.fullName, dateOfBirth: r.dateOfBirth, gender: r.gender, className: r.className, armName: r.armName }))
      const res = await apiFetch(baseUrl, `/students/scan/${jobId}/confirm`, { ...opts, method: 'POST', body: { jobId, students } })
      setResult(res); setStep(STEPS.DONE); onDone()
    } catch (err) { setError(err.message) }
  }

  return (
    <Modal title="Bulk enroll from a photo" onClose={onClose} width="max-w-2xl">
      <ErrorBanner message={error} />
      {step === STEPS.UPLOAD && (
        <div>
          <p className="text-sm mb-4" style={{ color: COLORS.textSecondary }}>
            Upload up to 10 photos of a physical admission register or class list. Review and correct before anything's saved.
          </p>
          <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleFileSelect} className="hidden" />
          <button onClick={() => fileInputRef.current?.click()} className="w-full py-10 rounded flex flex-col items-center gap-2 mb-4" style={{ border: `2px dashed ${COLORS.border}`, backgroundColor: COLORS.surface }}>
            <Upload size={22} style={{ color: COLORS.textSecondary }} />
            <span className="text-sm font-medium" style={{ color: COLORS.textPrimary }}>{files.length > 0 ? `${files.length} image(s) selected` : 'Click to select images'}</span>
          </button>
          <Button full onClick={startScan}><ScanLine size={15} /> Scan images</Button>
        </div>
      )}
      {step === STEPS.PROCESSING && (
        <div className="py-14 flex flex-col items-center gap-3">
          <Loader2 size={26} className="animate-spin" style={{ color: COLORS.navyAccent }} />
          <p className="text-sm" style={{ color: COLORS.textSecondary }}>Reading the register — this can take up to a minute…</p>
        </div>
      )}
      {step === STEPS.REVIEW && (
        <div>
          <p className="text-sm mb-4" style={{ color: COLORS.textSecondary }}>
            Found {rows.length} student(s). Rows flagged <span style={{ color: COLORS.amber }}>low confidence</span> are worth double-checking.
          </p>
          <div className="max-h-96 overflow-y-auto space-y-2 mb-4">
            {rows.map((r, i) => (
              <div key={i} className="rounded p-3" style={{ border: `1px solid ${r.confidence === 'low' ? '#F0DBB0' : COLORS.border}`, backgroundColor: r.confidence === 'low' ? '#FFFBF3' : '#fff' }}>
                <div className="flex items-center justify-between mb-2">
                  {r.confidence === 'low' && <span className="text-xs flex items-center gap-1" style={{ color: COLORS.amber }}><AlertTriangle size={11} /> Please verify</span>}
                  <button onClick={() => removeRow(i)} className="ml-auto"><Trash2 size={13} style={{ color: COLORS.red }} /></button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Input placeholder="Full name" value={r.fullName || ''} onChange={(e) => updateRow(i, 'fullName', e.target.value)} />
                  <Input type="date" value={r.dateOfBirth || ''} onChange={(e) => updateRow(i, 'dateOfBirth', e.target.value)} />
                  <Select value={r.gender || ''} onChange={(e) => updateRow(i, 'gender', e.target.value)}>
                    <option value="">Gender…</option><option value="male">Male</option><option value="female">Female</option>
                  </Select>
                  <div className="grid grid-cols-2 gap-2">
                    <Select value={r.className || ''} onChange={(e) => updateRow(i, 'className', e.target.value)}>
                      <option value="">Class…</option>
                      {classes.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
                    </Select>
                    <Select value={r.armName || ''} onChange={(e) => updateRow(i, 'armName', e.target.value)}>
                      <option value="">Arm…</option>
                      {(classes.find((c) => c.name === r.className)?.arms || []).map((a) => <option key={a.id} value={a.name}>{a.name}</option>)}
                    </Select>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <Button full variant="green" onClick={confirmImport} disabled={rows.length === 0}><Check size={15} /> Enroll {rows.length} student(s)</Button>
        </div>
      )}
      {step === STEPS.DONE && result && (
        <div className="py-6 text-center">
          <Check size={28} style={{ color: COLORS.green }} className="mx-auto mb-3" />
          <p className="text-sm mb-1" style={{ color: COLORS.textPrimary }}>Enrolled {result.totalEnrolled} student(s).</p>
          {result.totalErrors > 0 && <p className="text-xs" style={{ color: COLORS.red }}>{result.totalErrors} row(s) failed — check class/arm names match exactly.</p>}
          <Button full onClick={onClose} className="mt-4">Done</Button>
        </div>
      )}
    </Modal>
  )
}