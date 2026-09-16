import {
  generarNombreSecuencial,
  MAPA_PARAMETROS,
} from "../storeDefaults";
import type {
  ObjetoInstancia3BF,
  PerforacionCruzadaItem,
  PiezaDespiece,
  HerrajeItem,
} from "../storeTypes";

export interface SceneInstanceSlice {
  instancias: Record<string, ObjetoInstancia3BF>;
  objetoActivoId: string | null;
  mecanizadosCruzados: Record<string, PerforacionCruzadaItem[]>;
  mecanizadoEnProgreso: boolean;
  ultimoResumenMecanizado: string[];

  agregarInstanciaGHX: (item: any, posicionInicial?: [number, number, number]) => Promise<void>;
  seleccionarInstanciaActiva: (id: string | null) => void;
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
    }));

    // 2. Ejecutar cómputo de la nueva instancia
    await get().recomputarInstancia(id);
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
    
    const pureKey = key.replace(/^RH_IN:\s*/i, "").replace(/^[\d.]+[_\s]*/, "").toLowerCase().replace(/\s+/g, "_");
    if (pureKey) {
      nextParams[pureKey] = value;
    }

    const legacyKey = (MAPA_PARAMETROS as any)[key];
    if (legacyKey) nextParams[legacyKey] = value;

    // 🔄 Sincronización bidireccional de parámetros: asegura que si cambia "ancho_1295" se actualice "RH_IN:01.0 Ancho 1295" y viceversa
    const normTarget = (pureKey || cleanKey).replace(/^[\d.]+[_\s]*/, "").replace(/[_\s]+/g, "_").trim();
    Object.keys(inst.parametros || {}).forEach((existingKey) => {
      const normExisting = existingKey.replace(/^RH_IN:\s*/i, "").replace(/^[\d.]+[_\s]*/, "").toLowerCase().replace(/[_\s]+/g, "_").trim();
      if (normTarget && normExisting === normTarget) {
        nextParams[existingKey] = value;
      }
    });

    // 📏 Sincronización de dimensiones globales canónicas (ancho, alto, profundidad)
    if (normTarget.includes("ancho")) {
      nextParams["ancho"] = typeof value === "number" ? value : (Number(value) || value);
    }
    if (normTarget.includes("alto") || normTarget.includes("altura")) {
      nextParams["alto"] = typeof value === "number" ? value : (Number(value) || value);
    }
    if (normTarget.includes("profundidad") || normTarget.includes("prof")) {
      nextParams["profundidad"] = typeof value === "number" ? value : (Number(value) || value);
    }

    // Actualización inmediata del estado local (UI a 60 FPS ultra fluida)
    set((s: any) => ({
      instancias: {
        ...s.instancias,
        [id]: { ...s.instancias[id], parametros: nextParams },
      },
      parametros: s.objetoActivoId === id ? (nextParams as any) : s.parametros,
    }));

    // 🛡️ BLINDAJE ESTRICTO: Si el usuario está en Manual 3D o Picking activo, PROHIBIDO recomputar geometría
    if (state.pestanaActiva === "manual" || state.modoPickingManual.activo) {
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
    // 🛡️ BLINDAJE ESTRICTO: Prohibido recomputar automáticamente en modo Manual 3D o con Picking activo (a menos que sea forzado por el usuario)
    if (!forceReload && (state.pestanaActiva === "manual" || state.modoPickingManual.activo)) {
      console.warn(`[3BF Shield] 🛡️ Recomputo automático bloqueado para ${id}: En modo Manual 3D o Picking activo.`);
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

    set((s: any) => ({
      instancias: {
        ...s.instancias,
        [id]: { ...s.instancias[id], cargando: true },
      },
    }));

    try {
      const computeRes = await fetch("/api/compute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          ...inst.parametros,
          model_id: inst.definitionId,
          custom_filename: inst.archivo,
          ghx_content: inst.ghxContent,
          force_reload: forceReload,
          timestamp: Date.now(),
        }),
      });

      const data = await computeRes.json();
      if (computeRes.ok && data.status === "success" && data.real_meshes && data.real_meshes.length > 0) {
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
          };
        });
      } else {
        set((s: any) => ({
          workerStatus: "offline",
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
        instancias: {
          ...s.instancias,
          [id]: { ...s.instancias[id], cargando: false },
        },
      }));
    } finally {
      if ((globalThis as any).__3bf_abort_controllers?.[id] === controller) {
        delete (globalThis as any).__3bf_abort_controllers[id];
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

    // 1. Activar estado de carga en la instancia
    set((s: any) => ({
      instancias: {
        ...s.instancias,
        [id]: { ...s.instancias[id], cargando: true },
      },
    }));

    try {
      // 2. Re-leer metadata fresca desde el archivo GHX en disco
      const metaRes = await fetch("/api/metadata", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model_id: inst.definitionId,
          custom_filename: inst.archivo,
          ghx_content: inst.ghxContent,
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
            const pureKey = k.replace(/^RH_IN:\s*/i, "").replace(/^[\d.]+[_\s]*/, "").toLowerCase().replace(/\s+/g, "_");
            const legacyKey = (MAPA_PARAMETROS as any)[k];

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

  getDespieceGlobal: () => {
    const state = get();
    const list: Array<PiezaDespiece & { instanciaNombre: string; instanciaId: string; descripcion: string }> = [];
    Object.values(state.instancias).forEach((inst: any) => {
      if (inst.resultado?.despiece) {
        inst.resultado.despiece.forEach((p: any) => {
          list.push({
            ...p,
            descripcion: p.descripcion || inst.nombreVisible || p.nombre,
            instanciaNombre: inst.nombreVisible,
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

});
