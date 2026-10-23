import {
  generarNombreSecuencial,
  MAPA_PARAMETROS,
} from "../storeDefaults";
import type {
  ObjetoInstancia3BF,
  DisenoEncapsulado3BF,
  PerforacionCruzadaItem,
  PiezaDespiece,
  HerrajeItem,
} from "../storeTypes";
import { extraerPiezaMadre } from "../piezaMadreUtils";
import { isHardwareMeshName } from "../engine/cadStateUtils";

export interface SceneInstanceSlice {
  instancias: Record<string, ObjetoInstancia3BF>;
  objetoActivoId: string | null;
  mecanizadosCruzados: Record<string, PerforacionCruzadaItem[]>;
  mecanizadoEnProgreso: boolean;
  ultimoResumenMecanizado: string[];

  agregarInstanciaGHX: (item: any, posicionInicial?: [number, number, number]) => Promise<void>;
  guardarDisenoInstancia: (instanciaId: string, diseno: DisenoEncapsulado3BF) => void;
  reordenarDisenosInstancia: (instanciaId: string, disenosReordenados: DisenoEncapsulado3BF[]) => void;
  sincronizarColeccionDisenos: (disenos: DisenoEncapsulado3BF[], instanciaId?: string) => void;
  activarDisenoInstancia: (instanciaId: string, disenoInput: string | DisenoEncapsulado3BF) => void;
  eliminarDisenoInstancia: (instanciaId: string, disenoId: string) => void;
  actualizarInstancia: (id: string, updates: Partial<ObjetoInstancia3BF>) => void;
  eliminarInstancia: (id: string) => void;
  duplicarInstancia: (id: string) => void;
  ejecutarMecanizadoCruzado: () => Promise<any>;
  limpiarPerforaciones: () => void;
}

export const createSceneInstanceSlice = (set: any, get: any): any => ({
  instancias: {},
  objetoActivoId: null,

  agregarInstanciaGHX: async (item: { id: string; archivo?: string; rutaRelativa?: string; nombre?: string; ghx_content?: string }, posicionInicial?: [number, number, number]) => {
    const definitionId = item.id;
    const filename = item.rutaRelativa || item.archivo || `${item.id}.ghx`;
    const state = get();
    
    const id = `inst_${definitionId}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const nombreVisible = generarNombreSecuencial(definitionId, state.instancias);

    // Calcular posición desplazada si no se especifica
    let pos: [number, number, number] = posicionInicial || [0, 0, 0];
    if (!posicionInicial) {
      const cantExistentes = Object.keys(state.instancias).length;
      if (cantExistentes > 0) {
        // Desplazar 0.7m en X por cada instancia para no superponerlas en el origen
        pos = [cantExistentes * 0.65, 0, 0];
      }
    }

    // 1. Obtener metadata de sliders por defecto para esta definición
    let defaultParams: Record<string, any> = {
      model_id: definitionId,
      custom_filename: filename,
      ancho: 1200,
      alto: 800,
      profundidad: 400,
      espesor_madera: 15,
      material: "MDP_15mm",
      color_acabado: "#0088aa",
      incluir_puertas: true,
      tipo_herraje: "Minifix",
    };

    let parameterGroups: any[] = [];
    let sliderLimits: any = {};

    try {
      const metaRes = await fetch("/api/metadata", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model_id: definitionId, custom_filename: filename, ghx_content: item.ghx_content }),
      });
      if (metaRes.ok) {
        const meta = await metaRes.json();
        if (meta.status === "success" && meta.default_values) {
          parameterGroups = meta.parameter_groups || [];
          sliderLimits = meta.slider_limits || {};
          Object.entries(meta.default_values).forEach(([k, v]) => {
            defaultParams[k] = v;
            const cleanKey = k.replace("RH_IN:", "").toLowerCase().replace(/\s+/g, "_");
            defaultParams[cleanKey] = v;
            const legacyKey = (MAPA_PARAMETROS as any)[k];
            if (legacyKey) defaultParams[legacyKey] = v;
          });
        }
      }
    } catch (e) {
      console.warn("No se pudo obtener metadata previa:", e);
    }

    const nuevaInstancia: ObjetoInstancia3BF = {
      id,
      nombreVisible,
      definitionId,
      archivo: filename,
      ghxContent: item.ghx_content,
      parametros: defaultParams,
      resultado: {
        parameter_groups: parameterGroups,
        slider_limits: sliderLimits,
      } as any,
      cargando: true,
      posicion: pos,
      rotacion: [0, 0, 0],
      posicionPrevia: pos,
    };

    set((s: any) => ({
      instancias: { ...s.instancias, [id]: nuevaInstancia },
      objetoActivoId: id,
      objetoSeleccionado: true,
      posicionObjeto: pos,
      posicionPrevia: pos,
      parametros: defaultParams as any,
      escenarioLimpio: false,
      // 🛡️ REGLA SUPREMA: Componente virgen de biblioteca = manual 3D en 0 absoluto
      muebleActivoGuardado: null,
      manualActivoGuardado: null,
      pasosManual: [],
      pasoActivoManualId: null,
    }));
    if (typeof window !== "undefined" && window.localStorage) {
      try {
        localStorage.removeItem("3bf_ultimo_mueble_id");
        localStorage.removeItem("3bf_pasos_manual");
        localStorage.removeItem("3bf_manual_activo");
      } catch (_) {}
    }

    // 2. ⚡ NORMA OBLIGATORIA: Ejecutar cómputo fresco del GHX real en vivo (sin cachés default intermedias)
    await get().recomputarInstancia(id, true);
    get().guardarEstadoHistorial();
    return id;
  },

  eliminarInstancia: (id: string) => {
    const state = get();
    if (state.pilaHistorial.length === 0) {
      state.guardarEstadoHistorial();
    }
    const { [id]: _, ...resto } = state.instancias;
    const idsRestantes = Object.keys(resto);
    const nuevoActivoId = idsRestantes.length > 0 ? idsRestantes[0] : null;
    const nuevoActivo = nuevoActivoId ? resto[nuevoActivoId] : null;

    set({
      instancias: resto,
      objetoActivoId: nuevoActivoId,
      objetoSeleccionado: nuevoActivoId !== null,
      posicionObjeto: nuevoActivo ? nuevoActivo.posicion : [0, 0, 0],
      posicionPrevia: nuevoActivo ? nuevoActivo.posicion : [0, 0, 0],
      parametros: nuevoActivo ? (nuevoActivo.parametros as any) : state.parametros,
      resultado: nuevoActivo ? nuevoActivo.resultado : null,
    });
    get().guardarEstadoHistorial();
  },

  duplicarInstancia: async (id: string) => {
    const state = get();
    if (state.pilaHistorial.length === 0) {
      state.guardarEstadoHistorial();
    }
    const original = state.instancias[id];
    if (!original) return "";

    const nuevoId = `inst_${original.definitionId}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const nombreVisible = generarNombreSecuencial(original.definitionId, state.instancias);
    const nuevaPos: [number, number, number] = [
      original.posicion[0] + 0.3,
      original.posicion[1],
      original.posicion[2] + 0.3,
    ];

    const duplicada: ObjetoInstancia3BF = {
      ...original,
      id: nuevoId,
      nombreVisible,
      parametros: { ...original.parametros },
      posicion: nuevaPos,
      posicionPrevia: nuevaPos,
      cargando: true,
    };

    set((s: any) => ({
      instancias: { ...s.instancias, [nuevoId]: duplicada },
      objetoActivoId: nuevoId,
      objetoSeleccionado: true,
      posicionObjeto: nuevaPos,
      posicionPrevia: nuevaPos,
      parametros: duplicada.parametros as any,
    }));

    await get().recomputarInstancia(nuevoId);
    get().guardarEstadoHistorial();
    return nuevoId;
  },

  renombrarInstancia: (id: string, nuevoNombre: string) => {
    const cleanName = nuevoNombre.trim();
    if (!cleanName) return;

    set((s: any) => {
      if (id === "base_model") {
        return {
          parametros: {
            ...s.parametros,
            model_id: cleanName,
          },
        };
      }
      const inst = s.instancias[id];
      if (!inst) return s;
      return {
        instancias: {
          ...s.instancias,
          [id]: { ...inst, nombreVisible: cleanName },
        },
      };
    });
    get().guardarEstadoHistorial();
  },

  seleccionarInstancia: (id: string | null) => {
    const state = get();
    if (!id) {
      // 🛡️ BLINDAJE: En pestaña manual o durante picking, NUNCA deseleccionar la instancia activa ni dejar objetoActivoId nulo
      if (state.pestanaActiva === "manual" || state.modoPickingManual.activo) {
        return;
      }
      set({ objetoActivoId: null, objetoSeleccionado: false });
      return;
    }
    const inst = get().instancias[id];
    if (inst) {
      set({
        objetoActivoId: id,
        objetoSeleccionado: true,
        posicionObjeto: inst.posicion,
        posicionPrevia: inst.posicion,
        parametros: inst.parametros as any,
        resultado: inst.resultado,
      });
    }
  },

  setParametroInstancia: (id: string, key: string, value: any, debounceMs: number = 180) => {
    const state = get();
    const inst = state.instancias[id];
    if (!inst) return;

    const nextParams = { ...inst.parametros, [key]: value };
    const cleanKey = key.replace("RH_IN:", "").toLowerCase().replace(/\s+/g, "_");
    nextParams[cleanKey] = value;
    
    // 🛡️ REGLA CANÓNICA DE SOBERANÍA DE PIEZAS:
    // La sincronización bidireccional por nombre base se restringe ÚNICA Y EXCLUSIVAMENTE a dimensiones globales
    // estructurales (ancho, alto, profundidad, zócalo, ritmo, apertura).
    // Los parámetros individuales de cada pieza (cantos, balances, mapeados con prefijo numérico como '02.x', '03.x')
    // son 100% independientes y nunca deben clonarse ni sobreescribir las demás piezas del mueble.
    const isGlobalStructural = /ancho|alto|altura|profundidad|prof|zocalo|ritmo|apertur/i.test(key);

    if (isGlobalStructural) {
      const pureKey = key.replace(/^RH_IN:\s*/i, "").replace(/^[\d.]+[_\s]*/, "").toLowerCase().replace(/\s+/g, "_");
      if (pureKey) {
        nextParams[pureKey] = value;
      }

      const legacyKey = (MAPA_PARAMETROS as any)[key];
      if (legacyKey) nextParams[legacyKey] = value;

      // 🔄 Sincronización bidireccional EXCLUSIVA para dimensiones globales canónicas
      const normTarget = (pureKey || cleanKey).replace(/^[\d.]+[_\s]*/, "").replace(/[_\s]+/g, "_").trim();
      Object.keys(inst.parametros || {}).forEach((existingKey) => {
        const isExistingGlobal = /ancho|alto|altura|profundidad|prof|zocalo|ritmo|apertur/i.test(existingKey);
        if (isExistingGlobal) {
          const normExisting = existingKey.replace(/^RH_IN:\s*/i, "").replace(/^[\d.]+[_\s]*/, "").toLowerCase().replace(/[_\s]+/g, "_").trim();
          if (normTarget && normExisting === normTarget) {
            nextParams[existingKey] = value;
          }
        }
      });

      // 📏 Sincronización de dimensiones globales canónicas (ancho, alto, profundidad)
      const normKey = key.toLowerCase();
      if (normTarget.includes("ancho") || normKey.includes("01.0") || normKey.includes("ancho")) {
        nextParams["ancho"] = typeof value === "number" ? value : (Number(value) || value);
      }
      if (normTarget.includes("alto") || normTarget.includes("altura") || normKey.includes("01.1") || normKey.includes("alto")) {
        nextParams["alto"] = typeof value === "number" ? value : (Number(value) || value);
      }
      if (normTarget.includes("profundidad") || normTarget.includes("prof") || normKey.includes("01.2") || normKey.includes("profundidad")) {
        nextParams["profundidad"] = typeof value === "number" ? value : (Number(value) || value);
      }
    }

    // Actualización inmediata del estado local (UI a 60 FPS ultra fluida) e inicio de sincronización
    set((s: any) => {
      const updatedInst = { ...s.instancias[id], parametros: nextParams, cargando: true };
      const nuevasInstancias = {
        ...s.instancias,
        [id]: updatedInst,
      };

      // 🔗 Sincronizar en tiempo real muebleActivoGuardado y la receta de color activa para evitar pérdidas al guardar o reabrir
      let nuevoMuebleActivo = s.muebleActivoGuardado;
      let nuevasFichas = s.fichasProducto;
      if (nuevoMuebleActivo) {
        let fichaSync = nuevoMuebleActivo.fichaProducto;
        if (fichaSync && Array.isArray(fichaSync.recetasColor) && fichaSync.recetasColor.length > 0) {
          const activeRecetaId = fichaSync.recetaColorActivaId || fichaSync.recetasColor[0].id;
          fichaSync = {
            ...fichaSync,
            recetasColor: fichaSync.recetasColor.map((r: any) =>
              r.id === activeRecetaId ? { ...r, parametros: { ...nextParams } } : r
            ),
          };
          const cleanName = nuevoMuebleActivo.nombre?.trim();
          if (cleanName || nuevoMuebleActivo.id) {
            nuevasFichas = {
              ...s.fichasProducto,
              ...(cleanName ? { [cleanName]: fichaSync } : {}),
              ...(nuevoMuebleActivo.id ? { [nuevoMuebleActivo.id]: fichaSync } : {}),
            };
          }
        }
        nuevoMuebleActivo = {
          ...nuevoMuebleActivo,
          instancias: nuevasInstancias,
          ...(fichaSync ? { fichaProducto: fichaSync } : {}),
        };
      }

      return {
        instancias: nuevasInstancias,
        muebleActivoGuardado: nuevoMuebleActivo,
        fichasProducto: nuevasFichas,
        parametros: s.objetoActivoId === id ? (nextParams as any) : s.parametros,
        cargando: true,
      };
    });

    // 🛡️ BLINDAJE ESTRICTO: Solo si estamos en pestaña Manual 3D Y con Picking activo se suspende el cómputo automático
    if (state.pestanaActiva === "manual" && state.modoPickingManual?.activo) {
      set((s: any) => ({
        instancias: {
          ...s.instancias,
          [id]: { ...s.instancias[id], cargando: false },
        },
        cargando: false,
      }));
      return;
    }

    // Debounce inteligente para cálculos pesados en RhinoCompute
    if ((globalThis as any).__3bf_debounce_timers?.[id]) {
      clearTimeout((globalThis as any).__3bf_debounce_timers[id]);
      delete (globalThis as any).__3bf_debounce_timers[id];
    }

    if (!(globalThis as any).__3bf_debounce_timers) {
      (globalThis as any).__3bf_debounce_timers = {};
    }

    if (debounceMs <= 0) {
      get().recomputarInstancia(id);
    } else {
      (globalThis as any).__3bf_debounce_timers[id] = setTimeout(() => {
        delete (globalThis as any).__3bf_debounce_timers[id];
        get().recomputarInstancia(id);
      }, debounceMs);
    }
  },

  setPosicionInstancia: (id: string, pos: [number, number, number]) => {
    const state = get();
    if (state.pilaHistorial.length === 0) {
      state.guardarEstadoHistorial();
    }
    set((s: any) => {
      const inst = s.instancias[id];
      if (!inst) return s;
      return {
        instancias: {
          ...s.instancias,
          [id]: { ...inst, posicion: pos },
        },
        posicionObjeto: s.objetoActivoId === id ? pos : s.posicionObjeto,
      };
    });
    get().guardarEstadoHistorial();
  },

  recomputarInstancia: async (id: string, forceReload: boolean = false) => {
    const state = get();
    // 🛡️ BLINDAJE ESTRICTO: Prohibido recomputar automáticamente solo si está en Manual 3D con Picking activo (a menos que sea forzado por el usuario)
    if (!forceReload && state.pestanaActiva === "manual" && state.modoPickingManual?.activo) {
      console.warn(`[3BF Shield] 🛡️ Recomputo automático bloqueado para ${id}: En modo Manual 3D con Picking activo.`);
      set((s: any) => ({
        instancias: {
          ...s.instancias,
          [id]: { ...s.instancias[id], cargando: false },
        },
        cargando: false,
      }));
      return;
    }
    const inst = state.instancias[id];
    if (!inst) return;

    // Cancelar cualquier petición anterior en vuelo para evitar saltos o respuestas desordenadas
    if (!(globalThis as any).__3bf_abort_controllers) {
      (globalThis as any).__3bf_abort_controllers = {};
    }
    if ((globalThis as any).__3bf_abort_controllers[id]) {
      try {
        (globalThis as any).__3bf_abort_controllers[id].abort();
      } catch (_) {}
      delete (globalThis as any).__3bf_abort_controllers[id];
    }

    const controller = new AbortController();
    (globalThis as any).__3bf_abort_controllers[id] = controller;

    // Generar un número de secuencia atómico para descartar respuestas tardías
    (globalThis as any).__3bf_compute_seq = ((globalThis as any).__3bf_compute_seq || 0) + 1;
    const currentSeq = (globalThis as any).__3bf_compute_seq;

    set((s: any) => ({
      instancias: {
        ...s.instancias,
        [id]: { ...s.instancias[id], cargando: true },
      },
      cargando: true,
    }));

    console.log(`[3BF Engine] 🚀 Despachando cómputo para instancia '${id}' (seq: ${currentSeq})`, {
      ancho: inst.parametros?.ancho,
      alto: inst.parametros?.alto,
      profundidad: inst.parametros?.profundidad,
      custom_filename: inst.archivo,
    });

    if (forceReload) {
      console.log(`[3BF Engine] 🔄 FORZANDO RECARGA DESDE GHX EN DISCO (Bypass total de caché) para '${id}'`);
    }

    try {
      const computeRes = await fetch("/api/compute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          ...inst.parametros,
          model_id: inst.definitionId,
          custom_filename: inst.archivo,
          ghx_content: forceReload ? undefined : inst.ghxContent,
          force_reload: Boolean(forceReload),
          timestamp: Date.now(),
        }),
      });

      const data = await computeRes.json();

      // 🛡️ VERIFICACIÓN ESTRICTA DE SECUENCIA: Si el usuario activó un diseño u otra petición mientras calculaba, DESCARTAR
      if ((globalThis as any).__3bf_compute_seq !== currentSeq) {
        console.warn(`[3BF Engine] 🛡️ Respuesta de cómputo tardía descartada para '${id}': seq ${currentSeq} vs activa ${(globalThis as any).__3bf_compute_seq}`);
        return;
      }

      if (computeRes.ok && data.status === "success" && data.real_meshes && data.real_meshes.length > 0) {
        console.log(`[3BF Engine] ✅ Cómputo exitoso para '${id}': ${data.real_meshes.length} mallas 3D recibidas.`);
        set((s: any) => {
          const currentInst = s.instancias[id];
          if (!currentInst) return s;
          const updatedInst = {
            ...currentInst,
            resultado: data,
            cargando: false,
          };
          const nuevasInstancias = { ...s.instancias, [id]: updatedInst };
          let nuevoMueble = s.muebleActivoGuardado;
          if (nuevoMueble) {
            nuevoMueble = {
              ...nuevoMueble,
              instancias: nuevasInstancias,
            };
          }
          return {
            instancias: nuevasInstancias,
            muebleActivoGuardado: nuevoMueble,
            resultado: s.objetoActivoId === id ? data : s.resultado,
            workerStatus: "online",
            cargando: false,
          };
        });
      } else {
        console.warn(`[3BF Engine] ⚠️ Respuesta de cómputo sin mallas o fallida para '${id}':`, data);
        set((s: any) => ({
          workerStatus: "offline",
          cargando: false,
          instancias: {
            ...s.instancias,
            [id]: { ...s.instancias[id], cargando: false },
          },
        }));
      }
    } catch (err: any) {
      if (err?.name === "AbortError") {
        // Petición cancelada limpiamente por un valor de slider más reciente
        return;
      }
      console.error("Error en cómputo de instancia:", id, err);
      set((s: any) => ({
        workerStatus: "offline",
        cargando: false,
        instancias: {
          ...s.instancias,
          [id]: { ...s.instancias[id], cargando: false },
        },
      }));
    } finally {
      if ((globalThis as any).__3bf_abort_controllers?.[id] === controller) {
        delete (globalThis as any).__3bf_abort_controllers[id];
      }
      const currentInsts = get().instancias || {};
      const algunaCargando = Object.values(currentInsts).some((i: any) => i.cargando);
      if (!algunaCargando) {
        set({ cargando: false });
      }
    }
  },

  recargarDefinicionInstancia: async (id: string, force: boolean = false) => {
    const state = get();
    // 🛡️ BLINDAJE ESTRICTO: Prohibido hot-reload automático en Manual 3D o con Picking activo (a menos que el usuario lo fuerce explícitamente con el botón)
    if (!force && (state.pestanaActiva === "manual" || state.modoPickingManual.activo)) {
      console.warn(`[3BF Shield] 🛡️ Recarga automática omitida para ${id}: En modo Manual 3D o Picking activo.`);
      return false;
    }
    const inst = state.instancias[id];
    if (!inst) return false;

    // 1. Activar estado de carga en la instancia y limpiar ghxContent cacheado si es forzado
    set((s: any) => ({
      instancias: {
        ...s.instancias,
        [id]: {
          ...s.instancias[id],
          cargando: true,
          ghxContent: force ? undefined : s.instancias[id]?.ghxContent,
        },
      },
      cargando: true,
    }));

    try {
      if (force) {
        inst.ghxContent = undefined as any;
      }

      // 2. Re-leer metadata fresca desde el archivo GHX en disco
      const metaRes = await fetch("/api/metadata", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model_id: inst.definitionId,
          custom_filename: inst.archivo,
          ghx_content: force ? undefined : inst.ghxContent,
          force_reload: force,
        }),
      });

      let updatedParams = { ...inst.parametros };
      let parameterGroups = inst.resultado?.parameter_groups || [];
      let sliderLimits = inst.resultado?.slider_limits || {};

      if (metaRes.ok) {
        const meta = await metaRes.json();
        if (meta.status === "success" && meta.default_values) {
          parameterGroups = meta.parameter_groups || [];
          sliderLimits = meta.slider_limits || {};

          // Conservar valores que el usuario ya modificó, y agregar ÚNICAMENTE los nuevos parámetros que no existían
          Object.entries(meta.default_values).forEach(([k, v]) => {
            const cleanKey = k.replace("RH_IN:", "").toLowerCase().replace(/\s+/g, "_");
            const isGlobalStructural = /ancho|alto|altura|profundidad|prof|zocalo|ritmo|apertur/i.test(k);
            const pureKey = isGlobalStructural
              ? k.replace(/^RH_IN:\s*/i, "").replace(/^[\d.]+[_\s]*/, "").toLowerCase().replace(/\s+/g, "_")
              : "";
            const legacyKey = isGlobalStructural ? (MAPA_PARAMETROS as any)[k] : undefined;

            const yaExiste = (k in updatedParams) || 
                             (cleanKey in updatedParams) || 
                             (pureKey && pureKey in updatedParams) || 
                             (legacyKey && legacyKey in updatedParams);

            if (!yaExiste) {
              updatedParams[k] = v;
              updatedParams[cleanKey] = v;
              if (pureKey) updatedParams[pureKey] = v;
              if (legacyKey) updatedParams[legacyKey] = v;
            }
          });
        }
      }

      // Actualizar instancia con nueva metadata antes de computar
      set((s: any) => ({
        instancias: {
          ...s.instancias,
          [id]: {
            ...s.instancias[id],
            ghxContent: force ? undefined : s.instancias[id]?.ghxContent,
            parametros: updatedParams,
            resultado: {
              ...(s.instancias[id].resultado || {}),
              parameter_groups: parameterGroups,
              slider_limits: sliderLimits,
            } as any,
          },
        },
        parametros: s.objetoActivoId === id ? (updatedParams as any) : s.parametros,
      }));

      // 3. Recomputar geometría 3D con Grasshopper / RhinoCompute (forzando bypass de caché en RAM si force=true)
      await get().recomputarInstancia(id, force);
      get().guardarEstadoHistorial();
      return true;
    } catch (err) {
      console.error("Error al recargar definición GHX de instancia:", id, err);
      set((s: any) => ({
        instancias: {
          ...s.instancias,
          [id]: { ...s.instancias[id], cargando: false },
        },
      }));
      return false;
    }
  },

  forzarRecargaDesdeGHX: async (id?: string) => {
    const s = get();
    const targetId = id || s.objetoActivoId || Object.keys(s.instancias || {})[0];
    if (!targetId) return false;
    const ok = await s.recargarDefinicionInstancia(targetId, true);
    if (ok) {
      if (typeof window !== "undefined") {
        (window as any).__3bf_last_ghx_reload_time = Date.now();
        window.dispatchEvent(new CustomEvent("3bf-ghx-reloaded", { detail: { targetId, timestamp: Date.now() } }));
      }
      // 🔗 Cerrar el círculo: Persistir de inmediato la geometría fresca del GHX en el .3bf y .3bm
      const freshState = get();
      if (freshState.muebleActivoGuardado) {
        await freshState.guardarCambiosMueble();
      } else {
        await freshState.guardarManualProyecto();
      }
    }
    return ok;
  },

  recomputarTodas: async () => {
    const state = get();
    // 🛡️ BLINDAJE ESTRICTO: Prohibido recomputo masivo en Manual 3D o con Picking activo
    if (state.pestanaActiva === "manual" || state.modoPickingManual.activo) {
      console.warn("[3BF Shield] 🛡️ Recomputo masivo bloqueado: En modo Manual 3D o Picking activo.");
      return;
    }
    const ids = Object.keys(state.instancias);
    await Promise.all(ids.map((id) => get().recomputarInstancia(id)));
  },

  cargarCacheDesdeArchivo: async (archivoOrData: File | string | Record<string, any>, id?: string) => {
    const s = get();
    const targetId = id || s.objetoActivoId || Object.keys(s.instancias || {})[0];
    if (!targetId) {
      console.warn("[3BF Cache] No hay instancia activa para cargar el caché.");
      return false;
    }

    try {
      let parsedData: any = null;
      if (typeof archivoOrData === "object" && !(archivoOrData instanceof File)) {
        parsedData = archivoOrData;
      } else if (typeof archivoOrData === "string") {
        parsedData = JSON.parse(archivoOrData);
      } else if (archivoOrData instanceof File) {
        const text = await archivoOrData.text();
        parsedData = JSON.parse(text);
      }

      if (!parsedData || (parsedData.status !== "success" && !parsedData.real_meshes)) {
        console.error("[3BF Cache] Estructura de archivo de caché inválida:", parsedData);
        return false;
      }

      // Normalizar estructura si viene anidada en 'data'
      const data = parsedData.data ? parsedData.data : parsedData;

      set((state: any) => {
        const currentInst = state.instancias[targetId];
        if (!currentInst) return state;
        const updatedInst = {
          ...currentInst,
          resultado: data,
          cargando: false,
        };
        const nuevasInstancias = { ...state.instancias, [targetId]: updatedInst };
        let nuevoMueble = state.muebleActivoGuardado;
        if (nuevoMueble) {
          nuevoMueble = { ...nuevoMueble, instancias: nuevasInstancias };
        }
        return {
          instancias: nuevasInstancias,
          muebleActivoGuardado: nuevoMueble,
          resultado: state.objetoActivoId === targetId ? data : state.resultado,
          workerStatus: "online",
        };
      });

      console.log(`[3BF Cache] Caché inyectado instantáneamente en la instancia '${targetId}' (${data.real_meshes?.length || 0} mallas)`);
      s.guardarEstadoHistorial();
      return true;
    } catch (err) {
      console.error("[3BF Cache] Error al cargar caché desde archivo:", err);
      return false;
    }
  },

  exportarCacheAArchivo: (id?: string) => {
    const s = get();
    const targetId = id || s.objetoActivoId || Object.keys(s.instancias || {})[0];
    const inst = targetId ? s.instancias[targetId] : null;
    const res = inst?.resultado || s.resultado;

    if (!res) {
      alert("No hay geometría activa calculada para exportar en caché.");
      return;
    }

    try {
      const jsonStr = JSON.stringify(res, null, 2);
      const blob = new Blob([jsonStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const modelName = (inst?.nombreVisible || inst?.definitionId || "modelo_3bf").toLowerCase().replace(/\s+/g, "_");
      const dims = res.dimensions || "";
      const dimsClean = dims ? `_${dims.replace(/\s+/g, "").replace(/x/g, "_")}` : "";
      link.href = url;
      link.download = `${modelName}${dimsClean}_cache.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("[3BF Cache] Error al exportar archivo de caché:", err);
    }
  },

  getDespieceGlobal: () => {
    const state = get();
    const list: Array<PiezaDespiece & { instanciaNombre: string; instanciaId: string; descripcion: string }> = [];
    const CALIBRES_COMERCIALES = [3, 4, 6, 9, 12, 15, 18, 25, 30, 36];
    const snapCalibre = (v: number) => {
      for (const c of CALIBRES_COMERCIALES) {
        if (Math.abs(v - c) <= 1.6) return c;
      }
      return Math.round(v * 10) / 10;
    };

    Object.values(state.instancias).forEach((inst: any) => {
      // Blindaje de recuperación: Si el nombre del mueble fue accidentalmente corrompido con el nombre de una pieza, restaurarlo
      if (inst.nombreVisible && /lateral ezquiers/i.test(inst.nombreVisible)) {
        inst.nombreVisible = inst.definitionId || "Cómoda Ravenna";
      }

      const rawDespiece: any[] = inst.resultado?.despiece || [];
      const realMeshes: any[] = inst.resultado?.real_meshes || [];

      // Detectar si el despiece en memoria proviene de una versión previa fragmentada (nombres duplicados, cantos <= 16.5mm o espesores decimales 13.1/12.4)
      const nombresVistos = new Set<string>();
      let requiereSaneamiento = false;
      for (const p of rawDespiece) {
        const nom = (extraerPiezaMadre(p.nombre) || p.nombre || "").trim().toLowerCase();
        if (nombresVistos.has(nom)) requiereSaneamiento = true;
        nombresVistos.add(nom);
        if (Number(p.ancho) <= 16.5 || !Number.isInteger(Number(p.espesor))) {
          requiereSaneamiento = true;
        }
        if (/fondo|fundo|costa|espaldar|traser/i.test(nom) && Number(p.espesor) >= 9) {
          requiereSaneamiento = true;
        }
        if (nom === "tapaluz" && Number(p.cantidad) === 1 && realMeshes.length > 0) {
          requiereSaneamiento = true;
        }
      }

      let despieceEfectivo = rawDespiece;

      if (requiereSaneamiento && realMeshes.length > 0) {
        const familias = new Map<string, {
          nombreDisplay: string;
          carasA: Array<[number, number]>;
          carasB: Array<[number, number]>;
          calibresCanto: number[];
        }>();

        realMeshes.forEach((m: any) => {
          if (!m || m.es_duplicado_ghx) return;
          const rawName = String(m.name || "").replace(/^RH_OUT:\s*/i, "").trim();
          if (!rawName || isHardwareMeshName(rawName) || /maquinado|perforad|cavilha|tarugo|parafuso|tornillo|minifix|corredi|cantoneira|prego|sapata|pata|pés|pes|puxador|tampa|herraje/i.test(rawName)) {
            return;
          }
          const isMdp = /^(mdp|mdf)\s+/i.test(rawName);
          const isCaraB = !isMdp && (/\s+b$/i.test(rawName) || /^balance\s+/i.test(rawName));
          let clean = rawName
            .replace(/^(mdp|mdf|color|balance|nurbs|brep)\s+/i, "")
            .replace(/[\s_]+b$/i, "")
            .trim();
          if (!clean) return;
          const nombreMadre = extraerPiezaMadre(clean) || (clean.charAt(0).toUpperCase() + clean.slice(1).toLowerCase());
          const key = nombreMadre.toLowerCase();

          const sz = Array.isArray(m.size) && m.size.length === 3 ? m.size : [0, 0, 0];
          const dims = [Math.abs(Number(sz[0]) || 0) * 1000, Math.abs(Number(sz[1]) || 0) * 1000, Math.abs(Number(sz[2]) || 0) * 1000].sort((a, b) => a - b);
          const [dMin, dMid, dMax] = dims;
          if (dMax < 35) return; // descartar cilindros de perforación

          if (!familias.has(key)) {
            familias.set(key, { nombreDisplay: nombreMadre, carasA: [], carasB: [], calibresCanto: [] });
          }
          const fam = familias.get(key)!;

          // Tira de canto / espesor lateral (ej. 865 x 12 x 0, 221 x 15 x 0 o 581 x 3 x 0 en MDF)
          const minCalibreCanto = (isMdp || /fondo|fundo|costa|espaldar|traser/i.test(key)) ? 2.0 : 8.0;
          if (isMdp) {
            for (const d of [dMin, dMid]) {
              if (d >= minCalibreCanto && d <= 36.0) {
                fam.calibresCanto.push(snapCalibre(d));
                break;
              }
            }
          } else if (dMid >= minCalibreCanto && dMid <= 16.5 && dMin < 2.5) {
            fam.calibresCanto.push(snapCalibre(dMid));
          } else if (!isMdp && dMid > 16.5) {
            if (isCaraB) {
              fam.carasB.push([dMax, dMid]);
            } else {
              fam.carasA.push([dMax, dMid]);
            }
          }
        });

        const reconstruido: any[] = [];
        familias.forEach((fam) => {
          const todasCaras = [...fam.carasA, ...fam.carasB];
          if (todasCaras.length === 0) return;
          const maxLargo = Math.round(Math.max(...todasCaras.map((c) => c[0])) * 10) / 10;
          const maxAncho = Math.round(Math.max(...todasCaras.map((c) => c[1])) * 10) / 10;
          const countFullA = fam.carasA.filter(([l, a]) => Math.abs(l - maxLargo) <= Math.max(2, maxLargo * 0.03) && Math.abs(a - maxAncho) <= Math.max(2, maxAncho * 0.05)).length;
          const countFullB = fam.carasB.filter(([l, a]) => Math.abs(l - maxLargo) <= Math.max(2, maxLargo * 0.03) && Math.abs(a - maxAncho) <= Math.max(2, maxAncho * 0.05)).length;
          const cantidad = Math.max(1, countFullA, countFullB);
          const fallbackEspesor = /fondo|fundo|costa|espaldar|traser/i.test(fam.nombreDisplay)
            ? 3
            : /cajon|cajón|posterior|gaveta/i.test(fam.nombreDisplay)
              ? 12
              : 15;
          const espesor = fam.calibresCanto.length > 0 ? fam.calibresCanto[0] : fallbackEspesor;
          const prev = rawDespiece.find((r: any) => (extraerPiezaMadre(r.nombre) || r.nombre || "").trim().toLowerCase() === fam.nombreDisplay.toLowerCase()) || {};

          reconstruido.push({
            ...prev,
            nombre: fam.nombreDisplay,
            descripcion: prev.descripcion && prev.descripcion !== prev.nombre ? prev.descripcion : fam.nombreDisplay,
            largo: maxLargo,
            ancho: maxAncho,
            espesor,
            cantidad,
            area_m2: Math.round(((maxLargo * maxAncho) / 1_000_000) * cantidad * 1000) / 1000,
          });
        });

        if (reconstruido.length > 0) {
          despieceEfectivo = reconstruido;
          inst.resultado.despiece = reconstruido;
        }
      }

      if (despieceEfectivo) {
        despieceEfectivo.forEach((p: any) => {
          const nombreNormalizado = extraerPiezaMadre(p.nombre) || p.nombre;
          const nomLower = String(nombreNormalizado || "").toLowerCase();
          if (isHardwareMeshName(nomLower) || /maquinado|perforad|cavilha|tarugo|parafuso|tornillo|minifix|corredi|cantoneira|prego|sapata|pata|pés|pes|puxador|tampa|herraje/i.test(nomLower)) {
            return;
          }
          list.push({
            ...p,
            nombre: nombreNormalizado,
            descripcion: p.descripcion && p.descripcion !== p.nombre ? p.descripcion : nombreNormalizado,
            instanciaNombre: inst.nombreVisible || inst.definitionId || "Mueble",
            instanciaId: inst.id,
          });
        });
      }
    });
    return list.sort((a, b) =>
      (a.nombre || "").localeCompare(b.nombre || "", undefined, { numeric: true, sensitivity: "base" })
    );
  },

  getHerrajesGlobal: () => {
    const state = get();
    const list: Array<HerrajeItem & { instanciaNombre: string; instanciaId: string }> = [];
    Object.values(state.instancias).forEach((inst: any) => {
      if (inst.resultado?.herrajes) {
        inst.resultado.herrajes.forEach((h: any) => {
          list.push({
            ...h,
            instanciaNombre: inst.nombreVisible,
            instanciaId: inst.id,
          });
        });
      }
    });
    return list;
  },

  // ⚡ Mecanizados y Perforaciones Inter-Componentes DfMA
  mecanizadosCruzados: {},
  mecanizadoEnProgreso: false,
  ultimoResumenMecanizado: [],

  perforarMueble: async () => {
    const state = get();
    set({ mecanizadoEnProgreso: true });
    try {
      const instanciasList = Object.values(state.instancias).map((inst: any) => ({
        id: inst.id,
        nombreVisible: inst.nombreVisible,
        posicion: inst.posicion,
        resultado: inst.resultado,
      }));

      // Si no hay multi-instancias pero hay un modelo base activo
      if (instanciasList.length === 0 && state.resultado) {
        instanciasList.push({
          id: "base_model",
          nombreVisible: state.parametros.model_id || "Cubierta",
          posicion: [0, 0, 0],
          resultado: state.resultado,
        });
      }

      const res = await fetch("/api/compute/mecanizar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ instancias: instanciasList }),
      });

      const data = await res.json();
      if (data.status === "success" || data.status === "warning") {
        set({
          mecanizadosCruzados: data.mecanizados_cruzados || {},
          ultimoResumenMecanizado: data.resumen || [],
          mecanizadoEnProgreso: false,
        });
        return {
          status: data.status,
          total_perforaciones: data.total_perforaciones || 0,
          resumen: data.resumen || [],
        };
      }
      set({ mecanizadoEnProgreso: false });
      return { status: "error", total_perforaciones: 0, resumen: ["Error al procesar mecanizado."] };
    } catch (e: any) {
      set({ mecanizadoEnProgreso: false });
      return { status: "error", total_perforaciones: 0, resumen: [e?.message || "Error de red"] };
    }
  },

  limpiarPerforaciones: () => {
    set({
      mecanizadosCruzados: {},
      ultimoResumenMecanizado: ["✓ Perforaciones inter-componentes eliminadas."],
    });
  },

  guardarDisenoInstancia: (instanciaId: string, diseno: DisenoEncapsulado3BF) => {
    const state = get();
    const inst = state.instancias[instanciaId];
    if (!inst) return;

    const disenosActuales = inst.disenos || [];
    const indexExistente = disenosActuales.findIndex((d: DisenoEncapsulado3BF) => d.id === diseno.id);
    let nuevosDisenos: DisenoEncapsulado3BF[];

    if (indexExistente >= 0) {
      nuevosDisenos = disenosActuales.map((d: DisenoEncapsulado3BF, i: number) => (i === indexExistente ? diseno : d));
    } else {
      nuevosDisenos = [...disenosActuales, diseno];
    }

    const instActualizada = {
      ...inst,
      disenos: nuevosDisenos,
      disenoActivoId: diseno.id,
    };

    const nuevasInstancias = {
      ...state.instancias,
      [instanciaId]: instActualizada,
    };

    let nuevoMuebleActivo = state.muebleActivoGuardado;
    if (nuevoMuebleActivo) {
      nuevoMuebleActivo = {
        ...nuevoMuebleActivo,
        instancias: nuevasInstancias,
        disenos: nuevosDisenos,
        disenoActivoId: diseno.id,
      };
    }

    set({
      instancias: nuevasInstancias,
      muebleActivoGuardado: nuevoMuebleActivo,
    });
    get().guardarEstadoHistorial();
  },

  reordenarDisenosInstancia: (instanciaId: string, disenosReordenados: DisenoEncapsulado3BF[]) => {
    const state = get();
    const inst = state.instancias[instanciaId];
    if (!inst) return;

    const instActualizada = {
      ...inst,
      disenos: disenosReordenados,
    };

    const nuevasInstancias = {
      ...state.instancias,
      [instanciaId]: instActualizada,
    };

    let nuevoMuebleActivo = state.muebleActivoGuardado;
    if (nuevoMuebleActivo) {
      nuevoMuebleActivo = {
        ...nuevoMuebleActivo,
        instancias: nuevasInstancias,
        disenos: disenosReordenados,
      };
    }

    set({
      instancias: nuevasInstancias,
      muebleActivoGuardado: nuevoMuebleActivo,
    });
    get().guardarEstadoHistorial();
  },

  sincronizarColeccionDisenos: (disenos: DisenoEncapsulado3BF[], instanciaId?: string) => {
    const state = get();
    const targetId = instanciaId || state.objetoActivoId || Object.keys(state.instancias || {})[0];

    const nuevasInstancias: Record<string, ObjetoInstancia3BF> = {};
    for (const [k, inst] of Object.entries(state.instancias || {})) {
      nuevasInstancias[k] = {
        ...(inst as ObjetoInstancia3BF),
        disenos: (!targetId || k === targetId || !(inst as any).disenos || (inst as any).disenos.length === 0)
          ? disenos
          : (inst as any).disenos,
      };
    }

    let nuevoMuebleActivo = state.muebleActivoGuardado;
    if (nuevoMuebleActivo) {
      nuevoMuebleActivo = {
        ...nuevoMuebleActivo,
        instancias: nuevasInstancias,
        disenos: disenos,
      };
    }

    set({
      instancias: nuevasInstancias,
      muebleActivoGuardado: nuevoMuebleActivo,
    });
  },

  activarDisenoInstancia: (instanciaId: string, disenoInput: string | DisenoEncapsulado3BF) => {
    const state = get();
    const inst = state.instancias[instanciaId];
    if (!inst) return;

    let diseno: DisenoEncapsulado3BF | undefined;
    let disenoId: string;

    if (typeof disenoInput === "string") {
      disenoId = disenoInput;
      diseno = (inst.disenos || []).find((d: DisenoEncapsulado3BF) => d.id === disenoId);
    } else {
      diseno = disenoInput;
      disenoId = diseno.id;
    }

    if (!diseno) return;

    // 🛡️ CANCELAR INMEDIATAMENTE CUALQUIER TIMER O PETICIÓN EN VUELO DE RHINOCOMPUTE
    if ((globalThis as any).__3bf_debounce_timers?.[instanciaId]) {
      clearTimeout((globalThis as any).__3bf_debounce_timers[instanciaId]);
      delete (globalThis as any).__3bf_debounce_timers[instanciaId];
    }
    if ((globalThis as any).__3bf_abort_controllers?.[instanciaId]) {
      try {
        (globalThis as any).__3bf_abort_controllers[instanciaId].abort();
      } catch (_) {}
      delete (globalThis as any).__3bf_abort_controllers[instanciaId];
    }
    // Incrementar número de secuencia para invalidar cualquier cómputo en segundo plano
    (globalThis as any).__3bf_compute_seq = ((globalThis as any).__3bf_compute_seq || 0) + 1;

    // ⚡ CONMUTACIÓN INSTANTÁNEA EN MEMORIA (< 10 ms)
    // Inyecta el resultado 3D resuelto directamente en Three.js sin llamar a RhinoCompute
    const nextParams = { ...inst.parametros, ...diseno.valores };
    Object.entries(diseno.valores || {}).forEach(([pKey, val]) => {
      const cleanKey = pKey.replace("RH_IN:", "").toLowerCase().replace(/\s+/g, "_");
      nextParams[cleanKey] = val;
      const isGlobalStructural = /ancho|alto|altura|profundidad|prof|zocalo|ritmo|apertur/i.test(pKey);
      if (isGlobalStructural) {
        const pureKey = pKey.replace(/^RH_IN:\s*/i, "").replace(/^[\d.]+[_\s]*/, "").toLowerCase().replace(/\s+/g, "_");
        if (pureKey) nextParams[pureKey] = val;
        const legacyKey = (MAPA_PARAMETROS as any)[pKey];
        if (legacyKey) nextParams[legacyKey] = val;

        const normTarget = (pureKey || cleanKey).replace(/^[\d.]+[_\s]*/, "").replace(/[_\s]+/g, "_").trim();
        const normKey = pKey.toLowerCase();
        if (normTarget.includes("ancho") || normKey.includes("01.0") || normKey.includes("ancho")) {
          nextParams["ancho"] = typeof val === "number" ? val : (Number(val) || val);
        }
        if (normTarget.includes("alto") || normTarget.includes("altura") || normKey.includes("01.1") || normKey.includes("alto")) {
          nextParams["alto"] = typeof val === "number" ? val : (Number(val) || val);
        }
        if (normTarget.includes("profundidad") || normTarget.includes("prof") || normKey.includes("01.2") || normKey.includes("profundidad")) {
          nextParams["profundidad"] = typeof val === "number" ? val : (Number(val) || val);
        }
      }
    });

    const disenosActuales = inst.disenos || [];
    const indexExistente = disenosActuales.findIndex((d: DisenoEncapsulado3BF) => d.id === diseno!.id);
    const nuevosDisenos = indexExistente >= 0
      ? disenosActuales.map((d: DisenoEncapsulado3BF, i: number) => (i === indexExistente ? diseno! : d))
      : [...disenosActuales, diseno];

    const instActualizada = {
      ...inst,
      parametros: nextParams,
      resultado: diseno.resultado || inst.resultado,
      disenos: nuevosDisenos,
      disenoActivoId: disenoId,
      cargando: false,
    };

    const nuevasInstancias = {
      ...state.instancias,
      [instanciaId]: instActualizada,
    };

    let nuevoMuebleActivo = state.muebleActivoGuardado;
    if (nuevoMuebleActivo) {
      nuevoMuebleActivo = {
        ...nuevoMuebleActivo,
        instancias: nuevasInstancias,
        disenos: nuevosDisenos,
        disenoActivoId: disenoId,
      };
    }

    set({
      instancias: nuevasInstancias,
      muebleActivoGuardado: nuevoMuebleActivo,
      objetoActivoId: instanciaId,
      parametros: state.objetoActivoId === instanciaId ? nextParams : state.parametros,
      resultado: state.objetoActivoId === instanciaId ? (diseno.resultado || inst.resultado) : state.resultado,
      cargando: false,
    });

    get().guardarEstadoHistorial();
  },

  eliminarDisenoInstancia: (instanciaId: string, disenoId: string) => {
    const state = get();
    const inst = state.instancias[instanciaId];
    if (!inst) return;

    const disenosFiltrados = (inst.disenos || []).filter((d: DisenoEncapsulado3BF) => d.id !== disenoId);
    const nuevoActivoId = inst.disenoActivoId === disenoId ? (disenosFiltrados[0]?.id || null) : inst.disenoActivoId;

    const instActualizada = {
      ...inst,
      disenos: disenosFiltrados,
      disenoActivoId: nuevoActivoId,
    };

    const nuevasInstancias = {
      ...state.instancias,
      [instanciaId]: instActualizada,
    };

    let nuevoMuebleActivo = state.muebleActivoGuardado;
    if (nuevoMuebleActivo) {
      nuevoMuebleActivo = {
        ...nuevoMuebleActivo,
        instancias: nuevasInstancias,
        disenos: disenosFiltrados,
        disenoActivoId: nuevoActivoId,
      };
    }

    set({
      instancias: nuevasInstancias,
      muebleActivoGuardado: nuevoMuebleActivo,
    });
    get().guardarEstadoHistorial();
  },

});
