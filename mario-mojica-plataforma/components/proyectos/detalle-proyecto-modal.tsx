"use client"

import React, { useState, useEffect, useRef } from "react"
import { X, Download, Paperclip, Image, FileText, Music, Cpu, Layers, Plus, Trash2, Loader2, Eye, ExternalLink, ChevronDown, ChevronUp, UploadCloud, CheckCircle2, AlertCircle, FileSpreadsheet, Box } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { usePermissions } from "@/hooks/use-permissions"
import { createClient } from "@/lib/supabase/client"

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
  const [activeTab, setActiveTab] = useState<"solicitud" | "insumos">("solicitud")
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
  const [glbSteps, setGlbSteps] = useState<{ step: string; fileName: string; progress: number }[]>([])
  const [audioEsSteps, setAudioEsSteps] = useState<{ step: string; fileName: string }[]>([])
  const [audioEnSteps, setAudioEnSteps] = useState<{ step: string; fileName: string }[]>([])
  
  const [audioAyuda, setAudioAyuda] = useState<string>("")
  const [imgHerramientas, setImgHerramientas] = useState<string>("")
  const [ensambles, setEnsambles] = useState<string[]>([])
  const [garantiaDoc, setGarantiaDoc] = useState<string>("")
  const [herrajesFotos, setHerrajesFotos] = useState<string[]>([])
  const [renders, setRenders] = useState<string[]>([])

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
            }
          })
      }
    }
  }, [proyecto])



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
        const stepStr = step || String(glbSteps.length).padStart(2, "0")
        path = `${codigoManual}/models/P${stepStr}.glb`
        updatedStateCallback = () => {
          setGlbSteps(prev => {
            const filtered = prev.filter(s => s.step !== stepStr)
            return [...filtered, { step: stepStr, fileName: `P${stepStr}.glb`, progress: 100 }].sort((a,b) => a.step.localeCompare(b.step))
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

  const handleDeleteItem = (type: string, stepOrIndex: any) => {
    handleRealDelete(type, stepOrIndex)
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
          renders_fotorealistas: renders
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
            className="fixed inset-x-4 top-[5%] z-50 mx-auto max-w-3xl overflow-y-auto max-h-[90vh] rounded-2xl border border-outline-variant bg-surface-container p-0 shadow-2xl flex flex-col"
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
                            href={`http://localhost:5173/${codigoManual}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline font-semibold flex items-center gap-1 transition-all group shrink-0"
                          >
                            Local: http://localhost:5173/{codigoManual}
                            <ExternalLink className="h-3 w-3 opacity-60 group-hover:opacity-100 transition-opacity" />
                          </a>
                          <a
                            href={`https://mariomojica.com/embed/armado/${codigoManual}`}
                            target="_blank"
                            rel="noopener noreferrer"
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
                          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                            {glbSteps.map((g) => (
                              <div key={g.step} className="flex items-center justify-between p-3 rounded-lg bg-surface-container border border-outline-variant/10 text-xs">
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

                    {/* 2. Audios en Español e Inglés */}
                    <div className="flex flex-col">
                      <button
                        type="button"
                        onClick={() => toggleSection("audios")}
                        className="flex items-center justify-between p-4 font-bold text-sm text-on-surface bg-surface-container-low hover:bg-surface-container transition-colors"
                      >
                        <span className="flex items-center gap-2">
                          <Music className="h-4.5 w-4.5 text-teal-400" />
                          2. Audio de los Pasos (Español / Inglés)
                        </span>
                        {openSection === "audios" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </button>
                      
                      {openSection === "audios" && (
                        <div className="p-4 bg-surface-container-lowest/50 border-t border-outline-variant/10 space-y-4">
                          {glbSteps.map((g) => {
                            const audioEs = audioEsSteps.find(a => a.step === g.step)
                            const audioEn = audioEnSteps.find(a => a.step === g.step)
                            return (
                              <div key={g.step} className="p-3.5 rounded-xl border border-outline-variant/10 bg-surface-container/60 flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between text-xs">
                                <span className="font-bold text-on-surface">Paso {g.step}</span>
                                
                                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 flex-1 sm:ml-6">
                                  {/* Español */}
                                  <div className="flex items-center justify-between bg-surface-container border border-outline-variant/10 px-3 py-1.5 rounded-lg">
                                    <span className="text-[10px] text-on-surface-variant/80">ES: {audioEs ? audioEs.fileName : "Pendiente"}</span>
                                    <div className="flex items-center gap-2">
                                      <button type="button" onClick={() => handleSimulateUpload("audio_es", g.step)} className="text-primary hover:underline text-[10px]">Cargar</button>
                                      {audioEs && (
                                        <button type="button" onClick={() => handleDeleteItem("audio_es", g.step)} className="text-on-surface-variant hover:text-red-400"><Trash2 className="h-3 w-3" /></button>
                                      )}
                                    </div>
                                  </div>

                                  {/* Inglés */}
                                  <div className="flex items-center justify-between bg-surface-container border border-outline-variant/10 px-3 py-1.5 rounded-lg">
                                    <span className="text-[10px] text-on-surface-variant/80">EN: {audioEn ? audioEn.fileName : "Pendiente"}</span>
                                    <div className="flex items-center gap-2">
                                      <button type="button" onClick={() => handleSimulateUpload("audio_en", g.step)} className="text-primary hover:underline text-[10px]">Cargar</button>
                                      {audioEn && (
                                        <button type="button" onClick={() => handleDeleteItem("audio_en", g.step)} className="text-on-surface-variant hover:text-red-400"><Trash2 className="h-3 w-3" /></button>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>

                    {/* 3. Audio de Ayuda */}
                    <div className="flex flex-col">
                      <button
                        type="button"
                        onClick={() => toggleSection("ayuda")}
                        className="flex items-center justify-between p-4 font-bold text-sm text-on-surface bg-surface-container-low hover:bg-surface-container transition-colors"
                      >
                        <span className="flex items-center gap-2">
                          <Music className="h-4.5 w-4.5 text-pink-400" />
                          3. Audio de Ayuda del Tutorial (Global)
                        </span>
                        {openSection === "ayuda" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </button>
                      
                      {openSection === "ayuda" && (
                        <div className="p-4 bg-surface-container-lowest/50 border-t border-outline-variant/10 text-xs">
                          <div className="flex items-center justify-between p-3.5 rounded-lg bg-surface-container border border-outline-variant/10">
                            <span className="font-semibold text-on-surface truncate">{audioAyuda || "Sin audio cargado"}</span>
                            <button
                              type="button"
                              onClick={() => handleSimulateUpload("audio_ayuda")}
                              className="text-primary hover:underline font-bold"
                            >
                              Subir Audio
                            </button>
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
                          <button
                            type="button"
                            onClick={() => handleSimulateUpload("herrajes")}
                            className="flex items-center gap-1 text-[11px] font-bold text-primary hover:underline"
                          >
                            <Plus className="h-3 w-3" /> Agregar foto de herraje
                          </button>
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
