"use client"

import React, { useState } from "react"
import { KeyRound, Check, Loader2, X, ShieldCheck } from "lucide-react"
import { saveMarketingCuenta } from "@/app/actions/marketing"

interface ConfigTokensModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function ConfigTokensModal({ isOpen, onClose, onSuccess }: ConfigTokensModalProps) {
  const [plataforma, setPlataforma] = useState<"facebook" | "instagram" | "linkedin">("facebook")
  const [cuentaId, setCuentaId] = useState("61592115433726")
  const [nombreCuenta, setNombreCuenta] = useState("Mario Mojica - Smart Assembly 3D")
  const [token, setToken] = useState("")
  const [loading, setLoading] = useState(false)
  const [mensaje, setMensaje] = useState<{ tipo: "exito" | "error"; texto: string } | null>(null)

  if (!isOpen) return null

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token.trim()) {
      setMensaje({ tipo: "error", texto: "Por favor ingresa el Token de Acceso" })
      return
    }

    setLoading(true)
    setMensaje(null)

    const res = await saveMarketingCuenta({
      plataforma,
      cuenta_id_externo: cuentaId.trim() || "61592115433726",
      nombre_cuenta: nombreCuenta.trim() || "Mario Mojica - Smart Assembly 3D",
      access_token: token.trim(),
      expires_at: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(), // 60 días
    })

    setLoading(false)

    if (res.error) {
      setMensaje({ tipo: "error", texto: res.error })
    } else {
      setMensaje({ tipo: "exito", texto: "¡Token de Página guardado exitosamente en Supabase!" })
      setTimeout(() => {
        onSuccess()
        onClose()
      }, 1200)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-2xl bg-surface border border-outline-variant/30 p-6 shadow-2xl space-y-5">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-outline-variant/20 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <KeyRound className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-on-surface">Gestión Directa de Tokens API</h2>
              <p className="text-xs text-on-surface-variant">Conecta Tokens de Página de Meta o LinkedIn de Larga Duración</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-on-surface-variant hover:bg-surface-container-high transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Mensajes de feedback */}
        {mensaje && (
          <div
            className={`p-3.5 rounded-xl text-xs flex items-center gap-2.5 font-medium border ${
              mensaje.tipo === "exito"
                ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400"
                : "bg-rose-500/15 border-rose-500/30 text-rose-400"
            }`}
          >
            {mensaje.tipo === "exito" ? <ShieldCheck className="h-4 w-4 shrink-0" /> : <X className="h-4 w-4 shrink-0" />}
            {mensaje.texto}
          </div>
        )}

        {/* Formulario */}
        <form onSubmit={handleSave} className="space-y-4 text-xs">
          
          <div>
            <label className="block font-semibold text-on-surface mb-1.5">Red Social / Plataforma</label>
            <select
              value={plataforma}
              onChange={(e) => {
                const val = e.target.value as any
                setPlataforma(val)
                if (val === "facebook" || val === "instagram") {
                  setCuentaId("61592115433726")
                  setNombreCuenta("Mario Mojica - Smart Assembly 3D")
                }
              }}
              className="w-full rounded-xl border border-outline-variant/40 bg-surface-container-high px-3 py-2.5 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="facebook">Meta Facebook Page (Página Oficial)</option>
              <option value="instagram">Instagram Business Account</option>
              <option value="linkedin">LinkedIn Profile / Company</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-on-surface mb-1.5">ID de la Página / Cuenta Externa</label>
            <input
              type="text"
              value={cuentaId}
              onChange={(e) => setCuentaId(e.target.value)}
              placeholder="Ej: 61592115433726"
              className="w-full rounded-xl border border-outline-variant/40 bg-surface-container-high px-3 py-2.5 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          <div>
            <label className="block font-semibold text-on-surface mb-1.5">Nombre de la Cuenta / Página</label>
            <input
              type="text"
              value={nombreCuenta}
              onChange={(e) => setNombreCuenta(e.target.value)}
              placeholder="Ej: Mario Mojica - Smart Assembly 3D"
              className="w-full rounded-xl border border-outline-variant/40 bg-surface-container-high px-3 py-2.5 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          <div>
            <label className="block font-semibold text-on-surface mb-1.5">Token de Acceso (Page Access Token)</label>
            <textarea
              rows={4}
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Pega aquí el Token de Acceso que empieza por EAA..."
              className="w-full rounded-xl border border-outline-variant/40 bg-surface-container-high px-3 py-2.5 text-on-surface font-mono text-[11px] focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          {/* Footer */}
          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-outline-variant/40 text-on-surface hover:bg-surface-container-high transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity shadow disabled:opacity-50"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              Guardar Token en Supabase
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
