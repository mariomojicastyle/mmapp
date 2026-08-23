"use client";

import React, { useEffect } from "react";
import { use3BFStore } from "@/lib/store";
import { Sliders, Box, Layers, Palette, Cpu, CheckCircle2, AlertCircle, Camera, Check, RotateCw, MousePointerClick } from "lucide-react";

// =========================================================================
// 🎨 ICONOS DE MODOS DE VISUALIZACIÓN (INSPIRADOS EN BLENDER 4.X)
// =========================================================================

// 1. Líneas (Wireframe)
export const IconModoLineas = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor">
    <circle cx="12" cy="12" r="9" strokeWidth="1.6" />
    <line x1="12" y1="3" x2="12" y2="21" strokeWidth="1.3" />
    <ellipse cx="12" cy="12" rx="4.5" ry="9" strokeWidth="1.3" />
    <line x1="3.8" y1="8.5" x2="20.2" y2="8.5" strokeWidth="1.3" />
    <line x1="3.8" y1="15.5" x2="20.2" y2="15.5" strokeWidth="1.3" />
  </svg>
);

// 2. Cristal (Semitransparente / Glass Tinted)
export const IconModoCristal = ({ className = "w-4 h-4", isActivo = false }: { className?: string; isActivo?: boolean }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className}>
    {/* Fondo de Cristal Azulado Semitransparente Vívido */}
    <circle 
      cx="12" 
      cy="12" 
      r="9" 
      fill={isActivo ? "#0284c7" : "#0284c7"} 
      fillOpacity={isActivo ? "0.6" : "0.32"} 
      stroke={isActivo ? "#FFFFFF" : "#0284c7"} 
      strokeWidth="1.6" 
    />
    
    {/* Malla interna con tono azul cyan */}
    <line x1="12" y1="3" x2="12" y2="21" stroke={isActivo ? "#FFFFFF" : "#0284c7"} strokeWidth="1.2" strokeOpacity={isActivo ? "0.85" : "0.75"} />
    <ellipse cx="12" cy="12" rx="4.5" ry="9" stroke={isActivo ? "#FFFFFF" : "#0284c7"} strokeWidth="1.2" strokeOpacity={isActivo ? "0.85" : "0.75"} />
    <line x1="3.8" y1="8.5" x2="20.2" y2="8.5" stroke={isActivo ? "#FFFFFF" : "#0284c7"} strokeWidth="1.2" strokeOpacity={isActivo ? "0.85" : "0.75"} />
    <line x1="3.8" y1="15.5" x2="20.2" y2="15.5" stroke={isActivo ? "#FFFFFF" : "#0284c7"} strokeWidth="1.2" strokeOpacity={isActivo ? "0.85" : "0.75"} />
    
    {/* Arco de Brillo Especular Superior Izquierdo (Reflejo de Vidrio) */}
    <path 
      d="M 6.5 7 A 7 7 0 0 1 11.5 5" 
      stroke="#FFFFFF" 
      strokeWidth="2" 
      strokeLinecap="round" 
      opacity={isActivo ? "1" : "0.95"} 
    />
  </svg>
);

// 3. Sólido (Solid)
export const IconModoSolido = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className}>
    <circle cx="12" cy="12" r="9" fill="currentColor" stroke="currentColor" strokeWidth="1.6" />
  </svg>
);

// 4. Renderizado (Render / Specular)
export const IconModoRender = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className}>
    <circle cx="12" cy="12" r="9" fill="#1E293B" stroke="currentColor" strokeWidth="1.6" />
    {/* Highlight especular superior izquierdo */}
    <ellipse
      cx="8"
      cy="7.5"
      rx="3.2"
      ry="1.8"
      transform="rotate(-35 8 7.5)"
      fill="#FFFFFF"
    />
    <ellipse
      cx="14.5"
      cy="16"
      rx="2.2"
      ry="1.1"
      transform="rotate(-35 14.5 16)"
      fill="#FFFFFF"
      opacity="0.85"
    />
  </svg>
);

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
  onChange: (val: number, debounceMs?: number) => void;
  className?: string;
}) => {
  const { coloresApariencia, guardarEstadoHistorial } = use3BFStore();
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
      onChange(num, 200);
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
    onChange(clamped, 0); // Disparo instantáneo al salir del input
    setLocalText(String(clamped));
    guardarEstadoHistorial();
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
        style={{
          borderColor: coloresApariencia?.bordePaneles,
          backgroundColor: coloresApariencia?.fondoAplicacion,
          color: coloresApariencia?.botonActivo
        }}
        className={`w-16 px-1.5 py-0.5 text-right text-xs font-mono font-bold border rounded outline-none shadow-xs transition ${className}`}
      />
      <span style={{ color: coloresApariencia?.textoSecundario }} className="text-[11px] font-mono font-semibold">{unit}</span>
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
  const { parametros, setParametro, resultado, objetoActivoId, instancias, setParametroInstancia, coloresApariencia, guardarEstadoHistorial } = use3BFStore();
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

    const handleNumChange = (val: number, debounceMs: number = 180) => {
      if (objetoActivoId) {
        setParametroInstancia(objetoActivoId, storeKey, val, debounceMs);
        if (rawKeyClean !== storeKey) setParametroInstancia(objetoActivoId, rawKeyClean, val, debounceMs);
        if (legacyKey) setParametroInstancia(objetoActivoId, legacyKey, val, debounceMs);
      } else {
        setParametro(storeKey as any, val);
        if (rawKeyClean !== storeKey) setParametro(rawKeyClean as any, val);
        if (legacyKey) setParametro(legacyKey as any, val);
      }
    };

    return (
      <div 
        style={{ 
          backgroundColor: coloresApariencia?.fondoPaneles, 
          borderColor: coloresApariencia?.bordePaneles || "#CBD5E1" 
        }}
        className="flex flex-col gap-1.5 p-2 rounded-lg border shadow-xs text-xs"
      >
        <div className="flex justify-between font-medium items-center">
          <label style={{ color: coloresApariencia?.textoPrincipal }} className="font-bold">{label}</label>
          <DirectNumberInput
            value={numVal}
            min={minVal}
            max={maxVal}
            onChange={(val, deb) => handleNumChange(val, deb ?? 0)}
          />
        </div>
        <input
          type="range"
          min={minVal}
          max={maxVal}
          step={maxVal <= 10 ? 0.1 : (maxVal <= 200 ? 1 : 10)}
          value={Math.min(maxVal, Math.max(minVal, numVal))}
          onChange={(e) => handleNumChange(Number(e.target.value), 180)}
          onPointerUp={(e) => {
            handleNumChange(Number((e.target as HTMLInputElement).value), 0);
            guardarEstadoHistorial();
          }}
          onKeyUp={(e) => {
            handleNumChange(Number((e.target as HTMLInputElement).value), 0);
            guardarEstadoHistorial();
          }}
          onTouchEnd={(e) => {
            handleNumChange(Number((e.target as HTMLInputElement).value), 0);
            guardarEstadoHistorial();
          }}
          style={{ accentColor: coloresApariencia?.botonActivo || "#0891B2" }}
          className="w-full cursor-pointer"
        />
      </div>
    );
  }

  // Opciones verdaderas traídas dinámicamente desde Grasshopper
  let options: string[] = limit?.options && limit.options.length > 0 ? limit.options : [];
  if (options.length === 0) {
    const pl = paramKey.toLowerCase();
    if (pl.includes("union") || pl.includes("unión")) {
      options = ["Minifix", "Tornillo", "Tarugo", "Ranura", "Sin Mecanizado"];
    } else if (pl.includes("borde")) {
      options = ["MDP", "PVC 1mm", "PVC 2mm", "Canto Grueso", "Sin Tapacanto"];
    } else if (pl.includes("posicion") || pl.includes("posición")) {
      options = ["1", "0", "2", "3"];
    } else if (pl.includes("orientacion") || pl.includes("orientación")) {
      options = ["abajo", "arriba", "frente", "atras"];
    } else if (pl.includes("mapeado")) {
      options = ["Horizontal Atravesada", "Vertical", "Diagonal"];
    } else if (pl.includes("lado balance")) {
      options = ["Cara B", "Cara A", "Ambas"];
    } else {
      options = ["Opción A", "Opción B", "Por Defecto"];
    }
  }

  const selectedValue = String(value ?? limit?.default ?? options[0]);

  const handleSelectChange = (newVal: string) => {
    if (objetoActivoId) {
      setParametroInstancia(objetoActivoId, storeKey, newVal, 0);
      setParametroInstancia(objetoActivoId, rawKeyClean, newVal, 0);
      if (legacyKey) setParametroInstancia(objetoActivoId, legacyKey, newVal, 0);

      const pkl = paramKey.toLowerCase();
      if (pkl.includes("izquierdo") || pkl.includes("izq")) {
        setParametroInstancia(objetoActivoId, "borde_izquierdo", newVal, 0);
        setParametroInstancia(objetoActivoId, "RH_IN:Borde izquierdo", newVal, 0);
        setParametroInstancia(objetoActivoId, "RH_IN:03.4 Borde izquierdo", newVal, 0);
      }
      if (pkl.includes("derecho") || pkl.includes("der")) {
        setParametroInstancia(objetoActivoId, "borde_derecho", newVal, 0);
        setParametroInstancia(objetoActivoId, "RH_IN:Borde derecho", newVal, 0);
        setParametroInstancia(objetoActivoId, "RH_IN:03.3 Borde derecho", newVal, 0);
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
    guardarEstadoHistorial();
  };

  return (
    <div 
      style={{ 
        backgroundColor: coloresApariencia?.fondoPaneles, 
        borderColor: coloresApariencia?.bordePaneles || "#CBD5E1" 
      }}
      className="flex justify-between items-center p-2 rounded-lg border text-xs shadow-sm"
    >
      <span style={{ color: coloresApariencia?.textoPrincipal }} className="font-bold text-[11px]">{label}:</span>
      <select
        value={selectedValue}
        onChange={(e) => handleSelectChange(e.target.value)}
        style={{ 
          borderColor: coloresApariencia?.bordePaneles || "#CBD5E1",
          backgroundColor: coloresApariencia?.fondoAplicacion,
          color: coloresApariencia?.textoPrincipal
        }}
        className="text-xs p-1 rounded-lg border font-bold outline-none cursor-pointer"
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
  const { parametros, resultado, coloresApariencia, objetoActivoId, instancias } = use3BFStore();
  const instanciaActiva = objetoActivoId ? instancias[objetoActivoId] : null;
  const currentResult = instanciaActiva ? instanciaActiva.resultado : resultado;

  if (!parametros.model_id && !instanciaActiva) return null;

  // Si no hay grupos dinámicos parseados del archivo, mantener el panel 100% limpio
  if (!currentResult?.parameter_groups || currentResult.parameter_groups.length === 0) {
    return null;
  }

  const groups = currentResult.parameter_groups;

  return (
    <div className="flex flex-col gap-3.5">
      {groups.map((grp: { title: string; parameters: string[] }, idx: number) => (
        <div 
          key={`group-${idx}`} 
          style={{ 
            borderColor: coloresApariencia?.insigniaFondo || coloresApariencia?.bordePaneles,
            backgroundColor: coloresApariencia?.fondoPaneles ? `${coloresApariencia.fondoPaneles}80` : undefined
          }}
          className="flex flex-col gap-3 p-3 rounded-xl border shadow-sm"
        >
          <div 
            style={{ 
              borderColor: coloresApariencia?.insigniaFondo || coloresApariencia?.bordePaneles,
              color: coloresApariencia?.textoPrincipal 
            }}
            className="text-xs font-extrabold flex items-center gap-1.5 pb-1.5 border-b"
          >
            <Box 
              style={{ color: coloresApariencia?.botonActivo || "#0891b2" }} 
              className="w-4 h-4 shrink-0" 
            />
            <span>{grp.title}</span>
          </div>

          <div className="flex flex-col gap-2">
            {grp.parameters.map((pKey: string) => (
              <RenderParamControl key={pKey} paramKey={pKey} />
            ))}
          </div>
        </div>
      ))}
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

  const [isSyncing, setIsSyncing] = React.useState(false);
  const lastModelRef = React.useRef<string | null>(null);

  // Comprobar estado de conexión del Worker Python y RhinoCompute
  const verificarWorker = async () => {
    try {
      const res = await fetch("/api/health", {
        method: "GET",
        headers: { "Cache-Control": "no-cache" },
        signal: AbortSignal.timeout(3000),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.status === "online" && data.worker && data.rhino_compute) {
          setWorkerStatus("online");
        } else {
          setWorkerStatus("offline");
        }
      } else {
        setWorkerStatus("offline");
      }
    } catch {
      setWorkerStatus("offline");
    }
  };

  useEffect(() => {
    verificarWorker();
    const interval = setInterval(verificarWorker, 8000);
    const handleReactivation = () => {
      verificarWorker();
    };

    window.addEventListener("focus", handleReactivation);
    document.addEventListener("visibilitychange", handleReactivation);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", handleReactivation);
      document.removeEventListener("visibilitychange", handleReactivation);
    };
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

  useEffect(() => {
    if (isSyncing) return; // Evitar disparar cómputo mientras se sincronizan los parámetros
    ejecutarComputo();
  }, [parametros, isSyncing]);

  const { instancias, objetoActivoId, coloresApariencia, seleccionarInstancia } = use3BFStore();
  const instanciaActiva = objetoActivoId ? instancias[objetoActivoId] : null;
  const listaInstancias = Object.values(instancias || {});

  return (
    <div className="p-4 flex flex-col gap-5 h-full overflow-y-auto no-scrollbar">
      {/* 🏷️ CABECERA: OBJETO ACTIVO EN EL ESCENARIO (Multi-Instancia) */}
      {instanciaActiva ? (
        <>
          <div 
            style={{ 
              borderColor: coloresApariencia?.insigniaFondo || coloresApariencia?.bordePaneles,
              backgroundColor: coloresApariencia?.fondoPaneles ? `${coloresApariencia.fondoPaneles}80` : undefined
            }}
            className="flex flex-col gap-2 p-3 rounded-xl border shadow-sm"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span 
                  style={{ backgroundColor: coloresApariencia?.estadoActivo || "#10B981" }} 
                  className={`w-2.5 h-2.5 rounded-full shrink-0 ${instanciaActiva.cargando ? "animate-spin bg-cyan-500" : "animate-pulse"}`} 
                />
                <span 
                  style={{ color: coloresApariencia?.textoPrincipal }} 
                  className="font-extrabold text-sm leading-none truncate"
                  title={instanciaActiva.nombreVisible}
                >
                  {instanciaActiva.nombreVisible}
                </span>
              </div>

              {instanciaActiva.cargando && (
                <span className="text-[10px] font-bold text-cyan-500 animate-pulse shrink-0">
                  Sincronizando...
                </span>
              )}
            </div>
          </div>

          {/* Panel de Parámetros Dinámico Activo */}
          <ParametrosPanel />
        </>
      ) : (
        /* 💤 ESTADO INACTIVO: NINGÚN COMPONENTE SELECCIONADO */
        <div 
          style={{ 
            borderColor: coloresApariencia?.bordePaneles || "#CBD5E1",
            backgroundColor: coloresApariencia?.fondoPaneles ? `${coloresApariencia.fondoPaneles}60` : undefined,
            color: coloresApariencia?.textoSecundario 
          }}
          className="p-6 flex flex-col items-center justify-center text-center gap-3.5 border border-dashed rounded-2xl my-auto shadow-xs"
        >
          <div 
            style={{ 
              backgroundColor: coloresApariencia?.insigniaFondo || "#CFFAFE", 
              color: coloresApariencia?.insigniaTexto || "#0891B2" 
            }}
            className="w-12 h-12 rounded-full flex items-center justify-center shadow-xs"
          >
            <MousePointerClick className="w-6 h-6" />
          </div>

          <div className="flex flex-col gap-1">
            <h4 style={{ color: coloresApariencia?.textoPrincipal }} className="font-extrabold text-sm">
              Ningún componente seleccionado
            </h4>
            <p className="text-[11px] leading-relaxed max-w-[220px]">
              Haz clic sobre el mueble en el visor 3D para activar sus parámetros y la orientación de vetas.
            </p>
          </div>

          {listaInstancias.length > 0 && (
            <button
              onClick={() => seleccionarInstancia(listaInstancias[0].id)}
              style={{
                backgroundColor: coloresApariencia?.botonActivo || "#0891B2",
                color: "#FFFFFF"
              }}
              className="mt-1 px-4 py-2 rounded-xl text-xs font-extrabold shadow-sm hover:opacity-90 active:scale-95 transition cursor-pointer"
            >
              Seleccionar {listaInstancias[0].nombreVisible}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
