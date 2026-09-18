"use client";

import React from "react";
import { Sliders, ChevronDown, Sparkles } from "lucide-react";
import { PasoManualStudio } from "@/lib/store";
import { useCalibradorCinematica, extraerOrdenDePiezasDesdeGuion } from "./calibrador/useCalibradorCinematica";
import { CalibradorGlobalControls } from "./calibrador/CalibradorGlobalControls";
import { CapaPiezaEsperaItem } from "./calibrador/CapaPiezaEsperaItem";

export { extraerOrdenDePiezasDesdeGuion };

interface CalibradorCinematicaSectionProps {
  pasoActivo: PasoManualStudio;
}

export default function CalibradorCinematicaSection({
  pasoActivo,
}: CalibradorCinematicaSectionProps) {
  const {
    colapsado,
    setColapsado,
    config,
    tablerosAsignados,
    piezasConConfig,
    piezaMasterNombre,
    contactosPorHerraje,
    herrajesEnContactoPorPieza,
    piezaEnPosicionamientoManual,
    vistaPiezasDesplazadas,
    autoEnfoqueCamaraManual,
    draggedPiezaNombre,
    dragOverPiezaNombre,
    mensajeGuion,
    draggedHerraje,
    setDraggedHerraje,
    dragOverCongeladorPieza,
    setDragOverCongeladorPieza,
    dragOverNormalPieza,
    setDragOverNormalPieza,
    setHerrajesHovered,
    handleCambiarParametroGlobal,
    handleCambiarOffsetPieza,
    handleResetOffsetPieza,
    handleResetearTodasLasPosiciones,
    handleToggleVistaDesplazadas,
    handleSincronizarHerrajesYEscena,
    handleTogglePosicionarEnEscenario,
    handleDefinirPiezaMaster,
    handleExtraerOrdenDesdeGuion,
    handleToggleHerraje,
    handleCongelarHerraje,
    handleDescongelarHerraje,
    handleCambiarDireccionHerraje,
    handleCambiarModoTiempo,
    handleDragStart,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleDragEnd,
    handleCambiarTiempoAparicionHerraje,
    handleCambiarTiempoAparicionPieza,
    handleCambiarTiempoFinHerrajesPieza,
    handleCambiarTiempoPieza,
    comprobarHerrajeActivoEnTiempo,
    compilarCinematicaAutomatica,
    setAutoEnfoqueCamaraManual,
  } = useCalibradorCinematica(pasoActivo);

  return (
    <div className="flex flex-col gap-2.5 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm text-xs mt-3">
      {/* Cabecera del Panel con Acordeón */}
      <div
        onClick={() => setColapsado(!colapsado)}
        className="flex items-center justify-between cursor-pointer select-none group"
      >
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-6 h-6 rounded-full bg-cyan-500/10 flex items-center justify-center text-cyan-600 dark:text-cyan-400 shrink-0">
            <Sliders className="w-3.5 h-3.5" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-bold text-[11px] text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
              Animador {pasoActivo.id}
              <span className="px-2 py-0.2 rounded-full bg-cyan-100 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300 text-[9.5px] font-bold">
                Capas de Animación
              </span>
            </span>
            <span className="text-[10px] opacity-60">
              Control de capas, pre-ensamble de herrajes en contacto y tiempos
            </span>
          </div>
        </div>

        <button
          type="button"
          className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition cursor-pointer"
        >
          <ChevronDown
            className={`w-3.5 h-3.5 transition-transform duration-200 ${
              colapsado ? "-rotate-90" : "rotate-0"
            }`}
          />
        </button>
      </div>

      {!colapsado && (
        <div className="flex flex-col gap-3 pt-1 border-t border-slate-100 dark:border-slate-800/80">
          {/* Controles Globales (Velocidades, cm, botones y switches) */}
          <CalibradorGlobalControls
            config={config}
            totalPiezas={tablerosAsignados.length}
            piezasConConfig={piezasConConfig}
            vistaPiezasDesplazadas={vistaPiezasDesplazadas}
            autoEnfoqueCamaraManual={autoEnfoqueCamaraManual}
            onCambiarModoTiempo={handleCambiarModoTiempo}
            onCambiarParametroGlobal={handleCambiarParametroGlobal}
            onToggleVistaDesplazadas={handleToggleVistaDesplazadas}
            onToggleAutoEnfoque={() => setAutoEnfoqueCamaraManual(!autoEnfoqueCamaraManual)}
            onExtraerOrdenDesdeGuion={handleExtraerOrdenDesdeGuion}
            onSincronizarHerrajesYEscena={handleSincronizarHerrajesYEscena}
            onResetearTodasLasPosiciones={handleResetearTodasLasPosiciones}
          />

          {/* Mensaje de feedback del guión narrativo */}
          {mensajeGuion && (
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 text-[9.5px] font-medium flex items-center justify-between">
              <span>{mensajeGuion}</span>
              <button
                type="button"
                onClick={() => handleDefinirPiezaMaster(piezaMasterNombre)}
                className="text-[9px] underline font-bold hover:text-amber-900 ml-2"
              >
                Aplicar
              </button>
            </div>
          )}

          {/* Lista de Capas (Piezas en Espera) */}
          <div className="flex flex-col gap-2">
            {piezasConConfig.map((p) => {
              const esMaster = p.nombrePieza === piezaMasterNombre;
              const estaPosicionando =
                piezaEnPosicionamientoManual?.nombrePieza === p.nombrePieza;
              const estaSiendoArrastrada = draggedPiezaNombre === p.nombrePieza;
              const estaSobreDrag = dragOverPiezaNombre === p.nombrePieza;
              const herrajesPieza = herrajesEnContactoPorPieza[p.nombrePieza] || [];

              return (
                <CapaPiezaEsperaItem
                  key={p.nombrePieza}
                  pieza={p}
                  esMaster={esMaster}
                  estaPosicionando={estaPosicionando}
                  estaSiendoArrastrada={estaSiendoArrastrada}
                  estaSobreDrag={estaSobreDrag}
                  herrajesPieza={herrajesPieza}
                  contactosPorHerraje={contactosPorHerraje}
                  piezasConConfig={piezasConConfig}
                  modoTiempo={config.modoTiempo || "global"}
                  draggedHerraje={draggedHerraje}
                  dragOverNormalPieza={dragOverNormalPieza}
                  dragOverCongeladorPieza={dragOverCongeladorPieza}
                  comprobarActivoEnTiempo={comprobarHerrajeActivoEnTiempo}
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onDefinirMaster={handleDefinirPiezaMaster}
                  onTogglePosicionar={handleTogglePosicionarEnEscenario}
                  onCambiarTiempoAparicion={handleCambiarTiempoAparicionPieza}
                  onCambiarTiempoFinHerrajes={handleCambiarTiempoFinHerrajesPieza}
                  onCambiarOffset={handleCambiarOffsetPieza}
                  onResetOffset={handleResetOffsetPieza}
                  onToggleHerraje={handleToggleHerraje}
                  onHoverHerrajes={setHerrajesHovered}
                  onCambiarDireccionHerraje={handleCambiarDireccionHerraje}
                  onCambiarTiempoHerraje={handleCambiarTiempoAparicionHerraje}
                  onCongelarHerraje={handleCongelarHerraje}
                  onDescongelarHerraje={handleDescongelarHerraje}
                  onCambiarTiempoPieza={handleCambiarTiempoPieza}
                  setDraggedHerraje={setDraggedHerraje}
                  setDragOverNormalPieza={setDragOverNormalPieza}
                  setDragOverCongeladorPieza={setDragOverCongeladorPieza}
                />
              );
            })}
          </div>

          {/* Pie de Panel: Duración y Botón de Cinemática */}
          <div className="pt-2 flex items-center justify-between gap-2 border-t border-slate-100 dark:border-slate-800">
            <div className="flex flex-col min-w-0">
              <span className="text-[9.5px] opacity-60">Duración calculada:</span>
              <span className="font-bold font-mono text-[11px] text-cyan-600 dark:text-cyan-400">
                {pasoActivo.duracionTotal?.toFixed(1) || "10.0"}s
              </span>
            </div>

            <button
              type="button"
              onClick={compilarCinematicaAutomatica}
              className="flex items-center gap-1.5 rounded-full bg-cyan-600 hover:bg-cyan-700 text-white px-3.5 py-1.5 text-[11px] font-bold shadow-sm transition active:scale-95 cursor-pointer shrink-0"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Generar Cinemática JSON</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}