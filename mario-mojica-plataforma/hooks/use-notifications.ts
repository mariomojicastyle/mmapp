"use client"

import { useState, useEffect } from "react"
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

export function useNotifications() {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    if (!user?.id) return

    const supabase = createClient()
    let channel: any

    async function setupNotifications() {
      // 1. Fetch inicial
      const { data, error } = await supabase
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
  }, [user?.id]) // Solo re-suscribir si el ID cambia

  const markAsRead = async (id: string) => {
    const supabase = createClient()
    const { error } = await supabase
      .from("notificaciones")
      .update({ leido_at: new Date().toISOString() })
      .eq("id", id)

    if (!error) {
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, leido_at: new Date().toISOString() } : n)
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    }
  }

  return { notifications, unreadCount, markAsRead }
}



