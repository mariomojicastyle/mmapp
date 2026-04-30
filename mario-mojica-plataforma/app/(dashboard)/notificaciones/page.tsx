"use client"

import React, { useState, useEffect } from "react"
import { Bell, Clock, CheckCircle2, MessageSquare, ChevronRight, AlertCircle } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { useNotifications } from "@/hooks/use-notifications"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"

export default function NotificacionesPage() {
  const { notifications, markAsRead } = useNotifications()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <div className="flex flex-col gap-6 p-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-on-surface">Notificaciones</h1>
        <p className="text-sm text-on-surface-variant">Mantente al tanto de la actividad en tus solicitudes.</p>
      </div>

      <div className="flex flex-col gap-3">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center rounded-3xl border border-outline-variant bg-surface-container-low/30">
            <Bell className="h-12 w-12 text-on-surface-variant/20 mb-4" />
            <p className="text-on-surface-variant font-medium">No tienes notificaciones pendientes.</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {notifications.map((n) => (
              <motion.div
                key={n.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => {
                  if (!n.leido_at) markAsRead(n.id)
                  const formattedId = String(n.solicitud_id).padStart(5, "0")
                  router.push(`/solicitudes?s=${formattedId}`)
                }}
                className={cn(
                  "group relative flex items-start gap-4 rounded-2xl border p-4 transition-all cursor-pointer",
                  n.leido_at 
                    ? "bg-surface-container-low border-outline-variant/30 hover:bg-surface-container hover:border-outline-variant" 
                    : "bg-surface-container-high border-primary/30 shadow-lg shadow-primary/5 hover:border-primary"
                )}
              >
                <div className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
                  n.leido_at ? "bg-surface-container-highest text-on-surface-variant" : "bg-primary/10 text-primary"
                )}>
                  {n.tipo === "comentario" ? <MessageSquare className="h-5 w-5" /> : <Bell className="h-5 w-5" />}
                </div>

                <div className="flex flex-1 flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                      Solicitud #{String(n.solicitud_id).padStart(5, "0")}
                    </span>
                    <div className="flex items-center gap-2 text-[10px] text-on-surface-variant">
                      <Clock className="h-3 w-3" />
                      {new Date(n.created_at).toLocaleString()}
                    </div>
                  </div>
                  <p className={cn(
                    "text-sm leading-relaxed",
                    n.leido_at ? "text-on-surface-variant" : "text-on-surface font-medium"
                  )}>
                    {n.mensaje}
                  </p>
                </div>

                <ChevronRight className="h-5 w-5 text-on-surface-variant group-hover:translate-x-1 transition-transform" />
                
                {!n.leido_at && (
                  <div className="absolute right-2 top-2 h-2 w-2 rounded-full bg-primary" />
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
