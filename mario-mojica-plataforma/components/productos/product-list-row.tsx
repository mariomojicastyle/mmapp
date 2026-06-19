"use client"

import React from "react"
import { useRouter } from "next/navigation"
import { Star } from "lucide-react"
import { cn } from "@/lib/utils"

interface ProductoResumen {
  proyecto_id: string
  proyecto_nombre: string
  total_sesiones: number
  tasa_finalizacion: number
  calificacion_promedio: number | null
  total_feedbacks: number
  ultimo_evento: string | null
}

interface ProductListRowProps {
  producto: ProductoResumen
  isSelected: boolean
  onToggleSelect: (id: string) => void
}

function formatRelativeTime(dateStr: string | null): string {
  if (!dateStr) return "—"
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d`
  return `${Math.floor(days / 30)}mo`
}

function getFinalizacionColor(rate: number): string {
  if (rate >= 80) return "text-success"
  if (rate >= 50) return "text-tertiary"
  return "text-error"
}

export function ProductListRow({ producto, isSelected, onToggleSelect }: ProductListRowProps) {
  const router = useRouter()
  const p = producto

  return (
    <tr
      className={cn(
        "cursor-pointer transition-colors hover:bg-surface-container-high/50",
        isSelected && "bg-primary/5"
      )}
      onClick={() => router.push(`/productos/${p.proyecto_id}`)}
    >
      <td className="px-3 py-3">
        <button
          onClick={(e) => {
            e.stopPropagation()
            onToggleSelect(p.proyecto_id)
          }}
          className={cn(
            "h-4 w-4 rounded border-2 flex items-center justify-center transition-all",
            isSelected ? "bg-primary border-primary" : "border-outline-variant/50"
          )}
        >
          {isSelected && (
            <svg className="h-2.5 w-2.5 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          )}
        </button>
      </td>
      <td className="px-4 py-3">
        <span className="text-sm font-medium text-on-surface">{p.proyecto_nombre}</span>
      </td>
      <td className="px-4 py-3 text-right text-sm tabular-nums text-on-surface">
        {p.total_sesiones.toLocaleString()}
      </td>
      <td className={cn("px-4 py-3 text-right text-sm font-semibold tabular-nums", getFinalizacionColor(p.tasa_finalizacion))}>
        {p.tasa_finalizacion}%
      </td>
      <td className="px-4 py-3 text-right">
        <div className="flex items-center justify-end gap-1">
          <Star className={cn("h-3.5 w-3.5", p.calificacion_promedio !== null && p.calificacion_promedio >= 4 ? "text-amber-400 fill-amber-400" : "text-on-surface-variant/40")} />
          <span className="text-sm tabular-nums text-on-surface">
            {p.calificacion_promedio !== null ? p.calificacion_promedio.toFixed(1) : "—"}
          </span>
        </div>
      </td>
      <td className="px-4 py-3 text-right text-sm tabular-nums text-on-surface">
        {p.total_feedbacks}
      </td>
      <td className="px-4 py-3 text-right text-xs text-on-surface-variant">
        {formatRelativeTime(p.ultimo_evento)}
      </td>
    </tr>
  )
}
