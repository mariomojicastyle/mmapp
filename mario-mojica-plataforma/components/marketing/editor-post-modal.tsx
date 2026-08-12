"use client"

import React, { useState, useEffect } from "react"
import { X, Calendar, Send, Eye, Sparkles, Check, UploadCloud, Film, Image as ImageIcon, ChevronLeft, ChevronRight, GripVertical, ArrowUp, ArrowDown, Trash2, Globe, Loader2, Link2 } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { createMarketingPost, updateMarketingPost, deleteMarketingPost } from "@/app/actions/marketing"
import { createClient } from "@/lib/supabase/client"

function dataURLtoBlob(dataurl: string) {
  const arr = dataurl.split(",")
  const mime = arr[0].match(/:(.*?);/)?.[1] || "application/octet-stream"
  const bstr = atob(arr[1])
  let n = bstr.length
  const u8arr = new Uint8Array(n)
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n)
  }
  return new Blob([u8arr], { type: mime })
}

function getGoogleDriveEmbedUrl(url?: string) {
  if (!url) return null
  const match = url.match(/id=([a-zA-Z0-9_-]+)/)
  if (match) {
    return `https://drive.google.com/file/d/${match[1]}/preview`
  }
  return null
}

export interface DriveFile {
  id: string
  name: string
  mimeType: string
  thumbnailUrl?: string
  webContentLink?: string
}

interface EditorPostModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
  onDelete?: (id: string) => Promise<void>
  initialData?: {
    id?: string
    titulo?: string | null
    contenido_base?: string
    fecha_programada?: string | null
    plataformas_destino?: string[]
    overrides_redes?: Record<string, any>
    drive_file_ids?: string[]
  } | null
}

export function EditorPostModal({ isOpen, onClose, onSuccess, onDelete, initialData }: EditorPostModalProps) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [titulo, setTitulo] = useState("")
  const [contenidoBase, setContenidoBase] = useState("")
  const [primerComentario, setPrimerComentario] = useState("Prueba la demo interactiva del manual 3D en tu propio celular aquí: https://mariomojica.com/demo 🚀")
  const [plataformas, setPlataformas] = useState<string[]>(["instagram", "facebook"])
  const [fechaProgramada, setFechaProgramada] = useState("")
  const [programTimezone, setProgramTimezone] = useState("America/Sao_Paulo")
  const [selectedFiles, setSelectedFiles] = useState<DriveFile[]>([])
  const [previewTab, setPreviewTab] = useState<"linkedin" | "instagram" | "facebook" | "youtube">("instagram")
  const [activeImageIndex, setActiveImageIndex] = useState(0)
  const [saving, setSaving] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [draggedItemIndex, setDraggedItemIndex] = useState<number | null>(null)

  // Convierte una cadena "YYYY-MM-DDTHH:mm" ingresada en una zona horaria dada a ISO UTC string real
  const parseLocalDateTimeToISO = (dateTimeStr: string, timeZone: string): string => {
    if (!dateTimeStr) return new Date().toISOString()
    const [datePart, timePart] = dateTimeStr.split("T")
    if (!datePart || !timePart) return new Date(dateTimeStr).toISOString()
    const [year, month, day] = datePart.split("-").map(Number)
    const [hours, minutes] = timePart.split(":").map(Number)

    const offsetHours = timeZone === "America/Sao_Paulo" ? -3 : -5
    const utcDate = new Date(Date.UTC(year, month - 1, day, hours - offsetHours, minutes))
    return utcDate.toISOString()
  }

  // Convierte una fecha ISO UTC recibida a la representación "YYYY-MM-DDTHH:mm" en la zona horaria seleccionada
  const formatISOToLocalDateTimeInput = (isoStr: string, timeZone: string): string => {
    const d = new Date(isoStr)
    if (isNaN(d.getTime())) return ""
    const offsetHours = timeZone === "America/Sao_Paulo" ? -3 : -5
    const targetDate = new Date(d.getTime() + offsetHours * 3600 * 1000)
    const pad = (n: number) => n.toString().padStart(2, "0")
    return `${targetDate.getUTCFullYear()}-${pad(targetDate.getUTCMonth() + 1)}-${pad(targetDate.getUTCDate())}T${pad(targetDate.getUTCHours())}:${pad(targetDate.getUTCMinutes())}`
  }

  // Formateador por defecto para fecha actual
  const formatLocalDateForInput = (d: Date) => {
    const pad = (n: number) => n.toString().padStart(2, "0")
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
  }

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setTitulo(initialData.titulo || "")
        setContenidoBase(initialData.contenido_base || "")
        setPlataformas(initialData.plataformas_destino || ["instagram", "facebook"])

        if (initialData.fecha_programada) {
          setFechaProgramada(formatISOToLocalDateTimeInput(initialData.fecha_programada, programTimezone))
        } else {
          setFechaProgramada(formatISOToLocalDateTimeInput(new Date(Date.now() + 600000).toISOString(), programTimezone)) // Default +10 min
        }

        if (initialData.overrides_redes?.primer_comentario) {
          setPrimerComentario(initialData.overrides_redes.primer_comentario)
        }

        // Cargar archivos de medios previamente guardados de forma segura
        if (initialData.overrides_redes?.archivos_detalles && Array.isArray(initialData.overrides_redes.archivos_detalles)) {
          // Filtrar cualquier item "Medio X" corrupto que no tenga imagen real
          const validFiles = initialData.overrides_redes.archivos_detalles.filter(
            (f: DriveFile) => f.thumbnailUrl || (f.name && !f.name.startsWith("Medio "))
          )
          setSelectedFiles(validFiles)
        } else if (initialData.drive_file_ids && initialData.drive_file_ids.length > 0) {
          const reconstructed: DriveFile[] = initialData.drive_file_ids
            .filter((id) => id.startsWith("http") || id.startsWith("data:"))
            .map((id, idx) => ({
              id,
              name: `Imagen ${idx + 1}`,
              mimeType: "image/png",
              thumbnailUrl: id,
            }))
          setSelectedFiles(reconstructed)
        } else {
          setSelectedFiles([])
        }
      } else {
        setTitulo("")
        setContenidoBase("")
        setPlataformas(["instagram", "facebook"])
        setFechaProgramada(formatISOToLocalDateTimeInput(new Date(Date.now() + 86400000).toISOString(), programTimezone))
        setSelectedFiles([])
      }
      setActiveImageIndex(0)
    }
  }, [isOpen, initialData])

  if (!isOpen) return null

  const togglePlataforma = (plat: string) => {
    setPlataformas((prev) =>
      prev.includes(plat) ? prev.filter((p) => p !== plat) : [...prev, plat]
    )
  }

  // Convierte y comprime imágenes locales a DataURL para persistencia ultraligera en Supabase
  const fileToDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      if (file.type.startsWith("video/")) {
        const reader = new FileReader()
        reader.onload = (e) => resolve((e.target?.result as string) || "")
        reader.readAsDataURL(file)
        return
      }

      const img = new Image()
      const url = URL.createObjectURL(file)
      img.onload = () => {
        const maxDim = 1600
        let w = img.width
        let h = img.height
        if (w > maxDim || h > maxDim) {
          if (w > h) {
            h = Math.round((h * maxDim) / w)
            w = maxDim
          } else {
            w = Math.round((w * maxDim) / h)
            h = maxDim
          }
        }
        const canvas = document.createElement("canvas")
        canvas.width = w
        canvas.height = h
        const ctx = canvas.getContext("2d")
        if (ctx) {
          ctx.imageSmoothingEnabled = true
          ctx.imageSmoothingQuality = "high"
          ctx.drawImage(img, 0, 0, w, h)
          // Preservar alta definición comprimida a 85% para transmisión de alto rendimiento
          const compressed = canvas.toDataURL("image/jpeg", 0.85)
          URL.revokeObjectURL(url)
          resolve(compressed)
          return
        }
        URL.revokeObjectURL(url)
        const reader = new FileReader()
        reader.onload = (e) => resolve((e.target?.result as string) || "")
        reader.readAsDataURL(file)
      }
      img.onerror = () => {
        URL.revokeObjectURL(url)
        const reader = new FileReader()
        reader.onload = (e) => resolve((e.target?.result as string) || "")
        reader.readAsDataURL(file)
      }
      img.src = url
    })
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFiles = Array.from(e.dataTransfer.files)
      const newFiles: DriveFile[] = []

      for (const file of droppedFiles) {
        const dataUrl = await fileToDataUrl(file)
        newFiles.push({
          id: "local_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7),
          name: file.name,
          mimeType: file.type || "application/octet-stream",
          thumbnailUrl: dataUrl,
        })
      }

      setSelectedFiles((prev) => [...prev, ...newFiles])
    }
  }

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selected = Array.from(e.target.files)
      const newFiles: DriveFile[] = []

      for (const file of selected) {
        const dataUrl = await fileToDataUrl(file)
        newFiles.push({
          id: "local_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7),
          name: file.name,
          mimeType: file.type || "application/octet-stream",
          thumbnailUrl: dataUrl,
        })
      }

      setSelectedFiles((prev) => [...prev, ...newFiles])
    }
  }

  const parseGoogleDriveLink = (url: string) => {
    const regExp = /\/file\/d\/([a-zA-Z0-9_-]+)|id=([a-zA-Z0-9_-]+)/
    const match = url.match(regExp)
    if (match) {
      const fileId = match[1] || match[2]
      return {
        id: fileId,
        directUrl: `https://drive.usercontent.google.com/download?id=${fileId}&export=download`,
      }
    }
    return null
  }

  const handleAddGoogleDriveLink = (url: string) => {
    const parsed = parseGoogleDriveLink(url)
    if (!parsed) {
      alert("Enlace de Google Drive inválido. Asegúrate de copiar el enlace de compartir del archivo.")
      return
    }

    const isImage = url.toLowerCase().includes(".jpg") || url.toLowerCase().includes(".png") || url.toLowerCase().includes(".jpeg")
    const mimeType = isImage ? "image/jpeg" : "video/mp4"

    const newFile: DriveFile = {
      id: parsed.directUrl,
      name: `Google Drive - ${parsed.id.substring(0, 6)}...`,
      mimeType: mimeType,
      thumbnailUrl: parsed.directUrl,
    }

    setSelectedFiles((prev) => [...prev, newFile])
  }

  // Reordenamiento Drag & Drop
  const handleItemDragStart = (index: number) => {
    setDraggedItemIndex(index)
  }

  const handleItemDragOver = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault()
    if (draggedItemIndex === null || draggedItemIndex === targetIndex) return

    const updatedFiles = [...selectedFiles]
    const [movedItem] = updatedFiles.splice(draggedItemIndex, 1)
    updatedFiles.splice(targetIndex, 0, movedItem)

    setSelectedFiles(updatedFiles)
    setDraggedItemIndex(targetIndex)
    setActiveImageIndex(targetIndex)
  }

  const handleItemDragEnd = () => {
    setDraggedItemIndex(null)
  }

  const moveItemUp = (index: number) => {
    if (index === 0) return
    const updatedFiles = [...selectedFiles]
    const temp = updatedFiles[index]
    updatedFiles[index] = updatedFiles[index - 1]
    updatedFiles[index - 1] = temp
    setSelectedFiles(updatedFiles)
    setActiveImageIndex(index - 1)
  }

  const moveItemDown = (index: number) => {
    if (index === selectedFiles.length - 1) return
    const updatedFiles = [...selectedFiles]
    const temp = updatedFiles[index]
    updatedFiles[index] = updatedFiles[index + 1]
    updatedFiles[index + 1] = temp
    setSelectedFiles(updatedFiles)
    setActiveImageIndex(index + 1)
  }

  const handleSave = async (estado: "borrador" | "programado") => {
    if (!contenidoBase.trim()) {
      alert("El contenido principal no puede estar vacío.")
      return
    }

    setSaving(true)

    try {
      // Convertir cualquier DataURL local a URL pública HTTPS en Supabase Storage de forma directa desde el navegador (soporta archivos de más de 6MB)
      const processedFiles: DriveFile[] = []
      const supabase = createClient()

      for (const f of selectedFiles) {
        let finalUrl = f.thumbnailUrl || f.id
        if (finalUrl && (finalUrl.startsWith("data:image/") || finalUrl.startsWith("data:video/"))) {
          try {
            const blob = dataURLtoBlob(finalUrl)
            const ext = blob.type.split("/")[1] || "jpg"
            const fileName = `post_media_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${ext}`

            const { error: uploadErr } = await supabase.storage
              .from("marketing-media")
              .upload(fileName, blob, {
                contentType: blob.type,
                upsert: true,
              })

            if (uploadErr) {
              throw new Error(uploadErr.message)
            }

            const { data: publicUrlData } = supabase.storage
              .from("marketing-media")
              .getPublicUrl(fileName)

            if (publicUrlData?.publicUrl) {
              finalUrl = publicUrlData.publicUrl
            }
          } catch (uErr) {
            console.error("Error al subir archivo a Supabase Storage:", uErr)
            alert("Error al subir archivo: " + (uErr instanceof Error ? uErr.message : "Error desconocido"))
            setSaving(false)
            return
          }
        }
        processedFiles.push({
          id: finalUrl,
          name: f.name,
          mimeType: f.mimeType,
          thumbnailUrl: finalUrl,
        })
      }

      // Convertir input datetime-local a ISO string UTC limpia considerando la zona horaria seleccionada
      const fechaIso = fechaProgramada
        ? parseLocalDateTimeToISO(fechaProgramada, programTimezone)
        : new Date(Date.now() + 600000).toISOString()

      const postPayload = {
        titulo: titulo || null,
        contenido_base: contenidoBase,
        overrides_redes: {
          ...(initialData?.overrides_redes || {}),
          primer_comentario: primerComentario,
          archivos_detalles: processedFiles,
        },
        drive_file_ids: processedFiles.map((f) => f.thumbnailUrl || f.id),
        plataformas_destino: plataformas,
        estado: estado, // Cambia el estado a 'programado' obligatoriamente al reprogramar
        fecha_programada: estado === "programado" ? fechaIso : null,
      }

      let res
      if (initialData?.id) {
        res = await updateMarketingPost(initialData.id, postPayload)
      } else {
        res = await createMarketingPost(postPayload)
      }

      if (res.success) {
        if (onSuccess) onSuccess()
        onClose()
      } else {
        alert("Error al guardar: " + (res.error || "No se pudo procesar la publicación"))
      }
    } catch (err: any) {
      console.error("Excepción en handleSave:", err)
      alert("Ocurrió un error inesperado al procesar la publicación: " + (err.message || err))
    } finally {
      setSaving(false)
    }
  }

  const nextImage = () => {
    if (selectedFiles.length > 0) {
      setActiveImageIndex((prev) => (prev + 1) % selectedFiles.length)
    }
  }

  const prevImage = () => {
    if (selectedFiles.length > 0) {
      setActiveImageIndex((prev) => (prev - 1 + selectedFiles.length) % selectedFiles.length)
    }
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-sm p-4 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-5xl rounded-2xl border border-outline-variant/20 bg-surface-container-high shadow-2xl overflow-hidden flex flex-col my-auto max-h-[90vh]"
        >
          {/* Header del Editor */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant/20 bg-surface-container">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-on-surface">
                  {initialData?.id ? "Editar / Reprogramar Publicación" : "Editor Multi-Canal B2B"}
                </h3>
                <p className="text-xs text-on-surface-variant">
                  {initialData?.id ? "Modifica el texto, cambia la fecha u orden de las imágenes." : "Redacta tu post, arrastra y reordena las imágenes del carrusel y mira la previsualización en vivo."}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-on-surface-variant hover:bg-surface-container-highest transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Cuerpo Dividido en 2 Columnas */}
          <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-outline-variant/20 overflow-y-auto">
            {/* Columna Izquierda: Formulario de Redacción */}
            <div className="p-6 space-y-5">
              {/* Selección de Plataformas Destino */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2 block">
                  Canales de Destino
                </label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { id: "linkedin", label: "LinkedIn" },
                    { id: "instagram", label: "Instagram" },
                    { id: "facebook", label: "Facebook" },
                    { id: "youtube", label: "YouTube" },
                  ].map((plat) => {
                    const isSelected = plataformas.includes(plat.id)
                    return (
                      <button
                        key={plat.id}
                        type="button"
                        onClick={() => togglePlataforma(plat.id)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                          isSelected
                            ? "bg-primary/15 border-primary text-primary"
                            : "bg-surface-container border-outline-variant/20 text-on-surface-variant hover:border-outline-variant"
                        }`}
                      >
                        {plat.label}
                        {isSelected && <Check className="h-3 w-3 stroke-[3]" />}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Título Interno */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1.5 block">
                  Título Interno (Opcional)
                </label>
                <input
                  type="text"
                  placeholder="Ej: El cliente como socio de manufactura"
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  className="w-full rounded-xl bg-surface-container border border-outline-variant/20 px-3.5 py-2 text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-primary"
                />
              </div>

              {/* Texto Base / Copy Principal */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1.5 block">
                  Texto Principal (Copy Persuasivo)
                </label>
                <textarea
                  rows={6}
                  placeholder="Escribe el texto de la publicación..."
                  value={contenidoBase}
                  onChange={(e) => setContenidoBase(e.target.value)}
                  className="w-full rounded-xl bg-surface-container border border-outline-variant/20 p-3.5 text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-primary resize-none"
                />
              </div>

              {/* Primer Comentario */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1.5 block">
                  Primer Comentario (Truco Enlace `/demo`)
                </label>
                <input
                  type="text"
                  placeholder="Texto del primer comentario..."
                  value={primerComentario}
                  onChange={(e) => setPrimerComentario(e.target.value)}
                  className="w-full rounded-xl bg-surface-container border border-outline-variant/20 px-3.5 py-2 text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-primary text-xs"
                />
              </div>

              {/* Arrastrar y Soltar Zona */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2 block">
                  Medios (Carrusel de Imágenes / Renders / Videos MP4)
                </label>

                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`relative p-5 rounded-2xl border-2 border-dashed transition-all text-center flex flex-col items-center justify-center cursor-pointer ${
                    isDragging
                      ? "border-primary bg-primary/10 scale-[1.01]"
                      : "border-outline-variant/30 bg-surface-container/60 hover:border-primary/50"
                  }`}
                >
                  <input
                    type="file"
                    multiple
                    accept="image/*,video/*"
                    onChange={handleFileInputChange}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                  <UploadCloud className="h-8 w-8 text-primary mb-2 opacity-80" />
                  <p className="text-xs font-bold text-on-surface">
                    Arrastra y suelta aquí múltiples imágenes o videos (Carrusel)
                  </p>
                  <p className="text-[11px] text-on-surface-variant mt-1">
                    o haz clic para seleccionar archivos (PNG, JPG, MP4)
                  </p>
                </div>

                {/* Integración del enlace de Google Drive */}
                <div className="mt-3 flex gap-2">
                  <div className="relative flex-1">
                    <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-on-surface-variant/50" />
                    <input
                      type="text"
                      id="gdrive-link-input"
                      placeholder="Pegar enlace público de Google Drive..."
                      className="w-full rounded-xl bg-surface-container border border-outline-variant/20 pl-9 pr-3.5 py-2 text-xs text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-primary"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const input = document.getElementById("gdrive-link-input") as HTMLInputElement
                      if (input && input.value.trim()) {
                        handleAddGoogleDriveLink(input.value.trim())
                        input.value = ""
                      }
                    }}
                    className="px-4 py-2 bg-surface-container-highest border border-outline-variant/25 hover:border-primary/40 hover:bg-primary/5 text-xs font-bold text-on-surface hover:text-primary rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    Agregar enlace
                  </button>
                </div>

                {/* Lista de Medios Reordenables con Drag & Drop o Flechas */}
                {selectedFiles.length > 0 && (
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center justify-between text-xs text-on-surface-variant mb-1">
                      <span className="font-bold text-on-surface">{selectedFiles.length} archivo(s) en Carrusel:</span>
                      <span className="text-primary font-medium">💡 Arrastra la tarjeta para reordenar</span>
                    </div>
                    {selectedFiles.map((file, idx) => {
                      const isVideo = file.mimeType.startsWith("video")
                      return (
                        <div
                          key={file.id}
                          draggable
                          onDragStart={() => handleItemDragStart(idx)}
                          onDragOver={(e) => handleItemDragOver(e, idx)}
                          onDragEnd={handleItemDragEnd}
                          onClick={() => setActiveImageIndex(idx)}
                          className={`flex items-center justify-between p-2.5 rounded-xl border text-xs transition-all cursor-grab active:cursor-grabbing ${
                            activeImageIndex === idx
                              ? "bg-primary/10 border-primary text-primary shadow"
                              : "bg-surface-container border-outline-variant/20 text-on-surface hover:border-outline-variant/40"
                          } ${draggedItemIndex === idx ? "opacity-40 border-dashed" : ""}`}
                        >
                          <div className="flex items-center gap-2.5 overflow-hidden">
                            <GripVertical className="h-4 w-4 text-on-surface-variant/50 shrink-0" />
                            <span className="h-5 w-5 rounded-full bg-surface-container-highest flex items-center justify-center text-[10px] font-bold shrink-0 text-on-surface">
                              {idx + 1}
                            </span>
                            {file.thumbnailUrl && !isVideo ? (
                              <img src={file.thumbnailUrl} alt="Preview" className="h-8 w-8 rounded-lg object-cover border border-outline-variant/20 shrink-0" />
                            ) : isVideo ? (
                              <div className="h-8 w-8 rounded-lg border border-outline-variant/20 shrink-0 bg-surface-container-highest flex items-center justify-center">
                                <Film className="h-3.5 w-3.5 text-rose-400" />
                              </div>
                            ) : (
                              <ImageIcon className="h-4 w-4 text-primary shrink-0" />
                            )}
                            <span className="font-medium text-on-surface truncate max-w-[180px]">{file.name}</span>
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              disabled={idx === 0}
                              onClick={(e) => {
                                e.stopPropagation()
                                moveItemUp(idx)
                              }}
                              className="p-1 rounded text-on-surface-variant hover:text-primary disabled:opacity-30"
                              title="Mover arriba"
                            >
                              <ArrowUp className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              disabled={idx === selectedFiles.length - 1}
                              onClick={(e) => {
                                e.stopPropagation()
                                moveItemDown(idx)
                              }}
                              className="p-1 rounded text-on-surface-variant hover:text-primary disabled:opacity-30"
                              title="Mover abajo"
                            >
                              <ArrowDown className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                setSelectedFiles((prev) => prev.filter((f) => f.id !== file.id))
                                if (activeImageIndex >= selectedFiles.length - 1) {
                                  setActiveImageIndex(Math.max(0, selectedFiles.length - 2))
                                }
                              }}
                              className="text-error hover:opacity-80 p-1 ml-1"
                              title="Eliminar"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Programación de Fecha y Hora */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                    Fecha y Hora de Publicación
                  </label>
                  <select
                    value={programTimezone}
                    onChange={(e) => {
                      const newTz = e.target.value
                      if (fechaProgramada) {
                        const currentIso = parseLocalDateTimeToISO(fechaProgramada, programTimezone)
                        setProgramTimezone(newTz)
                        setFechaProgramada(formatISOToLocalDateTimeInput(currentIso, newTz))
                      } else {
                        setProgramTimezone(newTz)
                      }
                    }}
                    className="bg-surface-container border border-outline-variant/20 rounded-lg px-2 py-1 text-[11px] font-semibold text-primary focus:outline-none cursor-pointer"
                  >
                    <option value="America/Sao_Paulo">🇧🇷 Brasil (UTC-3)</option>
                    <option value="America/Bogota">🇨🇴 Colombia (UTC-5)</option>
                  </select>
                </div>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-on-surface-variant" />
                  <input
                    type="datetime-local"
                    value={fechaProgramada}
                    onChange={(e) => setFechaProgramada(e.target.value)}
                    className="w-full rounded-xl bg-surface-container border border-outline-variant/20 pl-9 pr-4 py-2 text-sm text-on-surface focus:outline-none focus:border-primary"
                  />
                </div>
                {fechaProgramada && (
                  <p className="text-[11px] text-on-surface-variant/80 mt-1.5 flex items-center gap-1">
                    <Globe className="h-3 w-3 text-primary" />
                    {programTimezone === "America/Sao_Paulo" ? (
                      <span>
                        Equivale a las{" "}
                        <strong className="text-primary">
                          {(() => {
                            const iso = parseLocalDateTimeToISO(fechaProgramada, "America/Sao_Paulo")
                            const colInput = formatISOToLocalDateTimeInput(iso, "America/Bogota")
                            return colInput.split("T")[1] || ""
                          })()}
                        </strong>{" "}
                        hora Colombia (UTC-5)
                      </span>
                    ) : (
                      <span>
                        Equivale a las{" "}
                        <strong className="text-primary">
                          {(() => {
                            const iso = parseLocalDateTimeToISO(fechaProgramada, "America/Bogota")
                            const brInput = formatISOToLocalDateTimeInput(iso, "America/Sao_Paulo")
                            return brInput.split("T")[1] || ""
                          })()}
                        </strong>{" "}
                        hora Brasil (UTC-3)
                      </span>
                    )}
                  </p>
                )}
              </div>
            </div>

            {/* Columna Derecha: Live Preview por Canal */}
            <div className="p-6 bg-surface-container-low/30 space-y-4 flex flex-col">
              <div className="flex items-center justify-between border-b border-outline-variant/20 pb-3">
                <div className="flex items-center gap-2">
                  <Eye className="h-4 w-4 text-primary" />
                  <span className="text-sm font-semibold text-on-surface">Vista Previa Simultánea</span>
                </div>

                {/* Tabs de Canales */}
                <div className="flex gap-1 bg-surface-container p-1 rounded-lg border border-outline-variant/20">
                  {["instagram", "facebook", "linkedin", "youtube"].map((tab) => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setPreviewTab(tab as any)}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-semibold capitalize transition-all ${
                        previewTab === tab
                          ? "bg-primary text-primary-foreground shadow"
                          : "text-on-surface-variant hover:text-on-surface"
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              </div>

              {/* Contenedor del Mockup del Feed */}
              <div className="flex-1 flex items-center justify-center p-2">
                {previewTab === "instagram" && (
                  <div className="w-full max-w-sm rounded-2xl bg-surface-container border border-outline-variant/20 overflow-hidden shadow-xl text-on-surface relative">
                    <div className="p-3 flex items-center justify-between border-b border-outline-variant/15">
                      <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-amber-400 via-rose-500 to-purple-600 p-[2px]">
                          <div className="h-full w-full rounded-full bg-surface-container flex items-center justify-center font-bold text-[10px] text-primary">
                            MM
                          </div>
                        </div>
                        <div>
                          <p className="text-xs font-bold text-on-surface">mariomojica.oficial</p>
                          <p className="text-[9px] text-on-surface-variant">Manuales 3D Interactivos</p>
                        </div>
                      </div>
                    </div>

                    <div className="aspect-square bg-surface-container-high flex items-center justify-center overflow-hidden relative group">
                      {selectedFiles.length > 0 ? (
                        <>
                          {(() => {
                            const cur = selectedFiles[activeImageIndex] || selectedFiles[0];
                            const isV = cur && (cur.mimeType?.startsWith("video") || cur.thumbnailUrl?.startsWith("data:video") || cur.name?.toLowerCase().endsWith(".mp4"));
                            const gDriveEmbed = cur.thumbnailUrl?.includes("google") ? getGoogleDriveEmbedUrl(cur.thumbnailUrl) : null
                            if (gDriveEmbed) {
                              return (
                                <iframe
                                  src={gDriveEmbed}
                                  className="w-full h-full border-0 bg-surface-container-high"
                                  allow="autoplay"
                                />
                              )
                            }
                            return isV ? (
                              <video
                                src={cur.thumbnailUrl}
                                className="w-full h-full object-contain bg-surface-container-high"
                                controls
                                playsInline
                                crossOrigin="anonymous"
                              />
                            ) : (
                              <img
                                src={cur.thumbnailUrl}
                                alt="Preview IG"
                                className="w-full h-full object-contain bg-surface-container-high"
                              />
                            );
                          })()}

                          {selectedFiles.length > 1 && (
                            <>
                              <button
                                type="button"
                                onClick={prevImage}
                                className="absolute left-2 top-1/2 -translate-y-1/2 h-7 w-7 rounded-full bg-black/60 text-white flex items-center justify-center shadow opacity-80 hover:opacity-100 transition-opacity"
                              >
                                <ChevronLeft className="h-4 w-4" />
                              </button>

                              <button
                                type="button"
                                onClick={nextImage}
                                className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 rounded-full bg-black/60 text-white flex items-center justify-center shadow opacity-80 hover:opacity-100 transition-opacity"
                              >
                                <ChevronRight className="h-4 w-4" />
                              </button>

                              <div className="absolute top-2.5 right-2.5 bg-black/70 px-2 py-0.5 rounded-full text-[10px] font-bold text-white tracking-wider backdrop-blur-sm">
                                {activeImageIndex + 1}/{selectedFiles.length}
                              </div>

                              <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
                                {selectedFiles.map((_, idx) => (
                                  <div
                                    key={idx}
                                    className={`h-1.5 rounded-full transition-all ${
                                      activeImageIndex === idx ? "w-4 bg-primary" : "w-1.5 bg-white/60"
                                    }`}
                                  />
                                ))}
                              </div>
                            </>
                          )}
                        </>
                      ) : (
                        <div className="p-6 text-center text-xs text-on-surface-variant">
                          <UploadCloud className="h-8 w-8 mx-auto mb-2 text-primary opacity-60" />
                          <p className="font-semibold text-on-surface">Carrusel de Imágenes / Render</p>
                          <p className="text-[10px] mt-1">Arrastra una o varias imágenes desde tu carpeta de Windows</p>
                        </div>
                      )}
                    </div>

                    <div className="p-3.5 space-y-1.5 text-xs">
                      <p className="line-clamp-3">
                        <span className="font-bold mr-1.5">mariomojica.oficial</span>
                        {contenidoBase || "Vista previa del texto de Instagram..."}
                      </p>
                      {primerComentario && (
                        <p className="text-[11px] text-on-surface-variant pt-1 border-t border-outline-variant/15">
                          💬 <span className="font-semibold">Primer comentario:</span> {primerComentario}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {previewTab === "facebook" && (
                  <div className="w-full max-w-sm rounded-xl bg-surface-container border border-outline-variant/20 p-4 space-y-3 shadow-lg text-on-surface">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary text-xs">
                        MM
                      </div>
                      <div>
                        <p className="text-xs font-bold text-on-surface">Mario Mojica - Smart Assembly 3D</p>
                        <p className="text-[10px] text-on-surface-variant">Publicado justo ahora • 🌐</p>
                      </div>
                    </div>
                    <p className="text-xs whitespace-pre-line leading-relaxed line-clamp-4">
                      {contenidoBase || "Vista previa del post de Facebook..."}
                    </p>
                    {selectedFiles.length > 0 && (
                      <div className="relative rounded-lg overflow-hidden border border-outline-variant/15 aspect-square bg-surface-container-high flex items-center justify-center">
                        {(() => {
                          const cur = selectedFiles[activeImageIndex] || selectedFiles[0];
                          const isV = cur && (cur.mimeType?.startsWith("video") || cur.thumbnailUrl?.startsWith("data:video") || cur.name?.toLowerCase().endsWith(".mp4"));
                            const gDriveEmbed = cur.thumbnailUrl?.includes("google") ? getGoogleDriveEmbedUrl(cur.thumbnailUrl) : null
                            if (gDriveEmbed) {
                              return (
                                <iframe
                                  src={gDriveEmbed}
                                  className="w-full h-full border-0 bg-surface-container-high"
                                  allow="autoplay"
                                />
                              )
                            }
                            return isV ? (
                              <video
                                src={cur.thumbnailUrl}
                                className="w-full h-full object-contain"
                                controls
                                playsInline
                                crossOrigin="anonymous"
                              />
                            ) : (
                              <img
                                src={cur.thumbnailUrl}
                                alt="FB Preview"
                                className="w-full h-full object-contain"
                              />
                            );
                        })()}
                        {selectedFiles.length > 1 && (
                          <>
                            <button
                              type="button"
                              onClick={prevImage}
                              className="absolute left-2 top-1/2 -translate-y-1/2 h-7 w-7 rounded-full bg-black/60 text-white flex items-center justify-center shadow opacity-80 hover:opacity-100 transition-opacity"
                            >
                              <ChevronLeft className="h-4 w-4" />
                            </button>

                            <button
                              type="button"
                              onClick={nextImage}
                              className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 rounded-full bg-black/60 text-white flex items-center justify-center shadow opacity-80 hover:opacity-100 transition-opacity"
                            >
                              <ChevronRight className="h-4 w-4" />
                            </button>

                            <div className="absolute bottom-2 right-2 bg-black/70 px-2 py-0.5 rounded-full text-[10px] font-bold text-white">
                              {activeImageIndex + 1} de {selectedFiles.length}
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {previewTab === "linkedin" && (
                  <div className="w-full max-w-sm rounded-xl bg-surface-container border border-outline-variant/20 p-4 space-y-3 shadow-lg text-on-surface">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary text-sm">
                        MM
                      </div>
                      <div>
                        <p className="text-xs font-bold text-on-surface">Mario Mojica</p>
                        <p className="text-[10px] text-on-surface-variant">Fundador & CEO @ Mario Mojica | Smart Assembly 3D</p>
                        <p className="text-[10px] text-on-surface-variant/70">Ahora • 🌐</p>
                      </div>
                    </div>
                    <p className="text-xs whitespace-pre-line leading-relaxed line-clamp-4">
                      {contenidoBase || "Vista previa del texto principal..."}
                    </p>
                    {selectedFiles.length > 0 && (
                      <div className="relative rounded-lg overflow-hidden border border-outline-variant/15 aspect-square bg-surface-container-high flex items-center justify-center">
                        {(() => {
                          const cur = selectedFiles[activeImageIndex] || selectedFiles[0];
                          const isV = cur && (cur.mimeType?.startsWith("video") || cur.thumbnailUrl?.startsWith("data:video") || cur.name?.toLowerCase().endsWith(".mp4"));
                            const gDriveEmbed = cur.thumbnailUrl?.includes("google") ? getGoogleDriveEmbedUrl(cur.thumbnailUrl) : null
                            if (gDriveEmbed) {
                              return (
                                <iframe
                                  src={gDriveEmbed}
                                  className="w-full h-full border-0 bg-surface-container-high"
                                  allow="autoplay"
                                />
                              )
                            }
                            return isV ? (
                              <video
                                src={cur.thumbnailUrl}
                                className="w-full h-full object-contain"
                                controls
                                playsInline
                                crossOrigin="anonymous"
                              />
                            ) : (
                              <img
                                src={cur.thumbnailUrl}
                                alt="LinkedIn Preview"
                                className="w-full h-full object-contain"
                              />
                            );
                        })()}
                        {selectedFiles.length > 1 && (
                          <>
                            <button
                              type="button"
                              onClick={prevImage}
                              className="absolute left-2 top-1/2 -translate-y-1/2 h-7 w-7 rounded-full bg-black/60 text-white flex items-center justify-center shadow opacity-80 hover:opacity-100 transition-opacity"
                            >
                              <ChevronLeft className="h-4 w-4" />
                            </button>

                            <button
                              type="button"
                              onClick={nextImage}
                              className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 rounded-full bg-black/60 text-white flex items-center justify-center shadow opacity-80 hover:opacity-100 transition-opacity"
                            >
                              <ChevronRight className="h-4 w-4" />
                            </button>

                            <div className="absolute top-2.5 right-2.5 bg-black/70 px-2 py-0.5 rounded-full text-[10px] font-bold text-white tracking-wider backdrop-blur-sm">
                              {activeImageIndex + 1}/{selectedFiles.length}
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {previewTab === "youtube" && (
                  <div className="w-full max-w-sm rounded-xl bg-surface-container border border-outline-variant/20 p-6 text-center text-xs text-on-surface-variant">
                    <p className="font-semibold text-on-surface mb-1">Vista Previa de YouTube</p>
                    <p className="text-[11px]">Subirá como Video Corto (Short) o Video Horizontal.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer del Modal */}
          <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-t border-outline-variant/20 bg-surface-container">
            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-sm font-medium text-on-surface-variant hover:bg-surface-container-highest transition-colors"
              >
                Cancelar
              </button>

              {/* Botón de Eliminar Publicación (Sólo si es una edición de post existente) */}
              {initialData?.id && (
                confirmDelete ? (
                  <div className="flex items-center gap-2 bg-surface-container-high border border-error/40 p-1.5 rounded-xl shadow-inner">
                    <span className="text-xs text-rose-400 font-bold px-2">¿Eliminar?</span>
                    <button
                      onClick={async () => {
                        setSaving(true)
                        if (onDelete && initialData.id) {
                          await onDelete(initialData.id)
                        } else if (initialData.id) {
                          await deleteMarketingPost(initialData.id)
                        }
                        setSaving(false)
                        setConfirmDelete(false)
                        if (onSuccess) onSuccess()
                        onClose()
                      }}
                      disabled={saving}
                      className="px-3 py-1 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/50 text-xs font-bold rounded-lg transition-all"
                    >
                      Sí, Eliminar
                    </button>
                    <button
                      onClick={() => setConfirmDelete(false)}
                      className="px-2 py-1 text-xs text-on-surface-variant hover:text-on-surface transition-colors"
                    >
                      No
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmDelete(true)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-error/30 text-error hover:bg-error/10 text-xs font-semibold transition-colors"
                    title="Eliminar publicación permanentemente"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Eliminar
                  </button>
                )
              )}
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => handleSave("borrador")}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 rounded-xl border border-outline-variant/30 text-sm font-semibold text-on-surface hover:bg-surface-container-highest transition-colors disabled:opacity-50 disabled:cursor-wait"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                <span>{saving ? "Guardando..." : "Guardar Borrador"}</span>
              </button>
              <button
                onClick={() => handleSave("programado")}
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-primary text-sm font-semibold text-primary-foreground transition-all hover:opacity-90 shadow-md shadow-primary/20 disabled:opacity-60 disabled:cursor-wait"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Procesando...</span>
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    <span>{initialData?.id ? "Reprogramar / Guardar" : "Programar Publicación"}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
