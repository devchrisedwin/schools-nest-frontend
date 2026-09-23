import { useEffect, useRef, useState } from 'react'
import { io } from 'socket.io-client'

// Connects to the bare host (not /api/v1) and listens for the
// "notification" event the backend already emits. Auth happens once,
// at connection time, via the same Bearer token used for REST calls.
export function useRealtimeNotifications(baseUrl, token) {
  const [latestNotification, setLatestNotification] = useState(null)
  const [unreadBump, setUnreadBump] = useState(0)
  const socketRef = useRef(null)

  useEffect(() => {
    if (!token) return

    // baseUrl is like ".../api/v1" — the socket connects to the host itself
    const socketHost = baseUrl.replace(/\/api\/v1\/?$/, '')
    const socket = io(socketHost, { auth: { token } })
    socketRef.current = socket

    socket.on('notification', (data) => {
      setLatestNotification(data)
      setUnreadBump((n) => n + 1)
    })

    return () => socket.disconnect()
  }, [baseUrl, token])

  return { latestNotification, unreadBump }
}