"use client"

import React, { useState, useEffect, useRef } from "react"
import {
  X,
  Save,
  Building2,
  User,
  Briefcase,
  Globe,
  MessageSquare,
  Flame,
  Sparkles,
  Loader2,
  UploadCloud,
  Phone,
  Link2,
  AlertTriangle,
  ExternalLink,
} from "lucide-react"
import { VentasProspecto, TemperaturaLead, CanalContacto } from "@/lib/types/ventas-ram"

interface ProspectoModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: Partial<VentasProspecto>) => Promise<void>
  initialData?: VentasProspecto | null
  prospectosExistentes?: VentasProspecto[]
  onSelectExistente?: (prospecto: VentasProspecto) => void
}

export function ProspectoModal({
  isOpen,
  onClose,
  onSave,
  initialData,
  prospectosExistentes = [],
  onSelectExistente,
}: ProspectoModalProps) {
  const [empresa, setEmpresa] = useState("")
  const [contactoNombre, setContactoNombre] = useState("")
  const [contactoCargo, setContactoCargo] = useState("")
  const [contactoTelefono, setContactoTelefono] = useState("")
  const [perfilUrl, setPerfilUrl] = useState("")
  const [canalPreferido, setCanalPreferido] = useState<CanalContacto>("LinkedIn")
  const [pais, setPais] = useState("Brasil")
  const [temperatura, setTemperatura] = useState<TemperaturaLead>("tibio")
  const [proximaAccion, setProximaAccion] = useState("")
  const [notas, setNotas] = useState("")
  const [referidoPorNombre, setReferidoPorNombre] = useState("")
  const [tipoRelacion, setTipoRelacion] = useState("")
  const [saving, setSaving] = useState(false)

  // Estado de Auto-Completado con IA
  const [extracting, setExtracting] = useState(false)
  const [capturaPerfil, setCapturaPerfil] = useState<string | null>(null)
  const [urlOTexto, setUrlOTexto] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (initialData) {
      setEmpresa(initialData.empresa)
      setContactoNombre(initialData.contacto_nombre)
      setContactoCargo(initialData.contacto_cargo || "")
      setContactoTelefono(initialData.contacto_telefono || "")
      setPerfilUrl(initialData.perfil_url || "")
      setCanalPreferido(initialData.canal_preferido)
      setPais(initialData.pais || "Brasil")
      setTemperatura(initialData.temperatura)
      setProximaAccion(initialData.proxima_accion_descripcion || "")
      setNotas(initialData.notas_estrategicas || "")
      setReferidoPorNombre(initialData.referido_por_nombre || "")
      setTipoRelacion(initialData.tipo_relacion || "")
      setCapturaPerfil(null)
      setUrlOTexto("")
    } else {
      setEmpresa("")
      setContactoNombre("")
      setContactoCargo("")
      setContactoTelefono("")
      setPerfilUrl("")
      setCanalPreferido("LinkedIn")
      setPais("Brasil")
      setTemperatura("tibio")
      setProximaAccion("")
      setNotas("")
      setReferidoPorNombre("")
      setTipoRelacion("")
      setCapturaPerfil(null)
      setUrlOTexto("")
    }
  }, [initialData, isOpen])

  const compressImage = (dataUrl: string, maxDim = 1280, quality = 0.82): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image()
      img.onload = () => {
        let { width, height } = img
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width)
            width = maxDim
          } else {
            width = Math.round((width * maxDim) / height)
            height = maxDim
          }
        }
        const canvas = document.createElement("canvas")
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext("2d")
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height)
          resolve(canvas.toDataURL("image/jpeg", quality))
        } else {
          resolve(dataUrl)
        }
      }
      img.onerror = () => resolve(dataUrl)
      img.src = dataUrl
    })
  }

  // Listener para Pegar Captura del Perfil con Ctrl+V dentro del Modal
  useEffect(() => {
    if (!isOpen) return

    const handlePaste = (e: ClipboardEvent) => {
      if (!e.clipboardData) return
      const items = e.clipboardData.items
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf("image") !== -1) {
          const file = items[i].getAsFile()
          if (file) {
            const reader = new FileReader()
            reader.onload = async (event) => {
              if (event.target?.result) {
                const rawBase64 = event.target.result as string
                const compressed = await compressImage(rawBase64)
                setCapturaPerfil(compressed)
                triggerAutoExtract(compressed, undefined)
              }
            }
            reader.readAsDataURL(file)
            e.preventDefault()
            break
          }
        }
      }
    }

    window.addEventListener("paste", handlePaste)
    return () => window.removeEventListener("paste", handlePaste)
  }, [isOpen])

  const triggerAutoExtract = async (imgBase64?: string, text?: string) => {
    const payloadImg = imgBase64 || capturaPerfil
    const payloadText = text || urlOTexto
    if (!payloadImg && !payloadText?.trim()) return

    setExtracting(true)
    try {
      const res = await fetch("/api/ventas-ram/extraer-perfil", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imagen_base64: payloadImg || undefined,
          url_o_texto: payloadText?.trim() || undefined,
        }),
      })

      if (!res.ok) throw new Error("Error en extracción")
      const data = await res.json()

      if (data.empresa) setEmpresa(data.empresa)
      if (data.contacto_nombre) setContactoNombre(data.contacto_nombre)
      if (data.contacto_cargo) setContactoCargo(data.contacto_cargo)
      if (data.contacto_telefono) setContactoTelefono(data.contacto_telefono)
      if (data.perfil_url) setPerfilUrl(data.perfil_url)
      if (data.canal_preferido) setCanalPreferido(data.canal_preferido)
      if (data.pais) setPais(data.pais)
      if (data.temperatura) setTemperatura(data.temperatura)
      if (data.notas_estrategicas) setNotas(data.notas_estrategicas)
    } catch (err) {
      console.error("Error extrayendo perfil:", err)
      alert("No se pudo extraer automáticamente. Puedes completar los campos manualmente.")
    } finally {
      setExtracting(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = async (event) => {
        if (event.target?.result) {
          const rawBase64 = event.target.result as string
          const compressed = await compressImage(rawBase64)
          setCapturaPerfil(compressed)
          triggerAutoExtract(compressed, undefined)
        }
      }
      reader.readAsDataURL(file)
    }
  }

  // Detección de duplicados en tiempo real
  const duplicadoDetectado = React.useMemo(() => {
    if (!prospectosExistentes || prospectosExistentes.length === 0) return null

    const currentId = initialData?.id
    const cleanUrl = perfilUrl.trim().toLowerCase().replace(/\/$/, "")
    const cleanName = contactoNombre.trim().toLowerCase()
    const cleanEmpresa = empresa.trim().toLowerCase()
    const cleanTel = contactoTelefono.replace(/[^0-9]/g, "")

    for (const p of prospectosExistentes) {
      if (currentId && p.id === currentId) continue

      // Coincidencia por URL de LinkedIn
      if (cleanUrl && cleanUrl.length > 15 && p.perfil_url) {
        const pUrl = p.perfil_url.toLowerCase().replace(/\/$/, "")
        if (cleanUrl === pUrl || cleanUrl.includes(pUrl) || pUrl.includes(cleanUrl)) {
          return { prospecto: p, motivo: "Mismo perfil de LinkedIn" }
        }
      }

      // Coincidencia por Teléfono
      if (cleanTel && cleanTel.length >= 8 && p.contacto_telefono) {
        const pTel = p.contacto_telefono.replace(/[^0-9]/g, "")
        if (pTel && (cleanTel === pTel || cleanTel.includes(pTel) || pTel.includes(cleanTel))) {
          return { prospecto: p, motivo: "Mismo número de teléfono / WhatsApp" }
        }
      }

      // Coincidencia exacta o muy alta por Nombre de Contacto
      if (cleanName && cleanName.length > 5 && p.contacto_nombre) {
        const pName = p.contacto_nombre.toLowerCase()
        if (cleanName === pName) {
          return { prospecto: p, motivo: "Mismo nombre de contacto" }
        }
      }

      // Coincidencia por Empresa idéntica si el nombre también se parece
      if (cleanEmpresa && cleanEmpresa.length > 3 && p.empresa) {
        const pEmp = p.empresa.toLowerCase()
        if (cleanEmpresa === pEmp && cleanName && cleanName.length > 3 && p.contacto_nombre.toLowerCase().includes(cleanName.split(" ")[0])) {
          return { prospecto: p, motivo: "Misma empresa y contacto similar" }
        }
      }
    }

    return null
  }, [contactoNombre, empresa, perfilUrl, contactoTelefono, prospectosExistentes, initialData?.id])

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!empresa.trim() || !contactoNombre.trim()) return

    setSaving(true)
    try {
      await onSave({
        id: initialData?.id,
        empresa: empresa.trim(),
        contacto_nombre: contactoNombre.trim(),
        contacto_cargo: contactoCargo.trim() || null,
        contacto_telefono: contactoTelefono.trim() || null,
        perfil_url: perfilUrl.trim() || null,
        canal_preferido: canalPreferido,
        pais: pais.trim() || "Brasil",
        temperatura,
        proxima_accion_descripcion: proximaAccion.trim() || null,
        notas_estrategicas: notas.trim() || null,
        referido_por_nombre: referidoPorNombre.trim() || null,
        tipo_relacion: tipoRelacion.trim() || null,
      })
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-xl max-h-[90vh] flex flex-col rounded-2xl bg-surface-container border border-outline-variant/30 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-outline-variant/20 flex items-center justify-between shrink-0 bg-surface-container-high/40">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Building2 className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-on-surface">
                {initialData ? "Editar Prospecto" : "Nuevo Prospecto Comercial"}
              </h3>
              <p className="text-[11px] text-on-surface-variant">
                Auto-completa con IA pegando una captura o completa manualmente
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container-highest transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Cuerpo con Scroll */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar">
          {/* AVISO DE DUPLICADO DETECTADO */}
          {duplicadoDetectado && (
            <div className="p-3.5 rounded-xl bg-amber-500/15 border-2 border-amber-500/40 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in duration-200">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-on-surface flex items-center gap-1.5 flex-wrap">
                    <span>⚠️ ¡Este contacto ya existe en tu directorio!</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 font-semibold">
                      {duplicadoDetectado.motivo}
                    </span>
                  </div>
                  <p className="text-on-surface-variant text-[11px] mt-0.5">
                    Coincide con: <strong className="text-on-surface">{duplicadoDetectado.prospecto.contacto_nombre}</strong> ({duplicadoDetectado.prospecto.empresa} - {duplicadoDetectado.prospecto.pais})
                  </p>
                </div>
              </div>

              {onSelectExistente && (
                <button
                  type="button"
                  onClick={() => onSelectExistente(duplicadoDetectado.prospecto)}
                  className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-xs transition-colors shrink-0 cursor-pointer flex items-center gap-1"
                >
                  <ExternalLink className="h-3 w-3" />
                  <span>Ver Ficha</span>
                </button>
              )}
            </div>
          )}
          {/* BANNER AUTO-FILL CON IA */}
          <div className="rounded-xl bg-primary/5 border border-primary/25 p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-primary flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5" />
                <span>Auto-Completar con IA (Captura de Perfil o Enlace)</span>
              </span>
              {extracting && (
                <span className="text-[11px] text-primary flex items-center gap-1 font-semibold">
                  <Loader2 className="h-3 w-3 animate-spin" /> Extrayendo...
                </span>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={urlOTexto}
                onChange={(e) => setUrlOTexto(e.target.value)}
                placeholder="Pega el enlace de LinkedIn (ej. linkedin.com/in/...) o texto del perfil"
                className="flex-1 px-3 py-1.5 text-xs rounded-xl bg-surface-container border border-outline-variant/30 text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:border-primary"
              />

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-surface-container border border-outline-variant/30 text-xs font-medium text-on-surface hover:bg-surface-container-high transition-colors cursor-pointer"
                  title="Subir captura"
                >
                  <UploadCloud className="h-3.5 w-3.5 text-primary" />
                  <span>Subir Captura</span>
                </button>

                <button
                  type="button"
                  disabled={extracting || (!capturaPerfil && !urlOTexto.trim())}
                  onClick={() => triggerAutoExtract()}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-primary text-xs font-bold text-primary-foreground hover:opacity-90 transition-opacity shadow-xs cursor-pointer disabled:opacity-50"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Extraer</span>
                </button>
              </div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />

            <p className="text-[10px] text-on-surface-variant">
              💡 Tip: Simplemente presiona <kbd className="px-1 py-0.5 rounded bg-surface-container-highest border border-outline-variant/30 font-mono text-[9px] text-primary">Ctrl + V</kbd> aquí con la captura de LinkedIn/WhatsApp en tu portapapeles.
            </p>

            {capturaPerfil && (
              <div className="flex items-center justify-between text-[11px] pt-1 border-t border-primary/15">
                <span className="text-primary font-medium">✓ Captura de perfil cargada</span>
                <button
                  type="button"
                  onClick={() => setCapturaPerfil(null)}
                  className="text-rose-500 hover:underline cursor-pointer text-[10px]"
                >
                  Quitar imagen
                </button>
              </div>
            )}
          </div>

          {/* Formulario de Campos */}
          <form id="prospecto-form" onSubmit={handleSubmit} className="space-y-3.5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">
                  Empresa *
                </label>
                <input
                  type="text"
                  required
                  value={empresa}
                  onChange={(e) => setEmpresa(e.target.value)}
                  placeholder="Ej. Grupo K1 (Kappesberg)"
                  className="w-full px-3 py-2 text-xs rounded-xl bg-surface-container-high border border-outline-variant/30 text-on-surface focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">
                  País / Región
                </label>
                <input
                  type="text"
                  value={pais}
                  onChange={(e) => setPais(e.target.value)}
                  placeholder="Ej. Brasil (Rio Grande do Sul)"
                  className="w-full px-3 py-2 text-xs rounded-xl bg-surface-container-high border border-outline-variant/30 text-on-surface focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">
                  Nombre de Contacto *
                </label>
                <input
                  type="text"
                  required
                  value={contactoNombre}
                  onChange={(e) => setContactoNombre(e.target.value)}
                  placeholder="Ej. Julio Santos"
                  className="w-full px-3 py-2 text-xs rounded-xl bg-surface-container-high border border-outline-variant/30 text-on-surface focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">
                  Cargo / Titular Profesional
                </label>
                <input
                  type="text"
                  value={contactoCargo}
                  onChange={(e) => setContactoCargo(e.target.value)}
                  placeholder="Ej. Especialista em IA / Diretor P&D"
                  className="w-full px-3 py-2 text-xs rounded-xl bg-surface-container-high border border-outline-variant/30 text-on-surface focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1 flex items-center gap-1">
                  <Phone className="h-3 w-3 text-emerald-500" />
                  <span>Teléfono / WhatsApp</span>
                </label>
                <input
                  type="text"
                  value={contactoTelefono}
                  onChange={(e) => setContactoTelefono(e.target.value)}
                  placeholder="Ej. +55 49 988316920"
                  className="w-full px-3 py-2 text-xs rounded-xl bg-surface-container-high border border-outline-variant/30 text-on-surface focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1 flex items-center gap-1">
                  <Link2 className="h-3 w-3 text-primary" />
                  <span>Perfil de LinkedIn URL</span>
                </label>
                <input
                  type="text"
                  value={perfilUrl}
                  onChange={(e) => setPerfilUrl(e.target.value)}
                  placeholder="https://linkedin.com/in/usuario"
                  className="w-full px-3 py-2 text-xs rounded-xl bg-surface-container-high border border-outline-variant/30 text-on-surface focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">
                  Canal Preferido
                </label>
                <select
                  value={canalPreferido}
                  onChange={(e) => setCanalPreferido(e.target.value as CanalContacto)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-surface-container-high border border-outline-variant/30 text-on-surface focus:outline-none focus:border-primary cursor-pointer"
                >
                  <option value="LinkedIn">LinkedIn</option>
                  <option value="WhatsApp">WhatsApp</option>
                  <option value="Email">Email</option>
                  <option value="Teléfono">Teléfono</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">
                  Temperatura del Lead
                </label>
                <select
                  value={temperatura}
                  onChange={(e) => setTemperatura(e.target.value as TemperaturaLead)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-surface-container-high border border-outline-variant/30 text-on-surface focus:outline-none focus:border-primary cursor-pointer"
                >
                  <option value="caliente">🔥 Caliente (Alta intención)</option>
                  <option value="tibio">🟡 Tibio (En seguimiento)</option>
                  <option value="enfriando">🔴 En riesgo de enfriarse</option>
                  <option value="pausado">⏸️ En Pausa</option>
                  <option value="cerrado_ganado">🎉 Cerrado / Ganado</option>
                  <option value="cerrado_perdido">❌ Perdido</option>
                </select>
              </div>
            </div>

            {/* Red Relacional & Referencias */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 bg-surface-container-high/30 p-3 rounded-xl border border-outline-variant/20">
              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1 flex items-center gap-1">
                  <span>🔗 Referenciado por / Puente</span>
                </label>
                <input
                  type="text"
                  value={referidoPorNombre}
                  onChange={(e) => setReferidoPorNombre(e.target.value)}
                  placeholder="Ej. Luiz Atilio Barse (Mobille)"
                  className="w-full px-3 py-2 text-xs rounded-xl bg-surface-container-high border border-outline-variant/30 text-on-surface focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">
                  Tipo de Vínculo / Rol
                </label>
                <input
                  type="text"
                  value={tipoRelacion}
                  onChange={(e) => setTipoRelacion(e.target.value)}
                  placeholder="Ej. Recomendado con aval de AKEO"
                  className="w-full px-3 py-2 text-xs rounded-xl bg-surface-container-high border border-outline-variant/30 text-on-surface focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-on-surface mb-1">
                Próxima Acción Sugerida
              </label>
              <input
                type="text"
                value={proximaAccion}
                onChange={(e) => setProximaAccion(e.target.value)}
                placeholder="Ej. Enviar propuesta el miércoles y agendar llamada de 30 min"
                className="w-full px-3 py-2 text-xs rounded-xl bg-surface-container-high border border-outline-variant/30 text-on-surface focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-on-surface mb-1">
                Notas Estratégicas y Contexto
              </label>
              <textarea
                rows={3}
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
                placeholder="Notas clave: cómo nos conocimos, dolores de la fábrica, catálogo..."
                className="w-full px-3 py-2 text-xs rounded-xl bg-surface-container-high border border-outline-variant/30 text-on-surface focus:outline-none focus:border-primary resize-none"
              />
            </div>
          </form>
        </div>

        {/* Botones de Acción Fijos al Pie */}
        <div className="p-4 border-t border-outline-variant/15 flex items-center justify-end gap-2 shrink-0 bg-surface-container-high/40">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-on-surface hover:bg-surface-container-highest transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            form="prospecto-form"
            type="submit"
            disabled={saving || extracting}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-xs font-semibold text-primary-foreground hover:opacity-90 transition-opacity shadow-sm cursor-pointer disabled:opacity-50"
          >
            <Save className="h-3.5 w-3.5" />
            <span>{saving ? "Guardando..." : "Guardar Prospecto"}</span>
          </button>
        </div>
      </div>
    </div>
  )
}
