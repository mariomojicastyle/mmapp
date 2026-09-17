"use client";

import React from "react";
import { use3BFStore, PasoManualStudio } from "@/lib/store";
import {
  Plus,
  Trash2,
  Box,
  ChevronDown,
  Pipette,
  Eraser,
  Eye,
  EyeOff,
  X,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";
import { extraerPiezaMadre } from "@/lib/piezaMadreUtils";
import {
  IconGirarIzquierda,
  IconGirarDerecha,
  IconGiroMenos90,
  IconGiroMas90,
  IconOcultarMostrar,
  IconOcultarMostrarInvertido,
} from "./StepManagerIcons";

export const COLORES_SUBBLOQUES: Array<{ bg: string; border: string; text: string }> = [
  { bg: "#0284C7", border: "#38BDF8", text: "#0369A1" },
  { bg: "#7C3AED", border: "#A78BFA", text: "#6D28D9" },
  { bg: "#059669", border: "#34D399", text: "#047857" },
  { bg: "#D97706", border: "#FBBF24", text: "#B45309" },
  { bg: "#DB2777", border: "#F472B6", text: "#BE185D" },
  { bg: "#4F46E5", border: "#818CF8", text: "#4338CA" },
  { bg: "#0D9488", border: "#2DD4BF", text: "#0F766E" },
  { bg: "#EA580C", border: "#FB923C", text: "#C2410C" },
];

export function obtenerColorSubbloque(indice: number) {
  return COLORES_SUBBLOQUES[indice % COLORES_SUBBLOQUES.length];
}

interface SubbloquesManagerSectionProps {
  pasoActivo: PasoManualStudio;
  botonActivoColor: string;
}

export default function SubbloquesManagerSection({
  pasoActivo,
  botonActivoColor,
}: SubbloquesManagerSectionProps) {
  const [subbloquesColapsados, setSubbloquesColapsados] = React.useState<Record<string, boolean>>({});

  const {
    agregarSubBloqueArmado,
    actualizarSubBloqueArmado,
    eliminarSubBloqueArmado,
    desasignarPiezaDeSubBloque,
    conmutarVisibilidadSubBloqueArmado,
    actualizarTransformBancoSubBloque,
    modoPickingManual,
    iniciarPickingManual,
    limpiarPickingManual,
    conmutarVisibilidadPiezasPaso,
  } = use3BFStore();

  return (
              <div className="flex flex-col gap-2.5 pt-2.5 border-t border-slate-200 dark:border-slate-800">
                {/* Cabecera de Subbloques */}
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[10.5px] uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Sub-Bloques de Armado ({(pasoActivo.subbloques || []).length})
                  </span>
                </div>

                {/* Botón de ancho completo para añadir subbloque */}
                <button
                  type="button"
                  onClick={() => agregarSubBloqueArmado(pasoActivo.id)}
                  style={{ backgroundColor: botonActivoColor }}
                  className="w-full py-2 px-3 rounded-full text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs hover:opacity-90 active:scale-98 transition cursor-pointer select-none"
                >
                  <Plus className="w-4 h-4 text-white stroke-[2.5]" />
                  <span>Añadir Sub-Bloque</span>
                </button>

                {/* Listado de Tarjetas de Subbloques */}
                {pasoActivo.subbloques && pasoActivo.subbloques.length > 0 && (
                  <div className="flex flex-col gap-2.5 mt-0.5">
                    {pasoActivo.subbloques.map((sub, sIdx) => {
                      const estaEnPickingAgregar =
                        modoPickingManual.activo &&
                        modoPickingManual.pasoId === pasoActivo.id &&
                        modoPickingManual.grupoId === sub.id &&
                        modoPickingManual.modo === "agregar";
                      const estaEnPickingRetirar =
                        modoPickingManual.activo &&
                        modoPickingManual.pasoId === pasoActivo.id &&
                        modoPickingManual.grupoId === sub.id &&
                        modoPickingManual.modo === "retirar";

                      const letraSub = sub.letra || String.fromCharCode(65 + sIdx);
                      const codigoSub = sub.codigo || `${pasoActivo.id}${letraSub}`;
                      const nombreSub = (!sub.nombre || sub.nombre.startsWith("Subbloque "))
                        ? `Sub-Bloque ${pasoActivo.id}-${letraSub}`
                        : sub.nombre;

                      const colorSub = obtenerColorSubbloque(sIdx);
                      const estaColapsado = !!subbloquesColapsados[sub.id];
                      const totalCompSub = (sub.piezas || []).length + (sub.herrajes || []).length;

                      const toggleColapsoSub = () => {
                        setSubbloquesColapsados((prev) => ({
                          ...prev,
                          [sub.id]: !prev[sub.id],
                        }));
                      };

                      return (
                        <div
                          key={sub.id}
                          className="p-2.5 rounded-2xl border bg-black/[0.02] dark:bg-white/[0.02] flex flex-col gap-2 shadow-xs transition-colors"
                          style={{ borderColor: `${colorSub.bg}45` }}
                        >
                          {/* Fila 1: Cabecera con botón circular de retracción (180°), badge de código y título */}
                          <div className="flex items-center justify-between gap-2 w-full">
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              {/* Círculo con flechita que rota 180° coordinado con el color del subbloque */}
                              <button
                                type="button"
                                onClick={toggleColapsoSub}
                                title={estaColapsado ? `Expandir ${nombreSub}` : `Retraer ${nombreSub}`}
                                className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-all duration-300 hover:scale-110 shadow-2xs cursor-pointer border"
                                style={{
                                  backgroundColor: `${colorSub.bg}15`,
                                  borderColor: `${colorSub.bg}40`,
                                  color: colorSub.bg,
                                }}
                              >
                                <ChevronDown
                                  className={`w-3.5 h-3.5 transition-transform duration-300 ${
                                    estaColapsado ? "-rotate-180" : "rotate-0"
                                  }`}
                                />
                              </button>

                              <span 
                                className="px-2.5 py-0.5 rounded-full text-white flex items-center justify-center font-black text-[10.5px] shrink-0 shadow-xs"
                                style={{ backgroundColor: colorSub.bg }}
                              >
                                {codigoSub}
                              </span>
                              <input
                                type="text"
                                value={nombreSub}
                                onChange={(e) =>
                                  actualizarSubBloqueArmado(pasoActivo.id, sub.id, { nombre: e.target.value })
                                }
                                className="font-bold text-xs bg-transparent border-b border-transparent hover:border-slate-300 focus:border-cyan-500 outline-none w-full text-slate-800 dark:text-slate-100 truncate"
                              />
                            </div>

                            {totalCompSub > 0 && (
                              <span className="text-[9px] font-semibold text-slate-400 dark:text-slate-500 font-mono shrink-0">
                                {totalCompSub} {totalCompSub === 1 ? "comp." : "comps."}
                              </span>
                            )}
                          </div>

                          {/* Contenido Retráctil del Sub-Bloque */}
                          {!estaColapsado && (
                            <>
                              {/* Fila 2: Herramientas dedicadas del Subbloque (Bombillo Ocultar/Mostrar, Retirar y Basura) */}
                              <div className="flex items-center gap-1.5 w-full flex-wrap">
                            {/* 1. Botón Circular Oficial: Ocultar / Mostrar (Bombillo Amarillo = Normal / Gris = Tocar en 3D para empacar en este subbloque) */}
                            <button
                              type="button"
                              onClick={() => {
                                if (estaEnPickingAgregar) {
                                  limpiarPickingManual();
                                } else {
                                  iniciarPickingManual(pasoActivo.id, sub.id, "agregar");
                                }
                              }}
                              title={
                                estaEnPickingAgregar
                                  ? `Bombillo apagado (Gris): Cada pieza o herraje que toques en 3D se oculta y queda dentro de ${sub.nombre}. Clic para encender.`
                                  : `Bombillo encendido (Amarillo): Muestra todo en 3D. Clic para apagar y asignar componentes a ${sub.nombre} tocándolos.`
                              }
                              className={`p-1.5 rounded-full transition shrink-0 cursor-pointer border shadow-2xs ${
                                !estaEnPickingAgregar
                                  ? "bg-amber-400/20 text-amber-500 border-amber-400/50 hover:bg-amber-400/30"
                                  : "bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-300 dark:border-slate-700 hover:text-slate-200"
                              }`}
                            >
                              <IconOcultarMostrar
                                className="w-4 h-4"
                                encendido={!estaEnPickingAgregar}
                              />
                            </button>

                            {/* 2. Botón Circular Oficial: Ocultar / Mostrar Piezas de este Subbloque (Ojito / Invertido de Subbloque) */}
                            <button
                              type="button"
                              onClick={() => conmutarVisibilidadSubBloqueArmado(pasoActivo.id, sub.id)}
                              title={
                                sub.oculto
                                  ? `Mostrar piezas de ${sub.nombre} en 3D`
                                  : `Ocultar piezas de ${sub.nombre} en 3D`
                              }
                              className={`p-1.5 rounded-full transition shrink-0 cursor-pointer border shadow-2xs ${
                                sub.oculto
                                  ? "bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 border-cyan-400 shadow-sm ring-2 ring-cyan-500/30"
                                  : "bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                              }`}
                            >
                              <IconOcultarMostrarInvertido
                                className="w-4 h-4"
                                activo={Boolean(sub.oculto)}
                              />
                            </button>

                            {/* 3. Botón Cápsula Retirar de Subbloque */}
                            <button
                              type="button"
                              onClick={() => {
                                if (estaEnPickingRetirar) {
                                  limpiarPickingManual();
                                } else {
                                  iniciarPickingManual(pasoActivo.id, sub.id, "retirar");
                                }
                              }}
                              title={`Retirar: Toca piezas o herrajes en 3D para expulsarlos de ${sub.nombre}`}
                              className={`px-2.5 py-1 rounded-full transition flex items-center gap-1 font-bold text-[9px] border cursor-pointer ${
                                estaEnPickingRetirar
                                  ? "bg-rose-600 text-white border-rose-500 shadow-md ring-2 ring-rose-400/40 animate-pulse"
                                  : "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30 hover:bg-rose-500/20"
                              }`}
                            >
                              <Eraser className="w-3 h-3" />
                              <span>{estaEnPickingRetirar ? "Retirando 3D..." : "Retirar"}</span>
                            </button>

                            {/* 4. Tarrito de Basura */}
                            <button
                              type="button"
                              onClick={() => eliminarSubBloqueArmado(pasoActivo.id, sub.id)}
                              title="Eliminar este subbloque"
                              className="p-1.5 rounded-full text-rose-500 hover:bg-rose-500/10 transition shrink-0 cursor-pointer ml-auto"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Chips de componentes asignados al subbloque */}
                          {(sub.piezas.length > 0 || sub.herrajes.length > 0) ? (
                            <div className="flex flex-wrap gap-1 pt-1 border-t border-slate-200/50 dark:border-slate-800/50">
                              {sub.piezas.map((pz) => (
                                <span
                                  key={pz}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-semibold bg-amber-500/10 text-amber-800 dark:text-amber-200 border border-amber-500/30"
                                >
                                  <span>{extraerPiezaMadre(pz)}</span>
                                  <button
                                    type="button"
                                    onClick={() => desasignarPiezaDeSubBloque(pasoActivo.id, sub.id, pz)}
                                    className="hover:text-rose-500 transition cursor-pointer ml-0.5"
                                  >
                                    <X className="w-2.5 h-2.5" />
                                  </button>
                                </span>
                              ))}
                              {sub.herrajes.map((hr) => (
                                <span
                                  key={hr}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-medium bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700"
                                >
                                  <span>{extraerPiezaMadre(hr)}</span>
                                  <button
                                    type="button"
                                    onClick={() => desasignarPiezaDeSubBloque(pasoActivo.id, sub.id, hr)}
                                    className="hover:text-rose-500 transition cursor-pointer ml-0.5"
                                  >
                                    <X className="w-2.5 h-2.5" />
                                  </button>
                                </span>
                              ))}
                            </div>
                          ) : (
                            <div className="py-1 px-2 text-center rounded-xl bg-slate-500/5 text-[9.5px] opacity-60 italic">
                              Usa <strong>Tocar en 3D</strong> para asignar la pieza madre y sus correderas
                            </div>
                          )}

                          {/* 🪚 BANCO DE TRABAJO Y PIEZA MÁSTER INDEPENDIENTE DEL SUB-BLOQUE (LÍNEA ROJA) */}
                          {(() => {
                            const piezaMasterSel = sub.piezaMaster || (sub.piezas.length > 0 ? sub.piezas[0] : "");
                            const rotPlano = sub.transformBanco?.rotacionPlano ?? sub.transformBanco?.rotacionYDeg ?? (sub.transformBanco?.rotacion?.[1] || 0);
                            const offsetX = sub.transformBanco?.offsetX || 0;
                            const offsetZ = sub.transformBanco?.offsetZ || 0;
                            const acostado = sub.transformBanco?.acostado || false;
                            const direccionAcostar = sub.transformBanco?.direccionAcostar || "izquierda";

                            // 🔄 Giro único en el plano: Izquierda (-90°) o Derecha (+90°)
                            const girarPlano = (delta: number) => {
                              let nuevo = (rotPlano + delta) % 360;
                              if (nuevo < 0) nuevo += 360;
                              actualizarTransformBancoSubBloque(pasoActivo.id, sub.id, {
                                rotacionPlano: nuevo,
                                rotacionYDeg: nuevo,
                                rotacion: [0, nuevo, 0],
                                apoyoEnPiso: true,
                              });
                            };

                            // 🕹️ Joystick D-Pad: Desplazamiento sobre plano horizontal (±50 mm por clic)
                            const moverPlano = (dx: number, dz: number) => {
                              const nuevoX = Math.round((offsetX + dx) * 1000) / 1000;
                              const nuevoZ = Math.round((offsetZ + dz) * 1000) / 1000;
                              actualizarTransformBancoSubBloque(pasoActivo.id, sub.id, {
                                offsetX: nuevoX,
                                offsetZ: nuevoZ,
                                apoyoEnPiso: true,
                              });
                            };

                            const resetOffsets = () => {
                              actualizarTransformBancoSubBloque(pasoActivo.id, sub.id, {
                                offsetX: 0,
                                offsetZ: 0,
                                apoyoEnPiso: true,
                              });
                            };

                            return (
                              <div className="flex flex-col gap-2.5 p-2.5 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white/80 dark:bg-slate-900/60 shadow-xs mt-1">
                                {/* Selector de Pieza Master del Sub-Bloque */}
                                <div className="flex flex-col gap-1">
                                  <div className="flex items-center justify-between">
                                    <span className="font-bold flex items-center gap-1.5 text-xs text-slate-800 dark:text-slate-100">
                                      <Box className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                                      <span>Pieza Master</span>
                                    </span>
                                  </div>

                                  <select
                                    value={piezaMasterSel}
                                    onChange={(e) => {
                                      actualizarSubBloqueArmado(pasoActivo.id, sub.id, { piezaMaster: e.target.value });
                                    }}
                                    className="w-full px-3 py-1.5 rounded-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold outline-none cursor-pointer text-slate-800 dark:text-slate-100"
                                  >
                                    {sub.piezas.length === 0 && (
                                      <option value="">-- Asigna piezas de madera primero --</option>
                                    )}
                                    {sub.piezas.map((p) => {
                                      const nombreLimpio = extraerPiezaMadre(p);
                                      return (
                                        <option key={p} value={p}>
                                          {nombreLimpio} {p !== nombreLimpio ? `(${p})` : ""}
                                        </option>
                                      );
                                    })}
                                  </select>
                                </div>

                                  {/* 🔄 Segmented Pill Bar: Contenedor unificado de Acostar y Giro en Plano */}
                                  <div className="flex flex-col gap-1.5 pt-1.5 border-t border-slate-200/60 dark:border-slate-800/60">
                                    {/* Barra Cápsula Unificada (Pill Container) */}
                                    <div className="flex items-center justify-center py-1">
                                      <div className="inline-flex items-center p-1.5 rounded-full bg-slate-100/90 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/60 shadow-inner gap-1.5">
                                        {/* 1. Girar / Acostar Izquierda */}
                                        <button
                                          type="button"
                                          onClick={() => {
                                            const estaActivoIzquierda = acostado && direccionAcostar !== "derecha";
                                            actualizarTransformBancoSubBloque(pasoActivo.id, sub.id, {
                                              acostado: !estaActivoIzquierda,
                                              direccionAcostar: "izquierda",
                                              apoyoEnPiso: true,
                                            });
                                          }}
                                          title={
                                            acostado && direccionAcostar !== "derecha"
                                              ? "Acostada hacia la izquierda (Activo). Clic para poner de pie"
                                              : "Girar / Acostar hacia la izquierda"
                                          }
                                          className={`w-[33px] h-[33px] rounded-full flex items-center justify-center transition-all cursor-pointer ${
                                            acostado && direccionAcostar !== "derecha"
                                              ? "bg-[#0891b2] text-white shadow-sm border border-[#0891b2] scale-105"
                                              : "bg-transparent border border-slate-300/80 dark:border-slate-600/60 text-slate-700 dark:text-slate-200 hover:border-slate-400 dark:hover:border-slate-500 hover:bg-slate-200/40 dark:hover:bg-slate-700/40"
                                          }`}
                                        >
                                          <IconGirarIzquierda className="w-[20.5px] h-[20.5px]" />
                                        </button>

                                        {/* 2. Girar / Acostar Derecha */}
                                        <button
                                          type="button"
                                          onClick={() => {
                                            const estaActivoDerecha = acostado && direccionAcostar === "derecha";
                                            actualizarTransformBancoSubBloque(pasoActivo.id, sub.id, {
                                              acostado: !estaActivoDerecha,
                                              direccionAcostar: "derecha",
                                              apoyoEnPiso: true,
                                            });
                                          }}
                                          title={
                                            acostado && direccionAcostar === "derecha"
                                              ? "Acostada hacia la derecha (Activo). Clic para poner de pie"
                                              : "Girar / Acostar hacia la derecha"
                                          }
                                          className={`w-[33px] h-[33px] rounded-full flex items-center justify-center transition-all cursor-pointer ${
                                            acostado && direccionAcostar === "derecha"
                                              ? "bg-[#0891b2] text-white shadow-sm border border-[#0891b2] scale-105"
                                              : "bg-transparent border border-slate-300/80 dark:border-slate-600/60 text-slate-700 dark:text-slate-200 hover:border-slate-400 dark:hover:border-slate-500 hover:bg-slate-200/40 dark:hover:bg-slate-700/40"
                                          }`}
                                        >
                                          <IconGirarDerecha className="w-[20.5px] h-[20.5px]" />
                                        </button>

                                        {/* Separador sutil */}
                                        <div className="w-px h-4.5 bg-slate-300/80 dark:bg-slate-700 mx-0.5" />

                                        {/* 3. Giro -90° (Antihorario) */}
                                        <button
                                          type="button"
                                          onClick={() => girarPlano(-90)}
                                          title="Girar 90° hacia la izquierda (antihorario)"
                                          className="w-[33px] h-[33px] rounded-full bg-transparent border border-slate-300/80 dark:border-slate-600/60 text-slate-700 dark:text-slate-200 hover:border-[#1368AA] hover:text-[#1368AA] dark:hover:border-blue-400 dark:hover:text-blue-400 hover:bg-slate-200/40 dark:hover:bg-slate-700/40 flex items-center justify-center transition-all active:scale-95 cursor-pointer"
                                        >
                                          <IconGiroMenos90 className="w-[22px] h-[22px]" />
                                        </button>

                                        {/* 4. Giro +90° (Horario) */}
                                        <button
                                          type="button"
                                          onClick={() => girarPlano(90)}
                                          title="Girar 90° hacia la derecha (horario)"
                                          className="w-[33px] h-[33px] rounded-full bg-transparent border border-slate-300/80 dark:border-slate-600/60 text-slate-700 dark:text-slate-200 hover:border-[#1368AA] hover:text-[#1368AA] dark:hover:border-blue-400 dark:hover:text-blue-400 hover:bg-slate-200/40 dark:hover:bg-slate-700/40 flex items-center justify-center transition-all active:scale-95 cursor-pointer"
                                        >
                                          <IconGiroMas90 className="w-[22px] h-[22px]" />
                                        </button>
                                      </div>
                                    </div>
                                  </div>

                                {/* 🕹️ Control Tipo Joystick / Cruceta D-Pad */}
                                <div className="flex flex-col gap-2 pt-2 border-t border-slate-200/60 dark:border-slate-800/60">
                                  {/* Cruceta Joystick D-Pad centrada */}
                                  <div className="flex flex-col items-center justify-center py-1 select-none">
                                    {/* Fila Arriba: Subir */}
                                    <button
                                      type="button"
                                      onClick={() => moverPlano(0, -0.05)}
                                      title="Subir en el banco de trabajo (+50 mm)"
                                      className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:border-[#1368AA] hover:text-[#1368AA] dark:hover:text-blue-400 flex items-center justify-center shadow-xs active:scale-90 transition-all cursor-pointer mb-1"
                                    >
                                      <ArrowUp className="w-4 h-4" />
                                    </button>

                                    {/* Fila Centro: Izquierda | Centro Reset | Derecha */}
                                    <div className="flex items-center gap-2">
                                      {/* Izquierda */}
                                      <button
                                        type="button"
                                        onClick={() => moverPlano(-0.05, 0)}
                                        title="Desplazar a la izquierda (-50 mm)"
                                        className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:border-[#1368AA] hover:text-[#1368AA] dark:hover:text-blue-400 flex items-center justify-center shadow-xs active:scale-90 transition-all cursor-pointer"
                                      >
                                        <ArrowLeft className="w-4 h-4" />
                                      </button>

                                      {/* Centro Neutro / Reset */}
                                      <button
                                        type="button"
                                        onClick={resetOffsets}
                                        title="Centrar en origen"
                                        className="w-8 h-8 rounded-full border border-slate-200/80 dark:border-slate-700/80 bg-slate-100 dark:bg-slate-800/50 text-[10px] font-bold text-slate-500 dark:text-slate-400 hover:border-[#1368AA] hover:text-[#1368AA] flex items-center justify-center shadow-2xs active:scale-90 transition-all cursor-pointer"
                                      >
                                        ●
                                      </button>

                                      {/* Derecha */}
                                      <button
                                        type="button"
                                        onClick={() => moverPlano(0.05, 0)}
                                        title="Desplazar a la derecha (+50 mm)"
                                        className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:border-[#1368AA] hover:text-[#1368AA] dark:hover:text-blue-400 flex items-center justify-center shadow-xs active:scale-90 transition-all cursor-pointer"
                                      >
                                        <ArrowRight className="w-4 h-4" />
                                      </button>
                                    </div>

                                    {/* Fila Abajo: Bajar */}
                                    <button
                                      type="button"
                                      onClick={() => moverPlano(0, 0.05)}
                                      title="Bajar en el banco de trabajo (-50 mm)"
                                      className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:border-[#1368AA] hover:text-[#1368AA] dark:hover:text-blue-400 flex items-center justify-center shadow-xs active:scale-90 transition-all cursor-pointer mt-1"
                                    >
                                      <ArrowDown className="w-4 h-4" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })()}
                        </>
                      )}
                    </div>
                  );
                })}
                  </div>
                )}
              </div>
  );
}
