"use client"

import React from "react"
import { useRouter } from "next/navigation"
import { Star, Eye, CheckCircle, MessageSquare } from "lucide-react"
import { cn } from "@/lib/utils"

interface ProductoResumen {
  proyecto_id: string
  proyecto_nombre: string
  logo_url: string | null
  total_sesiones: number
  sesiones_completadas: number
  tasa_finalizacion: number
  calificacion_promedio: number | null
  total_feedbacks: number
  ultimo_evento: string | null
  estado: string
}

interface ProductCardProps {
  producto: ProductoResumen
  isSelected: boolean
  onToggleSelect: (id: string) => void
}

function formatRelativeTime(dateStr: string | null): string {
  if (!dateStr) return "Sin actividad"
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `hace ${mins}m`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `hace ${hours}h`
  const days = Math.floor(hours / 24)
  if (days < 30) return `hace ${days}d`
  const months = Math.floor(days / 30)
  return `hace ${months} mes${months > 1 ? "es" : ""}`
}

function getRatingColor(rating: number | null): string {
  if (rating === null) return "text-on-surface-variant/40"
  if (rating >= 4) return "text-amber-400"
  if (rating >= 3) return "text-yellow-500"
  return "text-error"
}

function getFinalizacionColor(rate: number): string {
  if (rate >= 80) return "bg-success"
  if (rate >= 50) return "bg-tertiary"
  return "bg-error"
}

export function ProductCard({ producto, isSelected, onToggleSelect }: ProductCardProps) {
  const router = useRouter()
  const p = producto
  const [imgError, setImgError] = React.useState(false)

  return (
    <div
      className={cn(
        "group relative rounded-xl bg-surface-container p-4 cursor-pointer transition-all duration-200",
        "hover:ring-1 hover:ring-primary/30 hover:shadow-lg hover:shadow-primary/5",
        isSelected && "ring-2 ring-primary shadow-lg shadow-primary/10"
      )}
      onClick={() => router.push(`/productos/${p.proyecto_id}`)}
    >
      {/* Checkbox */}
      <button
        onClick={(e) => {
          e.stopPropagation()
          onToggleSelect(p.proyecto_id)
        }}
        className={cn(
          "absolute top-3 left-3 z-10 h-5 w-5 rounded border-2 flex items-center justify-center transition-all",
          isSelected
            ? "bg-primary border-primary"
            : "border-outline-variant/50 bg-surface-container-low opacity-0 group-hover:opacity-100"
        )}
      >
        {isSelected && (
          <svg className="h-3 w-3 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )}
      </button>

      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 overflow-hidden">
          {p.logo_url && !imgError ? (
            <img 
              src={p.logo_url} 
              alt="" 
              className="h-6 w-6 object-contain" 
              onError={() => setImgError(true)}
            />
          ) : (
            <span className="text-primary font-bold text-sm">
              {p.proyecto_nombre.charAt(0).toUpperCase()}
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-on-surface truncate">{p.proyecto_nombre}</h3>
          <p className="text-xs text-on-surface-variant mt-0.5">{formatRelativeTime(p.ultimo_evento)}</p>
        </div>
      </div>

      {/* KPI Badges */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="rounded-lg bg-surface-container-high/50 px-2.5 py-2 text-center">
          <div className="flex items-center justify-center gap-1 mb-0.5">
            <Eye className="h-3 w-3 text-on-surface-variant/60" />
          </div>
          <p className="text-base font-bold text-on-surface tabular-nums">{p.total_sesiones.toLocaleString()}</p>
          <p className="text-[10px] text-on-surface-variant">Escaneos</p>
        </div>

        <div className="rounded-lg bg-surface-container-high/50 px-2.5 py-2 text-center">
          <div className="flex items-center justify-center gap-1 mb-0.5">
            <Star className={cn("h-3 w-3", getRatingColor(p.calificacion_promedio))} />
          </div>
          <p className="text-base font-bold text-on-surface tabular-nums">
            {p.calificacion_promedio !== null ? p.calificacion_promedio.toFixed(1) : "—"}
          </p>
          <p className="text-[10px] text-on-surface-variant">Rating</p>
        </div>

        <div className="rounded-lg bg-surface-container-high/50 px-2.5 py-2 text-center">
          <div className="flex items-center justify-center gap-1 mb-0.5">
            <MessageSquare className="h-3 w-3 text-on-surface-variant/60" />
          </div>
          <p className="text-base font-bold text-on-surface tabular-nums">{p.total_feedbacks}</p>
          <p className="text-[10px] text-on-surface-variant">Opiniones</p>
        </div>
      </div>

      {/* Completion Rate Bar */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] text-on-surface-variant flex items-center gap-1">
            <CheckCircle className="h-3 w-3" /> Tasa de Finalización de Armado del Usuario Final
          </span>
          <span className="text-xs font-semibold text-on-surface tabular-nums">{p.tasa_finalizacion}%</span>
        </div>
        <div className="h-1.5 rounded-full bg-surface-container-highest overflow-hidden">
          <div
            className={cn("h-full rounded-full transition-all duration-500", getFinalizacionColor(p.tasa_finalizacion))}
            style={{ width: `${Math.min(100, p.tasa_finalizacion)}%` }}
          />
        </div>
      </div>
    </div>
  )
}
