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
      const payload = {
        model_id: parametros.model_id || "M00001",
        gh_file: parametros.gh_file || "Cubierta.ghx",
        ...parametros
      };
      const res = await fetch("/api/compute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
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
          <div className="flex gap-1 flex-wrap justify-end">
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
              onClick={() => setModoVisual("renderizado")}
              className={`px-2 py-0.5 rounded-md transition text-[11px] ${modoVisual === "renderizado" ? "bg-emerald-600 text-white font-bold shadow-sm" : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300"}`}
            >
              🖼️ Renderizado
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
          <option value="Cajon_Experimento_Viktor">🌾 Cajón Experimento Viktor (v1.1 .ghx)</option>
          <option value="Cubierta">📐 Cubierta & Entrepaño con Maquinados CNC (Cubierta.ghx)</option>
          <option value="M00001">M00001 — Estantería Multifuncional</option>
        </select>
        <span className="text-[10px] text-gray-500 font-mono">
          {parametros.model_id === "Cubierta"
            ? "Leído desde temporal/Cubierta.ghx (310 nodos, Bypass VisualARQ activo)"
            : parametros.model_id === "Cajon_Experimento_Viktor"
            ? "Leído desde temporal/Cajon_Experimento_Viktor_v1.1.ghx"
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

        {/* Alto (Sólo para muebles de altura vertical, no para Cubierta) */}
        {parametros.model_id !== "Cubierta" && (
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
        )}

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

            {/* Altura lateral de cajon (Menú Desplegable) */}
            <div className="flex flex-col gap-1.5 p-2 rounded-lg bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800">
              <div className="flex justify-between text-xs font-medium text-purple-900 dark:text-purple-300">
                <label className="flex items-center gap-1 font-semibold">
                  <Box className="w-3.5 h-3.5 text-purple-600" /> Altura lateral de cajon
                </label>
                <span className="font-mono font-bold">{parametros.altura_lateral_cajon || 102} mm</span>
              </div>
              <select
                value={parametros.altura_lateral_cajon || 102}
                onChange={(e) => setParametro("altura_lateral_cajon", Number(e.target.value))}
                className="w-full text-xs p-1.5 rounded-md bg-white dark:bg-gray-800 border border-purple-300 dark:border-purple-700 outline-none font-semibold cursor-pointer"
              >
                <option value={102}>102 mm</option>
                <option value={138}>138 mm</option>
                <option value={147}>147 mm</option>
                <option value={200}>200 mm</option>
              </select>
            </div>

            {/* Distancia bajo laterales (NUEVO v1.1) */}
            <div className="flex flex-col gap-1.5 p-2 rounded-lg bg-cyan-50 dark:bg-cyan-950/30 border border-cyan-200 dark:border-cyan-800">
              <div className="flex justify-between text-xs font-medium text-cyan-900 dark:text-cyan-300">
                <label className="flex items-center gap-1 font-semibold">
                  <Box className="w-3.5 h-3.5 text-cyan-600" /> Distancia bajo laterales
                </label>
                <span className="font-mono font-bold">{parametros.distancia_bajo_laterales || 30} mm</span>
              </div>
              <select
                value={parametros.distancia_bajo_laterales || 30}
                onChange={(e) => setParametro("distancia_bajo_laterales", Number(e.target.value))}
                className="w-full text-xs p-1.5 rounded-md bg-white dark:bg-gray-800 border border-cyan-300 dark:border-cyan-700 outline-none font-semibold cursor-pointer"
              >
                <option value={25}>25 mm</option>
                <option value={30}>30 mm</option>
              </select>
            </div>

            {/* Tipo Cajon / Correderas (NUEVO v1.1) */}
            <div className="flex flex-col gap-1.5 p-2 rounded-lg bg-teal-50 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800">
              <div className="flex justify-between text-xs font-medium text-teal-900 dark:text-teal-300">
                <label className="flex items-center gap-1 font-semibold">
                  <Box className="w-3.5 h-3.5 text-teal-600" /> Tipo Cajon (Corredera)
                </label>
                <span className="font-mono font-bold text-[11px]">{parametros.tipo_cajon || "Corredera Estandar"}</span>
              </div>
              <select
                value={parametros.tipo_cajon || "Corredera Estandar"}
                onChange={(e) => setParametro("tipo_cajon", e.target.value)}
                className="w-full text-xs p-1.5 rounded-md bg-white dark:bg-gray-800 border border-teal-300 dark:border-teal-700 outline-none font-semibold cursor-pointer"
              >
                <option value="Corredera Estandar">Corredera Estándar (27.5 mm)</option>
                <option value="Corredera Tipo X">Corredera Tipo X (40.0 mm)</option>
              </select>
            </div>
          </>
        )}

        {/* Controles Específicos para Cubierta.ghx (VisualARQ DfMA) */}
        {parametros.model_id === "Cubierta" && (
          <div className="flex flex-col gap-3 pt-2 border-t border-gray-200 dark:border-gray-800">
            <div className="text-xs font-bold text-cyan-800 dark:text-cyan-300 flex items-center justify-between pb-1 border-b border-cyan-200 dark:border-cyan-800">
              <span>📐 Parámetros DfMA VisualARQ Cubierta</span>
            </div>

            {/* Recedidos */}
            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-1 bg-gray-50 dark:bg-gray-800/40 p-2 rounded border border-gray-200 dark:border-gray-700 text-xs">
                <label className="font-semibold text-[11px] text-gray-700 dark:text-gray-300">Recedido Izq</label>
                <input
                  type="number"
                  min={0}
                  max={200}
                  value={parametros.recedido_izquierdo ?? 0}
                  onChange={(e) => setParametro("recedido_izquierdo", Number(e.target.value))}
                  className="w-full text-xs font-mono p-1 rounded bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 outline-none"
                />
              </div>
              <div className="flex flex-col gap-1 bg-gray-50 dark:bg-gray-800/40 p-2 rounded border border-gray-200 dark:border-gray-700 text-xs">
                <label className="font-semibold text-[11px] text-gray-700 dark:text-gray-300">Recedido Der</label>
                <input
                  type="number"
                  min={0}
                  max={200}
                  value={parametros.recedido_derecho ?? 0}
                  onChange={(e) => setParametro("recedido_derecho", Number(e.target.value))}
                  className="w-full text-xs font-mono p-1 rounded bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 outline-none"
                />
              </div>
            </div>

            {/* Uniones Izquierda y Derecha */}
            <div className="flex flex-col gap-2 p-2 rounded-lg bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 text-xs">
              <span className="font-semibold text-indigo-900 dark:text-indigo-300">Uniones Estructurales</span>
              
              <div className="flex justify-between items-center">
                <span className="text-[11px]">Unión Izquierda:</span>
                <select
                  value={parametros.union_izquierda || "Minifix"}
                  onChange={(e) => setParametro("union_izquierda", e.target.value)}
                  className="text-xs p-1 rounded bg-white dark:bg-gray-800 border border-indigo-300 dark:border-indigo-700 font-semibold"
                >
                  <option value="Minifix">Minifix</option>
                  <option value="Tornillo tarugo">Tornillo tarugo</option>
                  <option value="Entrepaño">Entrepaño</option>
                  <option value="Ya definida">Ya definida</option>
                </select>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-[11px]">Unión Derecha:</span>
                <select
                  value={parametros.union_derecha || "Tornillo tarugo"}
                  onChange={(e) => setParametro("union_derecha", e.target.value)}
                  className="text-xs p-1 rounded bg-white dark:bg-gray-800 border border-indigo-300 dark:border-indigo-700 font-semibold"
                >
                  <option value="Tornillo tarugo">Tornillo tarugo</option>
                  <option value="Minifix">Minifix</option>
                  <option value="Ya definida">Ya definida</option>
                </select>
              </div>
            </div>

            {/* Orientación Minifix */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex flex-col gap-1 p-2 rounded bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800">
                <span className="font-semibold text-[10px] text-indigo-900 dark:text-indigo-300">Orient. Maquinado Minifix</span>
                <select
                  value={parametros.orientacion_maquinado_minifix || "abajo"}
                  onChange={(e) => setParametro("orientacion_maquinado_minifix", e.target.value)}
                  className="text-xs p-1 rounded bg-white dark:bg-gray-800 border border-indigo-300 font-semibold"
                >
                  <option value="abajo">Abajo</option>
                  <option value="arriba">Arriba</option>
                </select>
              </div>

              <div className="flex flex-col gap-1 p-2 rounded bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800">
                <span className="font-semibold text-[10px] text-indigo-900 dark:text-indigo-300">Orientación Minifix</span>
                <select
                  value={parametros.orientacion_minifix || "abajo"}
                  onChange={(e) => setParametro("orientacion_minifix", e.target.value)}
                  className="text-xs p-1 rounded bg-white dark:bg-gray-800 border border-indigo-300 font-semibold"
                >
                  <option value="abajo">Abajo</option>
                  <option value="arriba">Arriba</option>
                </select>
              </div>
            </div>

            {/* Posiciones de Herrajes */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex flex-col gap-1 p-2 rounded bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                <span className="font-semibold text-[11px] text-amber-900 dark:text-amber-300">Posición Tarugo</span>
                <select
                  value={parametros.posicion_tarugo || "1"}
                  onChange={(e) => setParametro("posicion_tarugo", e.target.value)}
                  className="text-xs p-1 rounded bg-white dark:bg-gray-800 border border-amber-300 font-semibold"
                >
                  <option value="-1">(-32mm)</option>
                  <option value="0">0 (Centro)</option>
                  <option value="1">1 (+32mm)</option>
                  <option value="2">2 (+64mm)</option>
                </select>
              </div>

              <div className="flex flex-col gap-1 p-2 rounded bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                <span className="font-semibold text-[11px] text-amber-900 dark:text-amber-300">Posición Tornillo</span>
                <select
                  value={parametros.posicion_tornillo || "1"}
                  onChange={(e) => setParametro("posicion_tornillo", e.target.value)}
                  className="text-xs p-1 rounded bg-white dark:bg-gray-800 border border-amber-300 font-semibold"
                >
                  <option value="0">0 (Centro)</option>
                  <option value="1">1 (+32mm)</option>
                  <option value="2">2 (+64mm)</option>
                </select>
              </div>
            </div>

            {/* Bordes y Mapeados de Cubierta & Entrepaño */}
            <div className="flex flex-col gap-2 p-2 rounded-lg bg-teal-50/60 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800 text-xs">
              <span className="font-semibold text-teal-900 dark:text-teal-300">Bordes & Acabados</span>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex justify-between items-center">
                  <span className="text-[10px]">Borde Izq:</span>
                  <select
                    value={parametros.borde_izquierdo || "MDP"}
                    onChange={(e) => setParametro("borde_izquierdo", e.target.value)}
                    className="text-xs p-1 rounded bg-white dark:bg-gray-800 border border-teal-300"
                  >
                    <option value="MDP">MDP</option>
                    <option value="Canto">Canto</option>
                  </select>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px]">Borde Der:</span>
                  <select
                    value={parametros.borde_derecho || "MDP"}
                    onChange={(e) => setParametro("borde_derecho", e.target.value)}
                    className="text-xs p-1 rounded bg-white dark:bg-gray-800 border border-teal-300"
                  >
                    <option value="MDP">MDP</option>
                    <option value="Canto">Canto</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-teal-200/60 dark:border-teal-800">
                <div className="flex justify-between items-center">
                  <span className="text-[10px]">Balance Cubierta:</span>
                  <select
                    value={parametros.lado_balance_cubierta || "Cara B"}
                    onChange={(e) => setParametro("lado_balance_cubierta", e.target.value)}
                    className="text-xs p-1 rounded bg-white dark:bg-gray-800 border border-teal-300"
                  >
                    <option value="Cara A">Cara A</option>
                    <option value="Cara B">Cara B</option>
                    <option value="D/D">D/D</option>
                  </select>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px]">Mapeado Cubierta:</span>
                  <select
                    value={parametros.tipo_mapeado_cubierta || "Cubierta"}
                    onChange={(e) => setParametro("tipo_mapeado_cubierta", e.target.value)}
                    className="text-xs p-1 rounded bg-white dark:bg-gray-800 border border-teal-300"
                  >
                    <option value="Cubierta">Cubierta</option>
                    <option value="Cubierta Atravesada">Atravesada</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-teal-200/60 dark:border-teal-800">
                <div className="flex justify-between items-center">
                  <span className="text-[10px]">Balance Entrepaño:</span>
                  <select
                    value={parametros.lado_balance_entrepanio || "Cara B"}
                    onChange={(e) => setParametro("lado_balance_entrepanio", e.target.value)}
                    className="text-xs p-1 rounded bg-white dark:bg-gray-800 border border-teal-300"
                  >
                    <option value="Cara A">Cara A</option>
                    <option value="Cara B">Cara B</option>
                    <option value="D/D">D/D</option>
                  </select>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px]">Mapeado Entrepaño:</span>
                  <select
                    value={parametros.tipo_mapeado_entrepanio || "Cubierta"}
                    onChange={(e) => setParametro("tipo_mapeado_entrepanio", e.target.value)}
                    className="text-xs p-1 rounded bg-white dark:bg-gray-800 border border-teal-300"
                  >
                    <option value="Cubierta">Cubierta</option>
                    <option value="Cubierta Atravesada">Atravesada</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>


      {/* Selector de Material y Espesor (Sólo para muebles generales, no para Cubierta) */}
      {parametros.model_id !== "Cubierta" && (
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
      )}

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

        {/* Toggle Puertas (Sólo para muebles de almacenamiento, no para Cubierta) */}
        {parametros.model_id !== "Cubierta" && (
          <label className="flex items-center justify-between text-xs font-medium cursor-pointer mt-1 p-2 rounded-lg bg-gray-50 dark:bg-gray-800/40 border border-gray-200 dark:border-gray-700">
            <span>Incluir Puertas Frontales</span>
            <input
              type="checkbox"
              checked={parametros.incluir_puertas}
              onChange={(e) => setParametro("incluir_puertas", e.target.checked)}
              className="w-4 h-4 accent-cyan-600 rounded cursor-pointer"
            />
          </label>
        )}
      </div>
    </div>
  );
}
