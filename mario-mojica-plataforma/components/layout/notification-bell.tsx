"use client"

import React, { useState } from "react"
import { Bell, MessageSquare, CheckCircle2 } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { useNotifications } from "@/hooks/use-notifications"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { useRouter } from "next/navigation"

export function NotificationBell() {
  const router = useRouter()
  const { notifications, unreadCount, markAsRead } = useNotifications()
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative flex h-9 w-9 items-center justify-center rounded-lg text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface focus:outline-none"
      >
        <Bell className="h-[18px] w-[18px]" />
        {unreadCount > 0 && (
          <motion.span 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground shadow-sm"
          >
            {unreadCount > 9 ? "+9" : unreadCount}
          </motion.span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop simple */}
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-2xl border border-outline-variant bg-surface-container-high shadow-2xl"
            >
              <div className="border-b border-outline-variant px-4 py-3 bg-surface-container-highest">
                <h3 className="text-sm font-bold text-on-surface">Notificaciones</h3>
              </div>
              
              <div className="max-h-[400px] overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                    <div className="mb-3 rounded-full bg-surface-container-low p-3">
                      <Bell className="h-6 w-6 opacity-20" />
                    </div>
                    <p className="text-sm font-medium text-on-surface-variant">Todo al día</p>
                    <p className="text-xs text-on-surface-variant/60 mt-1">No tienes notificaciones pendientes.</p>
                  </div>
                ) : (
                  <div className="flex flex-col">
                    {notifications.map((n) => (
                      <button
                        key={n.id}
                        onClick={() => {
                          if (!n.leido_at) markAsRead(n.id)
                          // Redirigir a la solicitud específica
                          const formattedId = String(n.solicitud_id).padStart(5, "0")
                          router.push(`/solicitudes?s=${formattedId}`)
                          setIsOpen(false)
                        }}
                        className={cn(
                          "flex w-full gap-3 border-b border-outline-variant/30 px-4 py-4 text-left transition-colors hover:bg-surface-container-highest",
                          !n.leido_at && "bg-primary/5"
                        )}
                      >
                        <div className={cn(
                          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                          n.tipo === 'nuevo_comentario' ? "bg-blue-500/10 text-blue-500" : "bg-primary/10 text-primary"
                        )}>
                          {n.tipo === 'nuevo_comentario' ? <MessageSquare className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                        </div>
                        <div className="flex flex-col gap-0.5 overflow-hidden">
                          <p className={cn("text-xs leading-relaxed text-on-surface", !n.leido_at && "font-bold")}>
                            {n.mensaje}
                          </p>
                          <span className="text-[10px] text-on-surface-variant/60">
                            {new Date(n.created_at).toLocaleDateString()} • {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        {!n.leido_at && (
                          <div className="h-2 w-2 mt-1 shrink-0 rounded-full bg-primary" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              
              {notifications.length > 0 && (
                <div className="bg-surface-container-low px-4 py-2 text-center border-t border-outline-variant">
                  <Link 
                    href="/notificaciones"
                    onClick={() => setIsOpen(false)}
                    className="block w-full text-[10px] font-bold text-primary uppercase tracking-wider hover:underline py-1"
                  >
                    Ver todas
                  </Link>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
