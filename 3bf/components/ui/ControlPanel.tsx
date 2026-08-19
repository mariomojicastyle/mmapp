"use client";

import React, { useEffect } from "react";
import { use3BFStore } from "@/lib/store";
import { Sliders, Box, Layers, Palette, Cpu, CheckCircle2, AlertCircle, FolderOpen, FileUp, Camera, Check } from "lucide-react";

// Componente para ingresar/editar números con auto-selección total al hacer foco
const DirectNumberInput = ({
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
  const [localText, setLocalText] = React.useState(String(value));
  const [isFocused, setIsFocused] = React.useState(false);

  React.useEffect(() => {
    if (!isFocused) {
      setLocalText(String(value));
    }
  }, [value, isFocused]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setLocalText(raw);
    const normalizado = raw.replace(/\./g, "").replace(",", ".");
    const num = parseFloat(normalizado);
    if (!isNaN(num)) {
      onChange(num);
    }
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(true);
    e.target.select();
  };

  const handleBlur = () => {
    setIsFocused(false);
    const normalizado = localText.replace(/\./g, "").replace(",", ".");
    let num = parseFloat(normalizado);
    if (isNaN(num)) num = value;
    const clamped = Math.min(max, Math.max(min, num));
    onChange(clamped);
    setLocalText(String(clamped));
  };

  return (
    <div className="flex items-center gap-1">
      <input
        type="text"
        inputMode="decimal"
        value={localText}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onChange={handleChange}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            (e.target as HTMLInputElement).blur();
          }
        }}
        className={`w-16 px-1.5 py-0.5 text-right text-xs font-mono font-bold bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 focus:border-cyan-500 dark:focus:border-cyan-400 focus:ring-1 focus:ring-cyan-500 rounded outline-none shadow-sm text-slate-800 dark:text-cyan-300 transition ${className}`}
      />
      <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 font-semibold">{unit}</span>
    </div>
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
  const { parametros, setParametro, resultado, objetoActivoId, instancias, setParametroInstancia } = use3BFStore();
  const instanciaActiva = objetoActivoId ? instancias[objetoActivoId] : null;
  const currentParams = instanciaActiva ? instanciaActiva.parametros : parametros;
  const currentResult = instanciaActiva ? instanciaActiva.resultado : resultado;

  const label = limpiarEtiqueta(paramKey);
  const storeKey = paramKey;
  const rawKeyClean = paramKey.replace("RH_IN:", "").toLowerCase().replace(/\s+/g, "_");
  const legacyKey = MAPA_PARAMETROS[paramKey];

  const limit = currentResult?.slider_limits?.[paramKey];
  const value = (currentParams as any)[storeKey] ?? (legacyKey ? (currentParams as any)[legacyKey] : (currentParams as any)[rawKeyClean]) ?? limit?.default;

  const isValueList = limit?.type === "valuelist" || (limit?.options && limit.options.length > 0);
  const esSlider = !isValueList && (limit?.type === "slider" || limit?.min !== undefined || typeof value === "number");

  // Si es un Slider Numérico
  if (esSlider) {
    const minVal = limit?.min ?? 0;
    const maxVal = limit?.max ?? (paramKey.toLowerCase().includes("ancho") || paramKey.toLowerCase().includes("alto") || paramKey.toLowerCase().includes("profundidad") ? 1200 : 200);
    const numVal: number = typeof value === "number" ? value : (typeof limit?.default === "number" ? limit.default : Number(limit?.default ?? minVal));

    const handleNumChange = (val: number) => {
      if (objetoActivoId) {
        setParametroInstancia(objetoActivoId, storeKey, val);
        if (legacyKey) setParametroInstancia(objetoActivoId, legacyKey, val);
      } else {
        setParametro(storeKey as any, val);
        if (legacyKey) setParametro(legacyKey as any, val);
      }
    };

    return (
      <div className="flex flex-col gap-1.5 p-2 rounded-lg bg-[#E2E8F0] dark:bg-[#1E293B]/70 border border-slate-300 dark:border-slate-700/60 shadow-sm text-xs">
        <div className="flex justify-between font-medium">
          <label className="font-bold text-gray-800 dark:text-slate-100">{label}</label>
          <DirectNumberInput
            value={numVal}
            min={minVal}
            max={maxVal}
            onChange={handleNumChange}
            className="text-cyan-600 dark:text-cyan-300 font-bold"
          />
        </div>
        <input
          type="range"
          min={minVal}
          max={maxVal}
          step={maxVal <= 10 ? 0.1 : (maxVal <= 200 ? 1 : 10)}
          value={Math.min(maxVal, Math.max(minVal, numVal))}
          onChange={(e) => handleNumChange(Number(e.target.value))}
          className="w-full accent-cyan-600 cursor-pointer"
        />
      </div>
    );
  }

  // Opciones verdaderas traídas dinámicamente desde Grasshopper
  let options: string[] = limit?.options && limit.options.length > 0 ? limit.options : [];
  if (options.length === 0) {
    const pl = paramKey.toLowerCase();
    if (pl.includes("union")) options = ["Minifix", "Tornillo tarugo", "Entrepaño"];
    else if (pl.includes("orientacion")) options = ["abajo", "arriba"];
    else if (pl.includes("posicion")) options = ["1", "2"];
    else if (pl.includes("borde")) options = ["MDP", "Canto"];
    else if (pl.includes("balance")) options = ["Cara A", "Cara B", "D/D"];
    else if (pl.includes("mapeado")) options = ["Cubierta", "Cubierta Atravesada"];
    else if (pl.includes("cajon")) options = ["Corredera Estandar", "Corredera Tipo X"];
    else options = [String(value || "Por defecto")];
  }

  const selectedValue = String(value ?? limit?.default ?? options[0]);

  const handleSelectChange = (newVal: string) => {
    if (objetoActivoId) {
      setParametroInstancia(objetoActivoId, storeKey, newVal);
      setParametroInstancia(objetoActivoId, rawKeyClean, newVal);
      if (legacyKey) setParametroInstancia(objetoActivoId, legacyKey, newVal);

      const pkl = paramKey.toLowerCase();
      if (pkl.includes("izquierdo") || pkl.includes("izq")) {
        setParametroInstancia(objetoActivoId, "borde_izquierdo", newVal);
        setParametroInstancia(objetoActivoId, "RH_IN:Borde izquierdo", newVal);
        setParametroInstancia(objetoActivoId, "RH_IN:03.4 Borde izquierdo", newVal);
      }
      if (pkl.includes("derecho") || pkl.includes("der")) {
        setParametroInstancia(objetoActivoId, "borde_derecho", newVal);
        setParametroInstancia(objetoActivoId, "RH_IN:Borde derecho", newVal);
        setParametroInstancia(objetoActivoId, "RH_IN:03.3 Borde derecho", newVal);
      }
    } else {
      setParametro(storeKey as any, newVal);
      setParametro(rawKeyClean as any, newVal);
      if (legacyKey) setParametro(legacyKey as any, newVal);
      
      const pkl = paramKey.toLowerCase();
      if (pkl.includes("izquierdo") || pkl.includes("izq")) {
        setParametro("borde_izquierdo" as any, newVal);
        setParametro("RH_IN:Borde izquierdo" as any, newVal);
        setParametro("RH_IN:03.4 Borde izquierdo" as any, newVal);
      }
      if (pkl.includes("derecho") || pkl.includes("der")) {
        setParametro("borde_derecho" as any, newVal);
        setParametro("RH_IN:Borde derecho" as any, newVal);
        setParametro("RH_IN:03.3 Borde derecho" as any, newVal);
      }
    }
  };

  return (
    <div className="flex justify-between items-center bg-[#E2E8F0] dark:bg-[#1E293B]/70 p-2 rounded-lg border border-slate-300 dark:border-slate-700/60 text-xs text-[#0F172A] dark:text-slate-100 shadow-sm">
      <span className="font-bold text-[11px] text-[#0F172A] dark:text-slate-200">{label}:</span>
      <select
        value={selectedValue}
        onChange={(e) => handleSelectChange(e.target.value)}
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

// Panel de Parámetros Dinámico Autónomo (Sólo visible cuando hay un archivo cargado con grupos reales)
function ParametrosPanel() {
  const { parametros, setParametro, resultado } = use3BFStore();

  if (!parametros.model_id) return null;

  // Si no hay grupos dinámicos parseados del archivo, mantener el panel 100% limpio
  if (!resultado?.parameter_groups || resultado.parameter_groups.length === 0) {
    return null;
  }

  const esCubierta = (parametros.model_id + (parametros.custom_filename || "")).toLowerCase().includes("cubierta");
  const groups = resultado.parameter_groups;

  return (
    <div className="flex flex-col gap-3.5">
      {groups.map((grp: { title: string; parameters: string[] }, idx: number) => (
        <div key={`group-${idx}`} className="flex flex-col gap-3 p-3 rounded-xl bg-cyan-950/20 dark:bg-[#131B2E]/60 border border-cyan-200/80 dark:border-cyan-900/40 shadow-sm">
          <div className="text-xs font-extrabold text-gray-900 dark:text-[#F8FAFC] flex items-center gap-1.5 pb-1.5 border-b border-cyan-200/50 dark:border-cyan-900/40">
            <Box className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
            <span>{grp.title}</span>
          </div>

          <div className="flex flex-col gap-2">
            {grp.parameters.map((pKey: string) => (
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
  "RH_IN:02.4 Posicion Tarugo": "posicion_tarugo",
  "RH_IN:Posicion Tornillo": "posicion_tornillo",
  "RH_IN:02.5Posicion Tornillo": "posicion_tornillo",
  "RH_IN:02.3Posicion Minifix": "posicion_minifix",
  "RH_IN:Borde izquierdo": "borde_izquierdo",
  "RH_IN:03.4 Borde izquierdo": "borde_izquierdo",
  "RH_IN:Borde derecho": "borde_derecho",
  "RH_IN:03.3 Borde derecho": "borde_derecho",
  "RH_IN:Lado balance cubierta": "lado_balance_cubierta",
  "RH_IN:03.1 Lado balance": "lado_balance_cubierta",
  "RH_IN:Tipo de mapeado cubierta": "tipo_mapeado_cubierta",
  "RH_IN:03.0 Mapeado": "tipo_mapeado_cubierta",
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
        
        // Sincronizar store dinámicamente con cualquier clave de Grasshopper
        Object.entries(data.default_values).forEach(([ghKey, val]) => {
          setParametro(ghKey as any, val);
          const cleanKey = ghKey.replace("RH_IN:", "").toLowerCase().replace(/\s+/g, "_");
          setParametro(cleanKey as any, val);
          const legacyKey = MAPA_PARAMETROS[ghKey];
          if (legacyKey) setParametro(legacyKey as any, val);
        });

        // Actualizar INMEDIATAMENTE los grupos de la interfaz y límites de sliders sin esperar al 3D
        const currRes = use3BFStore.getState().resultado;
        setResultado({
          ...(currRes || {}),
          parameter_groups: data.parameter_groups || [],
          slider_limits: data.slider_limits || {}
        } as any);
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

  // 🧹 Purga Previa Obligatoria (Clean-Before-Load Pattern)
  const purgarEstadoCompleto = () => {
    setResultado(null);
    setParametro("model_id", "");
    setParametro("custom_filename", "");
    setParametro("ghx_content", "");
    lastModelRef.current = null;
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const filename = file.name;
    const modelName = filename.replace(/\.(gh|ghx)$/i, "");

    // 1. Purga total previa de interfaz y modelo 3D viejo
    purgarEstadoCompleto();

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
        sincronizarParametrosDesdeArchivo(modelName, filename, content);
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
      sincronizarParametrosDesdeArchivo(modelName, filename, "");
    }
  };

  const handleSelectModel = (selectedId: string) => {
    // 1. Purga total previa de interfaz y modelo 3D viejo
    purgarEstadoCompleto();

    if (!selectedId) {
      setParametro("model_id", "");
      setParametro("custom_filename", "");
      setParametro("ghx_content", "");
      return;
    }

    const found = loadedFiles.find((f) => f.id === selectedId);
    if (found) {
      setParametro("model_id", found.id);
      setParametro("custom_filename", found.filename);
      setParametro("ghx_content", found.content || "");
      sincronizarParametrosDesdeArchivo(found.id, found.filename, found.content || "");
    } else {
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

  const [guardandoFoto, setGuardandoFoto] = React.useState(false);
  const [fotoCapturada, setFotoCapturada] = React.useState(false);

  const capturarMiniatura = async () => {
    try {
      const canvas = document.querySelector("canvas");
      if (!canvas) {
        alert("No se encontró el lienzo 3D.");
        return;
      }
      setGuardandoFoto(true);
      const imageBase64 = canvas.toDataURL("image/png");
      const modelId = parametros.model_id || "Cubierta";

      const res = await fetch("/api/thumbnail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model_id: modelId, imageBase64 }),
      });

      if (res.ok) {
        setFotoCapturada(true);
        setTimeout(() => setFotoCapturada(false), 2500);
        window.dispatchEvent(new CustomEvent("3bf-thumbnail-updated", { detail: { modelId } }));
      }
    } catch (err) {
      console.error("Error al capturar snapshot:", err);
    } finally {
      setGuardandoFoto(false);
    }
  };

  const { instancias, objetoActivoId, seleccionarInstancia } = use3BFStore();
  const instanciaActiva = objetoActivoId ? instancias[objetoActivoId] : null;

  return (
    <div className="p-4 flex flex-col gap-5 h-full overflow-y-auto">
      {/* 🏷️ CABECERA: OBJETO ACTIVO EN EL ESCENARIO (Multi-Instancia) */}
      {instanciaActiva && (
        <div className="flex flex-col gap-2 p-3 rounded-xl bg-cyan-600/10 dark:bg-cyan-950/40 border border-cyan-500/40 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-500 animate-pulse" />
              <div>
                <span className="text-[10px] text-gray-500 uppercase tracking-wider font-bold block">
                  Objeto Activo
                </span>
                <span className="font-extrabold text-sm text-cyan-950 dark:text-cyan-200">
                  {instanciaActiva.nombreVisible}
                </span>
              </div>
            </div>
            <div className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-100 dark:bg-cyan-900/60 text-cyan-800 dark:text-cyan-300 font-bold">
              {instanciaActiva.definitionId}
            </div>
          </div>

          {/* Selector rápido entre instancias si hay más de 1 */}
          {Object.keys(instancias).length > 1 && (
            <div className="flex items-center gap-1.5 pt-1.5 border-t border-cyan-200/50 dark:border-cyan-900/40 text-xs">
              <span className="text-[10px] font-bold text-gray-500">Cambiar:</span>
              <select
                value={objetoActivoId || ""}
                onChange={(e) => seleccionarInstancia(e.target.value)}
                className="flex-1 text-xs p-1 rounded-md bg-white dark:bg-slate-800 border border-cyan-300 dark:border-cyan-800 font-bold text-slate-800 dark:text-cyan-300 outline-none cursor-pointer"
              >
                {Object.values(instancias).map((inst) => (
                  <option key={inst.id} value={inst.id}>
                    {inst.nombreVisible} ({inst.definitionId})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}

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

        {/* Botón Capturar Miniatura: Aparece cada vez que hay un GHX cargado */}
        {parametros.model_id && (
          <div className="pt-2 border-t border-cyan-200/50 dark:border-cyan-900/40">
            <button
              onClick={capturarMiniatura}
              disabled={guardandoFoto}
              title={`Capturar la vista actual del lienzo 3D como miniatura para ${parametros.model_id}`}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg font-bold text-xs transition-all shadow-sm border bg-white dark:bg-[#131B2E] hover:bg-cyan-50 dark:hover:bg-cyan-950/60 text-slate-800 dark:text-cyan-300 border-slate-300 dark:border-cyan-800/60 cursor-pointer hover:border-cyan-500 hover:scale-[1.01]"
            >
              {fotoCapturada ? (
                <>
                  <Check className="w-4 h-4 text-emerald-500" />
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">¡Miniatura Guardada con Éxito!</span>
                </>
              ) : (
                <>
                  <Camera className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                  <span>{guardandoFoto ? "Capturando miniatura..." : "Capturar Miniatura"}</span>
                </>
              )}
            </button>
          </div>
        )}
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

        {/* Botón para explorar disco duro (Cápsula rounded-full con purga previa) */}
        <button
          onClick={() => {
            purgarEstadoCompleto();
            fileInputRef.current?.click();
          }}
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
