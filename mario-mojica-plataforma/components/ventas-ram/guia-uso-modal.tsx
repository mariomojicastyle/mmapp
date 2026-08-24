"use client"

import React, { useState } from "react"
import {
  HelpCircle,
  X,
  Sparkles,
  Mic,
  Copy,
  Send,
  Flame,
  Clock,
  ShieldCheck,
  Zap,
  BookOpen,
  MessageSquare,
  CheckCircle2,
  BrainCircuit,
  Users,
} from "lucide-react"

interface GuiaUsoModalProps {
  isOpen: boolean
  onClose: () => void
}

export function GuiaUsoModal({ isOpen, onClose }: GuiaUsoModalProps) {
  const [activeTab, setActiveTab] = useState<"flujo" | "reglas" | "termometro" | "consejos">("flujo")

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-2xl max-h-[90vh] bg-surface-container-high border border-outline-variant/30 rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header del Modal */}
        <div className="p-5 border-b border-outline-variant/20 flex items-center justify-between bg-surface-container-highest/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold shadow-xs">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-on-surface flex items-center gap-2">
                <span>Manual de Operación — RAM de Ventas</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/15 text-primary font-bold uppercase tracking-wider">
                  Guía Rápida
                </span>
              </h2>
              <p className="text-xs text-on-surface-variant">
                Cómo co-crear respuestas de alto impacto en &lt; 60 segundos y gestionar el CRM B2B.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
            title="Cerrar guía"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Barra de Pestañas de Navegación */}
        <div className="px-5 pt-3 pb-2 border-b border-outline-variant/15 flex items-center gap-1.5 overflow-x-auto shrink-0 bg-surface-container/40">
          <button
            onClick={() => setActiveTab("flujo")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === "flujo"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high"
            }`}
          >
            <Zap className="h-3.5 w-3.5" />
            <span>1. Flujo en 4 Pasos</span>
          </button>

          <button
            onClick={() => setActiveTab("reglas")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === "reglas"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high"
            }`}
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>2. Reglas de Oro</span>
          </button>

          <button
            onClick={() => setActiveTab("termometro")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === "termometro"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high"
            }`}
          >
            <Flame className="h-3.5 w-3.5 text-amber-500" />
            <span>3. Termómetro & Radar</span>
          </button>

          <button
            onClick={() => setActiveTab("consejos")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === "consejos"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high"
            }`}
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>4. Co-Creación IA</span>
          </button>
        </div>

        {/* Contenido con Scroll Independiente */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs text-on-surface">
          {/* TAB 1: FLUJO EN 4 PASOS */}
          {activeTab === "flujo" && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="p-3.5 rounded-2xl bg-primary/10 border border-primary/20 space-y-1">
                <p className="font-bold text-primary text-xs flex items-center gap-1.5">
                  <BrainCircuit className="h-4 w-4" />
                  <span>El Propósito Principal</span>
                </p>
                <p className="text-[11px] text-on-surface-variant leading-relaxed">
                  El RAM de Ventas no es un archivo estático ni un CRM tradicional aburrido. Es un <strong>copiloto en vivo</strong> diseñado para que cualquier persona del equipo responda mensajes de clientes en Brasil y Latam con máxima agilidad, contexto total y portugués nativo perfecto.
                </p>
              </div>

              <div className="space-y-3">
                {/* Paso 1 */}
                <div className="p-3.5 rounded-2xl bg-surface-container border border-outline-variant/25 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-primary flex items-center gap-2">
                      <span className="h-5 w-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[10px]">1</span>
                      <span>Ingresa la Entrada (Captura o Texto)</span>
                    </span>
                    <span className="text-[10px] text-on-surface-variant font-mono">WhatsApp / LinkedIn</span>
                  </div>
                  <p className="text-[11px] text-on-surface-variant leading-relaxed pl-7">
                    Arrastra una captura de pantalla del chat o pega el texto que te respondió el cliente en la pestaña <em>"Analizar & Archivar Evento"</em>. El analizador identificará automáticamente quién es, la empresa y el tono.
                  </p>
                </div>

                {/* Paso 2 */}
                <div className="p-3.5 rounded-2xl bg-surface-container border border-outline-variant/25 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-primary flex items-center gap-2">
                      <span className="h-5 w-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[10px]">2</span>
                      <span>Dicta el Enfoque por Voz 🎙️ o Texto</span>
                    </span>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">Sin escribir</span>
                  </div>
                  <p className="text-[11px] text-on-surface-variant leading-relaxed pl-7">
                    Usa el botón de micrófono en la parte superior para indicarle el ángulo deseado en español (ej: <em>"Dile que el miércoles a las 2 pm podemos vernos y que el piloto 3D es sin costo"</em>).
                  </p>
                </div>

                {/* Paso 3 */}
                <div className="p-3.5 rounded-2xl bg-surface-container border border-outline-variant/25 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-primary flex items-center gap-2">
                      <span className="h-5 w-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[10px]">3</span>
                      <span>Audita en Español y Copia en Português</span>
                    </span>
                    <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-md font-bold">1 Clic</span>
                  </div>
                  <p className="text-[11px] text-on-surface-variant leading-relaxed pl-7">
                    Antigravity genera dos bloques: el texto en <strong>Português do Brasil</strong> listo para enviar y la <strong>traducción exacta en Español</strong> para que sepas qué se está proponiendo antes de pegarlo en WhatsApp.
                  </p>
                </div>

                {/* Paso 4 */}
                <div className="p-3.5 rounded-2xl bg-surface-container border border-outline-variant/25 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-primary flex items-center gap-2">
                      <span className="h-5 w-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[10px]">4</span>
                      <span>Guarda el Mensaje en el Hilo</span>
                    </span>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">Memoria Activa</span>
                  </div>
                  <p className="text-[11px] text-on-surface-variant leading-relaxed pl-7">
                    Presiona el botón verde <strong>"Guardar Mensaje Enviado en el Hilo"</strong>. De esta manera, cuando el cliente responda en 3 días o 2 semanas, el sistema recordará con exactitud matemática qué le prometiste.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: REGLAS DE ORO */}
          {activeTab === "reglas" && (
            <div className="space-y-3.5 animate-in fade-in duration-150">
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-1">
                <p className="font-bold text-amber-700 dark:text-amber-300 text-xs flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4" />
                  <span>Principios Innegociables del RAM de Ventas</span>
                </p>
                <p className="text-[11px] text-on-surface-variant leading-relaxed">
                  Para que la memoria nunca falle ni se degrade la calidad de las respuestas, todo operador debe respetar estas 3 reglas:
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3">
                <div className="p-3.5 rounded-2xl bg-surface-container border border-outline-variant/20 space-y-1">
                  <p className="font-bold text-on-surface text-xs flex items-center gap-1.5">
                    <span>🛑 1. Prohibido Resumir o Podar Información</span>
                  </p>
                  <p className="text-[11px] text-on-surface-variant leading-relaxed">
                    El gran activo del RAM es el <strong>contexto profundo</strong>. Siempre registra los nombres de los jefes, padrinos B2B que hicieron el puente, los modelos de muebles discutidos, cotizaciones enviadas y compromisos de fechas.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-surface-container border border-outline-variant/20 space-y-1">
                  <p className="font-bold text-on-surface text-xs flex items-center gap-1.5">
                    <span>⚡ 2. Velocidad de Respuesta (&lt; 60 Segundos)</span>
                  </p>
                  <p className="text-[11px] text-on-surface-variant leading-relaxed">
                    Cuando un director en Brasil responde, está conectado en ese instante. Generar la respuesta en menos de un minuto aumenta drásticamente la tasa de agendamiento de videollamadas.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-surface-container border border-outline-variant/20 space-y-1">
                  <p className="font-bold text-on-surface text-xs flex items-center gap-1.5">
                    <span>🤝 3. Construcción Social y Co-Creación</span>
                  </p>
                  <p className="text-[11px] text-on-surface-variant leading-relaxed">
                    El copiloto propone una respuesta inicial, pero tú eres el estratega humano. Usa la caja de refinamiento por voz para sugerir adaptaciones hasta que el mensaje quede impecable.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: TERMÓMETRO & RADAR */}
          {activeTab === "termometro" && (
            <div className="space-y-3.5 animate-in fade-in duration-150">
              <p className="text-[11px] text-on-surface-variant">
                El CRM clasifica automáticamente a cada fábrica según su estado en el embudo comercial:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/25 space-y-1">
                  <p className="font-bold text-rose-700 dark:text-rose-300 flex items-center justify-between text-xs">
                    <span>🔥 Caliente</span>
                    <span className="text-[9px] uppercase tracking-wider font-extrabold px-1.5 py-0.2 rounded bg-rose-500/20">Prioridad 1</span>
                  </p>
                  <p className="text-[10px] text-on-surface-variant leading-snug">
                    Ha pedido reunión, precios o está evaluando el piloto 3D. Responder en &lt; 2 horas.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 space-y-1">
                  <p className="font-bold text-amber-700 dark:text-amber-300 flex items-center justify-between text-xs">
                    <span>🟡 Tibio</span>
                    <span className="text-[9px] uppercase tracking-wider font-extrabold px-1.5 py-0.2 rounded bg-amber-500/20">Prioridad 2</span>
                  </p>
                  <p className="text-[10px] text-on-surface-variant leading-snug">
                    Aceptó conexión o facilitó correos internos de P&D. Enviar caso de estudio y ahorro del 30%.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/25 space-y-1">
                  <p className="font-bold text-blue-700 dark:text-blue-300 flex items-center justify-between text-xs">
                    <span>❄️ Enfriando</span>
                    <span className="text-[9px] uppercase tracking-wider font-extrabold px-1.5 py-0.2 rounded bg-blue-500/20">Seguimiento</span>
                  </p>
                  <p className="text-[10px] text-on-surface-variant leading-snug">
                    Sin respuesta en 5+ días. Enviar un recordatorio suave con enlace interactivo directo.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/25 space-y-1">
                  <p className="font-bold text-purple-700 dark:text-purple-300 flex items-center justify-between text-xs">
                    <span>⏸️ Pausado</span>
                    <span className="text-[9px] uppercase tracking-wider font-extrabold px-1.5 py-0.2 rounded bg-purple-500/20">Futuro</span>
                  </p>
                  <p className="text-[10px] text-on-surface-variant leading-snug">
                    En ciclo presupuestal futuro o cambio de cargo. Dejar la puerta abierta para el próximo trimestre.
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-surface-container border border-outline-variant/20 flex items-center gap-2 text-[11px] text-on-surface-variant">
                <Clock className="h-4 w-4 text-primary shrink-0" />
                <span>El <strong>Radar Táctico</strong> arriba te avisa cuántas alertas de seguimiento vencen hoy o esta semana.</span>
              </div>
            </div>
          )}

          {/* TAB 4: CO-CREACIÓN IA */}
          {activeTab === "consejos" && (
            <div className="space-y-3.5 animate-in fade-in duration-150">
              <div className="p-3.5 rounded-2xl bg-surface-container border border-outline-variant/25 space-y-2">
                <p className="font-bold text-on-surface text-xs flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <span>Fórmulas de Refinamiento Rápido</span>
                </p>
                <p className="text-[11px] text-on-surface-variant leading-relaxed">
                  Cuando uses el chat de refinamiento o el micrófono, puedes pedir ajustes como estos:
                </p>
                <ul className="space-y-1.5 text-[11px] text-on-surface-variant pl-2">
                  <li className="flex items-start gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                    <span><em>"Hazlo más corto y directo al grano para WhatsApp."</em></span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                    <span><em>"Dile que el piloto 3D es 100% gratuito sobre 1 mueble de su catálogo."</em></span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                    <span><em>"Menciona que garantizamos un 30% de ahorro frente a sus costos de diseño."</em></span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                    <span><em>"Propón vernos el jueves a las 10:00 AM hora de Brasilia."</em></span>
                  </li>
                </ul>
              </div>

              <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 space-y-1">
                <p className="font-bold text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-1.5">
                  <Users className="h-4 w-4" />
                  <span>Sincronización Dual (Web + Antigravity)</span>
                </p>
                <p className="text-[11px] text-on-surface-variant leading-relaxed">
                  Puedes operar desde esta interfaz web o directamente en la sesión de Antigravity en código. Ambos entornos leen y escriben sobre la misma base de datos en Supabase y el mismo archivo <code className="bg-surface-container px-1 py-0.5 rounded text-[10px] font-mono">RAM_de_ventas.md</code>.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer del Modal */}
        <div className="p-4 border-t border-outline-variant/20 flex items-center justify-between bg-surface-container-highest/40 shrink-0">
          <span className="text-[10px] text-on-surface-variant flex items-center gap-1">
            <ShieldCheck className="h-3 w-3 text-primary" />
            <span>Memoria Activa & Plataforma B2B Mario Mojica</span>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-primary text-xs font-bold text-primary-foreground hover:opacity-90 transition-opacity cursor-pointer shadow-xs"
          >
            Entendido, ¡a prospectar! 🚀
          </button>
        </div>
      </div>
    </div>
  )
}
