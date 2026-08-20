"use client"

import React, { useState, useRef, useEffect } from "react"
import {
  Clock,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Check,
  Copy,
  Sparkles,
  Quote,
  Send,
  Loader2,
  BrainCircuit,
  ArrowRight,
  Mic,
  MicOff,
  Trash2,
} from "lucide-react"
import { VentasProspecto, VentasInteraccion, CanalContacto } from "@/lib/types/ventas-ram"
import { RefinamientoChat } from "./refinamiento-chat"

interface HistorialTimelineProps {
  interacciones: VentasInteraccion[]
  prospecto?: VentasProspecto | null
  onSaveInteraccion?: (data: Omit<VentasInteraccion, "id" | "created_at">) => Promise<void>
  onDeleteInteraccion?: (interaccionId: string) => Promise<void>
}

interface JugadaGenerada {
  estrategia_explicacion_es: string
  borrador_pt: string
  traduccion_es: string
  canal_recomendado: CanalContacto
}

export function HistorialTimeline({
  interacciones,
  prospecto,
  onSaveInteraccion,
  onDeleteInteraccion,
}: HistorialTimelineProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [generatingJugada, setGeneratingJugada] = useState(false)
  const [jugadaActiva, setJugadaActiva] = useState<JugadaGenerada | null>(null)
  const [copiedJugada, setCopiedJugada] = useState(false)
  const [savingJugada, setSavingJugada] = useState(false)
  const [refining, setRefining] = useState(false)

  // Enfoque adicional y Transcripción de Voz Continua (Control Manual)
  const [instruccionEnfoque, setInstruccionEnfoque] = useState("")
  const [isListening, setIsListening] = useState(false)
  const recognitionRef = useRef<any>(null)
  const manualStopRef = useRef(false)

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop()
        } catch {}
      }
    }
  }, [])

  const toggleListening = () => {
    if (isListening) {
      manualStopRef.current = true
      setIsListening(false)
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop()
        } catch {}
      }
      return
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition

    if (!SpeechRecognition) {
      alert("Tu navegador no soporta reconocimiento de voz nativo. Puedes escribir el texto directamente en el campo.")
      return
    }

    try {
      manualStopRef.current = false
      const recognition = new SpeechRecognition()
      recognition.lang = "es-CO"
      recognition.continuous = true
      recognition.interimResults = true

      recognition.onstart = () => {
        setIsListening(true)
      }

      recognition.onresult = (event: any) => {
        let newFinal = ""
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            newFinal += event.results[i][0].transcript + " "
          }
        }
        if (newFinal.trim()) {
          setInstruccionEnfoque((prev) => {
            const trimmed = prev.trim()
            return trimmed ? `${trimmed} ${newFinal.trim()}` : newFinal.trim()
          })
        }
      }

      recognition.onerror = (event: any) => {
        console.warn("Speech recognition error:", event.error)
        if (event.error !== "no-speech") {
          setIsListening(false)
        }
      }

      recognition.onend = () => {
        if (!manualStopRef.current) {
          try {
            recognition.start()
          } catch {
            setIsListening(false)
          }
        } else {
          setIsListening(false)
        }
      }

      recognitionRef.current = recognition
      recognition.start()
    } catch (e) {
      console.error("Error iniciando speech recognition:", e)
      setIsListening(false)
    }
  }

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const handleCopyJugada = () => {
    if (!jugadaActiva?.borrador_pt) return
    navigator.clipboard.writeText(jugadaActiva.borrador_pt)
    setCopiedJugada(true)
    setTimeout(() => setCopiedJugada(false), 2000)
  }

  const handleGenerarJugada = async () => {
    if (!prospecto) return
    setGeneratingJugada(true)
    try {
      const res = await fetch("/api/ventas-ram/generar-jugada", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prospecto,
          interacciones,
          instruccion_adicional: instruccionEnfoque.trim() || undefined,
        }),
      })

      if (!res.ok) throw new Error("Error generando jugada")
      const data: JugadaGenerada = await res.json()
      setJugadaActiva(data)
    } catch (err) {
      console.error("Error generando jugada:", err)
      alert("No se pudo generar el mensaje con Antigravity.")
    } finally {
      setGeneratingJugada(false)
    }
  }

  const handleRefinarJugada = async (instruccion: string) => {
    if (!jugadaActiva) return
    setRefining(true)
    try {
      const res = await fetch("/api/ventas-ram/refinar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          borrador_actual_pt: jugadaActiva.borrador_pt,
          instruccion_ajuste: instruccion,
          contexto: {
            empresa: prospecto?.empresa,
            contacto: prospecto?.contacto_nombre,
            estrategia: jugadaActiva.estrategia_explicacion_es,
          },
        }),
      })

      if (!res.ok) throw new Error("Error refinando")
      const data = await res.json()
      setJugadaActiva((prev) =>
        prev
          ? {
              ...prev,
              borrador_pt: data.borrador_pt,
              traduccion_es: data.traduccion_es,
            }
          : null
      )
    } catch (err) {
      console.error("Error refinando jugada:", err)
      alert("No se pudo refinar la jugada.")
    } finally {
      setRefining(false)
    }
  }

  const handleGuardarJugadaEnviada = async () => {
    if (!prospecto || !jugadaActiva || !onSaveInteraccion) return
    setSavingJugada(true)
    try {
      await onSaveInteraccion({
        prospecto_id: prospecto.id,
        canal: jugadaActiva.canal_recomendado || prospecto.canal_preferido || "WhatsApp",
        tipo_entrada: "texto",
        imagen_url: null,
        resumen_es: jugadaActiva.estrategia_explicacion_es,
        intencion_detectada: "Seguimiento Táctico con Antigravity",
        termometro: prospecto.temperatura,
        borrador_pt: jugadaActiva.borrador_pt,
        traduccion_es: jugadaActiva.traduccion_es,
        mensaje_final_enviado: jugadaActiva.traduccion_es || jugadaActiva.borrador_pt,
      })
      setJugadaActiva(null)
    } finally {
      setSavingJugada(false)
    }
  }

  const handleDeleteInteraccionItem = async (interaccionId: string) => {
    if (!onDeleteInteraccion) return
    const confirmar = window.confirm("¿Deseas eliminar este hito del historial cronológico?")
    if (!confirmar) return

    setDeletingId(interaccionId)
    try {
      await onDeleteInteraccion(interaccionId)
    } catch (err) {
      console.error("Error eliminando hito:", err)
      alert("No se pudo eliminar el hito.")
    } finally {
      setDeletingId(null)
    }
  }

  const formatFecha = (dateStr: string) => {
    try {
      const d = new Date(dateStr)
      return d.toLocaleDateString("es-CO", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    } catch {
      return dateStr
    }
  }

  return (
    <div className="space-y-4">
      {/* 1. BANNER PROACTIVO DE PRÓXIMA JUGADA */}
      {prospecto && (
        <div className="rounded-2xl bg-gradient-to-r from-primary/15 via-surface-container-high to-surface-container border-2 border-primary/30 p-4 space-y-3 shadow-xs">
          <div className="space-y-1">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <span className="text-[10px] uppercase tracking-wider font-extrabold text-primary flex items-center gap-1.5">
                <BrainCircuit className="h-3.5 w-3.5" />
                <span>Próxima Jugada Táctica Sugerida</span>
              </span>

              {prospecto.proxima_accion_at && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 flex items-center gap-1 shadow-2xs">
                  <Clock className="h-3 w-3" />
                  <span>Plazo: {new Date(prospecto.proxima_accion_at).toLocaleDateString("es-CO", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
                </span>
              )}
            </div>
            <p className="text-xs font-bold text-on-surface leading-snug">
              {prospecto.proxima_accion_descripcion ||
                "Mantener la relación activa y avanzar al siguiente hito de venta."}
            </p>
          </div>

          {/* Barra de Enfoque y Dictado de Voz para Personalizar la Jugada */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
            <div className="relative flex-1 flex items-center">
              <input
                type="text"
                value={instruccionEnfoque}
                onChange={(e) => setInstruccionEnfoque(e.target.value)}
                placeholder="Enfoque o instrucción (ej: 'Menciona que vi su post', 'Pedir WhatsApp') o usa el micro..."
                className="w-full pl-3 pr-10 py-2 text-xs rounded-xl bg-surface-container border border-outline-variant/30 text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:border-primary shadow-2xs"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !generatingJugada) {
                    handleGenerarJugada()
                  }
                }}
              />
              <button
                type="button"
                onClick={toggleListening}
                className={`absolute right-1.5 p-1.5 rounded-lg transition-all cursor-pointer ${
                  isListening
                    ? "bg-rose-500 text-white animate-pulse shadow-md"
                    : "text-on-surface-variant hover:text-primary hover:bg-surface-container-high"
                }`}
                title={isListening ? "Escuchando... clic para detener" : "Dictar instrucción por voz"}
              >
                {isListening ? (
                  <MicOff className="h-4 w-4" />
                ) : (
                  <Mic className="h-4 w-4" />
                )}
              </button>
            </div>

            <button
              onClick={handleGenerarJugada}
              disabled={generatingJugada}
              className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-primary text-xs font-bold text-primary-foreground hover:opacity-90 transition-opacity shadow-md shadow-primary/20 cursor-pointer shrink-0 disabled:opacity-50"
            >
              {generatingJugada ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Antigravity pensando...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>⚡ Activar Antigravity: Redactar Mensaje</span>
                </>
              )}
            </button>
          </div>

          {/* 2. ÁREA DE RESPUESTA GENERADA POR ANTIGRAVITY */}
          {jugadaActiva && (
            <div className="pt-3 border-t border-primary/20 space-y-3 animate-in fade-in duration-200">
              {/* Explicación Estratégica */}
              <div className="bg-surface-container p-3 rounded-xl border border-primary/20 space-y-1">
                <span className="text-[10px] font-bold text-primary flex items-center gap-1">
                  <Sparkles className="h-3 w-3" />
                  <span>Estrategia de Antigravity (Español):</span>
                </span>
                <p className="text-xs text-on-surface leading-relaxed">
                  {jugadaActiva.estrategia_explicacion_es}
                </p>
              </div>

              {/* Vista Dual: Português + Español */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Português */}
                <div className="rounded-xl bg-surface-container p-3.5 border-2 border-primary/40 space-y-2 flex flex-col justify-between shadow-xs">
                  <div>
                    <div className="flex items-center justify-between pb-1.5 border-b border-outline-variant/15">
                      <span className="text-xs font-bold text-primary">
                        🇧🇷 Mensagem Pronta ({jugadaActiva.canal_recomendado})
                      </span>
                      <button
                        onClick={handleCopyJugada}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-primary text-xs font-bold text-primary-foreground hover:opacity-90 transition-opacity cursor-pointer"
                      >
                        {copiedJugada ? (
                          <>
                            <Check className="h-3 w-3 text-emerald-300" />
                            <span>¡Copiado!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3" />
                            <span>Copiar PT</span>
                          </>
                        )}
                      </button>
                    </div>

                    <p className="text-xs text-on-surface whitespace-pre-wrap font-sans mt-2 leading-relaxed">
                      {jugadaActiva.borrador_pt}
                    </p>
                  </div>
                </div>

                {/* Español */}
                <div className="rounded-xl bg-surface-container p-3.5 border border-outline-variant/20 space-y-2">
                  <div className="pb-1.5 border-b border-outline-variant/15">
                    <span className="text-xs font-bold text-amber-500">
                      🇪🇸 Traducción / Contexto (Español)
                    </span>
                  </div>
                  <p className="text-xs text-on-surface-variant whitespace-pre-wrap leading-relaxed mt-2">
                    {jugadaActiva.traduccion_es}
                  </p>
                </div>
              </div>

              {/* Refinamiento */}
              <RefinamientoChat onRefinar={handleRefinarJugada} loading={refining} />

              {/* Botón Guardar en Hilo */}
              <div className="flex items-center justify-between pt-1">
                <button
                  onClick={() => setJugadaActiva(null)}
                  className="text-xs text-on-surface-variant hover:underline cursor-pointer"
                >
                  Descartar propuesta
                </button>

                {onSaveInteraccion && (
                  <button
                    onClick={handleGuardarJugadaEnviada}
                    disabled={savingJugada}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-xs font-bold text-white transition-colors shadow-sm cursor-pointer disabled:opacity-50"
                  >
                    {savingJugada ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Send className="h-3.5 w-3.5" />
                    )}
                    <span>Guardar Mensaje Enviado en el Hilo</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. LISTA CRONOLÓGICA DE HITOS */}
      <div className="space-y-3">
        <div className="flex items-center justify-between pb-1">
          <h4 className="text-xs font-bold text-on-surface flex items-center gap-2">
            <span>📜 Hilo Cronológico de la Relación</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-semibold">
              {interacciones.length} hitos registrados
            </span>
          </h4>
          <span className="text-[10px] text-on-surface-variant">Más reciente primero</span>
        </div>

        {(!interacciones || interacciones.length === 0) && (
          <div className="p-8 rounded-2xl bg-surface-container border border-outline-variant/15 text-center text-on-surface-variant">
            <MessageSquare className="h-8 w-8 mx-auto opacity-30 mb-2 text-primary" />
            <p className="text-xs font-bold text-on-surface">Sin interacciones registradas aún</p>
            <p className="text-[11px] mt-1 text-on-surface-variant max-w-sm mx-auto">
              Pega capturas del chat o presiona el botón de Antigravity arriba para redactar el primer mensaje.
            </p>
          </div>
        )}

        <div className="space-y-2.5">
          {interacciones.map((item, index) => {
            const hasDualReply = Boolean(item.borrador_pt && item.borrador_pt.trim().length > 0)

            return (
              <div
                key={item.id || index}
                className="rounded-xl bg-surface-container border border-outline-variant/20 overflow-hidden shadow-xs text-xs transition-all hover:border-outline-variant/40"
              >
                {/* Header Compacto del Hito */}
                <div className="p-3 flex items-start justify-between gap-3 bg-surface-container-high/30">
                  <div className="flex items-start gap-2.5 min-w-0">
                    <div className="h-7 w-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 font-bold text-[11px] shadow-xs">
                      {item.canal === "WhatsApp" ? "WA" : item.canal === "Email" ? "EM" : "IN"}
                    </div>

                    <div className="min-w-0 space-y-0.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-on-surface text-xs">
                          {item.intencion_detectada || "Interacción Comercial"}
                        </span>
                        <span className="text-[9px] px-1.5 py-0.2 rounded-md bg-surface-container-highest border border-outline-variant/20 text-on-surface-variant font-medium">
                          {item.canal}
                        </span>
                      </div>

                      <p className="text-[10px] text-on-surface-variant flex items-center gap-1">
                        <Clock className="h-2.5 w-2.5" />
                        <span>{formatFecha(item.created_at)}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {hasDualReply && (
                      <button
                        onClick={() => handleCopy(item.id, item.borrador_pt)}
                        className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-surface-container-high hover:bg-primary/15 text-on-surface hover:text-primary transition-colors text-[10px] font-semibold cursor-pointer"
                        title="Copiar mensaje"
                      >
                        {copiedId === item.id ? (
                          <>
                            <Check className="h-3 w-3 text-emerald-500" />
                            <span className="text-emerald-500">Copiado</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3" />
                            <span>Copiar PT</span>
                          </>
                        )}
                      </button>
                    )}

                    {onDeleteInteraccion && item.id && (
                      <button
                        onClick={() => handleDeleteInteraccionItem(item.id)}
                        disabled={deletingId === item.id}
                        className="p-1 rounded-md text-on-surface-variant/40 hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                        title="Eliminar este hito del historial"
                      >
                        {deletingId === item.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin text-rose-500" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5" />
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {/* Cuerpo del Hito Enriquecido */}
                <div className="p-3 space-y-3 border-t border-outline-variant/10">
                  <p className="text-xs text-on-surface leading-relaxed whitespace-pre-line">
                    {item.resumen_es}
                  </p>

                  {/* Tarjetas de Contactos Referidos / Derivaciones */}
                  {item.contactos_referidos && item.contactos_referidos.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                        <span>🌟 {item.contactos_referidos.length} Contacto(s) / Derivación(es) Facilitada(s):</span>
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {item.contactos_referidos.map((ref, idx) => (
                          <div key={idx} className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs space-y-0.5">
                            <p className="font-bold text-on-surface flex items-center justify-between">
                              <span>👤 {ref.nombre}</span>
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-semibold uppercase">Referido</span>
                            </p>
                            {ref.cargo && <p className="text-[11px] text-on-surface-variant font-medium">{ref.cargo}</p>}
                            {ref.contacto && (
                              <p className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold">{ref.contacto}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Próximo Paso Sugerido del Hito */}
                  {item.proxima_accion_sugerida && (
                    <div className="flex items-start gap-2 text-xs font-semibold text-primary bg-primary/5 p-2.5 rounded-lg border border-primary/20">
                      <span className="shrink-0">💡 Próximo Paso Sugerido:</span>
                      <span className="text-on-surface font-normal leading-relaxed">
                        {item.proxima_accion_sugerida}
                      </span>
                    </div>
                  )}

                  {(item.traduccion_es || (item.mensaje_final_enviado && item.mensaje_final_enviado !== item.proxima_accion_sugerida)) && (
                    <div className="flex items-start gap-2 bg-surface-container-high/40 p-2.5 rounded-lg border border-outline-variant/15 text-[11px] text-on-surface-variant italic">
                      <Quote className="h-3.5 w-3.5 text-primary shrink-0 opacity-70 mt-0.5" />
                      <span className="leading-snug">{item.traduccion_es || item.mensaje_final_enviado}</span>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
