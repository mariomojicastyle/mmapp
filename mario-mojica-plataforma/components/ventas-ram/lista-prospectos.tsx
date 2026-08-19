"use client"

import React, { useState, useMemo } from "react"
import { Search, Plus, Flame, Clock, ArrowUpDown, Building2, MessageSquare, Mail, Phone, Trash2 } from "lucide-react"
import { VentasProspecto, TemperaturaLead, CanalContacto } from "@/lib/types/ventas-ram"

interface ListaProspectosProps {
  prospectos: VentasProspecto[]
  selectedId: string | null
  onSelect: (prospecto: VentasProspecto) => void
  onNewProspecto: () => void
  onDeleteProspecto?: (prospecto: VentasProspecto) => void
}

type SortOption = "temperatura" | "fecha_desc" | "fecha_asc" | "alfabetico"

export function ListaProspectos({
  prospectos,
  selectedId,
  onSelect,
  onNewProspecto,
  onDeleteProspecto,
}: ListaProspectosProps) {
  const [search, setSearch] = useState("")
  const [sortBy, setSortBy] = useState<SortOption>("temperatura")
  const [soloPendientes, setSoloPendientes] = useState(false)

  const checkIsUrgente = (p: VentasProspecto) => {
    if (!p.proxima_accion_descripcion) return false
    const now = Date.now()
    let target = p.proxima_accion_at ? new Date(p.proxima_accion_at).getTime() : null
    if (!target && p.ultima_interaccion_at) {
      target = new Date(p.ultima_interaccion_at).getTime() + 48 * 3600 * 1000
    }
    if (!target) return false
    const diffHours = (target - now) / (1000 * 3600)
    return diffHours <= 48
  }

  const getTemperaturaBadge = (temp: TemperaturaLead) => {
    switch (temp) {
      case "caliente":
        return {
          label: "Caliente",
          icon: "🔥",
          classes: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
        }
      case "tibio":
        return {
          label: "Tibio",
          icon: "🟡",
          classes: "bg-primary/15 text-primary border-primary/30",
        }
      case "enfriando":
        return {
          label: "En riesgo",
          icon: "🔴",
          classes: "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30",
        }
      case "pausado":
        return {
          label: "Pausado",
          icon: "⏸️",
          classes: "bg-surface-container-highest text-on-surface-variant border-outline-variant/30",
        }
      case "cerrado_ganado":
        return {
          label: "Ganado 🎉",
          icon: "✅",
          classes: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
        }
      case "cerrado_perdido":
        return {
          label: "Perdido",
          icon: "❌",
          classes: "bg-slate-500/15 text-slate-500 border-slate-500/30",
        }
    }
  }

  const getCanalIcon = (canal: CanalContacto) => {
    switch (canal) {
      case "WhatsApp":
        return <MessageSquare className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
      case "Email":
        return <Mail className="h-3.5 w-3.5 text-primary" />
      case "Teléfono":
        return <Phone className="h-3.5 w-3.5 text-amber-500" />
      default:
        return <Building2 className="h-3.5 w-3.5 text-on-surface-variant" />
    }
  }

  const formatTiempoRelativo = (dateStr: string) => {
    try {
      const d = new Date(dateStr)
      const diffDays = Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24))
      if (diffDays === 0) return "Hoy"
      if (diffDays === 1) return "Ayer"
      if (diffDays < 7) return `Hace ${diffDays} días`
      if (diffDays < 30) return `Hace ${Math.floor(diffDays / 7)} sem`
      return `Hace ${Math.floor(diffDays / 30)} meses`
    } catch {
      return ""
    }
  }

  // Filtrado y Ordenamiento
  const filteredAndSorted = useMemo(() => {
    return prospectos
      .filter((p) => {
        if (soloPendientes && !checkIsUrgente(p)) return false

        const query = search.toLowerCase()
        return (
          p.empresa.toLowerCase().includes(query) ||
          p.contacto_nombre.toLowerCase().includes(query) ||
          (p.contacto_cargo && p.contacto_cargo.toLowerCase().includes(query))
        )
      })
      .sort((a, b) => {
        if (sortBy === "temperatura") {
          const priority: Record<TemperaturaLead, number> = {
            caliente: 1,
            enfriando: 2,
            tibio: 3,
            pausado: 4,
            cerrado_ganado: 5,
            cerrado_perdido: 6,
          }
          return (priority[a.temperatura] || 99) - (priority[b.temperatura] || 99)
        }
        if (sortBy === "fecha_desc") {
          return new Date(b.ultima_interaccion_at).getTime() - new Date(a.ultima_interaccion_at).getTime()
        }
        if (sortBy === "fecha_asc") {
          return new Date(a.ultima_interaccion_at).getTime() - new Date(b.ultima_interaccion_at).getTime()
        }
        if (sortBy === "alfabetico") {
          return a.empresa.localeCompare(b.empresa)
        }
        return 0
      })
  }, [prospectos, search, sortBy, soloPendientes])

  // Contadores por temperatura y radar
  const counts = useMemo(() => {
    const calientes = prospectos.filter((p) => p.temperatura === "caliente").length
    const tibios = prospectos.filter((p) => p.temperatura === "tibio").length
    const enfriando = prospectos.filter((p) => p.temperatura === "enfriando").length
    const urgentes = prospectos.filter(checkIsUrgente).length
    return { calientes, tibios, enfriando, urgentes, total: prospectos.length }
  }, [prospectos])

  return (
    <div className="flex flex-col h-full rounded-2xl bg-surface-container border border-outline-variant/20 shadow-sm overflow-hidden">
      {/* Header y Acciones */}
      <div className="p-4 border-b border-outline-variant/15 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-on-surface flex items-center gap-2">
              <span>Directorio de Prospectos</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-semibold">
                {counts.total}
              </span>
            </h2>
            <p className="text-[11px] text-on-surface-variant mt-0.5">
              {counts.calientes} calientes 🔥 • {counts.enfriando} en riesgo 🔴
            </p>
          </div>

          <button
            onClick={onNewProspecto}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary text-xs font-semibold text-primary-foreground hover:opacity-90 transition-opacity shadow-sm cursor-pointer shrink-0"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Nuevo</span>
          </button>
        </div>

        {/* Buscador */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-on-surface-variant" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por empresa o contacto..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-surface-container-high border border-outline-variant/20 text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:border-primary transition-colors"
          />
        </div>

        {/* Barra de Ordenamiento y Filtro Radar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-[11px] pt-1">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setSoloPendientes(!soloPendientes)}
              className={`px-2 py-0.5 rounded-lg font-bold flex items-center gap-1 transition-all cursor-pointer ${
                soloPendientes
                  ? "bg-rose-500 text-white shadow-xs"
                  : "bg-surface-container-high text-on-surface hover:border-primary/40 border border-outline-variant/20"
              }`}
              title="Filtrar solo prospectos con seguimiento pendiente hoy o vencido"
            >
              <span>🚨 Pendientes</span>
              {counts.urgentes > 0 && (
                <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-extrabold ${soloPendientes ? "bg-white/25 text-white" : "bg-rose-500 text-white"}`}>
                  {counts.urgentes}
                </span>
              )}
            </button>
          </div>

          <div className="flex items-center gap-1 self-end sm:self-auto">
            <span className="text-on-surface-variant flex items-center gap-1 font-medium text-[10px]">
              <ArrowUpDown className="h-2.5 w-2.5" /> Ordenar:
            </span>
            <button
              onClick={() => {
                setSoloPendientes(false)
                setSortBy("temperatura")
              }}
              className={`px-1.5 py-0.5 rounded-md font-medium transition-colors ${
                !soloPendientes && sortBy === "temperatura"
                  ? "bg-primary/20 text-primary font-bold"
                  : "text-on-surface-variant hover:bg-surface-container-highest"
              }`}
            >
              🔥 Temp
            </button>
            <button
              onClick={() => {
                setSoloPendientes(false)
                setSortBy(sortBy === "fecha_desc" ? "fecha_asc" : "fecha_desc")
              }}
              className={`px-1.5 py-0.5 rounded-md font-medium transition-colors ${
                !soloPendientes && sortBy.startsWith("fecha")
                  ? "bg-primary/20 text-primary font-bold"
                  : "text-on-surface-variant hover:bg-surface-container-highest"
              }`}
            >
              📅 Fecha {sortBy === "fecha_asc" ? "↑" : "↓"}
            </button>
            <button
              onClick={() => {
                setSoloPendientes(false)
                setSortBy("alfabetico")
              }}
              className={`px-1.5 py-0.5 rounded-md font-medium transition-colors ${
                !soloPendientes && sortBy === "alfabetico"
                  ? "bg-primary/20 text-primary font-bold"
                  : "text-on-surface-variant hover:bg-surface-container-highest"
              }`}
            >
              A-Z
            </button>
          </div>
        </div>
      </div>

      {/* Lista Desplazable de Prospectos */}
      <div className="flex-1 overflow-y-auto divide-y divide-outline-variant/15 custom-scrollbar">
        {filteredAndSorted.length === 0 ? (
          <div className="p-8 text-center text-on-surface-variant">
            <Building2 className="h-8 w-8 mx-auto opacity-30 mb-2" />
            <p className="text-xs font-medium">No se encontraron prospectos</p>
          </div>
        ) : (
          filteredAndSorted.map((p) => {
            const isSelected = p.id === selectedId
            const tempBadge = getTemperaturaBadge(p.temperatura)

            return (
              <div
                key={p.id}
                onClick={() => onSelect(p)}
                className={`p-3.5 transition-all cursor-pointer text-left border-l-4 ${
                  isSelected
                    ? "bg-primary/10 border-l-primary"
                    : "border-l-transparent hover:bg-surface-container-high/60"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-xs text-on-surface truncate block">
                        {p.empresa}
                      </span>
                      <span className="text-[10px] text-on-surface-variant shrink-0">
                        ({p.pais})
                      </span>
                    </div>

                    <p className="text-[11px] font-medium text-on-surface/90 truncate mt-0.5">
                      {p.contacto_nombre}
                    </p>

                    {p.contacto_cargo && (
                      <p className="text-[10px] text-on-surface-variant truncate">
                        {p.contacto_cargo}
                      </p>
                    )}
                  </div>

                  {/* Badge de Temperatura y Botón de Eliminar */}
                  <div className="flex items-center gap-1 shrink-0">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border flex items-center gap-1 ${tempBadge.classes}`}
                    >
                      <span>{tempBadge.icon}</span>
                      <span>{tempBadge.label}</span>
                    </span>

                    {onDeleteProspecto && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          onDeleteProspecto(p)
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded-lg text-on-surface-variant hover:text-rose-500 hover:bg-rose-500/10 transition-all cursor-pointer"
                        title="Eliminar prospecto"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Relación / Puente de Conexión */}
                {p.referido_por_nombre && (
                  <div className="mt-1.5 flex items-center gap-1 text-[9px] text-amber-500 font-semibold bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-md truncate">
                    <span>🔗</span>
                    <span className="truncate">Puente: {p.referido_por_nombre}</span>
                  </div>
                )}

                {(() => {
                  const firstName = (p.contacto_nombre || "").toLowerCase().split(" ")[0]
                  const apadrinados = prospectos.filter(
                    (other) =>
                      other.id !== p.id &&
                      (other.referido_por_id === p.id ||
                        (other.referido_por_nombre &&
                          firstName &&
                          firstName.length > 2 &&
                          other.referido_por_nombre.toLowerCase().includes(firstName)))
                  )
                  if (apadrinados.length === 0) return null
                  return (
                    <div className="mt-1.5 flex items-center gap-1 text-[9px] text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md truncate">
                      <span>🌟</span>
                      <span className="truncate">
                        Padrino B2B: Conectó con {apadrinados.map((a) => `${a.contacto_nombre.split(" ")[0]} (${a.empresa})`).join(", ")}
                      </span>
                    </div>
                  )
                })()}

                {/* Próxima Acción o Nota con Resaltado del Radar */}
                {p.proxima_accion_descripcion && (
                  <div
                    className={`mt-2 p-1.5 rounded-lg text-[10px] font-medium leading-snug ${
                      checkIsUrgente(p)
                        ? "bg-amber-500/15 border border-amber-500/30 text-amber-800 dark:text-amber-300 font-semibold"
                        : "bg-primary/5 text-primary"
                    }`}
                  >
                    <p className="line-clamp-1">
                      {checkIsUrgente(p) ? "⏳ " : "📌 "}
                      {p.proxima_accion_descripcion}
                    </p>
                  </div>
                )}

                {/* Footer del Item: Canal y Fecha */}
                <div className="mt-2.5 flex items-center justify-between text-[10px] text-on-surface-variant/80">
                  <span className="flex items-center gap-1">
                    {getCanalIcon(p.canal_preferido)}
                    <span>{p.canal_preferido}</span>
                  </span>

                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>{formatTiempoRelativo(p.ultima_interaccion_at)}</span>
                  </span>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
