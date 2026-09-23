// ============================================================
// [SCHOOL ADMIN PORTAL] — Events
// Create, edit, delete the school calendar. Mobile app only reads
// this list (GET /events) — creation is admin-only.
// ============================================================
import React, { useState, useEffect } from 'react'
import { Plus, CalendarDays, Trash2, Edit2 } from 'lucide-react'
import { COLORS, formatDate } from '../../theme'
import { apiFetch } from '../../api'
import { Button, Badge, Spinner, ErrorBanner, Field, Input, Select, EmptyState } from '../../components/ui'
import Modal from '../../components/Modal'
import ConfirmModal from '../../components/ConfirmModal'

export default function EventsManagement({ baseUrl, token, subdomain }) {
  const opts = { token, subdomain }
  const [events, setEvents] = useState([])
  const [classes, setClasses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)

  async function load() {
    setLoading(true); setError('')
    try {
      const [eventsData, classesData] = await Promise.all([
        apiFetch(baseUrl, '/events', opts),
        apiFetch(baseUrl, '/classes', opts),
      ])
      setEvents(eventsData.sort((a, b) => new Date(a.eventDate) - new Date(b.eventDate)))
      setClasses(classesData)
    } catch (err) { setError(err.message) } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [baseUrl, token, subdomain])

  async function confirmDeleteNow() {
    const id = confirmDelete
    setConfirmDelete(null)
    try { await apiFetch(baseUrl, `/events/${id}`, { ...opts, method: 'DELETE' }); await load() }
    catch (err) { setError(err.message) }
  }

  const now = new Date()
  const upcoming = events.filter((e) => new Date(e.eventDate) >= now)
  const past = events.filter((e) => new Date(e.eventDate) < now)

  if (loading) return <Spinner label="Loading events…" />

  return (
    <div>
      <ErrorBanner message={error} />
      <div className="flex justify-end mb-4">
        <Button onClick={() => { setEditing(null); setShowModal(true) }}><Plus size={15} /> New Event</Button>
      </div>

      {events.length === 0 && <EmptyState icon={CalendarDays} title="No events yet" sub="Add a mock exam date, a holiday, or a school-wide announcement." />}

      {upcoming.length > 0 && (
        <>
          <h3 className="text-xs font-medium uppercase tracking-wide mb-2" style={{ color: COLORS.textSecondary }}>Upcoming</h3>
          <div className="space-y-2.5 mb-6">
            {upcoming.map((e) => (
              <EventRow key={e.id} event={e} onEdit={() => { setEditing(e); setShowModal(true) }} onDelete={() => setConfirmDelete(e.id)} />
            ))}
          </div>
        </>
      )}

      {past.length > 0 && (
        <>
          <h3 className="text-xs font-medium uppercase tracking-wide mb-2" style={{ color: COLORS.textSecondary }}>Past</h3>
          <div className="space-y-2.5 opacity-60">
            {past.map((e) => (
              <EventRow key={e.id} event={e} onEdit={() => { setEditing(e); setShowModal(true) }} onDelete={() => setConfirmDelete(e.id)} />
            ))}
          </div>
        </>
      )}

      {showModal && (
        <EventModal baseUrl={baseUrl} opts={opts} classes={classes} editing={editing}
          onClose={() => setShowModal(false)} onSaved={load} />
      )}
      {confirmDelete && (
        <ConfirmModal title="Delete event" message="This event will be removed from the school calendar." confirmLabel="Delete" tone="red"
          onCancel={() => setConfirmDelete(null)} onConfirm={confirmDeleteNow} />
      )}
    </div>
  )
}

function EventRow({ event, onEdit, onDelete }) {
  return (
    <div className="bg-white rounded p-4 flex items-center justify-between" style={{ border: `1px solid ${COLORS.border}` }}>
      <div className="flex items-start gap-3">
        <div className="w-1 self-stretch rounded" style={{ backgroundColor: COLORS.navyAccent }} />
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-sm font-medium" style={{ color: COLORS.textPrimary }}>{event.title}</span>
            <Badge tone="neutral">{event.audience === 'school_wide' ? 'School-wide' : event.class?.name || 'Class'}</Badge>
          </div>
          <div className="text-xs" style={{ color: COLORS.textSecondary }}>{formatDate(event.eventDate)}</div>
          {event.description && <div className="text-xs mt-1" style={{ color: COLORS.textSecondary }}>{event.description}</div>}
        </div>
      </div>
      <div className="flex items-center gap-1">
        <button onClick={onEdit} className="p-1.5 rounded hover:bg-gray-100"><Edit2 size={14} style={{ color: COLORS.textSecondary }} /></button>
        <button onClick={onDelete} className="p-1.5 rounded hover:bg-gray-100"><Trash2 size={14} style={{ color: COLORS.red }} /></button>
      </div>
    </div>
  )
}

function EventModal({ baseUrl, opts, classes, editing, onClose, onSaved }) {
  const [title, setTitle] = useState(editing?.title || '')
  const [description, setDescription] = useState(editing?.description || '')
  const [eventDate, setEventDate] = useState(editing?.eventDate ? editing.eventDate.split('T')[0] : '')
  const [audience, setAudience] = useState(editing?.audience || 'school_wide')
  const [classId, setClassId] = useState(editing?.classId || '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function submit(e) {
    e.preventDefault()
    setLoading(true); setError('')
    const body = { title, description, eventDate, audience, ...(audience === 'class_specific' ? { classId } : {}) }
    try {
      if (editing) await apiFetch(baseUrl, `/events/${editing.id}`, { ...opts, method: 'PATCH', body })
      else await apiFetch(baseUrl, '/events', { ...opts, method: 'POST', body })
      onSaved(); onClose()
    } catch (err) { setError(err.message) } finally { setLoading(false) }
  }

  return (
    <Modal title={editing ? 'Edit event' : 'New event'} onClose={onClose}>
      <ErrorBanner message={error} />
      <form onSubmit={submit}>
        <Field label="Title"><Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Mock Exam" required /></Field>
        <Field label="Description (optional)"><Input value={description} onChange={(e) => setDescription(e.target.value)} /></Field>
        <Field label="Date"><Input type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} required /></Field>
        <Field label="Audience">
          <Select value={audience} onChange={(e) => setAudience(e.target.value)}>
            <option value="school_wide">Whole school</option>
            <option value="class_specific">One class only</option>
          </Select>
        </Field>
        {audience === 'class_specific' && (
          <Field label="Class">
            <Select value={classId} onChange={(e) => setClassId(e.target.value)} required>
              <option value="">Select a class…</option>
              {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
          </Field>
        )}
        <Button type="submit" full loading={loading}>{editing ? 'Save changes' : 'Create event'}</Button>
      </form>
    </Modal>
  )
}