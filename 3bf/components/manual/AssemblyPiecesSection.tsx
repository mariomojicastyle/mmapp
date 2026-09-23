"use client";

import React from "react";
import { use3BFStore, PasoManualStudio } from "@/lib/store";
import {
  ChevronDown,
  Pipette,
  Eraser,
  Eye,
  EyeOff,
  Trash2,
  Layers,
  Hammer,
  X,
  RotateCw,
} from "lucide-react";
import { extraerPiezaMadre, esHerrajeNombre } from "@/lib/piezaMadreUtils";
import { obtenerColorSubbloque } from "./SubbloquesManagerSection";
import {
  IconOcultarMostrar,
  IconOcultarMostrarInvertido,
} from "./StepManagerIcons";


interface AssemblyPiecesSectionProps {
  pasoActivo: PasoManualStudio;
  botonActivoColor: string;
  tablerosPasoActivo: string[];
}

export default function AssemblyPiecesSection({
  pasoActivo,
  botonActivoColor,
  tablerosPasoActivo,
}: AssemblyPiecesSectionProps) {
  const [seccionPiezasColapsada, setSeccionPiezasColapsada] = React.useState(false);
  const [mostrarMenuHeredados, setMostrarMenuHeredados] = React.useState(false);
  const menuHeredadosRef = React.useRef<HTMLDivElement>(null);

  const {
    pasosManual,
    eliminarPasoManual,
    actualizarPasoManual,
    desasignarPiezaDePasoManual,
    desasignarHerrajeDePasoManual,
    conmutarVisibilidadPiezasPaso,
    conmutarOcultarNoAsignadasPaso,
    asociarBloqueHeredado,
    desasociarBloqueHeredado,
    conmutarVisibilidadBloqueHeredado,
    modoPickingManual,
    iniciarPickingManual,
    limpiarPickingManual,
    resultado,
  } = use3BFStore();

  // Cerrar menú de bloques heredados al hacer clic fuera
  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuHeredadosRef.current && !menuHeredadosRef.current.contains(e.target as Node)) {
        setMostrarMenuHeredados(false);
      }
    };
    if (mostrarMenuHeredados) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [mostrarMenuHeredados]);

  const idPasoLimpio = pasoActivo.id.startsWith("P") ? pasoActivo.id : `P${String(pasoActivo.numero ?? "").padStart(2, "0")}`;
  const tituloFijo = `Bloque de armado ${idPasoLimpio}`;
  const totalComponentes = (pasoActivo.piezasAsignadas || []).length + (pasoActivo.herrajesAsignados || []).length;

  // Pasos anteriores elegibles para ser heredados
  const pasosPreviosDisponibles = React.useMemo(() => {
    if (!pasoActivo) return [];
    const indexActual = pasosManual.findIndex((p) => p.id === pasoActivo.id);
    if (indexActual <= 0) return [];
    return pasosManual.slice(1, indexActual).filter((p) => {
      const tienePiezas = (p.piezasAsignadas?.length || 0) > 0 || (p.herrajesAsignados?.length || 0) > 0;
      return tienePiezas && p.tipo !== "showcase";
    });
  }, [pasosManual, pasoActivo]);

  const bloquesHeredadosIds = pasoActivo.bloquesHeredadosIds || [];
  const bloquesHeredadosActivos = React.useMemo(() => {
    return pasosManual.filter((p) => bloquesHeredadosIds.includes(p.id));
  }, [pasosManual, bloquesHeredadosIds]);

  return (
    <div className="flex flex-col gap-2.5 w-full">
      {/* Fila 1: Título con botón circular interactivo + Menú Bloques Heredados */}
      <div className="flex items-center justify-between w-full select-none py-0.5 relative">
        <div
          onClick={() => setSeccionPiezasColapsada(!seccionPiezasColapsada)}
          className="flex items-center gap-2 cursor-pointer group"
          title={seccionPiezasColapsada ? "Expandir Bloque de armado" : "Retraer Bloque de armado"}
        >
          {/* Círculo con flechita que rota 180° */}
          <div className="w-5 h-5 rounded-full border border-cyan-500/40 dark:border-cyan-400/40 bg-cyan-500/10 dark:bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:bg-cyan-500/20 shadow-2xs">
            <ChevronDown
              className={`w-3.5 h-3.5 transition-transform duration-300 ${
                seccionPiezasColapsada ? "-rotate-180" : "rotate-0"
              }`}
            />
          </div>
          <span className="font-bold text-xs text-slate-800 dark:text-slate-100 group-hover:text-cyan-700 dark:group-hover:text-cyan-300 transition-colors">
            {tituloFijo}
          </span>
        </div>

        {/* Lado derecho: Botón Desplegable de Bloques Heredados y contador */}
        <div className="flex items-center gap-2" ref={menuHeredadosRef}>
          {pasosPreviosDisponibles.length > 0 && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setMostrarMenuHeredados(!mostrarMenuHeredados)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border transition-all cursor-pointer shadow-2xs ${
                  bloquesHeredadosIds.length > 0
                    ? "bg-indigo-500/15 border-indigo-400/60 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-500/25"
                    : "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-300"
                }`}
                title="Heredar sub-ensambles armados en pasos anteriores"
              >
                <Layers className="w-3 h-3 text-indigo-500" />
                <span>Bloques heredados</span>
                {bloquesHeredadosIds.length > 0 && (
                  <span className="w-4 h-4 rounded-full bg-indigo-600 text-white text-[9px] flex items-center justify-center font-bold">
                    {bloquesHeredadosIds.length}
                  </span>
                )}
                <ChevronDown className={`w-3 h-3 transition-transform ${mostrarMenuHeredados ? "rotate-180" : ""}`} />
              </button>

              {/* Popover / Menú desplegable de selección múltiple */}
              {mostrarMenuHeredados && (
                <div className="absolute right-0 top-full mt-1.5 w-64 p-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl z-50 flex flex-col gap-1.5 animate-in fade-in-50 zoom-in-95">
                  <div className="flex items-center justify-between pb-1.5 border-b border-slate-100 dark:border-slate-800 text-[11px] font-bold text-slate-800 dark:text-slate-100 px-1">
                    <span className="flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-indigo-500" />
                      <span>Heredar Paso Armado</span>
                    </span>
                    <span className="text-[9px] font-mono text-slate-400 font-normal">
                      Sub-ensambles
                    </span>
                  </div>

                  <div className="flex flex-col gap-1 max-h-48 overflow-y-auto custom-scrollbar">
                    {pasosPreviosDisponibles.map((prev) => {
                      const yaAsociado = bloquesHeredadosIds.includes(prev.id);
                      const cantPiezas = prev.piezasAsignadas?.length || 0;
                      const cantHw = prev.herrajesAsignados?.length || 0;

                      return (
                        <div
                          key={prev.id}
                          onClick={() => {
                            if (yaAsociado) {
                              desasociarBloqueHeredado(pasoActivo.id, prev.id);
                            } else {
                              asociarBloqueHeredado(pasoActivo.id, prev.id);
                            }
                          }}
                          className={`flex items-center justify-between p-2 rounded-xl border text-xs cursor-pointer transition-all select-none ${
                            yaAsociado
                              ? "bg-indigo-50/80 dark:bg-indigo-950/40 border-indigo-300 dark:border-indigo-700/80 text-indigo-900 dark:text-indigo-200 font-semibold"
                              : "hover:bg-slate-50 dark:hover:bg-slate-800/60 border-transparent text-slate-700 dark:text-slate-300"
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <input
                              type="checkbox"
                              checked={yaAsociado}
                              onChange={() => {}} // Manejado por el clic del contenedor
                              className="rounded cursor-pointer accent-indigo-600 w-3.5 h-3.5 shrink-0"
                            />
                            <div className="flex flex-col min-w-0">
                              <span className="text-xs font-bold truncate">
                                {prev.id} - {prev.titulo || "Sin título"}
                              </span>
                              <span className="text-[9.5px] text-slate-400 dark:text-slate-500 font-mono">
                                {cantPiezas} {cantPiezas === 1 ? "madera" : "maderas"} · {cantHw} herrajes
                              </span>
                            </div>
                          </div>
                          {yaAsociado && (
                            <span className="px-1.5 py-0.5 rounded-full bg-indigo-600 text-white text-[8.5px] font-bold shrink-0">
                              Heredado
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {totalComponentes > 0 && (
            <span className="text-[9px] font-semibold text-slate-400 dark:text-slate-500 font-mono">
              {totalComponentes} {totalComponentes === 1 ? "comp." : "comps."}
            </span>
          )}
        </div>
      </div>

      {/* Cápsulas de Bloques Heredados Activos (Chips con visibilidad y botón quitar) */}
      {bloquesHeredadosActivos.length > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
          {bloquesHeredadosActivos.map((b) => {
            const estaVisible = pasoActivo.bloquesHeredadosVisibles?.[b.id] !== false;
            const cantPz = b.piezasAsignadas?.length || 0;
            const cantHw = b.herrajesAsignados?.length || 0;

            return (
              <div
                key={b.id}
                className={`flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 rounded-full border text-[10px] font-semibold transition-all shadow-2xs ${
                  estaVisible
                    ? "bg-indigo-50 dark:bg-indigo-950/40 border-indigo-300 dark:border-indigo-800 text-indigo-800 dark:text-indigo-200"
                    : "bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-400 dark:text-slate-500 opacity-60"
                }`}
                title={`Bloque Heredado ${b.id}: Contiene ${cantPz} piezas y ${cantHw} herrajes ensamblados`}
              >
                <Layers className="w-3 h-3 text-indigo-500 shrink-0" />
                <span className="font-bold">{b.id}</span>
                <span className="text-[9px] font-mono text-slate-400 font-normal">
                  ({cantPz}p/{cantHw}h)
                </span>

                {/* Botón Ojito para Ocultar/Mostrar el bloque heredado completo */}
                <button
                  type="button"
                  onClick={() => conmutarVisibilidadBloqueHeredado(pasoActivo.id, b.id)}
                  className="w-4 h-4 rounded-full flex items-center justify-center hover:bg-indigo-200/50 dark:hover:bg-indigo-900/50 transition cursor-pointer"
                  title={estaVisible ? "Ocultar este bloque heredado en el 3D" : "Mostrar este bloque heredado en el 3D"}
                >
                  {estaVisible ? (
                    <Eye className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                  ) : (
                    <EyeOff className="w-3 h-3 text-slate-400" />
                  )}
                </button>

                {/* Botón Desvincular Bloque Heredado */}
                <button
                  type="button"
                  onClick={() => desasociarBloqueHeredado(pasoActivo.id, b.id)}
                  className="w-4 h-4 rounded-full flex items-center justify-center hover:bg-rose-100 dark:hover:bg-rose-950/50 text-slate-400 hover:text-rose-600 transition cursor-pointer"
                  title="Desvincular este bloque heredado de este paso"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            );
          })}
        </div>
      )}

                    {/* Contenido Retráctil: Botones de Acción + Tableros y Herrajes */}
                    {!seccionPiezasColapsada && (
                      <div className="flex flex-col gap-2.5 pt-0.5">
                        {/* Fila 2: Botones de Acción (Tocar en 3D, Retirar, Ojito, Invert y Tarrito de Basura) */}
                        <div className="flex items-center gap-1.5 w-full flex-wrap">
                          {/* 1. Botón Circular Oficial: Ocultar / Mostrar (El Bombillo) */}
                          <button
                            type="button"
                            onClick={() => {
                              if (modoPickingManual.activo && modoPickingManual.modo === "agregar" && modoPickingManual.pasoId === pasoActivo.id && !modoPickingManual.grupoId) {
                                limpiarPickingManual();
                              } else {
                                iniciarPickingManual(pasoActivo.id, null, "agregar");
                              }
                            }}
                            title={
                              modoPickingManual.activo && modoPickingManual.modo === "agregar" && modoPickingManual.pasoId === pasoActivo.id && !modoPickingManual.grupoId
                                ? "Bombillo apagado (Gris): Cada pieza o herraje que toques en 3D se oculta y queda dentro de este bloque de armado. Clic para encender."
                                : "Bombillo encendido (Amarillo): Todo el mueble se muestra en 3D. Clic para apagar y ocultar piezas tocándolas."
                            }
                            className={`w-[30px] h-[30px] flex items-center justify-center rounded-full transition shrink-0 cursor-pointer border shadow-2xs ${
                              !(modoPickingManual.activo && modoPickingManual.modo === "agregar" && modoPickingManual.pasoId === pasoActivo.id && !modoPickingManual.grupoId)
                                ? "bg-amber-400/20 text-amber-500 border-amber-400/50 hover:bg-amber-400/30"
                                : "bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-300 dark:border-slate-700 hover:text-slate-200"
                            }`}
                          >
                            <IconOcultarMostrar
                              className="w-4 h-4"
                              encendido={
                                !(modoPickingManual.activo && modoPickingManual.modo === "agregar" && modoPickingManual.pasoId === pasoActivo.id && !modoPickingManual.grupoId)
                              }
                            />
                          </button>

                          {/* 2. Botón Circular Oficial: Invertir (Completamente independiente) */}
                          <button
                            type="button"
                            onClick={() => conmutarOcultarNoAsignadasPaso(pasoActivo.id)}
                            title={
                              pasoActivo.ocultarNoAsignadas
                                ? "Invertir Activo: Mostrando únicamente las piezas asignadas a este bloque. Clic para volver a ver el mueble completo."
                                : "Invertir: Oculta el resto del mueble y deja visibles únicamente las piezas de este bloque."
                            }
                            className={`w-[30px] h-[30px] flex items-center justify-center rounded-full transition shrink-0 cursor-pointer border shadow-2xs ${
                              pasoActivo.ocultarNoAsignadas
                                ? "bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 border-cyan-400 shadow-sm ring-2 ring-cyan-500/30"
                                : "bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                            }`}
                          >
                            <IconOcultarMostrarInvertido
                              className="w-4 h-4"
                              activo={Boolean(pasoActivo.ocultarNoAsignadas)}
                            />
                          </button>

                          {/* 3. Botón Cápsula Retirar (Exclusivo para expulsar piezas o herrajes tocándolos) */}
                          <button
                            type="button"
                            onClick={() => {
                              if (
                                modoPickingManual.activo &&
                                modoPickingManual.pasoId === pasoActivo.id &&
                                !modoPickingManual.grupoId &&
                                modoPickingManual.modo === "retirar"
                              ) {
                                limpiarPickingManual();
                              } else {
                                iniciarPickingManual(pasoActivo.id, null, "retirar");
                              }
                            }}
                            title="Retirar: Si seleccionaste una pieza por error, presiona aquí y tócala en 3D o en su cápsula para expulsarla de este bloque de armado"
                            className={`h-[30px] px-3 flex items-center justify-center gap-1.5 rounded-full transition shrink-0 font-bold text-[10px] border shadow-2xs cursor-pointer ${
                              modoPickingManual.activo &&
                              modoPickingManual.pasoId === pasoActivo.id &&
                              !modoPickingManual.grupoId &&
                              modoPickingManual.modo === "retirar"
                                ? "bg-rose-600 text-white border-rose-500 shadow-md ring-2 ring-rose-400/40 animate-pulse"
                                : "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30 hover:bg-rose-500/20"
                            }`}
                          >
                            <Eraser className="w-3.5 h-3.5" />
                            <span>
                              {modoPickingManual.activo &&
                              modoPickingManual.pasoId === pasoActivo.id &&
                              !modoPickingManual.grupoId &&
                              modoPickingManual.modo === "retirar"
                                ? "Retirando 3D..."
                                : "Retirar"}
                            </span>
                          </button>

                          {/* 4. Tarrito de Basura al Final */}
                          {pasosManual.length > 1 && pasoActivo.id !== "P00" && (
                            <button
                              type="button"
                              onClick={() => eliminarPasoManual(pasoActivo.id)}
                              title="Eliminar este bloque de armado"
                              className="p-1.5 rounded-full text-rose-500 hover:bg-rose-500/10 transition shrink-0 cursor-pointer ml-auto"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>

                        {/* Piezas Asignadas (Tableros y Herrajes limpios sin cabecera redundante) */}
                        {((pasoActivo.piezasAsignadas || []).length > 0 || (pasoActivo.herrajesAsignados || []).length > 0) ? (
                          <div className="flex flex-col gap-2 pt-2 border-t border-slate-200/50 dark:border-slate-800/50">
                            {/* Tableros de Madera */}
                            {(pasoActivo.piezasAsignadas || []).length > 0 && (
                              <div className="flex flex-col gap-1">
                                <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                  <Layers className="w-2.5 h-2.5 text-amber-600" /> Tableros ({pasoActivo.piezasAsignadas.length})
                                </span>
                                <div className="flex flex-wrap gap-1">
                                  {pasoActivo.piezasAsignadas.map((pz) => {
                                    const pmLimpia = extraerPiezaMadre(pz);
                                    const subAsignado = (pasoActivo.subbloques || []).find((s) =>
                                      s.piezas.some((sp) => sp === pz || extraerPiezaMadre(sp) === pmLimpia)
                                    );
                                    return (
                                      <span
                                        key={pz}
                                        style={{ borderColor: botonActivoColor }}
                                        className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9.5px] font-semibold bg-cyan-500/10 text-cyan-800 dark:text-cyan-200 border"
                                      >
                                        <span className="truncate max-w-[140px]">{pmLimpia}</span>
                                        {subAsignado && (() => {
                                          const sIdx = (pasoActivo.subbloques || []).findIndex((s) => s.id === subAsignado.id);
                                          const colorSub = obtenerColorSubbloque(sIdx >= 0 ? sIdx : 0);
                                          return (
                                            <span
                                              className="px-1.5 py-0.5 rounded-full text-white font-black text-[8px] flex items-center justify-center shrink-0 shadow-xs"
                                              style={{ backgroundColor: colorSub.bg }}
                                              title={`Asignado a ${subAsignado.nombre}`}
                                            >
                                              {subAsignado.codigo || `${pasoActivo.id}${subAsignado.letra}`}
                                            </span>
                                          );
                                        })()}
                                        <button
                                          type="button"
                                          onClick={() => desasignarPiezaDePasoManual(pasoActivo.id, pz)}
                                          className="hover:text-rose-500 transition cursor-pointer ml-0.5"
                                          title="Quitar de este paso"
                                        >
                                          <X className="w-2.5 h-2.5" />
                                        </button>
                                      </span>
                                    );
                                  })}
                                </div>
                              </div>
                            )}

                            {/* Herrajes */}
                            {(pasoActivo.herrajesAsignados || []).length > 0 && (
                              <div className="flex flex-col gap-1">
                                <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                  <Hammer className="w-2.5 h-2.5 text-slate-500" /> Herrajes ({pasoActivo.herrajesAsignados.length})
                                </span>
                                <div className="flex flex-wrap gap-1">
                                  {pasoActivo.herrajesAsignados.map((h) => {
                                    const hLimpio = extraerPiezaMadre(h);
                                    const subAsignadoH = (pasoActivo.subbloques || []).find((s) =>
                                      s.herrajes.some((sh) => sh === h || extraerPiezaMadre(sh) === hLimpio)
                                    );
                                    return (
                                      <span
                                        key={h}
                                        className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9.5px] font-semibold bg-slate-200/70 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700"
                                      >
                                        <span className="truncate max-w-[140px]">{hLimpio}</span>
                                        {subAsignadoH && (() => {
                                          const sIdx = (pasoActivo.subbloques || []).findIndex((s) => s.id === subAsignadoH.id);
                                          const colorSub = obtenerColorSubbloque(sIdx >= 0 ? sIdx : 0);
                                          return (
                                            <span
                                              className="px-1.5 py-0.5 rounded-full text-white font-black text-[8px] flex items-center justify-center shrink-0 shadow-xs"
                                              style={{ backgroundColor: colorSub.bg }}
                                              title={`Asignado a ${subAsignadoH.nombre}`}
                                            >
                                              {subAsignadoH.codigo || `${pasoActivo.id}${subAsignadoH.letra}`}
                                            </span>
                                          );
                                        })()}
                                        <button
                                          type="button"
                                          onClick={() => desasignarHerrajeDePasoManual(pasoActivo.id, h)}
                                          className="hover:text-rose-500 transition cursor-pointer ml-0.5"
                                          title="Quitar de este paso"
                                        >
                                          <X className="w-2.5 h-2.5" />
                                        </button>
                                      </span>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="py-2.5 px-3 text-center rounded-xl bg-slate-500/5 border border-dashed border-slate-200 dark:border-slate-800 text-[10px] text-slate-500 dark:text-slate-400 flex flex-col items-center gap-1">
                            <span>Ninguna pieza asignada a este paso todavía.</span>
                            <span className="text-[9px] font-medium text-cyan-600 dark:text-cyan-400">
                              Usa <strong>&quot;Tocar en 3D&quot;</strong> para sumarlas o <strong>&quot;Retirar&quot;</strong> para quitarlas tocándolas en 3D.
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
  );
}
