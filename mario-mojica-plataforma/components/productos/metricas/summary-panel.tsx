"use client"

import React from "react"
import { Eye, CheckCircle, Star, Clock, HelpCircle, MessageSquare, Info } from "lucide-react"
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts"

/* eslint-disable @typescript-eslint/no-explicit-any */
interface SummaryPanelProps {
  metricas: any
  codigoManual?: string
  productoNombre?: string
}

function KpiCard({ icon: Icon, label, value, subtitle, color, tooltip }: {
  icon: React.ElementType; label: string; value: string | number; subtitle?: React.ReactNode; color?: string; tooltip: string
}) {
  return (
    <div className="rounded-xl bg-surface-container p-4 relative">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${color || "bg-primary/10"}`}>
            <Icon className={`h-4 w-4 ${color ? "text-white/80" : "text-primary"}`} />
          </div>
          <span className="text-xs text-on-surface-variant font-medium">{label}</span>
        </div>
        
        {/* Tooltip trigger icon */}
        <div className="relative group/tooltip">
          <Info className="h-3.5 w-3.5 text-on-surface-variant/30 hover:text-primary transition-colors cursor-help" />
          <div className="absolute top-full right-0 mt-2 w-60 p-3 bg-surface-container-high border border-outline-variant/30 text-[11px] text-on-surface font-normal rounded-lg shadow-xl opacity-0 group-hover/tooltip:opacity-100 transition-opacity duration-200 pointer-events-none z-55 leading-relaxed text-left">
            {tooltip}
            <div className="absolute bottom-full right-1.5 border-4 border-transparent border-b-surface-container-high" />
          </div>
        </div>
      </div>
      <p className="text-2xl font-bold text-on-surface tabular-nums">{value}</p>
      {subtitle && <div className="text-xs text-on-surface-variant mt-0.5">{subtitle}</div>}
    </div>
  )
}

function formatTime(ms: number): string {
  if (!ms || ms === 0) return "—"
  const totalSec = Math.floor(ms / 1000)
  if (totalSec >= 3600) {
    const hrs = Math.floor(totalSec / 3600)
    const min = Math.floor((totalSec % 3600) / 60)
    return `${hrs}h ${min}m`
  }
  const min = Math.floor(totalSec / 60)
  return `${min}m`
}

export function SummaryPanel({ metricas, codigoManual, productoNombre }: SummaryPanelProps) {
  const r = metricas.resumen || {}

  // Prepare daily sessions chart data
  const chartData = Object.entries(metricas.sesionesXDia || {})
    .map(([date, count]) => ({
      date: new Date(date).toLocaleDateString("es-CO", { day: "2-digit", month: "short" }),
      sesiones: count as number,
    }))
    .slice(-30)

  // Average time from step times
  const avgTotalTime = (metricas.tiemposPorPaso || []).reduce(
    (sum: number, s: any) => sum + (s.avgTimeMs || 0), 0
  )

  return (
    <div className="space-y-6">
      {/* ─── KPI Grid ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <KpiCard
          icon={Eye}
          label="Total Escaneos"
          value={r.totalSesiones?.toLocaleString() || 0}
          subtitle={`${r.sesionesCompletadas || 0} completados`}
          tooltip="Mide el volumen total de veces que los códigos QR impresos en las cajas o manuales de los productos han sido escaneados por los clientes para iniciar la experiencia interactiva 3D."
        />
        <KpiCard
          icon={CheckCircle}
          label="Tasa de Finalización"
          value={`${r.tasaFinalizacion || 0}%`}
          subtitle={`${r.sesionesCompletadas || 0} de ${r.totalSesiones || 0}`}
          tooltip="Mide el porcentaje de usuarios que completaron con éxito todos los pasos de armado del manual, sobre el total de personas que escanearon el código QR. Es un indicador clave de la efectividad del manual."
        />
        <KpiCard
          icon={Star}
          label="Calificación"
          value={r.calificacionPromedio?.toFixed(1) || "—"}
          subtitle={`de ${r.totalFeedbacks || 0} opiniones`}
          color="bg-amber-500/20"
          tooltip="Es el puntaje promedio de satisfacción otorgado por los clientes al final de la experiencia (de 1 a 5 estrellas). Ayuda a medir la percepción de calidad del producto y la claridad de la guía."
        />
        <KpiCard
          icon={Clock}
          label="Tiempo Promedio"
          value={formatTime(avgTotalTime)}
          subtitle={
            codigoManual === "M00001" ? (
              <span className="block text-[11px] text-tertiary font-semibold mt-0.5 leading-tight">
                Est. Experto: ≤ 1h | Común: 1h - 3h
              </span>
            ) : "tiempo total de armado"
          }
          tooltip="Calcula el tiempo medio real que le toma a un usuario completar el ensamble total del mueble, sumando los tiempos invertidos en cada paso del manual. Ayuda a comparar el tiempo estimado vs el tiempo real del cliente común."
        />
        <KpiCard
          icon={HelpCircle}
          label="Clicks de Ayuda"
          value={r.totalAyudas?.toLocaleString() || 0}
          tooltip="Registra cuántas veces los usuarios presionaron herramientas de asistencia interactiva (zoom, buscador de piezas, repetir locución, velocidad de audio, etc.) al sentirse confundidos, previniendo que abandonen el armado."
        />
        <KpiCard
          icon={MessageSquare}
          label="Feedbacks"
          value={r.totalFeedbacks?.toLocaleString() || 0}
          tooltip="Mide la cantidad total de encuestas y comentarios escritos que los clientes han enviado voluntariamente tras terminar el ensamble, permitiendo identificar sugerencias y oportunidades de mejora."
        />
      </div>

      {/* ─── Comparación de Tiempos de Armado (Estantería Multifuncional) ─── */}
      {codigoManual === "M00001" && (
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h4 className="text-sm font-semibold text-primary">Comparativa de Tiempos de Ensamble</h4>
            <p className="text-xs text-on-surface-variant mt-1 max-w-xl">
              El tiempo promedio real registrado por los usuarios comunes es de <strong className="text-on-surface">{formatTime(avgTotalTime)}</strong>. Se estima que un experto de armado completa la <strong>Estantería Multifuncional</strong> en un máximo de <strong>1 hora</strong>, mientras que una persona común tarda entre <strong>1 y 3 horas</strong> (con 9 pasos de armado total, sin contar el paso 0 de inicio).
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            <div className="rounded-lg bg-surface-container-high px-3 py-1.5 text-center">
              <span className="block text-[9px] uppercase text-on-surface-variant font-medium">Experto</span>
              <span className="text-xs font-bold text-success">≤ 1h</span>
            </div>
            <div className="rounded-lg bg-surface-container-high px-3 py-1.5 text-center">
              <span className="block text-[9px] uppercase text-on-surface-variant font-medium">Común</span>
              <span className="text-xs font-bold text-tertiary">1h - 3h</span>
            </div>
            <div className="rounded-lg bg-primary/10 px-3 py-1.5 text-center border border-primary/20">
              <span className="block text-[9px] uppercase text-primary font-semibold">Promedio Real</span>
              <span className="text-xs font-bold text-primary">{formatTime(avgTotalTime)}</span>
            </div>
          </div>
        </div>
      )}

      {/* ─── Timeline Chart ─── */}
      {chartData.length > 0 && (
        <div className="rounded-xl bg-surface-container p-5">
          <h3 className="text-sm font-semibold text-on-surface mb-4">Escaneos por día</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--outline-variant)" opacity={0.3} />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: "var(--on-surface-variant)" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "var(--on-surface-variant)" }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--surface-container-high)",
                    border: "1px solid var(--outline-variant)",
                    borderRadius: 8,
                    fontSize: 12,
                    color: "var(--on-surface)",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="sesiones"
                  stroke="var(--primary)"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, fill: "var(--primary)" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  )
}
