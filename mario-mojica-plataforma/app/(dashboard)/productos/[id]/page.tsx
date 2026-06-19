"use client"

import React, { useState, useEffect, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import {
  ArrowLeft, FileDown, LayoutDashboard, TrendingUp, GitBranch,
  MessageSquare, Settings, Loader2, Calendar
} from "lucide-react"
import { usePermissions } from "@/hooks/use-permissions"
import { getMetricasDetalleProducto } from "@/app/actions/metricas"
import { SummaryPanel } from "@/components/productos/metricas/summary-panel"
import { AdopcionPanel } from "@/components/productos/metricas/adopcion-panel"
import { EmbudoPanel } from "@/components/productos/metricas/embudo-panel"
import { FeedbackPanel } from "@/components/productos/metricas/feedback-panel"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"

type TabId = "resumen" | "adopcion" | "embudo" | "opiniones" | "configuracion"

const tabs: { id: TabId; label: string; icon: React.ElementType; rolesOnly?: boolean }[] = [
  { id: "resumen", label: "Resumen", icon: LayoutDashboard },
  { id: "adopcion", label: "Adopción", icon: TrendingUp },
  { id: "embudo", label: "Embudo de Armado", icon: GitBranch },
  { id: "opiniones", label: "Opiniones", icon: MessageSquare },
  { id: "configuracion", label: "Configuración", icon: Settings, rolesOnly: true },
]

const dateRanges = [
  { label: "7 días", value: 7 },
  { label: "30 días", value: 30 },
  { label: "90 días", value: 90 },
  { label: "1 año", value: 365 },
  { label: "Todo", value: 0 },
]

/* eslint-disable @typescript-eslint/no-explicit-any */
export default function ProductoDetallePage() {
  const params = useParams()
  const router = useRouter()
  const { isSuperAdmin, isCoequipero } = usePermissions()
  const proyectoId = params.id as string

  const [activeTab, setActiveTab] = useState<TabId>("resumen")
  const [loading, setLoading] = useState(true)
  const [metricas, setMetricas] = useState<any>(null)
  const [productoNombre, setProductoNombre] = useState("")
  const [codigoManual, setCodigoManual] = useState("")
  const [dateRange, setDateRange] = useState(365)

  const canManage = isSuperAdmin || isCoequipero

  const fetchMetricas = useCallback(async () => {
    setLoading(true)
    try {
      const rangoFechas = dateRange > 0
        ? {
            desde: new Date(Date.now() - dateRange * 86400000).toISOString(),
            hasta: new Date().toISOString(),
          }
        : undefined

      const result = await getMetricasDetalleProducto(proyectoId, rangoFechas)
      if ("error" in result) {
        console.error(result.error)
        return
      }
      setMetricas(result)
    } catch (err) {
      console.error("Error fetching metricas:", err)
    } finally {
      setLoading(false)
    }
  }, [proyectoId, dateRange])

  // Fetch product name
  useEffect(() => {
    const fetchNombre = async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from("proyectos")
        .select("nombre, codigo_manual")
        .eq("id", proyectoId)
        .single()
      if (data) {
        setProductoNombre(data.nombre || "")
        setCodigoManual(data.codigo_manual || "")
      }
    }
    fetchNombre()
  }, [proyectoId])

  useEffect(() => {
    fetchMetricas()
  }, [fetchMetricas])

  const handleExportPDF = () => {
    // Open print-friendly view in new window
    const printWindow = window.open("", "_blank")
    if (!printWindow) return

    // Calcular el análisis matemático del embudo
    const embudo = metricas?.embudo || []
    let analisisEmbudoHtml = ""

    if (embudo.length > 0) {
      analisisEmbudoHtml += "<h2>Análisis Paso a Paso del Ensamble</h2>"
      analisisEmbudoHtml += "<div style='font-size: 13px; line-height: 1.6; color: #333; background: #f8fafc; padding: 16px; border-radius: 8px; border-left: 4px solid #008096; margin: 20px 0;'>"
      
      const totalIniciadas = embudo[0]?.count || 0
      const totalCompletadas = embudo[embudo.length - 1]?.count || 0
      const totalPerdidos = totalIniciadas - totalCompletadas

      analisisEmbudoHtml += `<p style='margin-top: 0; margin-bottom: 12px;'><strong>Resumen Ejecutivo:</strong> Se registraron <strong>${totalIniciadas}</strong> sesiones de armado iniciadas. De ellas, <strong>${totalCompletadas}</strong> usuarios finalizaron con éxito el último paso, logrando una tasa de retención global del <strong>${((totalCompletadas / totalIniciadas) * 100).toFixed(1)}%</strong>. Un total de <strong>${totalPerdidos}</strong> usuarios abandonaron el manual en alguna de las etapas del proceso.</p>`
      analisisEmbudoHtml += "<ul style='margin-bottom: 12px; padding-left: 20px;'>"

      let peorPasoNum = 1
      let peorPasoPerdidas = 0

      for (let i = 0; i < embudo.length; i++) {
        const actual = embudo[i]
        const anterior = i > 0 ? embudo[i - 1] : null
        
        if (!anterior) {
          analisisEmbudoHtml += `<li><strong>Paso 1:</strong> Inician <strong>${actual.count}</strong> sesiones de armado (100% de retención).</li>`
        } else {
          const perdidosPaso = anterior.count - actual.count
          if (perdidosPaso > peorPasoPerdidas) {
            peorPasoPerdidas = perdidosPaso
            peorPasoNum = actual.step
          }
          const pctPerdido = ((perdidosPaso / totalIniciadas) * 100).toFixed(1)
          analisisEmbudoHtml += `<li><strong>Paso ${actual.step}:</strong> Llegan <strong>${actual.count}</strong> sesiones (Retención acumulada: <strong>${actual.percentage}%</strong>). Se perdieron <strong>${perdidosPaso}</strong> usuarios en este paso (${pctPerdido}% del total).</li>`
        }
      }

      analisisEmbudoHtml += "</ul>"
      
      if (peorPasoPerdidas > 0) {
        analisisEmbudoHtml += `<p style='margin-bottom: 0; font-weight: 600; color: #b91c1c;'>⚠️ Punto de Fricción Crítico: El Paso ${peorPasoNum} registró la mayor pérdida de usuarios en el camino, con ${peorPasoPerdidas} abandonos en esta transición. Se recomienda auditar la claridad visual o de audio de este paso.</p>`
      }
      
      analisisEmbudoHtml += "</div>"
    }

    const content = `
      <!DOCTYPE html>
      <html><head>
        <title>Reporte - ${productoNombre}</title>
        <style>
          body { font-family: 'Inter', system-ui, sans-serif; padding: 40px; color: #1a1a1a; }
          h1 { font-size: 24px; margin-bottom: 8px; }
          h2 { font-size: 18px; margin-top: 32px; color: #008096; }
          .kpi-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin: 24px 0; }
          .kpi { border: 1px solid #e0e0e0; border-radius: 8px; padding: 16px; text-align: center; }
          .kpi-value { font-size: 28px; font-weight: 700; }
          .kpi-label { font-size: 12px; color: #666; margin-top: 4px; }
          .meta { color: #999; font-size: 12px; }
          table { width: 100%; border-collapse: collapse; margin: 16px 0; }
          th, td { padding: 8px 12px; border-bottom: 1px solid #e0e0e0; text-align: left; font-size: 13px; }
          th { font-weight: 600; color: #666; text-transform: uppercase; font-size: 11px; }
          .comment { padding: 12px; margin: 8px 0; background: #f8f8f8; border-radius: 8px; font-size: 13px; }
          .stars { color: #FFD700; }
          @media print { body { padding: 20px; } }
        </style>
      </head><body>
        <img src="/Logo_vertical_color_en.svg" alt="Mario Mojica" style="height:40px;margin-bottom:20px;" />
        <h1>${productoNombre}</h1>
        <p class="meta">Código: ${codigoManual} · Generado: ${new Date().toLocaleDateString("es-CO")} · Periodo: Últimos ${dateRange || "todos los"} días</p>

        <h2>Métricas Ejecutivas</h2>
        <div class="kpi-grid">
          <div class="kpi"><div class="kpi-value">${metricas?.resumen?.totalSesiones || 0}</div><div class="kpi-label">Total Escaneos</div></div>
          <div class="kpi"><div class="kpi-value">${metricas?.resumen?.tasaFinalizacion || 0}%</div><div class="kpi-label">Tasa Finalización</div></div>
          <div class="kpi"><div class="kpi-value">${metricas?.resumen?.calificacionPromedio?.toFixed(1) || "—"}</div><div class="kpi-label">Calificación ★</div></div>
          <div class="kpi"><div class="kpi-value">${metricas?.resumen?.sesionesCompletadas || 0}</div><div class="kpi-label">Armados Completos</div></div>
          <div class="kpi"><div class="kpi-value">${metricas?.resumen?.totalAyudas || 0}</div><div class="kpi-label">Clicks de Ayuda</div></div>
          <div class="kpi"><div class="kpi-value">${metricas?.resumen?.totalFeedbacks || 0}</div><div class="kpi-label">Opiniones</div></div>
        </div>

        <h2>Embudo de Armado</h2>
        <table>
          <thead><tr><th>Paso</th><th>Sesiones</th><th>Retención</th></tr></thead>
          <tbody>${(metricas?.embudo || []).map((e: any) => `<tr><td>Paso ${e.step}</td><td>${e.count}</td><td>${e.percentage}%</td></tr>`).join("")}</tbody>
        </table>

        ${analisisEmbudoHtml}

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 32px; margin-top: 32px; page-break-inside: avoid;">
          <div>
            <h2 style="font-size: 16px; margin-top: 0; color: #008096; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px;">Uso de Dispositivos</h2>
            <div style="margin-top: 16px; display: flex; flex-direction: column; gap: 12px;">
              ${Object.entries(metricas?.dispositivos || {}).map(([dev, count]: any) => {
                const total = Object.values(metricas?.dispositivos || {}).reduce((a: any, b: any) => a + b, 0) as number
                const pct = total > 0 ? ((count / total) * 100).toFixed(1) : "0.0"
                const name = dev === "desktop" ? "Escritorio" : dev === "mobile" ? "Móvil" : dev === "tablet" ? "Tablet" : dev
                const color = dev === "desktop" ? "#38bdf8" : dev === "mobile" ? "#fb923c" : "#a78bfa"
                return `
                  <div>
                    <div style="display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 4px; font-weight: 500;">
                      <span>${name}</span>
                      <span>${pct}% (${count})</span>
                    </div>
                    <div style="width: 100%; height: 8px; background: #e2e8f0; border-radius: 4px; overflow: hidden;">
                      <div style="width: ${pct}%; height: 100%; background: ${color}; border-radius: 4px;"></div>
                    </div>
                  </div>
                `
              }).join("")}
            </div>
          </div>

          <div>
            <h2 style="font-size: 16px; margin-top: 0; color: #008096; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px;">Sentimiento de Opiniones</h2>
            <div style="margin-top: 16px; display: flex; flex-direction: column; gap: 12px;">
              ${(() => {
                const s = metricas?.sentimiento || {}
                const total = (s.positivas || 0) + (s.neutrales || 0) + (s.negativas || 0)
                const getPct = (val: number) => total > 0 ? ((val / total) * 100).toFixed(1) : "0.0"
                return `
                  <div>
                    <div style="display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 4px; font-weight: 500;">
                      <span style="color: #16a34a;">Positivas</span>
                      <span>${getPct(s.positivas || 0)}% (${s.positivas || 0})</span>
                    </div>
                    <div style="width: 100%; height: 8px; background: #e2e8f0; border-radius: 4px; overflow: hidden;">
                      <div style="width: ${getPct(s.positivas || 0)}%; height: 100%; background: #4ade80; border-radius: 4px;"></div>
                    </div>
                  </div>
                  <div>
                    <div style="display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 4px; font-weight: 500;">
                      <span style="color: #d97706;">Neutrales</span>
                      <span>${getPct(s.neutrales || 0)}% (${s.neutrales || 0})</span>
                    </div>
                    <div style="width: 100%; height: 8px; background: #e2e8f0; border-radius: 4px; overflow: hidden;">
                      <div style="width: ${getPct(s.neutrales || 0)}%; height: 100%; background: #fbbf24; border-radius: 4px;"></div>
                    </div>
                  </div>
                  <div>
                    <div style="display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 4px; font-weight: 500;">
                      <span style="color: #dc2626;">Negativas</span>
                      <span>${getPct(s.negativas || 0)}% (${s.negativas || 0})</span>
                    </div>
                    <div style="width: 100%; height: 8px; background: #e2e8f0; border-radius: 4px; overflow: hidden;">
                      <div style="width: ${getPct(s.negativas || 0)}%; height: 100%; background: #f87171; border-radius: 4px;"></div>
                    </div>
                  </div>
                `
              })()}
            </div>
          </div>
        </div>

        <h2>Opiniones Destacadas</h2>
        ${(metricas?.feedbacks || []).slice(0, 10).map((f: any) => `
          <div class="comment">
            <span class="stars">${"★".repeat(f.rating)}${"☆".repeat(5 - f.rating)}</span>
            <span style="color:#999;font-size:11px;margin-left:8px;">${new Date(f.created_at).toLocaleDateString("es-CO")}</span>
            ${f.comment ? `<p style="margin:4px 0 0">${f.comment}</p>` : ""}
          </div>
        `).join("")}

        <script>setTimeout(() => { window.print(); }, 500);</script>
      </body></html>
    `
    printWindow.document.write(content)
    printWindow.document.close()
  }

  return (
    <div className="flex flex-col h-full">
      {/* ─── Page Header ─── */}
      <div className="shrink-0 border-b border-outline-variant/20 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/productos")}
              className="rounded-lg p-1.5 text-on-surface-variant hover:bg-surface-container-high transition"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-on-surface">
                {productoNombre || "Cargando..."}
              </h1>
              {codigoManual && (
                <p className="text-xs text-on-surface-variant mt-0.5">Código: {codigoManual}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Date Range Selector */}
            <div className="flex items-center gap-1.5 rounded-lg border border-outline-variant/30 bg-surface-container px-2 py-1">
              <Calendar className="h-3.5 w-3.5 text-on-surface-variant" />
              <select
                value={dateRange}
                onChange={(e) => setDateRange(Number(e.target.value))}
                className="bg-transparent text-sm text-on-surface focus:outline-none"
              >
                {dateRanges.map(r => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>

            {/* Export PDF */}
            <button
              onClick={handleExportPDF}
              disabled={loading || !metricas}
              className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FileDown className="h-4 w-4" />
              Exportar PDF
            </button>
          </div>
        </div>
      </div>

      {/* ─── Content: TabMenu + SubContent ─── */}
      <div className="flex flex-1 overflow-hidden">
        {/* TabMenu (Left Sidebar) */}
        <nav className="w-52 shrink-0 border-r border-outline-variant/20 bg-surface-container-low p-3 space-y-1 overflow-y-auto">
          {tabs.map((tab) => {
            if (tab.rolesOnly && !canManage) return null
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-2.5 w-full rounded-lg px-3 py-2.5 text-sm font-medium transition-colors text-left",
                  activeTab === tab.id
                    ? "bg-primary/10 text-primary"
                    : "text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {tab.label}
              </button>
            )
          })}
        </nav>

        {/* SubContent (Right Panel) */}
        <div className="flex-1 overflow-auto p-6">
          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : !metricas ? (
            <div className="flex h-64 items-center justify-center text-on-surface-variant text-sm">
              No hay datos de métricas disponibles.
            </div>
          ) : (
            <>
              {activeTab === "resumen" && (
                <SummaryPanel
                  metricas={metricas}
                  codigoManual={codigoManual}
                  productoNombre={productoNombre}
                />
              )}
              {activeTab === "adopcion" && <AdopcionPanel metricas={metricas} />}
              {activeTab === "embudo" && <EmbudoPanel metricas={metricas} />}
              {activeTab === "opiniones" && <FeedbackPanel metricas={metricas} />}
              {activeTab === "configuracion" && (
                <div className="flex flex-col items-center justify-center h-64 text-center">
                  <Settings className="h-10 w-10 text-on-surface-variant/30 mb-3" />
                  <p className="text-sm text-on-surface-variant">
                    Usa la sección de <strong>Proyectos</strong> para editar la configuración del CMS de este manual.
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
