"use client";

import React, { useState, useEffect, useRef } from "react";
import { use3BFStore } from "@/lib/store";
import type { DisenoEncapsulado3BF } from "@/lib/storeTypes";
import { saveDisenosToIndexedDB, loadDisenosFromIndexedDB, deleteDisenosFromIndexedDB } from "@/lib/disenosStorage";
import { Plus, Edit2, Trash2, Check, ChevronDown, ChevronUp, X, RotateCw, Sparkles, GripVertical } from "lucide-react";

export type MemoryPose = DisenoEncapsulado3BF;

interface MemoryPosesLEDProps {
  groupParameters: string[];
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
};

export function MemoryPosesLED({ groupParameters }: MemoryPosesLEDProps) {
  const {
    parametros,
    setParametro,
    resultado,
    objetoActivoId,
    instancias,
    setParametroInstancia,
    coloresApariencia,
    guardarEstadoHistorial,
    guardarDisenoInstancia,
    reordenarDisenosInstancia,
    sincronizarColeccionDisenos,
    activarDisenoInstancia,
    eliminarDisenoInstancia,
    muebleActivoGuardado,
  } = use3BFStore();

  const activeId = objetoActivoId || Object.keys(instancias || {})[0] || null;
  const instanciaActiva = activeId ? instancias[activeId] : null;
  const currentParams = instanciaActiva ? instanciaActiva.parametros : parametros;
  const currentResult =
    (instanciaActiva?.resultado && Array.isArray(instanciaActiva.resultado.real_meshes) && instanciaActiva.resultado.real_meshes.length > 0)
      ? instanciaActiva.resultado
      : (resultado && Array.isArray(resultado.real_meshes) && resultado.real_meshes.length > 0)
        ? resultado
        : (instanciaActiva?.resultado || resultado);

  const modelId = parametros.model_id || instanciaActiva?.definitionId || instanciaActiva?.archivo || "default_model";
  const currentMuebleId = muebleActivoGuardado?.id || null;
  const storageEntityId = currentMuebleId ? `mueble_${currentMuebleId}` : (activeId ? `instancia_${activeId}` : `model_${modelId}`);
  const storageKey = `3bf_poses_${storageEntityId}`;

  const [poses, setPoses] = useState<DisenoEncapsulado3BF[]>([]);
  const [poseActivaId, setPoseActivaId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editNombre, setEditNombre] = useState("");
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [arrastrandoId, setArrastrandoId] = useState<string | null>(null);
  const [sobreObjetivoId, setSobreObjetivoId] = useState<string | null>(null);
  const [actualizadoId, setActualizadoId] = useState<string | null>(null);
  const [ghxReloadCount, setGhxReloadCount] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const ultimoMuebleIdRef = useRef<string | null>(null);

  useEffect(() => {
    const onReload = () => setGhxReloadCount((c) => c + 1);
    window.addEventListener("3bf-ghx-reloaded", onReload);

    // 🧹 Purgar claves legacy no aisladas para evitar contaminación cruzada entre muebles
    if (typeof window !== "undefined") {
      try {
        ["Comoda Ravenna", "Comoda Ravenna.ghx", "default_model"].forEach((k) => {
          localStorage.removeItem(`3bf_poses_${k}`);
          deleteDisenosFromIndexedDB(k);
        });
      } catch (_) {}
    }

    return () => window.removeEventListener("3bf-ghx-reloaded", onReload);
  }, []);

  // 🖱️ Reordenamiento de Diseños con Clic Sostenido / Drag and Drop
  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData("text/plain", id);
    e.dataTransfer.effectAllowed = "move";
    setArrastrandoId(id);
  };

  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (sobreObjetivoId !== id) {
      setSobreObjetivoId(id);
    }
  };

  const handleDragLeave = (e: React.DragEvent, id: string) => {
    if (sobreObjetivoId === id) {
      setSobreObjetivoId(null);
    }
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    setSobreObjetivoId(null);
    const sourceId = arrastrandoId || e.dataTransfer.getData("text/plain");
    if (!sourceId || sourceId === targetId) return;

    const sourceIndex = poses.findIndex((p) => p.id === sourceId);
    const targetIndex = poses.findIndex((p) => p.id === targetId);
    if (sourceIndex < 0 || targetIndex < 0) return;

    const nuevasPoses = [...poses];
    const [movido] = nuevasPoses.splice(sourceIndex, 1);
    nuevasPoses.splice(targetIndex, 0, movido);

    persistPoses(nuevasPoses);
    setArrastrandoId(null);
  };

  const handleDragEnd = () => {
    setArrastrandoId(null);
    setSobreObjetivoId(null);
  };

  // 🛡️ Sincronizar diseños ESTRICTAMENTE aislados por Mueble Activo
  useEffect(() => {
    let cancelado = false;
    const muebleCambio = currentMuebleId !== ultimoMuebleIdRef.current;
    ultimoMuebleIdRef.current = currentMuebleId;

    // 🔒 CASO 1: El usuario cambió de mueble (ej. abrió "1_Comoda Ravenna" viniendo de "Linea Ravenna")
    if (muebleCambio) {
      if (currentMuebleId) {
        // Cargar ESTRICTAMENTE los diseños que pertenecen a este mueble
        const disenosDelMueble = Array.isArray(muebleActivoGuardado?.disenos) ? muebleActivoGuardado!.disenos! : [];
        if (disenosDelMueble.length > 0) {
          setPoses(disenosDelMueble);
          setPoseActivaId(muebleActivoGuardado?.disenoActivoId || null);
          return;
        }

        // Si no vienen en el objeto en memoria, buscar en IndexedDB con la clave exclusiva de este mueble
        loadDisenosFromIndexedDB(storageEntityId).then((idbDisenos) => {
          if (cancelado) return;
          if (Array.isArray(idbDisenos) && idbDisenos.length > 0) {
            setPoses(idbDisenos);
            if (sincronizarColeccionDisenos) {
              sincronizarColeccionDisenos(idbDisenos, activeId || undefined);
            }
          } else {
            // Este mueble no tiene diseños creados: lista limpia (cero contaminación)
            setPoses([]);
            setPoseActivaId(null);
          }
        });
        return;
      }

      // Escenario nuevo sin mueble guardado
      const disenosInst = (instanciaActiva?.disenos && Array.isArray(instanciaActiva.disenos)) ? instanciaActiva.disenos : [];
      setPoses(disenosInst);
      setPoseActivaId(instanciaActiva?.disenoActivoId || null);
      return;
    }

    // 🔄 CASO 2: Estamos dentro del mismo mueble y hubo una actualización local
    const disenosInst = (instanciaActiva?.disenos && Array.isArray(instanciaActiva.disenos)) ? instanciaActiva.disenos : [];
    const disenosMueble = (muebleActivoGuardado?.disenos && Array.isArray(muebleActivoGuardado.disenos)) ? muebleActivoGuardado.disenos : [];

    if (disenosMueble.length > 0) {
      setPoses(disenosMueble);
      if (muebleActivoGuardado?.disenoActivoId) {
        setPoseActivaId(muebleActivoGuardado.disenoActivoId);
      }
      return;
    }

    if (disenosInst.length > 0) {
      setPoses(disenosInst);
      if (instanciaActiva?.disenoActivoId) {
        setPoseActivaId(instanciaActiva.disenoActivoId);
      }
      return;
    }
  }, [currentMuebleId, storageEntityId, muebleActivoGuardado?.disenos, instanciaActiva?.disenos, activeId]);

  // Persistir en IndexedDB, Store central y metadatos en localStorage
  const persistPoses = (newPoses: DisenoEncapsulado3BF[]) => {
    setPoses(newPoses);
    // 1. Sincronizar centralmente en el store con todas las instancias y mueble guardado
    if (sincronizarColeccionDisenos) {
      sincronizarColeccionDisenos(newPoses, activeId || undefined);
    }
    // 2. Guardar colección completa con mallas 3D en IndexedDB con la clave exclusiva de este mueble
    saveDisenosToIndexedDB(storageEntityId, newPoses);

    // 3. Guardar metadatos en localStorage con la clave exclusiva de este mueble
    try {
      const lightPoses = newPoses.map((p) => ({
        id: p.id,
        nombre: p.nombre,
        valores: p.valores,
        fecha: p.fecha,
        thumbnail: p.thumbnail,
        tiene_geometria: !!(p.resultado && p.resultado.real_meshes && p.resultado.real_meshes.length > 0),
      }));
      localStorage.setItem(storageKey, JSON.stringify(lightPoses));
    } catch {
      console.warn("Storage cuota excedida: Diseños preservados en IndexedDB.");
    }
  };

  // Obtener el valor actual de un parámetro
  const getParamCurrentValue = (paramKey: string): number | string => {
    const rawKeyClean = paramKey.replace("RH_IN:", "").toLowerCase().replace(/\s+/g, "_");
    const legacyKey = MAPA_PARAMETROS[paramKey];
    const limit = currentResult?.slider_limits?.[paramKey];
    const val =
      (currentParams as any)[paramKey] ??
      (legacyKey ? (currentParams as any)[legacyKey] : (currentParams as any)[rawKeyClean]) ??
      limit?.default ??
      0;
    return val;
  };

  // Comparar si los valores actuales coinciden con algún diseño guardado
  useEffect(() => {
    if (poses.length === 0) {
      setPoseActivaId(null);
      return;
    }

    const matched = poses.find((p) => {
      return Object.entries(p.valores).every(([pKey, pVal]) => {
        const curVal = getParamCurrentValue(pKey);
        return String(curVal) === String(pVal);
      });
    });

    if (matched) {
      setPoseActivaId(matched.id);
    } else {
      setPoseActivaId(null);
    }
  }, [currentParams, poses, groupParameters]);

  // Capturar valores actuales del grupo
  const captureCurrentValues = () => {
    const valores: Record<string, number | string> = {};
    groupParameters.forEach((pKey) => {
      valores[pKey] = getParamCurrentValue(pKey);
    });
    return valores;
  };

  // Detectar si un diseño difiere de los parámetros o geometría actual de la escena
  const poseDifiereDeEscena = (pose: DisenoEncapsulado3BF): boolean => {
    // 1. Si no tiene mallas 3D calculadas, requiere actualizarse
    if (!pose.resultado || !pose.resultado.real_meshes || pose.resultado.real_meshes.length === 0) {
      return true;
    }
    // 2. Si alguno de sus parámetros dimensionales cambió en la escena
    const algunParamDifiere = Object.entries(pose.valores || {}).some(([pKey, pVal]) => {
      const curVal = getParamCurrentValue(pKey);
      const numCur = Number(curVal);
      const numP = Number(pVal);
      if (!isNaN(numCur) && !isNaN(numP)) {
        return Math.abs(numCur - numP) > 0.5;
      }
      return String(curVal) !== String(pVal);
    });
    if (algunParamDifiere) return true;

    // 3. Si hubo una recarga explícita de GHX posterior a la fecha de guardado de esta pose
    const lastReload = typeof window !== "undefined" ? ((window as any).__3bf_last_ghx_reload_time || 0) : 0;
    if (lastReload > (pose.fecha || 0)) {
      return true;
    }

    return false;
  };

  // Crear un nuevo diseño con cálculo 3D completo resuelto en memoria
  const handleCrearPose = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const nuevosValores = captureCurrentValues();
    const numeroPose = poses.length + 1;
    const resultadoCalculado = currentResult ? JSON.parse(JSON.stringify(currentResult)) : null;

    const nuevoDiseno: DisenoEncapsulado3BF = {
      id: `diseno_${Date.now()}`,
      nombre: `Diseño ${numeroPose}`,
      valores: nuevosValores,
      resultado: resultadoCalculado,
      fecha: Date.now(),
    };

    if (activeId) {
      guardarDisenoInstancia(activeId, nuevoDiseno);
    }

    const actualizadas = [...poses, nuevoDiseno];
    persistPoses(actualizadas);
    setPoseActivaId(nuevoDiseno.id);
    setEditingId(nuevoDiseno.id);
    setEditNombre(nuevoDiseno.nombre);
    setIsCollapsed(false);

    setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    }, 50);
  };

  // Activar un diseño (Conmutación Instantánea < 10 ms en RAM - Cero Llamadas a Servidor)
  const handleActivarPose = (pose: DisenoEncapsulado3BF) => {
    setPoseActivaId(pose.id);

    if (pose.resultado && pose.resultado.real_meshes && pose.resultado.real_meshes.length > 0 && activeId) {
      // ⚡ Conmutación Instantánea Estilo Poser
      activarDisenoInstancia(activeId, pose.id);
    } else {
      // Fallback para diseños heredados antiguos sin mallas cacheadas
      Object.entries(pose.valores).forEach(([pKey, val]) => {
        const numVal = typeof val === "number" ? val : Number(val);
        const finalVal = isNaN(numVal) ? val : numVal;

        if (activeId) {
          setParametroInstancia(activeId, pKey, finalVal, 0);
        } else {
          setParametro(pKey as any, finalVal);
        }
      });
    }

    guardarEstadoHistorial();
  };

  // Actualizar la geometría guardada de un diseño existente con la escena actual
  const handleActualizarDiseno = (poseId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const poseExistente = poses.find((p) => p.id === poseId);
    if (!poseExistente) return;
    const nuevosValores = captureCurrentValues();

    const fuenteResultado =
      (currentResult && Array.isArray(currentResult.real_meshes) && currentResult.real_meshes.length > 0)
        ? currentResult
        : (resultado && Array.isArray(resultado.real_meshes) && resultado.real_meshes.length > 0)
          ? resultado
          : currentResult;
    const resultadoCalculado = fuenteResultado ? JSON.parse(JSON.stringify(fuenteResultado)) : null;

    const disenoActualizado: DisenoEncapsulado3BF = {
      ...poseExistente,
      valores: nuevosValores,
      resultado: resultadoCalculado,
      fecha: Date.now() + 500, // Garantizar fecha posterior a cualquier reload de GHX
    };

    if (activeId) {
      guardarDisenoInstancia(activeId, disenoActualizado);
    }

    const actualizadas = poses.map((p) => (p.id === poseId ? disenoActualizado : p));
    persistPoses(actualizadas);
    guardarEstadoHistorial();

    setActualizadoId(poseId);
    setTimeout(() => {
      setActualizadoId((prev) => (prev === poseId ? null : prev));
    }, 2000);
  };

  // Iniciar edición de nombre
  const handleIniciarEdicion = (pose: DisenoEncapsulado3BF, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(pose.id);
    setEditNombre(pose.nombre);
    setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    }, 50);
  };

  // Guardar edición de nombre
  const handleGuardarNombre = (poseId: string) => {
    const nombreLimpio = editNombre.trim() || `Diseño`;
    const actualizadas = poses.map((p) => (p.id === poseId ? { ...p, nombre: nombreLimpio } : p));
    const poseModificada = actualizadas.find((p) => p.id === poseId);
    if (activeId && poseModificada) {
      guardarDisenoInstancia(activeId, poseModificada);
    }
    persistPoses(actualizadas);
    setEditingId(null);
  };

  // Eliminar un diseño
  const handleEliminarPose = (poseId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (activeId) {
      eliminarDisenoInstancia(activeId, poseId);
    }
    const actualizadas = poses.filter((p) => p.id !== poseId);
    persistPoses(actualizadas);
    if (poseActivaId === poseId) {
      setPoseActivaId(null);
    }
  };

  // Generar resumen compacto de dimensiones (ej: 800×900×450)
  const getResumenValores = (valores: Record<string, number | string>) => {
    const nums = Object.values(valores)
      .filter((v) => typeof v === "number" || (!isNaN(Number(v)) && Number(v) > 0))
      .map((v) => Math.round(Number(v)));
    if (nums.length >= 2) {
      return nums.slice(0, 3).join("×");
    }
    return "";
  };

  return (
    <div className="flex flex-col gap-1.5 mt-2 pt-2 border-t border-dashed border-slate-200 dark:border-slate-700/70">
      {/* Cabecera / Barra de Control */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-1.5">
          <span
            style={{ color: coloresApariencia?.textoSecundario || "#64748B" }}
            className="text-[9.5px] lg:text-[10px] font-black uppercase tracking-wider"
          >
            Diseños
          </span>
          {poses.length > 0 && (
            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
              {poses.length}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          {poses.length > 0 && (
            <>
              {/* Botón Añadir Pose (Cápsula Circular) */}
              <button
                type="button"
                onClick={handleCrearPose}
                title="Capturar y guardar diseño actual"
                className="w-5 h-5 rounded-full flex items-center justify-center bg-slate-100 dark:bg-slate-800 hover:bg-[#1368AA] hover:text-white dark:hover:bg-[#1368AA] dark:hover:text-white text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition cursor-pointer"
              >
                <Plus className="w-3 h-3" />
              </button>

              {/* Botón Plegar / Desplegar */}
              <button
                type="button"
                onClick={() => setIsCollapsed(!isCollapsed)}
                title={isCollapsed ? "Mostrar diseños" : "Ocultar diseños"}
                className="w-5 h-5 rounded-full flex items-center justify-center bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition cursor-pointer"
              >
                {isCollapsed ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Contenido: Si no hay poses creadas, ranura vacía con LED apagado */}
      {poses.length === 0 ? (
        <button
          type="button"
          onClick={handleCrearPose}
          title="Haga clic para capturar y bautizar esta configuración"
          className="group w-full flex items-center justify-between px-3 py-1.5 rounded-full border border-dashed border-slate-300 dark:border-slate-700 hover:border-[#1368AA] dark:hover:border-[#1368AA] bg-slate-50/70 dark:bg-slate-800/40 hover:bg-sky-50/50 dark:hover:bg-[#1368AA]/10 transition-all cursor-pointer shadow-2xs"
        >
          <div className="flex items-center gap-2">
            {/* LED Apagado Físico (Diode Concave Bulb) */}
            <div className="relative w-3.5 h-3.5 rounded-full bg-slate-300 dark:bg-slate-700 border border-slate-400 dark:border-slate-600 shadow-inner shrink-0 after:content-[''] after:absolute after:top-[1.5px] after:left-[2px] after:w-[3px] after:h-[3px] after:bg-white after:rounded-full after:opacity-40 group-hover:bg-sky-400/40 transition-colors" />

            <span className="text-[10.5px] lg:text-[11px] font-medium text-slate-500 dark:text-slate-400 group-hover:text-[#1368AA] transition-colors">
              Guardar diseño actual...
            </span>
          </div>

          <div className="flex items-center gap-1 text-[9.5px] font-bold text-slate-400 dark:text-slate-500 group-hover:text-[#1368AA]">
            <span>+ Capturar</span>
          </div>
        </button>
      ) : (
        !isCollapsed && (
          <div className="flex flex-col gap-1 max-h-48 overflow-y-auto pr-0.5 custom-scrollbar">
            {poses.map((pose) => {
              const isActiva = poseActivaId === pose.id;
              const isEditing = editingId === pose.id;
              const isArrastrando = arrastrandoId === pose.id;
              const isSobreObjetivo = sobreObjetivoId === pose.id && arrastrandoId !== pose.id;
              const resumen = getResumenValores(pose.valores);

              return (
                <div
                  key={pose.id}
                  draggable={!isEditing}
                  onDragStart={(e) => handleDragStart(e, pose.id)}
                  onDragOver={(e) => handleDragOver(e, pose.id)}
                  onDragLeave={(e) => handleDragLeave(e, pose.id)}
                  onDrop={(e) => handleDrop(e, pose.id)}
                  onDragEnd={handleDragEnd}
                  onClick={() => !isEditing && handleActivarPose(pose)}
                  className={`group relative flex items-center justify-between px-2 py-1 rounded-full border transition-all cursor-grab active:cursor-grabbing select-none ${
                    isArrastrando
                      ? "opacity-30 scale-95 border-dashed border-[#1368AA]"
                      : isSobreObjetivo
                      ? "border-2 border-[#1368AA] bg-[#1368AA]/15 scale-[1.02] shadow-sm"
                      : isActiva
                      ? "bg-sky-50/90 dark:bg-[#131B2E] border-[#1368AA] shadow-xs ring-1 ring-[#1368AA]/30"
                      : "bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/80 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800"
                  }`}
                >
                  {/* Izquierda: Indicador de Arrastre Grip + LED Diode y Nombre */}
                  <div className="flex items-center gap-1.5 min-w-0 flex-1 mr-1">
                    {/* Handle visual ergonómico de arrastre */}
                    <div 
                      title="Arrastrar con clic sostenido para reordenar por tamaño o prioridad"
                      className="cursor-grab active:cursor-grabbing text-slate-300 dark:text-slate-600 group-hover:text-slate-500 dark:group-hover:text-slate-400 p-0.5 -ml-0.5 shrink-0 transition-colors"
                    >
                      <GripVertical className="w-3 h-3" />
                    </div>

                    {/* LED Diode con Reflejo Especular Poser 3D */}
                    <div
                      title={isActiva ? "Diseño activo (Encendido)" : "Diseño inactivo (Apagado)"}
                      className={`relative w-3.5 h-3.5 rounded-full shrink-0 transition-all ${
                        isActiva
                          ? "bg-gradient-to-br from-[#38bdf8] via-[#1368AA] to-[#0d4d80] border border-sky-300 dark:border-sky-400 shadow-sm shadow-[#1368AA]/60 ring-1 ring-[#1368AA]/50 after:content-[''] after:absolute after:top-[1.5px] after:left-[2px] after:w-[3.5px] after:h-[3.5px] after:bg-white after:rounded-full after:opacity-95"
                          : "bg-slate-300 dark:bg-slate-700 border border-slate-400 dark:border-slate-600 shadow-inner after:content-[''] after:absolute after:top-[1.5px] after:left-[2px] after:w-[3px] after:h-[3px] after:bg-white after:rounded-full after:opacity-40"
                      }`}
                    />

                    {/* Nombre Editable / Texto */}
                    {isEditing ? (
                      <div className="flex items-center gap-1 flex-1" onClick={(e) => e.stopPropagation()}>
                        <input
                          ref={inputRef}
                          type="text"
                          value={editNombre}
                          onChange={(e) => setEditNombre(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleGuardarNombre(pose.id);
                            if (e.key === "Escape") setEditingId(null);
                          }}
                          onBlur={() => handleGuardarNombre(pose.id)}
                          className="w-full text-[10.5px] font-bold bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 px-2 py-0.5 rounded-full border border-[#1368AA] outline-none shadow-2xs"
                        />
                        <button
                          type="button"
                          onClick={() => handleGuardarNombre(pose.id)}
                          className="w-4 h-4 rounded-full flex items-center justify-center bg-[#1368AA] text-white hover:bg-[#0f548a] shrink-0 cursor-pointer"
                        >
                          <Check className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-baseline gap-1.5 truncate">
                        <span
                          onDoubleClick={(e) => handleIniciarEdicion(pose, e)}
                          title="Doble clic para renombrar"
                          className={`text-[10.5px] lg:text-[11px] font-bold truncate ${
                            isActiva ? "text-[#1368AA] dark:text-sky-400" : "text-slate-700 dark:text-slate-200"
                          }`}
                        >
                          {pose.nombre}
                        </span>

                        {resumen && (
                          <span className="text-[9px] font-mono text-slate-400 dark:text-slate-500 shrink-0">
                            {resumen}
                          </span>
                        )}

                        {pose.resultado && pose.resultado.real_meshes && pose.resultado.real_meshes.length > 0 ? (
                          <span title="Geometría 3D almacenada en memoria (conmutación instantánea < 10ms sin recalcular)" className="text-[8px] font-mono font-bold px-1 py-0.2 rounded-full bg-sky-100/80 dark:bg-sky-950/60 text-[#1368AA] dark:text-sky-400 border border-sky-200 dark:border-sky-800 shrink-0">
                            3D ✓
                          </span>
                        ) : (
                          <span title="Diseño antiguo sin malla 3D. Pulsa el botón ↻ para guardar la geometría actual." className="text-[8px] font-mono font-bold px-1 py-0.2 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800 shrink-0">
                            sin 3D
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Derecha: Acciones (Actualizar / Guardar Cambios, Renombrar y Eliminar) */}
                  {!isEditing && (
                    <div className="flex items-center gap-0.5 shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
                      {((actualizadoId === pose.id) || (isActiva && poseDifiereDeEscena(pose)) || (!pose.resultado || !pose.resultado.real_meshes || pose.resultado.real_meshes.length === 0)) && (
                        <button
                          type="button"
                          onClick={(e) => handleActualizarDiseno(pose.id, e)}
                          title={
                            actualizadoId === pose.id
                              ? "¡Diseño actualizado exitosamente con la geometría 3D actual!"
                              : "Actualizar diseño: Guarda las nuevas medidas y geometría física actual sobre este diseño"
                          }
                          className={`w-4 h-4 rounded-full flex items-center justify-center transition cursor-pointer ${
                            actualizadoId === pose.id
                              ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400"
                              : "text-slate-400 hover:text-[#1368AA] dark:hover:text-sky-400 hover:bg-sky-100/70 dark:hover:bg-[#1368AA]/30"
                          }`}
                        >
                          {actualizadoId === pose.id ? (
                            <Check className="w-2.5 h-2.5 text-emerald-500 animate-in zoom-in" />
                          ) : (
                            <RotateCw className="w-2.5 h-2.5" />
                          )}
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={(e) => handleIniciarEdicion(pose, e)}
                        title="Renombrar diseño"
                        className="w-4 h-4 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-700 transition cursor-pointer"
                      >
                        <Edit2 className="w-2.5 h-2.5" />
                      </button>

                      <button
                        type="button"
                        onClick={(e) => handleEliminarPose(pose.id, e)}
                        title="Eliminar diseño"
                        className="w-4 h-4 rounded-full flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )
      )}
    </div>
  );
}
