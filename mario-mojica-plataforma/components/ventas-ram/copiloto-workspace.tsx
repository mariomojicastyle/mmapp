"use client"

import React, { useState, useEffect, useRef } from "react"
import {
  UploadCloud,
  Sparkles,
  Copy,
  Check,
  Flame,
  Clock,
  Save,
  Trash2,
  Edit,
  Loader2,
  FileText,
  Image as ImageIcon,
  Building2,
  MessageSquare,
  History,
  Plus,
  X,
  Send,
  MessageCircle,
  RefreshCw,
  UserCheck,
  Mic,
  MicOff,
} from "lucide-react"
import {
  VentasProspecto,
  VentasInteraccion,
  AnalisisIAResponse,
  TemperaturaLead,
  CanalContacto,
} from "@/lib/types/ventas-ram"
import { RefinamientoChat } from "./refinamiento-chat"
import { HistorialTimeline } from "./historial-timeline"

interface CopilotoWorkspaceProps {
  prospecto: VentasProspecto | null
  todosLosProspectos?: VentasProspecto[]
  interacciones: VentasInteraccion[]
  onEditProspecto: () => void
  onSaveProspecto?: (data: Partial<VentasProspecto>) => Promise<void>
  onDeleteProspecto: () => void
  onChangeTemperatura: (temp: TemperaturaLead) => void
  onSaveInteraccion: (data: Omit<VentasInteraccion, "id" | "created_at">) => Promise<void>
}

export function CopilotoWorkspace({
  prospecto,
  todosLosProspectos = [],
  interacciones,
  onEditProspecto,
  onSaveProspecto,
  onDeleteProspecto,
  onChangeTemperatura,
  onSaveInteraccion,
}: CopilotoWorkspaceProps) {
  const [workspaceMode, setWorkspaceMode] = useState<"analisis" | "historia">("analisis")
  const [imagenesBase64, setImagenesBase64] = useState<string[]>([])
  const [textoManual, setTextoManual] = useState("")
  const [canalSeleccionado, setCanalSeleccionado] = useState<CanalContacto>("LinkedIn")

  // Prospectos a quienes este contacto apadrinó o refirió
  const prospectosApadrinados = React.useMemo(() => {
    if (!prospecto || !todosLosProspectos || todosLosProspectos.length === 0) return []
    const firstName = (prospecto.contacto_nombre || "").toLowerCase().split(" ")[0]
    const lastName = (prospecto.contacto_nombre || "").toLowerCase().split(" ")[1] || ""
    return todosLosProspectos.filter((p) => {
      if (p.id === prospecto.id) return false
      if (p.referido_por_id === prospecto.id) return true
      if (p.referido_por_nombre) {
        const refLower = p.referido_por_nombre.toLowerCase()
        if (firstName && firstName.length > 2 && refLower.includes(firstName)) return true
        if (lastName && lastName.length > 3 && refLower.includes(lastName)) return true
      }
      return false
    })
  }, [prospecto, todosLosProspectos])

  // Estados de IA
  const [analyzing, setAnalyzing] = useState(false)
  const [updatingProfile, setUpdatingProfile] = useState(false)
  const [refining, setRefining] = useState(false)
  const [analisisActual, setAnalisisActual] = useState<AnalisisIAResponse | null>(null)
  const [mostrarBorradorRespuesta, setMostrarBorradorRespuesta] = useState(false)
  const [copiedPT, setCopiedPT] = useState(false)
  const [savingInteraction, setSavingInteraction] = useState(false)

  // Dictado de voz para comentarios
  const [isListeningComment, setIsListeningComment] = useState(false)
  const commentRecognitionRef = useRef<any>(null)
  const commentManualStopRef = useRef(false)

  useEffect(() => {
    return () => {
      if (commentRecognitionRef.current) {
        try {
          commentRecognitionRef.current.stop()
        } catch {}
      }
    }
  }, [])

  const toggleListeningComment = () => {
    if (isListeningComment) {
      commentManualStopRef.current = true
      setIsListeningComment(false)
      if (commentRecognitionRef.current) {
        try {
          commentRecognitionRef.current.stop()
        } catch {}
      }
      return
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition

    if (!SpeechRecognition) {
      alert("Tu navegador no soporta dictado por voz nativo.")
      return
    }

    try {
      commentManualStopRef.current = false
      const recognition = new SpeechRecognition()
      recognition.lang = "es-CO"
      recognition.continuous = true
      recognition.interimResults = true

      recognition.onstart = () => {
        setIsListeningComment(true)
      }

      recognition.onresult = (event: any) => {
        let newFinal = ""
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            newFinal += event.results[i][0].transcript + " "
          }
        }
        if (newFinal.trim()) {
          setTextoManual((prev) => {
            const trimmed = prev.trim()
            return trimmed ? `${trimmed} ${newFinal.trim()}` : newFinal.trim()
          })
        }
      }

      recognition.onerror = (event: any) => {
        console.warn("Speech recognition error:", event.error)
        if (event.error !== "no-speech") {
          setIsListeningComment(false)
        }
      }

      recognition.onend = () => {
        if (!commentManualStopRef.current) {
          try {
            recognition.start()
          } catch {
            setIsListeningComment(false)
          }
        } else {
          setIsListeningComment(false)
        }
      }

      commentRecognitionRef.current = recognition
      recognition.start()
    } catch (e) {
      console.error("Error iniciando speech recognition:", e)
      setIsListeningComment(false)
    }
  }

  const fileInputRef = useRef<HTMLInputElement>(null)

  // Sincronizar canal preferido al cambiar de prospecto
  useEffect(() => {
    if (prospecto) {
      setCanalSeleccionado(prospecto.canal_preferido)
      setAnalisisActual(null)
      setMostrarBorradorRespuesta(false)
      setImagenesBase64([])
      setTextoManual("")
    }
  }, [prospecto?.id])

  const compressImage = (dataUrl: string, maxDim = 1024, quality = 0.72): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image()
      img.onload = () => {
        let { width, height } = img
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width)
            width = maxDim
          } else {
            width = Math.round((width * maxDim) / height)
            height = maxDim
          }
        }
        const canvas = document.createElement("canvas")
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext("2d")
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height)
          resolve(canvas.toDataURL("image/jpeg", quality))
        } else {
          resolve(dataUrl)
        }
      }
      img.onerror = () => resolve(dataUrl)
      img.src = dataUrl
    })
  }

  // Listener Global de Teclado para Pegar Múltiples Capturas con Ctrl+V
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (!e.clipboardData) return
      const items = e.clipboardData.items
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf("image") !== -1) {
          const file = items[i].getAsFile()
          if (file) {
            const reader = new FileReader()
            reader.onload = async (event) => {
              if (event.target?.result) {
                const rawImg = event.target.result as string
                const compressed = await compressImage(rawImg)
                setImagenesBase64((prev) => [...prev, compressed])
                setWorkspaceMode("analisis")
              }
            }
            reader.readAsDataURL(file)
            e.preventDefault()
            break
          }
        }
      }
    }

    window.addEventListener("paste", handlePaste)
    return () => window.removeEventListener("paste", handlePaste)
  }, [])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      Array.from(files).forEach((file) => {
        const reader = new FileReader()
        reader.onload = async (event) => {
          if (event.target?.result) {
            const rawImg = event.target.result as string
            const compressed = await compressImage(rawImg)
            setImagenesBase64((prev) => [...prev, compressed])
          }
        }
        reader.readAsDataURL(file)
      })
    }
  }

  const handleRemoveImage = (index: number) => {
    setImagenesBase64((prev) => prev.filter((_, i) => i !== index))
  }

  // Ejecutar Análisis de IA del Evento / Chat (con reintento automático)
  const handleAnalizar = async () => {
    if (imagenesBase64.length === 0 && !textoManual.trim()) return

    setAnalyzing(true)
    setMostrarBorradorRespuesta(false)
    try {
      let res = await fetch("/api/ventas-ram/analizar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imagenes_base64: imagenesBase64,
          texto_adicional: textoManual.trim() || undefined,
          prospecto_nombre: prospecto?.contacto_nombre,
          empresa: prospecto?.empresa,
        }),
      })

      // Reintento automático silencioso si ocurre un micro-corte
      if (!res.ok) {
        await new Promise((r) => setTimeout(r, 600))
        res = await fetch("/api/ventas-ram/analizar", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            imagenes_base64: imagenesBase64,
            texto_adicional: textoManual.trim() || undefined,
            prospecto_nombre: prospecto?.contacto_nombre,
            empresa: prospecto?.empresa,
          }),
        })
      }

      if (!res.ok) throw new Error("Error en el análisis de IA")
      const data: AnalisisIAResponse & { canal_detectado?: CanalContacto } = await res.json()
      setAnalisisActual(data)

      if (data.canal_detectado) {
        setCanalSeleccionado(data.canal_detectado)
      }

      if (data.termometro && prospecto) {
        onChangeTemperatura(data.termometro)
      }
    } catch (err) {
      console.error("Error analizando:", err)
      alert("Ocurrió un error al analizar la interacción. Por favor intenta de nuevo.")
    } finally {
      setAnalyzing(false)
    }
  }

  // Actualizar Ficha de Contacto Directamente desde la Captura de Perfil
  const handleActualizarFichaConCaptura = async () => {
    if (!prospecto || !onSaveProspecto) return
    if (imagenesBase64.length === 0 && !textoManual.trim()) return

    setUpdatingProfile(true)
    try {
      const res = await fetch("/api/ventas-ram/extraer-perfil", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imagen_base64: imagenesBase64[0] || null,
          url_o_texto: textoManual.trim() || null,
        }),
      })

      if (!res.ok) throw new Error("Error extrayendo datos de perfil")
      const data = await res.json()

      const updates: Partial<VentasProspecto> = {
        id: prospecto.id,
        empresa: data.empresa || prospecto.empresa,
        contacto_nombre: data.contacto_nombre || prospecto.contacto_nombre,
        contacto_cargo: data.contacto_cargo || prospecto.contacto_cargo,
        contacto_telefono: data.contacto_telefono || prospecto.contacto_telefono,
        perfil_url: data.perfil_url || prospecto.perfil_url,
        pais: data.pais || prospecto.pais,
        notas_estrategicas: data.notas_estrategicas
          ? `${prospecto.notas_estrategicas ? `${prospecto.notas_estrategicas}\n\n` : ""}${data.notas_estrategicas}`
          : prospecto.notas_estrategicas,
      }

      await onSaveProspecto(updates)
      alert(`¡Ficha actualizada con éxito!\nEmpresa: ${updates.empresa}\nCargo: ${updates.contacto_cargo || "N/A"}`)
      setImagenesBase64([])
      setTextoManual("")
    } catch (err) {
      console.error("Error actualizando perfil:", err)
      alert("No se pudo extraer la información del perfil.")
    } finally {
      setUpdatingProfile(false)
    }
  }

  // Refinar Respuesta con Chat de IA
  const handleRefinar = async (instruccion: string) => {
    if (!analisisActual) return

    setRefining(true)
    try {
      const res = await fetch("/api/ventas-ram/refinar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          borrador_actual_pt: analisisActual.borrador_pt,
          instruccion_ajuste: instruccion,
          contexto: {
            empresa: prospecto?.empresa,
            contacto: prospecto?.contacto_nombre,
            analisis_es: analisisActual.analisis_es,
          },
        }),
      })

      if (!res.ok) throw new Error("Error refinando respuesta")
      const data = await res.json()

      setAnalisisActual((prev) =>
        prev
          ? {
              ...prev,
              borrador_pt: data.borrador_pt,
              traduccion_es: data.traduccion_es,
            }
          : null
      )
    } catch (err) {
      console.error("Error refinando:", err)
      alert("No se pudo refinar la respuesta.")
    } finally {
      setRefining(false)
    }
  }

  // Copiar al Portapapeles
  const handleCopyPT = () => {
    if (!analisisActual?.borrador_pt) return
    navigator.clipboard.writeText(analisisActual.borrador_pt)
    setCopiedPT(true)
    setTimeout(() => setCopiedPT(false), 2000)
  }

  // Guardar en Bitácora / Historial
  const handleGuardarInteraccion = async (incluirBorrador = false) => {
    if (!prospecto || !analisisActual) return

    setSavingInteraction(true)
    try {
      await onSaveInteraccion({
        prospecto_id: prospecto.id,
        canal: canalSeleccionado,
        tipo_entrada: imagenesBase64.length > 0 ? "screenshot" : "texto",
        imagen_url: null,
        resumen_es: analisisActual.analisis_es,
        intencion_detectada: analisisActual.intencion_detectada,
        termometro: analisisActual.termometro || prospecto.temperatura,
        borrador_pt: incluirBorrador ? analisisActual.borrador_pt : "",
        traduccion_es: incluirBorrador ? analisisActual.traduccion_es : "",
        mensaje_final_enviado: incluirBorrador
          ? (analisisActual.traduccion_es || analisisActual.borrador_pt)
          : (analisisActual.proxima_accion_sugerida || "Hito registrado en el historial."),
      })

      // Actualizar automáticamente la próxima acción y el plazo del Radar (48 horas)
      if (onSaveProspecto && analisisActual.proxima_accion_sugerida) {
        await onSaveProspecto({
          id: prospecto.id,
          proxima_accion_descripcion: analisisActual.proxima_accion_sugerida,
          proxima_accion_at: new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
          temperatura: analisisActual.termometro || prospecto.temperatura,
        })
      }

      setAnalisisActual(null)
      setMostrarBorradorRespuesta(false)
      setImagenesBase64([])
      setTextoManual("")
      setWorkspaceMode("historia")
    } finally {
      setSavingInteraction(false)
    }
  }

  if (!prospecto) {
    return (
      <div className="flex flex-col items-center justify-center h-full rounded-2xl bg-surface-container border border-outline-variant/20 p-8 text-center text-on-surface-variant">
        <Building2 className="h-12 w-12 opacity-30 mb-3 text-primary" />
        <h3 className="text-base font-bold text-on-surface">Selecciona un prospecto</h3>
        <p className="text-xs max-w-sm mt-1">
          Elige un cliente en la columna izquierda o crea uno nuevo para archivar eventos y generar estrategias.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full rounded-2xl bg-surface-container border border-outline-variant/20 shadow-sm overflow-hidden">
      {/* Header del Prospecto */}
      <div className="p-4 border-b border-outline-variant/15 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface-container-high/40">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-on-surface">{prospecto.empresa}</h2>
            <span className="text-xs text-on-surface-variant">({prospecto.pais})</span>
          </div>
          <p className="text-xs text-on-surface/90 font-medium">
            {prospecto.contacto_nombre}
            {prospecto.contacto_cargo ? ` • ${prospecto.contacto_cargo}` : ""}
            {prospecto.contacto_telefono ? ` • 📞 ${prospecto.contacto_telefono}` : ""}
          </p>

          {/* Relación / Puente en la Red */}
          {prospecto.referido_por_nombre && (
            <div className="flex items-center gap-1.5 mt-1.5 text-[11px] text-amber-500 font-semibold bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 rounded-lg w-fit">
              <span>🔗 Puente Relacional:</span>
              <span className="text-on-surface font-medium">{prospecto.referido_por_nombre}</span>
              {prospecto.tipo_relacion && (
                <span className="text-[10px] text-on-surface-variant font-normal">
                  — {prospecto.tipo_relacion}
                </span>
              )}
            </div>
          )}

          {prospectosApadrinados.length > 0 && (
            <div className="flex items-center gap-1.5 mt-1.5 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-lg w-fit">
              <span>🌟 Rol en la Red:</span>
              <span className="text-on-surface font-medium">
                Padrino B2B & Super-Conector (Abrió la puerta con{" "}
                {prospectosApadrinados.map((ap) => `${ap.contacto_nombre} en ${ap.empresa}`).join(", ")})
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Selector Rápido de Temperatura */}
          <select
            value={prospecto.temperatura}
            onChange={(e) => onChangeTemperatura(e.target.value as TemperaturaLead)}
            className="px-2.5 py-1.5 text-xs font-semibold rounded-xl bg-surface-container border border-outline-variant/30 text-on-surface focus:outline-none focus:border-primary cursor-pointer"
          >
            <option value="caliente">🔥 Caliente</option>
            <option value="tibio">🟡 Tibio</option>
            <option value="enfriando">🔴 En riesgo</option>
            <option value="pausado">⏸️ Pausado</option>
            <option value="cerrado_ganado">🎉 Ganado</option>
            <option value="cerrado_perdido">❌ Perdido</option>
          </select>

          <button
            onClick={onEditProspecto}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-surface-container border border-outline-variant/30 text-on-surface hover:text-primary hover:border-primary/50 transition-colors text-xs font-semibold cursor-pointer"
            title="Editar o enriquecer ficha"
          >
            <Edit className="h-3.5 w-3.5" />
            <span>Editar Ficha</span>
          </button>

          <button
            onClick={onDeleteProspecto}
            className="p-1.5 rounded-xl text-on-surface-variant hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
            title="Eliminar prospecto"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Selector de Modo de Trabajo: Archivar/Analizar vs Hilo Completo */}
      <div className="px-4 pt-3 pb-0 border-b border-outline-variant/15 flex items-center gap-2 bg-surface-container-high/20">
        <button
          onClick={() => setWorkspaceMode("analisis")}
          className={`flex items-center gap-2 px-3.5 py-2 border-b-2 text-xs font-bold transition-all cursor-pointer ${
            workspaceMode === "analisis"
              ? "border-primary text-primary"
              : "border-transparent text-on-surface-variant hover:text-on-surface"
          }`}
        >
          <Sparkles className="h-3.5 w-3.5" />
          <span>⚡ Analizar & Archivar Evento (Ctrl+V)</span>
        </button>

        <button
          onClick={() => setWorkspaceMode("historia")}
          className={`flex items-center gap-2 px-3.5 py-2 border-b-2 text-xs font-bold transition-all cursor-pointer ${
            workspaceMode === "historia"
              ? "border-primary text-primary"
              : "border-transparent text-on-surface-variant hover:text-on-surface"
          }`}
        >
          <History className="h-3.5 w-3.5" />
          <span>💬 Hilo de Conversación Completo ({interacciones.length})</span>
        </button>
      </div>

      {/* Contenido Desplazable del Workspace */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {/* MODO 1: ANALIZAR / ARCHIVAR */}
        {workspaceMode === "analisis" && (
          <div className="space-y-4">
            {/* Zona de Ingesta Unificada (Capturas + Comentarios Simultáneos) */}
            <div className="rounded-2xl bg-surface-container-high/40 border border-outline-variant/20 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1.5 text-xs font-bold text-on-surface">
                    <ImageIcon className="h-4 w-4 text-primary" />
                    <span>Capturas & Comentarios</span>
                  </span>
                  {imagenesBase64.length > 0 && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/15 text-primary">
                      {imagenesBase64.length} {imagenesBase64.length === 1 ? "captura" : "capturas"}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1.5 text-[11px] text-on-surface-variant font-medium bg-surface-container px-2.5 py-1 rounded-lg border border-outline-variant/15">
                  <span>🤖 Canal:</span>
                  <span className="text-primary font-bold">{canalSeleccionado || "Auto"}</span>
                </div>
              </div>

              {/* Galería de Capturas */}
              <div className="space-y-2.5">
                {imagenesBase64.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {imagenesBase64.map((img, index) => (
                      <div
                        key={index}
                        className="relative rounded-xl overflow-hidden border border-outline-variant/30 bg-surface-container group"
                      >
                        <img
                          src={img}
                          alt={`Captura ${index + 1}`}
                          className="h-28 w-full object-contain bg-black/5 p-1"
                        />
                        <div className="absolute top-1 left-1 px-1.5 py-0.2 rounded bg-black/75 text-white text-[9px] font-bold">
                          #{index + 1}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(index)}
                          className="absolute top-1 right-1 h-5 w-5 rounded-full bg-rose-500 hover:bg-rose-600 text-white flex items-center justify-center shadow cursor-pointer"
                          title="Eliminar captura"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}

                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="h-28 border-2 border-dashed border-outline-variant/40 hover:border-primary/60 rounded-xl flex flex-col items-center justify-center p-2 text-center cursor-pointer transition-colors bg-surface-container/40 group"
                    >
                      <Plus className="h-5 w-5 text-primary group-hover:scale-110 transition-transform mb-1" />
                      <span className="text-[10px] font-bold text-on-surface">Añadir (+ Ctrl+V)</span>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-outline-variant/40 hover:border-primary/60 rounded-xl p-4 text-center cursor-pointer transition-colors bg-surface-container/50 group flex flex-col sm:flex-row items-center justify-center gap-3"
                  >
                    <UploadCloud className="h-6 w-6 text-primary group-hover:scale-110 transition-transform opacity-80 shrink-0" />
                    <div className="text-left">
                      <p className="text-xs font-bold text-on-surface">
                        Presiona <kbd className="px-1.5 py-0.5 rounded bg-surface-container-highest border border-outline-variant/30 text-primary font-mono text-[10px]">Ctrl + V</kbd> para pegar captura(s) del chat
                      </p>
                      <p className="text-[10px] text-on-surface-variant mt-0.5">
                        O haz clic aquí para subir imágenes desde tu equipo
                      </p>
                    </div>
                  </div>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>

              {/* Área de Texto / Comentario Integrado con Dictado de Voz */}
              <div className="relative">
                <textarea
                  rows={2}
                  value={textoManual}
                  onChange={(e) => setTextoManual(e.target.value)}
                  placeholder="Escribe un comentario para complementar las capturas (ej: 'No había visto que me respondió', 'Hablamos por llamada', etc.) o usa el micro..."
                  className="w-full p-2.5 pr-10 text-xs rounded-xl bg-surface-container border border-outline-variant/30 text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:border-primary resize-none"
                />
                <button
                  type="button"
                  onClick={toggleListeningComment}
                  className={`absolute right-2 bottom-3.5 p-1.5 rounded-lg transition-all cursor-pointer ${
                    isListeningComment
                      ? "bg-rose-500 text-white animate-pulse shadow-md"
                      : "text-on-surface-variant hover:text-primary hover:bg-surface-container-high"
                  }`}
                  title={isListeningComment ? "Grabando... clic para detener" : "Dictar comentario por voz"}
                >
                  {isListeningComment ? (
                    <MicOff className="h-4 w-4" />
                  ) : (
                    <Mic className="h-4 w-4" />
                  )}
                </button>
              </div>

              {/* Botones de Acción */}
              <div className="flex flex-col sm:flex-row items-center justify-end gap-2 pt-1">
                {/* Botón A: Actualizar Ficha de Contacto */}
                {imagenesBase64.length > 0 && (
                  <button
                    onClick={handleActualizarFichaConCaptura}
                    disabled={updatingProfile || analyzing}
                    className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-surface-container hover:bg-primary/10 border border-primary/30 text-xs font-bold text-primary transition-colors shadow-xs cursor-pointer disabled:opacity-50"
                  >
                    {updatingProfile ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        <span>Extrayendo perfil...</span>
                      </>
                    ) : (
                      <>
                        <UserCheck className="h-3.5 w-3.5" />
                        <span>🔄 Actualizar Ficha con esta Captura</span>
                      </>
                    )}
                  </button>
                )}

                {/* Botón B: Analizar Interacción / Chat */}
                <button
                  onClick={handleAnalizar}
                  disabled={(imagenesBase64.length === 0 && !textoManual.trim()) || analyzing || updatingProfile}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-primary text-xs font-bold text-primary-foreground hover:opacity-90 transition-opacity shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {analyzing ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Antigravity analizando {imagenesBase64.length > 0 ? `${imagenesBase64.length} capturas` : "texto"}...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-3.5 w-3.5" />
                      <span>⚡ Analizar & Extraer con Antigravity</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Resultado del Análisis / Diagnóstico */}
            {analisisActual && (
              <div className="space-y-3.5 animate-in fade-in duration-200">
                {/* Diagnóstico Ejecutivo */}
                <div className="rounded-2xl bg-surface-container border border-outline-variant/30 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-on-surface flex items-center gap-1.5">
                      <span>📋 Conclusión & Diagnóstico del Evento</span>
                      <span className="text-[9px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-semibold">
                        {analisisActual.intencion_detectada || "Hito Registrado"}
                      </span>
                    </span>

                    <span className="text-[11px] font-semibold text-amber-500 flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      <span>Timing: &lt; {analisisActual.timing_horas}h</span>
                    </span>
                  </div>

                  <p className="text-xs text-on-surface leading-relaxed bg-surface-container-high/40 p-3 rounded-xl border border-outline-variant/15">
                    {analisisActual.analisis_es}
                  </p>

                  {analisisActual.proxima_accion_sugerida && (
                    <div className="flex items-center gap-2 text-xs font-semibold text-primary bg-primary/5 p-2 rounded-lg border border-primary/20">
                      <span>💡 Próximo Paso Sugerido:</span>
                      <span className="text-on-surface font-normal">
                        {analisisActual.proxima_accion_sugerida}
                      </span>
                    </div>
                  )}

                  {/* Botones de Decisión: Solo Archivar vs Pedir Respuesta */}
                  <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-2 border-t border-outline-variant/15">
                    <button
                      onClick={() => handleGuardarInteraccion(false)}
                      disabled={savingInteraction}
                      className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-surface-container-high hover:bg-emerald-600/15 text-xs font-bold text-on-surface hover:text-emerald-500 border border-outline-variant/25 transition-colors cursor-pointer disabled:opacity-50"
                    >
                      <Save className="h-3.5 w-3.5 text-emerald-500" />
                      <span>📥 Archivar como Hito Pasado en el Hilo</span>
                    </button>

                    <button
                      onClick={() => setMostrarBorradorRespuesta(!mostrarBorradorRespuesta)}
                      className={`w-full sm:w-auto flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer ${
                        mostrarBorradorRespuesta
                          ? "bg-surface-container-highest text-on-surface border border-outline-variant/30"
                          : "bg-primary text-primary-foreground hover:opacity-90"
                      }`}
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      <span>
                        {mostrarBorradorRespuesta
                          ? "Ocultar Borrador"
                          : "⚡ Solicitar a Antigravity Respuesta para Enviar Ahora"}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Vista Dual de Respuesta (SOLO SI SE SOLICITA) */}
                {mostrarBorradorRespuesta && (
                  <div className="space-y-3.5 animate-in fade-in duration-200">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
                      {/* Caja A: Português */}
                      <div className="rounded-2xl bg-surface-container border-2 border-primary/40 p-4 space-y-2 flex flex-col justify-between shadow-xs">
                        <div>
                          <div className="flex items-center justify-between pb-2 border-b border-outline-variant/15">
                            <span className="text-xs font-bold text-primary flex items-center gap-1">
                              <span>🇧🇷 Mensagem Pronta (Português)</span>
                            </span>

                            <button
                              onClick={handleCopyPT}
                              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primary text-xs font-bold text-primary-foreground hover:opacity-90 transition-opacity cursor-pointer"
                            >
                              {copiedPT ? (
                                <>
                                  <Check className="h-3.5 w-3.5 text-emerald-300" />
                                  <span>¡Copiado!</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="h-3.5 w-3.5" />
                                  <span>Copiar PT</span>
                                </>
                              )}
                            </button>
                          </div>

                          <p className="text-xs text-on-surface whitespace-pre-wrap font-sans mt-3 leading-relaxed">
                            {analisisActual.borrador_pt}
                          </p>
                        </div>
                      </div>

                      {/* Caja B: Traducción en Español */}
                      <div className="rounded-2xl bg-surface-container border border-outline-variant/30 p-4 space-y-2">
                        <div className="flex items-center justify-between pb-2 border-b border-outline-variant/15">
                          <span className="text-xs font-bold text-amber-500">
                            🇪🇸 Traducción al Español (Contexto)
                          </span>
                        </div>

                        <p className="text-xs text-on-surface-variant whitespace-pre-wrap leading-relaxed mt-3">
                          {analisisActual.traduccion_es}
                        </p>
                      </div>
                    </div>

                    {/* Chat de Refinamiento */}
                    <RefinamientoChat onRefinar={handleRefinar} loading={refining} />

                    {/* Guardar con Respuesta */}
                    <div className="flex justify-end pt-1">
                      <button
                        onClick={() => handleGuardarInteraccion(true)}
                        disabled={savingInteraction}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-xs font-bold text-white transition-colors shadow-sm cursor-pointer disabled:opacity-50"
                      >
                        {savingInteraction ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Send className="h-3.5 w-3.5" />
                        )}
                        <span>Guardar Mensaje Enviado en Historial</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* MODO 2: HILO DE CONVERSACIÓN COMPLETO */}
        {workspaceMode === "historia" && (
          <div className="space-y-3">
            <HistorialTimeline
              interacciones={interacciones}
              prospecto={prospecto}
              onSaveInteraccion={onSaveInteraccion}
            />
          </div>
        )}
      </div>
    </div>
  )
}
