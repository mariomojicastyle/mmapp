"use client"

import React, { useState, useRef } from "react"
import { X, Upload, Calendar, ChevronDown } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { TIPOS_SOLICITUD, TipoSolicitud } from "@/lib/auth/tickets"

import { createClient } from "@/lib/supabase/client"

interface NuevaSolicitudModalProps {
  isOpen: boolean
  onClose: () => void
  nextId: string
}

export function NuevaSolicitudModal({ isOpen, onClose, nextId }: NuevaSolicitudModalProps) {
  const [titulo, setTitulo] = useState("")
  const [descripcion, setDescripcion] = useState("")
  const [fechaEntrega, setFechaEntrega] = useState("")
  const [tipo, setTipo] = useState<TipoSolicitud | "">("")
  const [files, setFiles] = useState<File[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [isDragActive, setIsDragActive] = useState(false)
  const [fileError, setFileError] = useState("")
  const fileRef = useRef<HTMLInputElement>(null)

  const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'xlsx', 'pdf', 'dwg', 'doc', 'docx', 'txt', 'dxf', '3dm', 'glb', 'fbx', 'stp']
  const MAX_FILE_SIZE = 15 * 1024 * 1024 // 15MB

  const processFiles = (newFiles: File[]) => {
    setFileError("")
    const validFiles: File[] = []
    
    for (const file of newFiles) {
      const ext = file.name.split('.').pop()?.toLowerCase() || ""
      if (!ALLOWED_EXTENSIONS.includes(ext)) {
        setFileError(`El archivo "${file.name}" tiene un formato no permitido.`)
        continue
      }
      if (file.size > MAX_FILE_SIZE) {
        setFileError(`El archivo "${file.name}" supera el límite de 15MB.`)
        continue
      }
      validFiles.push(file)
    }
    
    if (validFiles.length > 0) {
      setFiles(prev => [...prev, ...validFiles])
    }
  }

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      processFiles(Array.from(e.target.files))
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragActive(true)
  }

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragActive(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragActive(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(Array.from(e.dataTransfer.files))
    }
  }

  const removeFile = (idx: number) => setFiles(prev => prev.filter((_, i) => i !== idx))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError("")

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        throw new Error("Usuario no autenticado")
      }

      const adjuntosUrls: string[] = []
      
      if (files.length > 0) {
        for (const file of files) {
          const fileExt = file.name.split('.').pop()
          const fileName = `${user.id}/${Date.now()}_${Math.random().toString(36).substring(2, 15)}.${fileExt}`
          
          const { error: uploadError } = await supabase.storage
            .from('solicitudes')
            .upload(fileName, file)
            
          if (uploadError) {
            console.error("Error subiendo archivo:", uploadError)
            throw new Error(`Error al subir ${file.name}: ${uploadError.message}`)
          }
          
          adjuntosUrls.push(fileName)
        }
      }

      const { error: insertError } = await supabase.from("solicitudes").insert({
        titulo,
        descripcion,
        fecha_sugerida_entrega: fechaEntrega || null,
        tipo_solicitud: tipo,
        estado: "Nueva",
        client_id: user.id,
        adjuntos: adjuntosUrls
      })

      if (insertError) throw insertError

      onClose()
      window.location.reload() // Refresca para ver los cambios
    } catch (err: any) {
      console.error(err)
      setError(err.message || "Ocurrió un error al crear la solicitud")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-x-4 top-[5%] z-50 mx-auto max-w-2xl overflow-y-auto max-h-[90vh] rounded-2xl border border-outline-variant bg-surface-container p-0 shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-outline-variant px-6 py-4">
              <div>
                <h2 className="text-lg font-bold text-on-surface">Nueva Solicitud</h2>
                <p className="text-xs text-on-surface-variant">ID asignado: <span className="font-mono font-bold text-primary">{nextId}</span></p>
              </div>
              <button onClick={onClose} className="rounded-lg p-2 text-on-surface-variant transition hover:bg-surface-container-high">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-5 p-6">
              {/* Título */}
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Título *</span>
                <input value={titulo} onChange={e => setTitulo(e.target.value)} required
                  placeholder="Ej: Configurador 3D Mesa Extensible"
                  className="rounded-xl border border-outline-variant bg-surface-container-low px-4 py-2.5 text-sm text-on-surface outline-none transition focus:border-primary focus:ring-1 focus:ring-primary placeholder:text-on-surface-variant/40" />
              </label>

              {/* Descripción */}
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Descripción *</span>
                <textarea value={descripcion} onChange={e => setDescripcion(e.target.value)} required rows={4}
                  placeholder="Describe los detalles de tu solicitud..."
                  className="rounded-xl border border-outline-variant bg-surface-container-low px-4 py-2.5 text-sm text-on-surface outline-none transition focus:border-primary focus:ring-1 focus:ring-primary resize-none placeholder:text-on-surface-variant/40" />
              </label>

              {/* Row: Tipo + Fecha */}
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Tipo de solicitud *</span>
                  <div className="relative">
                    <select value={tipo} onChange={e => setTipo(e.target.value as TipoSolicitud)} required
                      className="w-full appearance-none rounded-xl border border-outline-variant bg-surface-container-low px-4 py-2.5 pr-10 text-sm text-on-surface outline-none transition focus:border-primary focus:ring-1 focus:ring-primary">
                      <option value="" disabled>Seleccionar tipo</option>
                      {TIPOS_SOLICITUD.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant" />
                  </div>
                </label>

                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Fecha sugerida de entrega</span>
                  <div className="relative">
                    <input type="date" value={fechaEntrega} onChange={e => setFechaEntrega(e.target.value)}
                      className="w-full rounded-xl border border-outline-variant bg-surface-container-low px-4 py-2.5 text-sm text-on-surface outline-none transition focus:border-primary focus:ring-1 focus:ring-primary" />
                  </div>
                </label>
              </div>

              {/* Adjuntar archivos */}
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Adjuntar archivos</span>
                <div
                  onClick={() => fileRef.current?.click()}
                  onDragOver={handleDragOver}
                  onDragEnter={handleDragEnter}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={cn(
                    "flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed py-6 transition-all",
                    isDragActive 
                      ? "border-primary bg-primary/10" 
                      : "border-outline-variant bg-surface-container-lowest hover:border-primary hover:bg-primary/5"
                  )}
                >
                  <Upload className={cn("h-6 w-6 transition-colors pointer-events-none", isDragActive ? "text-primary" : "text-on-surface-variant/50")} />
                  <p className="text-xs text-on-surface-variant pointer-events-none">Suelta los archivos aquí o <span className="font-semibold text-primary">busca</span></p>
                  <p className="mt-1 text-center text-[10px] leading-relaxed text-on-surface-variant/70 px-4 pointer-events-none">
                    Formatos aceptados: JPG, PDF, XLSX, DWG, DOC, TXT, DXF, 3DM, GLB, FBX, STP.<br/>
                    Peso máximo por archivo: 15 MB.
                  </p>
                </div>
                {fileError && <p className="text-[10px] text-red-500 font-medium px-1">{fileError}</p>}
                <input ref={fileRef} type="file" multiple accept=".jpg,.jpeg,.png,.xlsx,.pdf,.dwg,.doc,.docx,.txt,.dxf,.3dm,.glb,.fbx,.stp" className="hidden" onChange={handleFiles} />

                {files.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {files.map((f, i) => (
                      <span key={i} className="flex items-center gap-1.5 rounded-lg bg-surface-container-high px-2.5 py-1 text-xs text-on-surface">
                        {f.name}
                        <button type="button" onClick={() => removeFile(i)} className="text-on-surface-variant hover:text-red-400">
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Actions */}
              {error && (
                <div className="rounded-lg bg-red-500/10 p-3 text-sm text-red-500">
                  {error}
                </div>
              )}
              <div className="flex items-center justify-end gap-3 border-t border-outline-variant pt-5">
                <button type="button" onClick={onClose} disabled={isSubmitting}
                  className="rounded-xl border border-outline-variant px-5 py-2.5 text-sm font-medium text-on-surface transition hover:bg-surface-container-high disabled:opacity-50">
                  Cancelar
                </button>
                <button type="submit" disabled={isSubmitting}
                  className="flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100">
                  {isSubmitting ? "Enviando..." : "Enviar solicitud"}
                </button>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
