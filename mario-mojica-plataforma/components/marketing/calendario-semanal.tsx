"use client"

import React, { useState } from "react"
import { Calendar as CalendarIcon, Clock, ChevronLeft, ChevronRight, Edit3, Globe, Flame } from "lucide-react"

export interface MarketingPost {
  id: string
  titulo: string | null
  contenido_base: string
  plataformas_destino: string[]
  estado: string
  fecha_programada: string | null
  overrides_redes?: Record<string, any>
  drive_file_ids?: string[]
}

interface CalendarioSemanalProps {
  posts: MarketingPost[]
  onSelectSlot?: (fechaHora: Date) => void
  onSelectPost?: (post: MarketingPost) => void
}

const DIAS_SEMANA = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"]

// Generar las 24 horas del día (00:00 a 23:00)
const HORAS_24 = Array.from({ length: 24 }, (_, i) => `${i.toString().padStart(2, "0")}:00`)

const TIMEZONES = [
  { id: "America/Sao_Paulo", label: "🇧🇷 Bento Gonçalves / Brasil (UTC-3)" },
  { id: "America/Bogota", label: "🇨🇴 Colombia / Ecuador (UTC-5)" },
]

export function CalendarioSemanal({ posts, onSelectSlot, onSelectPost }: CalendarioSemanalProps) {
  const [currentWeekOffset, setCurrentWeekOffset] = useState(0)
  const [selectedTimezone, setSelectedTimezone] = useState("America/Sao_Paulo")

  // Obtener fechas de la semana actual (Lunes a Domingo)
  const getWeekDates = () => {
    const today = new Date()
    const currentDayOfWeek = today.getDay() // 0 = Domingo, 1 = Lunes
    const distanceToMonday = (currentDayOfWeek === 0 ? -6 : 1) - currentDayOfWeek
    const monday = new Date(today)
    monday.setDate(today.getDate() + distanceToMonday + currentWeekOffset * 7)

    return DIAS_SEMANA.map((_, idx) => {
      const date = new Date(monday)
      date.setDate(monday.getDate() + idx)
      return date
    })
  }

  const weekDates = getWeekDates()

  // Convierte un string ISO UTC a componentes de fecha/hora en la zona horaria seleccionada
  const getPartsInTimezone = (isoStr: string, timeZone: string) => {
    const d = new Date(isoStr)
    if (isNaN(d.getTime())) return null
    const offsetHours = timeZone === "America/Sao_Paulo" ? -3 : -5
    const targetDate = new Date(d.getTime() + offsetHours * 3600 * 1000)
    return {
      year: targetDate.getUTCFullYear(),
      month: targetDate.getUTCMonth(),
      date: targetDate.getUTCDate(),
      hours: targetDate.getUTCHours(),
      minutes: targetDate.getUTCMinutes(),
    }
  }

  // Buscar posts programados para un día específico considerando la zona horaria seleccionada
  const getPostsForDay = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const day = date.getDate()

    return posts.filter((p) => {
      if (!p.fecha_programada) return false
      const parts = getPartsInTimezone(p.fecha_programada, selectedTimezone)
      if (!parts) return false
      return (
        parts.year === year &&
        parts.month === month &&
        parts.date === day
      )
    })
  }

  // Encuentra la hora 00:00 - 23:00 más cercana para un post en la zona horaria seleccionada
  const getClosestSlotHora = (isoStr: string, timeZone: string) => {
    const parts = getPartsInTimezone(isoStr, timeZone)
    if (!parts) return ""
    return `${parts.hours.toString().padStart(2, "0")}:00`
  }

  // Mapa de calor B2B (Metricool Heatmap style)
  // Intensidad: 3 (Pico Alto CTR - Rosa/Coral Vivo), 2 (Medio - Rosa Suave), 1 (Bajo - Tinta Ligera), 0 (Horas Muertas)
  const getHeatmapIntensity = (dayIdx: number, hourStr: string): number => {
    const hour = parseInt(hourStr.split(":")[0], 10)

    // Martes, Miércoles, Jueves (Días dorados B2B RTA Brasil)
    if (dayIdx >= 1 && dayIdx <= 3) {
      if ([9, 11, 14, 15, 18, 19, 20].includes(hour)) return 3 // Pico Alto
      if ([8, 10, 12, 13, 16, 17, 21].includes(hour)) return 2 // Pico Medio
      if (hour >= 7 && hour <= 22) return 1
      return 0
    }
    // Lunes y Viernes
    if (dayIdx === 0 || dayIdx === 4) {
      if ([10, 11, 14, 15, 18, 19].includes(hour)) return 2
      if (hour >= 8 && hour <= 21) return 1
      return 0
    }
    // Fin de semana (Sábado / Domingo)
    if (hour >= 10 && hour <= 19) return 1
    return 0
  }

  // Estilo de color del mapa de calor por intensidad
  const getSlotHeatmapClass = (intensity: number, hasPost: boolean) => {
    if (hasPost) return "bg-primary/20 border-primary shadow-md shadow-primary/10"
    switch (intensity) {
      case 3:
        return "bg-rose-500/25 border-rose-500/40 text-rose-200 hover:bg-rose-500/35 cursor-pointer"
      case 2:
        return "bg-rose-500/15 border-rose-500/25 text-rose-300/80 hover:bg-rose-500/25 cursor-pointer"
      case 1:
        return "bg-rose-500/5 border-outline-variant/10 text-on-surface-variant/60 hover:bg-rose-500/10 cursor-pointer"
      default:
        return "bg-surface-container-high/20 border-outline-variant/10 text-on-surface-variant/40 hover:border-outline-variant/30 cursor-pointer"
    }
  }

  return (
    <div className="rounded-2xl bg-surface-container border border-outline-variant/15 p-5 space-y-4 shadow-xl">
      {/* Header del Calendario con Selector de Zona Horaria */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-outline-variant/20 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <CalendarIcon className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-on-surface">Planificador Semanal B2B (24 Horas)</h3>
              <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30">
                <Flame className="h-3 w-3" /> Mapa de Calor CTR
              </span>
            </div>
            <p className="text-xs text-on-surface-variant mt-0.5">
              Horarios óptimos de prospección marcados en coral estilo Metricool. Selecciona la zona horaria del cliente.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Selector de Zona Horaria */}
          <div className="flex items-center gap-1.5 bg-surface-container-high/60 border border-outline-variant/20 rounded-xl px-2.5 py-1.5 text-xs">
            <Globe className="h-3.5 w-3.5 text-primary" />
            <select
              value={selectedTimezone}
              onChange={(e) => setSelectedTimezone(e.target.value)}
              className="bg-transparent text-on-surface font-semibold text-xs focus:outline-none cursor-pointer"
            >
              {TIMEZONES.map((tz) => (
                <option key={tz.id} value={tz.id} className="bg-surface-container-highest text-on-surface">
                  {tz.label}
                </option>
              ))}
            </select>
          </div>

          {/* Navegador de Semanas */}
          <div className="flex items-center gap-1.5 bg-surface-container-high/60 border border-outline-variant/20 rounded-xl p-1">
            <button
              onClick={() => setCurrentWeekOffset((prev) => prev - 1)}
              className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-surface-container-highest text-on-surface-variant transition-colors"
              title="Semana anterior"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-xs font-semibold px-2 text-on-surface min-w-[90px] text-center">
              {currentWeekOffset === 0 ? "Semana Actual" : currentWeekOffset > 0 ? `+${currentWeekOffset} Semanas` : `${currentWeekOffset} Semanas`}
            </span>
            <button
              onClick={() => setCurrentWeekOffset((prev) => prev + 1)}
              className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-surface-container-highest text-on-surface-variant transition-colors"
              title="Semana siguiente"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Contenedor de Scroll Vertical de 24 Horas con Header Sticky Fijo */}
      <div className="max-h-[580px] overflow-y-auto overflow-x-hidden rounded-xl border border-outline-variant/20 pr-1 relative custom-scrollbar">
        {/* Cuadrícula de Encabezados de Días de la Semana (STICKY CONGELADO) */}
        <div className="sticky top-0 z-20 grid grid-cols-7 gap-2 text-center bg-surface-container/95 backdrop-blur-md p-2.5 border-b border-outline-variant/20 shadow-sm">
          {DIAS_SEMANA.map((dia, idx) => {
            const date = weekDates[idx]
            const isToday = new Date().toDateString() === date.toDateString()
            const isRecomendado = idx >= 1 && idx <= 3 // Martes, Miércoles, Jueves

            return (
              <div
                key={dia}
                className={`p-2 rounded-xl border text-xs font-bold transition-all ${
                  isToday
                    ? "bg-primary text-primary-foreground border-primary shadow-md"
                    : isRecomendado
                    ? "bg-primary/10 border-primary/30 text-primary"
                    : "bg-surface-container-high/40 border-outline-variant/15 text-on-surface-variant"
                }`}
              >
                <span>{dia}</span>
                <span className="block text-[10px] opacity-90 mt-0.5">
                  {date.getDate()} {date.toLocaleDateString("es-ES", { month: "short" })}
                </span>
              </div>
            )
          })}
        </div>

        {/* Franjas Horarias de 24 Horas (00:00 - 23:00) */}
        <div className="space-y-1.5 p-2 pt-3">
          {HORAS_24.map((hora) => (
            <div key={hora} className="grid grid-cols-7 gap-2 items-stretch">
              {DIAS_SEMANA.map((dia, idx) => {
                const date = weekDates[idx]
                const dayPosts = getPostsForDay(date)

                // Filtrar posts asignando cada uno a la franja de hora exacta o cercana en selectedTimezone
                const postsInSlot = dayPosts.filter((p) => {
                  if (!p.fecha_programada) return false
                  return getClosestSlotHora(p.fecha_programada, selectedTimezone) === hora
                })

                const intensity = getHeatmapIntensity(idx, hora)
                const slotStyle = getSlotHeatmapClass(intensity, postsInSlot.length > 0)

                return (
                  <div
                    key={`${dia}-${hora}`}
                    onClick={() => {
                      if (postsInSlot.length === 0 && onSelectSlot) {
                        const year = date.getFullYear()
                        const month = date.getMonth()
                        const day = date.getDate()
                        const [h] = hora.split(":").map(Number)
                        const offsetHours = selectedTimezone === "America/Sao_Paulo" ? -3 : -5
                        const utcDate = new Date(Date.UTC(year, month, day, h - offsetHours, 0, 0))
                        onSelectSlot(utcDate)
                      }
                    }}
                    className={`min-h-[56px] p-2 rounded-xl border text-left flex flex-col justify-between transition-all ${slotStyle}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-semibold flex items-center gap-1 opacity-90">
                        <Clock className="h-2.5 w-2.5" />
                        {hora}
                        {selectedTimezone === "America/Sao_Paulo" ? (
                          <span className="text-[8px] font-medium opacity-60">
                            ({((parseInt(hora.split(":")[0]) - 2 + 24) % 24).toString().padStart(2, "0")}:00 Col)
                          </span>
                        ) : (
                          <span className="text-[8px] font-medium opacity-60">
                            ({((parseInt(hora.split(":")[0]) + 2) % 24).toString().padStart(2, "0")}:00 BR)
                          </span>
                        )}
                      </span>
                      {intensity === 3 && postsInSlot.length === 0 && (
                        <span className="text-[9px] font-bold text-rose-400 flex items-center gap-0.5" title="Horario Pico CTR B2B RTA Brasil">
                          <Flame className="h-2.5 w-2.5" /> Pico
                        </span>
                      )}
                    </div>

                    {/* Renderizar Tarjeta de Post en el Calendario */}
                    {postsInSlot.length > 0 ? (
                      <div className="space-y-1 mt-1">
                        {postsInSlot.map((post) => (
                          <div
                            key={post.id}
                            onClick={(e) => {
                              e.stopPropagation()
                              if (onSelectPost) onSelectPost(post)
                            }}
                            className="p-1.5 rounded-lg bg-surface-container border border-primary/40 shadow-sm hover:scale-[1.02] transition-all cursor-pointer group"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-[9px] font-bold text-primary truncate max-w-[80px]">
                                {post.titulo || "Sin título"}
                              </span>
                              <Edit3 className="h-2.5 w-2.5 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                            <p className="text-[9px] text-on-surface-variant line-clamp-1 mt-0.5">
                              {post.contenido_base}
                            </p>
                            <div className="flex items-center gap-1 mt-1">
                              <span className="text-[8px] font-semibold px-1 py-0.2 rounded bg-primary/20 text-primary capitalize">
                                {post.estado}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-[9px] opacity-40 hover:opacity-100 transition-opacity">
                        + Programar
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
