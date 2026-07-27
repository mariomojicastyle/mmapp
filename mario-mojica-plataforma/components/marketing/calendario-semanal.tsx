"use client"

import React, { useState } from "react"
import { Calendar as CalendarIcon, Clock, Plus, ChevronLeft, ChevronRight, Edit3 } from "lucide-react"

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
const HORAS_CLAVE = ["08:30", "10:00", "12:00", "15:00", "17:30", "19:00", "21:00"]

export function CalendarioSemanal({ posts, onSelectSlot, onSelectPost }: CalendarioSemanalProps) {
  const [currentWeekOffset, setCurrentWeekOffset] = useState(0)

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

  // Buscar posts programados para un día específico
  const getPostsForDay = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const day = date.getDate()

    return posts.filter((p) => {
      if (!p.fecha_programada) return false
      const pDate = new Date(p.fecha_programada)
      return (
        pDate.getFullYear() === year &&
        pDate.getMonth() === month &&
        pDate.getDate() === day
      )
    })
  }

  // Encuentra la franja horaria de HORAS_CLAVE más cercana para un post
  const getClosestSlotHora = (pDate: Date) => {
    const pHour = pDate.getHours() + pDate.getMinutes() / 60
    let closestHora = HORAS_CLAVE[0]
    let minDiff = Infinity

    for (const horaStr of HORAS_CLAVE) {
      const [h, m] = horaStr.split(":").map(Number)
      const slotHour = h + m / 60
      const diff = Math.abs(pHour - slotHour)
      if (diff < minDiff) {
        minDiff = diff
        closestHora = horaStr
      }
    }

    return closestHora
  }

  return (
    <div className="rounded-2xl bg-surface-container border border-outline-variant/15 p-5 space-y-4">
      {/* Header del Calendario */}
      <div className="flex items-center justify-between border-b border-outline-variant/20 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <CalendarIcon className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-on-surface">Planificador Semanal B2B</h3>
            <p className="text-xs text-on-surface-variant">
              Horarios de máximo CTR marcados con mapa de calor. Haz clic en cualquier post para editarlo o reprogramarlo.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentWeekOffset((prev) => prev - 1)}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-outline-variant/20 hover:bg-surface-container-high text-on-surface-variant transition-colors"
            title="Semana anterior"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-xs font-semibold px-2 text-on-surface">
            {currentWeekOffset === 0 ? "Semana Actual" : currentWeekOffset > 0 ? `+${currentWeekOffset} Semanas` : `${currentWeekOffset} Semanas`}
          </span>
          <button
            onClick={() => setCurrentWeekOffset((prev) => prev + 1)}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-outline-variant/20 hover:bg-surface-container-high text-on-surface-variant transition-colors"
            title="Semana siguiente"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Cuadrícula de Encabezados de Días de la Semana */}
      <div className="grid grid-cols-7 gap-2 text-center">
        {DIAS_SEMANA.map((dia, idx) => {
          const date = weekDates[idx]
          const isToday = new Date().toDateString() === date.toDateString()
          const isRecomendado = idx >= 1 && idx <= 3 // Martes, Miércoles, Jueves

          return (
            <div
              key={dia}
              className={`p-2.5 rounded-xl border text-xs font-bold transition-all ${
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

      {/* Franjas Horarias y Ranuras con Posts Programados Dinámicos */}
      <div className="space-y-2 pt-2">
        {HORAS_CLAVE.map((hora) => (
          <div key={hora} className="grid grid-cols-7 gap-2 items-stretch">
            {DIAS_SEMANA.map((dia, idx) => {
              const date = weekDates[idx]
              const dayPosts = getPostsForDay(date)

              // Filtrar posts asignando cada uno a la franja horaria más cercana
              const postsInSlot = dayPosts.filter((p) => {
                if (!p.fecha_programada) return false
                const pDate = new Date(p.fecha_programada)
                return getClosestSlotHora(pDate) === hora
              })

              const isSlotCaliente = (idx === 1 || idx === 2 || idx === 3) && (hora === "08:30" || hora === "12:00")

              return (
                <div
                  key={`${dia}-${hora}`}
                  onClick={() => {
                    if (postsInSlot.length === 0 && onSelectSlot) {
                      const selectedDate = new Date(date)
                      const [h, m] = hora.split(":").map(Number)
                      selectedDate.setHours(h, m, 0, 0)
                      onSelectSlot(selectedDate)
                    }
                  }}
                  className={`min-h-[70px] p-2 rounded-xl border text-left flex flex-col justify-between transition-all ${
                    postsInSlot.length > 0
                      ? "bg-primary/15 border-primary shadow-sm"
                      : isSlotCaliente
                      ? "bg-primary/5 border-primary/20 hover:border-primary/50 cursor-pointer"
                      : "bg-surface-container-high/30 border-outline-variant/10 hover:border-outline-variant/30 cursor-pointer"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-semibold text-on-surface-variant/70 flex items-center gap-1">
                      <Clock className="h-2.5 w-2.5" />
                      {hora}
                    </span>
                    {postsInSlot.length === 0 && (
                      <span className="text-[9px] text-on-surface-variant/40 hover:text-primary">
                        +
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
                          className="p-1.5 rounded-lg bg-surface-container border border-primary/40 shadow-sm hover:scale-[1.03] transition-all cursor-pointer group"
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
                    <div className="text-[9px] text-on-surface-variant/40 hover:text-primary">
                      Disponible
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}
