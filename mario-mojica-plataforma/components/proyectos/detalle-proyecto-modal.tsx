"use client"
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */

import React, { useState, useEffect, useRef } from "react"
import { X, Download, Paperclip, Image, FileText, Music, Cpu, Layers, Plus, Trash2, Loader2, Eye, ExternalLink, ChevronDown, ChevronUp, UploadCloud, CheckCircle2, AlertCircle, FileSpreadsheet, Box, Boxes, Coins, Hammer, Wrench, Sparkles, Volume2, Play, Square, Mic, Library, Camera } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { usePermissions } from "@/hooks/use-permissions"
import { createClient } from "@/lib/supabase/client"

export interface ItemDespiece {
  nombre: string
  esHerraje: boolean
  esFondo?: boolean
  cantidad: number
  costoUnitario?: number
  costoM2?: number
  largo?: number
  ancho?: number
  espesor?: number
  piezaNumero?: string
  piezaNumeroStart?: number
  piezaNumeroRange?: boolean
  piezasLista?: string[]
}

export function normalizarYAsignarPiezas(items: ItemDespiece[]): ItemDespiece[] {
  const tieneNumeracionGLB = items.some(d => !d.esHerraje && d.piezaNumeroStart !== undefined)

  const maderas = items.filter(d => !d.esHerraje && !d.esFondo)
  const fondos = items.filter(d => !d.esHerraje && d.esFondo)
  const herrajes = items.filter(d => d.esHerraje)

  const asegurarPiezasLista = (item: ItemDespiece, start: number) => {
    if (item.piezasLista && item.piezasLista.length > 0) return item.piezasLista
    const list: string[] = []
    for (let i = 0; i < item.cantidad; i++) {
      list.push(`Pieza ${String(start + i).padStart(2, "0")}`)
    }
    return list
  }

  if (tieneNumeracionGLB) {
    maderas.sort((a, b) => (a.piezaNumeroStart || 0) - (b.piezaNumeroStart || 0))
    fondos.sort((a, b) => (a.piezaNumeroStart || 0) - (b.piezaNumeroStart || 0))
    
    const maderasMapeadas = maderas.map(item => ({
      ...item,
      piezasLista: asegurarPiezasLista(item, item.piezaNumeroStart || 1)
    }))
    const fondosMapeados = fondos.map(item => ({
      ...item,
      piezasLista: asegurarPiezasLista(item, item.piezaNumeroStart || 1)
    }))
    
    return [...maderasMapeadas, ...fondosMapeados, ...herrajes]
  }

  maderas.sort((a, b) => {
    const nameComp = a.nombre.localeCompare(b.nombre)
    if (nameComp !== 0) return nameComp
    const largoComp = (b.largo || 0) - (a.largo || 0)
    if (largoComp !== 0) return largoComp
    const anchoComp = (b.ancho || 0) - (a.ancho || 0)
    if (anchoComp !== 0) return anchoComp
    return (b.espesor || 0) - (a.espesor || 0)
  })

  fondos.sort((a, b) => {
    const nameComp = a.nombre.localeCompare(b.nombre)
    if (nameComp !== 0) return nameComp
    const largoComp = (b.largo || 0) - (a.largo || 0)
    if (largoComp !== 0) return largoComp
    const anchoComp = (b.ancho || 0) - (a.ancho || 0)
    if (anchoComp !== 0) return anchoComp
    return (b.espesor || 0) - (a.espesor || 0)
  })

  let piezaCounter = 1

  const formatearRange = (start: number, qty: number): string => {
    if (qty === 1) {
      return `Pieza ${String(start).padStart(2, "0")}`
    }
    const end = start + qty - 1
    if (qty === 2) {
      return `Pieza ${String(start).padStart(2, "0")} y Pieza ${String(end).padStart(2, "0")}`
    }
    return `Pieza ${String(start).padStart(2, "0")} a Pieza ${String(end).padStart(2, "0")}`
  }

  const maderasConCodigo = maderas.map(item => {
    const startNum = piezaCounter
    piezaCounter += item.cantidad
    const codigo = formatearRange(startNum, item.cantidad)
    return { 
      ...item, 
      piezaNumero: codigo, 
      piezaNumeroStart: startNum, 
      piezaNumeroRange: item.cantidad > 1,
      piezasLista: asegurarPiezasLista(item, startNum)
    }
  })

  const fondosConCodigo = fondos.map(item => {
    const startNum = piezaCounter
    piezaCounter += item.cantidad
    const codigo = formatearRange(startNum, item.cantidad)
    return { 
      ...item, 
      piezaNumero: codigo, 
      piezaNumeroStart: startNum, 
      piezaNumeroRange: item.cantidad > 1,
      piezasLista: asegurarPiezasLista(item, startNum)
    }
  })

  return [...maderasConCodigo, ...fondosConCodigo, ...herrajes]
}

interface DetalleProyectoModalProps {
  isOpen: boolean
  onClose: () => void
  proyecto: {
    id: string
    nombre: string
    tipo_proyecto: "Aplicativo de armado" | "B2B" | "B2C" | "Genérico"
    estado: string
    progreso: number
    created_at: string
    codigo_manual?: string | null
    profiles?: {
      full_name: string
      company: string
      email: string
    }
    solicitudes?: {
      id: number
      titulo: string
      descripcion: string
      adjuntos: string[]
      estado: string
      created_at: string
    }
  } | null
  onUpdate?: () => void
}

export function DetalleProyectoModal({ isOpen, onClose, proyecto, onUpdate }: DetalleProyectoModalProps) {
  const { isSuperAdmin, isCoequipero } = usePermissions()
  const [activeTab, setActiveTab] = useState<"solicitud" | "insumos" | "despiece">("solicitud")
  const [error, setError] = useState("")
  const [successMsg, setSuccessMsg] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [codigoManual, setCodigoManual] = useState("")

  const [configId, setConfigId] = useState<string | null>(null)
  const [colorPrimario, setColorPrimario] = useState("#0D9488")
  const [colorSecundario, setColorSecundario] = useState("#111827")
  const [colorTextoBotones, setColorTextoBotones] = useState("#ffffff")
  const [opacidadManual, setOpacidadManual] = useState(100)
  const [logoUrl, setLogoUrl] = useState("")
  const [faviconUrl, setFaviconUrl] = useState("")
  
  // Opciones de personalización de Tipografía avanzadas
  const [fontTitle, setFontTitle] = useState("Inter")
  const [fontTitleSize, setFontTitleSize] = useState("1.5rem")
  const [fontTitleColor, setFontTitleColor] = useState("#FFFFFF")
  
  const [fontBody, setFontBody] = useState("Inter")
  const [fontBodySize, setFontBodySize] = useState("0.9rem")
  const [fontBodyColor, setFontBodyColor] = useState("#BEC8CE")

  // Estados para texturas PBR (Piso y Paredes/Escenario)
  const [pbrFloorDiff, setPbrFloorDiff] = useState("")
  const [pbrFloorNormal, setPbrFloorNormal] = useState("")
  const [pbrFloorRoughness, setPbrFloorRoughness] = useState("")
  const [pbrFloorHeight, setPbrFloorHeight] = useState("")
  const [pbrWallDiff, setPbrWallDiff] = useState("")
  const [pbrWallNormal, setPbrWallNormal] = useState("")
  const [pbrWallRoughness, setPbrWallRoughness] = useState("")
  const [pbrWallHeight, setPbrWallHeight] = useState("")

  // Insumos State
  const [glbSteps, setGlbSteps] = useState<{ step: string; fileName: string; progress: number; cameraPosition?: number[]; cameraTarget?: number[] }[]>([])
  const [tempPosInputs, setTempPosInputs] = useState<Record<string, string>>({})
  const [tempTgtInputs, setTempTgtInputs] = useState<Record<string, string>>({})
  const [audioEsSteps, setAudioEsSteps] = useState<{ step: string; fileName: string }[]>([])
  const [audioEnSteps, setAudioEnSteps] = useState<{ step: string; fileName: string }[]>([])
  
  const [audioAyuda, setAudioAyuda] = useState<string>("")
  const [imgHerramientas, setImgHerramientas] = useState<string>("")
  const [ensambles, setEnsambles] = useState<string[]>([])
  const [garantiaDoc, setGarantiaDoc] = useState<string>("")
  const [herrajesFotos, setHerrajesFotos] = useState<string[]>([])
  const [renders, setRenders] = useState<string[]>([])

  const [sharedHerrajesLibrary, setSharedHerrajesLibrary] = useState<string[]>([])
  const [showSharedLibrary, setShowSharedLibrary] = useState(false)

  // TTS Config State
  const [ttsVoices, setTtsVoices] = useState({
    es_latam: "es-CO-GonzaloNeural",
    es_europe: "es-ES-AlvaroNeural",
    en: "en-US-GuyNeural"
  })
  const [ttsSaludo, setTtsSaludo] = useState({ texto_es: "", texto_en: "" })
  const [ttsAyuda, setTtsAyuda] = useState({ texto_es: "", texto_en: "" })
  const [ttsCantidadPasos, setTtsCantidadPasos] = useState(8)
  const [ttsPasos, setTtsPasos] = useState<{ paso: string; texto_es: string; texto_en: string }[]>([])
  const [generatingAudio, setGeneratingAudio] = useState<string | null>(null)
  const [downloadingAudio, setDownloadingAudio] = useState<string | null>(null)
  const [playingAudio, setPlayingAudio] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [generatingAll, setGeneratingAll] = useState(false)
  const [generationProgress, setGenerationProgress] = useState({ current: 0, total: 0 })
  const [translatingText, setTranslatingText] = useState<string | null>(null)
  const [cameraOverlayActive, setCameraOverlayActive] = useState(false)
  const [lightingEditorActive, setLightingEditorActive] = useState(false)
  const realtimeChannelRef = useRef<any>(null)
  const codigoManualRef = useRef(codigoManual)
  const proyectoRef = useRef(proyecto)

  useEffect(() => {
    proyectoRef.current = proyecto
  }, [proyecto])

  useEffect(() => {
    codigoManualRef.current = codigoManual
  }, [codigoManual])

  useEffect(() => {
    if (typeof window !== "undefined") {
      setCameraOverlayActive(localStorage.getItem('cameraOverlay') === 'on')
      setLightingEditorActive(localStorage.getItem('lightingEditor') === 'on')
    }

    const handleMessage = (event: MessageEvent) => {
      // Validar origen básico
      if (typeof event.origin === 'string' && !event.origin.includes('localhost') && !event.origin.includes('mariomojica.com')) {
        return
      }

      const { type, payload } = event.data || {}
      if (type === 'update-camera') {
        if (payload && payload.codigoManual === codigoManualRef.current) {
          const currentProyecto = proyectoRef.current
          if (!currentProyecto?.id) return
          
          setGlbSteps(prev => {
            const updated = prev.map(s => 
              s.step === payload.step 
                ? { ...s, cameraPosition: payload.cameraPosition, cameraTarget: payload.cameraTarget } 
                : s
            )
            
            const stepExists = prev.some(s => s.step === payload.step)
            if (!stepExists) {
              updated.push({
                step: payload.step,
                fileName: `P${payload.step}.glb`,
                progress: 100,
                cameraPosition: payload.cameraPosition,
                cameraTarget: payload.cameraTarget
              })
            }

            const supabaseClient = createClient()
            supabaseClient
              .from("configuraciones_manual")
              .update({ glb_pasos: updated })
              .eq("proyecto_id", currentProyecto.id)
              .then(({ error }) => {
                if (error) {
                  console.error("Error guardando glb_pasos desde postMessage:", error)
                } else {
                  console.log("glb_pasos guardado en Supabase vía postMessage ✓")
                  setSuccessMsg(`Cámara guardada para Paso ${payload.step} ✓`)
                }
              })

            return updated
          })
        }
      } else if (type === 'save-lighting') {
        if (payload && payload.codigoManual === codigoManualRef.current) {
          const currentProyecto = proyectoRef.current
          if (!currentProyecto?.id) return
          
          const supabaseClient = createClient()
          supabaseClient
            .from("configuraciones_manual")
            .update({ lighting_config: payload.lightingConfig })
            .eq("proyecto_id", currentProyecto.id)
            .then(({ error }) => {
              if (error) {
                console.error("Error guardando lighting_config desde postMessage:", error)
              } else {
                console.log("lighting_config guardado en Supabase vía postMessage ✓")
                setSuccessMsg("Configuración de iluminación guardada ✓")
              }
            })
        }
      }
    }

    const supabase = createClient()
    const channel = supabase.channel('manual-features-realtime')
    channel
      .on('broadcast', { event: 'update-camera' }, ({ payload }) => {
        if (payload && payload.codigoManual === codigoManualRef.current) {
          const currentProyecto = proyectoRef.current
          if (!currentProyecto?.id) return
          setGlbSteps(prev => {
            const updated = prev.map(s => 
              s.step === payload.step 
                ? { ...s, cameraPosition: payload.cameraPosition, cameraTarget: payload.cameraTarget } 
                : s
            )
            
            // Si el paso no existe, agregarlo
            const stepExists = prev.some(s => s.step === payload.step)
            if (!stepExists) {
              updated.push({
                step: payload.step,
                fileName: `P${payload.step}.glb`,
                progress: 100,
                cameraPosition: payload.cameraPosition,
                cameraTarget: payload.cameraTarget
              })
            }

            // Persistir en Supabase usando la sesión del CMS (bypass RLS)
            const supabaseClient = createClient()
            supabaseClient
              .from("configuraciones_manual")
              .update({ glb_pasos: updated })
              .eq("proyecto_id", currentProyecto.id)
              .then(({ error }) => {
                if (error) {
                  console.error("Error guardando glb_pasos desde el CMS:", error)
                } else {
                  console.log("glb_pasos guardado en Supabase desde el CMS ✓")
                  setSuccessMsg(`Cámara guardada para Paso ${payload.step} ✓`)
                }
              })

            return updated
          })
        }
      })
      .on('broadcast', { event: 'save-lighting' }, ({ payload }) => {
        if (payload && payload.codigoManual === codigoManualRef.current) {
          const currentProyecto = proyectoRef.current
          if (!currentProyecto?.id) return
          const supabaseClient = createClient()
          supabaseClient
            .from("configuraciones_manual")
            .update({ lighting_config: payload.lightingConfig })
            .eq("proyecto_id", currentProyecto.id)
            .then(({ error }) => {
              if (error) {
                console.error("Error guardando lighting_config desde el CMS:", error)
              } else {
                console.log("lighting_config guardado en Supabase desde el CMS ✓")
                setSuccessMsg("Configuración de iluminación guardada ✓")
              }
            })
        }
      })
      .subscribe()
    realtimeChannelRef.current = channel

    window.addEventListener('message', handleMessage)

    return () => {
      channel.unsubscribe()
      window.removeEventListener('message', handleMessage)
    }
  }, [])

  const TTS_VOICES_ES_LATAM = [
    { value: "es-CO-GonzaloNeural", label: "🇨🇴 Gonzalo (Colombia, Hombre)" },
    { value: "es-CO-SalomeNeural", label: "🇨🇴 Salomé (Colombia, Mujer)" },
    { value: "es-MX-JorgeNeural", label: "🇲🇽 Jorge (México, Hombre)" },
    { value: "es-MX-DaliaNeural", label: "🇲🇽 Dalia (México, Mujer)" },
    { value: "es-CL-LorenzoNeural", label: "🇨🇱 Lorenzo (Chile, Hombre)" },
    { value: "es-CL-CatalinaNeural", label: "🇨🇱 Catalina (Chile, Mujer)" },
    { value: "es-PE-AlexNeural", label: "🇵🇪 Alex (Perú, Hombre)" },
    { value: "es-PE-CamilaNeural", label: "🇵🇪 Camila (Perú, Mujer)" },
    { value: "es-VE-SebastianNeural", label: "🇻🇪 Sebastián (Venezuela, Hombre)" },
    { value: "es-VE-PaolaNeural", label: "🇻🇪 Paola (Venezuela, Mujer)" },
    { value: "es-US-AlonsoNeural", label: "🇺🇸 Alonso (EE.UU. Hispano, Hombre)" },
    { value: "es-US-PalomaNeural", label: "🇺🇸 Paloma (EE.UU. Hispano, Mujer)" },
  ]
  const TTS_VOICES_ES_EU = [
    { value: "es-ES-AlvaroNeural", label: "🇪🇸 Álvaro (España, Hombre)" },
    { value: "es-ES-ElviraNeural", label: "🇪🇸 Elvira (España, Mujer)" },
    { value: "es-ES-XimenaNeural", label: "🇪🇸 Ximena (España, Mujer)" },
  ]
  const TTS_VOICES_EN = [
    { value: "en-US-GuyNeural", label: "🇺🇸 Guy (EE.UU., Hombre)" },
    { value: "en-US-AriaNeural", label: "🇺🇸 Aria (EE.UU., Mujer)" },
    { value: "en-US-JennyNeural", label: "🇺🇸 Jenny (EE.UU., Mujer)" },
    { value: "en-US-ChristopherNeural", label: "🇺🇸 Christopher (EE.UU., Hombre)" },
    { value: "en-GB-RyanNeural", label: "🇬🇧 Ryan (Reino Unido, Hombre)" },
    { value: "en-GB-SoniaNeural", label: "🇬🇧 Sonia (Reino Unido, Mujer)" },
  ]

  // Sincronizar campos de pasos cuando cambia ttsCantidadPasos
  useEffect(() => {
    setTtsPasos(prev => {
      const newPasos = []
      for (let i = 1; i <= ttsCantidadPasos; i++) {
        const stepStr = String(i).padStart(2, "0")
        const existing = prev.find(p => p.paso === stepStr)
        newPasos.push(existing || { paso: stepStr, texto_es: "", texto_en: "" })
      }
      return newPasos
    })
  }, [ttsCantidadPasos])

  const handlePreviewVoice = async (voice: string) => {
    const sampleText = voice.startsWith("en") 
      ? "Hello! This is a voice preview for your interactive assembly manual."
      : "¡Hola! Esta es una muestra de voz para tu manual interactivo de armado."
    
    setGeneratingAudio(`preview_${voice}`)
    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: sampleText, voice })
      })
      if (!res.ok) throw new Error(await res.text())
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      if (audioRef.current) { audioRef.current.pause() }
      const audio = new Audio(url)
      audioRef.current = audio
      setPlayingAudio(`preview_${voice}`)
      audio.onended = () => { setPlayingAudio(null); URL.revokeObjectURL(url) }
      await audio.play()
    } catch (err: any) {
      setError(err.message || "Error al previsualizar la voz.")
    } finally {
      setGeneratingAudio(null)
    }
  }

  const handleGenerateAudio = async (stepId: string, text: string, lang: "es" | "es-ES" | "en", uploadToStorage = false) => {
    if (!text.trim()) {
      setError("El texto no puede estar vacío.")
      return
    }
    const voice = lang === "es" ? ttsVoices.es_latam : lang === "es-ES" ? ttsVoices.es_europe : ttsVoices.en
    const audioKey = `${stepId}_${lang}`
    setGeneratingAudio(uploadToStorage ? `${audioKey}_upload` : `${audioKey}_preview`)
    setError("")
    try {
      if (uploadToStorage && codigoManual) {
        const storagePath = lang === "es"
          ? `sounds/${stepId}.mp3`
          : `sounds/${lang}/${stepId}_${lang}.mp3`
        const res = await fetch("/api/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text, voice, codigoManual, storagePath })
        })
        if (!res.ok) { const err = await res.json(); throw new Error(err.error) }
        setSuccessMsg(`Audio ${audioKey} generado y subido a Storage ✓`)
      } else {
        const res = await fetch("/api/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text, voice })
        })
        if (!res.ok) throw new Error(await res.text())
        const blob = await res.blob()
        const url = URL.createObjectURL(blob)
        if (audioRef.current) { audioRef.current.pause() }
        const audio = new Audio(url)
        audioRef.current = audio
        setPlayingAudio(audioKey)
        audio.onended = () => { setPlayingAudio(null); URL.revokeObjectURL(url) }
        await audio.play()
      }
    } catch (err: any) {
      setError(err.message || "Error al generar el audio.")
    } finally {
      setGeneratingAudio(null)
    }
  }

  const handleStopAudio = () => {
    if (audioRef.current) { audioRef.current.pause(); audioRef.current.currentTime = 0 }
    setPlayingAudio(null)
  }

  const handleDownloadAudio = async (stepId: string, lang: "es" | "en") => {
    if (!codigoManual) {
      setError("Define el código de carpeta primero.")
      return
    }
    setError("")
    setSuccessMsg("")
    const audioKey = `${stepId}_${lang}`
    setDownloadingAudio(audioKey)

    // La ruta en Storage depende del idioma (es / en)
    const storagePath = lang === "es"
      ? `sounds/${stepId}.mp3`
      : `sounds/${lang}/${stepId}_${lang}.mp3`

    try {
      const supabase = createClient()
      const { data } = supabase.storage
        .from("insumos_manuales")
        .getPublicUrl(`${codigoManual}/${storagePath}`)

      if (!data?.publicUrl) {
        throw new Error("No se pudo obtener la URL del archivo.")
      }

      // Intentar fetch directo para forzar la descarga del Blob (evita que el navegador solo lo reproduzca)
      try {
        const res = await fetch(data.publicUrl)
        if (!res.ok) throw new Error("El archivo no existe en Storage o aún no ha sido subido.")
        
        const blob = await res.blob()
        const blobUrl = URL.createObjectURL(blob)
        const link = document.createElement("a")
        link.href = blobUrl
        link.download = `${stepId}_${lang}.mp3`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(blobUrl)
        setSuccessMsg(`Audio ${stepId}_${lang}.mp3 descargado con éxito ✓`)
      } catch (fetchErr) {
        // Fallback: si hay error de CORS o similar, abrimos en pestaña nueva
        console.warn("Fallo en la descarga directa, usando fallback de apertura:", fetchErr)
        window.open(data.publicUrl, "_blank")
        setSuccessMsg(`Abriendo audio ${stepId}_${lang}.mp3 en una nueva pestaña para su descarga ✓`)
      }
    } catch (err: any) {
      setError("No se pudo descargar el audio: " + err.message)
    } finally {
      setDownloadingAudio(null)
    }
  }

  const handleGenerateAll = async () => {
    if (!proyecto) { setError("No se ha seleccionado un proyecto."); return }
    if (!codigoManual) { setError("Define el código de carpeta primero."); return }
    setGeneratingAll(true)
    setError("")
    setSuccessMsg("")

    console.log("Generando en lote con voces:", ttsVoices)

    // Guardar la configuración de voces en la base de datos para que persista
    try {
      const supabase = createClient()
      const { error: configError } = await supabase
        .from("configuraciones_manual")
        .upsert({
          proyecto_id: proyecto.id,
          tts_config: {
            voices: ttsVoices,
            saludo: ttsSaludo,
            ayuda: ttsAyuda,
            cantidadPasos: ttsCantidadPasos,
            pasos: ttsPasos
          }
        }, { onConflict: "proyecto_id" })
      if (configError) throw configError
      console.log("Configuración de voces guardada en la base de datos.")
    } catch (dbErr: any) {
      console.error("Error al guardar configuración de voces en Supabase:", dbErr)
    }

    // Construir la lista de tareas: saludo, ayuda, y cada paso, en 3 idiomas
    const tasks: { stepId: string; text: string; lang: "es" | "es-ES" | "en" }[] = []
    // Saludo
    if (ttsSaludo.texto_es) {
      tasks.push({ stepId: "00", text: ttsSaludo.texto_es, lang: "es" })
      tasks.push({ stepId: "00", text: ttsSaludo.texto_es, lang: "es-ES" })
    }
    if (ttsSaludo.texto_en) tasks.push({ stepId: "00", text: ttsSaludo.texto_en, lang: "en" })
    // Ayuda
    if (ttsAyuda.texto_es) {
      tasks.push({ stepId: "01_Ayuda", text: ttsAyuda.texto_es, lang: "es" })
      tasks.push({ stepId: "01_Ayuda", text: ttsAyuda.texto_es, lang: "es-ES" })
    }
    if (ttsAyuda.texto_en) tasks.push({ stepId: "01_Ayuda", text: ttsAyuda.texto_en, lang: "en" })
    // Pasos
    for (const p of ttsPasos) {
      if (p.texto_es) {
        tasks.push({ stepId: p.paso, text: p.texto_es, lang: "es" })
        tasks.push({ stepId: p.paso, text: p.texto_es, lang: "es-ES" })
      }
      if (p.texto_en) tasks.push({ stepId: p.paso, text: p.texto_en, lang: "en" })
    }

    if (tasks.length === 0) { setError("No hay textos para generar."); setGeneratingAll(false); return }
    setGenerationProgress({ current: 0, total: tasks.length })

    let successCount = 0
    for (let i = 0; i < tasks.length; i++) {
      const t = tasks[i]
      const voice = t.lang === "es" ? ttsVoices.es_latam : t.lang === "es-ES" ? ttsVoices.es_europe : ttsVoices.en
      console.log(`Generando tarea ${i+1}/${tasks.length}: paso=${t.stepId}, lang=${t.lang}, voice=${voice}`)
      const storagePath = t.lang === "es"
        ? `sounds/${t.stepId}.mp3`
        : `sounds/${t.lang}/${t.stepId}_${t.lang}.mp3`
      try {
        const res = await fetch("/api/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: t.text, voice, codigoManual, storagePath })
        })
        if (!res.ok) { const err = await res.json(); console.error(`Error generando ${storagePath}:`, err.error) }
        else { successCount++ }
      } catch (err) { console.error(`Error generando ${storagePath}:`, err) }
      setGenerationProgress({ current: i + 1, total: tasks.length })
    }
    setGeneratingAll(false)
    setSuccessMsg(`¡${successCount}/${tasks.length} audios generados y subidos a Storage exitosamente!`)
  }

  const handleTranslateText = async (sourceText: string, targetKey: string, setter: (val: string) => void) => {
    if (!sourceText.trim()) {
      setError("No hay texto en español para traducir.")
      return
    }
    setTranslatingText(targetKey)
    setError("")
    setSuccessMsg("")
    try {
      const res = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: sourceText })
      })
      if (!res.ok) throw new Error(await res.text())
      const data = await res.json()
      setter(data.translation)
      setSuccessMsg("Traducción completada ✓")
    } catch (err: any) {
      setError(err.message || "Error al traducir el texto.")
    } finally {
      setTranslatingText(null)
    }
  }

  const handleTranslateStep = async (stepId: string, sourceText: string) => {
    if (!sourceText.trim()) {
      setError("No hay texto en español para traducir.")
      return
    }
    setTranslatingText(stepId)
    setError("")
    setSuccessMsg("")
    try {
      const res = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: sourceText })
      })
      if (!res.ok) throw new Error(await res.text())
      const data = await res.json()
      setTtsPasos(prev => prev.map(item => item.paso === stepId ? { ...item, texto_en: data.translation } : item))
      setSuccessMsg(`Traducción del Paso ${stepId} completada ✓`)
    } catch (err: any) {
      setError(err.message || "Error al traducir el texto.")
    } finally {
      setTranslatingText(null)
    }
  }

  // Despiece State
  const [despiece, setDespiece] = useState<ItemDespiece[]>([])
  const [isScanning, setIsScanning] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploadTarget, setUploadTarget] = useState<{ type: string; step?: string } | null>(null)

  // Update states dynamically when project is selected
  useEffect(() => {
    if (proyecto) {
      setCodigoManual(proyecto.codigo_manual || "")
      setError("")
      setSuccessMsg("")

      if (proyecto.tipo_proyecto === "Aplicativo de armado") {
        const supabase = createClient()
        supabase
          .from("configuraciones_manual")
          .select("*")
          .eq("proyecto_id", proyecto.id)
          .single()
          .then(({ data, error }) => {
            if (error) {
              console.error("Error al cargar configuración de manual:", error)
            } else if (data) {
              setConfigId(data.id)
              setColorPrimario(data.color_primario || "#0D9488")
              setColorSecundario(data.color_secundario || "#111827")
              setColorTextoBotones(data.color_texto_botones || "#ffffff")
              setOpacidadManual(data.opacidad_manual !== undefined && data.opacidad_manual !== null ? data.opacidad_manual : 100)
              setLogoUrl(data.logo_url || "")
              setFaviconUrl(data.favicon_url || "")
              
              // Cargar valores tipográficos (o dejar fallbacks)
              setFontTitle(data.font_title || "Inter")
              setFontTitleSize(data.font_title_size || "1.5rem")
              setFontTitleColor(data.font_title_color || "#FFFFFF")
              setFontBody(data.font_body || "Inter")
              setFontBodySize(data.font_body_size || "0.9rem")
              setFontBodyColor(data.font_body_color || "#BEC8CE")

              // Cargar texturas PBR
              setPbrFloorDiff(data.pbr_floor_diff || "")
              setPbrFloorNormal(data.pbr_floor_normal || "")
              setPbrFloorRoughness(data.pbr_floor_roughness || "")
              setPbrFloorHeight(data.pbr_floor_height || "")
              setPbrWallDiff(data.pbr_wall_diff || "")
              setPbrWallNormal(data.pbr_wall_normal || "")
              setPbrWallRoughness(data.pbr_wall_roughness || "")
              setPbrWallHeight(data.pbr_wall_height || "")

              setGlbSteps((data.glb_pasos as any) || [])
              setAudioEsSteps((data.audio_es_pasos as any) || [])
              setAudioEnSteps((data.audio_en_pasos as any) || [])
              setAudioAyuda(data.audio_ayuda || "")
              setImgHerramientas(data.imagen_herramientas || "")
              setEnsambles((data.imagenes_ensambles as any) || [])
              setGarantiaDoc(data.garantia_texto || "")
              setHerrajesFotos((data.fotos_herrajes as any) || [])
              setRenders((data.renders_fotorealistas as any) || [])
              setDespiece(normalizarYAsignarPiezas((data.despiece as any) || []))

              // Cargar TTS Config
              const tts = (data.tts_config as any) || {}
              if (tts.voices) setTtsVoices(prev => ({ ...prev, ...tts.voices }))
              if (tts.saludo) setTtsSaludo(tts.saludo)
              if (tts.ayuda) setTtsAyuda(tts.ayuda)
              if (tts.cantidadPasos) setTtsCantidadPasos(tts.cantidadPasos)
              if (tts.pasos) setTtsPasos(tts.pasos)
            }
          })
      }
    }
  }, [proyecto?.id, isOpen])



  // Accordion toggle states
  const [openSection, setOpenSection] = useState<string | null>("glb")

  const toggleSection = (section: string) => {
    setOpenSection(openSection === section ? null : section)
  }

  if (!proyecto) return null

  const isTeam = isSuperAdmin || isCoequipero
  const solicitud = proyecto.solicitudes

  // Check if file is image based on extension
  const isImageFile = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase() || ""
    return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)
  }

  // Get Lucide icon based on extension
  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase() || ""
    if (['jpg', 'jpeg', 'png', 'webp', 'svg'].includes(ext)) return <Image className="h-5 w-5 text-pink-400" />
    if (ext === 'pdf') return <FileText className="h-5 w-5 text-red-400" />
    if (ext === 'xlsx' || ext === 'xls') return <FileSpreadsheet className="h-5 w-5 text-emerald-400" />
    if (['glb', 'fbx', 'stp', '3dm'].includes(ext)) return <Box className="h-5 w-5 text-primary" />
    return <Paperclip className="h-5 w-5 text-on-surface-variant/70" />
  }

  const triggerUpload = (type: string, step?: string) => {
    if (!codigoManual) {
      setError("Por favor define primero el código de carpeta / manual antes de cargar insumos.")
      return
    }
    setUploadTarget({ type, step })
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
      fileInputRef.current.click()
    }
  }

  const loadSharedHerrajesLibrary = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase.storage
        .from("insumos_manuales")
        .list("_herrajes_compartidos", { limit: 500 })
      if (error) throw error
      setSharedHerrajesLibrary((data || []).map(f => f.name).filter(n => !n.startsWith('.')))
      setShowSharedLibrary(prev => !prev)
    } catch (err: any) {
      setError("Error cargando biblioteca de herrajes: " + err.message)
    }
  }

  const handleSimulateUpload = (type: string, data?: any) => {
    triggerUpload(type, data)
  }

  const handleRealUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !uploadTarget || !codigoManual) return

    setIsSaving(true)
    setError("")
    setSuccessMsg("")

    try {
      const supabase = createClient()
      const fileExt = file.name.split('.').pop() || ""
      
      let path = ""
      let updatedStateCallback = () => {}

      const { type, step } = uploadTarget

      if (type === 'glb') {
        let stepStr = step
        if (!stepStr) {
          // Intentar extraer el número de paso del nombre del archivo (ej: P01.glb -> 01, P1.glb -> 01)
          const match = file.name.match(/P(\d+)/i)
          if (match) {
            stepStr = match[1].padStart(2, "0")
          } else {
            const numMatch = file.name.match(/(\d+)/)
            if (numMatch) {
              stepStr = numMatch[1].padStart(2, "0")
            } else {
              // Si no tiene número, encontrar el primer número de paso disponible que no colisione
              let nextStep = 0
              let tempStepStr = String(nextStep).padStart(2, "0")
              while (glbSteps.some(s => s.step === tempStepStr)) {
                nextStep++
                tempStepStr = String(nextStep).padStart(2, "0")
              }
              stepStr = tempStepStr
            }
          }
        }
        path = `${codigoManual}/models/P${stepStr}.glb`
        updatedStateCallback = () => {
          setGlbSteps(prev => {
            const existing = prev.find(s => s.step === stepStr)
            const filtered = prev.filter(s => s.step !== stepStr)
            return [...filtered, { 
              step: stepStr, 
              fileName: `P${stepStr}.glb`, 
              progress: 100,
              cameraPosition: existing?.cameraPosition,
              cameraTarget: existing?.cameraTarget
            }].sort((a,b) => a.step.localeCompare(b.step))
          })
        }
      } else if (type === 'audio_es') {
        const stepStr = step || "00"
        path = `${codigoManual}/sounds/es/${stepStr}_es.mp3`
        updatedStateCallback = () => {
          setAudioEsSteps(prev => {
            const filtered = prev.filter(s => s.step !== stepStr)
            return [...filtered, { step: stepStr, fileName: `${stepStr}_es.mp3` }].sort((a,b) => a.step.localeCompare(b.step))
          })
        }
      } else if (type === 'audio_en') {
        const stepStr = step || "00"
        path = `${codigoManual}/sounds/en/${stepStr}_en.mp3`
        updatedStateCallback = () => {
          setAudioEnSteps(prev => {
            const filtered = prev.filter(s => s.step !== stepStr)
            return [...filtered, { step: stepStr, fileName: `${stepStr}_en.mp3` }].sort((a,b) => a.step.localeCompare(b.step))
          })
        }
      } else if (type === 'audio_ayuda') {
        path = `${codigoManual}/sounds/01_Ayuda.${fileExt}`
        updatedStateCallback = () => setAudioAyuda(`01_Ayuda.${fileExt}`)
      } else if (type === 'tools') {
        path = `${codigoManual}/herramientas.${fileExt}`
        updatedStateCallback = () => setImgHerramientas(`herramientas.${fileExt}`)
      } else if (type === 'ensamble') {
        const sanitizedName = file.name.replace(/[^a-zA-Z0-9.]/g, "_")
        path = `${codigoManual}/ensambles/${sanitizedName}`
        updatedStateCallback = () => setEnsambles(prev => [...prev, sanitizedName])
      } else if (type === 'garantia') {
        path = `${codigoManual}/garantia.${fileExt}`
        updatedStateCallback = () => setGarantiaDoc(`garantia.${fileExt}`)
      } else if (type === 'herrajes') {
        const sanitizedName = file.name.replace(/[^a-zA-Z0-9.]/g, "_")
        path = `${codigoManual}/herrajes/${sanitizedName}`
        updatedStateCallback = () => setHerrajesFotos(prev => [...prev, sanitizedName])
      } else if (type === 'renders') {
        const sanitizedName = file.name.replace(/[^a-zA-Z0-9.]/g, "_")
        path = `${codigoManual}/renders/${sanitizedName}`
        updatedStateCallback = () => setRenders(prev => [...prev, sanitizedName])
      } else if (type === 'logo') {
        path = `${codigoManual}/logo.${fileExt}`
        updatedStateCallback = () => setLogoUrl(`logo.${fileExt}`)
      } else if (type === 'favicon') {
        path = `${codigoManual}/favicon.${fileExt}`
        updatedStateCallback = () => setFaviconUrl(`favicon.${fileExt}`)
      } else if (type === 'pbr_floor_diff') {
        path = `${codigoManual}/textures/floor_diff.${fileExt}`
        updatedStateCallback = () => setPbrFloorDiff(`textures/floor_diff.${fileExt}`)
      } else if (type === 'pbr_floor_normal') {
        path = `${codigoManual}/textures/floor_normal.${fileExt}`
        updatedStateCallback = () => setPbrFloorNormal(`textures/floor_normal.${fileExt}`)
      } else if (type === 'pbr_floor_roughness') {
        path = `${codigoManual}/textures/floor_roughness.${fileExt}`
        updatedStateCallback = () => setPbrFloorRoughness(`textures/floor_roughness.${fileExt}`)
      } else if (type === 'pbr_floor_height') {
        path = `${codigoManual}/textures/floor_height.${fileExt}`
        updatedStateCallback = () => setPbrFloorHeight(`textures/floor_height.${fileExt}`)
      } else if (type === 'pbr_wall_diff') {
        path = `${codigoManual}/textures/wall_diff.${fileExt}`
        updatedStateCallback = () => setPbrWallDiff(`textures/wall_diff.${fileExt}`)
      } else if (type === 'pbr_wall_normal') {
        path = `${codigoManual}/textures/wall_normal.${fileExt}`
        updatedStateCallback = () => setPbrWallNormal(`textures/wall_normal.${fileExt}`)
      } else if (type === 'pbr_wall_roughness') {
        path = `${codigoManual}/textures/wall_roughness.${fileExt}`
        updatedStateCallback = () => setPbrWallRoughness(`textures/wall_roughness.${fileExt}`)
      } else if (type === 'pbr_wall_height') {
        path = `${codigoManual}/textures/wall_height.${fileExt}`
        updatedStateCallback = () => setPbrWallHeight(`textures/wall_height.${fileExt}`)
      }

      const { error: uploadError } = await supabase.storage
        .from("insumos_manuales")
        .upload(path, file, {
          upsert: true,
          contentType: file.type
        })

      if (uploadError) throw uploadError

      updatedStateCallback()
      setSuccessMsg(`¡Archivo "${file.name}" cargado en Storage correctamente!`)
    } catch (err: any) {
      console.error(err)
      setError(err.message || "Error al subir el archivo a Supabase Storage.")
    } finally {
      setIsSaving(false)
      setUploadTarget(null)
    }
  }

  const handleRealDelete = async (type: string, stepOrIndex: any) => {
    if (!codigoManual) return
    setIsSaving(true)
    setError("")
    setSuccessMsg("")

    try {
      const supabase = createClient()
      let path = ""
      let updatedStateCallback = () => {}

      if (type === 'glb') {
        path = `${codigoManual}/models/P${stepOrIndex}.glb`
        updatedStateCallback = () => setGlbSteps(prev => prev.filter(s => s.step !== stepOrIndex))
      } else if (type === 'audio_es') {
        path = `${codigoManual}/sounds/es/${stepOrIndex}_es.mp3`
        updatedStateCallback = () => setAudioEsSteps(prev => prev.filter(s => s.step !== stepOrIndex))
      } else if (type === 'audio_en') {
        path = `${codigoManual}/sounds/en/${stepOrIndex}_en.mp3`
        updatedStateCallback = () => setAudioEnSteps(prev => prev.filter(s => s.step !== stepOrIndex))
      } else if (type === 'ensamble') {
        const fileName = ensambles[stepOrIndex]
        path = `${codigoManual}/ensambles/${fileName}`
        updatedStateCallback = () => setEnsambles(prev => prev.filter((_, idx) => idx !== stepOrIndex))
      } else if (type === 'herrajes') {
        const fileName = herrajesFotos[stepOrIndex]
        path = `${codigoManual}/herrajes/${fileName}`
        updatedStateCallback = () => setHerrajesFotos(prev => prev.filter((_, idx) => idx !== stepOrIndex))
      } else if (type === 'renders') {
        const fileName = renders[stepOrIndex]
        path = `${codigoManual}/renders/${fileName}`
        updatedStateCallback = () => setRenders(prev => prev.filter((_, idx) => idx !== stepOrIndex))
      } else if (type === 'pbr_floor_diff') {
        const ext = pbrFloorDiff.split('.').pop() || "png"
        path = `${codigoManual}/textures/floor_diff.${ext}`
        updatedStateCallback = () => setPbrFloorDiff("")
      } else if (type === 'pbr_floor_normal') {
        const ext = pbrFloorNormal.split('.').pop() || "png"
        path = `${codigoManual}/textures/floor_normal.${ext}`
        updatedStateCallback = () => setPbrFloorNormal("")
      } else if (type === 'pbr_floor_roughness') {
        const ext = pbrFloorRoughness.split('.').pop() || "png"
        path = `${codigoManual}/textures/floor_roughness.${ext}`
        updatedStateCallback = () => setPbrFloorRoughness("")
      } else if (type === 'pbr_floor_height') {
        const ext = pbrFloorHeight.split('.').pop() || "png"
        path = `${codigoManual}/textures/floor_height.${ext}`
        updatedStateCallback = () => setPbrFloorHeight("")
      } else if (type === 'pbr_wall_diff') {
        const ext = pbrWallDiff.split('.').pop() || "png"
        path = `${codigoManual}/textures/wall_diff.${ext}`
        updatedStateCallback = () => setPbrWallDiff("")
      } else if (type === 'pbr_wall_normal') {
        const ext = pbrWallNormal.split('.').pop() || "png"
        path = `${codigoManual}/textures/wall_normal.${ext}`
        updatedStateCallback = () => setPbrWallNormal("")
      } else if (type === 'pbr_wall_roughness') {
        const ext = pbrWallRoughness.split('.').pop() || "png"
        path = `${codigoManual}/textures/wall_roughness.${ext}`
        updatedStateCallback = () => setPbrWallRoughness("")
      } else if (type === 'pbr_wall_height') {
        const ext = pbrWallHeight.split('.').pop() || "png"
        path = `${codigoManual}/textures/wall_height.${ext}`
        updatedStateCallback = () => setPbrWallHeight("")
      }

      if (path) {
        await supabase.storage.from("insumos_manuales").remove([path])
      }

      updatedStateCallback()
      setSuccessMsg("Archivo eliminado de Storage con éxito.")
    } catch (err: any) {
      setError(err.message || "Error al eliminar el archivo de Storage.")
    } finally {
      setIsSaving(false)
    }
  }

  const parseCameraCoords = (text: string) => {
    const cleanVal = text.trim();
    
    // 1. Try JSON first
    try {
      const data = JSON.parse(cleanVal);
      if (data.cameraPosition && data.cameraTarget) {
        return {
          pos: data.cameraPosition.map(Number),
          tgt: data.cameraTarget.map(Number)
        };
      }
    } catch (e) {}

    // 2. Check for named position and target in text (case insensitive)
    const posRegex = /(?:posici[oó]n|pos|position):\s*\[?\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*\]?/i;
    const tgtRegex = /(?:target|tgt):\s*\[?\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*\]?/i;

    const posMatch = cleanVal.match(posRegex);
    const tgtMatch = cleanVal.match(tgtRegex);

    if (posMatch && tgtMatch) {
      return {
        pos: [parseFloat(posMatch[1]), parseFloat(posMatch[2]), parseFloat(posMatch[3])],
        tgt: [parseFloat(tgtMatch[1]), parseFloat(tgtMatch[2]), parseFloat(tgtMatch[3])]
      };
    }

    // 3. Generic number extraction
    const numRegex = /-?\d+(?:\.\d+)?/g;
    const matches = cleanVal.match(numRegex);
    if (matches) {
      if (matches.length === 6) {
        return {
          pos: matches.slice(0, 3).map(Number),
          tgt: matches.slice(3, 6).map(Number)
        };
      } else if (matches.length === 3) {
        return {
          single: matches.map(Number)
        };
      }
    }

    return null;
  };

  const handleCameraInputChange = (step: string, type: 'pos' | 'tgt', value: string) => {
    if (type === 'pos') {
      setTempPosInputs(prev => ({ ...prev, [step]: value }));
    } else {
      setTempTgtInputs(prev => ({ ...prev, [step]: value }));
    }

    if (value === '') {
      setGlbSteps(prev => prev.map(s =>
        s.step === step
          ? {
              ...s,
              cameraPosition: type === 'pos' ? undefined : s.cameraPosition,
              cameraTarget: type === 'tgt' ? undefined : s.cameraTarget
            }
          : s
      ));
      if (type === 'pos') {
        setTempPosInputs(prev => {
          const copy = { ...prev };
          delete copy[step];
          return copy;
        });
      } else {
        setTempTgtInputs(prev => {
          const copy = { ...prev };
          delete copy[step];
          return copy;
        });
      }
      return;
    }

    const parsed = parseCameraCoords(value);
    if (parsed) {
      if (parsed.pos && parsed.tgt) {
        setGlbSteps(prev => prev.map(s =>
          s.step === step
            ? { ...s, cameraPosition: parsed.pos, cameraTarget: parsed.tgt }
            : s
        ));
        setTempPosInputs(prev => {
          const copy = { ...prev };
          delete copy[step];
          return copy;
        });
        setTempTgtInputs(prev => {
          const copy = { ...prev };
          delete copy[step];
          return copy;
        });
        setSuccessMsg(`Cámara y Target actualizados para Paso ${step} ✓`);
      } else if (parsed.single) {
        setGlbSteps(prev => prev.map(s =>
          s.step === step
            ? {
                ...s,
                cameraPosition: type === 'pos' ? parsed.single : s.cameraPosition,
                cameraTarget: type === 'tgt' ? parsed.single : s.cameraTarget
              }
            : s
        ));
        if (type === 'pos') {
          setTempPosInputs(prev => {
            const copy = { ...prev };
            delete copy[step];
            return copy;
          });
        } else {
          setTempTgtInputs(prev => {
            const copy = { ...prev };
            delete copy[step];
            return copy;
          });
        }
        setSuccessMsg(`${type === 'pos' ? 'Cámara' : 'Target'} actualizado para Paso ${step} ✓`);
      }
    }
  };

  const handleCameraInputBlur = (step: string, type: 'pos' | 'tgt') => {
    if (type === 'pos') {
      setTempPosInputs(prev => {
        const copy = { ...prev };
        delete copy[step];
        return copy;
      });
    } else {
      setTempTgtInputs(prev => {
        const copy = { ...prev };
        delete copy[step];
        return copy;
      });
    }
  };

  const handleDeleteItem = (type: string, stepOrIndex: any) => {
    handleRealDelete(type, stepOrIndex)
  }

  // --- LÓGICA DE DESPIECE AUTOMATIZADO ---
  
  const obtenerNombreLimpioTooltip = (rawName: string): string => {
    if (!rawName) return ""
    
    // 1. Obtener la primera sección (antes de cualquier "-") y limpiar espacios
    let name = rawName.split("-")[0].trim()
      name = name.split(".")[0]
    
    // 2. Regla inteligente del guion bajo (no corta palabras, solo números/códigos redundantes)
    const parts2 = name.split("_")
    const resultParts = []
    let codeCount = 0
    
    for (let i = 0; i < parts2.length; i++) {
      const part = parts2[i]
      const isPureText = !/\d/.test(part)
      
      if (isPureText) {
        resultParts.push(part)
      } else {
        if (codeCount === 0) {
          // Filtro para detectar números de instancia (ej. _1, _2 ... _99, _1001, _2001)
          if (/^\d+$/.test(part)) {
            const num = parseInt(part, 10)
            const isInstance = num < 100 || (part.length === 4 && part.substring(1, 3) === "00")
            if (isInstance) {
              // Es una instancia generada por Rhino/Blender, la omitimos para forzar la agrupación
              continue
            }
          }
          resultParts.push(part)
          codeCount++
        } else {
          break
        }
      }
    }
    name = resultParts.join("_")

    // 3. Curación definitiva de sufijos de Blender (ej. "PARAL_6A001" -> "PARAL_6A")
    // Se ejecuta al final para atrapar el 001 incluso si antes tenía un _1 (ej. Paral_5A001_1 -> Paral_5A001 -> Paral_5A)
    name = name.replace(/[._]?0\d\d$/i, "")
    name = name.replace(/_$/, "")
    
    // 4. Limpieza de sufijos comunes de materiales (ej. Cubierta_balance -> Cubierta)
    const sufijosMat = ["_BALANCE", "_TAPA", "_CANTO", "_LAMINADO", " BALANCE", " TAPA", " CANTO", " LAMINADO"]
    let upperName = name.toUpperCase()
    for (const suf of sufijosMat) {
      if (upperName.endsWith(suf)) {
        name = name.substring(0, name.length - suf.length)
        upperName = name.toUpperCase()
      }
    }
    
    // 4. Regla específica para PERNO_ con espacio
    if (name.toUpperCase().startsWith("PERNO_") && name.includes(" ")) {
      name = name.split(" ")[0]
    }
    
    return name
  }

  const escanearModeloGLB = async () => {
    if (!codigoManual) {
      setError("Por favor define el Código de Carpeta / Manual primero.")
      return
    }
    
    setIsScanning(true)
    setError("")
    setSuccessMsg("")
    
    try {
      const supabase = createClient()
      const path = `${codigoManual}/models/P00.glb`
      
      // Usamos una URL firmada de corta duración y le agregamos un timestamp.
      // Esto previene que el navegador o el CDN sigan usando una versión en caché (ej. si subiste un GLB nuevo)
      // y nos permite validar en tiempo real si el archivo existe o fue borrado.
      const { data: signedData, error: signError } = await supabase.storage
        .from("insumos_manuales")
        .createSignedUrl(path, 60)
        
      if (signError || !signedData) {
        throw new Error("El archivo P00.glb no existe en el repositorio.")
      }
      
      const response = await fetch(`${signedData.signedUrl}&t=${Date.now()}`, { cache: "no-store" })
      if (!response.ok) {
        throw new Error(`El archivo P00.glb ya no existe o fue borrado (Código ${response.status}).`)
      }
      
      const fileBlob = await response.blob()
      
      // Creamos una URL local temporal segura para el Blob
      const blobUrl = URL.createObjectURL(fileBlob)
      
      // Cargamos THREE, GLTFLoader y DRACOLoader dinámicamente para soportar SSR en Next.js
      const THREE = await import("three")
      const { GLTFLoader } = await import("three/examples/jsm/loaders/GLTFLoader.js")
      const { DRACOLoader } = await import("three/examples/jsm/loaders/DRACOLoader.js")
      
      const loader = new GLTFLoader()
      
      // Configurar soporte para compresión Draco
      const dracoLoader = new DRACOLoader()
      dracoLoader.setDecoderPath("https://www.gstatic.com/draco/versioned/decoders/1.5.7/")
      loader.setDRACOLoader(dracoLoader)
      
      loader.load(
        blobUrl,
        (gltf) => {
          const conteo: { 
            [key: string]: { 
              cantidad: number; 
              esHerraje: boolean;
              esFondo: boolean;
              nombreLimpio: string;
              largo?: number;
              ancho?: number;
              espesor?: number;
              piezasDetectadas?: number[];
            } 
          } = {}
          const instanciasContadas = new Set<string>()
          
          // Detectar escala global del modelo (metros vs milímetros)
          const sceneBBox = new THREE.Box3().setFromObject(gltf.scene)
          const sceneSize = new THREE.Vector3()
          sceneBBox.getSize(sceneSize)
          const maxSceneDim = Math.max(sceneSize.x, sceneSize.y, sceneSize.z)
          // Si el mueble entero mide menos de 20 unidades, asumimos que fue exportado en metros
          const mult = maxSceneDim > 0 && maxSceneDim < 20 ? 1000 : 1
          
          gltf.scene.traverse((child: any) => {
            if (child.isMesh) {
              const rawName = child.name || ""
              
              // 1. Obtener el nombre original y limpio del componente
              // Si tiene un padre en el GLB que no es la escena ni una pegatina, usamos el nombre de ese padre.
              let nombreLimpio = ""
              let parentName = ""
              if (child.parent && child.parent.type !== 'Scene' && child.parent.name) {
                parentName = child.parent.name
              }

              if (parentName && !parentName.toUpperCase().startsWith("PIEZA") && parentName.toLowerCase() !== "scene") {
                nombreLimpio = obtenerNombreLimpioTooltip(parentName)
              } else if (child.geometry && child.geometry.name) {
                nombreLimpio = obtenerNombreLimpioTooltip(child.geometry.name)
              } else if (rawName.includes("_")) {
                const parts = rawName.split("_")
                // Fallback para formato combinado "Pieza XX_Nombre". Solo cortar si empieza con "Pieza"
                if (parts[0].toLowerCase().startsWith("pieza")) {
                  nombreLimpio = obtenerNombreLimpioTooltip(parts.slice(1).join("_"))
                } else {
                  nombreLimpio = obtenerNombreLimpioTooltip(rawName)
                }
              } else {
                nombreLimpio = obtenerNombreLimpioTooltip(rawName)
              }
              if (!nombreLimpio) return
              
              // 2. Detectar si el propio mesh es la pegatina "Pieza XX" (formato no redundante)
              let piezaBaseNum: number | undefined = undefined
              let esCodificado = false
              
              if (rawName.toUpperCase().startsWith("PIEZA")) {
                // Limpiar primero los sufijos duplicados (ej. .001, .003, 001, 003)
                const cleanNameForNum = rawName.replace(/[._]?0\d\d$/i, "");
                const match = cleanNameForNum.match(/Pieza[_\s]*(\d+)/i)
                if (match) {
                  piezaBaseNum = parseInt(match[1], 10)
                  esCodificado = true
                }
              }
              
              // 3. Detectar si tiene un padre Empty de pegatina "Pieza XX" (para retrocompatibilidad)
              parentName = ""
              if (child.parent && child.parent.type !== 'Scene') {
                parentName = child.parent.name || ""
              }
              
              if (!esCodificado && parentName.toUpperCase().startsWith("PIEZA")) {
                const cleanParentName = parentName.replace(/[._]?0\d\d$/i, "");
                const match = cleanParentName.match(/Pieza[_\s]*(\d+)/i)
                if (match) {
                  piezaBaseNum = parseInt(match[1], 10)
                }
              }
              
              // 3. Evitar doble conteo por multi-materiales (ej. frente y balance)
              let instanceId = child.uuid
              if (child.parent && child.parent.type !== 'Scene') {
                if (parentName.toUpperCase().startsWith("PIEZA")) {
                  instanceId = child.parent.uuid
                } else {
                  const nombreLimpioPadre = obtenerNombreLimpioTooltip(parentName)
                  if (!rawName || nombreLimpio === nombreLimpioPadre) {
                    instanceId = child.parent.uuid
                  }
                }
              }
              
              if (instanciasContadas.has(instanceId)) {
                return // Ya contamos esta pieza (otra cara/malla del mismo objeto)
              }
              instanciasContadas.add(instanceId)
              
              // Clasificación inteligente de Herrajes vs Piezas
              let esHerraje = false
              const nombreLower = nombreLimpio.toLowerCase()
              
              if (nombreLower.startsWith("tapaluz") || nombreLower.includes("fondo") || nombreLower.includes("posterior")) {
                // Exclusión especial: "Tapaluz", "fondo" o "posterior" nunca son herrajes
                esHerraje = false
              } else if (nombreLower.startsWith("caja") || nombreLower.startsWith("puntilla")) {
                // Inclusión especial: Empieza con "Caja" o "Puntilla", es herraje
                esHerraje = true
              } else if (/^\d+$/.test(nombreLimpio)) {
                // Inclusión especial: Si el nombre es puramente numérico (SKU), es un herraje
                esHerraje = true
              } else {
                // Palabras clave genéricas
                esHerraje = /tornillo|perno|tarugo|bisagra|deslizador|corredera|soporte|clavo|tapa|minifix|cama|perfil|regula|patin|pivote|tuerca|arandela|jaladera|tirador|pija|angulo|union|mensula|mariposa/i.test(nombreLimpio)
              }
              
              let esFondo = false;
              let finalName = nombreLimpio
              
              // Extraer dimensiones físicas de las piezas de madera para diferenciarlas por tamaño
              let l, w, t;
              if (!esHerraje && child.geometry) {
                // Paso 1: Intentar con el mesh individual
                const worldBox = new THREE.Box3().setFromObject(child)
                const worldSize = new THREE.Vector3()
                worldBox.getSize(worldSize)
                
                let dimX = worldSize.x
                let dimY = worldSize.y
                let dimZ = worldSize.z
                const minDim = Math.min(dimX, dimY, dimZ)
                
                // Paso 2: Si alguna dimensión es ~0 (plano perfecto), usar el padre
                if (minDim < 0.0001 && child.parent && child.parent.type !== 'Scene') {
                  const parentBox = new THREE.Box3().setFromObject(child.parent)
                  const parentSize = new THREE.Vector3()
                  parentBox.getSize(parentSize)
                  dimX = parentSize.x
                  dimY = parentSize.y
                  dimZ = parentSize.z
                  console.log(`[DESPIECE-PARENT] "${nombreLimpio}" | mesh plano detectado, usando padre "${child.parent.name}" | parentSize=[${dimX.toFixed(5)}, ${dimY.toFixed(5)}, ${dimZ.toFixed(5)}]`)
                }
                
                const dims = [Math.abs(dimX), Math.abs(dimY), Math.abs(dimZ)].sort((a, b) => b - a)
                
                l = Math.round(dims[0] * mult)
                w = Math.round(dims[1] * mult)
                t = Math.round(dims[2] * mult)
                
                const rawT = dims[2] * mult;
                
                // Log diagnóstico para fondos y piezas delgadas
                if (nombreLimpio.toLowerCase().includes("fondo") || rawT < 5) {
                  console.log(`[DESPIECE] "${nombreLimpio}" | rawName="${rawName}" | dims_mm=[${l}, ${w}, ${t}] | rawT=${rawT.toFixed(3)}mm | esFondo=${rawT >= 2.5 && rawT <= 3.5}`)
                }
                
                // Ignorar mallas verdaderamente 2D (< 2.5mm) incluso después de consultar al padre
                if (rawT < 2.5 && !esHerraje) return;
                
                // Identificar láminas/fondos (espesor entre 2.5mm y 3.5mm real)
                if (rawT >= 2.5 && rawT <= 3.5 && !esHerraje) {
                  esFondo = true
                  t = Math.round(rawT * 10) / 10 // 1 decimal para fondos (ej. 2.7mm)
                }
                
                if (l > 0) {
                  finalName = `${nombreLimpio}_${l}x${w}x${t}`
                }
              }
              
              if (conteo[finalName]) {
                conteo[finalName].cantidad += 1
                if (piezaBaseNum !== undefined) {
                  if (!conteo[finalName].piezasDetectadas) {
                    conteo[finalName].piezasDetectadas = []
                  }
                  conteo[finalName].piezasDetectadas!.push(piezaBaseNum)
                }
              } else {
                conteo[finalName] = {
                  cantidad: 1,
                  esHerraje,
                  esFondo,
                  nombreLimpio,
                  largo: l,
                  ancho: w,
                  espesor: t,
                  piezasDetectadas: piezaBaseNum !== undefined ? [piezaBaseNum] : []
                }
              }
            }
          })
          
          // Liberar la URL de objeto temporal para evitar fugas de memoria
          URL.revokeObjectURL(blobUrl)
          
          // Post-procesamiento: Unificar herrajes con códigos extendidos
          const herrajeKeys = Object.keys(conteo).filter(k => conteo[k].esHerraje)
          herrajeKeys.sort((a, b) => a.length - b.length)
          
          for (let i = 0; i < herrajeKeys.length; i++) {
            const shorter = herrajeKeys[i]
            if (!conteo[shorter]) continue
            for (let j = i + 1; j < herrajeKeys.length; j++) {
              const longer = herrajeKeys[j]
              if (!conteo[longer]) continue
              if (longer.startsWith(shorter)) {
                conteo[shorter].cantidad += conteo[longer].cantidad
                delete conteo[longer]
              }
            }
          }
          
          // Post-procesamiento: Consolidar correderas multi-parte
          const corredKeys = Object.keys(conteo).filter(k => 
            conteo[k].esHerraje && k.toLowerCase().startsWith("corredera")
          )
          if (corredKeys.length > 0) {
            const totalPartes = corredKeys.reduce((sum, k) => sum + conteo[k].cantidad, 0)
            const frentesCajon = Object.values(conteo)
              .filter(v => !v.esHerraje && v.nombreLimpio.toLowerCase().includes("frente") && v.nombreLimpio.toLowerCase().includes("cajon"))
              .reduce((sum, v) => sum + v.cantidad, 0)
            
            const canonical = corredKeys.find(k => /corredera[_\s]\d/i.test(k)) || corredKeys[0]
            const cantidadReal = frentesCajon > 0 ? Math.round(totalPartes / frentesCajon) : totalPartes
            
            for (const k of corredKeys) {
              if (k !== canonical) delete conteo[k]
            }
            conteo[canonical].cantidad = cantidadReal
            console.log(`[DESPIECE] Correderas: ${totalPartes} partes / ${frentesCajon} frentes = ${cantidadReal} correderas`)
          }
          
          const nuevoDespiece: ItemDespiece[] = Object.values(conteo).map((info) => {
            const itemExistente = despiece.find(d => 
              d.nombre === info.nombreLimpio && 
              d.largo === info.largo && 
              d.ancho === info.ancho
            )
            
            let piezaNumero: string | undefined = undefined
            let piezaNumeroStart: number | undefined = undefined
            let piezaNumeroRange: boolean | undefined = undefined
            let piezasLista: string[] | undefined = undefined
            
            if (info.piezasDetectadas && info.piezasDetectadas.length > 0) {
              info.piezasDetectadas.sort((a, b) => a - b)
              const uniqueNums = Array.from(new Set(info.piezasDetectadas))
              
              piezasLista = uniqueNums.map(num => `Pieza ${String(num).padStart(2, "0")}`)
              
              if (uniqueNums.length === 1) {
                // Pegatina única compartida (ej: [5, 5, 5, 5])
                const baseNum = uniqueNums[0]
                piezaNumeroStart = baseNum
                piezaNumeroRange = false
                piezaNumero = `Pieza ${String(baseNum).padStart(2, "0")}`
              } else if (uniqueNums.length > 1) {
                // Rango secuencial (ej: [1, 2])
                const startNum = uniqueNums[0]
                piezaNumeroStart = startNum
                piezaNumeroRange = true
                
                const endNum = uniqueNums[uniqueNums.length - 1]
                if (uniqueNums.length === 2) {
                  piezaNumero = `Pieza ${String(startNum).padStart(2, "0")} y Pieza ${String(endNum).padStart(2, "0")}`
                } else {
                  piezaNumero = `Pieza ${String(startNum).padStart(2, "0")} a Pieza ${String(endNum).padStart(2, "0")}`
                }
              }
            }
            
            return {
              nombre: info.nombreLimpio,
              esHerraje: info.esHerraje,
              esFondo: info.esFondo,
              cantidad: info.cantidad,
              costoUnitario: itemExistente?.costoUnitario || 0,
              costoM2: itemExistente?.costoM2 || 0,
              largo: info.largo,
              ancho: info.ancho,
              espesor: info.espesor,
              piezaNumero,
              piezaNumeroStart,
              piezaNumeroRange,
              piezasLista
            }
          }).sort((a, b) => {
            if (a.piezaNumeroStart !== undefined && b.piezaNumeroStart !== undefined) {
              return a.piezaNumeroStart - b.piezaNumeroStart
            }
            return a.nombre.localeCompare(b.nombre)
          })
          
          setDespiece(normalizarYAsignarPiezas(nuevoDespiece))
          setIsScanning(false)
          setSuccessMsg("¡Modelo P00.glb escaneado y despiece generado con éxito!")
        },
        undefined,
        (err) => {
          console.error("Error al procesar P00.glb con GLTFLoader:", err)
          URL.revokeObjectURL(blobUrl)
          setError("El archivo P00.glb tiene un formato o estructura inválida para ser procesado.")
          setIsScanning(false)
        }
      )
    } catch (err: any) {
      console.error("Error de análisis:", err)
      setError(err.message || "Error al iniciar el análisis del modelo 3D.")
      setIsScanning(false)
    }
  }

  const handleLimpiarDespiece = async () => {
    setIsSaving(true)
    try {
      const supabase = createClient()
      const { error: configError } = await supabase
        .from("configuraciones_manual")
        .update({ despiece: null })
        .eq("proyecto_id", proyecto.id)

      // Ignore error if row doesn't exist
      
      setDespiece([])
      setSuccessMsg("El escaneo ha sido borrado del visor y de la base de datos.")
      setError("")
    } catch (err: any) {
      setError(err.message || "Error al borrar el despiece en Supabase.")
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveDespiece = async (items: ItemDespiece[]) => {
    setIsSaving(true)
    setError("")
    setSuccessMsg("")
    try {
      const supabase = createClient()
      const { error: configError } = await supabase
        .from("configuraciones_manual")
        .upsert({
          proyecto_id: proyecto.id,
          despiece: items
        }, { onConflict: "proyecto_id" })

      if (configError) throw configError
      setSuccessMsg("¡Despiece y costos guardados exitosamente!")
      if (onUpdate) onUpdate()
    } catch (err: any) {
      setError(err.message || "Error al guardar el despiece.")
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveInsumos = async () => {
    if (!codigoManual) {
      setError("Por favor define el Código de Carpeta / Manual.")
      return
    }
    setIsSaving(true)
    setError("")
    setSuccessMsg("")
    try {
      const supabase = createClient()

      // 1. Actualizar el proyecto
      const { error: updateError } = await supabase
        .from("proyectos")
        .update({ 
          progreso: 90, 
          estado: "En revisión",
          codigo_manual: codigoManual || null
        })
        .eq("id", proyecto.id)

      if (updateError) throw updateError

      // 2. Guardar la configuración en configuraciones_manual
      const { error: configError } = await supabase
        .from("configuraciones_manual")
        .upsert({
          proyecto_id: proyecto.id,
          color_primario: colorPrimario,
          color_secundario: colorSecundario,
          color_texto_botones: colorTextoBotones,
          opacidad_manual: opacidadManual,
          logo_url: logoUrl,
          favicon_url: faviconUrl,
          
          // Guardar campos de tipografía en BD
          font_title: fontTitle,
          font_title_size: fontTitleSize,
          font_title_color: fontTitleColor,
          font_body: fontBody,
          font_body_size: fontBodySize,
          font_body_color: fontBodyColor,

          // Guardar campos de texturas PBR
          pbr_floor_diff: pbrFloorDiff,
          pbr_floor_normal: pbrFloorNormal,
          pbr_floor_roughness: pbrFloorRoughness,
          pbr_floor_height: pbrFloorHeight,
          pbr_wall_diff: pbrWallDiff,
          pbr_wall_normal: pbrWallNormal,
          pbr_wall_roughness: pbrWallRoughness,
          pbr_wall_height: pbrWallHeight,

          glb_pasos: glbSteps,
          audio_es_pasos: audioEsSteps,
          audio_en_pasos: audioEnSteps,
          audio_ayuda: audioAyuda,
          imagen_herramientas: imgHerramientas,
          imagenes_ensambles: ensambles,
          garantia_texto: garantiaDoc,
          fotos_herrajes: herrajesFotos,
          despiece: despiece,
          tts_config: {
            voices: ttsVoices,
            saludo: ttsSaludo,
            ayuda: ttsAyuda,
            cantidadPasos: ttsCantidadPasos,
            pasos: ttsPasos
          }
        }, { onConflict: "proyecto_id" })

      if (configError) throw configError
      
      setSuccessMsg("¡Insumos y configuración del manual guardados en Supabase exitosamente!")
      if (onUpdate) onUpdate()
    } catch (err: any) {
      setError(err.message || "Error al guardar los insumos en el CMS.")
    } finally {
      setIsSaving(false)
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
            className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md"
            onClick={onClose}
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-x-4 top-[5%] z-50 mx-auto max-w-5xl overflow-y-auto max-h-[90vh] rounded-2xl border border-outline-variant bg-surface-container p-0 shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-outline-variant px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                  <Cpu className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-on-surface leading-tight">{proyecto.nombre}</h2>
                  <div className="mt-1 flex items-center gap-2 text-xs text-on-surface-variant/80">
                    <span className="font-semibold text-primary">{proyecto.tipo_proyecto}</span>
                    <span>•</span>
                    <span>Cliente: {proyecto.profiles?.full_name} ({proyecto.profiles?.company})</span>
                  </div>
                </div>
              </div>
              <button
                onClick={onClose}
                className="rounded-lg p-2 text-on-surface-variant transition hover:bg-surface-container-high"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content Tabs Selector */}
            <div className="flex border-b border-outline-variant px-6 bg-surface-container-low">
              <button
                onClick={() => setActiveTab("solicitud")}
                className={cn(
                  "py-3.5 px-4 text-sm font-semibold border-b-2 transition-all flex items-center gap-2",
                  activeTab === "solicitud" 
                    ? "border-primary text-primary" 
                    : "border-transparent text-on-surface-variant/70 hover:text-on-surface"
                )}
              >
                <Paperclip className="h-4 w-4" />
                Información de la Solicitud
              </button>
              
              {isTeam && (
                <button
                  onClick={() => setActiveTab("insumos")}
                  className={cn(
                    "py-3.5 px-4 text-sm font-semibold border-b-2 transition-all flex items-center gap-2",
                    activeTab === "insumos" 
                      ? "border-primary text-primary" 
                      : "border-transparent text-on-surface-variant/70 hover:text-on-surface"
                  )}
                >
                  <Layers className="h-4 w-4" />
                  Cargar Insumos CMS (Manual Vacío)
                </button>
              )}

              {isTeam && (
                <button
                  onClick={() => setActiveTab("despiece")}
                  className={cn(
                    "py-3.5 px-4 text-sm font-semibold border-b-2 transition-all flex items-center gap-2",
                    activeTab === "despiece" 
                      ? "border-primary text-primary" 
                      : "border-transparent text-on-surface-variant/70 hover:text-on-surface"
                  )}
                >
                  <Boxes className="h-4 w-4" />
                  Despiece
                </button>
              )}
            </div>

            {/* Main scrollable body */}
            <div className="p-6 overflow-y-auto flex-1 max-h-[60vh] space-y-6">
              
              {activeTab === "solicitud" && (
                <div className="space-y-6">
                  {solicitud ? (
                    <>
                      {/* Solicitud info card */}
                      <div className="rounded-xl bg-surface-container-low border border-outline-variant/15 p-5 space-y-4">
                        <div className="flex items-center justify-between border-b border-outline-variant/10 pb-3">
                          <h3 className="text-base font-bold text-on-surface">
                            Solicitud #{String(solicitud.id).padStart(5, "0")} — {solicitud.titulo}
                          </h3>
                          <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-bold tracking-wide uppercase text-primary border border-primary/20">
                            {solicitud.estado}
                          </span>
                        </div>
                        
                        <div className="space-y-1.5">
                          <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Descripción del requerimiento</span>
                          <p className="text-sm text-on-surface-variant/90 leading-relaxed whitespace-pre-wrap">
                            {solicitud.descripcion}
                          </p>
                        </div>
                        
                        <div className="text-[10px] text-on-surface-variant/50 flex items-center gap-1 pt-2">
                          <span>Fecha de radicación:</span>
                          <span className="font-medium">{new Date(solicitud.created_at).toLocaleString()}</span>
                        </div>
                      </div>

                      {/* Attachments Section */}
                      <div className="space-y-3">
                        <h4 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider flex items-center gap-1.5">
                          <Paperclip className="h-4 w-4 text-primary" />
                          Archivos Adjuntos de la Solicitud ({solicitud.adjuntos?.length || 0})
                        </h4>
                        
                        {!solicitud.adjuntos || solicitud.adjuntos.length === 0 ? (
                          <p className="text-xs text-on-surface-variant/60 italic px-2">No se incluyeron adjuntos en esta solicitud.</p>
                        ) : (
                          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            {solicitud.adjuntos.map((path, idx) => {
                              const fileName = path.split('/').pop() || path
                              const isImg = isImageFile(fileName)
                              return (
                                <div 
                                  key={idx} 
                                  className="flex items-center justify-between p-3.5 rounded-xl bg-surface-container-low border border-outline-variant/15 hover:border-primary/20 transition-all group"
                                >
                                  <div className="flex items-center gap-3 overflow-hidden mr-2">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-surface-container-high border border-outline-variant/10">
                                      {getFileIcon(fileName)}
                                    </div>
                                    <div className="overflow-hidden">
                                      <p className="text-xs font-semibold text-on-surface truncate leading-tight">{fileName}</p>
                                      <p className="text-[10px] text-on-surface-variant/60 mt-0.5 uppercase tracking-wider">{fileName.split('.').pop()}</p>
                                    </div>
                                  </div>
                                  
                                  {/* Actions */}
                                  <div className="flex items-center gap-1 shrink-0">
                                    {isImg && (
                                      <button 
                                        type="button"
                                        onClick={() => window.open(path, '_blank')}
                                        className="p-2 text-on-surface-variant hover:text-primary transition rounded-lg hover:bg-surface-container-high"
                                        title="Ver imagen"
                                      >
                                        <Eye className="h-4 w-4" />
                                      </button>
                                    )}
                                    <button 
                                      type="button"
                                      onClick={() => window.open(path, '_blank')}
                                      className="p-2 text-on-surface-variant hover:text-primary transition rounded-lg hover:bg-surface-container-high"
                                      title="Descargar archivo"
                                    >
                                      <Download className="h-4 w-4" />
                                    </button>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center p-12 text-center rounded-xl bg-surface-container-low border border-outline-variant/10">
                      <AlertCircle className="h-10 w-10 text-on-surface-variant/40 mb-3" />
                      <p className="text-sm font-semibold text-on-surface">Proyecto independiente</p>
                      <p className="text-xs text-on-surface-variant/70 max-w-xs mt-1">Este proyecto fue creado de forma directa sin estar asociado a una solicitud de soporte inicial.</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "insumos" && isTeam && (
                <div className="space-y-6">
                  {/* Banner descriptivo */}
                  <div className="rounded-xl bg-primary/10 border border-primary/20 p-4 flex gap-3 items-start">
                    <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-bold text-on-surface leading-snug">Carga del Core del Manual de Armado</h4>
                      <p className="text-xs text-on-surface-variant/90 leading-relaxed mt-0.5">
                        Alimenta los recursos 3D, audios bilingües y renders multimedia para que el **Manual Vacío** se ensamble automáticamente en producción.
                      </p>
                    </div>
                  </div>

                  {/* Código de manual / carpeta principal */}
                  <div className="rounded-xl bg-surface-container border border-outline-variant/15 p-5 space-y-4 shadow-sm">
                    <label className="flex flex-col gap-1.5">
                      <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Código de Carpeta / Manual *</span>
                      <input
                        type="text"
                        value={codigoManual}
                        onChange={e => setCodigoManual(e.target.value)}
                        placeholder="Ej: M01536"
                        className="rounded-xl border border-outline-variant bg-surface-container-low px-4 py-2.5 text-sm text-on-surface outline-none transition focus:border-primary focus:ring-1 focus:ring-primary placeholder:text-on-surface-variant/40"
                      />
                    </label>

                    {codigoManual && (
                      <div className="mt-1 flex flex-col gap-2 rounded-xl bg-surface-container-lowest/80 border border-outline-variant/5 p-3.5 text-xs">
                        <span className="font-semibold text-on-surface-variant/90">Enlaces de Previsualización Activos:</span>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 mt-1">
                          <a
                            href={`http://localhost:5173/${codigoManual}?cameraOverlay=${cameraOverlayActive ? 'on' : 'off'}&lightingEditor=${lightingEditorActive ? 'on' : 'off'}`}
                            target="_blank"
                            rel="opener"
                            className="text-primary hover:underline font-semibold flex items-center gap-1 transition-all group shrink-0"
                          >
                            Local: http://localhost:5173/{codigoManual}
                            <ExternalLink className="h-3 w-3 opacity-60 group-hover:opacity-100 transition-opacity" />
                          </a>
                          <a
                            href={`https://mariomojica.com/embed/armado/${codigoManual}?cameraOverlay=${cameraOverlayActive ? 'on' : 'off'}&lightingEditor=${lightingEditorActive ? 'on' : 'off'}`}
                            target="_blank"
                            rel="opener"
                            className="text-teal-400 hover:underline font-semibold flex items-center gap-1 transition-all group shrink-0"
                          >
                            Producción: mariomojica.com/embed/armado/{codigoManual}
                            <ExternalLink className="h-3 w-3 opacity-60 group-hover:opacity-100 transition-opacity" />
                          </a>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Personalización Gráfica (Branding) */}
                  <div className="rounded-xl bg-surface-container border border-outline-variant/15 p-5 space-y-4 shadow-sm">
                    <h4 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider flex items-center gap-1.5 border-b border-outline-variant/10 pb-2">
                      🎨 Personalización de Identidad Gráfica (Branding)
                    </h4>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {/* Color Primario */}
                      <label className="flex flex-col gap-1.5">
                        <span className="text-xs font-semibold text-on-surface-variant">Color Primario</span>
                        <div className="flex gap-2">
                          <input
                            type="color"
                            value={colorPrimario}
                            onChange={e => setColorPrimario(e.target.value)}
                            className="h-9 w-12 rounded-lg border border-outline-variant bg-transparent cursor-pointer"
                          />
                          <input
                            type="text"
                            value={colorPrimario}
                            onChange={e => setColorPrimario(e.target.value)}
                            className="flex-1 rounded-lg border border-outline-variant bg-surface-container-low px-3 py-1.5 text-xs text-on-surface outline-none focus:border-primary"
                          />
                        </div>
                      </label>

                      {/* Color Secundario */}
                      <label className="flex flex-col gap-1.5">
                        <span className="text-xs font-semibold text-on-surface-variant">Color Secundario</span>
                        <div className="flex gap-2">
                          <input
                            type="color"
                            value={colorSecundario}
                            onChange={e => setColorSecundario(e.target.value)}
                            className="h-9 w-12 rounded-lg border border-outline-variant bg-transparent cursor-pointer"
                          />
                          <input
                            type="text"
                            value={colorSecundario}
                            onChange={e => setColorSecundario(e.target.value)}
                            className="flex-1 rounded-lg border border-outline-variant bg-surface-container-low px-3 py-1.5 text-xs text-on-surface outline-none focus:border-primary"
                          />
                        </div>
                      </label>

                      {/* Color de Texto / Contraste de Botones */}
                      <label className="flex flex-col gap-1.5">
                        <span className="text-xs font-semibold text-on-surface-variant">Color de Texto / Iconos</span>
                        <div className="flex gap-2">
                          <input
                            type="color"
                            value={colorTextoBotones}
                            onChange={e => setColorTextoBotones(e.target.value)}
                            className="h-9 w-12 rounded-lg border border-outline-variant bg-transparent cursor-pointer"
                          />
                          <input
                            type="text"
                            value={colorTextoBotones}
                            onChange={e => setColorTextoBotones(e.target.value)}
                            className="flex-1 rounded-lg border border-outline-variant bg-surface-container-low px-3 py-1.5 text-xs text-on-surface outline-none focus:border-primary"
                          />
                        </div>
                      </label>
                    </div>

                    {/* Control de Opacidad / Modo Cristal */}
                    <div className="border-t border-outline-variant/10 pt-4 flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-on-surface-variant/90 uppercase tracking-wider flex items-center gap-1.5">
                          ✨ Opacidad del Manual (Modo Cristal)
                        </span>
                        <span className="text-[11px] font-bold text-primary px-2.5 py-0.5 rounded-full bg-primary/10 border border-primary/20">
                          {opacidadManual === 100 ? "Sólido (100%)" : `Cristal (${opacidadManual}%)`}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 bg-surface-container-low/40 p-4 rounded-xl border border-outline-variant/5">
                        <span className="text-[11px] font-medium text-on-surface-variant/70 shrink-0">Translúcido (10%)</span>
                        <input
                          type="range"
                          min="10"
                          max="100"
                          value={opacidadManual}
                          onChange={e => setOpacidadManual(Number(e.target.value))}
                          className="flex-1 h-1.5 bg-surface-container-high border border-outline-variant/10 rounded-lg appearance-none cursor-pointer accent-primary focus:outline-none"
                        />
                        <span className="text-[11px] font-medium text-on-surface-variant/70 shrink-0">Sólido (100%)</span>
                      </div>
                      <p className="text-[10px] text-on-surface-variant/60 leading-relaxed">
                        Regula la transparencia de las barras y paneles flotantes sobre el espacio 3D. Valores inferiores al 100% activan automáticamente un elegante efecto esmerilado translúcido (*Glassmorphism*).
                      </p>
                    </div>

                    {/* Tipografías y Textos Personalizados */}
                    <div className="border-t border-outline-variant/10 pt-4 space-y-4">
                      <div className="text-xs font-bold text-on-surface-variant/80 uppercase tracking-wider">
                        ✒️ Tipografías y Tamaños de Fuente
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-surface-container-low/40 p-4 rounded-xl border border-outline-variant/5">
                        {/* Configuración de Títulos */}
                        <div className="space-y-3">
                          <div className="text-[11px] font-bold text-primary uppercase tracking-wider border-b border-outline-variant/5 pb-1">Títulos del Manual</div>
                          
                          <div className="grid grid-cols-2 gap-2">
                            <label className="flex flex-col gap-1">
                              <span className="text-[10px] font-semibold text-on-surface-variant">Fuente</span>
                              <select
                                value={fontTitle}
                                onChange={e => setFontTitle(e.target.value)}
                                className="rounded-lg border border-outline-variant bg-surface-container px-2 py-1.5 text-xs text-on-surface outline-none focus:border-primary"
                              >
                                <option value="Inter">Inter (Sans)</option>
                                <option value="Play">Play (Moderna)</option>
                                <option value="Outfit">Outfit (Geométrica)</option>
                                <option value="Montserrat">Montserrat</option>
                                <option value="Roboto">Roboto</option>
                                <option value="Ubuntu">Ubuntu</option>
                                <option value="Poppins">Poppins</option>
                              </select>
                            </label>

                            <label className="flex flex-col gap-1">
                              <span className="text-[10px] font-semibold text-on-surface-variant">Tamaño (CSS)</span>
                              <input
                                type="text"
                                value={fontTitleSize}
                                onChange={e => setFontTitleSize(e.target.value)}
                                placeholder="Ej: 1.5rem o 24px"
                                className="rounded-lg border border-outline-variant bg-surface-container px-3 py-1.5 text-xs text-on-surface outline-none focus:border-primary"
                              />
                            </label>
                          </div>

                          <label className="flex flex-col gap-1">
                            <span className="text-[10px] font-semibold text-on-surface-variant">Color de los Títulos</span>
                            <div className="flex gap-2">
                              <input
                                type="color"
                                value={fontTitleColor}
                                onChange={e => setFontTitleColor(e.target.value)}
                                className="h-8 w-10 rounded-lg border border-outline-variant bg-transparent cursor-pointer"
                              />
                              <input
                                type="text"
                                value={fontTitleColor}
                                onChange={e => setFontTitleColor(e.target.value)}
                                className="flex-1 rounded-lg border border-outline-variant bg-surface-container px-3 py-1.5 text-xs text-on-surface outline-none focus:border-primary"
                              />
                            </div>
                          </label>
                        </div>

                        {/* Configuración de Textos Generales */}
                        <div className="space-y-3">
                          <div className="text-[11px] font-bold text-teal-400 uppercase tracking-wider border-b border-outline-variant/5 pb-1">Texto General / Descripciones</div>
                          
                          <div className="grid grid-cols-2 gap-2">
                            <label className="flex flex-col gap-1">
                              <span className="text-[10px] font-semibold text-on-surface-variant">Fuente</span>
                              <select
                                value={fontBody}
                                onChange={e => setFontBody(e.target.value)}
                                className="rounded-lg border border-outline-variant bg-surface-container px-2 py-1.5 text-xs text-on-surface outline-none focus:border-primary"
                              >
                                <option value="Inter">Inter (Sans)</option>
                                <option value="Play">Play (Moderna)</option>
                                <option value="Outfit">Outfit (Geométrica)</option>
                                <option value="Montserrat">Montserrat</option>
                                <option value="Roboto">Roboto</option>
                                <option value="Ubuntu">Ubuntu</option>
                                <option value="Poppins">Poppins</option>
                              </select>
                            </label>

                            <label className="flex flex-col gap-1">
                              <span className="text-[10px] font-semibold text-on-surface-variant">Tamaño (CSS)</span>
                              <input
                                type="text"
                                value={fontBodySize}
                                onChange={e => setFontBodySize(e.target.value)}
                                placeholder="Ej: 0.9rem o 14px"
                                className="rounded-lg border border-outline-variant bg-surface-container px-3 py-1.5 text-xs text-on-surface outline-none focus:border-primary"
                              />
                            </label>
                          </div>

                          <label className="flex flex-col gap-1">
                            <span className="text-[10px] font-semibold text-on-surface-variant">Color de Texto General</span>
                            <div className="flex gap-2">
                              <input
                                type="color"
                                value={fontBodyColor}
                                onChange={e => setFontBodyColor(e.target.value)}
                                className="h-8 w-10 rounded-lg border border-outline-variant bg-transparent cursor-pointer"
                              />
                              <input
                                type="text"
                                value={fontBodyColor}
                                onChange={e => setFontBodyColor(e.target.value)}
                                className="flex-1 rounded-lg border border-outline-variant bg-surface-container px-3 py-1.5 text-xs text-on-surface outline-none focus:border-primary"
                              />
                            </div>
                          </label>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Logo URL / Upload */}
                      <label className="flex flex-col gap-1.5">
                        <span className="text-xs font-semibold text-on-surface-variant">Logotipo Corporativo (.SVG o .PNG)</span>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={logoUrl}
                            readOnly
                            placeholder="Ningún archivo seleccionado"
                            className="flex-1 rounded-lg border border-outline-variant bg-surface-container-low px-3 py-1.5 text-xs text-on-surface outline-none focus:border-primary truncate"
                          />
                          <button
                            type="button"
                            onClick={() => triggerUpload("logo")}
                            className="rounded-lg bg-primary/10 border border-primary/20 px-3 py-1.5 text-xs font-semibold text-primary transition hover:bg-primary/20"
                          >
                            Cargar
                          </button>
                        </div>
                      </label>

                      {/* Favicon URL / Upload */}
                      <label className="flex flex-col gap-1.5">
                        <span className="text-xs font-semibold text-on-surface-variant">Icono de Pestaña / Favicon (.PNG o .ICO)</span>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={faviconUrl}
                            readOnly
                            placeholder="Ningún archivo seleccionado"
                            className="flex-1 rounded-lg border border-outline-variant bg-surface-container-low px-3 py-1.5 text-xs text-on-surface outline-none focus:border-primary truncate"
                          />
                          <button
                            type="button"
                            onClick={() => triggerUpload("favicon")}
                            className="rounded-lg bg-primary/10 border border-primary/20 px-3 py-1.5 text-xs font-semibold text-primary transition hover:bg-primary/20"
                          >
                            Cargar
                          </button>
                        </div>
                      </label>
                    </div>

                    {/* Sección de Texturas PBR del Escenario */}
                    <div className="border-t border-outline-variant/10 pt-4 space-y-4">
                      <div className="text-xs font-bold text-on-surface-variant/80 uppercase tracking-wider flex items-center gap-1.5">
                        <Box className="h-4 w-4 text-primary" />
                        🧱 Texturas del Escenario (PBR)
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-surface-container-low/40 p-4 rounded-xl border border-outline-variant/5">
                        {/* Texturas del Piso */}
                        <div className="space-y-3">
                          <div className="text-[11px] font-bold text-primary uppercase tracking-wider border-b border-outline-variant/5 pb-1">Texturas del Piso (PBR)</div>
                          
                          {/* Piso: Difusión */}
                          <div className="flex flex-col gap-1">
                            <span className="text-[10px] font-semibold text-on-surface-variant">Mapa de Difusión / Color</span>
                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={pbrFloorDiff}
                                readOnly
                                placeholder="Piso por defecto"
                                className="flex-1 rounded-lg border border-outline-variant bg-surface-container px-3 py-1.5 text-[11px] text-on-surface outline-none truncate"
                              />
                              <button
                                type="button"
                                onClick={() => triggerUpload("pbr_floor_diff")}
                                className="rounded-lg bg-primary/10 border border-primary/20 px-2.5 py-1.5 text-[10px] font-semibold text-primary transition hover:bg-primary/20 shrink-0"
                              >
                                Cargar
                              </button>
                              {pbrFloorDiff && (
                                <button
                                  type="button"
                                  onClick={() => handleRealDelete("pbr_floor_diff", null)}
                                  className="text-on-surface-variant hover:text-red-400 p-1.5 shrink-0"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Piso: Normal */}
                          <div className="flex flex-col gap-1">
                            <span className="text-[10px] font-semibold text-on-surface-variant">Mapa de Normales (Normal Map)</span>
                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={pbrFloorNormal}
                                readOnly
                                placeholder="Normal por defecto"
                                className="flex-1 rounded-lg border border-outline-variant bg-surface-container px-3 py-1.5 text-[11px] text-on-surface outline-none truncate"
                              />
                              <button
                                type="button"
                                onClick={() => triggerUpload("pbr_floor_normal")}
                                className="rounded-lg bg-primary/10 border border-primary/20 px-2.5 py-1.5 text-[10px] font-semibold text-primary transition hover:bg-primary/20 shrink-0"
                              >
                                Cargar
                              </button>
                              {pbrFloorNormal && (
                                <button
                                  type="button"
                                  onClick={() => handleRealDelete("pbr_floor_normal", null)}
                                  className="text-on-surface-variant hover:text-red-400 p-1.5 shrink-0"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Piso: Roughness */}
                          <div className="flex flex-col gap-1">
                            <span className="text-[10px] font-semibold text-on-surface-variant">Mapa de Rugosidad (Roughness Map)</span>
                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={pbrFloorRoughness}
                                readOnly
                                placeholder="Rugosidad por defecto"
                                className="flex-1 rounded-lg border border-outline-variant bg-surface-container px-3 py-1.5 text-[11px] text-on-surface outline-none truncate"
                              />
                              <button
                                type="button"
                                onClick={() => triggerUpload("pbr_floor_roughness")}
                                className="rounded-lg bg-primary/10 border border-primary/20 px-2.5 py-1.5 text-[10px] font-semibold text-primary transition hover:bg-primary/20 shrink-0"
                              >
                                Cargar
                              </button>
                              {pbrFloorRoughness && (
                                <button
                                  type="button"
                                  onClick={() => handleRealDelete("pbr_floor_roughness", null)}
                                  className="text-on-surface-variant hover:text-red-400 p-1.5 shrink-0"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Piso: Height */}
                          <div className="flex flex-col gap-1">
                            <span className="text-[10px] font-semibold text-on-surface-variant">Mapa de Altura / Relieve (Height Map)</span>
                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={pbrFloorHeight}
                                readOnly
                                placeholder="Altura por defecto"
                                className="flex-1 rounded-lg border border-outline-variant bg-surface-container px-3 py-1.5 text-[11px] text-on-surface outline-none truncate"
                              />
                              <button
                                type="button"
                                onClick={() => triggerUpload("pbr_floor_height")}
                                className="rounded-lg bg-primary/10 border border-primary/20 px-2.5 py-1.5 text-[10px] font-semibold text-primary transition hover:bg-primary/20 shrink-0"
                              >
                                Cargar
                              </button>
                              {pbrFloorHeight && (
                                <button
                                  type="button"
                                  onClick={() => handleRealDelete("pbr_floor_height", null)}
                                  className="text-on-surface-variant hover:text-red-400 p-1.5 shrink-0"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Texturas de la Pared */}
                        <div className="space-y-3">
                          <div className="text-[11px] font-bold text-teal-400 uppercase tracking-wider border-b border-outline-variant/5 pb-1">Texturas de las Paredes (PBR)</div>
                          
                          {/* Pared: Difusión */}
                          <div className="flex flex-col gap-1">
                            <span className="text-[10px] font-semibold text-on-surface-variant">Mapa de Difusión / Color</span>
                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={pbrWallDiff}
                                readOnly
                                placeholder="Paredes por defecto"
                                className="flex-1 rounded-lg border border-outline-variant bg-surface-container px-3 py-1.5 text-[11px] text-on-surface outline-none truncate"
                              />
                              <button
                                type="button"
                                onClick={() => triggerUpload("pbr_wall_diff")}
                                className="rounded-lg bg-primary/10 border border-primary/20 px-2.5 py-1.5 text-[10px] font-semibold text-primary transition hover:bg-primary/20 shrink-0"
                              >
                                Cargar
                              </button>
                              {pbrWallDiff && (
                                <button
                                  type="button"
                                  onClick={() => handleRealDelete("pbr_wall_diff", null)}
                                  className="text-on-surface-variant hover:text-red-400 p-1.5 shrink-0"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Pared: Normal */}
                          <div className="flex flex-col gap-1">
                            <span className="text-[10px] font-semibold text-on-surface-variant">Mapa de Normales (Normal Map)</span>
                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={pbrWallNormal}
                                readOnly
                                placeholder="Normal por defecto"
                                className="flex-1 rounded-lg border border-outline-variant bg-surface-container px-3 py-1.5 text-[11px] text-on-surface outline-none truncate"
                              />
                              <button
                                type="button"
                                onClick={() => triggerUpload("pbr_wall_normal")}
                                className="rounded-lg bg-primary/10 border border-primary/20 px-2.5 py-1.5 text-[10px] font-semibold text-primary transition hover:bg-primary/20 shrink-0"
                              >
                                Cargar
                              </button>
                              {pbrWallNormal && (
                                <button
                                  type="button"
                                  onClick={() => handleRealDelete("pbr_wall_normal", null)}
                                  className="text-on-surface-variant hover:text-red-400 p-1.5 shrink-0"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Pared: Roughness */}
                          <div className="flex flex-col gap-1">
                            <span className="text-[10px] font-semibold text-on-surface-variant">Mapa de Rugosidad (Roughness Map)</span>
                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={pbrWallRoughness}
                                readOnly
                                placeholder="Rugosidad por defecto"
                                className="flex-1 rounded-lg border border-outline-variant bg-surface-container px-3 py-1.5 text-[11px] text-on-surface outline-none truncate"
                              />
                              <button
                                type="button"
                                onClick={() => triggerUpload("pbr_wall_roughness")}
                                className="rounded-lg bg-primary/10 border border-primary/20 px-2.5 py-1.5 text-[10px] font-semibold text-primary transition hover:bg-primary/20 shrink-0"
                              >
                                Cargar
                              </button>
                              {pbrWallRoughness && (
                                <button
                                  type="button"
                                  onClick={() => handleRealDelete("pbr_wall_roughness", null)}
                                  className="text-on-surface-variant hover:text-red-400 p-1.5 shrink-0"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Pared: Height */}
                          <div className="flex flex-col gap-1">
                            <span className="text-[10px] font-semibold text-on-surface-variant">Mapa de Altura / Relieve (Height Map)</span>
                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={pbrWallHeight}
                                readOnly
                                placeholder="Altura por defecto"
                                className="flex-1 rounded-lg border border-outline-variant bg-surface-container px-3 py-1.5 text-[11px] text-on-surface outline-none truncate"
                              />
                              <button
                                type="button"
                                onClick={() => triggerUpload("pbr_wall_height")}
                                className="rounded-lg bg-primary/10 border border-primary/20 px-2.5 py-1.5 text-[10px] font-semibold text-primary transition hover:bg-primary/20 shrink-0"
                              >
                                Cargar
                              </button>
                              {pbrWallHeight && (
                                <button
                                  type="button"
                                  onClick={() => handleRealDelete("pbr_wall_height", null)}
                                  className="text-on-surface-variant hover:text-red-400 p-1.5 shrink-0"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Input de archivo real oculto */}
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleRealUpload}
                    className="hidden"
                  />

                  {/* Accordion list */}
                  <div className="rounded-xl border border-outline-variant/15 overflow-hidden divide-y divide-outline-variant/15 bg-surface-container-low">

                    
                    {/* 1. GLB de los pasos */}
                    <div className="flex flex-col">
                      <button
                        type="button"
                        onClick={() => toggleSection("glb")}
                        className="flex items-center justify-between p-4 font-bold text-sm text-on-surface bg-surface-container-low hover:bg-surface-container transition-colors"
                      >
                        <span className="flex items-center gap-2">
                          <Box className="h-4.5 w-4.5 text-primary" />
                          1. Modelos GLB de los Pasos ({glbSteps.length})
                        </span>
                        {openSection === "glb" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </button>
                      
                      {openSection === "glb" && (
                        <div className="p-4 bg-surface-container-lowest/50 border-t border-outline-variant/10 space-y-3.5">
                          {/* Botón toggle de cámara */}
                          <div className="flex items-center justify-between pb-1 border-b border-outline-variant/5">
                            <span className="text-[10px] text-on-surface-variant italic font-medium">Asigna la posición de la cámara del visor 3D para cada paso.</span>
                            <button
                              type="button"
                              onClick={() => {
                                const newVal = cameraOverlayActive ? 'off' : 'on'
                                localStorage.setItem('cameraOverlay', newVal)
                                setCameraOverlayActive(!cameraOverlayActive)
                                window.dispatchEvent(new StorageEvent('storage', {
                                  key: 'cameraOverlay', newValue: newVal
                                }))
                                if (realtimeChannelRef.current) {
                                  realtimeChannelRef.current.send({
                                    type: 'broadcast',
                                    event: 'toggle-feature',
                                    payload: { codigoManual, key: 'cameraOverlay', value: newVal }
                                  })
                                }
                              }}
                              className={cn(
                                "flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-md border transition-all duration-200",
                                cameraOverlayActive
                                  ? "bg-teal-500/10 border-teal-500/30 text-teal-400 hover:bg-teal-500/20"
                                  : "bg-surface-container border-outline-variant/20 text-on-surface-variant hover:text-on-surface"
                              )}
                            >
                              <Camera className="h-3.5 w-3.5" />
                              {cameraOverlayActive ? '🟢 Guía de Cámara Activa' : '⚪ Activar Guía de Cámara'}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const newVal = lightingEditorActive ? 'off' : 'on'
                                localStorage.setItem('lightingEditor', newVal)
                                setLightingEditorActive(!lightingEditorActive)
                                window.dispatchEvent(new StorageEvent('storage', {
                                  key: 'lightingEditor', newValue: newVal
                                }))
                                if (realtimeChannelRef.current) {
                                  realtimeChannelRef.current.send({
                                    type: 'broadcast',
                                    event: 'toggle-feature',
                                    payload: { codigoManual, key: 'lightingEditor', value: newVal }
                                  })
                                }
                              }}
                              className={cn(
                                "flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-md border transition-all duration-200",
                                lightingEditorActive
                                  ? "bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20"
                                  : "bg-surface-container border-outline-variant/20 text-on-surface-variant hover:text-on-surface"
                              )}
                            >
                              ☀️ {lightingEditorActive ? '🟢 Editor de Iluminación Activo' : '⚪ Editor de Iluminación'}
                            </button>
                          </div>

                          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                            {glbSteps.map((g) => (
                              <div key={g.step} className="flex flex-col gap-2 p-3 rounded-lg bg-surface-container border border-outline-variant/10 text-xs">
                                <div className="flex items-center justify-between w-full">
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-primary">Paso {g.step}</span>
                                    <span className="text-on-surface-variant truncate max-w-[120px]">{g.fileName}</span>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    {g.progress < 100 ? (
                                      <div className="flex items-center gap-1.5">
                                        <Loader2 className="h-3 w-3 animate-spin text-primary" />
                                        <span className="text-[10px] text-primary">{g.progress}%</span>
                                      </div>
                                    ) : (
                                      <span className="text-[10px] text-success font-semibold uppercase">Listo</span>
                                    )}
                                    <button type="button" onClick={() => handleDeleteItem("glb", g.step)} className="text-on-surface-variant hover:text-red-400 p-1">
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                  </div>
                                </div>

                                {/* Estado de posición de cámara */}
                                <div className="w-full mt-1.5 pt-1.5 border-t border-outline-variant/10">
                                  <div className="flex items-center justify-between">
                                    <span className="text-[10px] text-on-surface-variant font-medium flex items-center gap-1">
                                      🎥 Cámara: {g.cameraPosition && g.cameraTarget ? (
                                        <span className="text-teal-400 font-bold">Definida</span>
                                      ) : (
                                        <span className="text-on-surface-variant/40 italic">Sin definir</span>
                                      )}
                                    </span>
                                    {(g.cameraPosition || g.cameraTarget) && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setGlbSteps(prev => {
                                            const updated = prev.map(s =>
                                              s.step === g.step
                                                ? { ...s, cameraPosition: undefined, cameraTarget: undefined }
                                                : s
                                            );
                                            const supabaseClient = createClient();
                                            supabaseClient
                                              .from("configuraciones_manual")
                                              .update({ glb_pasos: updated })
                                              .eq("proyecto_id", proyecto?.id);
                                            return updated;
                                          });
                                        }}
                                        className="text-[9px] text-on-surface-variant hover:text-red-400 font-medium"
                                      >
                                        Limpiar
                                      </button>
                                    )}
                                  </div>
                                  
                                  {/* Pegar coordenadas manualmente */}
                                  <div className="mt-1 flex items-center gap-1">
                                    <input
                                      type="text"
                                      placeholder="Pegar posición de cámara..."
                                      value={tempPosInputs[g.step] || ""}
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        setTempPosInputs(prev => ({ ...prev, [g.step]: val }));
                                        
                                        const parsed = parseCameraCoords(val);
                                        if (parsed && parsed.pos && parsed.tgt) {
                                          setGlbSteps(prev => {
                                            const updated = prev.map(s =>
                                              s.step === g.step
                                                ? { ...s, cameraPosition: parsed.pos, cameraTarget: parsed.tgt }
                                                : s
                                            );
                                            const supabaseClient = createClient();
                                            supabaseClient
                                              .from("configuraciones_manual")
                                              .update({ glb_pasos: updated })
                                              .eq("proyecto_id", proyecto?.id)
                                              .then(({ error }) => {
                                                if (!error) {
                                                  setSuccessMsg(`Cámara guardada para Paso ${g.step} ✓`);
                                                }
                                              });
                                            return updated;
                                          });
                                          setTempPosInputs(prev => {
                                            const copy = { ...prev };
                                            delete copy[g.step];
                                            return copy;
                                          });
                                        }
                                      }}
                                      className="text-[9px] w-full bg-surface-container-lowest border border-outline-variant/30 rounded px-2 py-0.5 outline-none focus:border-primary text-on-surface placeholder:text-on-surface-variant/40"
                                    />
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                          
                          <button
                            type="button"
                            onClick={() => handleSimulateUpload("glb")}
                            className="flex items-center gap-1.5 rounded-lg border border-primary/30 border-dashed px-4 py-2 text-xs font-semibold text-primary transition hover:bg-primary/5 hover:border-primary"
                          >
                            <Plus className="h-3.5 w-3.5" />
                            Agregar Nuevo Paso (GLB)
                          </button>
                        </div>
                      )}
                    </div>

                    {/* 2. Generador de Audios TTS (Text-to-Speech) */}
                    <div className="flex flex-col">
                      <button
                        type="button"
                        onClick={() => toggleSection("audios")}
                        className="flex items-center justify-between p-4 font-bold text-sm text-on-surface bg-surface-container-low hover:bg-surface-container transition-colors"
                      >
                        <span className="flex items-center gap-2">
                          <Mic className="h-4.5 w-4.5 text-teal-400" />
                          2. Generador de Audios TTS (Text-to-Speech)
                        </span>
                        {openSection === "audios" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </button>
                      
                      {openSection === "audios" && (
                        <div className="p-5 bg-surface-container-lowest/50 border-t border-outline-variant/10 space-y-6 text-xs">
                          
                          {/* ─── CONFIGURACIÓN DE VOCES ─────────────────────────────── */}
                          <div className="p-4 rounded-xl border border-outline-variant/10 bg-surface-container/30 space-y-3">
                            <span className="text-[10px] font-bold text-primary uppercase tracking-wider block">🎙️ Configuración de Voces por Idioma / Región</span>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              {/* Español Latam */}
                              <div className="flex flex-col gap-2">
                                <label className="font-semibold text-on-surface-variant">Español Latinoamérica</label>
                                <select
                                  value={ttsVoices.es_latam}
                                  onChange={(e) => setTtsVoices(prev => ({ ...prev, es_latam: e.target.value }))}
                                  className="rounded-lg border border-outline-variant bg-surface-container px-3 py-2 text-xs text-on-surface outline-none focus:border-primary transition"
                                >
                                  {TTS_VOICES_ES_LATAM.map(v => (
                                    <option key={v.value} value={v.value}>{v.label}</option>
                                  ))}
                                </select>
                                <button
                                  type="button"
                                  disabled={generatingAudio !== null && generatingAudio !== `preview_${ttsVoices.es_latam}`}
                                  onClick={() => {
                                    if (playingAudio === `preview_${ttsVoices.es_latam}`) {
                                      handleStopAudio()
                                    } else {
                                      handlePreviewVoice(ttsVoices.es_latam)
                                    }
                                  }}
                                  className={cn(
                                    "flex items-center justify-center gap-1.5 rounded-lg border py-1 px-3 text-[10px] font-medium transition",
                                    playingAudio === `preview_${ttsVoices.es_latam}`
                                      ? "bg-red-500/10 hover:bg-red-500/20 text-red-400 border-red-500/20 hover:border-red-500/30"
                                      : "border-outline-variant bg-surface-container text-on-surface-variant hover:text-primary hover:border-primary/50"
                                  )}
                                >
                                  {generatingAudio === `preview_${ttsVoices.es_latam}` ? (
                                    <Loader2 className="h-3 w-3 animate-spin text-primary" />
                                  ) : playingAudio === `preview_${ttsVoices.es_latam}` ? (
                                    <Square className="h-3 w-3 text-red-400 animate-pulse" />
                                  ) : (
                                    <Volume2 className="h-3 w-3" />
                                  )}
                                  {playingAudio === `preview_${ttsVoices.es_latam}` ? "Detener muestra" : "Escuchar muestra"}
                                </button>
                              </div>

                              {/* Español Europa */}
                              <div className="flex flex-col gap-2">
                                <label className="font-semibold text-on-surface-variant">Español Europa</label>
                                <select
                                  value={ttsVoices.es_europe}
                                  onChange={(e) => setTtsVoices(prev => ({ ...prev, es_europe: e.target.value }))}
                                  className="rounded-lg border border-outline-variant bg-surface-container px-3 py-2 text-xs text-on-surface outline-none focus:border-primary transition"
                                >
                                  {TTS_VOICES_ES_EU.map(v => (
                                    <option key={v.value} value={v.value}>{v.label}</option>
                                  ))}
                                </select>
                                <button
                                  type="button"
                                  disabled={generatingAudio !== null && generatingAudio !== `preview_${ttsVoices.es_europe}`}
                                  onClick={() => {
                                    if (playingAudio === `preview_${ttsVoices.es_europe}`) {
                                      handleStopAudio()
                                    } else {
                                      handlePreviewVoice(ttsVoices.es_europe)
                                    }
                                  }}
                                  className={cn(
                                    "flex items-center justify-center gap-1.5 rounded-lg border py-1 px-3 text-[10px] font-medium transition",
                                    playingAudio === `preview_${ttsVoices.es_europe}`
                                      ? "bg-red-500/10 hover:bg-red-500/20 text-red-400 border-red-500/20 hover:border-red-500/30"
                                      : "border-outline-variant bg-surface-container text-on-surface-variant hover:text-primary hover:border-primary/50"
                                  )}
                                >
                                  {generatingAudio === `preview_${ttsVoices.es_europe}` ? (
                                    <Loader2 className="h-3 w-3 animate-spin text-primary" />
                                  ) : playingAudio === `preview_${ttsVoices.es_europe}` ? (
                                    <Square className="h-3 w-3 text-red-400 animate-pulse" />
                                  ) : (
                                    <Volume2 className="h-3 w-3" />
                                  )}
                                  {playingAudio === `preview_${ttsVoices.es_europe}` ? "Detener muestra" : "Escuchar muestra"}
                                </button>
                              </div>

                              {/* Inglés */}
                              <div className="flex flex-col gap-2">
                                <label className="font-semibold text-on-surface-variant">Inglés (EE.UU. / UK)</label>
                                <select
                                  value={ttsVoices.en}
                                  onChange={(e) => setTtsVoices(prev => ({ ...prev, en: e.target.value }))}
                                  className="rounded-lg border border-outline-variant bg-surface-container px-3 py-2 text-xs text-on-surface outline-none focus:border-primary transition"
                                >
                                  {TTS_VOICES_EN.map(v => (
                                    <option key={v.value} value={v.value}>{v.label}</option>
                                  ))}
                                </select>
                                <button
                                  type="button"
                                  disabled={generatingAudio !== null && generatingAudio !== `preview_${ttsVoices.en}`}
                                  onClick={() => {
                                    if (playingAudio === `preview_${ttsVoices.en}`) {
                                      handleStopAudio()
                                    } else {
                                      handlePreviewVoice(ttsVoices.en)
                                    }
                                  }}
                                  className={cn(
                                    "flex items-center justify-center gap-1.5 rounded-lg border py-1 px-3 text-[10px] font-medium transition",
                                    playingAudio === `preview_${ttsVoices.en}`
                                      ? "bg-red-500/10 hover:bg-red-500/20 text-red-400 border-red-500/20 hover:border-red-500/30"
                                      : "border-outline-variant bg-surface-container text-on-surface-variant hover:text-primary hover:border-primary/50"
                                  )}
                                >
                                  {generatingAudio === `preview_${ttsVoices.en}` ? (
                                    <Loader2 className="h-3 w-3 animate-spin text-primary" />
                                  ) : playingAudio === `preview_${ttsVoices.en}` ? (
                                    <Square className="h-3 w-3 text-red-400 animate-pulse" />
                                  ) : (
                                    <Volume2 className="h-3 w-3" />
                                  )}
                                  {playingAudio === `preview_${ttsVoices.en}` ? "Detener muestra" : "Escuchar muestra"}
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* ─── SALUDO DE BIENVENIDA (P00) ─────────────────────────── */}
                          <div className="p-4 rounded-xl border border-outline-variant/10 bg-surface-container/30 space-y-4">
                            <span className="text-[10px] font-bold text-primary uppercase tracking-wider block">👋 Saludo de Bienvenida (P00 del Manual)</span>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="flex flex-col gap-1.5">
                                <span className="font-bold text-on-surface-variant/80">Texto en Español</span>
                                <textarea
                                  value={ttsSaludo.texto_es}
                                  onChange={(e) => setTtsSaludo(prev => ({ ...prev, texto_es: e.target.value }))}
                                  placeholder="Escribe el saludo o bienvenida que se escuchará al abrir el manual..."
                                  rows={3}
                                  className="rounded-lg border border-outline-variant bg-surface-container px-3 py-2 text-xs text-on-surface outline-none focus:border-primary transition resize-y min-h-[60px]"
                                />
                                <div className="flex gap-2 mt-1">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (playingAudio === "00_es") {
                                        handleStopAudio()
                                      } else {
                                        handleGenerateAudio("00", ttsSaludo.texto_es, "es", false)
                                      }
                                    }}
                                    className={cn(
                                      "flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[10px] font-medium transition",
                                      playingAudio === "00_es"
                                        ? "bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20"
                                        : "bg-surface-container text-on-surface-variant hover:text-primary hover:bg-surface-container-high"
                                    )}
                                  >
                                    {generatingAudio === "00_es_preview" ? (
                                      <Loader2 className="h-3 w-3 animate-spin text-primary" />
                                    ) : playingAudio === "00_es" ? (
                                      <Square className="h-3 w-3 animate-pulse" />
                                    ) : (
                                      <Volume2 className="h-3 w-3" />
                                    )}
                                    {playingAudio === "00_es" ? "Detener ES" : "Escuchar ES"}
                                  </button>
                                  <button
                                    type="button"
                                    disabled={generatingAudio !== null}
                                    onClick={() => handleGenerateAudio("00", ttsSaludo.texto_es, "es", true)}
                                    className="flex items-center gap-1.5 rounded-lg bg-primary/10 hover:bg-primary/15 px-2.5 py-1 text-[10px] text-primary font-bold transition"
                                  >
                                    {generatingAudio === "00_es_upload" ? <Loader2 className="h-3 w-3 animate-spin" /> : <Mic className="h-3 w-3" />}
                                    Subir Audio
                                  </button>
                                  <button
                                    type="button"
                                    disabled={downloadingAudio !== null}
                                    onClick={() => handleDownloadAudio("00", "es")}
                                    className="flex items-center gap-1.5 rounded-lg bg-teal-500/10 hover:bg-teal-500/15 px-2.5 py-1 text-[10px] text-teal-400 font-bold border border-teal-500/20 transition"
                                  >
                                    {downloadingAudio === "00_es" ? <Loader2 className="h-3 w-3 animate-spin" /> : <Download className="h-3 w-3" />}
                                    Descargar
                                  </button>
                                </div>
                              </div>

                              <div className="flex flex-col gap-1.5">
                                <div className="flex items-center justify-between">
                                  <span className="font-bold text-on-surface-variant/80">Texto en Inglés</span>
                                  <button
                                    type="button"
                                    disabled={translatingText !== null}
                                    onClick={() => handleTranslateText(ttsSaludo.texto_es, "00", (val) => setTtsSaludo(prev => ({ ...prev, texto_en: val })))}
                                    className="flex items-center gap-1 text-[9px] font-bold text-primary hover:underline"
                                  >
                                    {translatingText === "00" ? (
                                      <Loader2 className="h-2.5 w-2.5 animate-spin" />
                                    ) : (
                                      <Sparkles className="h-2.5 w-2.5" />
                                    )}
                                    Traducir automáticamente
                                  </button>
                                </div>
                                <textarea
                                  value={ttsSaludo.texto_en}
                                  onChange={(e) => setTtsSaludo(prev => ({ ...prev, texto_en: e.target.value }))}
                                  placeholder="Write the welcome speech that will play upon opening the manual..."
                                  rows={3}
                                  className="rounded-lg border border-outline-variant bg-surface-container px-3 py-2 text-xs text-on-surface outline-none focus:border-primary transition resize-y min-h-[60px]"
                                />
                                <div className="flex gap-2 mt-1">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (playingAudio === "00_en") {
                                        handleStopAudio()
                                      } else {
                                        handleGenerateAudio("00", ttsSaludo.texto_en, "en", false)
                                      }
                                    }}
                                    className={cn(
                                      "flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[10px] font-medium transition",
                                      playingAudio === "00_en"
                                        ? "bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20"
                                        : "bg-surface-container text-on-surface-variant hover:text-primary hover:bg-surface-container-high"
                                    )}
                                  >
                                    {generatingAudio === "00_en_preview" ? (
                                      <Loader2 className="h-3 w-3 animate-spin text-primary" />
                                    ) : playingAudio === "00_en" ? (
                                      <Square className="h-3 w-3 animate-pulse" />
                                    ) : (
                                      <Volume2 className="h-3 w-3" />
                                    )}
                                    {playingAudio === "00_en" ? "Detener EN" : "Escuchar EN"}
                                  </button>
                                  <button
                                    type="button"
                                    disabled={generatingAudio !== null}
                                    onClick={() => handleGenerateAudio("00", ttsSaludo.texto_en, "en", true)}
                                    className="flex items-center gap-1.5 rounded-lg bg-primary/10 hover:bg-primary/15 px-2.5 py-1 text-[10px] text-primary font-bold transition"
                                  >
                                    {generatingAudio === "00_en_upload" ? <Loader2 className="h-3 w-3 animate-spin" /> : <Mic className="h-3 w-3" />}
                                    Subir Audio
                                  </button>
                                  <button
                                    type="button"
                                    disabled={downloadingAudio !== null}
                                    onClick={() => handleDownloadAudio("00", "en")}
                                    className="flex items-center gap-1.5 rounded-lg bg-teal-500/10 hover:bg-teal-500/15 px-2.5 py-1 text-[10px] text-teal-400 font-bold border border-teal-500/20 transition"
                                  >
                                    {downloadingAudio === "00_en" ? <Loader2 className="h-3 w-3 animate-spin" /> : <Download className="h-3 w-3" />}
                                    Descargar
                                  </button>

                                </div>
                              </div>
                            </div>
                          </div>

                          {/* ─── AYUDA DEL TUTORIAL ─────────────────────────────────── */}
                          <div className="p-4 rounded-xl border border-outline-variant/10 bg-surface-container/30 space-y-4">
                            <span className="text-[10px] font-bold text-primary uppercase tracking-wider block">❓ Instrucciones de Ayuda (Tutorial Global)</span>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="flex flex-col gap-1.5">
                                <span className="font-bold text-on-surface-variant/80">Texto en Español</span>
                                <textarea
                                  value={ttsAyuda.texto_es}
                                  onChange={(e) => setTtsAyuda(prev => ({ ...prev, texto_es: e.target.value }))}
                                  placeholder="Escribe las instrucciones de uso para el panel de ayuda..."
                                  rows={3}
                                  className="rounded-lg border border-outline-variant bg-surface-container px-3 py-2 text-xs text-on-surface outline-none focus:border-primary transition resize-y min-h-[60px]"
                                />
                                <div className="flex gap-2 mt-1">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (playingAudio === "01_Ayuda_es") {
                                        handleStopAudio()
                                      } else {
                                        handleGenerateAudio("01_Ayuda", ttsAyuda.texto_es, "es", false)
                                      }
                                    }}
                                    className={cn(
                                      "flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[10px] font-medium transition",
                                      playingAudio === "01_Ayuda_es"
                                        ? "bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20"
                                        : "bg-surface-container text-on-surface-variant hover:text-primary hover:bg-surface-container-high"
                                    )}
                                  >
                                    {generatingAudio === "01_Ayuda_es_preview" ? (
                                      <Loader2 className="h-3 w-3 animate-spin text-primary" />
                                    ) : playingAudio === "01_Ayuda_es" ? (
                                      <Square className="h-3 w-3 animate-pulse" />
                                    ) : (
                                      <Volume2 className="h-3 w-3" />
                                    )}
                                    {playingAudio === "01_Ayuda_es" ? "Detener ES" : "Escuchar ES"}
                                  </button>
                                  <button
                                    type="button"
                                    disabled={generatingAudio !== null}
                                    onClick={() => handleGenerateAudio("01_Ayuda", ttsAyuda.texto_es, "es", true)}
                                    className="flex items-center gap-1.5 rounded-lg bg-primary/10 hover:bg-primary/15 px-2.5 py-1 text-[10px] text-primary font-bold transition"
                                  >
                                    {generatingAudio === "01_Ayuda_es_upload" ? <Loader2 className="h-3 w-3 animate-spin" /> : <Mic className="h-3 w-3" />}
                                    Subir Audio
                                  </button>
                                  <button
                                    type="button"
                                    disabled={downloadingAudio !== null}
                                    onClick={() => handleDownloadAudio("01_Ayuda", "es")}
                                    className="flex items-center gap-1.5 rounded-lg bg-teal-500/10 hover:bg-teal-500/15 px-2.5 py-1 text-[10px] text-teal-400 font-bold border border-teal-500/20 transition"
                                  >
                                    {downloadingAudio === "01_Ayuda_es" ? <Loader2 className="h-3 w-3 animate-spin" /> : <Download className="h-3 w-3" />}
                                    Descargar
                                  </button>
                                </div>
                              </div>

                              <div className="flex flex-col gap-1.5">
                                <div className="flex items-center justify-between">
                                  <span className="font-bold text-on-surface-variant/80">Texto en Inglés</span>
                                  <button
                                    type="button"
                                    disabled={translatingText !== null}
                                    onClick={() => handleTranslateText(ttsAyuda.texto_es, "01_Ayuda", (val) => setTtsAyuda(prev => ({ ...prev, texto_en: val })))}
                                    className="flex items-center gap-1 text-[9px] font-bold text-primary hover:underline"
                                  >
                                    {translatingText === "01_Ayuda" ? (
                                      <Loader2 className="h-2.5 w-2.5 animate-spin" />
                                    ) : (
                                      <Sparkles className="h-2.5 w-2.5" />
                                    )}
                                    Traducir automáticamente
                                  </button>
                                </div>
                                <textarea
                                  value={ttsAyuda.texto_en}
                                  onChange={(e) => setTtsAyuda(prev => ({ ...prev, texto_en: e.target.value }))}
                                  placeholder="Write user instructions for the help tutorial panel..."
                                  rows={3}
                                  className="rounded-lg border border-outline-variant bg-surface-container px-3 py-2 text-xs text-on-surface outline-none focus:border-primary transition resize-y min-h-[60px]"
                                  />
                                <div className="flex gap-2 mt-1">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (playingAudio === "01_Ayuda_en") {
                                        handleStopAudio()
                                      } else {
                                        handleGenerateAudio("01_Ayuda", ttsAyuda.texto_en, "en", false)
                                      }
                                    }}
                                    className={cn(
                                      "flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[10px] font-medium transition",
                                      playingAudio === "01_Ayuda_en"
                                        ? "bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20"
                                        : "bg-surface-container text-on-surface-variant hover:text-primary hover:bg-surface-container-high"
                                    )}
                                  >
                                    {generatingAudio === "01_Ayuda_en_preview" ? (
                                      <Loader2 className="h-3 w-3 animate-spin text-primary" />
                                    ) : playingAudio === "01_Ayuda_en" ? (
                                      <Square className="h-3 w-3 animate-pulse" />
                                    ) : (
                                      <Volume2 className="h-3 w-3" />
                                    )}
                                    {playingAudio === "01_Ayuda_en" ? "Detener EN" : "Escuchar EN"}
                                  </button>
                                  <button
                                    type="button"
                                    disabled={generatingAudio !== null}
                                    onClick={() => handleGenerateAudio("01_Ayuda", ttsAyuda.texto_en, "en", true)}
                                    className="flex items-center gap-1.5 rounded-lg bg-primary/10 hover:bg-primary/15 px-2.5 py-1 text-[10px] text-primary font-bold transition"
                                  >
                                    {generatingAudio === "01_Ayuda_en_upload" ? <Loader2 className="h-3 w-3 animate-spin" /> : <Mic className="h-3 w-3" />}
                                    Subir Audio
                                  </button>
                                  <button
                                    type="button"
                                    disabled={downloadingAudio !== null}
                                    onClick={() => handleDownloadAudio("01_Ayuda", "en")}
                                    className="flex items-center gap-1.5 rounded-lg bg-teal-500/10 hover:bg-teal-500/15 px-2.5 py-1 text-[10px] text-teal-400 font-bold border border-teal-500/20 transition"
                                  >
                                    {downloadingAudio === "01_Ayuda_en" ? <Loader2 className="h-3 w-3 animate-spin" /> : <Download className="h-3 w-3" />}
                                    Descargar
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* ─── CANTIDAD DE PASOS ──────────────────────────────────── */}
                          <div className="flex items-center gap-4 bg-surface-container/20 p-3 rounded-lg border border-outline-variant/5">
                            <span className="font-bold text-on-surface">Cantidad de Pasos de Armado:</span>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => setTtsCantidadPasos(p => Math.max(1, p - 1))}
                                className="flex h-7 w-7 items-center justify-center rounded bg-surface-container hover:bg-surface-container-high border border-outline-variant text-on-surface font-bold text-sm"
                              >
                                -
                              </button>
                              <span className="w-8 text-center text-sm font-bold text-on-surface">{ttsCantidadPasos}</span>
                              <button
                                type="button"
                                onClick={() => setTtsCantidadPasos(p => p + 1)}
                                className="flex h-7 w-7 items-center justify-center rounded bg-surface-container hover:bg-surface-container-high border border-outline-variant text-on-surface font-bold text-sm"
                              >
                                +
                              </button>
                            </div>
                          </div>

                          {/* ─── LISTADO DE PASOS (P01...) ─────────────────────────── */}
                          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                            {ttsPasos.map((p, idx) => (
                              <div key={p.paso} className="p-3.5 rounded-xl border border-outline-variant/10 bg-surface-container/40 space-y-3">
                                <div className="flex items-center justify-between border-b border-outline-variant/5 pb-2">
                                  <span className="font-bold text-primary text-xs">Paso {p.paso}</span>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  <div className="flex flex-col gap-1">
                                    <span className="text-[10px] font-bold text-on-surface-variant/70 uppercase">Español (Latam y Europa)</span>
                                    <textarea
                                      value={p.texto_es}
                                      onChange={(e) => {
                                        const val = e.target.value
                                        setTtsPasos(prev => prev.map(item => item.paso === p.paso ? { ...item, texto_es: val } : item))
                                      }}
                                      placeholder="Describe lo que se debe hacer en este paso..."
                                      rows={2}
                                      className="rounded-lg border border-outline-variant bg-surface-container px-2 py-1.5 text-xs text-on-surface outline-none focus:border-primary transition resize-y min-h-[45px]"
                                    />
                                    <div className="flex gap-2 mt-1">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          if (playingAudio === `${p.paso}_es`) {
                                            handleStopAudio()
                                          } else {
                                            handleGenerateAudio(p.paso, p.texto_es, "es", false)
                                          }
                                        }}
                                        className={cn(
                                          "flex items-center gap-1.5 rounded-lg px-2 py-1 text-[9px] font-medium transition",
                                          playingAudio === `${p.paso}_es`
                                            ? "bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20"
                                            : "bg-surface-container text-on-surface-variant hover:text-primary hover:bg-surface-container-high"
                                        )}
                                      >
                                        {generatingAudio === `${p.paso}_es_preview` ? (
                                          <Loader2 className="h-2.5 w-2.5 animate-spin text-primary" />
                                        ) : playingAudio === `${p.paso}_es` ? (
                                          <Square className="h-2.5 w-2.5 animate-pulse" />
                                        ) : (
                                          <Volume2 className="h-2.5 w-2.5" />
                                        )}
                                        {playingAudio === `${p.paso}_es` ? "Detener ES" : "Escuchar ES"}
                                      </button>
                                      <button
                                        type="button"
                                        disabled={generatingAudio !== null}
                                        onClick={() => handleGenerateAudio(p.paso, p.texto_es, "es", true)}
                                        className="flex items-center gap-1.5 rounded-lg bg-primary/10 hover:bg-primary/15 px-2 py-1 text-[9px] text-primary font-bold transition"
                                      >
                                        {generatingAudio === `${p.paso}_es_upload` ? <Loader2 className="h-2.5 w-2.5 animate-spin" /> : <Mic className="h-2.5 w-2.5" />}
                                        Subir Audio
                                      </button>
                                      <button
                                        type="button"
                                        disabled={downloadingAudio !== null}
                                        onClick={() => handleDownloadAudio(p.paso, "es")}
                                        className="flex items-center gap-1.5 rounded-lg bg-teal-500/10 hover:bg-teal-500/15 px-2 py-1 text-[9px] text-teal-400 font-bold border border-teal-500/20 transition"
                                      >
                                        {downloadingAudio === `${p.paso}_es` ? <Loader2 className="h-2.5 w-2.5 animate-spin" /> : <Download className="h-2.5 w-2.5" />}
                                        Descargar
                                      </button>
                                    </div>
                                  </div>

                                  <div className="flex flex-col gap-1">
                                    <div className="flex items-center justify-between">
                                      <span className="text-[10px] font-bold text-on-surface-variant/70 uppercase">Inglés</span>
                                      <button
                                        type="button"
                                        disabled={translatingText !== null}
                                        onClick={() => handleTranslateStep(p.paso, p.texto_es)}
                                        className="flex items-center gap-1 text-[9px] font-bold text-primary hover:underline"
                                      >
                                        {translatingText === p.paso ? (
                                          <Loader2 className="h-2.5 w-2.5 animate-spin" />
                                        ) : (
                                          <Sparkles className="h-2.5 w-2.5" />
                                        )}
                                        Traducir automáticamente
                                      </button>
                                    </div>
                                    <textarea
                                      value={p.texto_en}
                                      onChange={(e) => {
                                        const val = e.target.value
                                        setTtsPasos(prev => prev.map(item => item.paso === p.paso ? { ...item, texto_en: val } : item))
                                      }}
                                      placeholder="Describe what needs to be done in this step..."
                                      rows={2}
                                      className="rounded-lg border border-outline-variant bg-surface-container px-2 py-1.5 text-xs text-on-surface outline-none focus:border-primary transition resize-y min-h-[45px]"
                                    />
                                    <div className="flex gap-2 mt-1">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          if (playingAudio === `${p.paso}_en`) {
                                            handleStopAudio()
                                          } else {
                                            handleGenerateAudio(p.paso, p.texto_en, "en", false)
                                          }
                                        }}
                                        className={cn(
                                          "flex items-center gap-1.5 rounded-lg px-2 py-1 text-[9px] font-medium transition",
                                          playingAudio === `${p.paso}_en`
                                            ? "bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20"
                                            : "bg-surface-container text-on-surface-variant hover:text-primary hover:bg-surface-container-high"
                                        )}
                                      >
                                        {generatingAudio === `${p.paso}_en_preview` ? (
                                           <Loader2 className="h-2.5 w-2.5 animate-spin text-primary" />
                                         ) : playingAudio === `${p.paso}_en` ? (
                                           <Square className="h-2.5 w-2.5 animate-pulse" />
                                         ) : (
                                           <Volume2 className="h-2.5 w-2.5" />
                                         )}
                                        {playingAudio === `${p.paso}_en` ? "Detener EN" : "Escuchar EN"}
                                      </button>
                                      <button
                                        type="button"
                                        disabled={generatingAudio !== null}
                                        onClick={() => handleGenerateAudio(p.paso, p.texto_en, "en", true)}
                                        className="flex items-center gap-1.5 rounded-lg bg-primary/10 hover:bg-primary/15 px-2 py-1 text-[9px] text-primary font-bold transition"
                                      >
                                        {generatingAudio === `${p.paso}_en_upload` ? <Loader2 className="h-2.5 w-2.5 animate-spin" /> : <Mic className="h-2.5 w-2.5" />}
                                        Subir Audio
                                      </button>
                                      <button
                                        type="button"
                                        disabled={downloadingAudio !== null}
                                        onClick={() => handleDownloadAudio(p.paso, "en")}
                                        className="flex items-center gap-1.5 rounded-lg bg-teal-500/10 hover:bg-teal-500/15 px-2 py-1 text-[9px] text-teal-400 font-bold border border-teal-500/20 transition"
                                      >
                                        {downloadingAudio === `${p.paso}_en` ? <Loader2 className="h-2.5 w-2.5 animate-spin" /> : <Download className="h-2.5 w-2.5" />}
                                        Descargar
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* ─── BOTÓN GENERAR TODOS Y BARRA DE PROGRESO ─────────────── */}
                          <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 flex flex-col gap-3">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                              <div>
                                <span className="font-bold text-on-surface text-sm block">Generar todo en lote</span>
                                <span className="text-[10px] text-on-surface-variant block">Genera y sube a Supabase Storage todos los textos configurados en Español Latam, Español Europa e Inglés en un solo proceso.</span>
                              </div>
                              <button
                                type="button"
                                disabled={generatingAll}
                                onClick={handleGenerateAll}
                                className="flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-teal-500 to-primary hover:from-teal-600 hover:to-primary-dark px-4 py-2 text-xs font-bold text-black shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition duration-300 whitespace-nowrap animate-pulse"
                              >
                                {generatingAll ? (
                                  <>
                                    <Loader2 className="h-4 w-4 animate-spin text-black" />
                                    Generando...
                                  </>
                                ) : (
                                  <>
                                    <Sparkles className="h-4 w-4 text-black" />
                                    Generar TODOS los Audios
                                  </>
                                )}
                              </button>
                            </div>

                            {generatingAll && (
                              <div className="space-y-1.5">
                                <div className="flex justify-between text-[10px] font-semibold text-on-surface-variant">
                                  <span>Progreso: {generationProgress.current} / {generationProgress.total} audios</span>
                                  <span>{Math.round((generationProgress.current / generationProgress.total) * 100)}%</span>
                                </div>
                                <div className="h-2 w-full bg-surface-container rounded-full overflow-hidden border border-outline-variant/10">
                                  <div
                                    className="h-full bg-primary transition-all duration-300 rounded-full"
                                    style={{ width: `${(generationProgress.current / generationProgress.total) * 100}%` }}
                                  />
                                </div>
                              </div>
                            )}
                          </div>

                        </div>
                      )}
                    </div>

                    {/* 4. Imagen de herramientas necesarias */}
                    <div className="flex flex-col">
                      <button
                        type="button"
                        onClick={() => toggleSection("tools")}
                        className="flex items-center justify-between p-4 font-bold text-sm text-on-surface bg-surface-container-low hover:bg-surface-container transition-colors"
                      >
                        <span className="flex items-center gap-2">
                          <Image className="h-4.5 w-4.5 text-amber-400" />
                          4. Imagen de Herramientas Requeridas
                        </span>
                        {openSection === "tools" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </button>
                      
                      {openSection === "tools" && (
                        <div className="p-4 bg-surface-container-lowest/50 border-t border-outline-variant/10 text-xs">
                          <div className="flex items-center justify-between p-3.5 rounded-lg bg-surface-container border border-outline-variant/10">
                            <span className="font-semibold text-on-surface truncate">{imgHerramientas || "Sin imagen cargada"}</span>
                            <button
                              type="button"
                              onClick={() => handleSimulateUpload("tools")}
                              className="text-primary hover:underline font-bold"
                            >
                              Subir Imagen
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* 5. Imágenes de Ensambles especiales */}
                    <div className="flex flex-col">
                      <button
                        type="button"
                        onClick={() => toggleSection("ensambles")}
                        className="flex items-center justify-between p-4 font-bold text-sm text-on-surface bg-surface-container-low hover:bg-surface-container transition-colors"
                      >
                        <span className="flex items-center gap-2">
                          <Image className="h-4.5 w-4.5 text-purple-400" />
                          5. Imágenes de Ensambles Especiales ({ensambles.length})
                        </span>
                        {openSection === "ensambles" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </button>
                      
                      {openSection === "ensambles" && (
                        <div className="p-4 bg-surface-container-lowest/50 border-t border-outline-variant/10 space-y-3 text-xs">
                          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                            {ensambles.map((ens, idx) => (
                              <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-surface-container border border-outline-variant/10">
                                <span className="font-medium text-on-surface truncate">{ens}</span>
                                <button type="button" onClick={() => handleDeleteItem("ensamble", idx)} className="text-on-surface-variant hover:text-red-400 p-1">
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            ))}
                          </div>
                          <button
                            type="button"
                            onClick={() => handleSimulateUpload("ensamble")}
                            className="flex items-center gap-1 text-[11px] font-bold text-primary hover:underline"
                          >
                            <Plus className="h-3 w-3" /> Agregar ensamble especial
                          </button>
                        </div>
                      )}
                    </div>

                    {/* 6. Garantía del Producto */}
                    <div className="flex flex-col">
                      <button
                        type="button"
                        onClick={() => toggleSection("garantia")}
                        className="flex items-center justify-between p-4 font-bold text-sm text-on-surface bg-surface-container-low hover:bg-surface-container transition-colors"
                      >
                        <span className="flex items-center gap-2">
                          <FileText className="h-4.5 w-4.5 text-red-400" />
                          6. Garantía del Producto
                        </span>
                        {openSection === "garantia" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </button>
                      
                      {openSection === "garantia" && (
                        <div className="p-4 bg-surface-container-lowest/50 border-t border-outline-variant/10 text-xs">
                          <div className="flex items-center justify-between p-3.5 rounded-lg bg-surface-container border border-outline-variant/10">
                            <span className="font-semibold text-on-surface truncate">{garantiaDoc || "Sin garantía cargada"}</span>
                            <button
                              type="button"
                              onClick={() => handleSimulateUpload("garantia")}
                              className="text-primary hover:underline font-bold"
                            >
                              Subir Archivo
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* 7. Fotografías de los Herrajes */}
                    <div className="flex flex-col">
                      <button
                        type="button"
                        onClick={() => toggleSection("herrajes")}
                        className="flex items-center justify-between p-4 font-bold text-sm text-on-surface bg-surface-container-low hover:bg-surface-container transition-colors"
                      >
                        <span className="flex items-center gap-2">
                          <Image className="h-4.5 w-4.5 text-indigo-400" />
                          7. Fotografías de Herrajes Reales ({herrajesFotos.length})
                        </span>
                        {openSection === "herrajes" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </button>
                      
                      {openSection === "herrajes" && (
                        <div className="p-4 bg-surface-container-lowest/50 border-t border-outline-variant/10 space-y-3 text-xs">
                          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                            {herrajesFotos.map((hf, idx) => (
                              <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-surface-container border border-outline-variant/10">
                                <span className="font-medium text-on-surface truncate">{hf}</span>
                                <button type="button" onClick={() => handleDeleteItem("herrajes", idx)} className="text-on-surface-variant hover:text-red-400 p-1">
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            ))}
                          </div>
                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              onClick={() => handleSimulateUpload("herrajes")}
                              className="flex items-center gap-1 text-[11px] font-bold text-primary hover:underline"
                            >
                              <Plus className="h-3 w-3" /> Agregar foto de herraje
                            </button>
                            <button
                              type="button"
                              onClick={loadSharedHerrajesLibrary}
                              className="flex items-center gap-1 text-[11px] font-bold text-indigo-400 hover:underline"
                            >
                              <Library className="h-3.5 w-3.5" /> Seleccionar de biblioteca compartida
                            </button>
                          </div>

                          {showSharedLibrary && (
                            <div className="mt-2 p-3 rounded-lg bg-surface-container border border-indigo-400/20 space-y-2">
                              <p className="text-[10px] text-on-surface-variant font-semibold uppercase">
                                Biblioteca compartida ({sharedHerrajesLibrary.length} herrajes)
                              </p>
                              {sharedHerrajesLibrary.length === 0 ? (
                                <p className="text-[10px] text-on-surface-variant italic">No hay archivos en la biblioteca compartida.</p>
                              ) : (
                                <div className="grid grid-cols-2 gap-1.5 max-h-48 overflow-y-auto">
                                  {sharedHerrajesLibrary.map(name => {
                                    const isSelected = herrajesFotos.includes(`_shared:${name}`)
                                    return (
                                      <label key={name} className={`flex items-center gap-2 p-2 rounded text-[11px] cursor-pointer
                                        ${isSelected ? 'bg-indigo-500/20 text-indigo-300' : 'hover:bg-surface-container-high'}`}>
                                        <input
                                          type="checkbox"
                                          checked={isSelected}
                                          onChange={() => {
                                            if (isSelected) {
                                              setHerrajesFotos(prev => prev.filter(h => h !== `_shared:${name}`))
                                            } else {
                                              setHerrajesFotos(prev => [...prev, `_shared:${name}`])
                                            }
                                          }}
                                          className="accent-indigo-400 mr-1.5"
                                        />
                                        <span className="truncate">{name}</span>
                                      </label>
                                    )
                                  })}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* 8. Renders fotorealistas */}
                    <div className="flex flex-col">
                      <button
                        type="button"
                        onClick={() => toggleSection("renders")}
                        className="flex items-center justify-between p-4 font-bold text-sm text-on-surface bg-surface-container-low hover:bg-surface-container transition-colors"
                      >
                        <span className="flex items-center gap-2">
                          <Image className="h-4.5 w-4.5 text-sky-400" />
                          8. Renders Fotorealistas 3D ({renders.length})
                        </span>
                        {openSection === "renders" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </button>
                      
                      {openSection === "renders" && (
                        <div className="p-4 bg-surface-container-lowest/50 border-t border-outline-variant/10 space-y-3 text-xs">
                          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                            {renders.map((ren, idx) => (
                              <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-surface-container border border-outline-variant/10">
                                <span className="font-medium text-on-surface truncate">{ren}</span>
                                <button type="button" onClick={() => handleDeleteItem("renders", idx)} className="text-on-surface-variant hover:text-red-400 p-1">
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            ))}
                          </div>
                          <button
                            type="button"
                            onClick={() => handleSimulateUpload("renders")}
                            className="flex items-center gap-1 text-[11px] font-bold text-primary hover:underline"
                          >
                            <Plus className="h-3 w-3" /> Agregar render
                          </button>
                        </div>
                      )}
                    </div>

                  </div>
                </div>
              )}

              {activeTab === "despiece" && isTeam && (
                <div className="space-y-6">
                  {/* Banner superior con KPIs y Costo Total */}
                  <div className="rounded-2xl bg-surface-container-low border border-outline-variant/15 p-5 space-y-4 shadow-sm relative overflow-hidden">
                    {/* Fondo decorativo abstracto */}
                    <div className="absolute right-0 top-0 w-32 h-32 bg-primary/5 rounded-full filter blur-3xl pointer-events-none" />
                    
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-outline-variant/10 pb-4">
                      <div>
                        <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Costo Estimado de Fabricación</span>
                        <div className="text-3xl font-extrabold text-primary flex items-center gap-1.5 mt-0.5">
                          <Coins className="h-7 w-7 text-primary" />
                          <span>
                            ${despiece.reduce((acc, curr) => acc + ((curr.costoUnitario || 0) * curr.cantidad), 0).toLocaleString("es-CO", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2.5">
                        <button
                          type="button"
                          onClick={escanearModeloGLB}
                          disabled={isScanning}
                          className="flex items-center gap-2 rounded-xl bg-primary/10 border border-primary/20 px-4 py-2.5 text-xs font-semibold text-primary transition-all hover:bg-primary/20 active:scale-[0.98] disabled:opacity-50"
                        >
                          {isScanning ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin text-primary" />
                              Analizando P00.glb...
                            </>
                          ) : (
                            <>
                              <Sparkles className="h-4 w-4 text-primary animate-pulse" />
                              Escanear P00.glb
                            </>
                          )}
                        </button>
                        
                        {despiece.length > 0 && (
                          <button
                            type="button"
                            onClick={handleLimpiarDespiece}
                            className="flex items-center gap-2 rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-2.5 text-xs font-semibold text-red-400 transition-all hover:bg-red-500/20 active:scale-[0.98]"
                          >
                            <Trash2 className="h-4 w-4" />
                            Borrar Escaneo
                          </button>
                        )}
                        
                        {despiece.length > 0 && (
                          <button
                            type="button"
                            onClick={() => handleSaveDespiece(despiece)}
                            disabled={isSaving}
                            className="flex items-center gap-2 rounded-xl bg-teal-500/10 border border-teal-500/20 px-4 py-2.5 text-xs font-semibold text-teal-400 transition-all hover:bg-teal-500/20 active:scale-[0.98] disabled:opacity-50"
                          >
                            {isSaving ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin text-teal-400" />
                                Guardando...
                              </>
                            ) : (
                              <>
                                <CheckCircle2 className="h-4 w-4 text-teal-400" />
                                Guardar Despiece
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Fichas de KPI rápidas */}
                    <div className="grid grid-cols-3 gap-3">
                      <div className="p-3 rounded-xl bg-surface-container/40 border border-outline-variant/5 flex flex-col">
                        <span className="text-[9px] font-bold text-on-surface-variant/70 uppercase tracking-wider">Total Insumos</span>
                        <span className="text-lg font-bold text-on-surface mt-1">
                          {despiece.reduce((acc, curr) => acc + curr.cantidad, 0)} <span className="text-xs font-normal text-on-surface-variant/60">piezas</span>
                        </span>
                      </div>
                      
                      <div className="p-3 rounded-xl bg-surface-container/40 border border-outline-variant/5 flex flex-col">
                        <span className="text-[9px] font-bold text-on-surface-variant/70 uppercase tracking-wider">Maderas / Piezas</span>
                        <span className="text-lg font-bold text-primary mt-1">
                          {despiece.filter(d => !d.esHerraje && !d.esFondo).length} <span className="text-xs font-normal text-on-surface-variant/60">tipos</span>
                        </span>
                      </div>

                      <div className="p-3 rounded-xl bg-surface-container/40 border border-outline-variant/5 flex flex-col">
                        <span className="text-[9px] font-bold text-on-surface-variant/70 uppercase tracking-wider">Láminas / Fondos</span>
                        <span className="text-lg font-bold text-amber-500 mt-1">
                          {despiece.filter(d => d.esFondo).length} <span className="text-xs font-normal text-on-surface-variant/60">tipos</span>
                        </span>
                      </div>

                      <div className="p-3 rounded-xl bg-surface-container/40 border border-outline-variant/5 flex flex-col">
                        <span className="text-[9px] font-bold text-on-surface-variant/70 uppercase tracking-wider">Herrajes / Metales</span>
                        <span className="text-lg font-bold text-teal-400 mt-1">
                          {despiece.filter(d => d.esHerraje).length} <span className="text-xs font-normal text-on-surface-variant/60">tipos</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Listado de componentes */}
                  {despiece.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl bg-surface-container-low border border-outline-variant/10 space-y-4">
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                        <Boxes className="h-8 w-8 text-primary" />
                      </div>
                      <div className="max-w-md">
                        <h4 className="text-sm font-bold text-on-surface">No se ha generado el despiece</h4>
                        <p className="text-xs text-on-surface-variant/70 mt-1.5 leading-relaxed">
                          Escanea el archivo <span className="font-semibold text-primary">P00.glb</span> (el mueble completo) para identificar de forma automatizada las piezas de madera, herrajes y sus cantidades físicas exactas.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={escanearModeloGLB}
                        disabled={isScanning}
                        className="flex items-center gap-1.5 rounded-xl bg-primary px-5 py-2.5 text-xs font-semibold text-primary-foreground shadow-lg shadow-primary/15 transition hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                      >
                        {isScanning ? (
                          <>
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            Analizando Modelo 3D...
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-3.5 w-3.5" />
                            Escanear P00.glb Ahora
                          </>
                        )}
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {/* Sección de Maderas */}
                      <div className="space-y-3">
                        <h4 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider flex items-center gap-1.5">
                          <Hammer className="h-4 w-4 text-primary" />
                          Piezas de Madera / Estructura ({despiece.filter(d => !d.esHerraje && !d.esFondo).length})
                        </h4>
                        
                        <div className="rounded-xl border border-outline-variant/10 overflow-hidden divide-y divide-outline-variant/10 bg-surface-container-low shadow-sm">
                          <div className="grid px-4 py-2.5 bg-surface-container/60 border-b border-outline-variant/10 text-[10px] font-bold text-on-surface-variant/80 uppercase tracking-wider" style={{ gridTemplateColumns: "repeat(14, minmax(0, 1fr))" }}>
                            <span className="col-span-3">Pieza</span>
                            <span className="col-span-2">Descripción</span>
                            <span className="col-span-2 text-center">LxAxE (mm)</span>
                            <span className="col-span-1 text-center">Cant.</span>
                            <span className="col-span-2 text-center">Costo / m²</span>
                            <span className="col-span-2 text-center">Costo Unit.</span>
                            <span className="col-span-2 text-right">Total</span>
                          </div>

                          {despiece.filter(d => !d.esHerraje && !d.esFondo).map((item, idx) => {
                            const totalCosto = (item.costoUnitario || 0) * item.cantidad;
                            return (
                              <div key={idx} className="grid px-4 py-3 items-center text-xs hover:bg-surface-container-high/40 transition-colors group" style={{ gridTemplateColumns: "repeat(14, minmax(0, 1fr))" }}>
                                <div className="col-span-3 flex flex-col gap-1 py-1">
                                  {item.piezasLista && item.piezasLista.length > 0 ? (
                                    item.piezasLista.map((pz, pzIdx) => (
                                      <span key={pzIdx} className="font-mono font-bold text-[10px] text-primary bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20 select-none truncate inline-block w-fit">
                                        {pz}
                                      </span>
                                    ))
                                  ) : (
                                    <span className="font-mono font-bold text-[10px] text-primary bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20 select-none truncate inline-block w-fit">
                                      {item.piezaNumero || "—"}
                                    </span>
                                  )}
                                </div>

                                <div className="col-span-2 flex items-center gap-2 overflow-hidden">
                                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-primary/10 border border-primary/20 text-primary">
                                    <Hammer className="h-3 w-3" />
                                  </div>
                                  <span className="font-semibold text-on-surface truncate" title={item.nombre}>{item.nombre}</span>
                                </div>
                                
                                <span className="col-span-2 text-center font-mono text-[11px] text-on-surface-variant/80">
                                  {item.largo}x{item.ancho}x{item.espesor}
                                </span>

                                <span className="col-span-1 text-center font-mono font-bold text-on-surface bg-surface-container/60 py-1 px-1 rounded-lg max-w-[40px] mx-auto">
                                  {item.cantidad}
                                </span>
                                
                                <div className="col-span-2 flex items-center relative max-w-[90px] mx-auto">
                                  <span className="absolute left-2.5 text-on-surface-variant/50">$</span>
                                  <input
                                    type="number"
                                    min="0"
                                    value={item.costoM2 || ""}
                                    onChange={(e) => {
                                      const val = parseFloat(e.target.value) || 0;
                                      const areaM2 = ((item.largo || 0) * (item.ancho || 0)) / 1000000;
                                      const nuevoUnitario = Math.round(areaM2 * val);
                                      
                                      setDespiece(prev => prev.map(d => 
                                        (d.nombre === item.nombre && d.largo === item.largo && d.ancho === item.ancho) 
                                        ? { ...d, costoM2: val, costoUnitario: nuevoUnitario } 
                                        : d
                                      ));
                                    }}
                                    className="w-full pl-6 pr-2 py-1.5 bg-surface-container border border-outline-variant/20 rounded-lg outline-none focus:border-primary focus:ring-1 focus:ring-primary font-mono text-[11px] text-on-surface"
                                    placeholder="0"
                                  />
                                </div>
                                
                                <div className="col-span-2 flex items-center relative max-w-[90px] mx-auto">
                                  <span className="absolute left-2.5 text-on-surface-variant/50">$</span>
                                  <input
                                    type="number"
                                    min="0"
                                    value={item.costoUnitario || ""}
                                    onChange={(e) => {
                                      const val = parseFloat(e.target.value) || 0;
                                      setDespiece(prev => prev.map(d => 
                                        (d.nombre === item.nombre && d.largo === item.largo && d.ancho === item.ancho) 
                                        ? { ...d, costoUnitario: val, costoM2: 0 } 
                                        : d
                                      ));
                                    }}
                                    className="w-full pl-6 pr-2 py-1.5 bg-surface-container border border-outline-variant/20 rounded-lg outline-none focus:border-primary focus:ring-1 focus:ring-primary font-mono text-[11px] text-on-surface"
                                    placeholder="0"
                                  />
                                </div>
                                
                                <span className="col-span-2 text-right font-mono font-bold text-on-surface-variant/90">
                                  ${totalCosto.toLocaleString("es-CO", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                                </span>
                              </div>
                            );
                          })}
                          
                          {/* Fila de Total de Madera */}
                          <div className="grid px-4 py-3 items-center text-xs bg-surface-container/30 border-t border-outline-variant/10 font-bold" style={{ gridTemplateColumns: "repeat(14, minmax(0, 1fr))" }}>
                            <span className="col-span-3 text-on-surface-variant/70">TOTAL MADERA</span>
                            <span className="col-span-2"></span>
                            <span className="col-span-2"></span>
                            <span className="col-span-1 text-center font-mono bg-surface-container/80 py-1 px-1 rounded-lg max-w-[40px] mx-auto">
                              {despiece.filter(d => !d.esHerraje && !d.esFondo).reduce((acc, curr) => acc + curr.cantidad, 0)}
                            </span>
                            <span className="col-span-2"></span>
                            <span className="col-span-2"></span>
                            <span className="col-span-2 text-right font-mono text-primary text-sm">
                              ${despiece.filter(d => !d.esHerraje && !d.esFondo).reduce((acc, curr) => acc + ((curr.costoUnitario || 0) * curr.cantidad), 0).toLocaleString("es-CO", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Sección de Fondos / Láminas */}
                      {despiece.filter(d => d.esFondo).length > 0 && (
                        <div className="space-y-3">
                          <h4 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider flex items-center gap-1.5">
                            <Layers className="h-4 w-4 text-amber-500" />
                            Láminas / Fondos (2.5mm - 3mm) ({despiece.filter(d => d.esFondo).length})
                          </h4>
                          
                          <div className="rounded-xl border border-outline-variant/10 overflow-hidden divide-y divide-outline-variant/10 bg-surface-container-low shadow-sm">
                            <div className="grid px-4 py-2.5 bg-surface-container/60 border-b border-outline-variant/10 text-[10px] font-bold text-on-surface-variant/80 uppercase tracking-wider" style={{ gridTemplateColumns: "repeat(14, minmax(0, 1fr))" }}>
                              <span className="col-span-3">Pieza</span>
                              <span className="col-span-2">Descripción</span>
                              <span className="col-span-2 text-center">LxAxE (mm)</span>
                              <span className="col-span-1 text-center">Cant.</span>
                              <span className="col-span-2 text-center">Costo / m²</span>
                              <span className="col-span-2 text-center">Costo Unit.</span>
                              <span className="col-span-2 text-right">Total</span>
                            </div>

                            {despiece.filter(d => d.esFondo).map((item, idx) => {
                              const totalCosto = (item.costoUnitario || 0) * item.cantidad;
                              return (
                                <div key={idx} className="grid px-4 py-3 items-center text-xs hover:bg-surface-container-high/40 transition-colors group" style={{ gridTemplateColumns: "repeat(14, minmax(0, 1fr))" }}>
                                  <div className="col-span-3 flex flex-col gap-1 py-1">
                                    {item.piezasLista && item.piezasLista.length > 0 ? (
                                      item.piezasLista.map((pz, pzIdx) => (
                                        <span key={pzIdx} className="font-mono font-bold text-[10px] text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20 select-none truncate inline-block w-fit">
                                          {pz}
                                        </span>
                                      ))
                                    ) : (
                                      <span className="font-mono font-bold text-[10px] text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20 select-none truncate inline-block w-fit">
                                        {item.piezaNumero || "—"}
                                      </span>
                                    )}
                                  </div>

                                  <div className="col-span-2 flex items-center gap-2 overflow-hidden">
                                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-amber-500/10 border border-amber-500/20 text-amber-500">
                                      <Layers className="h-3 w-3" />
                                    </div>
                                    <span className="font-semibold text-on-surface truncate" title={item.nombre}>{item.nombre}</span>
                                  </div>
                                  
                                  <span className="col-span-2 text-center font-mono text-[11px] text-on-surface-variant/80">
                                    {item.largo}x{item.ancho}x{item.espesor}
                                  </span>

                                  <span className="col-span-1 text-center font-mono font-bold text-on-surface bg-surface-container/60 py-1 px-1 rounded-lg max-w-[40px] mx-auto">
                                    {item.cantidad}
                                  </span>
                                  
                                  <div className="col-span-2 flex items-center relative max-w-[90px] mx-auto">
                                    <span className="absolute left-2.5 text-on-surface-variant/50">$</span>
                                    <input
                                      type="number"
                                      min="0"
                                      value={item.costoM2 || ""}
                                      onChange={(e) => {
                                        const val = parseFloat(e.target.value) || 0;
                                        const areaM2 = ((item.largo || 0) * (item.ancho || 0)) / 1000000;
                                        const nuevoUnitario = Math.round(areaM2 * val);
                                        
                                        setDespiece(prev => prev.map(d => 
                                          (d.nombre === item.nombre && d.largo === item.largo && d.ancho === item.ancho) 
                                          ? { ...d, costoM2: val, costoUnitario: nuevoUnitario } 
                                          : d
                                        ));
                                      }}
                                      className="w-full pl-6 pr-2 py-1.5 bg-surface-container border border-outline-variant/20 rounded-lg outline-none focus:border-primary focus:ring-1 focus:ring-primary font-mono text-[11px] text-on-surface"
                                      placeholder="0"
                                    />
                                  </div>
                                  
                                  <div className="col-span-2 flex items-center relative max-w-[90px] mx-auto">
                                    <span className="absolute left-2.5 text-on-surface-variant/50">$</span>
                                    <input
                                      type="number"
                                      min="0"
                                      value={item.costoUnitario || ""}
                                      onChange={(e) => {
                                        const val = parseFloat(e.target.value) || 0;
                                        setDespiece(prev => prev.map(d => 
                                          (d.nombre === item.nombre && d.largo === item.largo && d.ancho === item.ancho) 
                                          ? { ...d, costoUnitario: val, costoM2: 0 } 
                                          : d
                                        ));
                                      }}
                                      className="w-full pl-6 pr-2 py-1.5 bg-surface-container border border-outline-variant/20 rounded-lg outline-none focus:border-primary focus:ring-1 focus:ring-primary font-mono text-[11px] text-on-surface"
                                      placeholder="0"
                                    />
                                  </div>
                                  
                                  <span className="col-span-2 text-right font-mono font-bold text-on-surface-variant/90">
                                    ${totalCosto.toLocaleString("es-CO", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                                  </span>
                                </div>
                              );
                            })}
                            
                            {/* Fila de Total de Láminas */}
                            <div className="grid px-4 py-3 items-center text-xs bg-surface-container/30 border-t border-outline-variant/10 font-bold" style={{ gridTemplateColumns: "repeat(14, minmax(0, 1fr))" }}>
                              <span className="col-span-3 text-on-surface-variant/70">TOTAL LÁMINAS</span>
                              <span className="col-span-2"></span>
                              <span className="col-span-2"></span>
                              <span className="col-span-1 text-center font-mono bg-surface-container/80 py-1 px-1 rounded-lg max-w-[40px] mx-auto">
                                {despiece.filter(d => d.esFondo).reduce((acc, curr) => acc + curr.cantidad, 0)}
                              </span>
                              <span className="col-span-2"></span>
                              <span className="col-span-2"></span>
                              <span className="col-span-2 text-right font-mono text-amber-500 text-sm">
                                ${despiece.filter(d => d.esFondo).reduce((acc, curr) => acc + ((curr.costoUnitario || 0) * curr.cantidad), 0).toLocaleString("es-CO", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}


                      {/* Sección de Herrajes */}
                      <div className="space-y-3">
                        <h4 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider flex items-center gap-1.5">
                          <Wrench className="h-4 w-4 text-teal-400" />
                          Herrajes / Fijaciones / Accesorios ({despiece.filter(d => d.esHerraje).length})
                        </h4>
                        
                        <div className="rounded-xl border border-outline-variant/10 overflow-hidden divide-y divide-outline-variant/10 bg-surface-container-low shadow-sm">
                          <div className="grid px-4 py-2.5 bg-surface-container/60 border-b border-outline-variant/10 text-[10px] font-bold text-on-surface-variant/80 uppercase tracking-wider" style={{ gridTemplateColumns: "repeat(14, minmax(0, 1fr))" }}>
                            <span className="col-span-3"></span>
                            <span className="col-span-4">Descripción</span>
                            <span className="col-span-1 text-center">Cant.</span>
                            <span className="col-span-2"></span>
                            <span className="col-span-2 text-center">Costo Unit.</span>
                            <span className="col-span-2 text-right">Total</span>
                          </div>

                          {despiece.filter(d => d.esHerraje).map((item, idx) => {
                            const totalCosto = (item.costoUnitario || 0) * item.cantidad;
                            return (
                              <div key={idx} className="grid px-4 py-3 items-center text-xs hover:bg-surface-container-high/40 transition-colors group" style={{ gridTemplateColumns: "repeat(14, minmax(0, 1fr))" }}>
                                <div className="col-span-3"></div>
                                <div className="col-span-4 flex items-center gap-2.5 overflow-hidden">
                                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-teal-500/10 border border-teal-500/20 text-teal-400">
                                    <Wrench className="h-3.5 w-3.5" />
                                  </div>
                                  <span className="font-semibold text-on-surface truncate" title={item.nombre}>{item.nombre}</span>
                                </div>
                                <span className="col-span-1 text-center font-mono font-bold text-on-surface bg-surface-container/60 py-1 px-1 rounded-lg max-w-[40px] mx-auto">{item.cantidad}</span>
                                <div className="col-span-2"></div>
                                <div className="col-span-2 flex items-center relative max-w-[90px] mx-auto">
                                  <span className="absolute left-2.5 text-on-surface-variant/50">$</span>
                                  <input
                                    type="number"
                                    min="0"
                                    value={item.costoUnitario || ""}
                                    onChange={(e) => {
                                      const val = parseFloat(e.target.value) || 0;
                                      setDespiece(prev => prev.map(d => d.nombre === item.nombre ? { ...d, costoUnitario: val } : d));
                                    }}
                                    className="w-full pl-6 pr-2 py-1.5 bg-surface-container border border-outline-variant/20 rounded-lg outline-none focus:border-primary focus:ring-1 focus:ring-primary font-mono text-[11px] text-on-surface"
                                    placeholder="0"
                                  />
                                </div>
                                <span className="col-span-2 text-right font-mono font-bold text-on-surface-variant/90">
                                  ${totalCosto.toLocaleString("es-CO", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                                </span>
                              </div>
                            );
                          })}
                          
                          {/* Fila de Total de Herrajes */}
                          <div className="grid px-4 py-3 items-center text-xs bg-surface-container/30 border-t border-outline-variant/10 font-bold" style={{ gridTemplateColumns: "repeat(14, minmax(0, 1fr))" }}>
                            <span className="col-span-3 text-on-surface-variant/70">TOTAL HERRAJES</span>
                            <span className="col-span-4"></span>
                            <span className="col-span-1 text-center font-mono bg-surface-container/80 py-1 px-1 rounded-lg max-w-[40px] mx-auto">
                              {despiece.filter(d => d.esHerraje).reduce((acc, curr) => acc + curr.cantidad, 0)}
                            </span>
                            <span className="col-span-2"></span>
                            <span className="col-span-2"></span>
                            <span className="col-span-2 text-right font-mono text-teal-400 text-sm">
                              ${despiece.filter(d => d.esHerraje).reduce((acc, curr) => acc + ((curr.costoUnitario || 0) * curr.cantidad), 0).toLocaleString("es-CO", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Gran Total */}
                      <div className="flex justify-end pt-4">
                        <div className="rounded-xl border border-outline-variant/20 bg-surface-container/60 p-4 min-w-[300px] shadow-sm flex flex-col gap-1.5">
                          <div className="flex justify-between items-center text-xs text-on-surface-variant/80 font-bold uppercase tracking-wider">
                            <span>Total Maderas:</span>
                            <span className="font-mono text-primary">
                              ${despiece.filter(d => !d.esHerraje && !d.esFondo).reduce((acc, curr) => acc + ((curr.costoUnitario || 0) * curr.cantidad), 0).toLocaleString("es-CO", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                            </span>
                          </div>
                          <div className="flex justify-between items-center text-xs text-on-surface-variant/80 font-bold uppercase tracking-wider">
                            <span>Total Láminas:</span>
                            <span className="font-mono text-amber-500">
                              ${despiece.filter(d => d.esFondo).reduce((acc, curr) => acc + ((curr.costoUnitario || 0) * curr.cantidad), 0).toLocaleString("es-CO", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                            </span>
                          </div>
                          <div className="flex justify-between items-center text-xs text-on-surface-variant/80 font-bold uppercase tracking-wider">
                            <span>Total Herrajes:</span>
                            <span className="font-mono text-teal-400">
                              ${despiece.filter(d => d.esHerraje).reduce((acc, curr) => acc + ((curr.costoUnitario || 0) * curr.cantidad), 0).toLocaleString("es-CO", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                            </span>
                          </div>
                          <div className="border-t border-outline-variant/20 my-1"></div>
                          <div className="flex justify-between items-center font-bold text-xs text-on-surface uppercase tracking-wider">
                            <span className="text-sm">Gran Total:</span>
                            <span className="font-mono text-teal-400 text-base bg-teal-500/10 px-2 py-0.5 rounded border border-teal-500/20">
                              ${despiece.reduce((acc, curr) => acc + ((curr.costoUnitario || 0) * curr.cantidad), 0).toLocaleString("es-CO", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Status Display Messages */}
              {error && (
                <div className="rounded-xl bg-red-500/10 p-3.5 text-xs text-red-400 border border-red-500/20 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}
              {successMsg && (
                <div className="rounded-xl bg-success/15 p-3.5 text-xs text-success border border-success/30 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span>{successMsg}</span>
                </div>
              )}

            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between border-t border-outline-variant p-6 bg-surface-container-low">
              <div className="text-xs text-on-surface-variant/60 font-mono">
                ID Proyecto: {proyecto.id.substring(0, 8)}...
              </div>
              
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-xl border border-outline-variant px-5 py-2.5 text-sm font-medium text-on-surface transition hover:bg-surface-container-high"
                >
                  Cerrar
                </button>
                
                {activeTab === "insumos" && isTeam && (
                  <button
                    type="button"
                    onClick={handleSaveInsumos}
                    disabled={isSaving}
                    className="flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Guardando...
                      </>
                    ) : (
                      "Guardar Insumos en CMS"
                    )}
                  </button>
                )}
              </div>
            </div>

          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
