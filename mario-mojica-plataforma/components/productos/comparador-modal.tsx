"use client"

import React, { useEffect, useState } from "react"
import { X, Star, CheckCircle, Eye, Clock, GitBranch, Loader2 } from "lucide-react"
import { getMetricasComparacion } from "@/app/actions/metricas"
import { cn } from "@/lib/utils"

/* eslint-disable @typescript-eslint/no-explicit-any */
interface ComparadorModalProps {
  proyectoIds: string[]
  onClose: () => void
}

function getFinalizacionColor(rate: number): string {
  if (rate >= 80) return "bg-success"
  if (rate >= 50) return "bg-tertiary"
  return "bg-error"
}

export function ComparadorModal({ proyectoIds, onClose }: ComparadorModalProps) {
  const [loading, setLoading] = useState(true)
  const [productos, setProductos] = useState<any[]>([])

  useEffect(() => {
    const fetch = async () => {
      setLoading(true)
      const result = await getMetricasComparacion(proyectoIds)
      if ("data" in result) {
        // Sort to match the original selection order
        const ordered = proyectoIds
          .map(id => result.data.find((p: any) => p.proyecto_id === id))
          .filter(Boolean)
        setProductos(ordered)
      }
      setLoading(false)
    }
    fetch()
  }, [proyectoIds])

  const colCount = productos.length || proyectoIds.length

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="relative w-[95vw] max-w-6xl max-h-[90vh] overflow-auto rounded-2xl bg-surface-container-low border border-outline-variant/20 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-outline-variant/20 bg-surface-container-low/95 backdrop-blur-md px-6 py-4">
          <div>
            <h2 className="text-lg font-bold text-on-surface">Comparación de Productos ({colCount})</h2>
            <p className="text-xs text-on-surface-variant mt-0.5">Compara las métricas clave lado a lado</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 text-on-surface-variant hover:bg-surface-container-high transition">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="p-6">
            <div className={cn("grid gap-4", colCount === 2 ? "grid-cols-2" : colCount === 3 ? "grid-cols-3" : "grid-cols-4")}>
              {productos.map((p: any) => (
                <div key={p.proyecto_id} className="rounded-xl bg-surface-container p-5 space-y-4">
                  {/* Name */}
                  <div className="text-center">
                    <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-2">
                      <span className="text-primary font-bold text-lg">
                        {p.proyecto_nombre?.charAt(0)?.toUpperCase() || "?"}
                      </span>
                    </div>
                    <h3 className="text-sm font-semibold text-on-surface truncate">{p.proyecto_nombre}</h3>
                  </div>

                  {/* KPIs */}
                  <div className="space-y-3">
                    {/* Escaneos */}
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-on-surface-variant flex items-center gap-1.5">
                        <Eye className="h-3.5 w-3.5" /> Escaneos
                      </span>
                      <span className="text-sm font-bold text-on-surface tabular-nums">{p.total_sesiones?.toLocaleString() || 0}</span>
                    </div>

                    {/* Finalización */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-on-surface-variant flex items-center gap-1.5">
                          <CheckCircle className="h-3.5 w-3.5" /> Tasa de Finalización de Armado
                        </span>
                        <span className="text-sm font-bold text-on-surface tabular-nums">{p.tasa_finalizacion || 0}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-surface-container-highest overflow-hidden">
                        <div
                          className={cn("h-full rounded-full transition-all duration-700", getFinalizacionColor(p.tasa_finalizacion || 0))}
                          style={{ width: `${Math.min(100, p.tasa_finalizacion || 0)}%` }}
                        />
                      </div>
                    </div>

                    {/* Rating */}
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-on-surface-variant flex items-center gap-1.5">
                        <Star className="h-3.5 w-3.5" /> Calificación
                      </span>
                      <div className="flex items-center gap-1">
                        <Star className={cn("h-3.5 w-3.5", p.calificacion_promedio >= 4 ? "text-amber-400 fill-amber-400" : "text-on-surface-variant/30")} />
                        <span className="text-sm font-bold text-on-surface tabular-nums">
                          {p.calificacion_promedio?.toFixed(1) || "—"}
                        </span>
                      </div>
                    </div>

                    {/* Feedbacks */}
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-on-surface-variant">Opiniones</span>
                      <span className="text-sm font-bold text-on-surface tabular-nums">{p.total_feedbacks || 0}</span>
                    </div>

                    {/* Ayudas */}
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-on-surface-variant">Clicks ayuda</span>
                      <span className="text-sm font-bold text-on-surface tabular-nums">{p.total_ayudas || 0}</span>
                    </div>
                  </div>

                  {/* Action */}
                  <a
                    href={`/productos/${p.proyecto_id}`}
                    className="block text-center text-xs font-medium text-primary hover:underline pt-2 border-t border-outline-variant/20"
                  >
                    Ver reporte completo →
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
