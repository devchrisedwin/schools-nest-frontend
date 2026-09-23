import { useState, useEffect, useRef, useCallback } from 'react'

export function useInfiniteScroll(items, pageSize = 20) {
  const [visibleCount, setVisibleCount] = useState(pageSize)
  const sentinelRef = useRef(null)

  useEffect(() => { setVisibleCount(pageSize) }, [items, pageSize])

  const loadMore = useCallback(() => {
    setVisibleCount((c) => Math.min(c + pageSize, items.length))
  }, [items.length, pageSize])

  useEffect(() => {
    const node = sentinelRef.current
    if (!node) return
    const observer = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting) loadMore() },
      { rootMargin: '200px' }
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [loadMore])

  return { visibleItems: items.slice(0, visibleCount), hasMore: visibleCount < items.length, sentinelRef }
}