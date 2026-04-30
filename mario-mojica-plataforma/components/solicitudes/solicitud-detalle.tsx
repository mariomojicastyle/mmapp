"use client"

import React, { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Send, Paperclip, Download, User, Clock, Loader2, MessageSquare, CheckCircle, Calendar, RefreshCw } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/lib/auth/auth-context"
import { cn } from "@/lib/utils"

interface Comentario {
  id: number
  solicitud_id: number
  user_id: string
  user_name: string
  texto: string
  created_at: string
}

interface SolicitudDetalleProps {
  isOpen: boolean
  onClose: () => void
  solicitudId: string | null // e.g. "00001"
  solicitudTitulo: string
  solicitudDescripcion: string
  onStatusChange?: (estado_entrega: string, fecha_equipo?: string) => void
}

export function SolicitudDetalle({ isOpen, onClose, solicitudId, solicitudTitulo, solicitudDescripcion, onStatusChange }: SolicitudDetalleProps) {
  const { user, profile } = useAuth()
  const [comentarios, setComentarios] = useState<Comentario[]>([])
  const [nuevoComentario, setNuevoComentario] = useState("")
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [solicitudData, setSolicitudData] = useState<any>(null)
  const [isUpdatingDate, setIsUpdatingDate] = useState(false)
  const [tempDate, setTempDate] = useState("")
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen || !solicitudId) return

    const fetchData = async () => {
      setLoading(true)
      const supabase = createClient()
      const numericId = parseInt(solicitudId, 10)

      // Fetch solicitud data
      const { data: solData } = await supabase
        .from("solicitudes")
        .select("*")
        .eq("id", numericId)
        .single()

      if (solData) setSolicitudData(solData)

      // Fetch comentarios
      const { data, error } = await supabase
        .from("comentarios")
        .select("*")
        .eq("solicitud_id", numericId)
        .order("created_at", { ascending: true })

      if (error) {
        console.error("Error fetching comentarios:", error)
      } else if (data) {
        setComentarios(data)
      }
      setLoading(false)
    }

    fetchData()

    // Suscripción Realtime para chat en vivo y cambios en la solicitud
    const supabase = createClient()
    const numericId = parseInt(solicitudId, 10)
    
    const channel = supabase
      .channel(`chat_and_status:${solicitudId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "comentarios",
          filter: `solicitud_id=eq.${numericId}`
        },
        (payload) => {
          const nuevo = payload.new as Comentario
          // Evitar duplicados si el usuario que envió el mensaje ya lo agregó localmente
          setComentarios((prev) => {
            if (prev.some(c => c.id === nuevo.id)) return prev
            return [...prev, nuevo]
          })
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "solicitudes",
          filter: `id=eq.${numericId}`
        },
        (payload) => {
          setSolicitudData(payload.new)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [isOpen, solicitudId])

  // Auto-scroll to bottom when new comments arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [comentarios, isOpen])

  const handleSend = async () => {
    if (!nuevoComentario.trim() || !solicitudId || !user) return

    setSending(true)
    const supabase = createClient()
    const numericId = parseInt(solicitudId, 10)
    const isTeam = user.role === "superadmin" || user.role === "designer"
    const suffix = isTeam ? " (Team MM)" : (user.company ? ` (${user.company})` : "")
    const userName = `${user.name}${suffix}`

    const { data, error } = await supabase
      .from("comentarios")
      .insert({
        solicitud_id: numericId,
        user_id: user.id,
        user_name: userName,
        texto: nuevoComentario.trim()
      })
      .select()
      .single()

    if (error) {
      console.error("Error sending comentario:", error)
      alert("No se pudo enviar el mensaje.")
    } else if (data) {
      setComentarios(prev => [...prev, data])
      setNuevoComentario("")
    }
    setSending(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleConfirmDate = async () => {
    if (!solicitudId) return
    setIsUpdatingDate(true)
    const supabase = createClient()
    await supabase.from("solicitudes").update({ estado_entrega: "confirmada" }).eq("id", parseInt(solicitudId, 10))
    setIsUpdatingDate(false)
    if (onStatusChange) onStatusChange("confirmada")
    onClose()
  }

  const handleProposeDate = async () => {
    if (!solicitudId || !tempDate) return
    setIsUpdatingDate(true)
    const supabase = createClient()
    await supabase.from("solicitudes").update({ estado_entrega: "propuesta_equipo", fecha_equipo: tempDate }).eq("id", parseInt(solicitudId, 10))
    setIsUpdatingDate(false)
    if (onStatusChange) onStatusChange("propuesta_equipo", tempDate)
    onClose()
  }

  const handleAcceptDate = async () => {
    if (!solicitudId || !solicitudData?.fecha_equipo) return
    setIsUpdatingDate(true)
    const supabase = createClient()
    await supabase.from("solicitudes").update({ 
      estado_entrega: "confirmada",
      fecha_sugerida_entrega: solicitudData.fecha_equipo 
    }).eq("id", parseInt(solicitudId, 10))
    setIsUpdatingDate(false)
    if (onStatusChange) onStatusChange("confirmada", solicitudData.fecha_equipo)
    onClose()
  }

  const handleReplantear = async () => {
    if (!solicitudId) return
    setIsUpdatingDate(true)
    const supabase = createClient()
    await supabase.from("solicitudes").update({ estado_entrega: "pendiente", fecha_equipo: null }).eq("id", parseInt(solicitudId, 10))
    setIsUpdatingDate(false)
    if (onStatusChange) onStatusChange("pendiente", undefined)
    onClose()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          />

          {/* Slide-over Panel */}
          <motion.div
            initial={{ x: "100%", opacity: 0.5 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0.5 }}
            transition={{ type: "spring", bounce: 0, duration: 0.4 }}
            className="fixed inset-y-0 right-0 z-50 flex w-full flex-col border-l border-outline-variant bg-surface-container-lowest shadow-2xl sm:w-[450px] md:w-[500px]"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-outline-variant px-6 py-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="rounded-md bg-surface-container-low px-2 py-0.5 font-mono text-xs font-bold text-on-surface-variant">
                    {solicitudId}
                  </span>
                  <h2 className="text-lg font-bold text-on-surface line-clamp-1">{solicitudTitulo}</h2>
                </div>
                <p className="text-sm text-on-surface-variant line-clamp-1 mt-1">{solicitudDescripcion}</p>
              </div>
              <button
                onClick={onClose}
                className="rounded-full p-2 text-on-surface-variant transition-colors hover:bg-surface-container-low hover:text-on-surface"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* SLA Semaforo Section */}
            {solicitudData && (
              <div className="bg-surface-container-lowest border-b border-outline-variant p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-on-surface flex items-center gap-2">
                      <Calendar className="h-4 w-4" /> Fecha de Entrega
                    </h3>
                    <div className="mt-2 flex items-center gap-2">
                      {/* Semaforo Dot */}
                      <div className={cn(
                        "h-2.5 w-2.5 rounded-full shrink-0 shadow-[0_0_8px_rgba(0,0,0,0.2)]",
                        solicitudData.estado_entrega === "confirmada" ? "bg-emerald-500 shadow-emerald-500/50" :
                        solicitudData.estado_entrega === "propuesta_equipo" ? "bg-amber-500 shadow-amber-500/50" :
                        "bg-rose-500 shadow-rose-500/50"
                      )} />
                      <span className="text-sm font-medium text-on-surface">
                        {solicitudData.estado_entrega === "confirmada" ? "Confirmada:" :
                         solicitudData.estado_entrega === "propuesta_equipo" ? "Propuesta:" :
                         "Sugerida:"}
                      </span>
                      <span className="text-sm text-on-surface-variant">
                        {solicitudData.estado_entrega === "propuesta_equipo" && solicitudData.fecha_equipo
                          ? new Date(solicitudData.fecha_equipo).toLocaleDateString("es-ES", { day: 'numeric', month: 'long', year: 'numeric' })
                          : solicitudData.fecha_sugerida_entrega
                            ? new Date(solicitudData.fecha_sugerida_entrega).toLocaleDateString("es-ES", { day: 'numeric', month: 'long', year: 'numeric' })
                            : "No especificada"}
                      </span>
                    </div>
                  </div>

                  {/* Actions based on role and status */}
                  <div className="flex flex-col gap-2 items-end">
                    {(user?.role === "superadmin" || user?.role === "designer") ? (
                      // TEAM VIEW
                      solicitudData.estado_entrega === "pendiente" ? (
                        <div className="flex flex-col gap-2">
                          <button
                            onClick={handleConfirmDate}
                            disabled={isUpdatingDate}
                            className="flex items-center gap-1.5 rounded-lg bg-emerald-500/10 px-3 py-1.5 text-xs font-bold text-emerald-600 transition hover:bg-emerald-500/20 disabled:opacity-50"
                          >
                            <CheckCircle className="h-3.5 w-3.5" /> Confirmar Fecha
                          </button>
                          <div className="flex items-center gap-2">
                            <input
                              type="date"
                              value={tempDate}
                              onChange={(e) => setTempDate(e.target.value)}
                              className="rounded-lg border border-outline-variant bg-surface-container-low px-2 py-1 text-xs outline-none"
                            />
                            <button
                              onClick={handleProposeDate}
                              disabled={!tempDate || isUpdatingDate}
                              className="rounded-lg bg-surface-container-high px-3 py-1.5 text-xs font-bold text-on-surface transition hover:bg-surface-container-highest disabled:opacity-50"
                            >
                              Proponer
                            </button>
                          </div>
                        </div>
                      ) : solicitudData.estado_entrega === "propuesta_equipo" ? (
                        <span className="text-xs text-amber-600 font-medium bg-amber-500/10 px-2 py-1 rounded-md">
                          Esperando respuesta del cliente
                        </span>
                      ) : (
                        <div className="flex flex-col gap-2 items-end">
                          <span className="text-xs text-emerald-600 font-medium bg-emerald-500/10 px-2 py-1 rounded-md flex items-center gap-1">
                            <CheckCircle className="h-3.5 w-3.5" /> Acordada
                          </span>
                          <button
                            onClick={handleReplantear}
                            disabled={isUpdatingDate}
                            className="flex items-center gap-1.5 rounded-lg bg-surface-container-high px-3 py-1.5 text-xs font-bold text-on-surface transition hover:bg-surface-container-highest disabled:opacity-50"
                          >
                            <RefreshCw className="h-3 w-3" /> Replantear
                          </button>
                        </div>
                      )
                    ) : (
                      // CLIENT VIEW
                      solicitudData.estado_entrega === "propuesta_equipo" ? (
                        <div className="flex flex-col gap-2 items-end">
                          <span className="text-xs text-amber-600 font-medium">
                            Fátima sugiere esta fecha. ¿Estás de acuerdo?
                          </span>
                          <button
                            onClick={handleAcceptDate}
                            disabled={isUpdatingDate}
                            className="flex items-center gap-1.5 rounded-lg bg-emerald-500 text-white px-3 py-1.5 text-xs font-bold transition hover:bg-emerald-600 disabled:opacity-50 shadow-sm"
                          >
                            <CheckCircle className="h-3.5 w-3.5" /> Aceptar Nueva Fecha
                          </button>
                        </div>
                      ) : solicitudData.estado_entrega === "pendiente" ? (
                        <span className="text-xs text-rose-600 font-medium bg-rose-500/10 px-2 py-1 rounded-md">
                          Esperando validación del equipo
                        </span>
                      ) : (
                        <span className="text-xs text-emerald-600 font-medium bg-emerald-500/10 px-2 py-1 rounded-md flex items-center gap-1">
                          <CheckCircle className="h-3.5 w-3.5" /> Fecha Confirmada
                        </span>
                      )
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Comentarios Feed */}
            <div className="bg-surface-container-low/30 px-6 py-2 border-b border-outline-variant/30 flex items-center gap-2">
              <MessageSquare className="h-3.5 w-3.5 text-on-surface-variant" />
              <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Historial de conversación</span>
            </div>
            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-6 scroll-smooth bg-surface-container-lowest"
            >
              {loading ? (
                <div className="flex h-full flex-col items-center justify-center gap-2 text-on-surface-variant">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span className="text-sm">Cargando hilo de actividad...</span>
                </div>
              ) : comentarios.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center gap-3 text-center text-on-surface-variant">
                  <div className="rounded-full bg-surface-container-low p-4">
                    <MessageSquare className="h-8 w-8 opacity-50" />
                  </div>
                  <div>
                    <p className="font-medium text-on-surface">No hay comentarios aún</p>
                    <p className="text-sm mt-1">Sé el primero en dejar un mensaje en este hilo.</p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-6">
                  {comentarios.map((c, i) => {
                    const isMe = c.user_id === user?.id
                    return (
                      <div key={c.id || i} className={cn("flex flex-col gap-1.5", isMe ? "items-end" : "items-start")}>
                        <div className="flex items-center gap-2 px-1">
                          {!isMe && (
                            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-surface-container-high text-[10px] font-bold text-on-surface">
                              {c.user_name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <span className="text-xs font-medium text-on-surface-variant">
                            {isMe ? "Tú" : c.user_name}
                          </span>
                          <span className="text-[10px] text-on-surface-variant/60">
                            {new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <div
                          className={cn(
                            "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm shadow-sm",
                            isMe
                              ? "bg-primary text-primary-foreground rounded-tr-sm"
                              : "bg-surface-container-low text-on-surface rounded-tl-sm"
                          )}
                        >
                          <p className="whitespace-pre-wrap leading-relaxed">{c.texto}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Input Area */}
            <div className="border-t border-outline-variant bg-surface-container-lowest p-4">
              <div className="flex items-end gap-2 rounded-2xl border border-outline-variant bg-surface-container-low p-1.5 transition-colors focus-within:border-primary focus-within:ring-1 focus-within:ring-primary">
                <textarea
                  value={nuevoComentario}
                  onChange={(e) => setNuevoComentario(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Escribe un mensaje... (Enter para enviar)"
                  className="max-h-32 min-h-[44px] w-full resize-none bg-transparent px-3 py-3 text-sm text-on-surface outline-none placeholder:text-on-surface-variant/50"
                  rows={1}
                />
                <button
                  onClick={handleSend}
                  disabled={!nuevoComentario.trim() || sending}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground transition-transform hover:scale-105 active:scale-95 disabled:pointer-events-none disabled:opacity-50 m-0.5"
                >
                  {sending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                </button>
              </div>
              <div className="mt-2 text-center">
                <span className="text-[10px] text-on-surface-variant">
                  Los mensajes enviados notifican automáticamente al equipo involucrado.
                </span>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
