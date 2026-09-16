"use client";

import React, { useState } from "react";
import { 
  Eye, 
  EyeOff, 
  Plus, 
  ChevronDown, 
  Trash2, 
  Pipette, 
  Link2, 
  X 
} from "lucide-react";
import { use3BFStore, PasoManualStudio, CoreografiaShowcase, GrupoCinematicoShowcase } from "@/lib/store";
import { extraerPiezaMadre } from "@/lib/piezaMadreUtils";

export interface ShowcaseConfigSectionProps {
  pasoActivo: PasoManualStudio;
  gruposCinematicosColapsados: Record<string, boolean>;
  setGruposCinematicosColapsados: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  botonActivoColor: string;
}

export function ShowcaseConfigSection({
  pasoActivo,
  gruposCinematicosColapsados,
  setGruposCinematicosColapsados,
  botonActivoColor,
}: ShowcaseConfigSectionProps) {
  const [mostrarMenuAnadirBloque, setMostrarMenuAnadirBloque] = useState(false);

  const {
    actualizarPasoManual,
    conmutarVisibilidadTodosGruposCinematicos,
    conmutarVisibilidadGrupoCinematico,
    agregarGrupoCinematico,
    actualizarGrupoCinematico,
    eliminarGrupoCinematico,
    desasignarPiezaDeGrupoCinematico,
    modoPickingManual,
    iniciarPickingManual,
    limpiarPickingManual,
  } = use3BFStore();

  const handleCambioDistanciaGlobal = (nuevaDist: number) => {
    const sinc = pasoActivo.showcase?.sincronizarCarreraCajones !== false;
    const gruposActualizados = (pasoActivo.showcase?.gruposCinematicos || []).map((g: any) => {
      if (g.tipo === "cajon" && sinc) {
        return { ...g, distanciaMm: nuevaDist };
      }
      return g;
    });
    actualizarPasoManual(pasoActivo.id, {
      showcase: {
        ...(pasoActivo.showcase || {
          abrirCajones: true,
          abrirPuertas: true,
          anguloPuertasDeg: 90,
          giroPresentacion360: true,
          coreografia: "secuencial",
          ejeGlobal: "+Z",
          gruposCinematicos: [],
        }),
        distanciaAperturaMm: nuevaDist,
        gruposCinematicos: gruposActualizados,
      },
    });
  };

  const toggleSincronizacionCajones = () => {
    const nuevoSinc = !(pasoActivo.showcase?.sincronizarCarreraCajones !== false);
    const distGlobal = pasoActivo.showcase?.distanciaAperturaMm || 300;
    const gruposActualizados = (pasoActivo.showcase?.gruposCinematicos || []).map((g: any) => {
      if (g.tipo === "cajon") {
        return {
          ...g,
          distanciaMm: nuevoSinc ? distGlobal : (g.distanciaMm ?? distGlobal),
        };
      }
      return g;
    });
    actualizarPasoManual(pasoActivo.id, {
      showcase: {
        ...(pasoActivo.showcase || {
          abrirCajones: true,
          distanciaAperturaMm: 300,
          abrirPuertas: true,
          anguloPuertasDeg: 90,
          giroPresentacion360: true,
          coreografia: "secuencial",
          ejeGlobal: "+Z",
          gruposCinematicos: [],
        }),
        sincronizarCarreraCajones: nuevoSinc,
        gruposCinematicos: gruposActualizados,
      },
    });
  };

  return (
    <div className="flex flex-col gap-3">
      {/* 🗄️ Bloque de Cajones (Contenedor Único Integrado) */}
      <div className="flex flex-col gap-3 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-black/[0.02] dark:bg-white/[0.02] shadow-xs">
        {/* Título Principal */}
        <div className="flex items-center justify-between">
          <span className="font-bold text-xs text-slate-800 dark:text-slate-100 tracking-wide">
            Bloque de Cajones
          </span>
        </div>

        {/* Subtítulo: Coreografía de Movimiento */}
        <div className="flex flex-col gap-1.5">
          <span className="font-semibold text-[10.5px] opacity-75">
            Coreografía de Movimiento
          </span>

          {/* Botones de Coreografía */}
          <div className="flex items-center p-0.5 bg-slate-100 dark:bg-slate-800/80 rounded-full border border-slate-200 dark:border-slate-700/80 gap-0.5 w-full">
            {(["secuencial", "cascada", "simultaneo"] as const).map((modo) => {
              const activo = (pasoActivo.showcase?.coreografia || "secuencial") === modo;
              const labels = {
                secuencial: "Individual",
                cascada: "Cascada",
                simultaneo: "Simultáneo",
              };
              return (
                <button
                  key={modo}
                  type="button"
                  onClick={() =>
                    actualizarPasoManual(pasoActivo.id, {
                      showcase: {
                        ...(pasoActivo.showcase || {
                          abrirCajones: true,
                          distanciaAperturaMm: 300,
                          abrirPuertas: true,
                          anguloPuertasDeg: 90,
                          giroPresentacion360: true,
                          ejeGlobal: "+Z",
                          gruposCinematicos: [],
                        }),
                        coreografia: modo as CoreografiaShowcase,
                      },
                    })
                  }
                  style={activo ? { backgroundColor: botonActivoColor, color: "#ffffff" } : {}}
                  className={`flex-1 py-1 px-1 rounded-full text-[10px] font-bold transition flex items-center justify-center cursor-pointer ${
                    activo ? "shadow-sm" : "opacity-70 hover:opacity-100"
                  }`}
                >
                  {labels[modo]}
                </button>
              );
            })}
          </div>
        </div>

        {/* Slider Distancia de apertura con botón de dos posiciones */}
        {(() => {
          const sincGlobal = pasoActivo.showcase?.sincronizarCarreraCajones !== false;
          return (
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-[10.5px]">
                <span className="font-semibold opacity-75">Distancia de apertura</span>
                <div className="flex items-center gap-2">
                  {/* Pequeño botón de posición Activado / Desactivado */}
                  <button
                    type="button"
                    onClick={toggleSincronizacionCajones}
                    title={
                      sincGlobal
                        ? "Control Uniforme Activado: El slider principal gobierna todos los cajones simultáneamente. Clic para desactivar y mover cajones por separado."
                        : "Control Uniforme Desactivado: Puedes controlar la carrera de cada cajón individualmente. Clic para activar y sincronizar todos."
                    }
                    className={`relative inline-flex h-4 w-7 shrink-0 cursor-pointer rounded-full border border-transparent transition-colors duration-200 ease-in-out select-none ${
                      sincGlobal ? "bg-cyan-500" : "bg-slate-300 dark:bg-slate-700"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-xs transition duration-200 ease-in-out ${
                        sincGlobal ? "translate-x-3" : "translate-x-0"
                      }`}
                    />
                  </button>

                  <div className={`flex items-center gap-1 transition-opacity ${sincGlobal ? "opacity-100" : "opacity-40"}`}>
                    <input
                      type="number"
                      min={50}
                      max={600}
                      step={10}
                      disabled={!sincGlobal}
                      value={pasoActivo.showcase?.distanciaAperturaMm ?? 300}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        handleCambioDistanciaGlobal(isNaN(val) ? 0 : val);
                      }}
                      className="w-12 px-1 py-0.5 rounded-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono font-bold text-slate-800 dark:text-slate-100 text-right text-[10px] outline-none focus:border-cyan-500 disabled:cursor-not-allowed"
                    />
                    <span className="font-mono text-[9.5px]">mm</span>
                  </div>
                </div>
              </div>
              <input
                type="range"
                min={100}
                max={450}
                step={10}
                disabled={!sincGlobal}
                value={pasoActivo.showcase?.distanciaAperturaMm || 300}
                onChange={(e) => handleCambioDistanciaGlobal(parseInt(e.target.value, 10))}
                className={`accent-cyan-600 h-1.5 w-full transition-opacity ${
                  sincGlobal ? "cursor-pointer opacity-100" : "cursor-not-allowed opacity-30"
                }`}
              />
            </div>
          );
        })()}
      </div>

      {/* Listado de Grupos Cinemáticos: Bloques Funcionales (Cajones o Puertas) */}
      <div className="flex flex-col gap-2.5">
        {/* Cabecera: Título a la izquierda en una sola línea y Ojito a la derecha */}
        <div className="flex items-center justify-between w-full">
          <span className="font-bold text-[11px] uppercase tracking-wider text-slate-700 dark:text-slate-300 truncate">
            Bloques Funcionales ({pasoActivo.showcase?.gruposCinematicos?.length || 0})
          </span>
          {(pasoActivo.showcase?.gruposCinematicos?.length || 0) > 0 && (
            <button
              type="button"
              onClick={() => conmutarVisibilidadTodosGruposCinematicos(pasoActivo.id)}
              title={
                pasoActivo.showcase?.gruposCinematicos?.some((g: any) => g.oculto)
                  ? "Mostrar todos los bloques funcionales en 3D"
                  : "Ocultar todos los bloques funcionales en 3D"
              }
              className={`p-1.5 rounded-full transition cursor-pointer border shrink-0 ${
                pasoActivo.showcase?.gruposCinematicos?.some((g: any) => g.oculto)
                  ? "bg-[#1368AA] text-white border-[#1368AA] shadow-xs"
                  : "bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-400 hover:text-cyan-500 border-slate-200 dark:border-slate-700"
              }`}
            >
              {pasoActivo.showcase?.gruposCinematicos?.some((g: any) => g.oculto) ? (
                <EyeOff className="w-3.5 h-3.5" />
              ) : (
                <Eye className="w-3.5 h-3.5" />
              )}
            </button>
          )}
        </div>

        {/* Botón de ancho completo con Menú Desplegable: Cajón o Puerta */}
        <div className="relative w-full">
          <button
            type="button"
            onClick={() => setMostrarMenuAnadirBloque(!mostrarMenuAnadirBloque)}
            style={{ backgroundColor: botonActivoColor }}
            className="w-full py-2 px-4 rounded-full text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm hover:opacity-90 active:scale-98 transition cursor-pointer select-none"
          >
            <Plus className="w-4 h-4 text-white stroke-[2.5]" />
            <span>Adicionar Bloque Funcional</span>
            <ChevronDown className="w-3.5 h-3.5 text-white/80 ml-0.5" />
          </button>

          {mostrarMenuAnadirBloque && (
            <>
              <div
                className="fixed inset-0 z-30"
                onClick={() => setMostrarMenuAnadirBloque(false)}
              />
              <div className="absolute left-0 right-0 top-full mt-1.5 z-40 w-full p-1.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col gap-1 text-xs animate-in fade-in zoom-in-95 duration-100">
                <button
                  type="button"
                  onClick={() => {
                    const countCajon = (pasoActivo.showcase?.gruposCinematicos || []).filter((g: any) => g.tipo === "cajon").length;
                    const idNuevo = `cajon_${Date.now().toString().slice(-4)}`;
                    agregarGrupoCinematico(pasoActivo.id, {
                      id: idNuevo,
                      nombre: `Cajón ${countCajon + 1}`,
                      tipo: "cajon",
                      piezas: [],
                      ejeApertura: pasoActivo.showcase?.ejeGlobal || "+Z",
                      distanciaMm: pasoActivo.showcase?.distanciaAperturaMm || 300,
                    });
                    setMostrarMenuAnadirBloque(false);
                  }}
                  className="w-full text-left px-2.5 py-2 rounded-xl hover:bg-cyan-500/10 transition flex items-center gap-2.5 cursor-pointer group"
                >
                  <span className="w-7 h-7 rounded-full bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 flex items-center justify-center font-bold text-sm shrink-0 group-hover:scale-105 transition shadow-sm">
                    🗄️
                  </span>
                  <div className="flex flex-col min-w-0">
                    <span className="font-bold text-[11px] text-slate-800 dark:text-slate-100">Cajón</span>
                    <span className="text-[9.5px] opacity-60 leading-tight">Extracción telescópica lineal</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const countPuerta = (pasoActivo.showcase?.gruposCinematicos || []).filter((g: any) => g.tipo === "puerta").length;
                    const idNuevo = `puerta_${Date.now().toString().slice(-4)}`;
                    agregarGrupoCinematico(pasoActivo.id, {
                      id: idNuevo,
                      nombre: `Puerta ${countPuerta + 1}`,
                      tipo: "puerta",
                      piezas: [],
                      ejeApertura: "+Z",
                      distanciaMm: 0,
                      anguloRotacionDeg: 90,
                      ladoBisagra: "izquierda",
                      pivoteOffsetMm: 0,
                    });
                    setMostrarMenuAnadirBloque(false);
                  }}
                  className="w-full text-left px-2.5 py-2 rounded-xl hover:bg-indigo-500/10 transition flex items-center gap-2.5 cursor-pointer group"
                >
                  <span className="w-7 h-7 rounded-full bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 flex items-center justify-center font-bold text-sm shrink-0 group-hover:scale-105 transition shadow-sm">
                    🚪
                  </span>
                  <div className="flex flex-col min-w-0">
                    <span className="font-bold text-[11px] text-slate-800 dark:text-slate-100">Puerta</span>
                    <span className="text-[9.5px] opacity-60 leading-tight">Giro angular con eje de bisagra</span>
                  </div>
                </button>
              </div>
            </>
          )}
        </div>

        {(!pasoActivo.showcase?.gruposCinematicos || pasoActivo.showcase.gruposCinematicos.length === 0) ? (
          <div className="p-4 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 text-center flex flex-col items-center gap-2 text-xs opacity-90 bg-slate-500/5">
            <p className="font-semibold text-[11px]">No hay bloques funcionales cinemáticos asignados aún.</p>
            <p className="text-[10px] opacity-60 max-w-xs">
              Haz clic en <strong>"+ Bloque Funcional"</strong> para añadir cajones o puertas.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {pasoActivo.showcase.gruposCinematicos.map((grupo: any) => {
              const esPuerta = grupo.tipo === "puerta";
              const estaColapsado = !!gruposCinematicosColapsados[grupo.id];

              const toggleColapsoGrupo = () => {
                setGruposCinematicosColapsados((prev) => ({
                  ...prev,
                  [grupo.id]: !prev[grupo.id],
                }));
              };

              return (
                <div
                  key={grupo.id}
                  className={`p-3 rounded-2xl border transition flex flex-col gap-2.5 shadow-sm ${
                    esPuerta
                      ? "border-indigo-200 dark:border-indigo-900/50 bg-indigo-50/20 dark:bg-indigo-950/10"
                      : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70"
                  } ${grupo.oculto ? "opacity-75" : ""}`}
                >
                  {/* Cabecera del Bloque Funcional: Ícono de Retracción circular interactivo */}
                  <div className="flex items-center justify-between gap-2 w-full">
                    <div className="flex items-center gap-1.5 min-w-0 flex-1">
                      <button
                        type="button"
                        onClick={toggleColapsoGrupo}
                        title={estaColapsado ? `Expandir ${grupo.nombre}` : `Retraer ${grupo.nombre}`}
                        className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-all duration-300 hover:scale-110 shadow-2xs cursor-pointer border ${
                          esPuerta
                            ? "border-indigo-500/40 bg-indigo-500/10 text-indigo-700 dark:text-indigo-300"
                            : "border-cyan-500/40 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300"
                        }`}
                      >
                        <ChevronDown
                          className={`w-3.5 h-3.5 transition-transform duration-300 ${
                            estaColapsado ? "-rotate-180" : "rotate-0"
                          }`}
                        />
                      </button>

                      <span
                        className="text-xs shrink-0 select-none"
                        title={esPuerta ? "Bloque tipo Puerta" : "Bloque tipo Cajón"}
                      >
                        {esPuerta ? "🚪" : "🗄️"}
                      </span>
                      <input
                        type="text"
                        value={grupo.nombre}
                        onChange={(e) =>
                          actualizarGrupoCinematico(pasoActivo.id, grupo.id, { nombre: e.target.value })
                        }
                        className="font-bold text-xs bg-transparent border-b border-transparent hover:border-slate-300 focus:border-cyan-500 outline-none flex-1 min-w-[60px] max-w-[120px] truncate"
                      />
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {/* Botón Cuentagotas / Selección Visual 3D */}
                      <button
                        type="button"
                        onClick={() => {
                          if (modoPickingManual.activo && modoPickingManual.grupoId === grupo.id) {
                            limpiarPickingManual();
                          } else {
                            iniciarPickingManual(pasoActivo.id, grupo.id);
                          }
                        }}
                        title="Seleccionar piezas de este bloque directamente tocándolas en el 3D"
                        className={`px-2.5 py-1 rounded-full transition flex items-center gap-1 font-bold text-[9.5px] border cursor-pointer ${
                          modoPickingManual.activo && modoPickingManual.grupoId === grupo.id
                            ? "bg-cyan-500 text-white border-cyan-400 shadow-sm animate-pulse"
                            : "bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border-cyan-500/30 hover:bg-cyan-500/20"
                        }`}
                      >
                        <Pipette className="w-3 h-3" />
                        <span>
                          {modoPickingManual.activo && modoPickingManual.grupoId === grupo.id ? "Tocando 3D..." : "Tocar en 3D"}
                        </span>
                      </button>

                      {/* Botón Bombillito / Ojito */}
                      <button
                        type="button"
                        onClick={() => conmutarVisibilidadGrupoCinematico(pasoActivo.id, grupo.id)}
                        title={grupo.oculto ? "Mostrar bloque en 3D" : "Apagar bloque en 3D (para ver herrajes interiores)"}
                        className={`p-1.5 rounded-full transition shrink-0 cursor-pointer border ${
                          grupo.oculto
                            ? "bg-[#1368AA] text-white border-[#1368AA] shadow-xs"
                            : "bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-400 hover:text-cyan-500 border-slate-200 dark:border-slate-700"
                        }`}
                      >
                        {grupo.oculto ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>

                      <button
                        type="button"
                        onClick={() => eliminarGrupoCinematico(pasoActivo.id, grupo.id)}
                        title="Eliminar este bloque funcional"
                        className="p-1.5 rounded-full text-rose-500 hover:bg-rose-500/10 transition shrink-0 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Contenido Retráctil del Bloque Funcional */}
                  {!estaColapsado && (
                    <>
                      {esPuerta ? (
                        <div className="flex flex-col gap-2 p-2 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] border border-slate-200/70 dark:border-slate-800/70 text-[10px]">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center justify-between">
                              <span className="font-semibold opacity-70">Ángulo de Giro:</span>
                              <div className="flex items-center gap-1">
                                <input
                                  type="number"
                                  min={0}
                                  max={180}
                                  step={5}
                                  value={grupo.anguloRotacionDeg ?? 90}
                                  onChange={(e) => {
                                    const val = parseInt(e.target.value, 10);
                                    actualizarGrupoCinematico(pasoActivo.id, grupo.id, {
                                      anguloRotacionDeg: isNaN(val) ? 0 : Math.max(0, val),
                                    });
                                  }}
                                  className="w-14 px-1.5 py-0.5 rounded-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono font-bold text-indigo-600 dark:text-indigo-400 text-right text-[10px] outline-none focus:border-indigo-500 shadow-inner"
                                />
                                <span className="font-mono text-[10px] opacity-60">°</span>
                              </div>
                            </div>
                            <input
                              type="range"
                              min={0}
                              max={180}
                              step={5}
                              value={grupo.anguloRotacionDeg ?? 90}
                              onChange={(e) =>
                                actualizarGrupoCinematico(pasoActivo.id, grupo.id, {
                                  anguloRotacionDeg: parseInt(e.target.value, 10),
                                })
                              }
                              className="accent-indigo-600 h-1.5 cursor-pointer w-full"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200/50 dark:border-slate-800/50">
                            <div className="flex flex-col gap-1">
                              <span className="font-semibold opacity-70 text-[9.5px]">Eje de Bisagra:</span>
                              <select
                                value={grupo.ladoBisagra || "izquierda"}
                                onChange={(e) =>
                                  actualizarGrupoCinematico(pasoActivo.id, grupo.id, {
                                    ladoBisagra: e.target.value as "izquierda" | "derecha",
                                  })
                                }
                                className="w-full px-2 py-0.5 rounded-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-[10px] font-semibold outline-none cursor-pointer"
                              >
                                <option value="izquierda">Bisagra Izquierda</option>
                                <option value="derecha">Bisagra Derecha</option>
                              </select>
                            </div>

                            <div className="flex flex-col gap-1">
                              <div className="flex items-center justify-between opacity-70 text-[9.5px]">
                                <span className="font-semibold">Ajuste Pivote:</span>
                                <div className="flex items-center gap-0.5">
                                  <input
                                    type="number"
                                    min={-100}
                                    max={100}
                                    step={1}
                                    value={grupo.pivoteOffsetMm ?? 0}
                                    onChange={(e) => {
                                      const val = parseInt(e.target.value, 10);
                                      actualizarGrupoCinematico(pasoActivo.id, grupo.id, {
                                        pivoteOffsetMm: isNaN(val) ? 0 : val,
                                      });
                                    }}
                                    className="w-12 px-1 py-0.5 rounded-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono font-bold text-slate-800 dark:text-slate-100 text-right text-[9.5px] outline-none focus:border-indigo-500"
                                  />
                                  <span className="font-mono text-[9px] opacity-60">mm</span>
                                </div>
                              </div>
                              <input
                                type="range"
                                min={-50}
                                max={50}
                                step={1}
                                value={grupo.pivoteOffsetMm || 0}
                                onChange={(e) =>
                                  actualizarGrupoCinematico(pasoActivo.id, grupo.id, {
                                    pivoteOffsetMm: parseInt(e.target.value, 10),
                                  })
                                }
                                className="accent-indigo-600 h-1 mt-1 cursor-pointer"
                                title="Ajuste fino del punto de pivote de la bisagra en milímetros"
                              />
                            </div>
                          </div>
                        </div>
                      ) : (
                        (() => {
                          const sinc = pasoActivo.showcase?.sincronizarCarreraCajones !== false;
                          const distEfectiva = sinc
                            ? (pasoActivo.showcase?.distanciaAperturaMm ?? grupo.distanciaMm ?? 300)
                            : (grupo.distanciaMm ?? pasoActivo.showcase?.distanciaAperturaMm ?? 300);

                          return (
                            <div className="flex flex-col gap-2 p-2 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] border border-slate-200/70 dark:border-slate-800/70 text-[10px]">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1">
                                  <span className="font-semibold opacity-70">Carrera Apertura:</span>
                                  {sinc ? (
                                    <span
                                      className="text-[8.5px] font-bold text-cyan-600 dark:text-cyan-400 bg-cyan-500/10 px-1.5 py-0.2 rounded-full flex items-center gap-0.5"
                                      title="Sincronizado: este cajón sigue el control global de apertura"
                                    >
                                      <Link2 className="w-2.5 h-2.5" /> Uniforme
                                    </span>
                                  ) : (
                                    <span
                                      className="text-[8.5px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-1.5 py-0.2 rounded-full flex items-center gap-0.5"
                                      title="Independiente: la distancia de este cajón se controla por separado"
                                    >
                                      Individual
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-1">
                                  <input
                                    type="number"
                                    min={0}
                                    max={600}
                                    step={10}
                                    value={distEfectiva}
                                    onChange={(e) => {
                                      const val = parseInt(e.target.value, 10);
                                      const nVal = isNaN(val) ? 0 : Math.max(0, val);
                                      if (sinc) {
                                        handleCambioDistanciaGlobal(nVal);
                                      } else {
                                        actualizarGrupoCinematico(pasoActivo.id, grupo.id, {
                                          distanciaMm: nVal,
                                        });
                                      }
                                    }}
                                    className="w-14 px-1.5 py-0.5 rounded-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono font-bold text-cyan-600 dark:text-cyan-400 text-right text-[10.5px] outline-none focus:border-cyan-500 shadow-inner"
                                  />
                                  <span className="font-mono text-[10px] opacity-60">mm</span>
                                </div>
                              </div>
                              <input
                                type="range"
                                min={0}
                                max={450}
                                step={10}
                                value={distEfectiva}
                                onChange={(e) => {
                                  const nVal = parseInt(e.target.value, 10);
                                  if (sinc) {
                                    handleCambioDistanciaGlobal(nVal);
                                  } else {
                                    actualizarGrupoCinematico(pasoActivo.id, grupo.id, {
                                      distanciaMm: nVal,
                                    });
                                  }
                                }}
                                className="accent-cyan-600 h-1.5 cursor-pointer w-full"
                              />
                            </div>
                          );
                        })()
                      )}

                      {/* Piezas Asignadas al Bloque */}
                      {grupo.piezas.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {grupo.piezas.map((pz: any) => {
                            const pmLimpia = extraerPiezaMadre(pz);
                            return (
                              <span
                                key={pz}
                                style={{ borderColor: botonActivoColor }}
                                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9.5px] font-semibold bg-cyan-500/10 text-cyan-800 dark:text-cyan-200 border"
                              >
                                <span className="truncate max-w-[140px]">{pmLimpia}</span>
                                <button
                                  type="button"
                                  onClick={() => desasignarPiezaDeGrupoCinematico(pasoActivo.id, grupo.id, pz)}
                                  className="hover:text-rose-500 transition cursor-pointer ml-0.5"
                                >
                                  <X className="w-2.5 h-2.5" />
                                </button>
                              </span>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="py-1 px-2 text-center rounded-xl bg-slate-500/5 text-[9.5px] opacity-60 italic">
                          Toca las piezas en el 3D con el cuentagotas para asignarlas
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default ShowcaseConfigSection;
