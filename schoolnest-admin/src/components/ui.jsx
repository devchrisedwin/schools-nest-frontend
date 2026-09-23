import React, { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { COLORS } from '../theme'

export function Button({ variant = 'navy', children, onClick, disabled, type = 'button', full = false, size = 'md', loading = false }) {
  const [hover, setHover] = useState(false)
  const styles = {
    navy: { bg: COLORS.navyAccent, hoverBg: COLORS.navyAccentHover, text: '#fff' },
    red: { bg: COLORS.red, hoverBg: COLORS.redHover, text: '#fff' },
    green: { bg: COLORS.green, hoverBg: COLORS.greenHover, text: '#fff' },
    ghost: { bg: 'transparent', hoverBg: '#F0F2F5', text: COLORS.textPrimary },
  }
  const s = styles[variant] || styles.navy
  const sizeCls = size === 'sm' ? 'px-3 py-1.5 text-xs' : 'px-4 py-2.5 text-sm'

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className={`${sizeCls} rounded font-medium transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2 ${full ? 'w-full' : ''}`}
      style={{
        backgroundColor: hover && !disabled ? s.hoverBg : s.bg,
        color: s.text,
        border: variant === 'ghost' ? `1px solid ${COLORS.border}` : 'none',
      }}
    >
      {loading && <Loader2 size={14} className="animate-spin" />}
      {children}
    </button>
  )
}

export function Badge({ tone = 'neutral', children }) {
  const map = {
    green: { bg: '#E8F5EE', text: COLORS.green, border: '#BFE3D0' },
    red: { bg: '#FBEAEA', text: COLORS.red, border: '#F0C7C5' },
    amber: { bg: '#FBF1E1', text: COLORS.amber, border: '#F0DBB0' },
    neutral: { bg: '#EEF0F3', text: COLORS.textSecondary, border: COLORS.border },
  }
  const c = map[tone] || map.neutral
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium"
      style={{ backgroundColor: c.bg, color: c.text, border: `1px solid ${c.border}` }}>
      {children}
    </span>
  )
}

// Left-edge color bar carries the meaning (status), not a shadow or a badge —
// visual structure as information, per the design brief.
export function StatCard({ label, value, accent = 'navy', sub, icon: Icon }) {
  const accentColor = { navy: COLORS.navyAccent, green: COLORS.green, red: COLORS.red, amber: COLORS.amber }[accent]
  return (
    <div className="bg-white rounded flex overflow-hidden" style={{ border: `1px solid ${COLORS.border}` }}>
      <div style={{ width: 4, backgroundColor: accentColor }} />
      <div className="p-4 flex-1">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-medium uppercase tracking-wide" style={{ color: COLORS.textSecondary }}>{label}</span>
          {Icon && <Icon size={16} style={{ color: COLORS.textSecondary }} />}
        </div>
        <div className="text-2xl font-semibold" style={{ color: COLORS.textPrimary, fontFamily: "'IBM Plex Mono', monospace" }}>
          {value}
        </div>
        {sub && <div className="text-xs mt-1" style={{ color: COLORS.textSecondary }}>{sub}</div>}
      </div>
    </div>
  )
}

export function Spinner({ label = 'Loading…' }) {
  return (
    <div className="flex items-center gap-2 py-8 justify-center" style={{ color: COLORS.textSecondary }}>
      <Loader2 size={18} className="animate-spin" />
      <span className="text-sm">{label}</span>
    </div>
  )
}

export function ErrorBanner({ message }) {
  if (!message) return null
  return (
    <div className="rounded px-4 py-3 text-sm mb-4" style={{ backgroundColor: '#FBEAEA', color: COLORS.red, border: '1px solid #F0C7C5' }}>
      {message}
    </div>
  )
}

// --- ADD to the existing src/components/ui.jsx, alongside Button/Badge/etc ---

export function Field({ label, children }) {
  return (
    <div className="mb-3">
      <label className="text-xs font-medium block mb-1.5" style={{ color: COLORS.textSecondary }}>{label}</label>
      {children}
    </div>
  )
}

export function Input(props) {
  return (
    <input {...props}
      className={`w-full px-3 py-2.5 rounded text-sm ${props.className || ''}`}
      style={{ border: `1px solid ${COLORS.border}`, ...props.style }}
    />
  )
}

export function Select({ children, ...props }) {
  return (
    <select {...props}
      className="w-full px-3 py-2.5 rounded text-sm bg-white"
      style={{ border: `1px solid ${COLORS.border}` }}
    >
      {children}
    </select>
  )
}

export function EmptyState({ icon: Icon, title, sub }) {
  return (
    <div className="flex flex-col items-center justify-center py-14 text-center">
      {Icon && <Icon size={28} style={{ color: COLORS.border }} className="mb-3" />}
      <div className="text-sm font-medium mb-1" style={{ color: COLORS.textPrimary }}>{title}</div>
      {sub && <div className="text-xs" style={{ color: COLORS.textSecondary }}>{sub}</div>}
    </div>
  )
}