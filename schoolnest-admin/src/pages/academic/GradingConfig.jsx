// ============================================================
// [SCHOOL ADMIN PORTAL] — CA Config & Grading Scale
// Sets the continuous-assessment structure and grade bands used
// across every score sheet and result in this school.
// ============================================================
import React, { useState, useEffect } from 'react'
import { Plus, Trash2, Save } from 'lucide-react'
import { COLORS } from '../../theme'
import { apiFetch } from '../../api'
import { Button, Spinner, ErrorBanner, Field, Input } from '../../components/ui'

export default function GradingConfig({ baseUrl, token, subdomain }) {
  const opts = { token, subdomain }
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState('')

  const [components, setComponents] = useState([{ name: 'Test 1', max_marks: 10 }])
  const [examMax, setExamMax] = useState(70)
  const [bands, setBands] = useState([{ gradeLetter: 'A', minScore: 70, maxScore: 100, remark: 'Excellent' }])

  useEffect(() => {
    async function load() {
      setLoading(true); setError('')
      try {
        const [ca, grading] = await Promise.allSettled([
          apiFetch(baseUrl, '/ca-config', opts),
          apiFetch(baseUrl, '/grading-scale', opts),
        ])
        if (ca.status === 'fulfilled' && ca.value) {
          setComponents(ca.value.caComponents); setExamMax(ca.value.examMaxMarks)
        }
        if (grading.status === 'fulfilled' && grading.value?.length) setBands(grading.value)
      } catch (err) { setError(err.message) } finally { setLoading(false) }
    }
    load()
  }, [baseUrl, token, subdomain])

  async function saveCaConfig() {
    setError(''); setSaved('')
    try {
      await apiFetch(baseUrl, '/ca-config', { ...opts, method: 'PUT', body: { caComponents: components, examMaxMarks: Number(examMax) } })
      setSaved('ca')
    } catch (err) { setError(err.message) }
  }

  async function saveGradingScale() {
    setError(''); setSaved('')
    try {
      await apiFetch(baseUrl, '/grading-scale', { ...opts, method: 'PUT', body: { bands } })
      setSaved('grading')
    } catch (err) { setError(err.message) }
  }

  if (loading) return <Spinner label="Loading configuration…" />

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      <ErrorBanner message={error} />

      {/* CA Config */}
      <div className="bg-white rounded p-5" style={{ border: `1px solid ${COLORS.border}` }}>
        <h3 className="text-sm font-semibold mb-4" style={{ color: COLORS.textPrimary }}>Continuous assessment structure</h3>
        {components.map((c, i) => (
          <div key={i} className="flex gap-2 mb-2">
            <Input placeholder="Component name" value={c.name}
              onChange={(e) => setComponents(components.map((x, idx) => idx === i ? { ...x, name: e.target.value } : x))} />
            <Input type="number" placeholder="Max marks" style={{ maxWidth: 100 }} value={c.max_marks}
              onChange={(e) => setComponents(components.map((x, idx) => idx === i ? { ...x, max_marks: Number(e.target.value) } : x))} />
            <button onClick={() => setComponents(components.filter((_, idx) => idx !== i))} className="p-2">
              <Trash2 size={15} style={{ color: COLORS.red }} />
            </button>
          </div>
        ))}
        <button onClick={() => setComponents([...components, { name: '', max_marks: 10 }])}
          className="text-xs font-medium flex items-center gap-1 mb-4" style={{ color: COLORS.navyAccent }}>
          <Plus size={13} /> Add component
        </button>
        <Field label="Exam max marks">
          <Input type="number" value={examMax} onChange={(e) => setExamMax(e.target.value)} />
        </Field>
        <Button onClick={saveCaConfig}><Save size={14} /> Save CA config</Button>
        {saved === 'ca' && <span className="text-xs ml-3" style={{ color: COLORS.green }}>Saved</span>}
      </div>

      {/* Grading Scale */}
      <div className="bg-white rounded p-5" style={{ border: `1px solid ${COLORS.border}` }}>
        <h3 className="text-sm font-semibold mb-4" style={{ color: COLORS.textPrimary }}>Grading scale</h3>
        {bands.map((b, i) => (
          <div key={i} className="flex gap-2 mb-2">
            <Input placeholder="Grade" style={{ maxWidth: 70 }} value={b.gradeLetter}
              onChange={(e) => setBands(bands.map((x, idx) => idx === i ? { ...x, gradeLetter: e.target.value } : x))} />
            <Input type="number" placeholder="Min" style={{ maxWidth: 70 }} value={b.minScore}
              onChange={(e) => setBands(bands.map((x, idx) => idx === i ? { ...x, minScore: Number(e.target.value) } : x))} />
            <Input type="number" placeholder="Max" style={{ maxWidth: 70 }} value={b.maxScore}
              onChange={(e) => setBands(bands.map((x, idx) => idx === i ? { ...x, maxScore: Number(e.target.value) } : x))} />
            <Input placeholder="Remark" value={b.remark}
              onChange={(e) => setBands(bands.map((x, idx) => idx === i ? { ...x, remark: e.target.value } : x))} />
            <button onClick={() => setBands(bands.filter((_, idx) => idx !== i))} className="p-2">
              <Trash2 size={15} style={{ color: COLORS.red }} />
            </button>
          </div>
        ))}
        <button onClick={() => setBands([...bands, { gradeLetter: '', minScore: 0, maxScore: 0, remark: '' }])}
          className="text-xs font-medium flex items-center gap-1 mb-4" style={{ color: COLORS.navyAccent }}>
          <Plus size={13} /> Add band
        </button>
        <Button onClick={saveGradingScale}><Save size={14} /> Save grading scale</Button>
        {saved === 'grading' && <span className="text-xs ml-3" style={{ color: COLORS.green }}>Saved</span>}
      </div>
    </div>
  )
}