// ============================================================
// [SCHOOL ADMIN PORTAL] — Messaging
// Broadcasts to parents (whole school or one class), delivery
// tracking, and the admin's own inbox (parent-initiated messages
// land here, since parents can message the admin directly).
// Scope note: broadcast composer supports "all parents" and "one
// class" — targeting a single individual recipient isn't exposed
// here, since that needs a generic cross-role user picker; a
// deliberate scope cut, not an oversight.
// ============================================================
import React, { useState, useEffect } from 'react'
import { Send, Inbox, Plus, Trash2, Eye, Mail, MailOpen } from 'lucide-react'
import { COLORS, formatDate } from '../../theme'
import { apiFetch } from '../../api'
import { Button, Badge, Spinner, ErrorBanner, Field, Input, Select, EmptyState } from '../../components/ui'
import Modal from '../../components/Modal'
import ConfirmModal from '../../components/ConfirmModal'
import InfiniteScrollSentinel from '../../components/InfiniteScrollSentinel'
import { useInfiniteScroll } from '../../hooks/useInfiniteScroll'

const TABS = [{ key: 'broadcasts', label: 'Broadcasts' }, { key: 'inbox', label: 'Inbox' }]

export default function MessagingHome({ baseUrl, token, subdomain }) {
  const [tab, setTab] = useState('broadcasts')
  return (
    <div>
      <div className="flex gap-1 mb-6 border-b" style={{ borderColor: COLORS.border }}>
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)} className="px-4 py-2.5 text-sm font-medium -mb-px"
            style={{ borderBottom: tab === t.key ? `2px solid ${COLORS.navyAccent}` : '2px solid transparent', color: tab === t.key ? COLORS.navyAccent : COLORS.textSecondary }}>
            {t.label}
          </button>
        ))}
      </div>
      {tab === 'broadcasts' && <Broadcasts baseUrl={baseUrl} token={token} subdomain={subdomain} />}
      {tab === 'inbox' && <InboxView baseUrl={baseUrl} token={token} subdomain={subdomain} />}
    </div>
  )
}

function Broadcasts({ baseUrl, token, subdomain }) {
  const opts = { token, subdomain }
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showCompose, setShowCompose] = useState(false)
  const [viewLog, setViewLog] = useState(null)
  const [confirmCancel, setConfirmCancel] = useState(null)

  async function load() {
    setLoading(true); setError('')
    try { setMessages(await apiFetch(baseUrl, '/messages/sent', opts)) }
    catch (err) { setError(err.message) } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [baseUrl, token, subdomain])

  async function confirmCancelNow() {
    const id = confirmCancel
    setConfirmCancel(null)
    try { await apiFetch(baseUrl, `/messages/${id}`, { ...opts, method: 'DELETE' }); await load() }
    catch (err) { setError(err.message) }
  }

  const { visibleItems: visibleMessages, hasMore, sentinelRef } = useInfiniteScroll(messages, 12)
  if (loading) return <Spinner label="Loading messages…" />
 
  return (
    <div>
      <ErrorBanner message={error} />
      <div className="flex justify-end mb-4">
        <Button onClick={() => setShowCompose(true)}><Plus size={15} /> New Broadcast</Button>
      </div>

      {messages.length === 0 && <EmptyState icon={Send} title="No broadcasts sent yet" sub="Send an announcement to all parents or one class." />}

      <div className="space-y-2.5">
        {visibleMessages.map((m) => (
          <div key={m.id} className="bg-white rounded p-4" style={{ border: `1px solid ${COLORS.border}` }}>
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium" style={{ color: COLORS.textPrimary }}>{m.title}</span>
                  <Badge tone="neutral">{m.recipientType === 'all_parents' ? 'All parents' : m.recipientType === 'class' ? 'One class' : 'Individual'}</Badge>
                  {!m.sentAt && <Badge tone="amber">Scheduled</Badge>}
                </div>
                <p className="text-xs mb-2" style={{ color: COLORS.textSecondary }}>{m.body}</p>
                <span className="text-xs" style={{ color: COLORS.textSecondary }}>{m.sentAt ? `Sent ${formatDate(m.sentAt)}` : `Scheduled for ${formatDate(m.scheduledAt)}`}</span>
              </div>
              <div className="flex items-center gap-1">
                {m.sentAt && <button onClick={() => setViewLog(m.id)} className="p-1.5 rounded hover:bg-gray-100"><Eye size={14} style={{ color: COLORS.textSecondary }} /></button>}
                {!m.sentAt && <button onClick={() => setConfirmCancel(m.id)} className="p-1.5 rounded hover:bg-gray-100"><Trash2 size={14} style={{ color: COLORS.red }} /></button>}
              </div>
            </div>
          </div>
        ))}
      </div>
      <InfiniteScrollSentinel sentinelRef={sentinelRef} hasMore={hasMore} />
      {showCompose && <ComposeModal baseUrl={baseUrl} opts={opts} onClose={() => setShowCompose(false)} onSaved={load} />}
      {viewLog && <DeliveryLogModal baseUrl={baseUrl} opts={opts} messageId={viewLog} onClose={() => setViewLog(null)} />}
      {confirmCancel && (
        <ConfirmModal title="Cancel scheduled message" message="This message will not be sent." confirmLabel="Cancel message" tone="red"
          onCancel={() => setConfirmCancel(null)} onConfirm={confirmCancelNow} />
      )}
    </div>
  )
}

function ComposeModal({ baseUrl, opts, onClose, onSaved }) {
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [recipientType, setRecipientType] = useState('all_parents')
  const [classId, setClassId] = useState('')
  const [classes, setClasses] = useState([])
  const [scheduledAt, setScheduledAt] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (recipientType === 'class') {
      apiFetch(baseUrl, '/classes', opts).then(setClasses).catch((e) => setError(e.message))
    }
  }, [recipientType])

  async function submit(e) {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      await apiFetch(baseUrl, '/messages', {
        ...opts, method: 'POST',
        body: { title, body, recipientType, ...(recipientType === 'class' ? { classId } : {}), ...(scheduledAt ? { scheduledAt } : {}) },
      })
      onSaved(); onClose()
    } catch (err) { setError(err.message) } finally { setLoading(false) }
  }

  return (
    <Modal title="New broadcast" onClose={onClose}>
      <ErrorBanner message={error} />
      <form onSubmit={submit}>
        <Field label="Title"><Input value={title} onChange={(e) => setTitle(e.target.value)} required /></Field>
        <Field label="Message">
          <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={4} required
            className="w-full px-3 py-2.5 rounded text-sm" style={{ border: `1px solid ${COLORS.border}` }} />
        </Field>
        <Field label="Send to">
          <Select value={recipientType} onChange={(e) => setRecipientType(e.target.value)}>
            <option value="all_parents">All parents</option>
            <option value="all_teachers">All teachers</option>
            <option value="all_students">All students</option>
            <option value="class">One class</option>
          </Select>
        </Field>
        {recipientType === 'class' && (
          <Field label="Class">
            <Select value={classId} onChange={(e) => setClassId(e.target.value)} required>
              <option value="">Select a class…</option>
              {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
          </Field>
        )}
        <Field label="Schedule for later (optional)">
          <Input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} />
        </Field>
        <Button type="submit" full loading={loading}><Send size={14} /> {scheduledAt ? 'Schedule broadcast' : 'Send now'}</Button>
      </form>
    </Modal>
  )
}

function DeliveryLogModal({ baseUrl, opts, messageId, onClose }) {
  const [log, setLog] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    apiFetch(baseUrl, `/messages/${messageId}/delivery-log`, opts).then(setLog).catch((e) => setError(e.message)).finally(() => setLoading(false))
  }, [])

  return (
    <Modal title="Delivery log" onClose={onClose}>
      <ErrorBanner message={error} />
      {loading ? <Spinner /> : (
        <div className="space-y-1.5">
          {log.length === 0 && <p className="text-sm" style={{ color: COLORS.textSecondary }}>No delivery records found.</p>}
          {log.map((entry, i) => (
            <div key={i} className="flex items-center justify-between py-2 text-sm" style={{ borderBottom: `1px solid ${COLORS.border}` }}>
              <span className="capitalize" style={{ color: COLORS.textPrimary }}>{entry.channel}</span>
              <div className="flex items-center gap-2">
                <Badge tone={entry.status === 'sent' ? 'green' : 'red'}>{entry.status}</Badge>
                {entry.readAt && <Badge tone="neutral">Read</Badge>}
              </div>
            </div>
          ))}
        </div>
      )}
    </Modal>
  )
}

function InboxView({ baseUrl, token, subdomain }) {
  const opts = { token, subdomain }
  const [inbox, setInbox] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [openThread, setOpenThread] = useState(null)

  // ── Move hook up here BEFORE any early returns ──
  const received = inbox?.received || []
  const { visibleItems: visibleInbox, hasMore, sentinelRef } = useInfiniteScroll(received, 12)

  async function load() {
    setLoading(true); setError('')
    try { setInbox(await apiFetch(baseUrl, '/messages/inbox', opts)) }
    catch (err) { setError(err.message) } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [baseUrl, token, subdomain])

  async function openMessage(m) {
    setOpenThread(m)
    if (!m.readAt) {
      try { await apiFetch(baseUrl, `/messages/${m.id}/read`, { ...opts, method: 'PATCH' }); load() } catch {}
    }
  }

  // Early returns AFTER all hooks
  if (loading) return <Spinner label="Loading inbox…" />
  if (openThread) return <ThreadView baseUrl={baseUrl} opts={opts} message={openThread} onBack={() => { setOpenThread(null); load() }} />

  return (
    <div>
      <ErrorBanner message={error} />
      {received.length === 0 && <EmptyState icon={Inbox} title="Nothing in your inbox" sub="Messages from parents will appear here." />}
      <div className="bg-white rounded overflow-hidden" style={{ border: `1px solid ${COLORS.border}` }}>
        {visibleInbox.map((m, i) => (
          <button key={m.id} onClick={() => openMessage(m)} className="w-full text-left px-4 py-3.5 flex items-start gap-3 hover:bg-gray-50"
            style={{ borderBottom: i < visibleInbox.length - 1 ? `1px solid ${COLORS.border}` : 'none' }}>
            {m.readAt ? <MailOpen size={15} style={{ color: COLORS.textSecondary, marginTop: 2 }} /> : <Mail size={15} style={{ color: COLORS.navyAccent, marginTop: 2 }} />}
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="text-sm" style={{ color: COLORS.textPrimary, fontWeight: m.readAt ? 400 : 600 }}>{m.sender?.fullName || 'Unknown'}</span>
                <span className="text-xs" style={{ color: COLORS.textSecondary }}>{formatDate(m.createdAt)}</span>
              </div>
              <div className="text-xs truncate" style={{ color: COLORS.textSecondary }}>{m.body}</div>
            </div>
          </button>
        ))}
        <InfiniteScrollSentinel sentinelRef={sentinelRef} hasMore={hasMore} />
      </div>
    </div>
  )
}

function ThreadView({ baseUrl, opts, message, onBack }) {
  const [replyBody, setReplyBody] = useState('')
  const [replies, setReplies] = useState(message.replies || [])
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')

  async function sendReply(e) {
    e.preventDefault()
    setSending(true); setError('')
    try {
      const reply = await apiFetch(baseUrl, `/messages/${message.id}/reply`, { ...opts, method: 'POST', body: { body: replyBody } })
      setReplies([...replies, reply]); setReplyBody('')
    } catch (err) { setError(err.message) } finally { setSending(false) }
  }

  return (
    <div>
      <button onClick={onBack} className="text-sm font-medium mb-4" style={{ color: COLORS.navyAccent }}>← Back to inbox</button>
      <ErrorBanner message={error} />
      <div className="bg-white rounded p-4 mb-3" style={{ border: `1px solid ${COLORS.border}` }}>
        <div className="text-sm font-medium mb-1" style={{ color: COLORS.textPrimary }}>{message.sender?.fullName || 'Unknown'}</div>
        <div className="text-sm" style={{ color: COLORS.textSecondary }}>{message.body}</div>
      </div>
      {replies.map((r, i) => (
        <div key={i} className="bg-white rounded p-4 mb-3 ml-6" style={{ border: `1px solid ${COLORS.border}` }}>
          <div className="text-sm" style={{ color: COLORS.textSecondary }}>{r.body}</div>
        </div>
      ))}
      <form onSubmit={sendReply} className="flex gap-2 mt-4">
        <Input value={replyBody} onChange={(e) => setReplyBody(e.target.value)} placeholder="Type a reply…" required />
        <Button type="submit" loading={sending}>Reply</Button>
      </form>
    </div>
  )
}