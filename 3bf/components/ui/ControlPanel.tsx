"use client";

import React, { useEffect } from "react";
import { use3BFStore } from "@/lib/store";
import { Sliders, Box, Layers, Palette, Cpu, CheckCircle2, AlertCircle, FolderOpen, FileUp } from "lucide-react";

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
          className="w-16 px-1 py-0.5 text-right text-xs font-mono font-bold bg-[#E2E8F0] border-2 border-cyan-500 rounded outline-none shadow-inner text-[#0F172A]"
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

// Panel de Parámetros Dinámico Autónomo (Sólo visible cuando hay un archivo cargado)
function ParametrosPanel() {
  const { parametros, setParametro } = use3BFStore();

  if (!parametros.model_id) return null;

  const currentModelStr = `${parametros.model_id} ${parametros.custom_filename || ""}`.toLowerCase();
  const esCubierta = currentModelStr.includes("cubierta");
  const esCajonera = !esCubierta || currentModelStr.includes("cajon");

  return (
    <div className="flex flex-col gap-3.5">
      {/* Controles de Dimensiones */}
      <div className="flex flex-col gap-3.5 p-3 rounded-xl bg-cyan-950/20 dark:bg-[#131B2E]/60 border border-cyan-200/80 dark:border-cyan-900/40 shadow-sm">
        <div className="text-xs font-extrabold text-gray-900 dark:text-[#F8FAFC] flex items-center gap-1.5 pb-1.5 border-b border-cyan-200/50 dark:border-cyan-900/40">
          <Box className="w-4 h-4 text-cyan-600 dark:text-cyan-400" /> Dimensiones Generales
        </div>

        {/* Ancho */}
        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between text-xs font-medium">
            <label className="font-bold text-gray-800 dark:text-slate-100">Ancho</label>
            <EditableNumberInput
              value={parametros.ancho}
              min={300}
              max={1000}
              onChange={(val) => setParametro("ancho", val)}
              className="text-cyan-600 dark:text-cyan-300 font-bold"
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
        {!esCubierta && (
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between text-xs font-medium">
              <label className="font-bold text-gray-800 dark:text-slate-100">Alto</label>
              <EditableNumberInput
                value={parametros.alto}
                min={300}
                max={1200}
                onChange={(val) => setParametro("alto", val)}
                className="text-cyan-600 dark:text-cyan-300 font-bold"
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
            <label className="font-bold text-gray-800 dark:text-slate-100">Profundidad</label>
            <EditableNumberInput
              value={parametros.profundidad}
              min={200}
              max={1000}
              onChange={(val) => setParametro("profundidad", val)}
              className="text-cyan-600 dark:text-cyan-300 font-bold"
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
      </div>

      {/* Controles Específicos para Muebles tipo Cajonera / Almacenamiento */}
      {esCajonera && (
        <div className="flex flex-col gap-3.5">
          {/* Cantidad de Cajones (Menú Desplegable) */}
          <div className="flex flex-col gap-1.5 p-3 rounded-xl bg-cyan-950/20 dark:bg-[#131B2E]/60 border border-cyan-200/80 dark:border-cyan-900/40 shadow-sm">
            <div className="flex justify-between text-xs font-medium">
              <label className="font-bold text-gray-800 dark:text-white flex items-center gap-1.5">
                <Box className="w-4 h-4 text-cyan-600 dark:text-cyan-400" /> Cantidad de Cajones
              </label>
              <span className="font-mono font-bold text-cyan-700 dark:text-cyan-300">{parametros.cant_cajones || 3} {parametros.cant_cajones === 1 ? "Cajón" : "Cajones"}</span>
            </div>
            <select
              value={parametros.cant_cajones || 3}
              onChange={(e) => setParametro("cant_cajones", Number(e.target.value))}
              className="w-full text-xs p-2 rounded-lg bg-[#E2E8F0] text-[#0F172A] border border-slate-300 outline-none font-bold cursor-pointer shadow-sm"
            >
              <option value={1}>1 Cajón</option>
              <option value={2}>2 Cajones</option>
              <option value={3}>3 Cajones</option>
            </select>
          </div>

          {/* Abrir Cajones */}
          <div className="flex flex-col gap-1.5 p-3 rounded-xl bg-cyan-950/20 dark:bg-[#131B2E]/60 border border-cyan-200/80 dark:border-cyan-900/40 shadow-sm">
            <div className="flex justify-between text-xs font-medium">
              <label className="font-bold text-gray-800 dark:text-white flex items-center gap-1.5">
                <Box className="w-4 h-4 text-cyan-600 dark:text-cyan-400" /> Abrir Cajones
              </label>
              <EditableNumberInput
                value={parametros.apertura_cajones || 0}
                min={0}
                max={300}
                onChange={(val) => setParametro("apertura_cajones", val)}
                className="text-cyan-700 dark:text-cyan-300 font-bold"
              />
            </div>
            <input
              type="range"
              min={0}
              max={300}
              step={10}
              value={parametros.apertura_cajones || 0}
              onChange={(e) => setParametro("apertura_cajones", Number(e.target.value))}
              className="w-full accent-cyan-600 cursor-pointer"
            />
          </div>

          {/* Profundidad cajon (Menú Desplegable) */}
          <div className="flex flex-col gap-1.5 p-3 rounded-xl bg-cyan-950/20 dark:bg-[#131B2E]/60 border border-cyan-200/80 dark:border-cyan-900/40 shadow-sm">
            <div className="flex justify-between text-xs font-medium">
              <label className="font-bold text-gray-800 dark:text-white flex items-center gap-1.5">
                <Box className="w-4 h-4 text-cyan-600 dark:text-cyan-400" /> Profundidad cajón
              </label>
              <span className="font-mono font-bold text-cyan-700 dark:text-cyan-300">{parametros.profundidad_cajon || 351} mm</span>
            </div>
            <select
              value={parametros.profundidad_cajon || 351}
              onChange={(e) => setParametro("profundidad_cajon", Number(e.target.value))}
              className="w-full text-xs p-2 rounded-lg bg-[#E2E8F0] text-[#0F172A] border border-slate-300 outline-none font-bold cursor-pointer shadow-sm"
            >
              <option value={351}>351 mm</option>
              <option value={400}>400 mm</option>
            </select>
          </div>

          {/* Altura lateral de cajon (Menú Desplegable) */}
          <div className="flex flex-col gap-1.5 p-3 rounded-xl bg-cyan-950/20 dark:bg-[#131B2E]/60 border border-cyan-200/80 dark:border-cyan-900/40 shadow-sm">
            <div className="flex justify-between text-xs font-medium">
              <label className="font-bold text-gray-800 dark:text-white flex items-center gap-1.5">
                <Box className="w-4 h-4 text-cyan-600 dark:text-cyan-400" /> Altura lateral de cajón
              </label>
              <span className="font-mono font-bold text-cyan-700 dark:text-cyan-300">{parametros.altura_lateral_cajon || 102} mm</span>
            </div>
            <select
              value={parametros.altura_lateral_cajon || 102}
              onChange={(e) => setParametro("altura_lateral_cajon", Number(e.target.value))}
              className="w-full text-xs p-2 rounded-lg bg-[#E2E8F0] text-[#0F172A] border border-slate-300 outline-none font-bold cursor-pointer shadow-sm"
            >
              <option value={102}>102 mm</option>
              <option value={138}>138 mm</option>
              <option value={147}>147 mm</option>
              <option value={200}>200 mm</option>
            </select>
          </div>

          {/* Distancia bajo laterales */}
          <div className="flex flex-col gap-1.5 p-3 rounded-xl bg-cyan-950/20 dark:bg-[#131B2E]/60 border border-cyan-200/80 dark:border-cyan-900/40 shadow-sm">
            <div className="flex justify-between text-xs font-medium">
              <label className="font-bold text-gray-800 dark:text-white flex items-center gap-1.5">
                <Box className="w-4 h-4 text-cyan-600 dark:text-cyan-400" /> Distancia bajo laterales
              </label>
              <span className="font-mono font-bold text-cyan-700 dark:text-cyan-300">{parametros.distancia_bajo_laterales || 30} mm</span>
            </div>
            <select
              value={parametros.distancia_bajo_laterales || 30}
              onChange={(e) => setParametro("distancia_bajo_laterales", Number(e.target.value))}
              className="w-full text-xs p-2 rounded-lg bg-[#E2E8F0] text-[#0F172A] border border-slate-300 outline-none font-bold cursor-pointer shadow-sm"
            >
              <option value={25}>25 mm</option>
              <option value={30}>30 mm</option>
            </select>
          </div>

          {/* Tipo Cajon (Corredera) */}
          <div className="flex flex-col gap-1.5 p-3 rounded-xl bg-cyan-950/20 dark:bg-[#131B2E]/60 border border-cyan-200/80 dark:border-cyan-900/40 shadow-sm">
            <div className="flex justify-between text-xs font-medium">
              <label className="font-bold text-gray-800 dark:text-white flex items-center gap-1.5">
                <Box className="w-4 h-4 text-cyan-600 dark:text-cyan-400" /> Tipo Cajón (Corredera)
              </label>
              <span className="font-mono font-bold text-[11px] text-cyan-700 dark:text-cyan-300">{parametros.tipo_cajon || "Corredera Estandar"}</span>
            </div>
            <select
              value={parametros.tipo_cajon || "Corredera Estandar"}
              onChange={(e) => setParametro("tipo_cajon", e.target.value)}
              className="w-full text-xs p-2 rounded-lg bg-[#E2E8F0] text-[#0F172A] border border-slate-300 outline-none font-bold cursor-pointer shadow-sm"
            >
              <option value="Corredera Estandar">Corredera Estándar (27.5 mm)</option>
              <option value="Corredera Tipo X">Corredera Tipo X (40.0 mm)</option>
            </select>
          </div>
        </div>
      )}

      {/* Controles Específicos para Cubierta.ghx (VisualARQ DfMA) */}
      {esCubierta && (
        <div className="flex flex-col gap-3.5 p-3 rounded-xl bg-cyan-950/20 dark:bg-[#131B2E]/60 border border-cyan-200/80 dark:border-cyan-900/40 shadow-sm">
          <div className="text-xs font-bold text-gray-800 dark:text-white flex items-center justify-between pb-1 border-b border-cyan-200/50 dark:border-cyan-900/40">
            <span>📐 Parámetros DfMA VisualARQ Cubierta</span>
          </div>

          {/* Recedidos */}
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1 bg-[#E2E8F0] p-2 rounded-lg border border-slate-300 text-xs">
              <label className="font-semibold text-[11px] text-[#0F172A]">Recedido Izq</label>
              <input
                type="number"
                min={0}
                max={200}
                value={parametros.recedido_izquierdo ?? 0}
                onChange={(e) => setParametro("recedido_izquierdo", Number(e.target.value))}
                className="w-full text-xs font-mono p-1 rounded bg-transparent outline-none text-[#0F172A] font-bold"
              />
            </div>
            <div className="flex flex-col gap-1 bg-[#E2E8F0] p-2 rounded-lg border border-slate-300 text-xs">
              <label className="font-semibold text-[11px] text-[#0F172A]">Recedido Der</label>
              <input
                type="number"
                min={0}
                max={200}
                value={parametros.recedido_derecho ?? 0}
                onChange={(e) => setParametro("recedido_derecho", Number(e.target.value))}
                className="w-full text-xs font-mono p-1 rounded bg-transparent outline-none text-[#0F172A] font-bold"
              />
            </div>
          </div>

          {/* Uniones Izquierda y Derecha */}
          <div className="flex flex-col gap-2 p-2.5 rounded-lg bg-[#E2E8F0] border border-slate-300 text-xs text-[#0F172A]">
            <span className="font-bold text-[#0F172A]">Uniones Estructurales</span>
            
            <div className="flex justify-between items-center">
              <span className="text-[11px] text-[#0F172A]">Unión Izquierda:</span>
              <select
                value={parametros.union_izquierda || "Minifix"}
                onChange={(e) => setParametro("union_izquierda", e.target.value)}
                className="text-xs p-1 rounded-lg bg-white border border-slate-300 font-bold text-[#0F172A]"
              >
                <option value="Minifix">Minifix</option>
                <option value="Tornillo tarugo">Tornillo tarugo</option>
                <option value="Entrepaño">Entrepaño</option>
              </select>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-[11px] text-[#0F172A]">Unión Derecha:</span>
              <select
                value={parametros.union_derecha || "Tornillo tarugo"}
                onChange={(e) => setParametro("union_derecha", e.target.value)}
                className="text-xs p-1 rounded-lg bg-white border border-slate-300 font-bold text-[#0F172A]"
              >
                <option value="Minifix">Minifix</option>
                <option value="Tornillo tarugo">Tornillo tarugo</option>
                <option value="Entrepaño">Entrepaño</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-300 text-[11px] text-[#0F172A]">
              <div className="flex flex-col gap-1">
                <span>Orientación Minifix:</span>
                <select
                  value={parametros.orientacion_minifix || "abajo"}
                  onChange={(e) => setParametro("orientacion_minifix", e.target.value)}
                  className="text-xs p-1 rounded-lg bg-white border border-slate-300 text-[#0F172A] font-bold"
                >
                  <option value="abajo">Abajo</option>
                  <option value="arriba">Arriba</option>
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <span>Maquinado Minifix:</span>
                <select
                  value={parametros.orientacion_maquinado_minifix || "abajo"}
                  onChange={(e) => setParametro("orientacion_maquinado_minifix", e.target.value)}
                  className="text-xs p-1 rounded-lg bg-white border border-slate-300 text-[#0F172A] font-bold"
                >
                  <option value="abajo">Abajo</option>
                  <option value="arriba">Arriba</option>
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <span>Posición Tarugo:</span>
                <select
                  value={parametros.posicion_tarugo || "1"}
                  onChange={(e) => setParametro("posicion_tarugo", e.target.value)}
                  className="text-xs p-1 rounded-lg bg-white border border-slate-300 text-[#0F172A] font-bold"
                >
                  <option value="1">1 (Frontal)</option>
                  <option value="2">2 (Posterior)</option>
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <span>Posición Tornillo:</span>
                <select
                  value={parametros.posicion_tornillo || "1"}
                  onChange={(e) => setParametro("posicion_tornillo", e.target.value)}
                  className="text-xs p-1 rounded-lg bg-white border border-slate-300 text-[#0F172A] font-bold"
                >
                  <option value="1">1 (Frontal)</option>
                  <option value="2">2 (Posterior)</option>
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <span>Borde Izquierdo:</span>
                <select
                  value={parametros.borde_izquierdo || "MDP"}
                  onChange={(e) => setParametro("borde_izquierdo", e.target.value)}
                  className="text-xs p-1 rounded-lg bg-white border border-slate-300 text-[#0F172A] font-bold"
                >
                  <option value="MDP">MDP</option>
                  <option value="Canto">Canto</option>
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <span>Borde Derecho:</span>
                <select
                  value={parametros.borde_derecho || "MDP"}
                  onChange={(e) => setParametro("borde_derecho", e.target.value)}
                  className="text-xs p-1 rounded-lg bg-white border border-slate-300 text-[#0F172A] font-bold"
                >
                  <option value="MDP">MDP</option>
                  <option value="Canto">Canto</option>
                </select>
              </div>
            </div>

            {/* Mapeados y Texturas */}
            <div className="flex flex-col gap-1.5 pt-2 border-t border-slate-300">
              <span className="font-bold text-[#0F172A]">Mapeado de Texturas</span>
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-[#0F172A]">Lado Balance Cubierta:</span>
                <select
                  value={parametros.lado_balance_cubierta || "Cara B"}
                  onChange={(e) => setParametro("lado_balance_cubierta", e.target.value)}
                  className="text-xs p-1 rounded-lg bg-white border border-slate-300 text-[#0F172A] font-bold"
                >
                  <option value="Cara A">Cara A</option>
                  <option value="Cara B">Cara B</option>
                  <option value="D/D">D/D</option>
                </select>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-[#0F172A]">Mapeado Cubierta:</span>
                <select
                  value={parametros.tipo_mapeado_cubierta || "Cubierta"}
                  onChange={(e) => setParametro("tipo_mapeado_cubierta", e.target.value)}
                  className="text-xs p-1 rounded-lg bg-white border border-slate-300 text-[#0F172A] font-bold"
                >
                  <option value="Cubierta">Cubierta</option>
                  <option value="Cubierta Atravesada">Atravesada</option>
                </select>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-[#0F172A]">Lado Balance Entrepaño:</span>
                <select
                  value={parametros.lado_balance_entrepanio || "Cara B"}
                  onChange={(e) => setParametro("lado_balance_entrepanio", e.target.value)}
                  className="text-xs p-1 rounded-lg bg-white border border-slate-300 text-[#0F172A] font-bold"
                >
                  <option value="Cara A">Cara A</option>
                  <option value="Cara B">Cara B</option>
                  <option value="D/D">D/D</option>
                </select>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-[#0F172A]">Mapeado Entrepaño:</span>
                <select
                  value={parametros.tipo_mapeado_entrepanio || "Cubierta"}
                  onChange={(e) => setParametro("tipo_mapeado_entrepanio", e.target.value)}
                  className="text-xs p-1 rounded-lg bg-white border border-slate-300 text-[#0F172A] font-bold"
                >
                  <option value="Cubierta">Cubierta</option>
                  <option value="Cubierta Atravesada">Atravesada</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Color de Acabado & Puertas (Card Organizada) */}
      <div className="flex flex-col gap-2.5 p-3 rounded-xl bg-cyan-950/20 dark:bg-[#131B2E]/60 border border-cyan-200/80 dark:border-cyan-900/40 shadow-sm">
        <label className="font-bold text-xs text-gray-800 dark:text-white flex items-center gap-1.5">
          <Palette className="w-4 h-4 text-cyan-600 dark:text-cyan-400" /> Color de Acabado
        </label>
        <div className="flex items-center justify-between bg-[#E2E8F0] p-2 rounded-lg border border-slate-300 shadow-sm text-[#0F172A]">
          <span className="text-xs font-bold text-[#0F172A]" style={{ color: "#0F172A" }}>Color seleccionado:</span>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={parametros.color_acabado}
              onChange={(e) => setParametro("color_acabado", e.target.value)}
              className="w-7 h-7 rounded cursor-pointer border-0"
            />
            <span className="text-xs font-mono font-bold text-[#0F172A]" style={{ color: "#0F172A" }}>{parametros.color_acabado}</span>
          </div>
        </div>

        {/* Toggle Puertas */}
        {!esCubierta && (
          <label className="flex items-center justify-between text-xs font-bold cursor-pointer p-2 rounded-lg bg-[#E2E8F0] border border-slate-300 text-[#0F172A] shadow-sm">
            <span className="text-[#0F172A]" style={{ color: "#0F172A" }}>Incluir Puertas Frontales</span>
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

export default function ControlPanel() {
  const {
    parametros,
    setParametro,
    cargando,
    setResultado,
    tema,
    setTema,
    workerStatus,
    setWorkerStatus,
    modoVisual,
    setModoVisual,
    escenarioLimpio,
  } = use3BFStore();

  const [loadedFiles, setLoadedFiles] = React.useState<Array<{ id: string; filename: string; content?: string }>>([]);

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Comprobar estado de conexión del Worker Python
  const verificarWorker = async () => {
    try {
      const res = await fetch("/api/compute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model_id: "Cubierta", ancho: 1200, alto: 800, profundidad: 400 }),
      });
      const data = await res.json();
      if (data.status === "success" || data.real_meshes || res.ok) {
        setWorkerStatus("online");
      } else {
        setWorkerStatus("offline");
      }
    } catch {
      setWorkerStatus("offline");
    }
  };

  useEffect(() => {
    verificarWorker();
  }, []);

  // Función para re-calcular cuando cambian los parámetros
  const ejecutarComputo = async () => {
    if (!parametros.model_id) {
      setResultado(null);
      return;
    }

    try {
      const payload = {
        ...parametros,
        gh_file: parametros.custom_filename || `${parametros.model_id}.ghx`,
      };
      const res = await fetch("/api/compute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.status === "success") {
        setResultado(data);
        setWorkerStatus("online");
      }
    } catch (err) {
      console.error("Error al calcular:", err);
      setWorkerStatus("offline");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const filename = file.name;
    const modelName = filename.replace(/\.(gh|ghx)$/i, "");

    if (filename.toLowerCase().endsWith(".ghx")) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;

        setLoadedFiles((prev) => {
          const filtered = prev.filter((f) => f.id !== modelName);
          return [...filtered, { id: modelName, filename, content }];
        });

        setParametro("ghx_content", content);
        setParametro("custom_filename", filename);
        setParametro("model_id", modelName);
      };
      reader.readAsText(file);
    } else {
      setLoadedFiles((prev) => {
        const filtered = prev.filter((f) => f.id !== modelName);
        return [...filtered, { id: modelName, filename }];
      });
      setParametro("ghx_content", "");
      setParametro("custom_filename", filename);
      setParametro("model_id", modelName);
    }
  };

  const handleSelectModel = (selectedId: string) => {
    if (!selectedId) {
      setParametro("model_id", "");
      setParametro("custom_filename", "");
      setParametro("ghx_content", "");
      setResultado(null);
      return;
    }

    const found = loadedFiles.find((f) => f.id === selectedId);
    if (found) {
      setParametro("model_id", found.id);
      setParametro("custom_filename", found.filename);
      setParametro("ghx_content", found.content || "");
    } else {
      setParametro("model_id", selectedId);
      setParametro("custom_filename", `${selectedId}.ghx`);
      setParametro("ghx_content", "");
    }
  };

  useEffect(() => {
    ejecutarComputo();
  }, [parametros]);

  return (
    <div className="p-4 flex flex-col gap-5 h-full overflow-y-auto">
      {/* Selector de Tema y Modo Render 3D */}
      <div className="flex flex-col gap-2.5 p-3 rounded-xl bg-cyan-950/20 dark:bg-[#131B2E]/60 border border-cyan-200/80 dark:border-cyan-900/40 text-xs shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs font-extrabold text-gray-900 dark:text-[#F8FAFC]">Tema:</span>
          <div className="flex gap-1.5">
            <button
              onClick={() => {
                setTema("tech");
                document.documentElement.setAttribute("data-theme", "tech");
                document.documentElement.classList.remove("dark");
              }}
              className={`px-3.5 py-1 rounded-full transition cursor-pointer text-xs font-bold ${tema === "tech" ? "bg-cyan-600 text-white shadow-md border border-cyan-400/40" : "bg-[#E2E8F0]/50 text-[#0F172A] hover:bg-[#E2E8F0]/80 border border-slate-300/60 backdrop-blur-sm"}`}
            >
              Light
            </button>
            <button
              onClick={() => {
                setTema("obsidian");
                document.documentElement.setAttribute("data-theme", "obsidian");
                document.documentElement.classList.add("dark");
              }}
              className={`px-3.5 py-1 rounded-full transition cursor-pointer text-xs font-bold ${tema === "obsidian" ? "bg-cyan-600 text-white shadow-md border border-cyan-400/40" : "bg-[#E2E8F0]/50 text-[#0F172A] hover:bg-[#E2E8F0]/80 border border-slate-300/60 backdrop-blur-sm"}`}
            >
              Dark
            </button>
          </div>
        </div>

        {/* Modo Renderizado 3D */}
        <div className="flex items-center justify-between pt-2 border-t border-cyan-200/50 dark:border-cyan-900/40">
          <span className="text-xs font-extrabold text-gray-900 dark:text-[#F8FAFC]">Modo:</span>
          <div className="flex gap-1.5 flex-wrap justify-end">
            <button
              onClick={() => setModoVisual("semitransparente")}
              className={`px-3 py-1 rounded-full transition text-[11px] cursor-pointer font-bold ${modoVisual === "semitransparente" ? "bg-cyan-600 text-white shadow-md border border-cyan-400/40" : "bg-[#E2E8F0]/50 text-[#0F172A] hover:bg-[#E2E8F0]/80 border border-slate-300/60 backdrop-blur-sm"}`}
            >
              💎 Cristal
            </button>
            <button
              onClick={() => setModoVisual("solido")}
              className={`px-3 py-1 rounded-full transition text-[11px] cursor-pointer font-bold ${modoVisual === "solido" ? "bg-cyan-600 text-white shadow-md border border-cyan-400/40" : "bg-[#E2E8F0]/50 text-[#0F172A] hover:bg-[#E2E8F0]/80 border border-slate-300/60 backdrop-blur-sm"}`}
            >
              🧱 Sólido
            </button>
            <button
              onClick={() => setModoVisual("renderizado")}
              className={`px-3 py-1 rounded-full transition text-[11px] cursor-pointer font-bold ${modoVisual === "renderizado" ? "bg-cyan-600 text-white shadow-md border border-cyan-400/40" : "bg-[#E2E8F0]/50 text-[#0F172A] hover:bg-[#E2E8F0]/80 border border-slate-300/60 backdrop-blur-sm"}`}
            >
              🖼️ Renderizado
            </button>
            <button
              onClick={() => setModoVisual("lineas")}
              className={`px-3 py-1 rounded-full transition text-[11px] cursor-pointer font-bold ${modoVisual === "lineas" ? "bg-cyan-600 text-white shadow-md border border-cyan-400/40" : "bg-[#E2E8F0]/50 text-[#0F172A] hover:bg-[#E2E8F0]/80 border border-slate-300/60 backdrop-blur-sm"}`}
            >
              📐 Líneas
            </button>
          </div>
        </div>
      </div>

      {/* Sección Abrir archivo Grasshopper */}
      <div className="flex flex-col gap-2.5 p-3 rounded-xl bg-cyan-950/20 dark:bg-[#131B2E]/60 border border-cyan-200/80 dark:border-cyan-900/40 shadow-sm">
        <label className="text-xs font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
          <FolderOpen className="w-4 h-4 text-cyan-600 dark:text-cyan-400" /> Abrir archivo Grasshopper
        </label>

        {/* File input oculto para examinar disco duro */}
        <input
          type="file"
          ref={fileInputRef}
          accept=".gh,.ghx"
          onChange={handleFileChange}
          className="hidden"
        />

        {/* Botón para explorar disco duro (Cápsula rounded-full) */}
        <button
          onClick={() => fileInputRef.current?.click()}
          className="w-full py-2 px-4 rounded-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-md border border-cyan-400/40 transition flex items-center justify-center gap-2 cursor-pointer"
        >
          <FileUp className="w-4 h-4" /> Buscar en disco
        </button>

        {/* Desplegable de archivos cargados (Formato Rectangular con Esquinas Redondeadas rounded-lg) */}
        <select
          value={parametros.model_id}
          onChange={(e) => handleSelectModel(e.target.value)}
          className="w-full text-xs p-2 rounded-lg bg-[#E2E8F0] text-[#0F172A] border border-slate-300 outline-none font-bold cursor-pointer shadow-sm"
        >
          <option value=""></option>
          {loadedFiles.map((f) => {
            const cleanName = f.filename.replace(/\.(gh|ghx)$/i, "");
            return (
              <option key={f.id} value={f.id}>
                {cleanName}
              </option>
            );
          })}
        </select>
      </div>

      {/* Panel de Parámetros Dinámico */}
      <ParametrosPanel />
    </div>
  );
}
