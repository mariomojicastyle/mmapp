"use client";

import React, { useMemo } from "react";
import { use3BFStore, PasoManualStudio, CoreografiaShowcase, EjeAperturaShowcase } from "@/lib/store";
import { Plus, Trash2, Box, Layers, Hammer, Sparkles, Check, CheckCircle2, ChevronRight, ChevronDown, Sliders, Wand2, PlayCircle, X, FolderPlus, Pipette, Eraser, Eye, EyeOff, Link2, Unlink, RotateCw, RotateCcw } from "lucide-react";
import { agruparMallasEnPiezasMadre, extraerPiezaMadre, anotarInstanciasFisicas, esHerrajeNombre } from "@/lib/piezaMadreUtils";

export default function StepManagerPanel() {
  const [mostrarMenuAnadirBloque, setMostrarMenuAnadirBloque] = React.useState(false);
  const {
    pasosManual,
    pasoActivoManualId,
    seleccionarPasoManualActivo,
    crearPasoManual,
    eliminarPasoManual,
    actualizarPasoManual,
    desasignarPiezaDePasoManual,
    desasignarHerrajeDePasoManual,
    autoDetectarGruposCinematicos,
    agregarGrupoCinematico,
    actualizarGrupoCinematico,
    eliminarGrupoCinematico,
    conmutarVisibilidadGrupoCinematico,
    conmutarVisibilidadTodosGruposCinematicos,
    conmutarVisibilidadPiezasPaso,
    conmutarOcultarNoAsignadasPaso,
    asignarPiezaAGrupoCinematico,
    desasignarPiezaDeGrupoCinematico,
    modoPickingManual,
    iniciarPickingManual,
    limpiarPickingManual,
    resultado,
    asignacionesPartes,
    coloresApariencia,
  } = use3BFStore();

  const pasoActivo = pasosManual.find((p) => p.id === pasoActivoManualId) || pasosManual[0];
  const botonActivoColor = coloresApariencia?.botonActivo || "#0891b2";

  // 📏 Control unificado de carrera de cajones
  const handleCambioDistanciaGlobal = (nuevaDist: number) => {
    if (!pasoActivo) return;
    const sinc = pasoActivo.showcase?.sincronizarCarreraCajones !== false;
    const gruposActualizados = (pasoActivo.showcase?.gruposCinematicos || []).map((g) => {
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
    if (!pasoActivo) return;
    const nuevoSinc = !(pasoActivo.showcase?.sincronizarCarreraCajones !== false);
    const distGlobal = pasoActivo.showcase?.distanciaAperturaMm || 300;
    const gruposActualizados = (pasoActivo.showcase?.gruposCinematicos || []).map((g) => {
      if (g.tipo === "cajon" && nuevoSinc) {
        return { ...g, distanciaMm: distGlobal };
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

  // 🪵 Tableros asignados exclusivamente a este paso (excluyendo cualquier herraje)
  const tablerosPasoActivo = useMemo(() => {
    if (!pasoActivo || pasoActivo.tipo === "showcase") return [];
    return (pasoActivo.piezasAsignadas || []).filter((p) => !esHerrajeNombre(p));
  }, [pasoActivo]);

  // Sincronización automática de Pieza Master si la actual no pertenece a las asignadas del paso
  React.useEffect(() => {
    if (pasoActivo && pasoActivo.tipo !== "showcase" && tablerosPasoActivo.length > 0) {
      if (!pasoActivo.piezaMaster || !tablerosPasoActivo.includes(pasoActivo.piezaMaster)) {
        actualizarPasoManual(pasoActivo.id, { piezaMaster: tablerosPasoActivo[0] });
      }
    }
  }, [pasoActivo?.id, pasoActivo?.tipo, tablerosPasoActivo, pasoActivo?.piezaMaster, actualizarPasoManual]);

  return (
    <div className="flex flex-col gap-4 text-xs">
      {/* 1. Selector de Pasos (Cápsulas Horizontales) */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <span className="font-bold tracking-wide uppercase opacity-70 text-[10px]">
            Línea de Pasos del Manual
          </span>
          <button
            type="button"
            onClick={() => crearPasoManual("ensamble")}
            style={{ borderColor: botonActivoColor, color: botonActivoColor }}
            className="flex items-center gap-1 px-2.5 py-0.5 rounded-full border hover:bg-cyan-500/10 transition font-bold text-[10px]"
          >
            <Plus className="w-3 h-3" /> + Nuevo Paso
          </button>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto py-1 custom-scrollbar">
          {pasosManual.map((paso) => {
            const esActivo = paso.id === pasoActivoManualId;
            return (
              <button
                key={paso.id}
                type="button"
                onClick={() => seleccionarPasoManualActivo(paso.id)}
                style={
                  esActivo
                    ? { backgroundColor: botonActivoColor, color: "#ffffff", borderColor: botonActivoColor }
                    : {}
                }
                className={`px-3 py-1 rounded-full border text-[11px] font-bold shrink-0 transition flex items-center gap-1.5 ${
                  esActivo
                    ? "shadow-sm"
                    : "border-slate-300 dark:border-slate-700 hover:bg-black/5 dark:hover:bg-white/5"
                }`}
              >
                <span>{paso.id}</span>
                {paso.tipo === "showcase" ? (
                  <Sparkles className="w-3 h-3 opacity-80" />
                ) : (
                  <span className="opacity-70 font-normal text-[10px]">
                    ({paso.piezasAsignadas.length + paso.herrajesAsignados.length})
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Tarjeta de Configuración del Paso Seleccionado */}
      <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-black/[0.02] dark:bg-white/[0.02] flex flex-col gap-3">
        {/* Encabezado del Paso Activo */}
        <div className="flex items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
          <div className="flex items-center gap-2 min-w-0">
            <span
              style={{ backgroundColor: botonActivoColor }}
              className="text-white text-[10px] font-bold px-2 py-0.5 rounded-full"
            >
              {pasoActivo.id}
            </span>
            <input
              type="text"
              value={pasoActivo.titulo}
              onChange={(e) => actualizarPasoManual(pasoActivo.id, { titulo: e.target.value })}
              className="font-bold text-xs bg-transparent border-b border-transparent hover:border-slate-300 focus:border-cyan-500 outline-none truncate"
            />
          </div>

          {pasosManual.length > 1 && (
            <button
              type="button"
              onClick={() => eliminarPasoManual(pasoActivo.id)}
              title="Eliminar este paso"
              className="p-1 rounded-full text-rose-500 hover:bg-rose-500/10 transition shrink-0"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* ── MODO SHOWCASE (PASO 00): CINEMÁTICA DE COMPONENTES ─────────────────── */}
        {pasoActivo.tipo === "showcase" ? (
          <div className="flex flex-col gap-3">
            {/* Tarjeta de Información */}
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-800 dark:text-cyan-200">
              <Sparkles className="w-4 h-4 shrink-0 text-cyan-600 dark:text-cyan-400" />
              <p className="text-[11px] leading-tight">
                <strong>Showcase Funcional:</strong> Demuestra el mueble operando (apertura suave secuencial de cajones y puertas) antes del armado.
              </p>
            </div>

            {/* 🪄 BOTÓN MÉTODO 2: AUTO-DETECCIÓN INTELIGENTE EN 1 CLIC */}
            <button
              type="button"
              onClick={() => autoDetectarGruposCinematicos(pasoActivo.id)}
              style={{ backgroundColor: botonActivoColor }}
              className="w-full py-2 px-3 rounded-full text-white font-bold flex items-center justify-center gap-2 shadow-sm hover:opacity-90 active:scale-95 transition text-xs select-none"
            >
              <Wand2 className="w-3.5 h-3.5" />
              <span>🪄 Auto-detectar Cajones (Método 2 en 1 Clic)</span>
            </button>

            {/* Selector de Coreografía de Apertura en Cápsulas Puras */}
            <div className="flex flex-col gap-1.5 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-black/[0.02] dark:bg-white/[0.02]">
              <span className="font-bold text-[11px] opacity-80 flex items-center gap-1.5">
                <PlayCircle className="w-3.5 h-3.5 text-cyan-600" /> Coreografía de Movimiento:
              </span>

              <div className="flex items-center p-0.5 bg-slate-100 dark:bg-slate-800/80 rounded-full border border-slate-200 dark:border-slate-700/80 gap-0.5 w-full">
                {(["secuencial", "cascada", "simultaneo"] as const).map((modo) => {
                  const activo = (pasoActivo.showcase?.coreografia || "secuencial") === modo;
                  const labels = {
                    secuencial: "Secuencial (1 a 1)",
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
              <p className="text-[10px] opacity-60 italic">
                {(pasoActivo.showcase?.coreografia || "secuencial") === "secuencial"
                  ? "• Abre Cajón 1 suavemente, pausa, se cierra; luego abre Cajón 2 suavemente y se cierra."
                  : (pasoActivo.showcase?.coreografia || "secuencial") === "cascada"
                  ? "• Abre Cajón 1, luego Cajón 2, pausan ambos abiertos, y cierran en orden inverso."
                  : "• Todos los cajones abren al unísono y se cierran al mismo tiempo."}
              </p>
            </div>

            {/* Parámetros Globales: Eje y Distancia de Apertura */}
            <div className="grid grid-cols-2 gap-2 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-black/[0.02] dark:bg-white/[0.02] text-[11px]">
              {/* Eje de Extracción */}
              <div className="flex flex-col gap-1">
                <span className="font-semibold opacity-70 text-[10px]">Eje de Apertura:</span>
                <select
                  value={pasoActivo.showcase?.ejeGlobal || "+Z"}
                  onChange={(e) =>
                    actualizarPasoManual(pasoActivo.id, {
                      showcase: {
                        ...(pasoActivo.showcase || {
                          abrirCajones: true,
                          distanciaAperturaMm: 300,
                          abrirPuertas: true,
                          anguloPuertasDeg: 90,
                          giroPresentacion360: true,
                          coreografia: "secuencial",
                          gruposCinematicos: [],
                        }),
                        ejeGlobal: e.target.value as EjeAperturaShowcase,
                      },
                    })
                  }
                  className="w-full px-2 py-1 rounded-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-[10.5px] font-semibold outline-none"
                >
                  <option value="+Z">+Z (Hacia el frente / Cámara)</option>
                  <option value="-Z">-Z (Hacia atrás)</option>
                  <option value="+Y">+Y (Profundidad positiva)</option>
                  <option value="-Y">-Y (Profundidad negativa)</option>
                  <option value="+X">+X (Hacia la derecha)</option>
                  <option value="-X">-X (Hacia la izquierda)</option>
                </select>
              </div>

              {/* Distancia de Apertura Global y Sincronización */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between opacity-70 text-[10px]">
                  <span className="font-semibold">Distancia Global:</span>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min={50}
                      max={600}
                      step={10}
                      value={pasoActivo.showcase?.distanciaAperturaMm ?? 300}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        handleCambioDistanciaGlobal(isNaN(val) ? 0 : val);
                      }}
                      className="w-12 px-1 py-0.5 rounded-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono font-bold text-slate-800 dark:text-slate-100 text-right text-[10px] outline-none focus:border-cyan-500"
                    />
                    <span className="font-mono text-[9.5px]">mm</span>
                  </div>
                </div>
                <input
                  type="range"
                  min={100}
                  max={450}
                  step={10}
                  value={pasoActivo.showcase?.distanciaAperturaMm || 300}
                  onChange={(e) => handleCambioDistanciaGlobal(parseInt(e.target.value, 10))}
                  className="accent-cyan-600 h-1.5 mt-1 cursor-pointer"
                />

                {/* Cápsula de Sincronización de Carrera de Cajones */}
                <div className="flex items-center justify-between pt-1 border-t border-slate-200/50 dark:border-slate-800/50">
                  <span className="text-[9.5px] opacity-60">Apertura uniforme:</span>
                  <button
                    type="button"
                    onClick={toggleSincronizacionCajones}
                    className={`px-2 py-0.5 rounded-full text-[9px] font-bold border transition flex items-center gap-1 cursor-pointer ${
                      pasoActivo.showcase?.sincronizarCarreraCajones !== false
                        ? "bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border-cyan-500/30"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-300 dark:border-slate-700"
                    }`}
                    title="Garantiza que todos los cajones lleguen exactamente al mismo punto de apertura hacia adelante"
                  >
                    {pasoActivo.showcase?.sincronizarCarreraCajones !== false ? (
                      <>
                        <Link2 className="w-2.5 h-2.5 text-cyan-600" />
                        <span>Cajones Sincronizados</span>
                      </>
                    ) : (
                      <>
                        <Unlink className="w-2.5 h-2.5 text-slate-400" />
                        <span>Carrera Independiente</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Listado de Grupos Cinemáticos: Bloques Funcionales (Cajones o Puertas) */}
            <div className="flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-[10.5px] uppercase tracking-wide opacity-75">
                    Bloques Funcionales ({pasoActivo.showcase?.gruposCinematicos?.length || 0})
                  </span>
                  {(pasoActivo.showcase?.gruposCinematicos?.length || 0) > 0 && (
                    <button
                      type="button"
                      onClick={() => conmutarVisibilidadTodosGruposCinematicos(pasoActivo.id)}
                      title="Ocultar o mostrar todos los bloques funcionales en 3D"
                      className="p-1 rounded-full text-slate-400 hover:text-amber-500 hover:bg-black/5 dark:hover:bg-white/5 transition cursor-pointer"
                    >
                      {pasoActivo.showcase?.gruposCinematicos?.some((g) => g.oculto) ? (
                        <EyeOff className="w-3.5 h-3.5 text-amber-500" />
                      ) : (
                        <Eye className="w-3.5 h-3.5" />
                      )}
                    </button>
                  )}
                </div>

                {/* Botón con Menú Desplegable: Cajón o Puerta */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setMostrarMenuAnadirBloque(!mostrarMenuAnadirBloque)}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-full border border-slate-300 dark:border-slate-700 hover:bg-black/5 dark:hover:bg-white/5 transition font-bold text-[10.5px] cursor-pointer shadow-sm bg-white dark:bg-slate-900"
                  >
                    <Plus className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                    <span>Bloque Funcional</span>
                    <ChevronDown className="w-3 h-3 opacity-60 ml-0.5" />
                  </button>

                  {mostrarMenuAnadirBloque && (
                    <>
                      <div
                        className="fixed inset-0 z-30"
                        onClick={() => setMostrarMenuAnadirBloque(false)}
                      />
                      <div className="absolute right-0 top-full mt-1.5 z-40 w-52 p-1.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col gap-1 text-xs animate-in fade-in zoom-in-95 duration-100">
                        <button
                          type="button"
                          onClick={() => {
                            const countCajon = (pasoActivo.showcase?.gruposCinematicos || []).filter((g) => g.tipo === "cajon").length;
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
                            const countPuerta = (pasoActivo.showcase?.gruposCinematicos || []).filter((g) => g.tipo === "puerta").length;
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
              </div>

              {(!pasoActivo.showcase?.gruposCinematicos || pasoActivo.showcase.gruposCinematicos.length === 0) ? (
                <div className="p-4 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 text-center flex flex-col items-center gap-1.5 text-xs opacity-75 bg-slate-500/5">
                  <p className="font-semibold text-[11px]">No hay bloques funcionales cinemáticos asignados aún.</p>
                  <p className="text-[10px] opacity-60">
                    Haz clic en <strong>"+ Bloque Funcional"</strong> para añadir cajones o puertas, o en <strong>"🪄 Auto-detectar Cajones"</strong> para agrupar automáticamente.
                  </p>
                </div>
              ) : (
                /* Flujo continuo natural sin barra de scroll interna */
                <div className="flex flex-col gap-3">
                  {pasoActivo.showcase.gruposCinematicos.map((grupo, gIdx) => {
                    const esPuerta = grupo.tipo === "puerta";
                    return (
                      <div
                        key={grupo.id}
                        className={`p-3 rounded-2xl border transition flex flex-col gap-2.5 shadow-sm ${
                          grupo.oculto
                            ? "border-amber-500/40 bg-amber-500/5 opacity-80"
                            : esPuerta
                            ? "border-indigo-200 dark:border-indigo-900/50 bg-indigo-50/20 dark:bg-indigo-950/10"
                            : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70"
                        }`}
                      >
                        {/* Cabecera del Bloque Funcional */}
                        <div className="flex items-center justify-between gap-2 w-full">
                          <div className="flex items-center gap-1.5 min-w-0 flex-1">
                            <span className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center font-mono font-bold text-[10px] shrink-0">
                              {gIdx + 1}
                            </span>
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

                            {/* 💡 Botón Bombillito / Ojito para Apagar/Encender Bloque en 3D */}
                            <button
                              type="button"
                              onClick={() => conmutarVisibilidadGrupoCinematico(pasoActivo.id, grupo.id)}
                              title={grupo.oculto ? "Mostrar bloque en 3D" : "Apagar bloque en 3D (para ver herrajes interiores)"}
                              className={`p-1.5 rounded-full transition shrink-0 cursor-pointer border ${
                                grupo.oculto
                                  ? "bg-amber-500/20 text-amber-500 border-amber-500/40"
                                  : "bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-amber-500 border-slate-200 dark:border-slate-700"
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

                        {/* Parámetros Específicos según Tipo de Componente */}
                        {esPuerta ? (
                          /* 🚪 Parámetros de Puerta: Ángulo de Giro, Lado de Bisagra y Ajuste de Pivote */
                          <div className="flex flex-col gap-2 p-2 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] border border-slate-200/70 dark:border-slate-800/70 text-[10px]">
                            {/* Slider y Entrada Numérica de Ángulo de Giro */}
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

                            {/* Lado de Bisagra y Slider de Ajuste Fino de Pivote */}
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
                          /* 🗄️ Parámetros de Cajón: Slider Carrera y Entrada Numérica Editable */
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
                                    {sinc && (
                                      <span
                                        className="text-[8.5px] font-bold text-cyan-600 dark:text-cyan-400 bg-cyan-500/10 px-1.5 py-0.2 rounded-full flex items-center gap-0.5"
                                        title="Sincronizado: todos los cajones abren a la misma distancia"
                                      >
                                        <Link2 className="w-2.5 h-2.5" /> Uniforme
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

                        {/* Piezas Asignadas al Bloque (Chips en Cápsula de Pieza Madre) */}
                        {grupo.piezas.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {grupo.piezas.map((pz) => {
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
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* ── MODO ENSAMBLE (PASO 01+) ─────────────────────────────────── */
          <div className="flex flex-col gap-3">
            {/* 🎯 TARJETA DE PIEZAS CONFIGURADAS DEL PASO (Inspirado en la lógica de Bloques Funcionales de P00) */}
            <div className="flex flex-col gap-2.5 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm">
              {/* Cabecera del Paso Ensamble */}
              <div className="flex items-center justify-between gap-2 w-full">
                <div className="flex items-center gap-1.5 min-w-0 flex-1">
                  <span
                    style={{ backgroundColor: botonActivoColor }}
                    className="text-white text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0"
                  >
                    {pasoActivo.id}
                  </span>
                  <span className="font-bold text-xs text-slate-800 dark:text-slate-100 truncate">
                    Piezas del Paso ({(pasoActivo.piezasAsignadas || []).length + (pasoActivo.herrajesAsignados || []).length})
                  </span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {/* Botón Cuentagotas / Selección Visual 3D para el Paso */}
                  <button
                    type="button"
                    onClick={() => {
                      if (modoPickingManual.activo && modoPickingManual.pasoId === pasoActivo.id && !modoPickingManual.grupoId && modoPickingManual.modo === "agregar") {
                        limpiarPickingManual();
                      } else {
                        iniciarPickingManual(pasoActivo.id, null, "agregar");
                      }
                    }}
                    title="Seleccionar piezas y herrajes de este paso directamente tocándolas en el 3D"
                    className={`px-3 py-1 rounded-full transition flex items-center gap-1.5 font-bold text-[9.5px] border cursor-pointer ${
                      modoPickingManual.activo && modoPickingManual.pasoId === pasoActivo.id && !modoPickingManual.grupoId && modoPickingManual.modo === "agregar"
                        ? "bg-cyan-500 text-white border-cyan-400 shadow-sm animate-pulse"
                        : "bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border-cyan-500/30 hover:bg-cyan-500/20"
                    }`}
                  >
                    <Pipette className="w-3 h-3" />
                    <span>
                      {modoPickingManual.activo && modoPickingManual.pasoId === pasoActivo.id && !modoPickingManual.grupoId && modoPickingManual.modo === "agregar" ? "Tocando 3D..." : "Tocar en 3D"}
                    </span>
                  </button>

                  {/* 🧹 Botón Retirar / Desasignación Visual 3D */}
                  <button
                    type="button"
                    onClick={() => {
                      if (modoPickingManual.activo && modoPickingManual.pasoId === pasoActivo.id && !modoPickingManual.grupoId && modoPickingManual.modo === "retirar") {
                        limpiarPickingManual();
                      } else {
                        iniciarPickingManual(pasoActivo.id, null, "retirar");
                      }
                    }}
                    title="Retirar piezas o herrajes tocándolos directamente en la vista 3D"
                    className={`px-3 py-1 rounded-full transition flex items-center gap-1.5 font-bold text-[9.5px] border cursor-pointer ${
                      modoPickingManual.activo && modoPickingManual.pasoId === pasoActivo.id && !modoPickingManual.grupoId && modoPickingManual.modo === "retirar"
                        ? "bg-rose-600 text-white border-rose-500 shadow-md ring-2 ring-rose-400/40 animate-pulse"
                        : "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30 hover:bg-rose-500/20"
                    }`}
                  >
                    <Eraser className="w-3 h-3" />
                    <span>
                      {modoPickingManual.activo && modoPickingManual.pasoId === pasoActivo.id && !modoPickingManual.grupoId && modoPickingManual.modo === "retirar" ? "Retirando 3D..." : "Retirar"}
                    </span>
                  </button>

                  {/* 💡 Botón Bombillito / Ojito para Apagar/Encender Piezas del Paso en 3D */}
                  <button
                    type="button"
                    onClick={() => conmutarVisibilidadPiezasPaso(pasoActivo.id)}
                    title={pasoActivo.piezasOcultas ? "Mostrar piezas de este paso en 3D" : "Apagar piezas de este paso en 3D (para inspeccionar uniones interiores)"}
                    className={`p-1.5 rounded-full transition shrink-0 cursor-pointer border ${
                      pasoActivo.piezasOcultas
                        ? "bg-amber-500/20 text-amber-500 border-amber-500/40"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-amber-500 border-slate-200 dark:border-slate-700"
                    }`}
                  >
                    {pasoActivo.piezasOcultas ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>

                  {/* 🎯 Botón Invert Hide (Ocultar lo visible no seleccionado para dejar únicamente presentes las piezas del paso) */}
                  <button
                    type="button"
                    onClick={() => conmutarOcultarNoAsignadasPaso(pasoActivo.id)}
                    title={
                      pasoActivo.ocultarNoAsignadas
                        ? "Invert Hide Activo: Piezas no seleccionadas ocultas. Clic para mostrar todo el mueble."
                        : "Invert Hide: Ocultar todo lo visible no seleccionado para que queden únicamente presentes los tableros y herrajes de este paso."
                    }
                    className={`px-3 py-1 rounded-full text-[9.5px] font-bold border transition flex items-center gap-1.5 cursor-pointer shrink-0 ${
                      pasoActivo.ocultarNoAsignadas
                        ? "bg-[#1368AA] text-white border-[#1368AA] shadow-sm ring-2 ring-[#1368AA]/30"
                        : "bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-700 shadow-sm"
                    }`}
                  >
                    {pasoActivo.ocultarNoAsignadas ? (
                      <EyeOff className="w-3.5 h-3.5 text-white" />
                    ) : (
                      <Eye className="w-3.5 h-3.5 text-[#1368AA]" />
                    )}
                    <span>{pasoActivo.ocultarNoAsignadas ? `Invert Hide (Solo ${pasoActivo.id})` : "Invert Hide"}</span>
                  </button>
                </div>
              </div>

              {/* Piezas Asignadas (Chips en Cápsula de Pieza Madre) */}
              {((pasoActivo.piezasAsignadas || []).length > 0 || (pasoActivo.herrajesAsignados || []).length > 0) ? (
                <div className="flex flex-col gap-2 pt-1 border-t border-slate-200/50 dark:border-slate-800/50">
                  {/* Tableros de Madera */}
                  {(pasoActivo.piezasAsignadas || []).length > 0 && (
                    <div className="flex flex-col gap-1">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1">
                        <Layers className="w-2.5 h-2.5 text-amber-600" /> Tableros ({pasoActivo.piezasAsignadas.length})
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {pasoActivo.piezasAsignadas.map((pz) => {
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
                          return (
                            <span
                              key={h}
                              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9.5px] font-semibold bg-slate-200/70 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700"
                            >
                              <span className="truncate max-w-[140px]">{hLimpio}</span>
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

            {/* 🗄️ CONTROL DE VISIBILIDAD DE BLOQUES FUNCIONALES (P00) EN PASO DE ENSAMBLE */}
            {(() => {
              const pasoP00 = pasosManual.find((p) => p.id === "P00" || p.tipo === "showcase");
              const bloques = pasoP00?.showcase?.gruposCinematicos || [];
              if (bloques.length === 0) return null;

              const algunOculto = bloques.some((g) => g.oculto);

              return (
                <div className="flex flex-col gap-2 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="text-xs">🗄️</span>
                      <span className="font-bold text-xs text-slate-800 dark:text-slate-100 truncate">
                        Bloques Funcionales ({bloques.length})
                      </span>
                      <span className="text-[9px] font-semibold px-2 py-0.2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 shrink-0">
                        P00
                      </span>
                    </div>

                    {/* Botón Maestro: Ocultar / Mostrar Todos */}
                    <button
                      type="button"
                      onClick={() => pasoP00 && conmutarVisibilidadTodosGruposCinematicos(pasoP00.id, !algunOculto)}
                      className={`px-2.5 py-1 rounded-full text-[9.5px] font-bold border transition flex items-center gap-1 cursor-pointer shrink-0 ${
                        algunOculto
                          ? "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30 hover:bg-amber-500/20"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200"
                      }`}
                      title={algunOculto ? "Mostrar todos los bloques funcionales en 3D" : "Ocultar todos los bloques funcionales en 3D para despejar el ensamble"}
                    >
                      {algunOculto ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                      <span>{algunOculto ? "Mostrar Todos" : "Ocultar Todos"}</span>
                    </button>
                  </div>

                  {/* Lista de Bloques Funcionales con su Ojito individual */}
                  <div className="flex flex-col gap-1.5 pt-1 border-t border-slate-200/50 dark:border-slate-800/50 max-h-48 overflow-y-auto pr-0.5">
                    {bloques.map((grupo) => {
                      const esPuerta = grupo.tipo === "puerta";
                      const estaOculto = Boolean(grupo.oculto);

                      return (
                        <div
                          key={grupo.id}
                          className={`flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-full border transition ${
                            estaOculto
                              ? "bg-amber-500/5 border-amber-500/30 opacity-70"
                              : "bg-slate-50 dark:bg-slate-800/50 border-slate-200/80 dark:border-slate-800"
                          }`}
                        >
                          <div className="flex items-center gap-1.5 min-w-0 flex-1">
                            <span className="text-xs shrink-0 select-none">
                              {esPuerta ? "🚪" : "🗄️"}
                            </span>
                            <span className="font-semibold text-[10.5px] text-slate-800 dark:text-slate-100 truncate">
                              {grupo.nombre}
                            </span>
                            <span className="text-[9px] opacity-60 shrink-0 font-mono">
                              ({grupo.piezas.length} pzas)
                            </span>
                          </div>

                          {/* Botón Bombillito / Ojito por bloque */}
                          <button
                            type="button"
                            onClick={() => pasoP00 && conmutarVisibilidadGrupoCinematico(pasoP00.id, grupo.id)}
                            title={estaOculto ? "Mostrar este bloque en 3D" : "Ocultar este bloque en 3D"}
                            className={`p-1 rounded-full transition shrink-0 cursor-pointer border ${
                              estaOculto
                                ? "bg-amber-500/20 text-amber-500 border-amber-500/40 hover:bg-amber-500/30"
                                : "bg-white dark:bg-slate-900 text-slate-400 hover:text-amber-500 border-slate-200 dark:border-slate-700"
                            }`}
                          >
                            {estaOculto ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

            {/* Pieza Master / Base de Banco */}
            <div className="flex flex-col gap-1.5 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-500/5">
              <div className="flex items-center justify-between">
                <span className="font-bold flex items-center gap-1 text-xs">
                  <Box className="w-3.5 h-3.5 text-cyan-600" /> Pieza Master (Banco de Trabajo)
                </span>
                <span className="text-[10px] opacity-60">Apoyada fija</span>
              </div>

              <select
                value={pasoActivo.piezaMaster || ""}
                onChange={(e) => actualizarPasoManual(pasoActivo.id, { piezaMaster: e.target.value })}
                className="w-full px-3 py-1.5 rounded-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold outline-none cursor-pointer"
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

              {/* Botonera de Orientación Banco de Trabajo (Giro X / Y / Z) */}
              {(() => {
                const rotacionBanco = pasoActivo.orientacionBanco?.rotacion || [0, 0, 0];
                const rotX = rotacionBanco[0] || 0;
                const rotY = rotacionBanco[1] || 0;
                const rotZ = rotacionBanco[2] || 0;

                const isXPosActive = rotX === 90;
                const isXNegActive = rotX === -90;
                const isYPosActive = rotY === 90;
                const isYNegActive = rotY === -90;
                const isZPosActive = rotZ === 90;
                const isZNegActive = rotZ === -90;

                const toggleRotacionBanco = (eje: "X" | "Y" | "Z", anguloObjetivo: 90 | -90) => {
                  const anguloActual = eje === "X" ? rotX : eje === "Y" ? rotY : rotZ;
                  const nuevoAngulo = anguloActual === anguloObjetivo ? 0 : anguloObjetivo;
                  const nuevoX = eje === "X" ? nuevoAngulo : rotX;
                  const nuevoY = eje === "Y" ? nuevoAngulo : rotY;
                  const nuevoZ = eje === "Z" ? nuevoAngulo : rotZ;

                  actualizarPasoManual(pasoActivo.id, {
                    orientacionBanco: {
                      rotacion: [nuevoX, nuevoY, nuevoZ],
                      apoyoEnPiso: pasoActivo.orientacionBanco?.apoyoEnPiso ?? true,
                    },
                  });
                };

                return (
                  <div className="flex flex-col gap-1.5 pt-1.5 border-t border-slate-200/60 dark:border-slate-800/60">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-slate-600 dark:text-slate-300">
                        Giro Banco de Trabajo:
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className="px-2.5 py-0.5 rounded-full bg-slate-200/80 dark:bg-slate-800 text-[10px] font-mono font-bold text-[#1368AA] dark:text-blue-400">
                          X: {rotX}° | Y: {rotY}° | Z: {rotZ}°
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

                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        type="button"
                        onClick={() => toggleRotacionBanco("X", 90)}
                        title={isXPosActive ? "Desactivar giro X +90° (volver a 0°)" : "Activar giro X +90°"}
                        className={`flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold shadow-xs active:scale-95 transition-all cursor-pointer ${
                          isXPosActive
                            ? "bg-[#1368AA] text-white border-[#1368AA] shadow-sm"
                            : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:border-[#1368AA] hover:text-[#1368AA] dark:hover:text-blue-400"
                        }`}
                      >
                        <RotateCw className={`w-3.5 h-3.5 ${isXPosActive ? "text-white" : "text-[#1368AA] dark:text-blue-400"}`} />
                        <span>Giro X +90°</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => toggleRotacionBanco("X", -90)}
                        title={isXNegActive ? "Desactivar giro X -90° (volver a 0°)" : "Activar giro X -90°"}
                        className={`flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold shadow-xs active:scale-95 transition-all cursor-pointer ${
                          isXNegActive
                            ? "bg-[#1368AA] text-white border-[#1368AA] shadow-sm"
                            : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:border-[#1368AA] hover:text-[#1368AA] dark:hover:text-blue-400"
                        }`}
                      >
                        <RotateCcw className={`w-3.5 h-3.5 ${isXNegActive ? "text-white" : "text-[#1368AA] dark:text-blue-400"}`} />
                        <span>Giro X -90°</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => toggleRotacionBanco("Y", 90)}
                        title={isYPosActive ? "Desactivar giro Y +90° (volver a 0°)" : "Activar giro Y +90°"}
                        className={`flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold shadow-xs active:scale-95 transition-all cursor-pointer ${
                          isYPosActive
                            ? "bg-[#1368AA] text-white border-[#1368AA] shadow-sm"
                            : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:border-[#1368AA] hover:text-[#1368AA] dark:hover:text-blue-400"
                        }`}
                      >
                        <RotateCw className={`w-3.5 h-3.5 ${isYPosActive ? "text-white" : "text-[#1368AA] dark:text-blue-400"}`} />
                        <span>Giro Y +90°</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => toggleRotacionBanco("Y", -90)}
                        title={isYNegActive ? "Desactivar giro Y -90° (volver a 0°)" : "Activar giro Y -90°"}
                        className={`flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold shadow-xs active:scale-95 transition-all cursor-pointer ${
                          isYNegActive
                            ? "bg-[#1368AA] text-white border-[#1368AA] shadow-sm"
                            : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:border-[#1368AA] hover:text-[#1368AA] dark:hover:text-blue-400"
                        }`}
                      >
                        <RotateCcw className={`w-3.5 h-3.5 ${isYNegActive ? "text-white" : "text-[#1368AA] dark:text-blue-400"}`} />
                        <span>Giro Y -90°</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => toggleRotacionBanco("Z", 90)}
                        title={isZPosActive ? "Desactivar giro Z +90° (volver a 0°)" : "Activar giro Z +90°"}
                        className={`flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold shadow-xs active:scale-95 transition-all cursor-pointer ${
                          isZPosActive
                            ? "bg-[#1368AA] text-white border-[#1368AA] shadow-sm"
                            : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:border-[#1368AA] hover:text-[#1368AA] dark:hover:text-blue-400"
                        }`}
                      >
                        <RotateCw className={`w-3.5 h-3.5 ${isZPosActive ? "text-white" : "text-[#1368AA] dark:text-blue-400"}`} />
                        <span>Giro Z +90°</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => toggleRotacionBanco("Z", -90)}
                        title={isZNegActive ? "Desactivar giro Z -90° (volver a 0°)" : "Activar giro Z -90°"}
                        className={`flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold shadow-xs active:scale-95 transition-all cursor-pointer ${
                          isZNegActive
                            ? "bg-[#1368AA] text-white border-[#1368AA] shadow-sm"
                            : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:border-[#1368AA] hover:text-[#1368AA] dark:hover:text-blue-400"
                        }`}
                      >
                        <RotateCcw className={`w-3.5 h-3.5 ${isZNegActive ? "text-white" : "text-[#1368AA] dark:text-blue-400"}`} />
                        <span>Giro Z -90°</span>
                      </button>
                    </div>
                  </div>
                );
              })()}

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
          </div>
        )}
      </div>
    </div>
  );
}
