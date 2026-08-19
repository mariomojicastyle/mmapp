"use client"

import React, { useState, useMemo, useRef, useEffect } from "react"
import {
  Radio,
  Clock,
  AlertTriangle,
  Flame,
  Calendar,
  ChevronRight,
  Sparkles,
  X,
  CheckCircle2,
  Building2,
  ArrowRight,
  Bell,
  Zap,
} from "lucide-react"
import { VentasProspecto, TemperaturaLead } from "@/lib/types/ventas-ram"

interface RadarTacticoProps {
  prospectos: VentasProspecto[]
  onSelectProspecto: (prospecto: VentasProspecto) => void
}

export interface RadarItem {
  prospecto: VentasProspecto
  estado: "vencida" | "hoy_48h" | "programada" | "sin_fecha"
  etiqueta_tiempo: string
  horas_restantes: number | null
  es_urgente: boolean
}

export function RadarTactico({ prospectos, onSelectProspecto }: RadarTacticoProps) {
  const [isOpen, setIsOpen] = useState(false)
  const popoverRef = useRef<HTMLDivElement>(null)

  // Cerrar al hacer clic afuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside)
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isOpen])

  // Calcular radar de prospectos y categorizarlos
  const radarData = useMemo(() => {
    const now = new Date().getTime()
    const items: RadarItem[] = []

    prospectos.forEach((p) => {
      // Si no tiene próxima acción descrita, omitir del radar activo
      if (!p.proxima_accion_descripcion) return

      let fechaAccion = p.proxima_accion_at ? new Date(p.proxima_accion_at).getTime() : null

      // Si no tiene fecha explícita pero tiene última interacción, calcular 48h por defecto
      if (!fechaAccion && p.ultima_interaccion_at) {
        fechaAccion = new Date(p.ultima_interaccion_at).getTime() + 48 * 3600 * 1000
      }

      if (!fechaAccion) {
        items.push({
          prospecto: p,
          estado: "sin_fecha",
          etiqueta_tiempo: "Sin fecha definida",
          horas_restantes: null,
          es_urgente: false,
        })
        return
      }

      const diffMs = fechaAccion - now
      const diffHours = Math.round(diffMs / (1000 * 60 * 60))

      if (diffHours < 0) {
        // Vencida
        const diasPasados = Math.abs(Math.round(diffHours / 24))
        items.push({
          prospecto: p,
          estado: "vencida",
          etiqueta_tiempo: diasPasados > 0 ? `Vencida hace ${diasPasados}d` : `Vencida hace ${Math.abs(diffHours)}h`,
          horas_restantes: diffHours,
          es_urgente: true,
        })
      } else if (diffHours <= 48) {
        // Para hoy o próximas 48h
        items.push({
          prospecto: p,
          estado: "hoy_48h",
          etiqueta_tiempo: diffHours <= 24 ? `Vence hoy (${diffHours}h)` : `Vence en ${diffHours}h`,
          horas_restantes: diffHours,
          es_urgente: true,
        })
      } else {
        // Programada más adelante en la semana
        const diasRestantes = Math.round(diffHours / 24)
        items.push({
          prospecto: p,
          estado: "programada",
          etiqueta_tiempo: `En ${diasRestantes} días`,
          horas_restantes: diffHours,
          es_urgente: false,
        })
      }
    })

    // Ordenar: primero vencidas, luego hoy/48h, luego programadas
    items.sort((a, b) => {
      if (a.es_urgente && !b.es_urgente) return -1
      if (!a.es_urgente && b.es_urgente) return 1
      return (a.horas_restantes ?? 9999) - (b.horas_restantes ?? 9999)
    })

    const vencidas = items.filter((i) => i.estado === "vencida")
    const hoy48h = items.filter((i) => i.estado === "hoy_48h")
    const programadas = items.filter((i) => i.estado === "programada")
    const urgentesTotal = vencidas.length + hoy48h.length

    return { items, vencidas, hoy48h, programadas, urgentesTotal }
  }, [prospectos])

  const handleSelect = (p: VentasProspecto) => {
    onSelectProspecto(p)
    setIsOpen(false)
  }

  return (
    <div className="relative" ref={popoverRef}>
      {/* Botón Píldora del Radar */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all shadow-xs cursor-pointer ${
          radarData.urgentesTotal > 0
            ? "bg-gradient-to-r from-amber-500/20 via-primary/15 to-surface-container border-amber-500/40 text-on-surface hover:border-amber-500 shadow-amber-500/10"
            : "bg-surface-container border-outline-variant/30 text-on-surface hover:border-primary/40"
        }`}
        title="Radar Táctico de Seguimientos B2B"
      >
        <div className="relative flex items-center justify-center">
          <Radio className={`h-4 w-4 ${radarData.urgentesTotal > 0 ? "text-amber-500 animate-pulse" : "text-primary"}`} />
          {radarData.urgentesTotal > 0 && (
            <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-rose-500 animate-ping" />
          )}
        </div>

        <span>Radar Táctico</span>

        {radarData.urgentesTotal > 0 ? (
          <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white font-extrabold text-[10px] shadow-xs">
            {radarData.urgentesTotal} {radarData.urgentesTotal === 1 ? "alerta" : "alertas"}
          </span>
        ) : (
          <span className="px-1.5 py-0.2 rounded-full bg-surface-container-highest text-on-surface-variant font-medium text-[10px]">
            Al día
          </span>
        )}
      </button>

      {/* Flyout / Panel Desplegable del Radar */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-[340px] sm:w-[420px] max-h-[520px] rounded-2xl bg-surface-container border-2 border-primary/30 shadow-2xl z-50 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
          {/* Header del Radar */}
          <div className="p-3.5 bg-gradient-to-r from-primary/15 via-surface-container-high to-surface-container border-b border-outline-variant/20 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-xl bg-primary/20 text-primary flex items-center justify-center font-bold">
                <Radio className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-on-surface flex items-center gap-1.5">
                  <span>Radar Táctico de Seguimientos</span>
                </h3>
                <p className="text-[10px] text-on-surface-variant">
                  {radarData.urgentesTotal > 0
                    ? `⚠️ ${radarData.urgentesTotal} jugadas requieren tu atención inmediata`
                    : "✨ Todas tus jugadas comerciales están al día"}
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-lg text-on-surface-variant hover:bg-surface-container-highest transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Lista de Alertas Desplazable */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
            {/* SECCIÓN 1: VENCIDAS O PARA HOY / 48H */}
            {radarData.urgentesTotal > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-rose-500 flex items-center gap-1">
                    <Flame className="h-3 w-3" />
                    <span>Acción Inmediata ({radarData.urgentesTotal})</span>
                  </span>
                  <span className="text-[9px] text-on-surface-variant">48 Horas / Vencidas</span>
                </div>

                {[...radarData.vencidas, ...radarData.hoy48h].map((item) => (
                  <div
                    key={item.prospecto.id}
                    onClick={() => handleSelect(item.prospecto)}
                    className="p-3 rounded-xl bg-surface-container-high/60 hover:bg-surface-container-highest border border-amber-500/30 hover:border-primary transition-all cursor-pointer group space-y-2 shadow-2xs"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-xs text-on-surface truncate block">
                            {item.prospecto.empresa}
                          </span>
                          <span className="text-[10px] text-on-surface-variant shrink-0">
                            ({item.prospecto.pais})
                          </span>
                        </div>
                        <p className="text-[11px] font-medium text-primary truncate">
                          {item.prospecto.contacto_nombre} {item.prospecto.contacto_cargo ? `· ${item.prospecto.contacto_cargo}` : ""}
                        </p>
                      </div>

                      {/* Badge de Tiempo */}
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold shrink-0 flex items-center gap-1 shadow-2xs ${
                          item.estado === "vencida"
                            ? "bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30"
                            : "bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30"
                        }`}
                      >
                        <Clock className="h-3 w-3" />
                        <span>{item.etiqueta_tiempo}</span>
                      </span>
                    </div>

                    {/* Próxima Acción */}
                    <div className="p-2 rounded-lg bg-surface-container border border-outline-variant/15 text-[11px] text-on-surface font-medium leading-snug">
                      <p className="line-clamp-2">📌 {item.prospecto.proxima_accion_descripcion}</p>
                    </div>

                    {/* Botón de Acción Rápida */}
                    <div className="flex items-center justify-between pt-0.5 text-[10px] font-bold text-primary group-hover:underline">
                      <span className="flex items-center gap-1">
                        <Zap className="h-3 w-3 text-amber-500" />
                        <span>{item.prospecto.canal_preferido || "LinkedIn"}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <span>Ir a Ficha & Redactar</span>
                        <ChevronRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* SECCIÓN 2: PROGRAMADAS EN LA SEMANA */}
            {radarData.programadas.length > 0 && (
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between px-1">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-primary flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span>Programadas para esta Semana ({radarData.programadas.length})</span>
                  </span>
                </div>

                {radarData.programadas.map((item) => (
                  <div
                    key={item.prospecto.id}
                    onClick={() => handleSelect(item.prospecto)}
                    className="p-2.5 rounded-xl bg-surface-container-high/40 hover:bg-surface-container-highest border border-outline-variant/20 hover:border-primary/50 transition-all cursor-pointer group space-y-1.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-xs text-on-surface truncate">
                        {item.prospecto.empresa} · <span className="text-on-surface-variant font-normal">{item.prospecto.contacto_nombre}</span>
                      </span>
                      <span className="text-[9px] font-bold text-primary px-1.5 py-0.2 rounded bg-primary/10 border border-primary/20 shrink-0">
                        {item.etiqueta_tiempo}
                      </span>
                    </div>

                    <p className="text-[10px] text-on-surface-variant truncate">
                      {item.prospecto.proxima_accion_descripcion}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {radarData.items.length === 0 && (
              <div className="py-8 text-center text-on-surface-variant space-y-2">
                <CheckCircle2 className="h-8 w-8 mx-auto text-emerald-500 opacity-80" />
                <p className="text-xs font-semibold">¡Excelente trabajo!</p>
                <p className="text-[11px] opacity-75">
                  No tienes seguimientos pendientes por vencer.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
