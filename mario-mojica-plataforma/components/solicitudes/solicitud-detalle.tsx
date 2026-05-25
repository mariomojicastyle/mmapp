/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
 
 
"use client"

import React, { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Send, Paperclip, Download, User, Clock, Loader2, MessageSquare, CheckCircle, Calendar, RefreshCw } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/lib/auth/auth-context"
import { cn } from "@/lib/utils"
import { notifyDateProposal } from "@/app/actions/solicitudes"

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
  viewMode?: "client" | "team"
  onStatusChange?: (estado_entrega: string, fecha_equipo?: string, estado_general?: string) => void
}

export function SolicitudDetalle({ isOpen, onClose, solicitudId, solicitudTitulo, solicitudDescripcion, viewMode, onStatusChange }: SolicitudDetalleProps) {
  const { user } = useAuth()
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

      async function fetchSolicitudDetails() {
        const { data: solData } = await supabase.from("solicitudes").select("*").eq("id", numericId).single()
        if (solData) {
          setSolicitudData(solData)
          if (!tempDate) {
            const toYMD = (d: string | null) => {
              if (!d) return "";
              try {
                // Si el string ya incluye 'T', solo cortamos
                if (d.includes('T')) return d.split('T')[0];
                // Si es MM/DD/YYYY format
                if (d.includes('/')) {
                  const parts = d.split('/');
                  if (parts.length === 3) return `${parts[2]}-${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}`;
                }
                // Caso contrario, asumimos YYYY-MM-DD u otro string seguro
                return d.substring(0, 10);
              } catch (e) {
                return "";
              }
            }
            const rawDate = solData.estado_entrega === "propuesta_equipo" ? (solData.fecha_equipo || solData.fecha_sugerida_entrega) : solData.fecha_sugerida_entrega
            setTempDate(toYMD(rawDate))
          }
        }
      }
      
      await fetchSolicitudDetails()

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
    const isTeam = user.role === "superadmin" || user.role === "coequipero"
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

      // Crear notificación para la contraparte
      let recipientId = null
      if (isTeam) {
        // Si el equipo responde, notificar al cliente
        recipientId = solicitudData.client_id
      } else {
        // Si el cliente responde, notificar al asignado
        recipientId = solicitudData.assigned_to_id
      }

      if (recipientId && recipientId !== user.id) {
        await supabase.from("notificaciones").insert({
          user_id: recipientId,
          tipo: "comentario",
          solicitud_id: numericId,
          mensaje: `${user.name} ha dejado un mensaje en la solicitud #${String(numericId).padStart(5, "0")}`
        })
      }
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
    const { error } = await supabase.from("solicitudes").update({ 
      estado_entrega: "confirmada",
      estado: "Acordada y aprobada"
    }).eq("id", parseInt(solicitudId, 10))

    if (error) {
      console.error("Error al confirmar fecha:", error)
      alert("Hubo un error al confirmar la fecha.")
      setIsUpdatingDate(false)
      return
    }

    setIsUpdatingDate(false)
    setSolicitudData((prev: any) => prev ? { ...prev, estado_entrega: "confirmada", estado: "Acordada y aprobada" } : null)
    if (onStatusChange) onStatusChange("confirmada", undefined, "Acordada y aprobada")
    onClose()
  }

  const handleProposeDate = async () => {
    if (!solicitudId || !tempDate) return
    setIsUpdatingDate(true)
    const supabase = createClient()
    await supabase.from("solicitudes").update({ estado_entrega: "propuesta_equipo", fecha_equipo: tempDate }).eq("id", parseInt(solicitudId, 10))

    if (solicitudData?.client_id) {
      await notifyDateProposal(solicitudId, solicitudData.client_id)
    }

    setIsUpdatingDate(false)
    setSolicitudData((prev: any) => prev ? { ...prev, estado_entrega: "propuesta_equipo", fecha_equipo: tempDate } : null)
    if (onStatusChange) onStatusChange("propuesta_equipo", tempDate)
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

  const handleAprobarTrabajo = async () => {
    if (!solicitudId) return
    setIsUpdatingDate(true)
    const supabase = createClient()
    await supabase.from("solicitudes").update({ 
      estado: "Resuelta" 
    }).eq("id", parseInt(solicitudId, 10))
    setIsUpdatingDate(false)
    if (onStatusChange) onStatusChange(solicitudData.estado_entrega, solicitudData.fecha_equipo, "Resuelta")
    onClose()
  }

  const handleUpdateClientDate = async () => {
    if (!solicitudId || !tempDate) return
    setIsUpdatingDate(true)
    const supabase = createClient()
    await supabase.from("solicitudes").update({ 
      fecha_sugerida_entrega: tempDate,
      estado_entrega: "pendiente"
    }).eq("id", parseInt(solicitudId, 10))
    setIsUpdatingDate(false)
    setSolicitudData((prev: any) => prev ? { ...prev, fecha_sugerida_entrega: tempDate, estado_entrega: "pendiente" } : null)
    if (onStatusChange) onStatusChange("pendiente", undefined)

    if (solicitudData?.estado_entrega === "propuesta_equipo") {
      const { data: superadmins } = await supabase.from("profiles").select("id").eq("role", "superadmin")
      const recipients = new Set<string>()
      if (solicitudData.assigned_to_id) recipients.add(solicitudData.assigned_to_id)
      if (superadmins) superadmins.forEach(s => recipients.add(s.id))
      
      const notifications = Array.from(recipients).map(id => ({
          user_id: id,
          tipo: "sistema",
          solicitud_id: parseInt(solicitudId, 10),
          mensaje: `El cliente ha sugerido una NUEVA fecha para la solicitud #${String(solicitudId).padStart(5, "0")}`
      }))
      if (notifications.length > 0) await supabase.from("notificaciones").insert(notifications)
    }
  }

  const handleAcceptDate = async () => {
    if (!solicitudId || !solicitudData?.fecha_equipo) return
    setIsUpdatingDate(true)
    const supabase = createClient()
    
    // 1. Update ticket
    const { error } = await supabase.from("solicitudes").update({ 
      estado_entrega: "confirmada",
      fecha_sugerida_entrega: solicitudData.fecha_equipo,
      estado: "Acordada y aprobada"
    }).eq("id", parseInt(solicitudId, 10))

    if (error) {
      console.error("Error al confirmar fecha:", error)
      alert("Hubo un error al confirmar la fecha.")
      setIsUpdatingDate(false)
      return
    }

    setIsUpdatingDate(false)
    setSolicitudData((prev: any) => prev ? { ...prev, estado_entrega: "confirmada", fecha_sugerida_entrega: solicitudData.fecha_equipo, estado: "Acordada y aprobada" } : null)
    if (onStatusChange) onStatusChange("confirmada", solicitudData.fecha_equipo, "Acordada y aprobada")
    
    // 2. Notifications
    const { data: superadmins } = await supabase.from("profiles").select("id").eq("role", "superadmin")
    const recipients = new Set<string>()
    if (solicitudData.assigned_to_id) recipients.add(solicitudData.assigned_to_id)
    if (superadmins) superadmins.forEach(s => recipients.add(s.id))
    
    const notifications = Array.from(recipients).map(id => ({
        user_id: id,
        tipo: "sistema",
        solicitud_id: parseInt(solicitudId, 10),
        mensaje: `El cliente ha ACEPTADO la fecha propuesta para la solicitud #${String(solicitudId).padStart(5, "0")}`
    }))
    if (notifications.length > 0) {
      const { error: notifErr } = await supabase.from("notificaciones").insert(notifications)
      if (notifErr) console.error("Error sending notifs:", notifErr)
    }
  }

  const handleRejectDate = async () => {
    if (!solicitudId) return
    setIsUpdatingDate(true)
    const supabase = createClient()
    const { error } = await supabase.from("solicitudes").update({ 
      estado_entrega: "pendiente",
      estado: "En revisión"
    }).eq("id", parseInt(solicitudId, 10))

    if (error) {
      console.error("Error al rechazar fecha:", error)
      alert("Hubo un error al rechazar la fecha.")
      setIsUpdatingDate(false)
      return
    }

    setIsUpdatingDate(false)
    setSolicitudData((prev: any) => prev ? { ...prev, estado_entrega: "pendiente", estado: "En revisión" } : null)
    if (onStatusChange) onStatusChange("pendiente", undefined, "En revisión")
    
    const { data: superadmins } = await supabase.from("profiles").select("id").eq("role", "superadmin")
    const recipients = new Set<string>()
    if (solicitudData.assigned_to_id) recipients.add(solicitudData.assigned_to_id)
    if (superadmins) superadmins.forEach(s => recipients.add(s.id))
    
    const notifications = Array.from(recipients).map(id => ({
        user_id: id,
        tipo: "sistema",
        solicitud_id: parseInt(solicitudId, 10),
        mensaje: `El cliente ha RECHAZADO la fecha propuesta para la solicitud #${String(solicitudId).padStart(5, "0")}`
    }))
    if (notifications.length > 0) {
      const { error: notifErr } = await supabase.from("notificaciones").insert(notifications)
      if (notifErr) console.error("Error sending notifs:", notifErr)
    }
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
            className="fixed inset-y-0 right-0 z-50 flex w-full flex-col border-l border-outline-variant bg-surface-container-lowest shadow-2xl sm:w-[500px] md:w-[600px]"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-outline-variant px-6 py-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="rounded-md bg-surface-container-low px-2 py-0.5 font-mono text-xs font-bold text-on-surface-variant">
                    {solicitudId}
                  </span>
                  <h2 className="text-lg font-bold text-on-surface line-clamp-1">{solicitudData?.titulo || solicitudTitulo}</h2>
                </div>
                <p className="text-sm text-on-surface-variant line-clamp-1 mt-1">{solicitudData?.descripcion || solicitudDescripcion}</p>
              </div>
              <button
                onClick={onClose}
                className="rounded-full p-2 text-on-surface-variant transition-colors hover:bg-surface-container-low hover:text-on-surface"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            {/* SLA Semaforo Section */}
            {solicitudData && (() => {
              const isClientView = viewMode === "client" || (!viewMode && user?.role !== "superadmin" && user?.role !== "coequipero");
              
              if (isClientView && solicitudData.estado_entrega === "propuesta_equipo") {
                return (
                  <div className="bg-surface-container-lowest border-b border-outline-variant p-6">
                    <div className="flex flex-col gap-4">
                      <div className="flex justify-center">
                        <span className="text-sm text-on-surface font-bold bg-amber-500/40 px-4 py-2 rounded-md">
                          El equipo propone esta fecha. ¿Estás de acuerdo?
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-[160px_1fr] gap-y-4 items-center">
                        {/* Fila 1: Fecha Original */}
                        <div className="flex items-center gap-2 text-on-surface">
                          <Calendar className="h-4 w-4" />
                          <span className="text-sm font-bold">Fecha de Entrega</span>
                        </div>
                        <div className="flex justify-start">
                          <input 
                            type="date" 
                            value={solicitudData.fecha_sugerida_entrega ? solicitudData.fecha_sugerida_entrega.split('T')[0] : ""} 
                            disabled
                            className="rounded-lg border border-outline-variant bg-surface-container-low px-3 py-1.5 text-xs text-on-surface outline-none opacity-50 cursor-not-allowed"
                          />
                        </div>
                        
                        {/* Fila 2: Fecha Propuesta */}
                        <div className="flex items-center gap-2 text-on-surface">
                          <div className="h-2.5 w-2.5 rounded-full bg-amber-500 shadow-amber-500/50 shadow-[0_0_8px_rgba(0,0,0,0.2)] shrink-0" />
                          <span className="text-sm font-medium leading-tight">Propuesta por el equipo</span>
                        </div>
                        <div className="flex items-center gap-2 justify-start">
                          <input 
                            type="date" 
                            value={tempDate || (solicitudData.fecha_equipo ? solicitudData.fecha_equipo.split('T')[0] : "")} 
                            onChange={(e) => setTempDate(e.target.value)}
                            className="rounded-lg border border-outline-variant bg-surface-container-low px-3 py-1.5 text-xs text-on-surface outline-none focus:border-primary"
                          />
                          {tempDate === (solicitudData.fecha_equipo ? solicitudData.fecha_equipo.split('T')[0] : "") ? (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={handleAcceptDate}
                                disabled={isUpdatingDate}
                                className="flex items-center gap-1.5 rounded-lg bg-emerald-500 text-white px-3 py-1.5 text-xs font-bold transition hover:bg-emerald-600 disabled:opacity-50"
                              >
                                <CheckCircle className="h-3.5 w-3.5" /> Aceptar
                              </button>
                              <button
                                onClick={handleRejectDate}
                                disabled={isUpdatingDate}
                                className="flex items-center gap-1.5 rounded-lg bg-rose-500 text-white px-3 py-1.5 text-xs font-bold transition hover:bg-rose-600 disabled:opacity-50"
                              >
                                <X className="h-3.5 w-3.5" /> Rechazar
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={handleUpdateClientDate}
                              disabled={!tempDate || isUpdatingDate || tempDate === solicitudData.fecha_sugerida_entrega}
                              className="rounded-lg bg-surface-container-high px-3 py-1.5 text-xs font-bold text-on-surface transition hover:bg-surface-container-highest disabled:opacity-50"
                            >
                              Proponer Otra
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              }

              return (
              <div className="bg-surface-container-lowest border-b border-outline-variant p-6">
                <div className="flex flex-col gap-4">
                  {/* TOP BADGES UNIFIED */}
                  <div className="flex justify-center">
                    {!isClientView ? (
                      // TEAM VIEW BADGES
                      solicitudData.estado === "Eliminada" ? (
                        <span className="text-sm text-on-surface font-bold bg-slate-500/40 px-4 py-2 rounded-md flex items-center gap-1">
                          <X className="h-4 w-4" /> Eliminada
                        </span>
                      ) : solicitudData.estado_entrega === "propuesta_equipo" ? (
                        <span className="text-sm text-on-surface font-bold bg-amber-500/40 px-4 py-2 rounded-md">
                          Esperando respuesta del cliente
                        </span>
                      ) : solicitudData.estado_entrega === "confirmada" ? (
                        <span className="text-sm text-on-surface font-bold bg-emerald-500/40 px-4 py-2 rounded-md flex items-center gap-1">
                          <CheckCircle className="h-4 w-4" /> Acordada
                        </span>
                      ) : null
                    ) : (
                      // CLIENT VIEW BADGES
                      solicitudData.estado === "En revisión" ? (
                        <span className="text-sm text-on-surface font-bold bg-purple-500/40 px-4 py-2 rounded-md">
                          El equipo ha entregado el trabajo para tu revisión
                        </span>
                      ) : solicitudData.estado_entrega === "pendiente" ? (
                        <span className="text-sm text-on-surface font-bold bg-rose-500/40 px-4 py-2 rounded-md">
                          Esperando validación del equipo
                        </span>
                      ) : solicitudData.estado_entrega === "confirmada" ? (
                        <span className="text-sm text-on-surface font-bold bg-emerald-500/40 px-4 py-2 rounded-md flex items-center gap-1">
                          <CheckCircle className="h-4 w-4" /> Fecha Confirmada
                        </span>
                      ) : null
                    )}
                  </div>

                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-on-surface flex items-center gap-2">
                        <Calendar className="h-4 w-4" /> Fecha de Entrega
                      </h3>
                      <div className="mt-2 flex items-center gap-2">
                        {/* Semaforo Dot */}
                        <div className={cn(
                          "h-2.5 w-2.5 rounded-full shrink-0 shadow-[0_0_8px_rgba(0,0,0,0.2)]",
                          solicitudData.estado === "Eliminada" ? "bg-slate-500 shadow-slate-500/50" :
                          solicitudData.estado_entrega === "confirmada" ? "bg-emerald-500 shadow-emerald-500/50" :
                          solicitudData.estado_entrega === "propuesta_equipo" ? "bg-amber-500 shadow-amber-500/50" :
                          "bg-rose-500 shadow-rose-500/50"
                        )} />
                        <span className="text-sm font-medium text-on-surface">
                          {solicitudData.estado === "Eliminada" ? "Eliminada por el cliente" :
                           solicitudData.estado_entrega === "confirmada" ? "Confirmada" :
                           solicitudData.estado_entrega === "propuesta_equipo" ? "Propuesta por el equipo" :
                           "Sugerida por el cliente"}
                        </span>
                      </div>
                    </div>

                    {/* Actions based on role and status */}
                    <div className="flex flex-col gap-2 items-end">
                      {!isClientView ? (
                        // TEAM VIEW ACTIONS ONLY
                        solicitudData.estado === "Eliminada" ? (
                          null
                        ) : solicitudData.estado_entrega !== "confirmada" ? (
                          <div className="flex flex-col gap-2 items-end">
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
                                value={tempDate || ""}
                                onChange={(e) => setTempDate(e.target.value)}
                                className="rounded-lg border border-outline-variant bg-surface-container-low px-2 py-1 text-xs outline-none focus:border-primary"
                              />
                              <button
                                onClick={handleProposeDate}
                                disabled={!tempDate || isUpdatingDate || (solicitudData.estado_entrega === "propuesta_equipo" && tempDate === solicitudData.fecha_equipo)}
                                className="rounded-lg bg-surface-container-high px-3 py-1.5 text-xs font-bold text-on-surface transition hover:bg-surface-container-highest disabled:opacity-50"
                              >
                                Proponer
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col gap-2 items-end">
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
                        // CLIENT VIEW ACTIONS ONLY
                        solicitudData.estado === "En revisión" ? (
                          <div className="flex flex-col gap-2 items-end">
                            <button
                              onClick={handleAprobarTrabajo}
                              disabled={isUpdatingDate}
                              className="flex items-center gap-1.5 rounded-lg bg-emerald-500 text-white px-3 py-1.5 text-xs font-bold transition hover:bg-emerald-600 disabled:opacity-50 shadow-sm"
                            >
                              <CheckCircle className="h-3.5 w-3.5" /> Aprobar Trabajo
                            </button>
                          </div>
                        ) : solicitudData.estado_entrega === "pendiente" ? (
                          <div className="flex items-center gap-2 mt-1">
                            <input 
                              type="date" 
                              value={tempDate || (solicitudData.fecha_sugerida_entrega ? solicitudData.fecha_sugerida_entrega.split('T')[0] : "")} 
                              onChange={(e) => setTempDate(e.target.value)}
                              className="rounded-lg border border-outline-variant bg-surface-container-low px-3 py-1.5 text-xs text-on-surface outline-none focus:border-primary"
                            />
                            <button
                              onClick={handleUpdateClientDate}
                              disabled={!tempDate || isUpdatingDate || tempDate === (solicitudData.fecha_sugerida_entrega ? solicitudData.fecha_sugerida_entrega.split('T')[0] : "")}
                              className="rounded-lg bg-surface-container-high px-3 py-1.5 text-xs font-bold text-on-surface transition hover:bg-surface-container-highest disabled:opacity-50"
                            >
                              Actualizar Fecha
                            </button>
                          </div>
                        ) : null
                      )}
                    </div>
                  </div>
                </div>
              </div>
              );
            })()}

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

