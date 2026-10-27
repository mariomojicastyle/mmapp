"use client";

import React, { useState } from "react";
import { Plus, Sliders, Gauge, Move, Zap, ChevronDown, Eye, EyeOff } from "lucide-react";
import { PasoManualStudio } from "@/lib/storeTypes";
import { use3BFStore } from "@/lib/store";
import { CapaMultiplePlusCard } from "./CapaMultiplePlusCard";
import { CapaHeredadosCard } from "./CapaHeredadosCard";
import { CapaInactivosCard } from "./CapaInactivosCard";

interface MultiplePlusSectionProps {
  pasoActivo: PasoManualStudio;
  botonActivoColor?: string;
}

export default function MultiplePlusSection({
  pasoActivo,
  botonActivoColor = "#0088AA",
}: MultiplePlusSectionProps) {
  const {
    pasosManual,
    piezaEnPosicionamientoManual,
    modoPickingManual,
    setHerrajesHovered,
    setPiezaEnPosicionamientoManual,
    iniciarPickingManual,
    limpiarPickingManual,
    conmutarOcultarNoAsignadasPaso,
    setTimelineCurrentTime,
    setIsTimelinePlaying,
    // Acciones de MultiplePlusSlice
    crearCapaPlus,
    eliminarCapaPlus,
    toggleVisibilidadCapaPlus,
    renombrarCapaPlus,
    reordenarCapasPlus,
    actualizarTableroPlus,
    removerTableroPlus,
    actualizarHerrajePlus,
    actualizarCinematicaFamiliaPlus,
    removerHerrajePlus,
    toggleCongelarHerrajePlus,
    definirPiezaMasterPlus,
    actualizarOffsetBancoMasterPlus,
    actualizarTiempoAcopleMasterPlus,
    toggleBloqueHeredadoPlus: toggleBloqueHeredadoCapaPlus,
    toggleVisibilidadBloqueHeredadoPlus: toggleVisibilidadBloqueHeredadoCapaPlus,
    setVelocidadTablerosPlus,
    setVelocidadHerrajesPlus,
    setMovimientoGlobalPlus,
    toggleColapsarCapaPlus,
    setColapsarTodasCapasPlus,
    posicionarHerrajesEnPiezaPlus,
    cargarBloqueFuncionalEnPaso,
    conmutarVisibilidadGrupoCinematico,
  } = use3BFStore() as any;

  const [draggedCapaIndex, setDraggedCapaIndex] = useState<number | null>(null);
  const [dragOverCapaIndex, setDragOverCapaIndex] = useState<number | null>(null);
  const [mostrarMenuImportarBF, setMostrarMenuImportarBF] = useState(false);
  const menuImportarBFRef = React.useRef<HTMLDivElement>(null);

  const pasoP00 = React.useMemo(() => {
    return pasosManual.find((p: any) => p.showcase?.gruposCinematicos && p.showcase.gruposCinematicos.length > 0) || pasosManual[0];
  }, [pasosManual]);

  // Bloques funcionales / cinemáticos disponibles (Cajones, Puertas)
  const gruposCinematicosDisponibles = React.useMemo(() => {
    return pasoP00?.showcase?.gruposCinematicos || [];
  }, [pasoP00]);

  // Cerrar menú al hacer clic fuera
  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuImportarBFRef.current && !menuImportarBFRef.current.contains(e.target as Node)) {
        setMostrarMenuImportarBF(false);
      }
    };
    if (mostrarMenuImportarBF) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [mostrarMenuImportarBF]);

  const mpConfig = pasoActivo.multiplePlus || {
    velocidadTablerosCmS: 15,
    velocidadHerrajesCmS: 8,
    movimientoGlobalCm: 20,
    capas: [],
  };

  const capas = mpConfig.capas || [];

  // Bloques funcionales vinculados o presentes en las capas de este paso
  const bloquesFuncionalesEnPaso = React.useMemo(() => {
    const list: any[] = [];
    capas.forEach((cp: any) => {
      const g = gruposCinematicosDisponibles.find(
        (grp: any) =>
          (cp.bloqueFuncionalId && grp.id === cp.bloqueFuncionalId) ||
          cp.nombre?.toLowerCase().includes(grp.nombre?.toLowerCase())
      );
      if (g && !list.some((item) => item.id === g.id)) {
        list.push(g);
      }
    });
    return list;
  }, [capas, gruposCinematicosDisponibles]);

  return (
    <div className="flex flex-col gap-3.5">
      {/* ── BARRA SUPERIOR GLOBAL: 3 SLIDERS DE VELOCIDAD Y MOVIMIENTO ── */}
      <div className="p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-black/[0.02] dark:bg-white/[0.02] flex flex-wrap items-center justify-between gap-3">
        {/* Slider 1: Velocidad Tableros (cm/s) */}
        <div className="flex items-center gap-2 min-w-[190px] flex-1">
          <div className="flex items-center gap-1 text-[10px] font-bold text-amber-700 dark:text-amber-300 shrink-0">
            <Gauge className="w-3 h-3 text-amber-500" />
            <span>Tableros:</span>
          </div>
          <input
            type="range"
            min={1}
            max={60}
            step={1}
            value={mpConfig.velocidadTablerosCmS ?? 15}
            onChange={(e) => setVelocidadTablerosPlus(pasoActivo.id, parseInt(e.target.value, 10) || 1)}
            className="w-full accent-amber-500 cursor-pointer h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg"
          />
          <div className="flex items-center gap-0.5 shrink-0">
            <input
              type="number"
              min={1}
              max={60}
              value={mpConfig.velocidadTablerosCmS ?? 15}
              onFocus={(e) => e.currentTarget.select()}
              onClick={(e) => e.currentTarget.select()}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                setVelocidadTablerosPlus(pasoActivo.id, isNaN(val) ? 1 : Math.max(1, val));
              }}
              className="w-12 px-1.5 py-0.5 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[10px] font-mono font-bold text-center text-slate-800 dark:text-slate-100 outline-none focus:border-amber-500 shadow-2xs cursor-text"
            />
            <span className="text-[9.5px] font-bold text-slate-500">cm/s</span>
          </div>
        </div>

        {/* Slider 2: Inserción Herrajes (cm/s) */}
        <div className="flex items-center gap-2 min-w-[190px] flex-1">
          <div className="flex items-center gap-1 text-[10px] font-bold text-cyan-700 dark:text-cyan-300 shrink-0">
            <Gauge className="w-3 h-3 text-cyan-500" />
            <span>Herrajes:</span>
          </div>
          <input
            type="range"
            min={1}
            max={40}
            step={1}
            value={mpConfig.velocidadHerrajesCmS ?? 8}
            onChange={(e) => setVelocidadHerrajesPlus(pasoActivo.id, parseInt(e.target.value, 10) || 1)}
            className="w-full accent-cyan-500 cursor-pointer h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg"
          />
          <div className="flex items-center gap-0.5 shrink-0">
            <input
              type="number"
              min={1}
              max={80}
              value={mpConfig.velocidadHerrajesCmS ?? 8}
              onFocus={(e) => e.currentTarget.select()}
              onClick={(e) => e.currentTarget.select()}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                setVelocidadHerrajesPlus(pasoActivo.id, isNaN(val) ? 1 : Math.max(1, val));
              }}
              className="w-12 px-1.5 py-0.5 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[10px] font-mono font-bold text-center text-slate-800 dark:text-slate-100 outline-none focus:border-cyan-500 shadow-2xs cursor-text"
            />
            <span className="text-[9.5px] font-bold text-slate-500">cm/s</span>
          </div>
        </div>

        {/* Slider 3: Movimiento Global (cm) */}
        <div className="flex items-center gap-2 min-w-[190px] flex-1">
          <div className="flex items-center gap-1 text-[10px] font-bold text-cyan-700 dark:text-cyan-300 shrink-0">
            <Move className="w-3 h-3 text-[#0088AA] dark:text-[#38BDF8]" />
            <span>Desplazamiento:</span>
          </div>
          <input
            type="range"
            min={0}
            max={80}
            step={1}
            value={mpConfig.movimientoGlobalCm ?? 20}
            onChange={(e) => {
              const val = parseInt(e.target.value, 10);
              setMovimientoGlobalPlus(pasoActivo.id, isNaN(val) ? 0 : Math.max(0, val));
            }}
            className="w-full accent-[#0088AA] dark:accent-[#38BDF8] cursor-pointer h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg"
          />
          <div className="flex items-center gap-0.5 shrink-0">
            <input
              type="number"
              min={0}
              max={200}
              value={mpConfig.movimientoGlobalCm ?? 20}
              onFocus={(e) => e.currentTarget.select()}
              onClick={(e) => e.currentTarget.select()}
              onChange={(e) => {
                const raw = e.target.value;
                if (raw === "") {
                  setMovimientoGlobalPlus(pasoActivo.id, 0);
                  return;
                }
                const val = parseInt(raw, 10);
                setMovimientoGlobalPlus(pasoActivo.id, isNaN(val) ? 0 : Math.max(0, val));
              }}
              className="w-12 px-1.5 py-0.5 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[10px] font-mono font-bold text-center text-slate-800 dark:text-slate-100 outline-none focus:border-[#0088AA] shadow-2xs cursor-text"
            />
            <span className="text-[10px] font-bold text-slate-500">cm</span>
          </div>
        </div>
      </div>

      {/* ── CABECERA DE CAPAS Y CONTROLADORES GLOBALES DE BANCO ── */}
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
            Capas de Armado Múltiple Plus ({capas.length})
          </span>
          {capas.length > 1 && (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setColapsarTodasCapasPlus(pasoActivo.id, false)}
                title="Expandir todas las capas de este paso"
                className="px-2.5 py-0.5 rounded-full text-[9.5px] font-bold border border-slate-200 dark:border-slate-700 bg-white/90 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:border-cyan-500 hover:text-cyan-600 dark:hover:text-cyan-400 transition cursor-pointer shadow-2xs"
              >
                ▾ Expandir todas
              </button>
              <button
                type="button"
                onClick={() => setColapsarTodasCapasPlus(pasoActivo.id, true)}
                title="Colapsar todas las capas para vista compacta"
                className="px-2.5 py-0.5 rounded-full text-[9.5px] font-bold border border-slate-200 dark:border-slate-700 bg-white/90 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:border-cyan-500 hover:text-cyan-600 dark:hover:text-cyan-400 transition cursor-pointer shadow-2xs"
              >
                ▸ Colapsar todas
              </button>
            </div>
          )}
        </div>

        {/* Botones de creación de capa */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Botón + Nueva Capa */}
          <button
            type="button"
            onClick={() => crearCapaPlus(pasoActivo.id)}
            style={{ backgroundColor: botonActivoColor }}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-white text-xs font-bold shadow-md hover:opacity-90 active:scale-95 transition cursor-pointer shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Nueva Capa</span>
          </button>

          {/* 🗄️ Botones Espejo de Visibilidad para Bloques Funcionales de este paso */}
          {bloquesFuncionalesEnPaso.map((grupoBF) => (
            <button
              key={grupoBF.id}
              type="button"
              onClick={() => pasoP00 && conmutarVisibilidadGrupoCinematico(pasoP00.id, grupoBF.id)}
              title={
                grupoBF.oculto
                  ? `Bloque Funcional oculto en 3D. Clic para mostrar ${grupoBF.nombre}`
                  : `Bloque Funcional visible en 3D. Clic para ocultar ${grupoBF.nombre}`
              }
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition cursor-pointer shadow-md active:scale-95 shrink-0 ${
                grupoBF.oculto
                  ? "bg-[#1368AA] text-white border-[#1368AA] shadow-sm animate-pulse"
                  : "bg-white dark:bg-slate-800 text-cyan-700 dark:text-cyan-300 border-cyan-400/60 dark:border-cyan-700 shadow-2xs hover:bg-cyan-50 dark:hover:bg-cyan-950/40"
              }`}
            >
              <span>🗄️</span>
              <span>{grupoBF.nombre}</span>
              {grupoBF.oculto ? (
                <EyeOff className="w-3.5 h-3.5 text-white" />
              ) : (
                <Eye className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
              )}
            </button>
          ))}

          {/* ⚡ BOTÓN Cargar Bloque Funcional con Popover Selector (A la derecha para desplegar hacia el interior) */}
          {gruposCinematicosDisponibles.length > 0 && (
            <div className="relative" ref={menuImportarBFRef}>
              <button
                type="button"
                onClick={() => setMostrarMenuImportarBF(!mostrarMenuImportarBF)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-white text-xs font-bold shadow-md bg-[#0088AA] hover:bg-[#007799] dark:bg-[#1368AA] dark:hover:bg-[#115b94] border border-cyan-400/40 transition cursor-pointer active:scale-95 shrink-0"
                title="Poblar automáticamente este paso con las piezas de un cajón o bloque funcional específico"
              >
                <Zap className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                <span>Cargar Bloque Funcional</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${mostrarMenuImportarBF ? "rotate-180" : ""}`} />
              </button>

              {/* Popover selector de Cajón / Bloque Funcional alineado hacia la derecha */}
              {mostrarMenuImportarBF && (
                <div className="absolute right-0 top-full mt-1.5 w-72 p-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl z-50 flex flex-col gap-1.5 animate-in fade-in-50 zoom-in-95 text-xs">
                  <div className="flex items-center justify-between pb-1.5 border-b border-slate-100 dark:border-slate-800 px-1 font-bold text-slate-800 dark:text-slate-100">
                    <span className="flex items-center gap-1.5 text-cyan-700 dark:text-cyan-400">
                      <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                      <span>Elegir Cajón / Bloque</span>
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {gruposCinematicosDisponibles.length} disp.
                    </span>
                  </div>

                  <p className="text-[10.5px] text-slate-500 dark:text-slate-400 px-1 py-0.5 leading-tight">
                    Crea una capa limpia con todas las piezas y herrajes de este bloque y despeja el banco de trabajo:
                  </p>

                  <div className="flex flex-col gap-1 max-h-52 overflow-y-auto custom-scrollbar pt-1">
                    {gruposCinematicosDisponibles.map((grupo: any, idx: number) => {
                      const totalPzs = (grupo.piezas || []).length;
                      return (
                        <div
                          key={grupo.id}
                          onClick={() => {
                            cargarBloqueFuncionalEnPaso(pasoActivo.id, grupo.id);
                            setMostrarMenuImportarBF(false);
                          }}
                          className="flex items-center justify-between p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-cyan-400 dark:hover:border-cyan-600 hover:bg-cyan-50/50 dark:hover:bg-cyan-950/30 cursor-pointer transition-all group"
                        >
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-cyan-100 dark:bg-cyan-900/60 text-cyan-800 dark:text-cyan-200 font-black text-[10px] flex items-center justify-center shrink-0">
                              {idx + 1}
                            </span>
                            <div className="min-w-0">
                              <div className="font-bold text-slate-800 dark:text-slate-100 group-hover:text-cyan-700 dark:group-hover:text-cyan-300 text-[11px] truncate">
                                {grupo.nombre}
                              </div>
                              <div className="text-[9px] text-slate-400 dark:text-slate-500 font-mono">
                                {totalPzs} componentes
                              </div>
                            </div>
                          </div>
                          <span className="px-2 py-0.5 rounded-full bg-cyan-600 dark:bg-cyan-700 text-white text-[9px] font-bold shrink-0 group-hover:bg-cyan-700">
                            Cargar
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── LISTA DE TARJETAS DE CAPAS ── */}
      {capas.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-8 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 text-center gap-2.5 bg-slate-50/40 dark:bg-slate-900/30">
          <span className="text-sm font-bold text-slate-600 dark:text-slate-300">
            No hay capas creadas todavía en este paso
          </span>
          <span className="text-xs text-slate-400 max-w-sm">
            Haz clic en <strong>+ Nueva Capa</strong> para crear una capa limpia o carga un cajón completo con 1 clic:
          </span>
          <div className="flex items-center gap-2 pt-1.5 flex-wrap justify-center">
            <button
              type="button"
              onClick={() => crearCapaPlus(pasoActivo.id)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:border-cyan-400 text-xs font-bold shadow-xs active:scale-95 transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Nueva Capa Vacía</span>
            </button>

            {gruposCinematicosDisponibles.length > 0 && (
              <button
                type="button"
                onClick={() => cargarBloqueFuncionalEnPaso(pasoActivo.id, gruposCinematicosDisponibles[0].id)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-white bg-[#0088AA] hover:bg-[#007799] dark:bg-[#1368AA] dark:hover:bg-[#115b94] border border-cyan-400/40 text-xs font-bold shadow-md active:scale-95 transition cursor-pointer"
              >
                <Zap className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                <span>⚡ Armar {gruposCinematicosDisponibles[0].nombre} (1 Clic)</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {capas.map((capa: any, index: number) => (
            <CapaMultiplePlusCard
              key={capa.id}
              capa={capa}
              paso={pasoActivo}
              pasosManual={pasosManual}
              botonActivoColor={botonActivoColor}
              piezaEnPosicionamiento={piezaEnPosicionamientoManual}
              modoPickingManual={modoPickingManual}
              indexCapa={index}
              esDragOver={dragOverCapaIndex === index}
              onHoverHerrajes={setHerrajesHovered}
              onToggleVisibilidadCapa={(cId) => toggleVisibilidadCapaPlus(pasoActivo.id, cId)}
              onRenombrarCapa={(cId, nombre) => renombrarCapaPlus(pasoActivo.id, cId, nombre)}
              onDragStartCapa={(e, idx) => {
                setDraggedCapaIndex(idx);
                e.dataTransfer.setData("text/plain", idx.toString());
                e.dataTransfer.effectAllowed = "move";
              }}
              onDragOverCapa={(e, idx) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = "move";
                if (dragOverCapaIndex !== idx) {
                  setDragOverCapaIndex(idx);
                }
              }}
              onDragLeaveCapa={(e, idx) => {
                if (dragOverCapaIndex === idx) {
                  setDragOverCapaIndex(null);
                }
              }}
              onDropCapa={(e, idx) => {
                e.preventDefault();
                setDragOverCapaIndex(null);
                setDraggedCapaIndex(null);
                const origenStr = e.dataTransfer.getData("text/plain");
                const origen = parseInt(origenStr, 10);
                if (!isNaN(origen) && origen !== idx) {
                  reordenarCapasPlus(pasoActivo.id, origen, idx);
                }
              }}
              onDragEndCapa={() => {
                setDraggedCapaIndex(null);
                setDragOverCapaIndex(null);
              }}
              onEliminarCapa={(cId) => eliminarCapaPlus(pasoActivo.id, cId)}
              onActualizarTablero={(cId, tId, partial) => actualizarTableroPlus(pasoActivo.id, cId, tId, partial)}
              onRemoverTablero={(cId, tId) => removerTableroPlus(pasoActivo.id, cId, tId)}
              onActualizarHerraje={(cId, hId, partial) => actualizarHerrajePlus(pasoActivo.id, cId, hId, partial)}
              onActualizarCinematicaFamilia={actualizarCinematicaFamiliaPlus}
              onRemoverHerraje={(cId, hId) => removerHerrajePlus(pasoActivo.id, cId, hId)}
              onToggleCongelarHerraje={(cId, hId) => toggleCongelarHerrajePlus(pasoActivo.id, cId, hId)}
              onDefinirMaster={(cId, pNombre) => definirPiezaMasterPlus(pasoActivo.id, cId, pNombre)}
              onActualizarOffsetMaster={(cId, offset) => actualizarOffsetBancoMasterPlus(pasoActivo.id, cId, offset)}
              onActualizarTiempoAcopleMaster={(cId, tAcople, durAcople) => actualizarTiempoAcopleMasterPlus(pasoActivo.id, cId, tAcople, durAcople)}
              onToggleColapsar={(cId) => toggleColapsarCapaPlus(pasoActivo.id, cId)}
              onTogglePosicionar={(tId) => {
                const estaActivo = typeof piezaEnPosicionamientoManual === "string"
                  ? piezaEnPosicionamientoManual === tId
                  : (piezaEnPosicionamientoManual?.nombrePieza === tId && piezaEnPosicionamientoManual?.pasoId === pasoActivo.id);
                if (estaActivo) {
                  setPiezaEnPosicionamientoManual(null);
                } else {
                  setPiezaEnPosicionamientoManual({ pasoId: pasoActivo.id, nombrePieza: tId });
                }
              }}
              onIniciarPickingCapa={(cId) => iniciarPickingManual(pasoActivo.id, cId, "agregar")}
              onLimpiarPicking={limpiarPickingManual}
              onToggleBloqueHeredado={(cId, bId) => toggleBloqueHeredadoCapaPlus(pasoActivo.id, cId, bId)}
              onToggleVisibilidadBloqueHeredado={(cId, bId) => toggleVisibilidadBloqueHeredadoCapaPlus(pasoActivo.id, cId, bId)}
              onInvertirSeleccion={() => conmutarOcultarNoAsignadasPaso(pasoActivo.id)}
              onPosicionarHerrajesEnPieza={(cId) => posicionarHerrajesEnPiezaPlus(pasoActivo.id, cId)}
            />
          ))}
        </div>
      )}

      {/* ── CAPA DE OBJETOS HEREDADOS (PASOS PREVIOS / SÓLIDO POR DEFECTO) ── */}
      <CapaHeredadosCard
        paso={pasoActivo}
        pasosManual={pasosManual}
        botonActivoColor={botonActivoColor}
      />

      {/* ── CAPA VIRTUAL DE INACTIVOS (MUEBLE COMPLETO / MODO CRISTAL) ── */}
      <CapaInactivosCard
        paso={pasoActivo}
        pasosManual={pasosManual}
        botonActivoColor={botonActivoColor}
      />
    </div>
  );
}
