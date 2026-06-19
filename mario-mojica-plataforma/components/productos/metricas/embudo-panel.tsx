"use client"

import React from "react"
import { AlertTriangle } from "lucide-react"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from "recharts"
import { cn } from "@/lib/utils"

/* eslint-disable @typescript-eslint/no-explicit-any */
interface EmbudoPanelProps {
  metricas: any
}

function formatTime(ms: number): string {
  if (!ms) return "—"
  const totalSec = Math.floor(ms / 1000)
  if (totalSec >= 3600) {
    const hrs = Math.floor(totalSec / 3600)
    const min = Math.floor((totalSec % 3600) / 60)
    const sec = totalSec % 60
    return sec > 0 ? `${hrs}h ${min}m ${sec}s` : `${hrs}h ${min}m`
  }
  const min = Math.floor(totalSec / 60)
  const sec = totalSec % 60
  return min > 0 ? `${min}m ${sec}s` : `${sec}s`
}

function formatYAxisTime(seconds: number): string {
  if (seconds >= 3600) {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${mins}m`;
  }
  if (seconds >= 60) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
  }
  return `${seconds}s`;
}

function getBarColor(percentage: number): string {
  if (percentage >= 80) return "#4ade80"  // green
  if (percentage >= 50) return "#fbbf24"  // yellow
  return "#f87171"                         // red
}

export function EmbudoPanel({ metricas }: EmbudoPanelProps) {
  const embudo: any[] = metricas.embudo || []
  const tiempos: any[] = metricas.tiemposPorPaso || []
  const totalSesiones = metricas.resumen?.totalSesiones || 0

  // Find critical steps (drop-off > 25% from previous step)
  const criticalSteps: any[] = []
  for (let i = 1; i < embudo.length; i++) {
    const dropOff = embudo[i - 1].percentage - embudo[i].percentage
    if (dropOff > 25) {
      const stepTime = tiempos.find((t: any) => t.step === embudo[i].step)
      criticalSteps.push({
        step: embudo[i].step,
        dropOff,
        prevPercentage: embudo[i - 1].percentage,
        currentPercentage: embudo[i].percentage,
        avgTime: stepTime?.avgTimeMs || 0,
      })
    }
  }

  // Funnel chart data (horizontal bars)
  const funnelData = embudo.map((e: any) => ({
    name: `Paso ${e.step}`,
    sesiones: e.count,
    porcentaje: e.percentage,
  }))

  // Time per step chart data
  const timeData = tiempos.map((t: any) => ({
    name: `Paso ${t.step}`,
    tiempo: Math.round(t.avgTimeMs / 1000), // seconds
    tiempoMs: t.avgTimeMs,
  }))

  return (
    <div className="space-y-6">
      {/* ─── Critical Step Alerts ─── */}
      {criticalSteps.map((cs) => (
        <div key={cs.step} className="rounded-xl border border-tertiary/30 bg-tertiary/5 p-4 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-tertiary shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-on-surface">
              ⚠️ Alerta de Fricción — Paso {cs.step}
            </p>
            <p className="text-xs text-on-surface-variant mt-1">
              Registra un abandono del <strong className="text-tertiary">{cs.dropOff}%</strong> respecto al paso anterior
              (de {cs.prevPercentage}% a {cs.currentPercentage}%).
              {cs.avgTime > 0 && (
                <> Tiempo promedio: <strong>{formatTime(cs.avgTime)}</strong>.</>
              )}
              <br />Recomendación: Revisar el GLB del paso, la locución del audio o los herrajes involucrados.
            </p>
          </div>
        </div>
      ))}

      {/* ─── Funnel Chart ─── */}
      {funnelData.length > 0 && (
        <div className="rounded-xl bg-surface-container p-5">
          <h3 className="text-sm font-semibold text-on-surface mb-1">Embudo de Armado</h3>
          <p className="text-xs text-on-surface-variant mb-4">
            Porcentaje de sesiones que alcanzaron cada paso ({totalSesiones} sesiones totales)
          </p>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={funnelData} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--outline-variant)" opacity={0.3} horizontal={false} />
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11, fill: "var(--on-surface-variant)" }} axisLine={false} tickLine={false} unit="%" />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: "var(--on-surface)" }} axisLine={false} tickLine={false} width={60} />
                <Tooltip
                  contentStyle={{ backgroundColor: "var(--surface-container-high)", border: "1px solid var(--outline-variant)", borderRadius: 8, fontSize: 12, color: "var(--on-surface)" }}
                  formatter={(value: any, name: any, props: any) => [`${props.payload.porcentaje}% (${props.payload.sesiones} sesiones)`, "Retención"]}
                />
                <Bar dataKey="porcentaje" radius={[0, 4, 4, 0]} barSize={24}>
                  {funnelData.map((entry, i) => (
                    <Cell key={`f-${i}`} fill={getBarColor(entry.porcentaje)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ─── Time per Step Chart ─── */}
      {timeData.length > 0 && (
        <div className="rounded-xl bg-surface-container p-5">
          <h3 className="text-sm font-semibold text-on-surface mb-1">Tiempo promedio por paso</h3>
          <p className="text-xs text-on-surface-variant mb-4">Tiempo promedio que los usuarios pasan en cada paso</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={timeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--outline-variant)" opacity={0.3} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "var(--on-surface-variant)" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "var(--on-surface-variant)" }} axisLine={false} tickLine={false} tickFormatter={formatYAxisTime} />
                <Tooltip
                  contentStyle={{ backgroundColor: "var(--surface-container-high)", border: "1px solid var(--outline-variant)", borderRadius: 8, fontSize: 12, color: "var(--on-surface)" }}
                  formatter={(value: any, name: any, props: any) => [formatTime(props.payload.tiempoMs), "Tiempo promedio"]}
                />
                <Bar dataKey="tiempo" fill="var(--primary)" radius={[4, 4, 0, 0]} barSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ─── Detail Table ─── */}
      {embudo.length > 0 && (
        <div className="rounded-xl bg-surface-container overflow-hidden">
          <div className="border-b border-outline-variant/20 px-5 py-3">
            <h3 className="text-sm font-semibold text-on-surface">Detalle paso a paso</h3>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-outline-variant/20">
                <th className="px-5 py-2.5 text-left text-xs font-medium uppercase text-on-surface-variant">Paso</th>
                <th className="px-5 py-2.5 text-right text-xs font-medium uppercase text-on-surface-variant">Sesiones</th>
                <th className="px-5 py-2.5 text-right text-xs font-medium uppercase text-on-surface-variant">Retención</th>
                <th className="px-5 py-2.5 text-right text-xs font-medium uppercase text-on-surface-variant">Tiempo Avg</th>
                <th className="px-5 py-2.5 text-right text-xs font-medium uppercase text-on-surface-variant">Tiempo Máx</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20">
              {embudo.map((e: any) => {
                const stepTime = tiempos.find((t: any) => t.step === e.step)
                return (
                  <tr key={e.step} className="hover:bg-surface-container-high/50 transition-colors">
                    <td className="px-5 py-2.5 text-sm font-medium text-on-surface">Paso {e.step}</td>
                    <td className="px-5 py-2.5 text-right text-sm tabular-nums text-on-surface">{e.count}</td>
                    <td className={cn("px-5 py-2.5 text-right text-sm font-semibold tabular-nums",
                      e.percentage >= 80 ? "text-success" : e.percentage >= 50 ? "text-tertiary" : "text-error"
                    )}>
                      {e.percentage}%
                    </td>
                    <td className="px-5 py-2.5 text-right text-sm tabular-nums text-on-surface">
                      {stepTime ? formatTime(stepTime.avgTimeMs) : "—"}
                    </td>
                    <td className="px-5 py-2.5 text-right text-sm tabular-nums text-on-surface-variant">
                      {stepTime ? formatTime(stepTime.maxTimeMs) : "—"}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
