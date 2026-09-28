"use client";

import React, { useState } from "react";
import { Plus, Sliders, Gauge, Move, RotateCw, RotateCcw, ArrowDown, Play } from "lucide-react";
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
    removerHerrajePlus,
    toggleCongelarHerrajePlus,
    definirPiezaMasterPlus,
    actualizarOffsetBancoMasterPlus,
    actualizarTiempoAcopleMasterPlus,
    girarBancoGlobalPlus,
    toggleApoyoPisoGlobalPlus,
    togglePonerDePieAlFinalPlus,
    setParametrosDePieAlFinalPlus,
    toggleBloqueHeredadoPlus: toggleBloqueHeredadoCapaPlus,
    toggleVisibilidadBloqueHeredadoPlus: toggleVisibilidadBloqueHeredadoCapaPlus,
    setVelocidadTablerosPlus,
    setVelocidadHerrajesPlus,
    setMovimientoGlobalPlus,
    toggleColapsarCapaPlus,
    setColapsarTodasCapasPlus,
    posicionarHerrajesEnPiezaPlus,
  } = use3BFStore() as any;

  const [draggedCapaIndex, setDraggedCapaIndex] = useState<number | null>(null);
  const [dragOverCapaIndex, setDragOverCapaIndex] = useState<number | null>(null);

  const mpConfig = pasoActivo.multiplePlus || {
    velocidadTablerosCmS: 15,
    velocidadHerrajesCmS: 8,
    movimientoGlobalCm: 20,
    capas: [],
  };

  const capas = mpConfig.capas || [];

  const rotBanco = pasoActivo.orientacionBanco?.rotacion || [0, 0, 0];
  const rotX = rotBanco[0] || 0;
  const rotY = rotBanco[1] || 0;
  const apoyoEnPiso = pasoActivo.orientacionBanco?.apoyoEnPiso ?? true;

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
              onFocus={(e) => {
                const t = e.currentTarget;
                setTimeout(() => t.select(), 0);
              }}
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
              onFocus={(e) => {
                const t = e.currentTarget;
                setTimeout(() => t.select(), 0);
              }}
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
          <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 dark:text-emerald-300 shrink-0">
            <Move className="w-3 h-3 text-emerald-500" />
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
            className="w-full accent-emerald-500 cursor-pointer h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg"
          />
          <div className="flex items-center gap-0.5 shrink-0">
            <input
              type="number"
              min={0}
              max={200}
              value={mpConfig.movimientoGlobalCm ?? 20}
              onFocus={(e) => {
                const t = e.currentTarget;
                setTimeout(() => t.select(), 0);
              }}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                setMovimientoGlobalPlus(pasoActivo.id, isNaN(val) ? 0 : Math.max(0, val));
              }}
              className="w-12 px-1.5 py-0.5 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[10px] font-mono font-bold text-center text-slate-800 dark:text-slate-100 outline-none focus:border-emerald-500 shadow-2xs cursor-text"
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

        {/* 🧭 Controladores Globales de Rotación de Banco y Suelo */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Giro X -90° */}
          <button
            type="button"
            onClick={() => girarBancoGlobalPlus(pasoActivo.id, "X", -90)}
            title="Girar banco X -90° (Acostar hacia atrás)"
            className={`px-3 py-1 rounded-full border text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1 shadow-2xs ${
              rotX === -90
                ? "bg-cyan-500 text-white border-cyan-500 shadow-sm"
                : "bg-white/90 dark:bg-slate-800/90 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-cyan-400"
            }`}
          >
            <RotateCcw className="w-3 h-3" />
            <span>X-90°</span>
          </button>

          {/* Giro X +90° */}
          <button
            type="button"
            onClick={() => girarBancoGlobalPlus(pasoActivo.id, "X", 90)}
            title="Girar banco X +90° (Acostar hacia adelante)"
            className={`px-3 py-1 rounded-full border text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1 shadow-2xs ${
              rotX === 90
                ? "bg-cyan-500 text-white border-cyan-500 shadow-sm"
                : "bg-white/90 dark:bg-slate-800/90 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-cyan-400"
            }`}
          >
            <RotateCw className="w-3 h-3" />
            <span>X+90°</span>
          </button>

          {/* Giro Y -90° */}
          <button
            type="button"
            onClick={() => girarBancoGlobalPlus(pasoActivo.id, "Y", -90)}
            title="Girar banco Y -90° (Rotar izquierda)"
            className={`px-3 py-1 rounded-full border text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1 shadow-2xs ${
              rotY === -90
                ? "bg-cyan-500 text-white border-cyan-500 shadow-sm"
                : "bg-white/90 dark:bg-slate-800/90 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-cyan-400"
            }`}
          >
            <RotateCcw className="w-3 h-3" />
            <span>Y-90°</span>
          </button>

          {/* Giro Y +90° */}
          <button
            type="button"
            onClick={() => girarBancoGlobalPlus(pasoActivo.id, "Y", 90)}
            title="Girar banco Y +90° (Rotar derecha)"
            className={`px-3 py-1 rounded-full border text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1 shadow-2xs ${
              rotY === 90
                ? "bg-cyan-500 text-white border-cyan-500 shadow-sm"
                : "bg-white/90 dark:bg-slate-800/90 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-cyan-400"
            }`}
          >
            <RotateCw className="w-3 h-3" />
            <span>Y+90°</span>
          </button>

          {/* Apoyar al ras del suelo */}
          <button
            type="button"
            onClick={() => toggleApoyoPisoGlobalPlus(pasoActivo.id)}
            title="Apoyar la cara inferior en el ras del suelo (Y = 0)"
            className={`px-3.5 py-1 rounded-full font-bold text-[10px] transition-all cursor-pointer border flex items-center gap-1 shadow-2xs ${
              apoyoEnPiso
                ? "bg-[#0088AA] dark:bg-[#0088AA] text-white border-[#0088AA] shadow-sm"
                : "bg-white/90 dark:bg-slate-800/90 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-cyan-400"
            }`}
          >
            <ArrowDown className="w-3 h-3" />
            <span>Suelo</span>
          </button>

          {/* 🌟 CÁPSULA DINÁMICA: DE PIE AL FINAL 🌟 */}
          {!mpConfig.ponerDePieAlFinal ? (
            <button
              type="button"
              onClick={() => togglePonerDePieAlFinalPlus(pasoActivo.id)}
              title="Animar puesta de pie del mueble al terminar el armado"
              className="px-3.5 py-1 rounded-full font-bold text-[10px] transition-all cursor-pointer border flex items-center gap-1.5 shadow-2xs bg-white/90 dark:bg-slate-800/90 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-amber-400 hover:text-amber-600 dark:hover:text-amber-400"
            >
              <RotateCw className="w-3 h-3 text-amber-500" />
              <span>De pie al final</span>
            </button>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-0.5 rounded-full border border-amber-400 dark:border-amber-500/80 bg-amber-500/15 dark:bg-amber-500/20 text-amber-800 dark:text-amber-200 shadow-xs transition-all">
              <button
                type="button"
                onClick={() => togglePonerDePieAlFinalPlus(pasoActivo.id)}
                title="Haga clic para desactivar la puesta de pie"
                className="flex items-center gap-1 font-bold text-[10px] cursor-pointer hover:opacity-80 text-amber-700 dark:text-amber-300"
              >
                <RotateCw className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                <span>De pie</span>
              </button>

              <div className="flex items-center gap-1.5 pl-2 border-l border-amber-400/50 dark:border-amber-500/40 text-[9px]">
                <span className="font-semibold text-[9px] text-slate-600 dark:text-slate-300">Inicio:</span>
                <div className="inline-flex items-center bg-white dark:bg-slate-800 border border-amber-300 dark:border-amber-600/70 rounded-full px-1.5 py-0.5 shadow-2xs">
                  <input
                    type="number"
                    value={mpConfig.tiempoInicioDePie ?? Math.max(0, (pasoActivo.duracionTotal || 10) - 4)}
                    min={0}
                    max={600}
                    step={1}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      if (!isNaN(val)) {
                        setParametrosDePieAlFinalPlus(pasoActivo.id, { tiempoInicio: val });
                      }
                    }}
                    title="Segundo exacto en que inicia el giro de puesta de pie"
                    className="w-10 text-center font-mono font-bold text-[9.5px] bg-transparent outline-none cursor-text text-slate-800 dark:text-slate-100"
                  />
                  <span className="text-[7.5px] font-mono font-bold text-slate-400 dark:text-slate-400 select-none">s</span>
                </div>

                <span className="font-semibold text-[9px] text-slate-600 dark:text-slate-300 ml-0.5">Dur:</span>
                <div className="inline-flex items-center bg-white dark:bg-slate-800 border border-amber-300 dark:border-amber-600/70 rounded-full px-1.5 py-0.5 shadow-2xs">
                  <input
                    type="number"
                    value={mpConfig.duracionDePie ?? 4.0}
                    min={0.5}
                    max={30}
                    step={0.5}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      if (!isNaN(val)) {
                        setParametrosDePieAlFinalPlus(pasoActivo.id, { duracion: val });
                      }
                    }}
                    title="Duración en segundos del giro de levantamiento"
                    className="w-8 text-center font-mono font-bold text-[9.5px] bg-transparent outline-none cursor-text text-slate-800 dark:text-slate-100"
                  />
                  <span className="text-[7.5px] font-mono font-bold text-slate-400 dark:text-slate-400 select-none">s</span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const tInicio = mpConfig.tiempoInicioDePie ?? Math.max(0, (pasoActivo.duracionTotal || 10) - 4);
                    const tArrancada = Math.max(0, tInicio - 0.5);
                    setTimelineCurrentTime(tArrancada);
                    setIsTimelinePlaying(true);
                  }}
                  title="Saltar a la maniobra y reproducir el levantamiento"
                  className="ml-0.5 px-2.5 py-0.5 rounded-full bg-amber-500 hover:bg-amber-600 active:scale-95 text-white font-bold text-[8.5px] shadow-2xs cursor-pointer flex items-center gap-1 transition"
                >
                  <Play className="w-2.5 h-2.5 fill-current" />
                  <span>Probar</span>
                </button>
              </div>
            </div>
          )}
        </div>

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
      </div>

      {/* ── LISTA DE TARJETAS DE CAPAS ── */}
      {capas.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-8 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 text-center gap-2 bg-slate-50/40 dark:bg-slate-900/30">
          <span className="text-sm font-bold text-slate-600 dark:text-slate-300">
            No hay capas creadas todavía en este paso
          </span>
          <span className="text-xs text-slate-400 max-w-sm">
            Haz clic en <strong>+ Nueva Capa</strong> para crear una capa limpia. Luego activa el bombillo de picking para seleccionar tableros y herrajes en el visor 3D.
          </span>
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
