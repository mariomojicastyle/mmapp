"use client"

import React, { useState, useEffect, useCallback } from "react"
import {
  Armchair, Search, LayoutGrid, LayoutList, GitCompareArrows,
  Loader2, ChevronLeft, ChevronRight, SlidersHorizontal, X
} from "lucide-react"
import { usePermissions } from "@/hooks/use-permissions"
import { useAuth } from "@/lib/auth/auth-context"
import { getProductosConMetricas } from "@/app/actions/metricas"
import { ProductCard } from "@/components/productos/product-card"
import { ProductListRow } from "@/components/productos/product-list-row"
import { ComparadorModal } from "@/components/productos/comparador-modal"
import { cn } from "@/lib/utils"

type SortField = "total_sesiones" | "calificacion_promedio" | "tasa_finalizacion" | "proyecto_nombre"

interface ProductoResumen {
  proyecto_id: string
  proyecto_nombre: string
  client_id: string
  categoria: string | null
  codigo_manual: string | null
  estado: string
  logo_url: string | null
  total_sesiones: number
  sesiones_completadas: number
  tasa_finalizacion: number
  calificacion_promedio: number | null
  total_feedbacks: number
  total_ayudas: number
  ultimo_evento: string | null
}

export default function ProductosPage() {
  const { isSuperAdmin, isCoequipero } = usePermissions()
  const { user } = useAuth()

  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [productos, setProductos] = useState<ProductoResumen[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [totalPages, setTotalPages] = useState(1)

  // Filters & pagination
  const [searchQuery, setSearchQuery] = useState("")
  const [sortField, setSortField] = useState<SortField>("total_sesiones")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")
  const [currentPage, setCurrentPage] = useState(1)
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const pageSize = 24

  // Comparison
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [isComparadorOpen, setIsComparadorOpen] = useState(false)

  const canSeeAll = isSuperAdmin || isCoequipero

  const fetchProductos = useCallback(async () => {
    setLoading(true)
    try {
      const clientId = canSeeAll ? null : user?.id || null
      const result = await getProductosConMetricas({
        clientId,
        search: searchQuery,
        ordenarPor: sortField,
        orden: sortDirection,
        page: currentPage,
        pageSize,
      })

      if ("error" in result) {
        console.error("Error cargando productos:", result.error)
        return
      }

      setProductos(result.data || [])
      setTotalCount(result.totalCount || 0)
      setTotalPages(result.totalPages || 1)
    } catch (err) {
      console.error("Error en fetchProductos:", err)
    } finally {
      setLoading(false)
    }
  }, [canSeeAll, user?.id, searchQuery, sortField, sortDirection, currentPage])

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted) fetchProductos()
  }, [mounted, fetchProductos])

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, sortField, sortDirection])

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else if (next.size < 4) {
        next.add(id)
      }
      return next
    })
  }

  const clearSelection = () => setSelectedIds(new Set())

  if (!mounted) {
    return (
      <div className="flex h-full items-center justify-center p-12 text-on-surface-variant">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2.5 text-sm">Cargando módulo de productos...</span>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* ─── Header ─── */}
      <div className="shrink-0 border-b border-outline-variant/20 px-6 py-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-on-surface">Productos</h1>
            <p className="mt-1 text-sm text-on-surface-variant">
              {canSeeAll
                ? `Métricas de desempeño de todos los manuales de armado · ${totalCount} productos`
                : `Métricas de desempeño de tus manuales de armado · ${totalCount} productos`}
            </p>
          </div>
        </div>

        {/* ─── Filters Bar ─── */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-on-surface-variant" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por nombre o código..."
              className="w-full rounded-lg bg-surface-container pl-9 pr-4 py-2 text-sm text-on-surface placeholder:text-on-surface-variant/50 border border-outline-variant/30 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30 transition"
            />
          </div>

          {/* Sort */}
          <div className="flex items-center gap-1.5">
            <SlidersHorizontal className="h-4 w-4 text-on-surface-variant" />
            <select
              value={sortField}
              onChange={(e) => setSortField(e.target.value as SortField)}
              className="rounded-lg bg-surface-container px-3 py-2 text-sm text-on-surface border border-outline-variant/30 focus:border-primary focus:outline-none"
            >
              <option value="total_sesiones">Mayor volumen</option>
              <option value="calificacion_promedio">Mayor satisfacción</option>
              <option value="tasa_finalizacion">Mayor tasa de finalización</option>
              <option value="proyecto_nombre">Nombre A-Z</option>
            </select>
          </div>

          {/* View Toggle */}
          <div className="flex rounded-lg border border-outline-variant/30 overflow-hidden">
            <button
              onClick={() => setViewMode("grid")}
              className={cn(
                "px-2.5 py-2 transition-colors",
                viewMode === "grid" ? "bg-primary/15 text-primary" : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
              )}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={cn(
                "px-2.5 py-2 transition-colors",
                viewMode === "list" ? "bg-primary/15 text-primary" : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
              )}
            >
              <LayoutList className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ─── Content ─── */}
      <div className="flex-1 overflow-auto px-6 py-5">
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : productos.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-surface-container">
              <Armchair className="h-8 w-8 text-on-surface-variant/40" />
            </div>
            <p className="text-on-surface-variant text-sm">
              {searchQuery ? "No se encontraron productos con ese criterio." : "Aún no hay manuales de armado con métricas."}
            </p>
          </div>
        ) : viewMode === "grid" ? (
          /* ─── Grid View ─── */
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {productos.map((p) => (
              <ProductCard
                key={p.proyecto_id}
                producto={p}
                isSelected={selectedIds.has(p.proyecto_id)}
                onToggleSelect={toggleSelect}
              />
            ))}
          </div>
        ) : (
          /* ─── List View ─── */
          <div className="rounded-xl bg-surface-container overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-outline-variant/20">
                  <th className="w-10 px-3 py-3" />
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-on-surface-variant">Producto</th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-on-surface-variant">Escaneos</th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-on-surface-variant">Tasa de finalización</th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-on-surface-variant">Rating</th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-on-surface-variant">Feedbacks</th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-on-surface-variant">Último evento</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20">
                {productos.map((p) => (
                  <ProductListRow
                    key={p.proyecto_id}
                    producto={p}
                    isSelected={selectedIds.has(p.proyecto_id)}
                    onToggleSelect={toggleSelect}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ─── Pagination ─── */}
        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between">
            <p className="text-xs text-on-surface-variant">
              Mostrando {((currentPage - 1) * pageSize) + 1}-{Math.min(currentPage * pageSize, totalCount)} de {totalCount}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="rounded-lg bg-surface-container p-2 text-on-surface-variant hover:bg-surface-container-high disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-sm text-on-surface tabular-nums">
                {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="rounded-lg bg-surface-container p-2 text-on-surface-variant hover:bg-surface-container-high disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ─── Floating Comparison Bar ─── */}
      {selectedIds.size >= 2 && (
        <div className="sticky bottom-0 z-30 border-t border-outline-variant/20 bg-surface-container-high/95 backdrop-blur-md px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <GitCompareArrows className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium text-on-surface">
              {selectedIds.size} producto{selectedIds.size > 1 ? "s" : ""} seleccionado{selectedIds.size > 1 ? "s" : ""}
              <span className="text-on-surface-variant"> (máx. 4)</span>
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={clearSelection}
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition"
            >
              <X className="h-3.5 w-3.5" />
              Deseleccionar
            </button>
            <button
              onClick={() => setIsComparadorOpen(true)}
              className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition hover:scale-[1.02] active:scale-[0.98]"
            >
              <GitCompareArrows className="h-4 w-4" />
              Comparar
            </button>
          </div>
        </div>
      )}

      {/* ─── Comparador Modal ─── */}
      {isComparadorOpen && (
        <ComparadorModal
          proyectoIds={Array.from(selectedIds)}
          onClose={() => {
            setIsComparadorOpen(false)
            clearSelection()
          }}
        />
      )}
    </div>
  )
}
