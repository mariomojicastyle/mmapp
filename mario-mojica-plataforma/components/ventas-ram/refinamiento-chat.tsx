"use client"

import React, { useState } from "react"
import { Send, Sparkles, Loader2, Lightbulb } from "lucide-react"

interface RefinamientoChatProps {
  onRefinar: (instruccion: string) => Promise<void>
  loading: boolean
}

export function RefinamientoChat({ onRefinar, loading }: RefinamientoChatProps) {
  const [instruccion, setInstruccion] = useState("")

  const sugerenciasRapidas = [
    "Hacer más corto y directo",
    "Enfocar en agendar reunión de 30 min",
    "Recordar que estive na Movelsul 2014",
    "Destacar economia de 30% e US$ 1/mês",
    "Pedir apenas o PDF de até 24 peças",
  ]

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!instruccion.trim() || loading) return
    onRefinar(instruccion.trim())
    setInstruccion("")
  }

  const handleQuickClick = (sug: string) => {
    if (loading) return
    onRefinar(sug)
  }

  return (
    <div className="space-y-2.5 rounded-2xl bg-surface-container-high/60 border border-outline-variant/25 p-3.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-on-surface flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          <span>Refinar Respuesta con Copiloto IA</span>
        </span>
        <span className="text-[10px] text-on-surface-variant">
          Escribe tu sugerencia o selecciona una opción rápida
        </span>
      </div>

      {/* Sugerencias Rápidas */}
      <div className="flex flex-wrap gap-1.5">
        {sugerenciasRapidas.map((sug) => (
          <button
            key={sug}
            type="button"
            disabled={loading}
            onClick={() => handleQuickClick(sug)}
            className="text-[10px] font-medium px-2.5 py-1 rounded-lg bg-surface-container border border-outline-variant/20 text-on-surface hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer disabled:opacity-50"
          >
            ⚡ {sug}
          </button>
        ))}
      </div>

      {/* Formulario de Input */}
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <input
          type="text"
          value={instruccion}
          disabled={loading}
          onChange={(e) => setInstruccion(e.target.value)}
          placeholder="Ej: 'Quítale la palabra X y dile que el valor es $1 USD/mes'..."
          className="flex-1 px-3 py-2 text-xs rounded-xl bg-surface-container border border-outline-variant/30 text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:border-primary disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!instruccion.trim() || loading}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary text-xs font-semibold text-primary-foreground hover:opacity-90 transition-opacity shadow-sm cursor-pointer disabled:opacity-50 shrink-0"
        >
          {loading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Send className="h-3.5 w-3.5" />
          )}
          <span>Ajustar</span>
        </button>
      </form>
    </div>
  )
}
