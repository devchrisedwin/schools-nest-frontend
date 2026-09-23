import React from 'react'
import { Hammer } from 'lucide-react'
import { COLORS } from '../theme'

export default function SectionPlaceholder({ title }) {
  return (
    <div className="bg-white rounded flex flex-col items-center justify-center py-20 text-center" style={{ border: `1px solid ${COLORS.border}` }}>
      <div className="w-11 h-11 rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: COLORS.surface }}>
        <Hammer size={18} style={{ color: COLORS.navyAccent }} />
      </div>
      <h3 className="text-sm font-semibold mb-1" style={{ color: COLORS.textPrimary }}>{title} is queued next</h3>
      <p className="text-sm max-w-xs" style={{ color: COLORS.textSecondary }}>
        We're building this admin panel section by section — this one's coming in the next build pass.
      </p>
    </div>
  )
}