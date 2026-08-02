"use client";

import React, { useEffect } from "react";
import { use3BFStore } from "@/lib/store";
import { Sliders, Box, Layers, Palette, Cpu, CheckCircle2, AlertCircle } from "lucide-react";

// Componente para editar el número haciendo clic (con auto-clampeo al rango min-max)
const EditableNumberInput = ({
  value,
  min,
  max,
  unit = "mm",
  onChange,
  className = ""
}: {
  value: number;
  min: number;
  max: number;
  unit?: string;
  onChange: (val: number) => void;
  className?: string;
}) => {
  const [isEditing, setIsEditing] = React.useState(false);
  const [tempValue, setTempValue] = React.useState(String(value));

  React.useEffect(() => {
    setTempValue(String(value));
  }, [value]);

  const handleCommit = () => {
    let num = Number(tempValue);
    if (isNaN(num)) num = value;
    const clamped = Math.min(max, Math.max(min, num));
    setTempValue(String(clamped));
    onChange(clamped);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="flex items-center gap-1">
        <input
          type="number"
          min={min}
          max={max}
          value={tempValue}
          onChange={(e) => setTempValue(e.target.value)}
          onBlur={handleCommit}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleCommit();
            if (e.key === "Escape") {
              setTempValue(String(value));
              setIsEditing(false);
            }
          }}
          autoFocus
          className="w-16 px-1 py-0.5 text-right text-xs font-mono font-bold bg-white dark:bg-gray-800 border-2 border-cyan-500 rounded outline-none shadow-inner"
        />
        <span className="text-[11px] font-mono text-gray-500">{unit}</span>
      </div>
    );
  }

  return (
    <button
      onClick={() => setIsEditing(true)}
      title="Haz clic para ingresar la medida exacta"
      className={`font-mono font-bold hover:underline hover:text-cyan-500 cursor-pointer ${className}`}
    >
      {value} {unit}
    </button>
  );
};

export default function ControlPanel() {
  const { parametros, setParametro, cargando, setResultado, tema, setTema, workerStatus, setWorkerStatus, modoVisual, setModoVisual } = use3BFStore();

  // Función para re-calcular cuando cambian los parámetros
  const ejecutarComputo = async () => {
    try {
      const res = await fetch("/api/compute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model_id: parametros.model_id || "M00001", parameters: parametros }),
      });
      const data = await res.json();
      if (data.status === "success") {
        setResultado(data);
        if (data.rhino8_compute || data.execution_time_ms) {
          setWorkerStatus("online");
        }
      }
    } catch (err) {
      console.error("Error al calcular:", err);
      setWorkerStatus("offline");
    }
  };

  useEffect(() => {
    ejecutarComputo();
  }, [parametros]);

  return (
    <div className="p-4 flex flex-col gap-5 h-full overflow-y-auto">
      {/* Cabecera del Panel */}
      <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-2">
          <Sliders className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
          <h2 className="font-semibold text-base">Parámetros DfMA</h2>
        </div>

        {/* Estado del Worker Python */}
        <div className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <Cpu className="w-3.5 h-3.5 text-cyan-500" />
          <span>Worker:</span>
          {workerStatus === "online" ? (
            <span className="text-emerald-500 font-medium flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Online (Py)
            </span>
          ) : (
            <span className="text-amber-500 font-medium flex items-center gap-1">
              <AlertCircle className="w-3 h-3" /> API Fallback
            </span>
          )}
        </div>
      </div>

      {/* Selector de Tema y Modo Render 3D */}
      <div className="flex flex-col gap-2 bg-gray-50 dark:bg-gray-800/50 p-2.5 rounded-lg border border-gray-200 dark:border-gray-700 text-xs">
        <div className="flex items-center justify-between">
          <span className="font-medium text-gray-700 dark:text-gray-300">Estilo UI:</span>
          <div className="flex gap-1">
            <button
              onClick={() => {
                setTema("tech");
                document.documentElement.setAttribute("data-theme", "tech");
              }}
              className={`px-2 py-0.5 rounded-md transition ${tema === "tech" ? "bg-white text-gray-900 shadow-sm font-semibold" : "text-gray-500"}`}
            >
              Tech Ethos
            </button>
            <button
              onClick={() => {
                setTema("obsidian");
                document.documentElement.setAttribute("data-theme", "obsidian");
              }}
              className={`px-2 py-0.5 rounded-md transition ${tema === "obsidian" ? "bg-gray-700 text-white font-semibold" : "text-gray-400"}`}
            >
              Obsidian Teal
            </button>
          </div>
        </div>

        {/* Modo Renderizado 3D Rhino Technical */}
        <div className="flex items-center justify-between pt-1.5 border-t border-gray-200 dark:border-gray-700">
          <span className="font-semibold text-cyan-700 dark:text-cyan-400">Modo 3D (Rhino):</span>
          <div className="flex gap-1">
            <button
              onClick={() => setModoVisual("semitransparente")}
              className={`px-2 py-0.5 rounded-md transition text-[11px] ${modoVisual === "semitransparente" ? "bg-cyan-600 text-white font-bold shadow-sm" : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300"}`}
            >
              💎 Cristal
            </button>
            <button
              onClick={() => setModoVisual("solido")}
              className={`px-2 py-0.5 rounded-md transition text-[11px] ${modoVisual === "solido" ? "bg-cyan-600 text-white font-bold shadow-sm" : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300"}`}
            >
              🧱 Sólido
            </button>
            <button
              onClick={() => setModoVisual("lineas")}
              className={`px-2 py-0.5 rounded-md transition text-[11px] ${modoVisual === "lineas" ? "bg-cyan-600 text-white font-bold shadow-sm" : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300"}`}
            >
              📐 Líneas
            </button>
          </div>
        </div>
      </div>

      {/* Selector de Modelo Grasshopper */}
      <div className="flex flex-col gap-1.5 p-2 rounded-lg bg-cyan-50/60 dark:bg-cyan-950/40 border border-cyan-200 dark:border-cyan-800">
        <label className="text-xs font-semibold text-cyan-800 dark:text-cyan-300 flex items-center gap-1">
          <Layers className="w-3.5 h-3.5 text-cyan-600" /> Definición Paramétrica (.gh / .ghx)
        </label>
        <select
          value={parametros.model_id}
          onChange={(e) => setParametro("model_id", e.target.value)}
          className="text-xs p-2 rounded-md bg-white dark:bg-gray-800 border border-cyan-300 dark:border-cyan-700 outline-none font-medium cursor-pointer"
        >
          <option value="M00001">M00001 — Estantería Multifuncional</option>
          <option value="Cajon_Experimento_Viktor">🌾 Cajón Experimento Viktor (ShapeDiver .ghx)</option>
        </select>
        <span className="text-[10px] text-gray-500 font-mono">
          {parametros.model_id === "Cajon_Experimento_Viktor"
            ? "Leído desde temporal/Cajon_Experimental_ShapeDriver_02.ghx"
            : "Modelo Estándar RTA"}
        </span>
      </div>

      {/* Controles de Dimensiones */}
      <div className="flex flex-col gap-4">
        {/* Ancho */}
        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between text-xs font-medium">
            <label className="flex items-center gap-1 font-semibold text-gray-800 dark:text-gray-200">
              <Box className="w-3.5 h-3.5 text-cyan-600" /> Ancho
            </label>
            <EditableNumberInput
              value={parametros.ancho}
              min={300}
              max={1000}
              onChange={(val) => setParametro("ancho", val)}
              className="text-cyan-600 dark:text-cyan-400"
            />
          </div>
          <input
            type="range"
            min={300}
            max={1000}
            step={10}
            value={Math.min(1000, Math.max(300, parametros.ancho))}
            onChange={(e) => setParametro("ancho", Number(e.target.value))}
            className="w-full accent-cyan-600 cursor-pointer"
          />
        </div>

        {/* Alto */}
        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between text-xs font-medium">
            <label className="flex items-center gap-1 font-semibold text-gray-800 dark:text-gray-200">
              <Box className="w-3.5 h-3.5 text-cyan-600" /> Alto
            </label>
            <EditableNumberInput
              value={parametros.alto}
              min={300}
              max={1200}
              onChange={(val) => setParametro("alto", val)}
              className="text-cyan-600 dark:text-cyan-400"
            />
          </div>
          <input
            type="range"
            min={300}
            max={1200}
            step={10}
            value={Math.min(1200, Math.max(300, parametros.alto))}
            onChange={(e) => setParametro("alto", Number(e.target.value))}
            className="w-full accent-cyan-600 cursor-pointer"
          />
        </div>

        {/* Profundidad */}
        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between text-xs font-medium">
            <label className="flex items-center gap-1 font-semibold text-gray-800 dark:text-gray-200">
              <Box className="w-3.5 h-3.5 text-cyan-600" /> Profundidad
            </label>
            <EditableNumberInput
              value={parametros.profundidad}
              min={200}
              max={1000}
              onChange={(val) => setParametro("profundidad", val)}
              className="text-cyan-600 dark:text-cyan-400"
            />
          </div>
          <input
            type="range"
            min={200}
            max={1000}
            step={10}
            value={Math.min(1000, Math.max(200, parametros.profundidad))}
            onChange={(e) => setParametro("profundidad", Number(e.target.value))}
            className="w-full accent-cyan-600 cursor-pointer"
          />
        </div>

        {/* Controles Específicos para Cajón Experimento Viktor */}
        {parametros.model_id === "Cajon_Experimento_Viktor" && (
          <>
            {/* Cantidad de Cajones (Menú Desplegable) */}
            <div className="flex flex-col gap-1.5 p-2 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
              <div className="flex justify-between text-xs font-medium text-amber-900 dark:text-amber-300">
                <label className="flex items-center gap-1 font-semibold">
                  <Box className="w-3.5 h-3.5 text-amber-600" /> Cantidada de Cajones
                </label>
                <span className="font-mono font-bold">{parametros.cant_cajones || 3} {parametros.cant_cajones === 1 ? "Cajón" : "Cajones"}</span>
              </div>
              <select
                value={parametros.cant_cajones || 3}
                onChange={(e) => setParametro("cant_cajones", Number(e.target.value))}
                className="w-full text-xs p-1.5 rounded-md bg-white dark:bg-gray-800 border border-amber-300 dark:border-amber-700 outline-none font-semibold cursor-pointer"
              >
                <option value={1}>1 Cajón</option>
                <option value={2}>2 Cajones</option>
                <option value={3}>3 Cajones</option>
              </select>
            </div>

            {/* Abrir Cajones */}
            <div className="flex flex-col gap-1.5 p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
              <div className="flex justify-between text-xs font-medium text-emerald-900 dark:text-emerald-300">
                <label className="flex items-center gap-1 font-semibold">
                  <Box className="w-3.5 h-3.5 text-emerald-600" /> Abrir Cajones
                </label>
                <EditableNumberInput
                  value={parametros.apertura_cajones || 0}
                  min={0}
                  max={300}
                  onChange={(val) => setParametro("apertura_cajones", val)}
                  className="text-emerald-700 dark:text-emerald-300 font-bold"
                />
              </div>
              <input
                type="range"
                min={0}
                max={300}
                step={10}
                value={parametros.apertura_cajones || 0}
                onChange={(e) => setParametro("apertura_cajones", Number(e.target.value))}
                className="w-full accent-emerald-600 cursor-pointer"
              />
            </div>

            {/* Profundidad cajon (Menú Desplegable) */}
            <div className="flex flex-col gap-1.5 p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800">
              <div className="flex justify-between text-xs font-medium text-indigo-900 dark:text-indigo-300">
                <label className="flex items-center gap-1 font-semibold">
                  <Box className="w-3.5 h-3.5 text-indigo-600" /> Profundidad cajon
                </label>
                <span className="font-mono font-bold">{parametros.profundidad_cajon || 351} mm</span>
              </div>
              <select
                value={parametros.profundidad_cajon || 351}
                onChange={(e) => setParametro("profundidad_cajon", Number(e.target.value))}
                className="w-full text-xs p-1.5 rounded-md bg-white dark:bg-gray-800 border border-indigo-300 dark:border-indigo-700 outline-none font-semibold cursor-pointer"
              >
                <option value={351}>351 mm</option>
                <option value={400}>400 mm</option>
              </select>
            </div>

            {/* Altura lateral de cajon */}
            <div className="flex flex-col gap-1.5 p-2 rounded-lg bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800">
              <div className="flex justify-between text-xs font-medium text-purple-900 dark:text-purple-300">
                <label className="flex items-center gap-1 font-semibold">
                  <Box className="w-3.5 h-3.5 text-purple-600" /> Altura lateral de cajon
                </label>
                <EditableNumberInput
                  value={parametros.altura_lateral_cajon || 102}
                  min={50}
                  max={250}
                  onChange={(val) => setParametro("altura_lateral_cajon", val)}
                  className="text-purple-700 dark:text-purple-300 font-bold"
                />
              </div>
              <input
                type="range"
                min={50}
                max={250}
                step={5}
                value={parametros.altura_lateral_cajon || 102}
                onChange={(e) => setParametro("altura_lateral_cajon", Number(e.target.value))}
                className="w-full accent-purple-600 cursor-pointer"
              />
            </div>
          </>
        )}
      </div>


      {/* Selector de Material y Espesor */}
      <div className="flex flex-col gap-3 pt-2 border-t border-gray-200 dark:border-gray-800">
        <label className="text-xs font-medium flex items-center gap-1">
          <Layers className="w-3.5 h-3.5 text-cyan-600" /> Tablero & Espesor
        </label>
        <div className="grid grid-cols-2 gap-2">
          <select
            value={parametros.material}
            onChange={(e) => {
              setParametro("material", e.target.value);
              setParametro("espesor_madera", e.target.value.includes("18") ? 18 : 15);
            }}
            className="text-xs p-2 rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 outline-none focus:ring-1 focus:ring-cyan-500"
          >
            <option value="MDP_15mm">MDP 15mm (Seriado RTA)</option>
            <option value="MDF_18mm">MDF 18mm (Modulado)</option>
            <option value="Madera_Guadua">Guadua Ecológica</option>
          </select>

          <div className="flex items-center justify-center text-xs font-mono font-semibold bg-cyan-50 dark:bg-cyan-950/40 text-cyan-700 dark:text-cyan-300 rounded-lg border border-cyan-200 dark:border-cyan-800">
            {parametros.espesor_madera} mm
          </div>
        </div>
      </div>

      {/* Color y Herrajes */}
      <div className="flex flex-col gap-3 pt-2 border-t border-gray-200 dark:border-gray-800">
        <label className="text-xs font-medium flex items-center gap-1">
          <Palette className="w-3.5 h-3.5 text-cyan-600" /> Color de Acabado
        </label>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={parametros.color_acabado}
            onChange={(e) => setParametro("color_acabado", e.target.value)}
            className="w-8 h-8 rounded-md cursor-pointer border-0"
          />
          <span className="text-xs font-mono">{parametros.color_acabado}</span>
        </div>

        {/* Toggle Puertas */}
        <label className="flex items-center justify-between text-xs font-medium cursor-pointer mt-1 p-2 rounded-lg bg-gray-50 dark:bg-gray-800/40 border border-gray-200 dark:border-gray-700">
          <span>Incluir Puertas Frontales</span>
          <input
            type="checkbox"
            checked={parametros.incluir_puertas}
            onChange={(e) => setParametro("incluir_puertas", e.target.checked)}
            className="w-4 h-4 accent-cyan-600 rounded cursor-pointer"
          />
        </label>
      </div>
    </div>
  );
}
