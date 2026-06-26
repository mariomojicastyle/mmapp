/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { Settings, User as UserIcon, Bell, Shield, Globe, Camera, Upload, Smile, X, RefreshCw, ChevronLeft, ChevronRight, Mail } from "lucide-react"
import { useAuth } from "@/lib/auth/auth-context"
import { usePermissions } from "@/hooks/use-permissions"
import { useState, useEffect, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import { motion, AnimatePresence } from "framer-motion"

const ILUSTRACIONES = [
  // 10 Masculinos Divertidos y Coloridos
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Jack&backgroundColor=b6e3f4&mouth=smile&eyebrows=default&eyes=default",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Oliver&backgroundColor=c0aede&mouth=smile&eyebrows=default&eyes=default",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=George&backgroundColor=d1d4f9&mouth=smile&eyebrows=default&eyes=default",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Milo&backgroundColor=ffd5dc&mouth=smile&eyebrows=default&eyes=default",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Harry&backgroundColor=ffdfbf&mouth=smile&eyebrows=default&eyes=default",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Leo&backgroundColor=c0f2e3&mouth=smile&eyebrows=default&eyes=default",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Charlie&backgroundColor=fce8b2&mouth=smile&eyebrows=default&eyes=default",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Arthur&backgroundColor=b6e3f4&mouth=smile&eyebrows=default&eyes=default",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Thomas&backgroundColor=c0aede&mouth=smile&eyebrows=default&eyes=default",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Oscar&backgroundColor=d1d4f9&mouth=smile&eyebrows=default&eyes=default",
  // 10 Femeninos Divertidos y Coloridos
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Emma&backgroundColor=ffd5dc&mouth=smile&eyebrows=default&eyes=default",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Sophia&backgroundColor=ffdfbf&mouth=smile&eyebrows=default&eyes=default",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Lily&backgroundColor=c0f2e3&mouth=smile&eyebrows=default&eyes=default",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Zoe&backgroundColor=fce8b2&mouth=smile&eyebrows=default&eyes=default",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka&backgroundColor=b6e3f4&mouth=smile&eyebrows=default&eyes=default",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Chloe&backgroundColor=c0aede&mouth=smile&eyebrows=default&eyes=default",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Mia&backgroundColor=d1d4f9&mouth=smile&eyebrows=default&eyes=default",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Grace&backgroundColor=ffd5dc&mouth=smile&eyebrows=default&eyes=default",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Ruby&backgroundColor=ffdfbf&mouth=smile&eyebrows=default&eyes=default",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Maya&backgroundColor=c0f2e3&mouth=smile&eyebrows=default&eyes=default",
]

const ILUSTRACIONES_RANDOM = [
  "https://api.dicebear.com/7.x/shapes/svg?seed=1&backgroundColor=b6e3f4",
  "https://api.dicebear.com/7.x/icons/svg?seed=2&backgroundColor=c0aede",
  "https://api.dicebear.com/7.x/shapes/svg?seed=3&backgroundColor=d1d4f9",
  "https://api.dicebear.com/7.x/icons/svg?seed=4&backgroundColor=ffd5dc",
  "https://api.dicebear.com/7.x/shapes/svg?seed=5&backgroundColor=ffdfbf",
  "https://api.dicebear.com/7.x/icons/svg?seed=6&backgroundColor=c0f2e3",
  "https://api.dicebear.com/7.x/shapes/svg?seed=7&backgroundColor=fce8b2",
  "https://api.dicebear.com/7.x/icons/svg?seed=8&backgroundColor=b6e3f4",
  "https://api.dicebear.com/7.x/shapes/svg?seed=9&backgroundColor=c0aede",
  "https://api.dicebear.com/7.x/icons/svg?seed=10&backgroundColor=d1d4f9",
  "https://api.dicebear.com/7.x/shapes/svg?seed=11&backgroundColor=ffd5dc",
  "https://api.dicebear.com/7.x/icons/svg?seed=12&backgroundColor=ffdfbf",
  "https://api.dicebear.com/7.x/shapes/svg?seed=13&backgroundColor=c0f2e3",
  "https://api.dicebear.com/7.x/icons/svg?seed=14&backgroundColor=fce8b2",
  "https://api.dicebear.com/7.x/shapes/svg?seed=15&backgroundColor=b6e3f4",
  "https://api.dicebear.com/7.x/icons/svg?seed=16&backgroundColor=c0aede",
  "https://api.dicebear.com/7.x/shapes/svg?seed=17&backgroundColor=d1d4f9",
  "https://api.dicebear.com/7.x/icons/svg?seed=18&backgroundColor=ffd5dc",
  "https://api.dicebear.com/7.x/shapes/svg?seed=19&backgroundColor=ffdfbf",
  "https://api.dicebear.com/7.x/icons/svg?seed=20&backgroundColor=c0f2e3"
]

export default function ConfiguracionPage() {
  const { user, refreshUser } = useAuth()
  const { isSuperAdmin } = usePermissions()
  const supabase = createClient()
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const carouselRef = useRef<HTMLDivElement>(null)
  const randomCarouselRef = useRef<HTMLDivElement>(null)
  
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    nombre: "",
    apellido: "",
    email: "",
    empresa: "",
    cargo: ""
  })
  
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [message, setMessage] = useState({ text: "", type: "" })
  const [activeTab, setActiveTab] = useState<"Perfil" | "Firma">("Perfil")
  const [copiedSignature, setCopiedSignature] = useState(false)

  const userFullName = user?.name || `${formData.nombre} ${formData.apellido}`.trim() || "Mario Mojica"
  const userEmail = user?.email || formData.email || "direccion@mariomojica.com"
  const userCargo = user?.job_title || formData.cargo || "Architect of Industry 4.0"

  const dynamicSignatureHtml = `
    <table cellpadding="0" cellspacing="0" border="0" style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, Arial, sans-serif; background-color: transparent; border-collapse: collapse; text-align: left;">
      <tr>
        <td valign="middle" style="padding-right: 20px; border-right: 2px solid #0088aa; text-align: left;">
          <a href="https://mariomojica.com" target="_blank" style="text-decoration: none;">
            <img src="https://mariomojica.com/Logo_Signature_v3.png" alt="Mario Mojica" width="110" style="border: 0; display: block; width: 110px; height: auto;" />
          </a>
        </td>
        <td valign="middle" style="padding-left: 20px; text-align: left;">
          <div style="font-size: 16px; font-weight: 700; color: #111827; margin: 0; line-height: 20px; letter-spacing: -0.01em; text-align: left;">
            ${userFullName}
          </div>
          <div style="font-size: 11px; font-weight: 600; color: #0088aa; text-transform: uppercase; margin: 2px 0 8px 0; line-height: 14px; letter-spacing: 0.05em; text-align: left;">
            ${userCargo}
          </div>
          <table cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse; text-align: left;">
            <tr>
              <td style="font-size: 13px; color: #4b5563; padding: 2px 0; line-height: 16px; vertical-align: middle; text-align: left;">
                <img src="https://mariomojica.com/globe_icon.png" width="13" height="13" alt="Web" style="border: 0; display: inline-block; vertical-align: middle; margin-right: 6px;" /> <a href="https://mariomojica.com" target="_blank" style="color: #0088aa; text-decoration: none; font-weight: 500; vertical-align: middle;">mariomojica.com</a>
              </td>
            </tr>
            <tr>
              <td style="font-size: 13px; color: #4b5563; padding: 2px 0; line-height: 16px; vertical-align: middle; text-align: left;">
                <img src="https://mariomojica.com/envelope_icon.png" width="13" height="13" alt="Email" style="border: 0; display: inline-block; vertical-align: middle; margin-right: 6px;" /> <a href="mailto:${userEmail}" style="color: #4b5563; text-decoration: none; vertical-align: middle;">${userEmail}</a>
              </td>
            </tr>
          </table>
          <div style="margin-top: 10px; font-size: 11px; color: #9ca3af; font-style: italic; line-height: 14px; text-align: left;">
            Interactive 3D instructions for RTA furniture manufacturers.
          </div>
        </td>
      </tr>
    </table>
  `;

  const handleCopySignature = async () => {
    try {
      const blob = new Blob([dynamicSignatureHtml], { type: "text/html" });
      const data = [new ClipboardItem({ "text/html": blob })];
      await navigator.clipboard.write(data);
      setCopiedSignature(true);
      setTimeout(() => setCopiedSignature(false), 3000);
    } catch (err) {
      console.error("Error al copiar la firma:", err);
      alert("Hubo un error al copiar automáticamente. Por favor, selecciona la firma visualmente con el mouse y cópiala manualmente con Ctrl+C.");
    }
  };
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<"selection" | "camera" | "crop">("selection")
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null)
  const [cameraError, setCameraError] = useState<string | null>(null)

  // Crop & rotate states
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [rotation, setRotation] = useState<number>(0)
  const [scale, setScale] = useState<number>(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (user) {
      const parts = user.name.split(" ")
      const nombre = parts[0] || ""
      const apellido = parts.slice(1).join(" ") || ""
      
      setFormData({
        nombre,
        apellido,
        email: user.email || "",
        empresa: user.company || "",
        cargo: user.job_title || ""
      })
      setAvatarUrl(user.avatar || null)
    }
  }, [user])

  const startCamera = async () => {
    setModalMode("camera")
    setCameraError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 400, height: 400, facingMode: "user" }
      })
      setCameraStream(stream)
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream
        }
      }, 100)
    } catch (err: any) {
      console.error(err)
      setCameraError("No se pudo acceder a la cámara. Asegúrate de otorgar los permisos necesarios.")
    }
  }

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop())
      setCameraStream(null)
    }
    setModalMode("selection")
  }

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement("canvas")
      canvas.width = 400
      canvas.height = 400
      const ctx = canvas.getContext("2d")
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, 400, 400)
        const base64 = canvas.toDataURL("image/jpeg", 0.9)
        setSelectedImage(base64)
        setRotation(0)
        setScale(1)
        setOffset({ x: 0, y: 0 })
        
        if (cameraStream) {
          cameraStream.getTracks().forEach(track => track.stop())
          setCameraStream(null)
        }
        
        setModalMode("crop")
      }
    }
  }

  const closeModal = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop())
      setCameraStream(null)
    }
    setIsModalOpen(false)
    setModalMode("selection")
    setSelectedImage(null)
    setRotation(0)
    setScale(1)
    setOffset({ x: 0, y: 0 })
  }

  const selectIlustracion = (url: string) => {
    setAvatarUrl(url)
    closeModal()
  }

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      setSelectedImage(event.target?.result as string)
      setRotation(0)
      setScale(1)
      setOffset({ x: 0, y: 0 })
      setModalMode("crop")
    }
    reader.readAsDataURL(file)
  }

  // Pointer drag event handlers for avatar pan
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(true)
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y })
  }

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return
    const newX = e.clientX - dragStart.x
    const newY = e.clientY - dragStart.y
    setOffset({ x: newX, y: newY })
  }

  const handlePointerUp = () => {
    setIsDragging(false)
  }

  const applyCropAndRotate = () => {
    if (!selectedImage) return

    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement("canvas")
      canvas.width = 150
      canvas.height = 150
      const ctx = canvas.getContext("2d")
      
      if (ctx) {
        ctx.fillStyle = "#0e1118"
        ctx.fillRect(0, 0, 150, 150)
        
        // Conversión entre visor de 192px y el canvas de 150px
        const factor = 150 / 192
        
        ctx.translate(75 + offset.x * factor, 75 + offset.y * factor)
        ctx.rotate((rotation * Math.PI) / 180)
        ctx.scale(scale, scale)
        
        ctx.drawImage(img, -75, -75, 150, 150)
        
        const base64 = canvas.toDataURL("image/jpeg", 0.8)
        setAvatarUrl(base64)
        closeModal()
      }
    }
    img.src = selectedImage
  }

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
          company: formData.empresa,
          job_title: formData.cargo,
          avatar_url: avatarUrl
        })

      if (error) throw error

      const { error: authError } = await supabase.auth.updateUser({
        data: { 
          full_name: fullName,
          company: formData.empresa,
          job_title: formData.cargo,
          avatar_url: avatarUrl
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
              { id: "Perfil" as const, icon: UserIcon, label: "Perfil", disabled: false },
              { id: "Notificaciones" as const, icon: Bell, label: "Notificaciones", disabled: true },
              { id: "Seguridad" as const, icon: Shield, label: "Seguridad", disabled: true },
              { id: "Idioma" as const, icon: Globe, label: "Idioma y región", disabled: true },
              ...((user?.email?.endsWith('@mariomojica.com') || isSuperAdmin)
                ? [{ id: "Firma" as const, icon: Mail, label: "Firma de Correo", disabled: false }]
                : []),
              { id: "Avanzado" as const, icon: Settings, label: "Avanzado", disabled: true },
            ].map((item) => {
              const Icon = item.icon
              const isActive = activeTab === item.id
              return (
                <button
                  key={item.label}
                  disabled={item.disabled}
                  onClick={() => {
                    if (!item.disabled && (item.id === "Perfil" || item.id === "Firma")) {
                      setActiveTab(item.id)
                    }
                  }}
                  className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all ${
                    item.disabled
                      ? "opacity-40 cursor-not-allowed text-on-surface-variant/40"
                      : isActive
                      ? "bg-primary text-primary-foreground shadow-sm cursor-pointer"
                      : "text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface cursor-pointer"
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
            {activeTab === "Perfil" ? (
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
                  {/* Avatar Uploader Section */}
                  <div className="flex flex-col items-center gap-4 sm:flex-row sm:gap-6 border-b border-outline-variant/30 pb-6 mb-6">
                    <div 
                      onClick={() => setIsModalOpen(true)}
                      className="relative group/avatar cursor-pointer shrink-0"
                    >
                      <input
                        type="file"
                        ref={fileInputRef}
                        accept="image/*"
                        onChange={handleAvatarChange}
                        className="hidden"
                      />
                      <div className="h-24 w-24 rounded-full overflow-hidden border-2 border-outline-variant bg-surface-container-high flex items-center justify-center transition-all group-hover/avatar:border-primary">
                        {avatarUrl ? (
                          <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
                        ) : (
                          <span className="text-2xl font-black text-primary">
                            {formData.nombre ? formData.nombre.substring(0, 1).toUpperCase() : ""}
                            {formData.apellido ? formData.apellido.substring(0, 1).toUpperCase() : ""}
                          </span>
                        )}
                      </div>
                      <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity">
                        <Camera className="h-6 w-6 text-white" />
                      </div>
                    </div>
                    <div className="text-center sm:text-left space-y-1">
                      <p className="text-sm font-semibold text-on-surface">Foto de Perfil</p>
                      <p className="text-xs text-on-surface-variant max-w-[240px]">
                        Haz clic en la imagen para subir una nueva foto de perfil (se recomienda cuadrada, máximo 2MB).
                      </p>
                    </div>
                  </div>

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
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant/70 px-1">Empresa</label>
                      <input
                        type="text"
                        name="empresa"
                        value={formData.empresa}
                        disabled={true}
                        className="h-12 w-full rounded-xl bg-surface-container px-4 text-sm text-on-surface-variant outline-none ring-1 ring-outline-variant/20 disabled:opacity-60 cursor-not-allowed"
                        title="La empresa no se puede modificar desde aquí"
                      />
                      <p className="px-1 text-[10px] text-on-surface-variant">La empresa está vinculada a la cuenta y no puede cambiarse.</p>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant/70 px-1">Cargo</label>
                      <input
                        type="text"
                        name="cargo"
                        value={formData.cargo}
                        onChange={handleChange}
                        disabled={loading}
                        placeholder="Ej. Gerente de Ventas"
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
            ) : activeTab === "Firma" ? (
              <div className="rounded-2xl border border-outline-variant/10 bg-surface-container-low p-6 lg:p-8 shadow-sm flex flex-col gap-6">
                <div>
                  <h2 className="text-lg font-bold text-on-surface">Firma de Correo Corporativa</h2>
                  <p className="text-xs text-on-surface-variant font-medium">Genera tu firma oficial de mariomojica.com en texto enriquecido para pegarla en Gmail.</p>
                </div>
                
                {/* Contenedor vista previa (Fondo blanco de correo) */}
                <div className="rounded-xl border border-outline-variant/20 bg-white p-8 flex justify-center shadow-inner overflow-x-auto text-black">
                  <div dangerouslySetInnerHTML={{ __html: dynamicSignatureHtml }} />
                </div>

                <div className="flex flex-col gap-6">
                  <div className="flex justify-center">
                    <button
                      type="button"
                      onClick={handleCopySignature}
                      className={`flex h-12 items-center justify-center rounded-xl px-8 text-sm font-bold text-white shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer ${
                        copiedSignature 
                          ? "bg-emerald-600 shadow-emerald-900/20" 
                          : "bg-[#0088aa] hover:bg-[#0088aa]/95 shadow-[#0088aa]/20"
                      }`}
                    >
                      {copiedSignature ? "✓ ¡Copiado al Portapapeles!" : "📋 Copiar Firma Formateada"}
                    </button>
                  </div>

                  <div className="border-t border-outline-variant/20 pt-6 mt-4">
                    <h3 className="text-sm font-bold text-on-surface mb-3 flex items-center gap-2">
                      <span>💡</span> ¿Cómo instalarla en tu Gmail?
                    </h3>
                    <ol className="list-decimal pl-5 space-y-2.5 text-xs text-on-surface-variant leading-relaxed">
                      <li>Haz clic arriba en el botón <strong>&quot;Copiar Firma Formateada&quot;</strong>.</li>
                      <li>Abre tu Gmail y ve a <strong>Ajustes</strong> (icono de engranaje) &gt; <strong>Ver todos los ajustes</strong>.</li>
                      <li>En la pestaña <strong>General</strong>, baja hasta la sección <strong>Firma</strong>.</li>
                      <li>Haz clic en <strong>Crear nueva</strong> (o edita tu firma actual), borra el contenido actual y haz clic dentro del cuadro.</li>
                      <li>Pega la firma presionando <strong>Ctrl + V</strong> (o clic derecho &gt; Pegar). <em>¡Aparecerá directamente con el diseño, logos y enlaces activos!</em></li>
                      <li>Baja al final de la página de Gmail y haz clic en <strong>Guardar cambios</strong>.</li>
                    </ol>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* Modal interactivo de foto de perfil */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            {/* Fondo / Backdrop click para cerrar */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeModal}
              className="absolute inset-0"
            />
            
            {/* Contenido del modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: "spring", duration: 0.4 }}
              className="relative z-10 w-full max-w-md overflow-hidden rounded-3xl border border-outline-variant bg-surface-container-low shadow-2xl p-6 flex flex-col gap-6"
            >
              {/* Encabezado */}
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-on-surface">
                  {modalMode === "selection" && "Agregar foto de perfil"}
                  {modalMode === "camera" && "Tomar foto de perfil"}
                  {modalMode === "crop" && "Ajustar y rotar"}
                </h3>
                <button 
                  onClick={closeModal}
                  className="rounded-full p-1.5 text-on-surface-variant hover:bg-surface-container-highest hover:text-on-surface transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Modo: Selección principal */}
              {modalMode === "selection" && (
                <div className="flex flex-col gap-6">
                  {/* Ilustraciones predefinidas */}
                  <div className="flex flex-col gap-3 relative">
                    <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant/70">Ilustraciones predefinidas</p>
                    
                    <div className="relative w-full flex items-center group">
                      {/* Botón scroll izquierdo */}
                      <button
                        type="button"
                        onClick={() => carouselRef.current?.scrollBy({ left: -150, behavior: 'smooth' })}
                        className="absolute -left-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-surface-container-high/90 border border-outline-variant/30 text-on-surface shadow-md backdrop-blur-sm transition-all hover:bg-surface-container-highest active:scale-90"
                        title="Anterior"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>

                      {/* Carrusel */}
                      <div 
                        ref={carouselRef}
                        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                        className="flex w-full items-center gap-3 overflow-x-auto scroll-smooth py-1 px-4 scrollbar-none [&::-webkit-scrollbar]:hidden"
                      >
                        {ILUSTRACIONES.map((url, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => selectIlustracion(url)}
                            className="w-14 h-14 rounded-full border border-outline-variant/30 overflow-hidden bg-surface-container-high flex-shrink-0 transition-transform hover:scale-110 active:scale-95 shadow-inner"
                          >
                            <img src={url} alt={`Ilustración ${i + 1}`} className="h-full w-full object-cover select-none pointer-events-none" />
                          </button>
                        ))}
                      </div>

                      {/* Botón scroll derecho (estilo flotante idéntico a la referencia) */}
                      <button
                        type="button"
                        onClick={() => carouselRef.current?.scrollBy({ left: 150, behavior: 'smooth' })}
                        className="absolute -right-2 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white text-black shadow-lg border border-neutral-200 transition-all hover:bg-neutral-50 active:scale-90"
                        title="Siguiente"
                      >
                        <ChevronRight className="h-5 w-5 font-bold" />
                      </button>
                    </div>
                  </div>

                  {/* Ilustraciones random */}
                  <div className="flex flex-col gap-3 relative">
                    <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant/70">Otras ilustraciones</p>
                    
                    <div className="relative w-full flex items-center group">
                      {/* Botón scroll izquierdo */}
                      <button
                        type="button"
                        onClick={() => randomCarouselRef.current?.scrollBy({ left: -150, behavior: 'smooth' })}
                        className="absolute -left-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-surface-container-high/90 border border-outline-variant/30 text-on-surface shadow-md backdrop-blur-sm transition-all hover:bg-surface-container-highest active:scale-90"
                        title="Anterior"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>

                      {/* Carrusel */}
                      <div 
                        ref={randomCarouselRef}
                        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                        className="flex w-full items-center gap-3 overflow-x-auto scroll-smooth py-1 px-4 scrollbar-none [&::-webkit-scrollbar]:hidden"
                      >
                        {ILUSTRACIONES_RANDOM.map((url, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => selectIlustracion(url)}
                            className="w-14 h-14 rounded-full border border-outline-variant/30 overflow-hidden bg-surface-container-high flex-shrink-0 transition-transform hover:scale-110 active:scale-95 shadow-inner"
                          >
                            <img src={url} alt={`Ilustración Random ${i + 1}`} className="h-full w-full object-cover select-none pointer-events-none" />
                          </button>
                        ))}
                      </div>

                      {/* Botón scroll derecho */}
                      <button
                        type="button"
                        onClick={() => randomCarouselRef.current?.scrollBy({ left: 150, behavior: 'smooth' })}
                        className="absolute -right-2 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white text-black shadow-lg border border-neutral-200 transition-all hover:bg-neutral-50 active:scale-90"
                        title="Siguiente"
                      >
                        <ChevronRight className="h-5 w-5 font-bold" />
                      </button>
                    </div>
                  </div>

                  {/* Acciones principales */}
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-3 w-full p-4 rounded-2xl bg-surface-container hover:bg-surface-container-highest text-on-surface text-sm font-semibold transition-all border border-outline-variant/10 hover:border-outline-variant/30"
                    >
                      <Upload className="h-5 w-5 text-primary" />
                      <div className="text-left">
                        <p className="font-bold">Subir desde el dispositivo</p>
                        <p className="text-xs text-on-surface-variant font-medium">Soporta JPG, PNG y WebP</p>
                      </div>
                    </button>

                    <button
                      onClick={startCamera}
                      className="flex items-center gap-3 w-full p-4 rounded-2xl bg-surface-container hover:bg-surface-container-highest text-on-surface text-sm font-semibold transition-all border border-outline-variant/10 hover:border-outline-variant/30"
                    >
                      <Camera className="h-5 w-5 text-primary" />
                      <div className="text-left">
                        <p className="font-bold">Tomar una foto</p>
                        <p className="text-xs text-on-surface-variant font-medium">Usa la cámara de tu dispositivo</p>
                      </div>
                    </button>
                  </div>
                </div>
              )}

              {/* Modo: Cámara */}
              {modalMode === "camera" && (
                <div className="flex flex-col items-center gap-6">
                  {cameraError ? (
                    <div className="flex flex-col items-center gap-4 text-center py-6">
                      <div className="rounded-full bg-red-500/10 p-3 text-red-500">
                        <X className="h-8 w-8" />
                      </div>
                      <p className="text-sm font-medium text-red-400 max-w-[280px]">{cameraError}</p>
                      <button
                        onClick={stopCamera}
                        className="text-xs font-bold text-primary underline"
                      >
                        Volver atrás
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="relative h-56 w-56 rounded-full overflow-hidden border-4 border-primary/20 bg-black flex items-center justify-center">
                        <video 
                          ref={videoRef} 
                          className="h-full w-full object-cover scale-x-[-1]" 
                          autoPlay 
                          playsInline 
                        />
                        {/* Máscara guía circular */}
                        <div className="absolute inset-0 rounded-full border border-primary/30 pointer-events-none" />
                      </div>

                      <div className="flex items-center gap-3 w-full">
                        <button
                          onClick={stopCamera}
                          className="flex-1 h-12 rounded-xl bg-surface-container hover:bg-surface-container-highest text-sm font-bold text-on-surface transition-colors"
                        >
                          Cancelar
                        </button>
                        <button
                          onClick={capturePhoto}
                          className="flex-1 h-12 rounded-xl bg-primary hover:bg-primary/95 text-sm font-bold text-primary-foreground transition-all flex items-center justify-center gap-2"
                        >
                          <Camera className="h-4 w-4" />
                          Capturar
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Modo: Recortar y Rotar */}
              {modalMode === "crop" && selectedImage && (
                <div className="flex flex-col items-center gap-6">
                  {/* Contenedor de previsualización con máscara circular y esquinas blancas */}
                  <div className="relative h-64 w-64 overflow-hidden rounded-2xl bg-black/90 flex items-center justify-center border border-outline-variant/30">
                    <div 
                      onPointerDown={handlePointerDown}
                      onPointerMove={handlePointerMove}
                      onPointerUp={handlePointerUp}
                      onPointerLeave={handlePointerUp}
                      className="relative h-48 w-48 rounded-full overflow-hidden cursor-move touch-none select-none active:cursor-grabbing"
                    >
                      <img 
                        src={selectedImage} 
                        alt="A ajustar" 
                        style={{ 
                          transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale}) rotate(${rotation}deg)`,
                          transformOrigin: "center center"
                        }}
                        className="h-full w-full object-cover select-none pointer-events-none transition-transform duration-75" 
                      />
                    </div>
                    
                    {/* Guías de esquinas blancas como la referencia */}
                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                      <div className="absolute inset-0 bg-black/40" />
                      <div className="absolute h-48 w-48 rounded-full bg-transparent shadow-[0_0_0_9999px_rgba(0,0,0,0.5)] border border-white/20" />
                      
                      {/* Esquinas de enfoque */}
                      <div className="absolute top-6 left-6 w-4 h-4 border-t-2 border-l-2 border-white" />
                      <div className="absolute top-6 right-6 w-4 h-4 border-t-2 border-r-2 border-white" />
                      <div className="absolute bottom-6 left-6 w-4 h-4 border-b-2 border-l-2 border-white" />
                      <div className="absolute bottom-6 right-6 w-4 h-4 border-b-2 border-r-2 border-white" />
                    </div>
                  </div>

                  <div className="flex flex-col gap-4 w-full">
                    {/* Control de Zoom */}
                    <div className="flex flex-col gap-2 w-full">
                      <div className="flex items-center justify-between text-xs text-on-surface-variant font-bold px-1">
                        <span>Aumentar / Reducir tamaño</span>
                        <span>{Math.round(scale * 100)}%</span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="3"
                        step="0.02"
                        value={scale}
                        onChange={(e) => setScale(parseFloat(e.target.value))}
                        className="w-full h-1.5 bg-outline-variant/30 rounded-lg appearance-none cursor-pointer accent-primary focus:outline-none"
                      />
                    </div>

                    {/* Botón Rotar */}
                    <button
                      onClick={() => setRotation(prev => (prev + 90) % 360)}
                      className="flex h-11 items-center justify-center gap-2 rounded-xl bg-surface-container hover:bg-surface-container-highest text-sm font-semibold text-on-surface transition-colors w-full border border-outline-variant/10"
                    >
                      <RefreshCw className="h-4 w-4" />
                      Rotar 90°
                    </button>

                    <div className="flex items-center gap-3 w-full">
                      <button
                        onClick={() => setModalMode("selection")}
                        className="flex-1 h-12 rounded-xl bg-surface-container hover:bg-surface-container-highest text-sm font-bold text-on-surface transition-colors"
                      >
                        Atrás
                      </button>
                      <button
                        onClick={applyCropAndRotate}
                        className="flex-1 h-12 rounded-xl bg-primary hover:bg-primary/95 text-sm font-bold text-primary-foreground transition-all"
                      >
                        Guardar Foto
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

