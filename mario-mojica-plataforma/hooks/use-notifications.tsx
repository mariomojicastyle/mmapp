"use client"

import React, { createContext, useContext, useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/lib/auth/auth-context"

export interface Notification {
  id: string
  tipo: string
  solicitud_id: number
  mensaje: string
  leido_at: string | null
  created_at: string
}

interface NotificationContextType {
  notifications: Notification[]
  unreadCount: number
  markAsRead: (id: string) => Promise<void>
}

const NotificationContext = createContext<NotificationContextType>({
  notifications: [],
  unreadCount: 0,
  markAsRead: async () => {},
})

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    if (!user?.id) return

    const supabase = createClient()
    let channel: ReturnType<typeof supabase.channel> | null = null

    async function setupNotifications() {
      // 1. Fetch inicial
      const { data } = await supabase
        .from("notificaciones")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(20)

      if (data) {
        setNotifications(data)
        setUnreadCount(data.filter(n => !n.leido_at).length)
      }

      // 2. Suscripción Realtime
      channel = supabase
        .channel(`notifications:${user!.id}:${Math.random().toString(36).substring(7)}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "notificaciones",
            filter: `user_id=eq.${user!.id}`
          },
          (payload) => {
            if (payload.eventType === "INSERT") {
              const nueva = payload.new as Notification
              setNotifications(prev => {
                const next = [nueva, ...prev]
                setUnreadCount(next.filter(n => !n.leido_at).length)
                return next
              })
              
              if (typeof window !== 'undefined' && 'Notification' in window && window.Notification.permission === "granted") {
                new window.Notification("Mario Mojica Platform", {
                  body: nueva.mensaje,
                  icon: "/favicon.ico"
                })
              }
            } else if (payload.eventType === "UPDATE") {
              const actualizada = payload.new as Notification
              setNotifications(prev => {
                const next = prev.map(n => n.id === actualizada.id ? actualizada : n)
                setUnreadCount(next.filter(n => !n.leido_at).length)
                return next
              })
            }
          }
        )
        .subscribe()
    }

    setupNotifications()

    return () => {
      if (channel) {
        supabase.removeChannel(channel)
      }
    }
  }, [user])

  const markAsRead = async (id: string) => {
    // Optimistic UI update
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, leido_at: new Date().toISOString() } : n)
    )
    setUnreadCount(prev => Math.max(0, prev - 1))

    try {
      const { markNotificationAsRead } = await import("@/app/actions/solicitudes")
      const res = await markNotificationAsRead(id)
      if (res?.error) {
        console.error("Error al marcar como leída:", res.error)
        setNotifications(prev => 
          prev.map(n => n.id === id ? { ...n, leido_at: null } : n)
        )
        setUnreadCount(prev => prev + 1)
      }
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, markAsRead }}>
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  return useContext(NotificationContext)
}
