"use client"

import React, { useState } from "react"
import { Star, ChevronLeft, ChevronRight } from "lucide-react"
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie,
} from "recharts"
import { cn } from "@/lib/utils"

/* eslint-disable @typescript-eslint/no-explicit-any */
interface FeedbackPanelProps {
  metricas: any
}

const SENTIMENT_COLORS = { positivas: "#4ade80", neutrales: "#fbbf24", negativas: "#f87171" }

function StarRating({ rating, size = 16 }: { rating: number; size?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={cn("shrink-0", i <= rating ? "text-amber-400 fill-amber-400" : "text-on-surface-variant/20")}
          style={{ width: size, height: size }}
        />
      ))}
    </div>
  )
}

export function FeedbackPanel({ metricas }: FeedbackPanelProps) {
  const r = metricas.resumen || {}
  const feedbacks: any[] = metricas.feedbacks || []
  const sentimiento = metricas.sentimiento || {}

  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 100

  // Calculate pages
  const totalPages = Math.ceil(feedbacks.length / itemsPerPage) || 1
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedFeedbacks = feedbacks.slice(startIndex, startIndex + itemsPerPage)

  // Rating distribution
  const ratingDist = [5, 4, 3, 2, 1].map((rating) => ({
    rating: `${rating}★`,
    count: feedbacks.filter((f: any) => f.rating === rating).length,
  }))

  // Sentiment pie data
  const sentimentData = [
    { name: "Positivas", value: sentimiento.positivas || 0 },
    { name: "Neutrales", value: sentimiento.neutrales || 0 },
    { name: "Negativas", value: sentimiento.negativas || 0 },
  ].filter(s => s.value > 0)

  // Most frequent tags
  const tagCounts: Record<string, number> = {}
  feedbacks.forEach((f: any) => {
    (f.tags || []).forEach((tag: string) => {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1
    })
  })
  const sortedTags = Object.entries(tagCounts).sort(([, a], [, b]) => b - a)

  return (
    <div className="space-y-6">
      {/* ─── Hero Rating Card ─── */}
      <div className="rounded-xl bg-surface-container p-6 text-center">
        <p className="text-5xl font-bold text-on-surface tabular-nums mb-2">
          {r.calificacionPromedio?.toFixed(1) || "—"}
        </p>
        <div className="flex items-center justify-center mb-2">
          <StarRating rating={Math.round(r.calificacionPromedio || 0)} size={24} />
        </div>
        <p className="text-sm text-on-surface-variant">
          Basado en <strong>{r.totalFeedbacks || 0}</strong> opiniones
        </p>
      </div>

      {/* ─── Charts Row ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Rating Distribution */}
        <div className="rounded-xl bg-surface-container p-5">
          <h3 className="text-sm font-semibold text-on-surface mb-4">Distribución de calificaciones</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ratingDist} layout="vertical" margin={{ left: 5 }}>
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="rating" tick={{ fontSize: 13, fill: "var(--on-surface)" }} axisLine={false} tickLine={false} width={30} />
                <Tooltip contentStyle={{ backgroundColor: "var(--surface-container-high)", border: "1px solid var(--outline-variant)", borderRadius: 8, fontSize: 12, color: "var(--on-surface)" }} />
                <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={18}>
                  {ratingDist.map((entry, i) => (
                    <Cell key={`r-${i}`} fill={i < 2 ? "#4ade80" : i === 2 ? "#fbbf24" : "#f87171"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Sentiment Pie */}
        <div className="rounded-xl bg-surface-container p-5">
          <h3 className="text-sm font-semibold text-on-surface mb-4">Sentimiento</h3>
          {sentimentData.length > 0 ? (
            <div className="h-48 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={sentimentData} cx="50%" cy="50%" innerRadius={50} outerRadius={70} dataKey="value" paddingAngle={4} label={({ name, percent }) => `${name} ${percent !== undefined ? (percent * 100).toFixed(0) : 0}%`}>
                    {sentimentData.map((entry) => (
                      <Cell key={entry.name} fill={SENTIMENT_COLORS[entry.name.toLowerCase() as keyof typeof SENTIMENT_COLORS] || "#888"} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: "var(--surface-container-high)", border: "1px solid var(--outline-variant)", borderRadius: 8, fontSize: 12, color: "var(--on-surface)" }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-xs text-on-surface-variant text-center py-12">Sin datos aún</p>
          )}
        </div>
      </div>

      {/* ─── Tags ─── */}
      {sortedTags.length > 0 && (
        <div className="rounded-xl bg-surface-container p-5">
          <h3 className="text-sm font-semibold text-on-surface mb-3">Etiquetas frecuentes</h3>
          <div className="flex flex-wrap gap-2">
            {sortedTags.map(([tag, count]) => (
              <span key={tag} className="inline-flex items-center gap-1.5 rounded-full border border-outline-variant/30 bg-surface-container-high px-3 py-1 text-xs text-on-surface">
                {tag}
                <span className="font-semibold text-primary tabular-nums">({count})</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ─── Comments Feed ─── */}
      <div className="rounded-xl bg-surface-container p-5">
        <div className="flex items-center justify-between mb-4 border-b border-outline-variant/10 pb-3">
          <h3 className="text-sm font-semibold text-on-surface">
            Total de Comentarios ({r.totalFeedbacks || 0})
          </h3>
          {totalPages > 1 && (
            <span className="text-xs text-on-surface-variant">
              Página {currentPage} de {totalPages}
            </span>
          )}
        </div>
        
        <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
          {paginatedFeedbacks.length === 0 ? (
            <p className="text-xs text-on-surface-variant text-center py-8">Aún no hay comentarios</p>
          ) : (
            paginatedFeedbacks.map((f: any, i: number) => (
              <div key={i} className="rounded-lg bg-surface-container-high/50 p-3.5 border border-outline-variant/10 hover:border-outline-variant/30 transition-colors">
                <div className="flex items-center justify-between mb-1.5">
                  <StarRating rating={f.rating} size={14} />
                  <span className="text-[10px] text-on-surface-variant font-medium">
                    {new Date(f.created_at).toLocaleDateString("es-CO", { day: "numeric", month: "short", year: "numeric" })}
                  </span>
                </div>
                {f.tags && f.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-1.5">
                    {f.tags.map((tag: string) => (
                      <span key={tag} className="text-[10px] rounded-full bg-error/10 text-error px-2 py-0.5 font-medium">{tag}</span>
                    ))}
                  </div>
                )}
                {f.comment ? (
                  <p className="text-sm text-on-surface leading-relaxed whitespace-pre-wrap">{f.comment}</p>
                ) : (
                  <p className="text-xs text-on-surface-variant/40 italic">Sin comentario escrito</p>
                )}
              </div>
            ))
          )}
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 mt-5 pt-4 border-t border-outline-variant/10">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="flex items-center gap-1.5 rounded-lg border border-outline-variant/30 bg-surface-container px-3 py-1.5 text-xs font-semibold text-on-surface hover:bg-surface-container-high active:scale-95 disabled:opacity-40 disabled:pointer-events-none transition"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              Anterior
            </button>
            <span className="text-xs text-on-surface-variant font-medium min-w-[70px] text-center">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="flex items-center gap-1.5 rounded-lg border border-outline-variant/30 bg-surface-container px-3 py-1.5 text-xs font-semibold text-on-surface hover:bg-surface-container-high active:scale-95 disabled:opacity-40 disabled:pointer-events-none transition"
            >
              Siguiente
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
