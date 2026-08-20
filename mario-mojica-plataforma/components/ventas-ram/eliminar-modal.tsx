"use client"

import React, { useState } from "react"
import { Trash2, AlertTriangle, X, Loader2 } from "lucide-react"
import { VentasProspecto } from "@/lib/types/ventas-ram"

interface EliminarModalProps {
  isOpen: boolean
  prospecto: VentasProspecto | null
  onClose: () => void
  onConfirm: (id: string) => Promise<void>
}

export function EliminarModal({
  isOpen,
  prospecto,
  onClose,
  onConfirm,
}: EliminarModalProps) {
  const [deleting, setDeleting] = useState(false)

  if (!isOpen || !prospecto) return null

  const handleConfirm = async () => {
    setDeleting(true)
    try {
      await onConfirm(prospecto.id)
      onClose()
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-md rounded-2xl bg-surface-container border border-rose-500/30 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 border-b border-outline-variant/20 flex items-start justify-between bg-rose-500/10">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-rose-500/20 text-rose-500 flex items-center justify-center shrink-0">
              <Trash2 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-on-surface flex items-center gap-1.5">
                <span>¿Eliminar Prospecto?</span>
              </h3>
              <p className="text-[11px] text-rose-500 font-semibold">
                Acción permanente en la base de datos
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={deleting}
            className="p-1 rounded-lg text-on-surface-variant hover:bg-surface-container-highest transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Contenido */}
        <div className="p-5 space-y-3">
          <p className="text-xs text-on-surface leading-relaxed">
            Estás a punto de eliminar definitivamente a:
          </p>

          <div className="p-3 rounded-xl bg-surface-container-high border border-outline-variant/30 space-y-1">
            <p className="text-xs font-bold text-on-surface">
              {prospecto.contacto_nombre}
            </p>
            <p className="text-[11px] text-on-surface-variant">
              {prospecto.empresa} {prospecto.pais ? `(${prospecto.pais})` : ""}
            </p>
            {prospecto.contacto_cargo && (
              <p className="text-[10px] text-on-surface-variant/80">
                {prospecto.contacto_cargo}
              </p>
            )}
          </div>

          <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 text-[11px] text-amber-700 dark:text-amber-300">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-amber-500" />
            <p>
              Se borrarán todos sus datos, notas estratégicas y el historial de conversaciones registradas. Esta acción no se puede deshacer.
            </p>
          </div>
        </div>

        {/* Acciones */}
        <div className="p-4 border-t border-outline-variant/20 flex items-center justify-end gap-2 bg-surface-container-high/30">
          <button
            type="button"
            onClick={onClose}
            disabled={deleting}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold text-on-surface hover:bg-surface-container-highest transition-colors cursor-pointer"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            disabled={deleting}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-xs font-bold text-white transition-colors shadow-sm cursor-pointer disabled:opacity-50"
          >
            {deleting ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Eliminando...</span>
              </>
            ) : (
              <>
                <Trash2 className="h-3.5 w-3.5" />
                <span>Sí, Eliminar Definitivamente</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
