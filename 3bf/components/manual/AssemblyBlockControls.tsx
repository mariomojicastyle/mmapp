"use client";

import React from "react";
import { use3BFStore, PasoManualStudio } from "@/lib/store";
import { Box, RotateCw, RotateCcw } from "lucide-react";
import { extraerPiezaMadre } from "@/lib/piezaMadreUtils";

interface AssemblyBlockControlsProps {
  pasoActivo: PasoManualStudio;
  tablerosPasoActivo: string[];
}

export default function AssemblyBlockControls({
  pasoActivo,
  tablerosPasoActivo,
}: AssemblyBlockControlsProps) {
  const { actualizarPasoManual } = use3BFStore();

  return (
              <div className="flex flex-col gap-2.5 p-3 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white/80 dark:bg-slate-900/60 shadow-xs">
                {/* Selector de Pieza Master del Bloque de Armado */}
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold flex items-center gap-1.5 text-xs text-slate-800 dark:text-slate-100">
                      <Box className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                      <span>Pieza Master</span>
                    </span>
                  </div>

                  <select
                    value={pasoActivo.piezaMaster || ""}
                    onChange={(e) => actualizarPasoManual(pasoActivo.id, { piezaMaster: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold outline-none cursor-pointer text-slate-800 dark:text-slate-100"
                  >
                    <option value="">
                      {tablerosPasoActivo.length > 0
                        ? "-- Selecciona la pieza base de apoyo --"
                        : "-- Primero selecciona piezas de madera para este paso --"}
                    </option>
                    {tablerosPasoActivo.map((p) => {
                      const nombreLimpio = extraerPiezaMadre(p);
                      return (
                        <option key={p} value={p}>
                          {nombreLimpio} {p !== nombreLimpio ? `(${p})` : ""}
                        </option>
                      );
                    })}
                  </select>
                </div>

                {/* Botonera de Orientación Banco de Trabajo (Giro X / Y) */}
                {(() => {
                  const rotacionBanco = pasoActivo.orientacionBanco?.rotacion || [0, 0, 0];
                  const rotX = rotacionBanco[0] || 0;
                  const rotY = rotacionBanco[1] || 0;
                  const rotZ = rotacionBanco[2] || 0;

                  const isXPosActive = rotX === 90;
                  const isXNegActive = rotX === -90;
                  const isYPosActive = rotY === 90;
                  const isYNegActive = rotY === -90;

                  const toggleRotacionBanco = (eje: "X" | "Y", anguloObjetivo: 90 | -90) => {
                    const anguloActual = eje === "X" ? rotX : rotY;
                    const nuevoAngulo = anguloActual === anguloObjetivo ? 0 : anguloObjetivo;
                    const nuevoX = eje === "X" ? nuevoAngulo : rotX;
                    const nuevoY = eje === "Y" ? nuevoAngulo : rotY;

                    actualizarPasoManual(pasoActivo.id, {
                      orientacionBanco: {
                        rotacion: [nuevoX, nuevoY, rotZ],
                        apoyoEnPiso: pasoActivo.orientacionBanco?.apoyoEnPiso ?? true,
                      },
                    });
                  };

                  return (
                    <div className="flex flex-col gap-2 pt-2 border-t border-slate-200/60 dark:border-slate-800/60">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-semibold text-slate-600 dark:text-slate-300">
                          Giro Banco de Trabajo:
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className="px-2.5 py-0.5 rounded-full bg-slate-200/80 dark:bg-slate-800 text-[10px] font-mono font-bold text-[#1368AA] dark:text-blue-400">
                            X: {rotX}° | Y: {rotY}°
                          </span>
                          {(rotX !== 0 || rotY !== 0 || rotZ !== 0) && (
                            <button
                              type="button"
                              onClick={() =>
                                actualizarPasoManual(pasoActivo.id, {
                                  orientacionBanco: {
                                    rotacion: [0, 0, 0],
                                    apoyoEnPiso: pasoActivo.orientacionBanco?.apoyoEnPiso ?? true,
                                  },
                                })
                              }
                              title="Restablecer giro a 0°"
                              className="px-2 py-0.5 rounded-full bg-red-100 hover:bg-red-200 dark:bg-red-950/50 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 text-[10px] font-semibold transition-colors cursor-pointer"
                            >
                              0°
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Cuadrícula 2x2 de Botones en Cápsula Pura */}
                      <div className="grid grid-cols-2 gap-2">
                        {/* Giro X +90° */}
                        <button
                          type="button"
                          onClick={() => toggleRotacionBanco("X", 90)}
                          title={isXPosActive ? "Desactivar giro X +90° (volver a 0°)" : "Activar giro X +90°"}
                          className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-full border text-xs font-semibold shadow-xs active:scale-95 transition-all cursor-pointer ${
                            isXPosActive
                              ? "bg-[#1368AA] text-white border-[#1368AA] shadow-sm"
                              : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:border-[#1368AA] hover:text-[#1368AA] dark:hover:text-blue-400"
                          }`}
                        >
                          <RotateCw className={`w-3.5 h-3.5 ${isXPosActive ? "text-white" : "text-cyan-600 dark:text-cyan-400"}`} />
                          <span>Giro X +90°</span>
                        </button>

                        {/* Giro X -90° */}
                        <button
                          type="button"
                          onClick={() => toggleRotacionBanco("X", -90)}
                          title={isXNegActive ? "Desactivar giro X -90° (volver a 0°)" : "Activar giro X -90°"}
                          className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-full border text-xs font-semibold shadow-xs active:scale-95 transition-all cursor-pointer ${
                            isXNegActive
                              ? "bg-[#1368AA] text-white border-[#1368AA] shadow-sm"
                              : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:border-[#1368AA] hover:text-[#1368AA] dark:hover:text-blue-400"
                          }`}
                        >
                          <RotateCcw className={`w-3.5 h-3.5 ${isXNegActive ? "text-white" : "text-cyan-600 dark:text-cyan-400"}`} />
                          <span>Giro X -90°</span>
                        </button>

                        {/* Giro Y +90° */}
                        <button
                          type="button"
                          onClick={() => toggleRotacionBanco("Y", 90)}
                          title={isYPosActive ? "Desactivar giro Y +90° (volver a 0°)" : "Activar giro Y +90°"}
                          className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-full border text-xs font-semibold shadow-xs active:scale-95 transition-all cursor-pointer ${
                            isYPosActive
                              ? "bg-[#1368AA] text-white border-[#1368AA] shadow-sm"
                              : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:border-[#1368AA] hover:text-[#1368AA] dark:hover:text-blue-400"
                          }`}
                        >
                          <RotateCw className={`w-3.5 h-3.5 ${isYPosActive ? "text-white" : "text-cyan-600 dark:text-cyan-400"}`} />
                          <span>Giro Y +90°</span>
                        </button>

                        {/* Giro Y -90° */}
                        <button
                          type="button"
                          onClick={() => toggleRotacionBanco("Y", -90)}
                          title={isYNegActive ? "Desactivar giro Y -90° (volver a 0°)" : "Activar giro Y -90°"}
                          className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-full border text-xs font-semibold shadow-xs active:scale-95 transition-all cursor-pointer ${
                            isYNegActive
                              ? "bg-[#1368AA] text-white border-[#1368AA] shadow-sm"
                              : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:border-[#1368AA] hover:text-[#1368AA] dark:hover:text-blue-400"
                          }`}
                        >
                          <RotateCcw className={`w-3.5 h-3.5 ${isYNegActive ? "text-white" : "text-cyan-600 dark:text-cyan-400"}`} />
                          <span>Giro Y -90°</span>
                        </button>
                      </div>

                      {/* Checkbox Apoyo en Suelo */}
                      <div className="flex items-center justify-between pt-1 text-[11px]">
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={pasoActivo.orientacionBanco?.apoyoEnPiso ?? true}
                            onChange={(e) =>
                              actualizarPasoManual(pasoActivo.id, {
                                orientacionBanco: {
                                  rotacion: pasoActivo.orientacionBanco?.rotacion || [0, 0, 0],
                                  apoyoEnPiso: e.target.checked,
                                },
                              })
                            }
                            className="rounded accent-cyan-600"
                          />
                          <span>Apoyar en ras del suelo (Y = 0)</span>
                        </label>
                      </div>
                    </div>
                  );
                })()}
              </div>
  );
}
