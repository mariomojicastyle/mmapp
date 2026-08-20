"use client"

import React, { useState, useMemo, useEffect } from "react"
import {
  Calendar,
  Clock,
  Video,
  Copy,
  Check,
  ExternalLink,
  X,
  Sparkles,
  Mail,
  Zap,
} from "lucide-react"
import { VentasProspecto } from "@/lib/types/ventas-ram"

interface AgendarModalProps {
  isOpen: boolean
  onClose: () => void
  prospecto: VentasProspecto | null
  onSaveCita?: (fechaIso: string, descripcion: string) => Promise<void>
}

export function AgendarModal({
  isOpen,
  onClose,
  prospecto,
  onSaveCita,
}: AgendarModalProps) {
  // Fecha predeterminada: Mañana a las 10:00 BRT
  const defaultDate = useMemo(() => {
    const d = new Date()
    d.setDate(d.getDate() + 1)
    return d.toISOString().split("T")[0]
  }, [])

  const [fecha, setFecha] = useState(defaultDate)
  const [horaBrasil, setHoraBrasil] = useState("10:00")
  const [duracionMin, setDuracionMin] = useState(30)
  const [plataforma, setPlataforma] = useState<"Google Meet" | "Microsoft Teams" | "Zoom">("Google Meet")
  const [emailInvitado, setEmailInvitado] = useState(prospecto?.contacto_email || "")
  const [copiado, setCopiado] = useState(false)
  const [saving, setSaving] = useState(false)

  // Sincronizar email si cambia el prospecto
  useEffect(() => {
    if (prospecto?.contacto_email) {
      setEmailInvitado(prospecto.contacto_email)
    }
  }, [prospecto])

  // Calcular horas equivalentes (Brasil UTC-3 vs Colombia UTC-5: 2 horas de diferencia)
  const horariosCalculados = useMemo(() => {
    try {
      const [hStr, mStr] = horaBrasil.split(":")
      const hInt = parseInt(hStr, 10)
      const mInt = parseInt(mStr, 10)

      // Hora Colombia = Hora Brasil - 2 horas
      let hCol = hInt - 2
      if (hCol < 0) hCol += 24

      const horaColStr = `${hCol.toString().padStart(2, "0")}:${mStr}`

      // Fecha fin
      const totalMinInicio = hInt * 60 + mInt
      const totalMinFin = totalMinInicio + duracionMin
      const hFinBR = Math.floor(totalMinFin / 60) % 24
      const mFinBR = totalMinFin % 60
      const horaFinBRStr = `${hFinBR.toString().padStart(2, "0")}:${mFinBR.toString().padStart(2, "0")}`

      // Timestamps para Google Calendar URL (UTC)
      // Brasil UTC-3 -> UTC = hInt + 3
      const [y, mon, day] = fecha.split("-").map((n) => parseInt(n, 10))
      
      const startUtcDate = new Date(Date.UTC(y, mon - 1, day, (hInt + 3) % 24, mInt, 0))
      const endUtcDate = new Date(startUtcDate.getTime() + duracionMin * 60 * 1000)

      const formatUtcCal = (d: Date) => {
        return d.toISOString().replace(/-|:|\.\d+/g, "")
      }

      const calDatesParam = `${formatUtcCal(startUtcDate)}/${formatUtcCal(endUtcDate)}`

      return {
        horaBrasil,
        horaColombia: horaColStr,
        horaFinBrasil: horaFinBRStr,
        calDatesParam,
        startIso: startUtcDate.toISOString(),
      }
    } catch {
      return {
        horaBrasil: "10:00",
        horaColombia: "08:00",
        horaFinBrasil: "10:30",
        calDatesParam: "",
        startIso: new Date().toISOString(),
      }
    }
  }, [fecha, horaBrasil, duracionMin])

  if (!isOpen || !prospecto) return null

// Textos y Enlaces de Calendar
  const tituloCita = `Apresentação Manual 3D Interativo | Mario Mojica <> ${prospecto.empresa}`
  const descripcionCita = `Apresentação e demonstração ao vivo da tecnologia de Manuais 3D Interativos por voz para móveis RTA da ${prospecto.empresa}.

Apresentador: Mario Mojica (Desenvolvedor de Software para Manufatura)
E-mail: mariomojica.style@gmail.com
WhatsApp: +57 311 764 6907
Demo interativa: https://mariomojica.com/demo
Contato: ${prospecto.contacto_nombre} (${prospecto.contacto_cargo || "Decisor"})`

  // Generar Google Calendar URL vinculada directamente a mariomojica.style@gmail.com
  const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&authuser=mariomojica.style@gmail.com&text=${encodeURIComponent(
    tituloCita
  )}&dates=${horariosCalculados.calDatesParam}&details=${encodeURIComponent(
    descripcionCita
  )}&location=${encodeURIComponent(plataforma)}${
    emailInvitado ? `&add=${encodeURIComponent(emailInvitado)}` : ""
  }`

  // Mensaje para enviar por WhatsApp / LinkedIn
  const mensajeConfirmacionPT = `Excelente, ${prospecto.contacto_nombre.split(" ")[0]}! Reunião agendada para ${new Date(
    fecha + "T12:00:00"
  ).toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  })} às ${horaBrasil} (horário de Brasília).

${
  emailInvitado
    ? `Enviei o convite com link de videoconferência para o seu e-mail (${emailInvitado}).`
    : `Logo antes da reunião te envio o link de acesso por aqui.`
}

Um abraço e nos vemos em breve!`

  const handleCopiarMensaje = () => {
    navigator.clipboard.writeText(mensajeConfirmacionPT)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2500)
  }

  const handleGuardarEnPlataforma = async () => {
    if (!onSaveCita) return
    setSaving(true)
    try {
      await onSaveCita(
        horariosCalculados.startIso,
        `Reunión agendada: Presentación Manual 3D con ${prospecto.contacto_nombre} (${horaBrasil} BRT / ${horariosCalculados.horaColombia} COL)`
      )
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-xl rounded-2xl bg-surface-container border-2 border-primary/30 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Cabecera del Modal */}
        <div className="p-4 bg-gradient-to-r from-primary/20 via-surface-container-high to-surface-container border-b border-outline-variant/20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/20 text-primary flex items-center justify-center font-bold shadow-xs">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-on-surface flex items-center gap-2">
                <span>Agendar Cita B2B en Google Calendar</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/20 text-primary font-bold">
                  1-Clic
                </span>
              </h3>
              <p className="text-xs text-on-surface-variant flex items-center gap-1.5 flex-wrap">
                <span className="font-semibold text-on-surface">{prospecto.empresa}</span>
                <span>·</span>
                <span>{prospecto.contacto_nombre}</span>
                <span>·</span>
                <span className="text-[10px] text-primary bg-primary/10 border border-primary/20 px-1.5 py-0.2 rounded font-mono">
                  mariomojica.style@gmail.com
                </span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-on-surface-variant hover:bg-surface-container-highest transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Cuerpo del Modal */}
        <div className="p-4 space-y-4 overflow-y-auto flex-1 custom-scrollbar text-xs">
          {/* 1. Selector de Fecha y Hora con Conversión Automática Brasil <-> Colombia */}
          <div className="p-3 rounded-xl bg-surface-container-high/60 border border-outline-variant/20 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-on-surface flex items-center gap-1.5 text-xs">
                <Clock className="h-3.5 w-3.5 text-primary" />
                <span>Horario y Conversión de Husos Horarios</span>
              </span>
              <span className="text-[10px] text-amber-500 font-semibold bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                Brasil (+2h respecto a Colombia)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div>
                <label className="text-[10px] text-on-surface-variant block mb-1 font-semibold">
                  Fecha de la Reunión
                </label>
                <input
                  type="date"
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-surface-container border border-outline-variant/30 text-on-surface text-xs focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="text-[10px] text-on-surface-variant block mb-1 font-semibold">
                  Hora Brasil (BRT - UTC-3)
                </label>
                <input
                  type="time"
                  value={horaBrasil}
                  onChange={(e) => setHoraBrasil(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-surface-container border border-outline-variant/30 text-on-surface text-xs focus:outline-none focus:border-primary font-bold text-primary"
                />
              </div>

              <div>
                <label className="text-[10px] text-on-surface-variant block mb-1 font-semibold">
                  Duración
                </label>
                <select
                  value={duracionMin}
                  onChange={(e) => setDuracionMin(parseInt(e.target.value, 10))}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-surface-container border border-outline-variant/30 text-on-surface text-xs focus:outline-none focus:border-primary"
                >
                  <option value={15}>15 minutos (Micro-Demo)</option>
                  <option value={30}>30 minutos (Estándar)</option>
                  <option value={45}>45 minutos</option>
                  <option value={60}>1 hora</option>
                </select>
              </div>
            </div>

            {/* Comparativa Visual de Horas */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <div className="p-2 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-between">
                <span className="text-[11px] text-on-surface font-medium">🇧🇷 Hora del Cliente (Brasil):</span>
                <span className="text-xs font-bold text-primary">{horaBrasil} BRT</span>
              </div>

              <div className="p-2 rounded-lg bg-surface-container-highest/60 border border-outline-variant/20 flex items-center justify-between">
                <span className="text-[11px] text-on-surface font-medium">🇨🇴 Tu Hora (Colombia):</span>
                <span className="text-xs font-bold text-amber-500">{horariosCalculados.horaColombia} COL</span>
              </div>
            </div>
          </div>

          {/* 2. Correo del Invitado y Plataforma */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-on-surface-variant block mb-1 font-semibold flex items-center gap-1">
                <Mail className="h-3 w-3" />
                <span>Correo del Invitado (para enviar invite)</span>
              </label>
              <input
                type="email"
                value={emailInvitado}
                onChange={(e) => setEmailInvitado(e.target.value)}
                placeholder="ej: engenharia@empresa.com.br"
                className="w-full px-3 py-1.5 rounded-lg bg-surface-container-high border border-outline-variant/30 text-on-surface text-xs focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="text-[10px] text-on-surface-variant block mb-1 font-semibold flex items-center gap-1">
                <Video className="h-3 w-3" />
                <span>Plataforma de Videoconferencia</span>
              </label>
              <select
                value={plataforma}
                onChange={(e) => setPlataforma(e.target.value as any)}
                className="w-full px-3 py-1.5 rounded-lg bg-surface-container-high border border-outline-variant/30 text-on-surface text-xs focus:outline-none focus:border-primary"
              >
                <option value="Google Meet">Google Meet (Recomendado)</option>
                <option value="Microsoft Teams">Microsoft Teams</option>
                <option value="Zoom">Zoom</option>
              </select>
            </div>
          </div>

          {/* 3. Mensaje de Confirmación Listo para Copiar (Portugués) */}
          <div className="p-3 rounded-xl bg-surface-container-high/40 border border-outline-variant/20 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-primary flex items-center gap-1">
                <Sparkles className="h-3 w-3" />
                <span>Mensaje de Confirmación para WhatsApp / LinkedIn</span>
              </span>

              <button
                type="button"
                onClick={handleCopiarMensaje}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-surface-container hover:bg-primary/20 text-primary font-bold text-[10px] transition-colors cursor-pointer border border-primary/30"
              >
                {copiado ? (
                  <>
                    <Check className="h-3 w-3 text-emerald-500" />
                    <span className="text-emerald-500">Copiado</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3" />
                    <span>Copiar Mensaje PT</span>
                  </>
                )}
              </button>
            </div>

            <p className="text-[11px] text-on-surface-variant whitespace-pre-wrap bg-surface-container p-2.5 rounded-lg border border-outline-variant/15 font-sans leading-relaxed">
              {mensajeConfirmacionPT}
            </p>
          </div>
        </div>

        {/* Footer con Botones de Acción */}
        <div className="p-4 bg-surface-container-high/40 border-t border-outline-variant/20 flex flex-col sm:flex-row items-center justify-between gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-3 py-2 rounded-xl text-on-surface-variant hover:bg-surface-container-highest transition-colors font-semibold text-xs cursor-pointer"
          >
            Cerrar
          </button>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* Botón 1: Abrir en Google Calendar */}
            <a
              href={googleCalendarUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-surface-container border border-primary/40 text-primary hover:bg-primary/10 font-bold text-xs transition-colors cursor-pointer shadow-xs"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              <span>Abrir en Google Calendar</span>
            </a>

            {/* Botón 2: Guardar Cita en RAM de Ventas */}
            <button
              type="button"
              onClick={handleGuardarEnPlataforma}
              disabled={saving}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-xs hover:opacity-90 transition-opacity cursor-pointer shadow-sm disabled:opacity-50"
            >
              <Zap className="h-3.5 w-3.5" />
              <span>{saving ? "Guardando..." : "Registrar Cita en CRM"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
