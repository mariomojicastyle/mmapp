"use client"

import React from "react"
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts"

/* eslint-disable @typescript-eslint/no-explicit-any */
interface AdopcionPanelProps {
  metricas: any
}

const DEVICE_COLORS = ["var(--primary)", "var(--tertiary)", "#a78bfa"]
const REFERRER_COLORS = ["#34d399", "var(--primary)", "var(--tertiary)", "#a78bfa"]

export function AdopcionPanel({ metricas }: AdopcionPanelProps) {
  // Daily sessions area chart
  const areaData = Object.entries(metricas.sesionesXDia || {})
    .map(([date, count]) => ({
      date: new Date(date).toLocaleDateString("es-CO", { day: "2-digit", month: "short" }),
      sesiones: count as number,
    }))
    .slice(-90)

  // Device distribution pie
  const deviceData = Object.entries(metricas.dispositivos || {}).map(([name, value]) => ({
    name: name === "mobile" ? "Móvil" : name === "desktop" ? "Escritorio" : name,
    value: value as number,
  }))

  // Top days table
  const topDays = Object.entries(metricas.sesionesXDia || {})
    .map(([date, count]) => ({ date, count: count as number }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)

  return (
    <div className="space-y-6">
      {/* ─── Area Chart ─── */}
      {areaData.length > 0 && (
        <div className="rounded-xl bg-surface-container p-5">
          <h3 className="text-sm font-semibold text-on-surface mb-4">Escaneos diarios</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={areaData}>
                <defs>
                  <linearGradient id="colorSesiones" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--outline-variant)" opacity={0.3} />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: "var(--on-surface-variant)" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "var(--on-surface-variant)" }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ backgroundColor: "var(--surface-container-high)", border: "1px solid var(--outline-variant)", borderRadius: 8, fontSize: 12, color: "var(--on-surface)" }} />
                <Area type="monotone" dataKey="sesiones" stroke="var(--primary)" strokeWidth={2} fillOpacity={1} fill="url(#colorSesiones)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ─── Pie Charts ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Devices */}
        {deviceData.length > 0 && (
          <div className="rounded-xl bg-surface-container p-5">
            <h3 className="text-sm font-semibold text-on-surface mb-4">Dispositivos</h3>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={deviceData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} dataKey="value" paddingAngle={4}>
                    {deviceData.map((_, i) => (
                      <Cell key={`d-${i}`} fill={DEVICE_COLORS[i % DEVICE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: "var(--surface-container-high)", border: "1px solid var(--outline-variant)", borderRadius: 8, fontSize: 12, color: "var(--on-surface)" }} />
                  <Legend wrapperStyle={{ fontSize: 12, color: "var(--on-surface-variant)" }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Top Days Table */}
        <div className="rounded-xl bg-surface-container p-5">
          <h3 className="text-sm font-semibold text-on-surface mb-4">Top 10 días con más escaneos</h3>
          <div className="space-y-1.5">
            {topDays.map((day, i) => (
              <div key={day.date} className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-surface-container-high/50 transition">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-on-surface-variant w-5 text-right">{i + 1}</span>
                  <span className="text-sm text-on-surface">
                    {new Date(day.date).toLocaleDateString("es-CO", { day: "numeric", month: "short", year: "numeric" })}
                  </span>
                </div>
                <span className="text-sm font-semibold text-primary tabular-nums">{day.count}</span>
              </div>
            ))}
            {topDays.length === 0 && (
              <p className="text-xs text-on-surface-variant text-center py-8">Sin datos aún</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
