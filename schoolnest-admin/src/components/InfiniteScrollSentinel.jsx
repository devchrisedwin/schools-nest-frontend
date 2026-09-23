import React from 'react'
import { Loader2 } from 'lucide-react'
import { COLORS } from '../theme'

export default function InfiniteScrollSentinel({ sentinelRef, hasMore }) {
  if (!hasMore) return null
  return (
    <div ref={sentinelRef} className="flex items-center justify-center gap-2 py-4" style={{ color: COLORS.textSecondary }}>
      <Loader2 size={14} className="animate-spin" />
      <span className="text-xs">Loading more…</span>
    </div>
  )
}