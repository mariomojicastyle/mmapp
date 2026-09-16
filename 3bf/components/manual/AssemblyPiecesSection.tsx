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

  const {
    pasosManual,
    eliminarPasoManual,
    actualizarPasoManual,
    desasignarPiezaDePasoManual,
    desasignarHerrajeDePasoManual,
    conmutarVisibilidadPiezasPaso,
    conmutarOcultarNoAsignadasPaso,
    modoPickingManual,
    iniciarPickingManual,
    limpiarPickingManual,
    resultado,
  } = use3BFStore();

  const idPasoLimpio = pasoActivo.id.startsWith("P") ? pasoActivo.id : `P${String(pasoActivo.numero ?? "").padStart(2, "0")}`;
  const tituloFijo = `Bloque de armado ${idPasoLimpio}`;
  const totalComponentes = (pasoActivo.piezasAsignadas || []).length + (pasoActivo.herrajesAsignados || []).length;

  return (
                  <div className="flex flex-col gap-2.5 w-full">
                    {/* Fila 1: Título con botón circular interactivo que rota 180° para retraer todo el bloque de armado */}
                    <div
                      onClick={() => setSeccionPiezasColapsada(!seccionPiezasColapsada)}
                      className="flex items-center justify-between w-full cursor-pointer select-none group py-0.5"
                      title={seccionPiezasColapsada ? "Expandir Bloque de armado" : "Retraer Bloque de armado"}
                    >
                      <div className="flex items-center gap-2">
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

                      {totalComponentes > 0 && (
                        <span className="text-[9px] font-semibold text-slate-400 dark:text-slate-500 font-mono">
                          {totalComponentes} {totalComponentes === 1 ? "comp." : "comps."}
                        </span>
                      )}
                    </div>

                    {/* Contenido Retráctil: Botones de Acción + Tableros y Herrajes */}
                    {!seccionPiezasColapsada && (
                      <div className="flex flex-col gap-2.5 pt-0.5">
                        {/* Fila 2: Botones de Acción (Tocar en 3D, Retirar, Ojito, Invert y Tarrito de Basura) */}
                        <div className="flex items-center gap-1.5 w-full flex-wrap">
                          {/* 1. Botón Cápsula Tocar en 3D */}
                          <button
                            type="button"
                            onClick={() => {
                              if (
                                modoPickingManual.activo &&
                                modoPickingManual.pasoId === pasoActivo.id &&
                                !modoPickingManual.grupoId &&
                                modoPickingManual.modo === "agregar"
                              ) {
                                limpiarPickingManual();
                              } else {
                                if (!pasoActivo.piezasOcultas) {
                                  conmutarVisibilidadPiezasPaso(pasoActivo.id);
                                }
                                iniciarPickingManual(pasoActivo.id, null, "agregar");
                              }
                            }}
                            title="Seleccionar piezas y herrajes tocándolas directamente en el 3D"
                            className={`px-2.5 py-1 rounded-full transition flex items-center gap-1 font-bold text-[9.5px] border cursor-pointer ${
                              modoPickingManual.activo &&
                              modoPickingManual.pasoId === pasoActivo.id &&
                              !modoPickingManual.grupoId &&
                              modoPickingManual.modo === "agregar"
                                ? "bg-cyan-500 text-white border-cyan-400 shadow-sm animate-pulse"
                                : "bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border-cyan-500/30 hover:bg-cyan-500/20"
                            }`}
                          >
                            <Pipette className="w-3 h-3" />
                            <span>
                              {modoPickingManual.activo &&
                              modoPickingManual.pasoId === pasoActivo.id &&
                              !modoPickingManual.grupoId &&
                              modoPickingManual.modo === "agregar"
                                ? "Tocando 3D..."
                                : "Tocar en 3D"}
                            </span>
                          </button>

                          {/* 2. Botón Cápsula Retirar (Inmediatamente a la derecha de Tocar en 3D) */}
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
                            title="Retirar piezas o herrajes tocándolos directamente en la vista 3D"
                            className={`px-2.5 py-1 rounded-full transition flex items-center gap-1 font-bold text-[9.5px] border cursor-pointer ${
                              modoPickingManual.activo &&
                              modoPickingManual.pasoId === pasoActivo.id &&
                              !modoPickingManual.grupoId &&
                              modoPickingManual.modo === "retirar"
                                ? "bg-rose-600 text-white border-rose-500 shadow-md ring-2 ring-rose-400/40 animate-pulse"
                                : "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30 hover:bg-rose-500/20"
                            }`}
                          >
                            <Eraser className="w-3 h-3" />
                            <span>
                              {modoPickingManual.activo &&
                              modoPickingManual.pasoId === pasoActivo.id &&
                              !modoPickingManual.grupoId &&
                              modoPickingManual.modo === "retirar"
                                ? "Retirando 3D..."
                                : "Retirar"}
                            </span>
                          </button>

                          {/* 3. Botón Circular Apagar/Prender Piezas en 3D (Ojito) */}
                          <button
                            type="button"
                            onClick={() => conmutarVisibilidadPiezasPaso(pasoActivo.id)}
                            title={
                              pasoActivo.piezasOcultas
                                ? "Mostrar piezas de este bloque de armado en 3D"
                                : "Apagar piezas de este bloque de armado en 3D"
                            }
                            className={`p-1.5 rounded-full transition shrink-0 cursor-pointer border ${
                              pasoActivo.piezasOcultas
                                ? "bg-amber-500/20 text-amber-500 border-amber-500/40"
                                : "bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-amber-500 border-slate-200 dark:border-slate-700"
                            }`}
                          >
                            {pasoActivo.piezasOcultas ? (
                              <EyeOff className="w-3.5 h-3.5 text-amber-500" />
                            ) : (
                              <Eye className="w-3.5 h-3.5" />
                            )}
                          </button>

                          {/* 4. Botón Circular Invert (Ojo con la diagonal, sin texto, mismo tamaño) */}
                          <button
                            type="button"
                            onClick={() => conmutarOcultarNoAsignadasPaso(pasoActivo.id)}
                            title={
                              pasoActivo.ocultarNoAsignadas
                                ? "Invert Hide Activo: Piezas no asignadas ocultas. Clic para mostrar todo el mueble."
                                : "Invert Hide: Aislar este bloque de armado ocultando el resto del mueble."
                            }
                            className={`p-1.5 rounded-full transition shrink-0 cursor-pointer border ${
                              pasoActivo.ocultarNoAsignadas
                                ? "bg-[#1368AA] text-white border-[#1368AA] shadow-sm ring-2 ring-[#1368AA]/30"
                                : "bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-400 hover:text-cyan-500 border-slate-200 dark:border-slate-700"
                            }`}
                          >
                            <EyeOff className="w-3.5 h-3.5" />
                          </button>

                          {/* 5. Tarrito de Basura al Final */}
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
