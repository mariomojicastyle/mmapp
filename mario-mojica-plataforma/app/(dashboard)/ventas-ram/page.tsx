"use client"

import React, { useState, useEffect, useRef, useCallback } from "react"
import { BrainCircuit, Loader2, RefreshCw, Flame, ShieldAlert, GripVertical } from "lucide-react"
import { VentasProspecto, VentasInteraccion, TemperaturaLead } from "@/lib/types/ventas-ram"
import {
  getVentasProspectos,
  getVentasProspectoById,
  saveVentasProspecto,
  deleteVentasProspecto,
  updateTemperaturaProspecto,
  saveVentasInteraccion,
  deleteVentasInteraccion,
} from "@/app/actions/ventas-ram"
import { ListaProspectos } from "@/components/ventas-ram/lista-prospectos"
import { CopilotoWorkspace } from "@/components/ventas-ram/copiloto-workspace"
import { ProspectoModal } from "@/components/ventas-ram/prospecto-modal"
import { EliminarModal } from "@/components/ventas-ram/eliminar-modal"
import { RadarTactico } from "@/components/ventas-ram/radar-tactico"

export default function VentasRamPage() {
  const [prospectos, setProspectos] = useState<VentasProspecto[]>([])
  const [selectedProspecto, setSelectedProspecto] = useState<VentasProspecto | null>(null)
  const [interacciones, setInteracciones] = useState<VentasInteraccion[]>([])
  const [loading, setLoading] = useState(true)

  // Splitter / Distribución de Ancho de Paneles
  const [splitPercent, setSplitPercent] = useState<number>(33.33)
  const [isDragging, setIsDragging] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Cargar ancho preferido guardado
  useEffect(() => {
    try {
      const saved = localStorage.getItem("ventas_ram_panel_split")
      if (saved) {
        const val = parseFloat(saved)
        if (!isNaN(val) && val >= 20 && val <= 60) {
          setSplitPercent(val)
        }
      }
    } catch (e) {
      console.error("Error leyendo splitPercent de localStorage:", e)
    }
  }, [])

  // Iniciar Arrastre del Separador
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  // Listeners de Arrastre Globales
  useEffect(() => {
    if (!isDragging) return

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      const currentX = e.clientX - rect.left
      const newPercent = (currentX / rect.width) * 100
      // Clampear entre 20% y 60%
      const clamped = Math.max(20, Math.min(60, newPercent))
      setSplitPercent(clamped)
    }

    const handleMouseUp = () => {
      setIsDragging(false)
      try {
        localStorage.setItem("ventas_ram_panel_split", splitPercent.toString())
      } catch {}
    }

    window.addEventListener("mousemove", handleMouseMove)
    window.addEventListener("mouseup", handleMouseUp)

    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("mouseup", handleMouseUp)
    }
  }, [isDragging, splitPercent])

  // Modal Prospecto (Crear / Editar)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingProspecto, setEditingProspecto] = useState<VentasProspecto | null>(null)

  // Modal de Confirmación de Eliminación
  const [prospectoAEliminar, setProspectoAEliminar] = useState<VentasProspecto | null>(null)

  // Cargar lista de prospectos
  const fetchProspectos = async (selectId?: string) => {
    setLoading(true)
    try {
      const res = await getVentasProspectos()
      if (res.success && res.data) {
        setProspectos(res.data)

        // Seleccionar el primer prospecto si no hay ninguno seleccionado
        const targetId = selectId || selectedProspecto?.id || res.data[0]?.id
        const found = res.data.find((p) => p.id === targetId) || res.data[0] || null
        if (found) {
          setSelectedProspecto(found)
          await fetchInteracciones(found.id)
        }
      }
    } finally {
      setLoading(false)
    }
  }

  // Cargar interacciones del prospecto activo
  const fetchInteracciones = async (id: string) => {
    try {
      const res = await getVentasProspectoById(id)
      if (res.success && res.data) {
        setInteracciones(res.data.interacciones)
      }
    } catch (err) {
      console.error("Error cargando interacciones:", err)
    }
  }

  useEffect(() => {
    fetchProspectos()
  }, [])

  // Manejador al seleccionar un prospecto
  const handleSelectProspecto = async (p: VentasProspecto) => {
    setSelectedProspecto(p)
    await fetchInteracciones(p.id)
  }

  // Guardar prospecto (crear / editar)
  const handleSaveProspecto = async (data: Partial<VentasProspecto>) => {
    const res = await saveVentasProspecto(data)
    if (res.success && res.data) {
      const saved = res.data
      setProspectos((prev) => [saved, ...prev.filter((p) => p.id !== saved.id)])
      setSelectedProspecto(saved)
      await fetchInteracciones(saved.id)
      await fetchProspectos(saved.id)
    }
  }

  // Confirmar y ejecutar eliminación permanente
  const handleConfirmDelete = async (id: string) => {
    const res = await deleteVentasProspecto(id)
    if (res.success) {
      const remaining = prospectos.filter((p) => p.id !== id)
      setProspectos(remaining)
      if (selectedProspecto?.id === id) {
        if (remaining.length > 0) {
          handleSelectProspecto(remaining[0])
        } else {
          setSelectedProspecto(null)
          setInteracciones([])
        }
      }
    }
  }

  // Cambiar temperatura
  const handleChangeTemperatura = async (temp: TemperaturaLead) => {
    if (!selectedProspecto) return
    setSelectedProspecto((prev) => (prev ? { ...prev, temperatura: temp } : null))
    setProspectos((prev) =>
      prev.map((p) => (p.id === selectedProspecto.id ? { ...p, temperatura: temp } : p))
    )
    await updateTemperaturaProspecto(selectedProspecto.id, temp)
  }

  // Guardar interacción
  const handleSaveInteraccion = async (data: Omit<VentasInteraccion, "id" | "created_at">) => {
    const res = await saveVentasInteraccion(data)
    if (res.success && res.data) {
      const newInteraction = res.data
      setInteracciones((prev) => [newInteraction, ...prev.filter((i) => i.id !== newInteraction.id)])
      if (selectedProspecto) {
        setSelectedProspecto((prev) =>
          prev
            ? {
                ...prev,
                temperatura: newInteraction.termometro,
                ultima_interaccion_at: newInteraction.created_at,
                interacciones_count: (prev.interacciones_count || 0) + 1,
              }
            : null
        )
        await fetchProspectos(selectedProspecto.id)
      }
    }
  }

  // Eliminar interacción individual del historial cronológico
  const handleDeleteInteraccion = async (interaccionId: string) => {
    if (!selectedProspecto) return
    const res = await deleteVentasInteraccion(selectedProspecto.id, interaccionId)
    if (res.success) {
      setInteracciones((prev) => prev.filter((i) => i.id !== interaccionId))
      setSelectedProspecto((prev) =>
        prev
          ? {
              ...prev,
              interacciones_count: Math.max(0, (prev.interacciones_count || 1) - 1),
            }
          : null
      )
      setProspectos((prev) =>
        prev.map((p) =>
          p.id === selectedProspecto.id
            ? { ...p, interacciones_count: Math.max(0, (p.interacciones_count || 1) - 1) }
            : p
        )
      )
    }
  }

  return (
    <div className="h-[calc(100vh-57px)] max-h-[calc(100vh-57px)] p-6 space-y-4 flex flex-col overflow-hidden">
      {/* Header Principal de la Página (Fijo) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shadow-xs">
            <BrainCircuit className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-on-surface flex items-center gap-2">
              <span>RAM de Ventas B2B</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/15 text-primary font-bold uppercase tracking-wider">
                Copiloto Multimodal
              </span>
            </h1>
            <p className="text-xs text-on-surface-variant">
              Memoria comercial activa, análisis visual de capturas y generación de respuestas duales (Português & Español).
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Radar Táctico de Seguimientos */}
          <RadarTactico
            prospectos={prospectos}
            onSelectProspecto={handleSelectProspecto}
          />

          <button
            onClick={() => fetchProspectos()}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-surface-container border border-outline-variant/30 text-xs font-semibold text-on-surface hover:bg-surface-container-high transition-colors cursor-pointer disabled:opacity-50"
            title="Refrescar datos"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin text-primary" : ""}`} />
            <span>Sincronizar</span>
          </button>
        </div>
      </div>

      {/* Contenedor Principal con Splitter Resizable & Scroll 100% Independiente */}
      {loading && prospectos.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-16 text-on-surface-variant flex-1 min-h-0">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
          <p className="text-xs font-medium">Cargando memoria comercial...</p>
        </div>
      ) : (
        <div
          ref={containerRef}
          style={{ "--left-split": `${splitPercent}%`, "--right-split": `${100 - splitPercent}%` } as React.CSSProperties}
          className={`flex flex-col lg:flex-row gap-4 lg:gap-0 flex-1 min-h-0 h-full overflow-hidden relative ${
            isDragging ? "cursor-col-resize select-none" : ""
          }`}
        >
          {/* Columna Izquierda: Directorio & Radar con Scroll Propio */}
          <div className="w-full lg:w-[calc(var(--left-split)-12px)] h-full min-h-0 shrink-0 flex flex-col overflow-hidden">
            <ListaProspectos
              prospectos={prospectos}
              selectedId={selectedProspecto?.id || null}
              onSelect={handleSelectProspecto}
              onNewProspecto={() => {
                setEditingProspecto(null)
                setIsModalOpen(true)
              }}
              onDeleteProspecto={(p) => setProspectoAEliminar(p)}
            />
          </div>

          {/* Separador Arrastrable (Canal Completo de 24px de Separación como Hitbox) */}
          <div
            onMouseDown={handleMouseDown}
            onDoubleClick={() => {
              setSplitPercent(33.33)
              try {
                localStorage.setItem("ventas_ram_panel_split", "33.33")
              } catch {}
            }}
            className={`hidden lg:flex items-center justify-center w-6 shrink-0 h-full z-20 cursor-col-resize select-none group transition-colors rounded-xl ${
              isDragging ? "bg-primary/10" : "hover:bg-primary/5"
            }`}
            title="Arrastra desde este espacio para ajustar el ancho (Doble clic para restablecer)"
          >
            {/* Indicador Visual en la Línea Media */}
            <div
              className={`w-1 rounded-full transition-all duration-200 ${
                isDragging
                  ? "bg-primary w-1.5 h-20 shadow-lg shadow-primary/40"
                  : "bg-outline-variant/35 h-12 group-hover:bg-primary/80 group-hover:h-16"
              }`}
            />
          </div>

          {/* Columna Derecha: Copiloto Workspace & Bitácora con Scroll Propio */}
          <div className="w-full lg:w-[calc(var(--right-split)-12px)] h-full min-h-0 flex-1 flex flex-col overflow-hidden">
            <CopilotoWorkspace
              prospecto={selectedProspecto}
              todosLosProspectos={prospectos}
              interacciones={interacciones}
              onEditProspecto={() => {
                setEditingProspecto(selectedProspecto)
                setIsModalOpen(true)
              }}
              onSaveProspecto={handleSaveProspecto}
              onDeleteProspecto={() => setProspectoAEliminar(selectedProspecto)}
              onChangeTemperatura={handleChangeTemperatura}
              onSaveInteraccion={handleSaveInteraccion}
              onDeleteInteraccion={handleDeleteInteraccion}
            />
          </div>
        </div>
      )}

      {/* Modal de Crear / Editar Prospecto */}
      <ProspectoModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveProspecto}
        initialData={editingProspecto}
        prospectosExistentes={prospectos}
        onSelectExistente={(p) => {
          setIsModalOpen(false)
          handleSelectProspecto(p)
        }}
      />

      {/* Modal de Confirmación de Eliminación Permanente */}
      <EliminarModal
        isOpen={!!prospectoAEliminar}
        prospecto={prospectoAEliminar}
        onClose={() => setProspectoAEliminar(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  )
}
