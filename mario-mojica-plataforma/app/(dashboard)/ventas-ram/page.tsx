"use client"

import React, { useState, useEffect } from "react"
import { BrainCircuit, Loader2, RefreshCw, Flame, ShieldAlert } from "lucide-react"
import { VentasProspecto, VentasInteraccion, TemperaturaLead } from "@/lib/types/ventas-ram"
import {
  getVentasProspectos,
  getVentasProspectoById,
  saveVentasProspecto,
  deleteVentasProspecto,
  updateTemperaturaProspecto,
  saveVentasInteraccion,
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

  return (
    <div className="space-y-4">
      {/* Header Principal de la Página */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
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

      {/* Grid Principal a 2 Columnas */}
      {loading && prospectos.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-16 text-on-surface-variant">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
          <p className="text-xs font-medium">Cargando memoria comercial...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 h-[calc(100vh-210px)] min-h-[620px]">
          {/* Columna Izquierda: Directorio & Radar (4 de 12 Cols) */}
          <div className="lg:col-span-4 h-full">
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

          {/* Columna Derecha: Copiloto Workspace & Bitácora (8 de 12 Cols) */}
          <div className="lg:col-span-8 h-full">
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
