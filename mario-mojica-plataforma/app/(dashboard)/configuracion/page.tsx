/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { Settings, User as UserIcon, Bell, Shield, Globe } from "lucide-react"
import { useAuth } from "@/lib/auth/auth-context"
import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"

export default function ConfiguracionPage() {
  const { user, refreshUser } = useAuth()
  const supabase = createClient()
  
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    nombre: "",
    apellido: "",
    email: "",
    empresa: ""
  })
  const [message, setMessage] = useState({ text: "", type: "" })

  useEffect(() => {
    if (user) {
      const parts = user.name.split(" ")
      const nombre = parts[0] || ""
      const apellido = parts.slice(1).join(" ") || ""
      
      setFormData({
        nombre,
        apellido,
        email: user.email || "",
        empresa: user.company || ""
      })
    }
  }, [user])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setLoading(true)
    setMessage({ text: "", type: "" })

    try {
      const fullName = `${formData.nombre} ${formData.apellido}`.trim()
      
      const { error } = await supabase
        .from('profiles')
        .upsert({ 
          id: user.id,
          full_name: fullName,
          company: formData.empresa
        })

      if (error) throw error

      const { error: authError } = await supabase.auth.updateUser({
        data: { 
          full_name: fullName,
          company: formData.empresa
        }
      })

      if (authError) throw authError

      await refreshUser()
      setMessage({ text: "Perfil actualizado correctamente", type: "success" })
      
      setTimeout(() => {
        setMessage({ text: "", type: "" })
      }, 3000)
    } catch (err: any) {
      console.error(err)
      setMessage({ text: err.message || "Error al actualizar el perfil", type: "error" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto w-full max-w-screen-2xl p-6 lg:p-10">
      <div className="flex flex-col gap-8">
        {/* Header Section */}
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight text-on-surface">Configuración</h1>
          <p className="text-on-surface-variant">
            Administra tu información personal, preferencias y seguridad de la cuenta.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
          {/* Settings navigation */}
          <div className="flex flex-col gap-1 rounded-2xl bg-surface-container-low p-2 lg:col-span-1 h-fit">
            {[
              { icon: UserIcon, label: "Perfil", active: true },
              { icon: Bell, label: "Notificaciones", active: false },
              { icon: Shield, label: "Seguridad", active: false },
              { icon: Globe, label: "Idioma y región", active: false },
              { icon: Settings, label: "Avanzado", active: false },
            ].map((item) => {
              const Icon = item.icon
              return (
                <button
                  key={item.label}
                  className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all ${
                    item.active
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </button>
              )
            })}
          </div>

          {/* Settings form container */}
          <div className="lg:col-span-3">
            <div className="rounded-2xl border border-outline-variant/10 bg-surface-container-low p-6 lg:p-8 shadow-sm">
              <div className="mb-8 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-on-surface">Información Personal</h2>
                  <p className="text-xs text-on-surface-variant">Actualiza tus datos de contacto y empresa.</p>
                </div>
                {user?.credits !== undefined && (
                  <div className="flex items-center gap-2 rounded-full bg-primary/5 px-3 py-1 ring-1 ring-inset ring-primary/10">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-primary/70">Créditos Disp.</span>
                    <span className="text-sm font-bold text-primary">{user.credits.toLocaleString()}</span>
                  </div>
                )}
              </div>
              
              {message.text && (
                <div className={`mb-6 flex items-center gap-2 p-4 rounded-xl text-sm animate-in fade-in slide-in-from-top-2 ${
                  message.type === 'success' 
                    ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' 
                    : 'bg-red-500/10 text-red-500 border border-red-500/20'
                }`}>
                  <div className={`h-2 w-2 rounded-full ${message.type === 'success' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                  {message.text}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant/70 px-1">Nombre</label>
                    <input
                      type="text"
                      name="nombre"
                      value={formData.nombre}
                      onChange={handleChange}
                      disabled={loading}
                      placeholder="Ej. Zanfairo"
                      className="h-12 w-full rounded-xl bg-surface-container px-4 text-sm text-on-surface outline-none ring-1 ring-outline-variant/30 transition-all focus:ring-2 focus:ring-primary disabled:opacity-50"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant/70 px-1">Apellido</label>
                    <input
                      type="text"
                      name="apellido"
                      value={formData.apellido}
                      onChange={handleChange}
                      disabled={loading}
                      placeholder="Ej. Bernate"
                      className="h-12 w-full rounded-xl bg-surface-container px-4 text-sm text-on-surface outline-none ring-1 ring-outline-variant/30 transition-all focus:ring-2 focus:ring-primary disabled:opacity-50"
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant/70 px-1">Email</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      disabled={true}
                      className="h-12 w-full rounded-xl bg-surface-container px-4 text-sm text-on-surface-variant outline-none ring-1 ring-outline-variant/20 disabled:opacity-60 cursor-not-allowed"
                      title="El email no se puede modificar desde aquí"
                    />
                    <p className="px-1 text-[10px] text-on-surface-variant">El email está vinculado a tu cuenta y no puede cambiarse.</p>
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant/70 px-1">Empresa</label>
                    <input
                      type="text"
                      name="empresa"
                      value={formData.empresa}
                      onChange={handleChange}
                      disabled={loading}
                      placeholder="Ej. Jamar"
                      className="h-12 w-full rounded-xl bg-surface-container px-4 text-sm text-on-surface outline-none ring-1 ring-outline-variant/30 transition-all focus:ring-2 focus:ring-primary disabled:opacity-50"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4">
                  <p className="text-[11px] text-on-surface-variant max-w-[200px]">
                    Al guardar, los cambios se reflejarán en toda la plataforma inmediatamente.
                  </p>
                  <button 
                    type="submit"
                    disabled={loading || !user}
                    className="flex h-12 items-center justify-center rounded-xl bg-primary px-8 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:scale-100"
                  >
                    {loading ? "Guardando..." : "Guardar Cambios"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

