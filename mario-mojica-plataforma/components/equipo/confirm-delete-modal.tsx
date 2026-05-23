 
/* eslint-disable @typescript-eslint/no-explicit-any */
 
 
 
import React, { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, AlertTriangle, Loader2 } from "lucide-react"

interface ConfirmDeleteModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => Promise<void>
  title: string
  description: string
}

export function ConfirmDeleteModal({ isOpen, onClose, onConfirm, title, description }: ConfirmDeleteModalProps) {
  const [confirmText, setConfirmText] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleConfirm = async () => {
    if (confirmText.toLowerCase() !== "eliminar") return

    setLoading(true)
    setError(null)
    
    try {
      await onConfirm()
      // Si onConfirm lanza error, lo atrapamos
      // Si termina bien, limpiamos y cerramos
      setConfirmText("")
      onClose()
    } catch (err: any) {
      setError(err.message || "Ocurrió un error al intentar eliminar.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-surface-container-highest/80 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-md overflow-hidden rounded-2xl bg-surface-container shadow-2xl border border-outline-variant/30"
          >
            <div className="flex items-center justify-between border-b border-outline-variant/20 px-6 py-4">
              <div className="flex items-center gap-3 text-error">
                <AlertTriangle className="h-5 w-5" />
                <h2 className="text-lg font-bold">{title}</h2>
              </div>
              <button
                onClick={onClose}
                disabled={loading}
                className="rounded-full p-2 text-on-surface-variant hover:bg-surface-container-high transition-colors disabled:opacity-50"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-6">
              <p className="text-sm text-on-surface-variant mb-6">
                {description}
              </p>

              {error && (
                <div className="mb-4 rounded-lg bg-error/10 p-3 text-sm text-error">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium text-on-surface">
                  Escribe <span className="font-bold text-error">eliminar</span> para confirmar
                </label>
                <input
                  type="text"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder="eliminar"
                  disabled={loading}
                  className="w-full rounded-lg border border-outline-variant bg-surface-container-low px-4 py-2.5 text-sm text-on-surface outline-none transition-colors focus:border-error focus:ring-1 focus:ring-error disabled:opacity-50"
                />
              </div>

              <div className="mt-8 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={loading}
                  className="rounded-lg px-4 py-2 text-sm font-semibold text-on-surface-variant hover:bg-surface-container-high disabled:opacity-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirm}
                  disabled={confirmText.toLowerCase() !== "eliminar" || loading}
                  className="flex items-center gap-2 rounded-lg bg-error px-4 py-2 text-sm font-semibold text-error-foreground hover:opacity-90 disabled:opacity-50 transition-opacity"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Eliminando...
                    </>
                  ) : (
                    "Eliminar definitivamente"
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

