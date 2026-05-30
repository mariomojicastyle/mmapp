"use client"
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */

import React, { useState, useEffect } from "react"
import { X, ChevronDown, FolderPlus, Loader2, ExternalLink } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { getSolicitudesConCliente, crearProyecto } from "@/app/actions/proyectos"

interface NuevoProyectoModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export function NuevoProyectoModal({ isOpen, onClose, onSuccess }: NuevoProyectoModalProps) {
  const [nombre, setNombre] = useState("")
  const [tipo, setTipo] = useState<"Aplicativo de armado" | "B2B" | "B2C" | "Genérico" | "">("")
  const [selectedClientId, setSelectedClientId] = useState("")
  const [selectedSolicitudId, setSelectedSolicitudId] = useState<string>("")
  const [codigoManual, setCodigoManual] = useState("")
  
  // Data list
  const [solicitudes, setSolicitudes] = useState<{ 
    id: number; 
    titulo: string; 
    client_id: string; 
    profiles?: { full_name: string; company?: string } 
  }[]>([])
  
  // Loading & States
  const [loading, setLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")

  // Alphabetically sorted types of projects
  const TIPOS_PROYECTO = [
    "Aplicativo de armado",
    "B2B",
    "B2C",
    "Genérico"
  ] as const

  // Fetch solicitudes and client info when modal opens
  useEffect(() => {
    if (isOpen) {
      setLoading(true)
      setError("")
      setNombre("")
      setTipo("")
      setSelectedClientId("")
      setSelectedSolicitudId("")
      setCodigoManual("")
      setSolicitudes([])
      
      getSolicitudesConCliente()
        .then(res => {
          if (res.error) {
            setError(res.error)
          } else if (res.data) {
            setSolicitudes(res.data as any)
          }
        })
        .catch(err => {
          setError("Error inesperado al cargar las solicitudes.")
          console.error(err)
        })
        .finally(() => {
          setLoading(false)
        })
    }
  }, [isOpen])

  const handleSolicitudChange = (idStr: string) => {
    setSelectedSolicitudId(idStr)
    if (idStr) {
      const idNum = parseInt(idStr, 10)
      const found = solicitudes.find(s => s.id === idNum)
      if (found) {
        setSelectedClientId(found.client_id)
      }
    } else {
      setSelectedClientId("")
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nombre || !tipo || !selectedSolicitudId || !selectedClientId) {
      setError("Por favor completa todos los campos requeridos (*).")
      return
    }
    if (tipo === "Aplicativo de armado" && !codigoManual) {
      setError("Por favor define el código de la carpeta/manual para el aplicativo de armado.")
      return
    }

    setIsSubmitting(true)
    setError("")

    try {
      const res = await crearProyecto({
        nombre,
        tipo_proyecto: tipo as any,
        client_id: selectedClientId,
        solicitud_id: parseInt(selectedSolicitudId, 10),
        codigo_manual: tipo === "Aplicativo de armado" ? codigoManual : null
      })

      if (res.error) {
        setError(res.error)
      } else {
        onClose()
        if (onSuccess) {
          onSuccess()
        } else {
          window.location.reload()
        }
      }
    } catch (err: any) {
      setError(err.message || "Error al crear el proyecto.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop esmerilado */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md"
            onClick={onClose}
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-x-4 top-[10%] z-50 mx-auto max-w-lg rounded-2xl border border-outline-variant bg-surface-container p-0 shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-outline-variant px-6 py-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                  <FolderPlus className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-on-surface">Crear Nuevo Proyecto</h2>
                  <p className="text-xs text-on-surface-variant">Asigna un tipo y vincúlalo a un ID de solicitud</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="rounded-lg p-2 text-on-surface-variant transition hover:bg-surface-container-high"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-5 p-6">
              
              {/* Nombre del Proyecto */}
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Nombre del Proyecto *</span>
                <input
                  type="text"
                  value={nombre}
                  onChange={e => setNombre(e.target.value)}
                  required
                  placeholder="Ej: Maderkit - Armado Closet Modular"
                  className="rounded-xl border border-outline-variant bg-surface-container-low px-4 py-2.5 text-sm text-on-surface outline-none transition focus:border-primary focus:ring-1 focus:ring-primary placeholder:text-on-surface-variant/40"
                />
              </label>

              {/* Tipo de Proyecto (Ordenado Alfabéticamente por default) */}
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Tipo de Proyecto *</span>
                <div className="relative">
                  <select
                    value={tipo}
                    onChange={e => setTipo(e.target.value as any)}
                    required
                    className="w-full appearance-none rounded-xl border border-outline-variant bg-surface-container-low px-4 py-2.5 pr-10 text-sm text-on-surface outline-none transition focus:border-primary focus:ring-1 focus:ring-primary"
                  >
                    <option value="" disabled>Selecciona el tipo de proyecto</option>
                    {TIPOS_PROYECTO.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant" />
                </div>
              </label>

              {/* Vincular ID (Dropdown listing request IDs linked to client name) */}
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider flex items-center justify-between">
                  Vincular ID *
                  {loading && <Loader2 className="h-3 w-3 animate-spin text-primary" />}
                </span>
                <div className="relative">
                  <select
                    value={selectedSolicitudId}
                    onChange={e => handleSolicitudChange(e.target.value)}
                    required
                    disabled={loading}
                    className="w-full appearance-none rounded-xl border border-outline-variant bg-surface-container-low px-4 py-2.5 pr-10 text-sm text-on-surface outline-none transition focus:border-primary focus:ring-1 focus:ring-primary disabled:opacity-50"
                  >
                    <option value="" disabled>Selecciona el ID a vincular</option>
                    {solicitudes.map(s => {
                      const clientInfo = s.profiles 
                        ? `${s.profiles.full_name}${s.profiles.company ? ` (${s.profiles.company})` : ""}`
                        : "Cliente"
                      return (
                        <option key={s.id} value={s.id}>
                          #{String(s.id).padStart(5, "0")} - {clientInfo}
                        </option>
                      )
                    })}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant" />
                </div>
                {selectedSolicitudId && (
                  <span className="text-[10px] text-primary/80 px-1 mt-0.5">
                    Se vinculará la información de la solicitud #{String(selectedSolicitudId).padStart(5, "0")} de forma nativa.
                  </span>
                )}
              </label>

              {/* Código de Carpeta / Manual (Solo si es Aplicativo de armado) */}
              {tipo === "Aplicativo de armado" && (
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Código de Carpeta / Manual *</span>
                  <input
                    type="text"
                    value={codigoManual}
                    onChange={e => setCodigoManual(e.target.value)}
                    required
                    placeholder="Ej: M01536"
                    className="rounded-xl border border-outline-variant bg-surface-container-low px-4 py-2.5 text-sm text-on-surface outline-none transition focus:border-primary focus:ring-1 focus:ring-primary placeholder:text-on-surface-variant/40"
                  />
                  {codigoManual && (
                    <div className="mt-2 flex flex-col gap-2 rounded-xl bg-surface-container-lowest/80 border border-outline-variant/10 p-3.5 text-[11px] text-on-surface-variant">
                      <span className="font-semibold text-on-surface-variant/90 flex items-center gap-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                        Enlaces de Previsualización Activos:
                      </span>
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
                          Producción: /{codigoManual}
                          <ExternalLink className="h-3 w-3 opacity-60 group-hover:opacity-100 transition-opacity" />
                        </a>
                      </div>
                    </div>
                  )}
                </label>
              )}

              {/* Error display */}
              {error && (
                <div className="rounded-xl bg-red-500/10 p-3.5 text-xs text-red-400 border border-red-500/20">
                  {error}
                </div>
              )}

              {/* Actions Footer */}
              <div className="flex items-center justify-end gap-3 border-t border-outline-variant pt-5 mt-2">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="rounded-xl border border-outline-variant px-5 py-2.5 text-sm font-medium text-on-surface transition hover:bg-surface-container-high disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || loading}
                  className="flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Creando...
                    </>
                  ) : (
                    "Crear Proyecto"
                  )}
                </button>
              </div>

            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
