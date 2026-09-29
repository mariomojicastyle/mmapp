"use client";

import React from "react";
import { use3BFStore, PasoManualStudio } from "@/lib/store";
import {
  Boxes,
  Layers,
  ArrowRight,
  Sliders,
  Clock,
  Sparkles,
  RotateCcw,
  CheckCircle2,
  PackageCheck
} from "lucide-react";

interface InsercionCajonesConfigSectionProps {
  pasoActivo: PasoManualStudio;
  botonActivoColor?: string;
}

export default function InsercionCajonesConfigSection({
  pasoActivo,
  botonActivoColor = "#0088AA",
}: InsercionCajonesConfigSectionProps) {
  const { pasosManual, actualizarPasoManual } = use3BFStore();

  const p00 = pasosManual.find((p) => p.id === "P00" || p.tipo === "showcase");
  const config = pasoActivo.insercionCajones || {};

  const distanciaAproxCm = config.distanciaAproximacionCm ?? 30;
  const distanciaAperturaMm = config.distanciaAperturaMm ?? p00?.showcase?.distanciaAperturaMm ?? 350;
  const coreografia = config.coreografia || "cascada";
  const orden = config.ordenInsercion || "descendente";
  const duracion = pasoActivo.duracionTotal ?? 12.0;

  // Grupos disponibles heredados de P00 o del paso
  const grupos = (config.gruposCinematicos && config.gruposCinematicos.length > 0)
    ? config.gruposCinematicos
    : (p00?.showcase?.gruposCinematicos || []).filter((g) => g.tipo === "cajon" || !g.tipo);

  const actualizarConfig = (cambios: Partial<typeof config>) => {
    actualizarPasoManual(pasoActivo.id, {
      insercionCajones: {
        ...config,
        ...cambios,
      },
    });
  };

  return (
    <div className="flex flex-col gap-4 text-xs">
      {/* 1. Tarjeta Informativa de Ensamble Fisiomecánico */}
      <div className="p-3.5 rounded-2xl border border-cyan-200/80 dark:border-cyan-800/40 bg-cyan-50/50 dark:bg-cyan-950/20 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              style={{ backgroundColor: botonActivoColor }}
              className="text-white text-[10.5px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-2xs"
            >
              <PackageCheck className="w-3 h-3" />
              {pasoActivo.id}
            </span>
            <span className="font-bold text-[12px] text-slate-800 dark:text-slate-100">
              Incorporación y Montaje de Cajones
            </span>
          </div>
          <span className="text-[10px] font-mono font-semibold px-2.5 py-0.5 rounded-full bg-cyan-100/70 dark:bg-cyan-900/40 text-cyan-800 dark:text-cyan-200">
            {grupos.length} Gavetas Mapeadas
          </span>
        </div>

        <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
          En el instante <strong>t = 0s</strong>, las correderas telescópicas intermedias se muestran extendidas y las gavetas suspendidas en el aire con <strong>{distanciaAproxCm} cm</strong> de aproximación. Al correr el tiempo, los cajones encastran en sus rieles y se deslizan suavemente hacia el interior del mueble hasta quedar 100% cerrados.
        </p>
      </div>

      {/* 2. Selector de Coreografía */}
      <div className="flex flex-col gap-1.5 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 shadow-2xs">
        <span className="text-[10.5px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Coreografía de Movimiento
        </span>
        <div className="grid grid-cols-3 gap-1.5 pt-0.5">
          <button
            type="button"
            onClick={() => actualizarConfig({ coreografia: "cascada" })}
            className={`py-1.5 px-2 rounded-full border text-[11px] font-bold transition-all cursor-pointer text-center ${
              coreografia === "cascada"
                ? "bg-[#0088AA] dark:bg-[#1368AA] text-white border-[#0088AA] dark:border-[#1368AA] shadow-sm"
                : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-cyan-400"
            }`}
          >
            Cascada
          </button>
          <button
            type="button"
            onClick={() => actualizarConfig({ coreografia: "simultaneo" })}
            className={`py-1.5 px-2 rounded-full border text-[11px] font-bold transition-all cursor-pointer text-center ${
              coreografia === "simultaneo"
                ? "bg-[#0088AA] dark:bg-[#1368AA] text-white border-[#0088AA] dark:border-[#1368AA] shadow-sm"
                : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-cyan-400"
            }`}
          >
            Simultáneo
          </button>
          <button
            type="button"
            onClick={() => actualizarConfig({ coreografia: "secuencial" })}
            className={`py-1.5 px-2 rounded-full border text-[11px] font-bold transition-all cursor-pointer text-center ${
              coreografia === "secuencial"
                ? "bg-[#0088AA] dark:bg-[#1368AA] text-white border-[#0088AA] dark:border-[#1368AA] shadow-sm"
                : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-cyan-400"
            }`}
          >
            Secuencial
          </button>
        </div>
      </div>

      {/* 3. Parámetros Físicos y Cinematográficos */}
      <div className="grid grid-cols-2 gap-2">
        {/* Distancia de Aproximación (cm) */}
        <div className="flex items-center justify-between p-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 shadow-2xs">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-slate-700 dark:text-slate-200">Aproximación Previa</span>
            <span className="text-[8.5px] text-slate-400">Retiro inicial antes de riel</span>
          </div>
          <div className="flex items-center gap-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full px-2 py-0.5 shadow-2xs">
            <input
              type="number"
              min={5}
              max={150}
              step={5}
              value={distanciaAproxCm}
              onFocus={(e) => {
                const t = e.currentTarget;
                setTimeout(() => t.select(), 0);
              }}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                if (!isNaN(val)) actualizarConfig({ distanciaAproximacionCm: val });
              }}
              className="w-9 text-center font-mono font-bold text-[10.5px] bg-transparent outline-none cursor-text text-slate-800 dark:text-slate-100"
            />
            <span className="text-[8.5px] font-mono font-bold text-slate-400 select-none">cm</span>
          </div>
        </div>

        {/* Carrera de Corredera (mm) */}
        <div className="flex items-center justify-between p-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 shadow-2xs">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-slate-700 dark:text-slate-200">Carrera Telescópica</span>
            <span className="text-[8.5px] text-slate-400">Extensión de corredera</span>
          </div>
          <div className="flex items-center gap-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full px-2 py-0.5 shadow-2xs">
            <input
              type="number"
              min={100}
              max={800}
              step={25}
              value={distanciaAperturaMm}
              onFocus={(e) => {
                const t = e.currentTarget;
                setTimeout(() => t.select(), 0);
              }}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                if (!isNaN(val)) actualizarConfig({ distanciaAperturaMm: val });
              }}
              className="w-10 text-center font-mono font-bold text-[10.5px] bg-transparent outline-none cursor-text text-slate-800 dark:text-slate-100"
            />
            <span className="text-[8.5px] font-mono font-bold text-slate-400 select-none">mm</span>
          </div>
        </div>

        {/* Duración Total del Paso (s) */}
        <div className="flex items-center justify-between p-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 shadow-2xs">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-slate-700 dark:text-slate-200">Duración del Paso</span>
            <span className="text-[8.5px] text-slate-400">Tiempo de animación</span>
          </div>
          <div className="flex items-center gap-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full px-2 py-0.5 shadow-2xs">
            <input
              type="number"
              min={3}
              max={60}
              step={1}
              value={duracion}
              onFocus={(e) => {
                const t = e.currentTarget;
                setTimeout(() => t.select(), 0);
              }}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                if (!isNaN(val)) actualizarPasoManual(pasoActivo.id, { duracionTotal: val });
              }}
              className="w-9 text-center font-mono font-bold text-[10.5px] bg-transparent outline-none cursor-text text-slate-800 dark:text-slate-100"
            />
            <span className="text-[8.5px] font-mono font-bold text-slate-400 select-none">s</span>
          </div>
        </div>

        {/* Orden de Inserción */}
        <div className="flex items-center justify-between p-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 shadow-2xs">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-slate-700 dark:text-slate-200">Secuencia</span>
            <span className="text-[8.5px] text-slate-400">Orden de montaje</span>
          </div>
          <select
            value={orden}
            onChange={(e) => actualizarConfig({ ordenInsercion: e.target.value as any })}
            className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full px-2 py-0.5 text-[9.5px] font-bold outline-none cursor-pointer shadow-2xs text-slate-700 dark:text-slate-200"
          >
            <option value="descendente">Superior ➔ Base</option>
            <option value="ascendente">Base ➔ Superior</option>
          </select>
        </div>
      </div>

      {/* 4. Lista de Cajones Heredados de P00 */}
      <div className="flex flex-col gap-2 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 shadow-2xs">
        <div className="flex items-center justify-between">
          <span className="text-[10.5px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Gavetas a Incorporar (Heredadas de P00)
          </span>
          <span className="text-[9.5px] text-slate-400">
            Sincronización automática
          </span>
        </div>

        <div className="flex flex-col gap-1.5 pt-1">
          {grupos.map((g, i) => (
            <div
              key={g.id || `cajon_${i}`}
              className="flex items-center justify-between px-3 py-2 rounded-full border border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/40"
            >
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-[#0088AA]/10 dark:bg-[#1368AA]/30 text-[#0088AA] dark:text-blue-300 flex items-center justify-center font-bold text-[10px]">
                  {i + 1}
                </span>
                <span className="font-bold text-[11px] text-slate-700 dark:text-slate-200">
                  {g.nombre || `Cajón ${i + 1}`}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[9.5px] font-mono text-slate-400">
                  {g.piezas?.length || 0} piezas
                </span>
                <span className="text-[9px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100/60 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300">
                  Listo para riel
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
