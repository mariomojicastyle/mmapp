"use client";

import React from "react";
import {
  Timer,
  Move,
  Wrench,
  Crosshair,
  Layers,
  Eye,
  EyeOff,
  Camera,
  Sparkles,
  RefreshCw,
  RotateCcw,
} from "lucide-react";
import { ConfiguracionCinematicaPaso, PiezaEsperaConfig } from "@/lib/store";

interface CalibradorGlobalControlsProps {
  config: ConfiguracionCinematicaPaso;
  totalPiezas: number;
  piezasConConfig: PiezaEsperaConfig[];
  vistaPiezasDesplazadas: boolean;
  autoEnfoqueCamaraManual: boolean;
  onCambiarModoTiempo: (modo: "global" | "por_capa") => void;
  onCambiarParametroGlobal: (
    campo: "velocidadPiezasCmS" | "velocidadHerrajesCmS" | "distanciaAproximacionHerrajesCm",
    valor: number
  ) => void;
  onToggleVistaDesplazadas: (activar: boolean) => void;
  onToggleAutoEnfoque: () => void;
  onExtraerOrdenDesdeGuion: () => void;
  onSincronizarHerrajesYEscena: () => void;
  onResetearTodasLasPosiciones: () => void;
}

export function CalibradorGlobalControls({
  config,
  totalPiezas,
  piezasConConfig,
  vistaPiezasDesplazadas,
  autoEnfoqueCamaraManual,
  onCambiarModoTiempo,
  onCambiarParametroGlobal,
  onToggleVistaDesplazadas,
  onToggleAutoEnfoque,
  onExtraerOrdenDesdeGuion,
  onSincronizarHerrajesYEscena,
  onResetearTodasLasPosiciones,
}: CalibradorGlobalControlsProps) {
  const modoTiempo = config.modoTiempo || "global";

  return (
    <div className="flex flex-col gap-3">
      {/* 1. Selector de Modo de Tiempo: Global vs Por Capa */}
      <div className="flex items-center justify-between p-2 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60">
        <div className="flex items-center gap-1.5">
          <Timer className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
          <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300">
            Control de Tiempo:
          </span>
        </div>
        <div className="flex items-center gap-1 bg-white dark:bg-slate-900 p-0.5 rounded-full border border-slate-200 dark:border-slate-700">
          <button
            type="button"
            onClick={() => onCambiarModoTiempo("global")}
            title="El tiempo de cada pieza se calcula automáticamente por su distancia y velocidad física"
            className={`px-2.5 py-0.5 rounded-full text-[9.5px] font-bold transition cursor-pointer select-none ${
              modoTiempo === "global"
                ? "bg-cyan-600 text-white shadow-xs"
                : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            Tiempo Global (cm/s)
          </button>
          <button
            type="button"
            onClick={() => onCambiarModoTiempo("por_capa")}
            title="Definir el tiempo de animación individualmente en cada una de las capas"
            className={`px-2.5 py-0.5 rounded-full text-[9.5px] font-bold transition cursor-pointer select-none ${
              modoTiempo === "por_capa"
                ? "bg-cyan-600 text-white shadow-xs"
                : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            Por Capa (s)
          </button>
        </div>
      </div>

      {/* Velocidades Globales y Movimiento Global de Herrajes */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {/* Velocidad Piezas */}
        <div
          className={`p-2.5 rounded-2xl border transition flex flex-col gap-1.5 ${
            modoTiempo === "global"
              ? "bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/60"
              : "bg-slate-50/50 dark:bg-slate-800/20 border-slate-200/50 dark:border-slate-700/30 opacity-60"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
              <Move className="w-3 h-3 text-cyan-600" /> Velocidad Tableros
            </span>
            <div className="flex items-center gap-1">
              <input
                type="number"
                min="1"
                max="100"
                disabled={modoTiempo !== "global"}
                value={config.velocidadPiezasCmS || 15}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  onCambiarParametroGlobal("velocidadPiezasCmS", isNaN(val) ? 15 : val);
                }}
                className="w-12 px-1.5 py-0.2 rounded-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 font-mono font-bold text-[10px] text-center text-cyan-600 dark:text-cyan-400 focus:outline-none focus:border-cyan-500 shadow-2xs disabled:opacity-40"
              />
              <span className="text-[9.5px] font-bold text-cyan-600 dark:text-cyan-400">cm/s</span>
            </div>
          </div>
          <input
            type="range"
            min="5"
            max="40"
            step="1"
            disabled={modoTiempo !== "global"}
            value={config.velocidadPiezasCmS || 15}
            onChange={(e) =>
              onCambiarParametroGlobal("velocidadPiezasCmS", parseInt(e.target.value, 10))
            }
            className="w-full accent-cyan-600 h-1 bg-slate-200 dark:bg-slate-700 rounded-full cursor-pointer disabled:opacity-40"
          />
          <span className="text-[9px] opacity-50 text-right">
            Suave (5) ➔ Rápido (40 cm/s)
          </span>
        </div>

        {/* Velocidad Herrajes */}
        <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
              <Wrench className="w-3 h-3 text-emerald-600" /> Inserción Herrajes
            </span>
            <div className="flex items-center gap-1">
              <input
                type="number"
                min="1"
                max="100"
                value={config.velocidadHerrajesCmS || 8}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  onCambiarParametroGlobal("velocidadHerrajesCmS", isNaN(val) ? 8 : val);
                }}
                className="w-12 px-1.5 py-0.2 rounded-full border border-emerald-300 dark:border-emerald-700 bg-white dark:bg-slate-900 font-mono font-bold text-[10px] text-center text-emerald-600 dark:text-emerald-400 focus:outline-none focus:border-emerald-500 shadow-2xs"
              />
              <span className="text-[9.5px] font-bold text-emerald-600 dark:text-emerald-400">cm/s</span>
            </div>
          </div>
          <input
            type="range"
            min="3"
            max="25"
            step="1"
            value={config.velocidadHerrajesCmS || 8}
            onChange={(e) =>
              onCambiarParametroGlobal("velocidadHerrajesCmS", parseInt(e.target.value, 10))
            }
            className="w-full accent-emerald-600 h-1 bg-slate-200 dark:bg-slate-700 rounded-full cursor-pointer"
          />
          <span className="text-[9px] opacity-50 text-right">
            Didáctico (3) ➔ Ágil (25 cm/s)
          </span>
        </div>

        {/* 📏 Movimiento Global Herrajes (Distancia Punto A -> Punto B en cm) */}
        <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <span
              className="text-[10px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1"
              title="Distancia de desplazamiento de los herrajes desde el Punto A hacia el Punto B"
            >
              <Crosshair className="w-3 h-3 text-sky-600" /> Movimiento Global
            </span>
            <div className="flex items-center gap-1">
              <input
                type="number"
                min="1"
                max="100"
                value={config.distanciaAproximacionHerrajesCm || 15}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  onCambiarParametroGlobal("distanciaAproximacionHerrajesCm", isNaN(val) ? 15 : val);
                }}
                className="w-12 px-1.5 py-0.2 rounded-full border border-sky-300 dark:border-sky-700 bg-white dark:bg-slate-900 font-mono font-bold text-[10px] text-center text-sky-600 dark:text-sky-400 focus:outline-none focus:border-sky-500 shadow-2xs"
              />
              <span className="text-[9.5px] font-bold text-sky-600 dark:text-sky-400">cm</span>
            </div>
          </div>
          <input
            type="range"
            min="5"
            max="50"
            step="1"
            value={config.distanciaAproximacionHerrajesCm || 15}
            onChange={(e) =>
              onCambiarParametroGlobal("distanciaAproximacionHerrajesCm", parseInt(e.target.value, 10))
            }
            className="w-full accent-sky-600 h-1 bg-slate-200 dark:bg-slate-700 rounded-full cursor-pointer"
          />
          <div className="flex items-center justify-between text-[9px] opacity-60">
            <span>Punto A ➔ Punto B</span>
            <span>5 ➔ 50 cm</span>
          </div>
        </div>
      </div>

      {/* 2. Barra de Herramientas de Capas: Botones de Modo, Cámara y Sincronización */}
      <div className="flex flex-wrap items-center justify-between gap-1 px-0.5">
        <span className="text-[10.5px] font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
          <Layers className="w-3 h-3 text-cyan-600" /> Capas de Animación
        </span>
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* 🔘 Switch On/Off: Posición Original (CAD) vs Piezas Desplazadas (Armado Piso XY) */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-full border border-slate-300 dark:border-slate-700 shadow-2xs">
            <button
              type="button"
              onClick={() => onToggleVistaDesplazadas(false)}
              title="Visualizar mueble en su posición original CAD ensamblada"
              className={`flex items-center gap-1 text-[9.5px] font-bold px-2.5 py-0.5 rounded-full transition cursor-pointer select-none ${
                !vistaPiezasDesplazadas
                  ? "bg-slate-700 dark:bg-slate-600 text-white shadow-xs"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              }`}
            >
              <EyeOff className="w-2.5 h-2.5" />
              <span>Original (CAD)</span>
            </button>
            <button
              type="button"
              onClick={() => onToggleVistaDesplazadas(true)}
              title="Visualizar piezas desplazadas en el piso XY listas para iniciar el armado"
              className={`flex items-center gap-1 text-[9.5px] font-bold px-2.5 py-0.5 rounded-full transition cursor-pointer select-none ${
                vistaPiezasDesplazadas
                  ? "bg-cyan-600 dark:bg-[#1368AA] text-white shadow-xs"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              }`}
            >
              <Eye className="w-2.5 h-2.5" />
              <span>Desplazadas (Piso XY)</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse ml-0.5" />
            </button>
          </div>

          {/* 🎥 Auto-Enfoque Dinámico de Cámara */}
          <button
            type="button"
            onClick={onToggleAutoEnfoque}
            title={
              autoEnfoqueCamaraManual
                ? "Auto-enfoque inteligente de cámara activado (encuadra al 100% las piezas y herrajes al aparecer)"
                : "Auto-enfoque de cámara desactivado"
            }
            className={`flex items-center gap-1 text-[9.5px] font-bold px-2.5 py-0.5 rounded-full transition cursor-pointer select-none shadow-2xs border ${
              autoEnfoqueCamaraManual
                ? "bg-cyan-600 dark:bg-[#1368AA] text-white border-cyan-500 shadow-xs"
                : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-300 dark:border-slate-700 hover:text-slate-700 dark:hover:text-slate-200"
            }`}
          >
            <Camera className="w-2.5 h-2.5" />
            <span>Cámara Auto</span>
            {autoEnfoqueCamaraManual && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse ml-0.5" />
            )}
          </button>

          <button
            type="button"
            onClick={onExtraerOrdenDesdeGuion}
            title="Extraer el orden cronológico de armado directamente del guión narrativo"
            className="flex items-center gap-1 text-[9.5px] text-amber-700 dark:text-amber-300 hover:text-amber-800 dark:hover:text-amber-200 font-semibold px-2.5 py-0.5 rounded-full border border-amber-300 dark:border-amber-700 bg-amber-50/80 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/60 transition cursor-pointer shadow-2xs"
          >
            <Sparkles className="w-2.5 h-2.5 text-amber-600" />
            <span>Extraer orden del guión</span>
          </button>

          {/* 🔄 Botón de Sincronización / Escaneo Manual de Herrajes con Escena 3D */}
          <button
            type="button"
            onClick={onSincronizarHerrajesYEscena}
            title="Escanear y posicionar todos los herrajes nuevos en sus piezas sobre el piso"
            className="flex items-center gap-1 text-[9.5px] text-cyan-700 dark:text-cyan-300 hover:text-cyan-800 dark:hover:text-cyan-200 font-semibold px-2.5 py-0.5 rounded-full border border-cyan-300 dark:border-cyan-700 bg-cyan-50/80 dark:bg-cyan-950/40 hover:bg-cyan-100 dark:hover:bg-cyan-900/60 transition cursor-pointer shadow-2xs"
          >
            <RefreshCw className="w-2.5 h-2.5 text-cyan-600" />
            <span>Sincronizar herrajes</span>
          </button>

          {piezasConConfig.some((p) => p.offsetXCm !== 0 || (p.offsetYCm ?? p.offsetZCm ?? 0) !== 0) && (
            <button
              type="button"
              onClick={onResetearTodasLasPosiciones}
              title="Restablecer todas las piezas al origen (X: 0, Y: 0)"
              className="flex items-center gap-1 text-[9.5px] text-rose-600 dark:text-rose-400 hover:text-rose-700 font-semibold px-2 py-0.5 rounded-full border border-rose-200 dark:border-rose-900 bg-rose-50/70 dark:bg-rose-950/40 transition cursor-pointer"
            >
              <RotateCcw className="w-2.5 h-2.5" />
              <span>Resetear todo</span>
            </button>
          )}
          <span className="text-[9.5px] opacity-60">
            {totalPiezas} piezas
          </span>
        </div>
      </div>
    </div>
  );
}
