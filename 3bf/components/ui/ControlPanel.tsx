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

function limpiarEtiqueta(paramKey: string): string {
  return paramKey
    .replace("RH_IN:", "")
    .replace(/^[\d.]+[_\s]*/, "") // Ocultar prefijos estilo VisualARQ (ej: '01.0_', '05.2 ', '01_')
    .replace(/_/g, " ")
    .trim();
}

function RenderParamControl({ paramKey }: { paramKey: string }) {
  const { parametros, setParametro, resultado } = use3BFStore();
  const label = limpiarEtiqueta(paramKey);
  const storeKey = MAPA_PARAMETROS[paramKey] || paramKey.replace("RH_IN:", "").toLowerCase().replace(/\s+/g, "_");
  const value = (parametros as any)[storeKey];
  const limit = resultado?.slider_limits?.[paramKey];

  const pl = paramKey.toLowerCase();
  const esSelectorTexto = pl.includes("union") || pl.includes("borde") || pl.includes("balance") || pl.includes("mapeado") || pl.includes("orientacion") || pl.includes("posicion") || pl.includes("tipo_cajon");
  const esSlider = !esSelectorTexto;

  // Si es un Slider Numérico
  if (esSlider) {
    const minVal = limit?.min ?? 0;
    const maxVal = limit?.max ?? (pl.includes("ancho") || pl.includes("alto") || pl.includes("profundidad") ? 1200 : 200);
    const numVal = typeof value === "number" ? value : (limit?.default ?? minVal);

    return (
      <div className="flex flex-col gap-1.5 p-2 rounded-lg bg-[#E2E8F0] dark:bg-[#1E293B]/70 border border-slate-300 dark:border-slate-700/60 shadow-sm text-xs">
        <div className="flex justify-between font-medium">
          <label className="font-bold text-gray-800 dark:text-slate-100">{label}</label>
          <EditableNumberInput
            value={numVal}
            min={minVal}
            max={maxVal}
            onChange={(val) => setParametro(storeKey as any, val)}
            className="text-cyan-600 dark:text-cyan-300 font-bold"
          />
        </div>
        <input
          type="range"
          min={minVal}
          max={maxVal}
          step={maxVal <= 10 ? 0.1 : (maxVal <= 200 ? 1 : 10)}
          value={Math.min(maxVal, Math.max(minVal, numVal))}
          onChange={(e) => setParametro(storeKey as any, Number(e.target.value))}
          className="w-full accent-cyan-600 cursor-pointer"
        />
      </div>
    );
  }

  // Opciones predefinidas para Value Lists
  let options: string[] = [];
  if (pl.includes("union")) {
    options = ["Minifix", "Tornillo tarugo", "Entrepaño"];
  } else if (pl.includes("orientacion")) {
    options = ["abajo", "arriba"];
  } else if (pl.includes("posicion")) {
    options = ["1", "2"];
  } else if (pl.includes("borde")) {
    options = ["MDP", "Canto"];
  } else if (pl.includes("balance")) {
    options = ["Cara A", "Cara B", "D/D"];
  } else if (pl.includes("mapeado")) {
    options = ["Cubierta", "Cubierta Atravesada"];
  } else if (pl.includes("cajon")) {
    options = ["Corredera Estandar", "Corredera Tipo X"];
  } else {
    options = [String(value || "Por defecto")];
  }

  return (
    <div className="flex justify-between items-center bg-[#E2E8F0] dark:bg-[#1E293B]/70 p-2 rounded-lg border border-slate-300 dark:border-slate-700/60 text-xs text-[#0F172A] dark:text-slate-100 shadow-sm">
      <span className="font-bold text-[11px] text-[#0F172A] dark:text-slate-200">{label}:</span>
      <select
        value={String(value || options[0])}
        onChange={(e) => setParametro(storeKey as any, e.target.value)}
        className="text-xs p-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 font-bold text-[#0F172A] dark:text-cyan-300 outline-none cursor-pointer"
      >
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </div>
  );
}

// Panel de Parámetros Dinámico Autónomo (Sólo visible cuando hay un archivo cargado)
function ParametrosPanel() {
  const { parametros, setParametro, resultado } = use3BFStore();

  if (!parametros.model_id) return null;

  const esCubierta = (parametros.model_id + (parametros.custom_filename || "")).toLowerCase().includes("cubierta");

  const groups: Array<{ title: string; parameters: string[] }> = resultado?.parameter_groups && resultado.parameter_groups.length > 0
    ? resultado.parameter_groups
    : [
        {
          title: "📐 Parámetros Generales DfMA",
          parameters: Object.keys(MAPA_PARAMETROS)
        }
      ];

  return (
    <div className="flex flex-col gap-3.5">
      {groups.map((grp, idx) => (
        <div key={`group-${idx}`} className="flex flex-col gap-3 p-3 rounded-xl bg-cyan-950/20 dark:bg-[#131B2E]/60 border border-cyan-200/80 dark:border-cyan-900/40 shadow-sm">
          <div className="text-xs font-extrabold text-gray-900 dark:text-[#F8FAFC] flex items-center gap-1.5 pb-1.5 border-b border-cyan-200/50 dark:border-cyan-900/40">
            <Box className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
            <span>{grp.title}</span>
          </div>

          <div className="flex flex-col gap-2">
            {grp.parameters.map((pKey) => (
              <RenderParamControl key={pKey} paramKey={pKey} />
            ))}
          </div>
        </div>
      ))}

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

const MAPA_PARAMETROS: Record<string, string> = {
  "RH_IN:Ancho": "ancho",
  "RH_IN:01 Ancho": "ancho",
  "RH_IN:Alto": "alto",
  "RH_IN:02 Alto": "alto",
  "RH_IN:Profundidad": "profundidad",
  "RH_IN:Cantidada de Cajones": "cant_cajones",
  "RH_IN:Cantidad de Cajones": "cant_cajones",
  "RH_IN:Profundidad cajon": "profundidad_cajon",
  "RH_IN:Altura lateral de cajon": "altura_lateral_cajon",
  "RH_IN:Distancia bajo laterales": "distancia_bajo_laterales",
  "RH_IN:Tipo Cajon": "tipo_cajon",
  "RH_IN:03 Tipo de union izquierda": "union_izquierda",
  "RH_IN:04 Tipo de union Derecha": "union_derecha",
  "RH_IN:05 Orientacion maquinado minifix": "orientacion_maquinado_minifix",
  "RH_IN:06 Orientacion minifix": "orientacion_minifix",
  "RH_IN:Posicion Tarugo": "posicion_tarugo",
  "RH_IN:Posicion Tornillo": "posicion_tornillo",
  "RH_IN:Borde izquierdo": "borde_izquierdo",
  "RH_IN:Borde derecho": "borde_derecho",
  "RH_IN:Lado balance cubierta": "lado_balance_cubierta",
  "RH_IN:Tipo de mapeado cubierta": "tipo_mapeado_cubierta",
  "RH_IN:Lado balance entrepaño": "lado_balance_entrepanio",
  "RH_IN:Tipo de mapeado entrepaño": "tipo_mapeado_entrepanio",
};

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
  const [isSyncing, setIsSyncing] = React.useState(false);
  const lastModelRef = React.useRef<string | null>(null);
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

  // Sincronizar parámetros de la interfaz web desde el archivo Grasshopper de forma ultra-rápida (5ms)
  const sincronizarParametrosDesdeArchivo = async (modelId: string, customFilename?: string, ghxContent?: string) => {
    setIsSyncing(true);
    try {
      const payload = {
        model_id: modelId,
        custom_filename: customFilename || `${modelId}.ghx`,
        ghx_content: ghxContent || "",
      };
      const res = await fetch("/api/metadata", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.status === "success" && data.default_values) {
        lastModelRef.current = modelId; // Marcar como cargado
        
        // Sincronizar store
        Object.entries(data.default_values).forEach(([ghKey, val]) => {
          const storeKey = MAPA_PARAMETROS[ghKey];
          if (storeKey) {
            setParametro(storeKey as any, val);
          }
        });
      }
    } catch (err) {
      console.error("Error sincronizando parámetros desde archivo:", err);
    } finally {
      setIsSyncing(false);
    }
  };

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

        lastModelRef.current = null; // Forzar sincronización de UI
        setParametro("ghx_content", content);
        setParametro("custom_filename", filename);
        setParametro("model_id", modelName);
        sincronizarParametrosDesdeArchivo(modelName, filename, content);
      };
      reader.readAsText(file);
    } else {
      setLoadedFiles((prev) => {
        const filtered = prev.filter((f) => f.id !== modelName);
        return [...filtered, { id: modelName, filename }];
      });
      lastModelRef.current = null; // Forzar sincronización de UI
      setParametro("ghx_content", "");
      setParametro("custom_filename", filename);
      setParametro("model_id", modelName);
      sincronizarParametrosDesdeArchivo(modelName, filename, "");
    }
  };

  const handleSelectModel = (selectedId: string) => {
    if (!selectedId) {
      lastModelRef.current = null;
      setParametro("model_id", "");
      setParametro("custom_filename", "");
      setParametro("ghx_content", "");
      setResultado(null);
      return;
    }

    const found = loadedFiles.find((f) => f.id === selectedId);
    if (found) {
      lastModelRef.current = null; // Forzar sincronización de UI
      setParametro("model_id", found.id);
      setParametro("custom_filename", found.filename);
      setParametro("ghx_content", found.content || "");
      sincronizarParametrosDesdeArchivo(found.id, found.filename, found.content || "");
    } else {
      lastModelRef.current = null; // Forzar sincronización de UI
      setParametro("model_id", selectedId);
      setParametro("custom_filename", `${selectedId}.ghx`);
      setParametro("ghx_content", "");
      sincronizarParametrosDesdeArchivo(selectedId, `${selectedId}.ghx`, "");
    }
  };

  useEffect(() => {
    if (isSyncing) return; // Evitar disparar cómputo mientras se sincronizan los parámetros
    ejecutarComputo();
  }, [parametros, isSyncing]);

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
