"use client"

import React, { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Mail, User, Briefcase, Shield, Loader2, CheckCircle2, Key, Eye, EyeOff } from "lucide-react"
import { invitarMiembro } from "@/app/actions/equipo"
import { usePermissions } from "@/hooks/use-permissions"

interface InvitarMiembroModalProps {
  isOpen: boolean
  onClose: () => void
  type?: "equipo" | "cliente"
}

export function InvitarMiembroModal({ isOpen, onClose, type = "equipo" }: InvitarMiembroModalProps) {
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [successMode, setSuccessMode] = useState<"invited" | "created">("invited")
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const { isSuperAdmin, isCoequipero, user } = usePermissions()
  const isInternalTeam = isSuperAdmin || isCoequipero
  const modalTitle = type === "equipo" ? "Invitar Colaborador" : (isInternalTeam ? "Invitar Cliente" : "Invitar Colaborador")
  const modalDesc = type === "equipo" ? "colaborador" : (isInternalTeam ? "cliente" : "colaborador")

  const [formData, setFormData] = useState({
    nombre: "",
    correo: "",
    rol: type === "equipo" ? "coequipero" : "designer",
    cargo: "",
    empresa: (!isInternalTeam && user?.company) ? user.company : "",
    password: ""
  })

  useEffect(() => {
    if (isOpen) {
      setFormData({
        nombre: "",
        correo: "",
        rol: type === "equipo" ? "coequipero" : "designer",
        cargo: "",
        empresa: (!isInternalTeam && user?.company) ? user.company : "",
        password: ""
      })
      setError(null)
      setSuccess(false)
    }
  }, [isOpen, type])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const result = await invitarMiembro(formData)
      
      if (result.error) {
        setError(result.error)
      } else if (result.success) {
        setSuccessMode((result.mode as "created" | "invited") || "invited")
        setSuccess(true)
        setTimeout(() => {
          onClose()
          setSuccess(false)
          setFormData({ nombre: "", correo: "", rol: "designer", cargo: "", empresa: "", password: "" })
        }, 3000)
      }
    } catch (error) {
      console.error(error)
      setError("Ocurrió un error inesperado al procesar la solicitud.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={!loading ? onClose : undefined}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-3xl border border-outline-variant bg-surface-container-lowest shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-outline-variant px-6 py-4">
              <h2 className="text-lg font-bold text-on-surface">
                {modalTitle}
              </h2>
              <button
                onClick={onClose}
                disabled={loading}
                className="rounded-full p-2 text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface disabled:opacity-50"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              {success ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <div className="mb-4 rounded-full bg-emerald-500/10 p-3 text-emerald-500">
                    <CheckCircle2 className="h-12 w-12" />
                  </div>
                  <h3 className="text-xl font-bold text-on-surface">
                    {successMode === "created" ? "¡Usuario Creado!" : "¡Invitación Enviada!"}
                  </h3>
                  <p className="mt-2 text-sm text-on-surface-variant">
                    {successMode === "created" ? (
                      <>Se ha creado la cuenta para <span className="font-semibold text-on-surface">{formData.correo}</span>. Ya puede iniciar sesión con la contraseña asignada.</>
                    ) : (
                      <>Se ha enviado un correo a <span className="font-semibold text-on-surface">{formData.correo}</span> con las instrucciones para unirse.</>
                    )}
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="flex flex-col gap-5" autoComplete="off">
                  <p className="text-sm text-on-surface-variant">
                    Ingresa los datos del nuevo {modalDesc}. Recibirá un correo electrónico con acceso inmediato.
                  </p>

                  {error && (
                    <div className="rounded-xl bg-red-500/10 p-4 text-sm text-red-500">
                      <p className="font-bold">Error al enviar invitación:</p>
                      <p className="mt-1">{error}</p>
                    </div>
                  )}

                  {/* Nombre Completo */}
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                      Usuario
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-on-surface-variant" />
                      <input
                        type="text"
                        required
                        value={formData.nombre}
                        onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                        placeholder="Ej. Carlos Ruiz"
                        autoComplete="off"
                        className="w-full rounded-xl border border-outline-variant bg-surface-container-low py-2.5 pl-10 pr-4 text-sm text-on-surface outline-none transition-all focus:border-primary focus:ring-1 focus:ring-primary"
                      />
                    </div>
                  </div>

                  {/* Correo Electrónico */}
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                      Correo Electrónico
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-on-surface-variant" />
                      <input
                        type="email"
                        required
                        value={formData.correo}
                        onChange={(e) => setFormData({ ...formData, correo: e.target.value })}
                        placeholder="carlos@mariomojica.com"
                        autoComplete="off"
                        className="w-full rounded-xl border border-outline-variant bg-surface-container-low py-2.5 pl-10 pr-4 text-sm text-on-surface outline-none transition-all focus:border-primary focus:ring-1 focus:ring-primary"
                      />
                    </div>
                  </div>

                  {/* Rol */}
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                      Rol en Plataforma
                    </label>
                    <div className="relative">
                      <Shield className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-on-surface-variant" />
                      <select
                        value={formData.rol}
                        onChange={(e) => setFormData({ ...formData, rol: e.target.value })}
                        className="w-full appearance-none rounded-xl border border-outline-variant bg-surface-container-low py-2.5 pl-10 pr-4 text-sm text-on-surface outline-none transition-all focus:border-primary focus:ring-1 focus:ring-primary"
                      >
                        {type === "equipo" ? (
                          <>
                            <option value="superadmin">SuperAdmin (Acceso total)</option>
                            <option value="coequipero">Coequipero (Equipo interno / Atiende solicitudes)</option>
                          </>
                        ) : (
                          <>
                            <option value="admin">Administrador Cliente (Gestor del lado del cliente)</option>
                            <option value="designer">Diseñador (Colaborador del cliente)</option>
                            <option value="viewer">Visualizador (Solo lectura)</option>
                          </>
                        )}
                      </select>
                    </div>
                  </div>

                  {/* Especialidad / Cargo */}
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                      Especialidad / Cargo
                    </label>
                    <div className="relative">
                      <Briefcase className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-on-surface-variant" />
                      <input
                        type="text"
                        required
                        value={formData.cargo}
                        onChange={(e) => setFormData({ ...formData, cargo: e.target.value })}
                        placeholder="Ej. Desarrollador 3D"
                        autoComplete="off"
                        className="w-full rounded-xl border border-outline-variant bg-surface-container-low py-2.5 pl-10 pr-4 text-sm text-on-surface outline-none transition-all focus:border-primary focus:ring-1 focus:ring-primary"
                      />
                    </div>
                  </div>
                  {/* Empresa */}
                  {isInternalTeam && (
                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                        Empresa
                      </label>
                      <div className="relative">
                        <Briefcase className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-on-surface-variant" />
                        <input
                          type="text"
                          name="empresa_fake_name_to_avoid_autofill"
                          value={formData.empresa}
                          onChange={(e) => setFormData({ ...formData, empresa: e.target.value })}
                          placeholder="Ej. Jamar, MM Team, etc."
                          autoComplete="new-password"
                          className="w-full rounded-xl border border-outline-variant bg-surface-container-low py-2.5 pl-10 pr-4 text-sm text-on-surface outline-none transition-all focus:border-primary focus:ring-1 focus:ring-primary"
                        />
                      </div>
                    </div>
                  )}

                  {/* Anti-autofill trap for Chrome */}
                  <input type="text" name="chrome_fake_user" style={{ display: 'none' }} tabIndex={-1} autoComplete="off" />
                  <input type="password" name="chrome_fake_pass" style={{ display: 'none' }} tabIndex={-1} autoComplete="off" />

                  {/* Contraseña (Opcional) */}
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                        Contraseña (Opcional)
                      </label>
                      <span className="text-[10px] text-on-surface-variant/60 italic">Si se deja vacío, se envía invitación por mail</span>
                    </div>
                    <div className="relative">
                      <Key className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-on-surface-variant" />
                      <input
                        type={showPassword ? "text" : "password"}
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        placeholder="Contraseña temporal"
                        autoComplete="new-password"
                        className="w-full rounded-xl border border-outline-variant bg-surface-container-low py-2.5 pl-10 pr-12 text-sm text-on-surface outline-none transition-all focus:border-primary focus:ring-1 focus:ring-primary"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Footer / Submit */}
                  <div className="mt-4 flex gap-3">
                    <button
                      type="button"
                      onClick={onClose}
                      disabled={loading}
                      className="flex-1 rounded-xl border border-outline-variant bg-transparent py-2.5 text-sm font-semibold text-on-surface transition-colors hover:bg-surface-container disabled:opacity-50"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Enviando...
                        </>
                      ) : (
                        "Enviar Invitación"
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
