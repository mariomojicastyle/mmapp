"use client";

import React from "react";
import { use3BFStore, PasoManualStudio } from "@/lib/store";
import { Boxes, Clock, Volume2, CheckCircle2 } from "lucide-react";

interface BloqueEstandarConfigSectionProps {
  pasoActivo: PasoManualStudio;
  botonActivoColor: string;
}

export default function BloqueEstandarConfigSection({
  pasoActivo,
  botonActivoColor,
}: BloqueEstandarConfigSectionProps) {
  const [guardandoBloque, setGuardandoBloque] = React.useState(false);
  const [mensajeBloque, setMensajeBloque] = React.useState<string | null>(null);

  const { actualizarPasoManual } = use3BFStore();

  const handleGuardarBloqueDisco = async () => {
    if (!pasoActivo || !pasoActivo.bloqueEstandar) return;
    setGuardandoBloque(true);
    try {
      const bloqueActualizado = {
        ...pasoActivo.bloqueEstandar,
        nombre: pasoActivo.titulo,
        duracion: pasoActivo.duracionTotal,
        descripcion: pasoActivo.descripcion,
        guionEs: pasoActivo.guionEs,
        guionPt: pasoActivo.guionPt,
        guionEn: pasoActivo.guionEn,
      };
      const res = await fetch("/api/bloques", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bloqueActualizado),
      });
      if (res.ok) {
        setMensajeBloque("¡Guardado en disco!");
        use3BFStore.getState().cargarBloquesEstandar();
      } else {
        setMensajeBloque("Error al guardar");
      }
    } catch {
      setMensajeBloque("Error conexión");
    } finally {
      setGuardandoBloque(false);
      setTimeout(() => setMensajeBloque(null), 3500);
    }
  };

  return (
          <div className="flex flex-col gap-3">
            {/* Tarjeta de Información y Configuración del Bloque Estándar */}
            <div className="flex flex-col gap-3 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm">
              {/* Encabezado con Insignia de Bloque Estándar */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span
                    style={{ backgroundColor: botonActivoColor }}
                    className="text-white text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0"
                  >
                    {pasoActivo.id}
                  </span>
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border border-cyan-500/20 flex items-center gap-1">
                    <Boxes className="w-3 h-3 text-cyan-500 shrink-0" />
                    <span>Bloque Estándar Reutilizable</span>
                  </span>
                  {pasoActivo.bloqueEstandar?.categoriaMarca && (
                    <span className="text-[9.5px] font-medium px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      {pasoActivo.bloqueEstandar.categoriaMarca}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  <span className="text-[10px] font-mono opacity-60 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {pasoActivo.duracionTotal}s
                  </span>
                </div>
              </div>

              {/* Título y Descripción del Bloque */}
              <div className="flex items-start gap-3 pt-1">
                {pasoActivo.bloqueEstandar?.thumbnail && (
                  <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shrink-0 p-1 flex items-center justify-center shadow-inner">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={pasoActivo.bloqueEstandar.thumbnail}
                      alt={pasoActivo.titulo}
                      className="w-full h-full object-contain"
                    />
                  </div>
                )}
                <div className="flex-1 min-w-0 flex flex-col gap-1">
                  <span className="font-bold text-xs text-slate-800 dark:text-slate-100">
                    {pasoActivo.titulo}
                  </span>
                  <p className="text-[10.5px] text-slate-500 dark:text-slate-400 leading-relaxed">
                    {pasoActivo.descripcion || pasoActivo.bloqueEstandar?.descripcion}
                  </p>
                </div>
              </div>

              {/* Control de Duración en Segundos */}
              <div className="flex flex-col gap-1.5 p-2.5 rounded-xl border border-slate-200/70 dark:border-slate-800/70 bg-black/[0.02] dark:bg-white/[0.02]">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-700 dark:text-slate-300 text-[10.5px] flex items-center gap-1.5">
                    <Clock className="w-3 h-3 text-cyan-600 dark:text-cyan-400" /> Duración del Paso:
                  </span>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min={2}
                      max={300}
                      step={0.5}
                      value={pasoActivo.duracionTotal}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        actualizarPasoManual(pasoActivo.id, {
                          duracionTotal: isNaN(val) ? 8.0 : val,
                          duracionAudioSegundos: isNaN(val) ? 8.0 : val,
                        });
                      }}
                      className="w-14 px-1.5 py-0.5 rounded-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono font-bold text-cyan-600 dark:text-cyan-400 text-right text-[10.5px] outline-none focus:border-cyan-500 shadow-inner"
                    />
                    <span className="font-mono text-[10px] opacity-60">seg</span>
                  </div>
                </div>
                <input
                  type="range"
                  min={3}
                  max={Math.max(120, Math.ceil((pasoActivo.duracionTotal || 60) * 1.2))}
                  step={0.5}
                  value={pasoActivo.duracionTotal}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    actualizarPasoManual(pasoActivo.id, {
                      duracionTotal: val,
                      duracionAudioSegundos: val,
                    });
                  }}
                  className="accent-cyan-600 h-1.5 cursor-pointer w-full"
                />
              </div>

              {/* Guiones de Locución Multilingüe TTS */}
              <div className="flex flex-col gap-2 p-2.5 rounded-xl border border-slate-200/70 dark:border-slate-800/70 bg-black/[0.02] dark:bg-white/[0.02]">
                <span className="font-bold text-[10px] uppercase tracking-wider text-slate-400 flex items-center gap-1">
                  <Volume2 className="w-3 h-3 text-cyan-600" /> Locución TTS Multilingüe
                </span>

                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-300">
                    Español (ES):
                  </span>
                  <input
                    type="text"
                    value={pasoActivo.guionEs || ""}
                    onChange={(e) => actualizarPasoManual(pasoActivo.id, { guionEs: e.target.value })}
                    className="px-2.5 py-1 rounded-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-[10.5px] outline-none focus:border-cyan-500 shadow-inner"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-300">
                    Português (PT-BR):
                  </span>
                  <input
                    type="text"
                    value={pasoActivo.guionPt || ""}
                    onChange={(e) => actualizarPasoManual(pasoActivo.id, { guionPt: e.target.value })}
                    className="px-2.5 py-1 rounded-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-[10.5px] outline-none focus:border-cyan-500 shadow-inner"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-300">
                    English (EN):
                  </span>
                  <input
                    type="text"
                    value={pasoActivo.guionEn || ""}
                    onChange={(e) => actualizarPasoManual(pasoActivo.id, { guionEn: e.target.value })}
                    className="px-2.5 py-1 rounded-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-[10.5px] outline-none focus:border-cyan-500 shadow-inner"
                  />
                </div>
              </div>

              {/* Partes GLB 3D del Bloque */}
              <div className="flex flex-col gap-1.5 p-2.5 rounded-xl border border-slate-200/70 dark:border-slate-800/70 bg-black/[0.02] dark:bg-white/[0.02]">
                <span className="font-bold text-[10px] uppercase tracking-wider text-slate-400 flex items-center gap-1">
                  <Boxes className="w-3 h-3 text-cyan-600" /> Partes 3D GLB ({pasoActivo.bloqueEstandar?.partesGlb?.length || 0})
                </span>
                <div className="grid grid-cols-2 gap-1.5 pt-1">
                  {(pasoActivo.bloqueEstandar?.partesGlb || []).map((parte) => (
                    <div
                      key={parte.id}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[10px]"
                    >
                      <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
                      <span className="font-semibold truncate">{parte.nombre || parte.id}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Botón Guardar Cambios en Bloque (.3bb.json) */}
              <button
                type="button"
                disabled={guardandoBloque}
                onClick={handleGuardarBloqueDisco}
                style={{ backgroundColor: botonActivoColor }}
                className="w-full py-2 px-3 rounded-full text-white font-bold flex items-center justify-center gap-2 shadow-sm hover:opacity-90 active:scale-95 transition text-xs select-none cursor-pointer disabled:opacity-50"
              >
                {guardandoBloque ? (
                  <span>Guardando en disco...</span>
                ) : (
                  <>
                    <Boxes className="w-3.5 h-3.5" />
                    <span>{mensajeBloque || "Guardar Cambios en Bloque (.3bb.json)"}</span>
                  </>
                )}
              </button>


            </div>
          </div>
  );
}
