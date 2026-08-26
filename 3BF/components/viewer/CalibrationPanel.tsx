"use client";

import React from "react";
import { use3BFStore, defaultCalibracion } from "@/lib/store";
import { Sliders, RotateCcw, Eye, Sun, Layers, Sparkles, X } from "lucide-react";

export default function CalibrationPanel() {
  const { calibracion, setCalibracion, resetCalibracion, setModoVisual } = use3BFStore();

  const isOpen = calibracion.mostrarPanelCalibracion;

  return (
    <div className="absolute top-3 left-3 z-30">
      {/* Botón de apertura/cierre del panel de calibración */}
      <button
        onClick={() => setCalibracion("mostrarPanelCalibracion", !isOpen)}
        className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shadow-md border cursor-pointer ${
          isOpen
            ? "bg-cyan-600 text-white border-cyan-400 ring-2 ring-cyan-500/30"
            : "bg-[#E2E8F0]/50 text-[#0F172A] border border-slate-300/60 backdrop-blur-sm hover:bg-[#E2E8F0]/80 hover:border-cyan-500"
        }`}
      >
        <Sliders className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
        <span>Calibrar 3D</span>
      </button>

      {/* Panel Flotante Desplegable */}
      {isOpen && (
        <div className="mt-2 w-80 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border border-gray-200 dark:border-gray-800 rounded-2xl shadow-2xl p-4 text-xs space-y-4 max-h-[80vh] overflow-y-auto custom-scrollbar animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-2">
            <div className="flex items-center gap-2 text-cyan-600 dark:text-cyan-400 font-bold text-sm">
              <Sparkles className="w-4 h-4" />
              <span>Calibración de Renderizado</span>
            </div>
            <button
              onClick={() => setCalibracion("mostrarPanelCalibracion", false)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Sección 1: Material del Tablero */}
          <div className="space-y-2.5">
            <div className="flex items-center gap-1.5 text-gray-800 dark:text-gray-200 font-semibold border-b border-gray-100 dark:border-gray-800/60 pb-1">
              <Layers className="w-3.5 h-3.5 text-cyan-500" />
              <span>Material del Tablero</span>
            </div>

            {/* Color Solido */}
            <div className="flex items-center justify-between">
              <label className="text-gray-600 dark:text-gray-400 font-medium">Color Sólido Base</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={calibracion.colorSolido}
                  onChange={(e) => setCalibracion("colorSolido", e.target.value)}
                  className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent"
                />
                <span className="font-mono text-[10px] text-gray-500 uppercase">{calibracion.colorSolido}</span>
              </div>
            </div>

            {/* Carga de Bitmap / Textura Personalizada */}
            <div className="pt-1 pb-1">
              <label className="text-gray-600 dark:text-gray-400 font-medium block mb-1">Textura Bitmap (Imagen JPG/PNG)</label>
              {calibracion.customTextureUrl ? (
                <div className="flex items-center justify-between gap-2 p-1.5 bg-cyan-50 dark:bg-cyan-950/40 border border-cyan-200 dark:border-cyan-800 rounded-lg">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <img src={calibracion.customTextureUrl} alt="Bitmap cargado" className="w-8 h-8 rounded border object-cover" />
                    <span className="text-[10px] text-cyan-700 dark:text-cyan-300 truncate font-semibold">Bitmap Personalizado</span>
                  </div>
                  <button
                    onClick={() => setCalibracion("customTextureUrl", null)}
                    className="px-2 py-1 bg-red-500 hover:bg-red-600 text-white rounded text-[10px] font-bold shadow transition"
                  >
                    Quitar
                  </button>
                </div>
              ) : (
                <label className="flex items-center justify-center gap-2 p-2 border-2 border-dashed border-cyan-300 dark:border-cyan-700 hover:border-cyan-500 bg-cyan-50/50 dark:bg-cyan-950/20 rounded-lg cursor-pointer transition text-cyan-700 dark:text-cyan-300 font-semibold text-[11px]">
                  <span>📁 Cargar Bitmap (JPG / PNG)</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (evt) => {
                          if (evt.target?.result) {
                            setCalibracion("customTextureUrl", evt.target.result as string);
                            setModoVisual("renderizado");
                          }
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                </label>
              )}
            </div>

            {/* Opacidad Madera */}
            <div>
              <div className="flex justify-between text-gray-600 dark:text-gray-400 mb-1">
                <span>Opacidad Solidez</span>
                <span className="font-mono font-bold text-cyan-600 dark:text-cyan-400">
                  {Math.round(calibracion.opacidadMadera * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={calibracion.opacidadMadera}
                onChange={(e) => setCalibracion("opacidadMadera", parseFloat(e.target.value))}
                className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-600"
              />
            </div>

            {/* Rugosidad */}
            <div>
              <div className="flex justify-between text-gray-600 dark:text-gray-400 mb-1">
                <span>Rugosidad (Roughness)</span>
                <span className="font-mono font-bold text-cyan-600 dark:text-cyan-400">
                  {calibracion.rugosidadMadera.toFixed(2)}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.02"
                value={calibracion.rugosidadMadera}
                onChange={(e) => setCalibracion("rugosidadMadera", parseFloat(e.target.value))}
                className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-600"
              />
            </div>

            {/* Metalicidad */}
            <div>
              <div className="flex justify-between text-gray-600 dark:text-gray-400 mb-1">
                <span>Metalicidad (Metalness)</span>
                <span className="font-mono font-bold text-cyan-600 dark:text-cyan-400">
                  {calibracion.metalicidadMadera.toFixed(2)}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.02"
                value={calibracion.metalicidadMadera}
                onChange={(e) => setCalibracion("metalicidadMadera", parseFloat(e.target.value))}
                className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-600"
              />
            </div>
          </div>

          {/* Sección 2: Aristas de Contorno Técnico */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-gray-800 dark:text-gray-200 font-semibold border-b border-gray-100 dark:border-gray-800/60 pb-1">
              <div className="flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-cyan-500" />
                <span>Aristas y Contornos</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={calibracion.mostrarAristas}
                  onChange={(e) => setCalibracion("mostrarAristas", e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-7 h-4 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all dark:after:border-gray-600 peer-checked:bg-cyan-600"></div>
              </label>
            </div>

            {calibracion.mostrarAristas && (
              <>
                {/* Color de Aristas */}
                <div className="flex items-center justify-between">
                  <label className="text-gray-600 dark:text-gray-400 font-medium">Color de Aristas</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={calibracion.colorAristas}
                      onChange={(e) => setCalibracion("colorAristas", e.target.value)}
                      className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent"
                    />
                    <span className="font-mono text-[10px] text-gray-500 uppercase">{calibracion.colorAristas}</span>
                  </div>
                </div>

                {/* Opacidad de Aristas */}
                <div>
                  <div className="flex justify-between text-gray-600 dark:text-gray-400 mb-1">
                    <span>Opacidad de Aristas</span>
                    <span className="font-mono font-bold text-cyan-600 dark:text-cyan-400">
                      {Math.round(calibracion.opacidadAristas * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={calibracion.opacidadAristas}
                    onChange={(e) => setCalibracion("opacidadAristas", parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-600"
                  />
                </div>

                {/* Ángulo Umbral de Aristas */}
                <div>
                  <div className="flex justify-between text-gray-600 dark:text-gray-400 mb-1">
                    <span>Ángulo Umbral (Detección)</span>
                    <span className="font-mono font-bold text-cyan-600 dark:text-cyan-400">
                      {calibracion.thresholdAristas}°
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="89"
                    step="1"
                    value={calibracion.thresholdAristas}
                    onChange={(e) => setCalibracion("thresholdAristas", parseInt(e.target.value))}
                    className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-600"
                  />
                </div>
              </>
            )}
          </div>

          {/* Sección 3: Iluminación de Estudio */}
          <div className="space-y-2.5">
            <div className="flex items-center gap-1.5 text-gray-800 dark:text-gray-200 font-semibold border-b border-gray-100 dark:border-gray-800/60 pb-1">
              <Sun className="w-3.5 h-3.5 text-amber-500" />
              <span>Iluminación de Estudio</span>
            </div>

            {/* Luz Directa Principal */}
            <div>
              <div className="flex justify-between text-gray-600 dark:text-gray-400 mb-1">
                <span>Luz Directa Principal (Sol)</span>
                <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                  {(calibracion.intensidadLuzDirecta ?? 1.5).toFixed(1)}x
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="3"
                step="0.05"
                value={calibracion.intensidadLuzDirecta ?? 1.5}
                onChange={(e) => setCalibracion("intensidadLuzDirecta", parseFloat(e.target.value))}
                className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
            </div>

            {/* Luz de Entorno HDRI */}
            <div>
              <div className="flex justify-between text-gray-600 dark:text-gray-400 mb-1">
                <span>Luz de Entorno HDRI (Reflejos/IBL)</span>
                <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                  {(calibracion.intensidadLuzEntorno ?? 1.0).toFixed(1)}x
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="3"
                step="0.05"
                value={calibracion.intensidadLuzEntorno ?? 1.0}
                onChange={(e) => setCalibracion("intensidadLuzEntorno", parseFloat(e.target.value))}
                className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
            </div>

            {/* Luz Ambiental */}
            <div>
              <div className="flex justify-between text-gray-600 dark:text-gray-400 mb-1">
                <span>Luz Ambiental Global</span>
                <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                  {(calibracion.intensidadLuzAmbiental ?? 0.8).toFixed(1)}x
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="2"
                step="0.05"
                value={calibracion.intensidadLuzAmbiental ?? 0.8}
                onChange={(e) => setCalibracion("intensidadLuzAmbiental", parseFloat(e.target.value))}
                className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
            </div>

            {/* Luz de Relleno */}
            <div>
              <div className="flex justify-between text-gray-600 dark:text-gray-400 mb-1">
                <span>Luz de Relleno (Fill Light)</span>
                <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                  {(calibracion.intensidadLuzRelleno ?? 0.4).toFixed(1)}x
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="2"
                step="0.05"
                value={calibracion.intensidadLuzRelleno ?? 0.4}
                onChange={(e) => setCalibracion("intensidadLuzRelleno", parseFloat(e.target.value))}
                className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
            </div>
          </div>

          {/* Botón de Reset */}
          <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
            <button
              onClick={resetCalibracion}
              className="w-full py-1.5 px-3 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center justify-center gap-1.5 font-medium transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restablecer Valores por Defecto</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
