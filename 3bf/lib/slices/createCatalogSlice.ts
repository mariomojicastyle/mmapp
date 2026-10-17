// @ts-nocheck
import {
  crearFichaEstandarLimpia,
  PRESET_MATERIALES_PBR,
  PRESET_CAPAS,
  PRESET_COLORES_CLARO,
  PRESET_COLORES_OSCURO,
  purgarResultadoGeometria,
  sanitizarMuebleParaDisco,
  guardarPasosEnCacheLocal,
  generarPasosManualesPorDefecto,
  sanitizarPasosManuales,
} from "../storeDefaults";
import { saveDisenosToIndexedDB } from "../disenosStorage";
import { saveMaterialesToIndexedDB, loadMaterialesFromIndexedDB } from "../materialesStorage";
import type {
  FichaProductoDef,
  RecetaColorMueble,
  MaterialPBRDef,
  CapaDef,
  AsignacionParteDef,
  CarpetaMuebleNode,
  MuebleGuardadoItem,
  ColoresApariencia,
  ObjetoInstancia3BF,
  Manual3BMProyecto,
} from "../storeTypes";

export interface CatalogSlice {
  fichasProducto: Record<string, FichaProductoDef>;
  getFichaProductoActivo: () => FichaProductoDef;
  actualizarFichaProductoActivo: (cambios: Partial<FichaProductoDef>) => void;
  restablecerFichaProductoActivo: () => void;
  // Recetas de color
  aplicarRecetaColorAMueble: (receta: RecetaColorMueble) => void;
  // Capas y materiales
  capas: CapaDef[];
  materialesPBR: MaterialPBRDef[];
  cargarMaterialesDesdeDB: () => Promise<void>;
  asignacionesPartes: Record<string, AsignacionParteDef>;
  materialSeleccionadoId: string | null;
  capaSeleccionadaId: string | null;
  // Apariencia
  temaApariencia: "claro" | "oscuro";
  coloresApariencia: ColoresApariencia;
  // Catálogo de muebles
  arbolCarpetasMuebles: CarpetaMuebleNode[];
  mueblesGuardados: MuebleGuardadoItem[];
  muebleActivoGuardado: MuebleGuardadoItem | null;
  carpetaSeleccionadaId: string;
  modalGuardarComoAbierto: boolean;
  guardandoMueble: boolean;
  urlGoogleDrive: string;
  // PBR Studio
  modalPBRStudioAbierto: boolean;
  materialEnCalibracion: MaterialPBRDef | null;
}

export const createCatalogSlice = (set: any, get: any): any => ({
  fichasProducto: (typeof window !== "undefined" && window.localStorage && localStorage.getItem("3bf_fichas_v2"))
    ? (() => {
        try {
          return JSON.parse(localStorage.getItem("3bf_fichas_v2")!);
        } catch {
          return {};
        }
      })()
    : {},

  getFichaProductoActivo: () => {
    const state = get();
    const rawInst = state.instancias || {};
    const targetInstId = state.objetoActivoId || Object.keys(rawInst)[0];
    const objetoActivo = targetInstId ? rawInst[targetInstId] : Object.values(rawInst)[0];
    const liveParams = { ...(objetoActivo?.parametros || state.parametros || {}) };

    const todasLasCapas: Record<string, string> = {};
    state.capas.forEach((c) => {
      todasLasCapas[c.id] = c.materialId;
    });
    const todasLasPartes: Record<string, { capaId: string; materialId: string }> = {};
    Object.entries(state.asignacionesPartes).forEach(([k, v]) => {
      todasLasPartes[k] = { capaId: v.capaId, materialId: v.materialId };
    });

    const sincronizarRecetaActivaEnFicha = (fichaBase: FichaProductoDef): FichaProductoDef => {
      if (!fichaBase || !Array.isArray(fichaBase.recetasColor) || fichaBase.recetasColor.length === 0) {
        return fichaBase;
      }
      const activeRecetaId = fichaBase.recetaColorActivaId || fichaBase.recetasColor[0].id;
      return {
        ...fichaBase,
        recetaColorActivaId: activeRecetaId,
        recetasColor: fichaBase.recetasColor.map((r) =>
          r.id === activeRecetaId
            ? {
                ...r,
                asignacionesCapaMaterial: Object.keys(todasLasCapas).length > 0 ? todasLasCapas : r.asignacionesCapaMaterial,
                asignacionesPartes: Object.keys(todasLasPartes).length > 0 ? todasLasPartes : r.asignacionesPartes,
                parametros: Object.keys(liveParams).length > 0 ? liveParams : r.parametros,
              }
            : r
        ),
      };
    };

    // 1. Si hay un mueble guardado activo en carpeta, prioridad absoluta a su ficha técnica personalizada (sincronizada con los parámetros vivos)
    if (state.muebleActivoGuardado) {
      if (state.muebleActivoGuardado.fichaProducto) {
        return sincronizarRecetaActivaEnFicha(state.muebleActivoGuardado.fichaProducto);
      }
      const idKey = state.muebleActivoGuardado.id;
      const nombreKey = state.muebleActivoGuardado.nombre.trim();
      if (state.fichasProducto[idKey]) return sincronizarRecetaActivaEnFicha(state.fichasProducto[idKey]);
      if (state.fichasProducto[nombreKey]) return sincronizarRecetaActivaEnFicha(state.fichasProducto[nombreKey]);
    }

    // 2. Si estamos en un componente inteligente de biblioteca:
    const muebleId = objetoActivo?.definitionId || "Componente Inteligente";
    const limpiaKey = muebleId.replace(/\.(gh|ghx)$/i, "").trim();

    // Si ya tiene una ficha personalizada modificada en esta sesión:
    if (state.fichasProducto[limpiaKey]) {
      return sincronizarRecetaActivaEnFicha(state.fichasProducto[limpiaKey]);
    }

    // 3. De lo contrario, generar SIEMPRE la ficha estándar básica limpia con 1 solo color por defecto
    const capaTono = state.capas.find((c) => c.id === "capa_tono");
    const matTono = state.materialesPBR.find((m) => m.id === capaTono?.materialId);
    const colorPrimario = matTono?.colorBase || "#CBD5E1";

    const nuevaFicha = crearFichaEstandarLimpia(limpiaKey, objetoActivo?.nombreVisible || limpiaKey);
    if (nuevaFicha.recetasColor[0]) {
      nuevaFicha.recetasColor[0].swatch.colorPrimario = colorPrimario;
      nuevaFicha.recetasColor[0].asignacionesCapaMaterial = todasLasCapas;
      nuevaFicha.recetasColor[0].asignacionesPartes = todasLasPartes;
      nuevaFicha.recetasColor[0].parametros = liveParams;
    }
    return nuevaFicha;
  },

  actualizarFichaProducto: (muebleId, cambios) => {
    set((state) => {
      const limpiaKey = muebleId.replace(/\.(gh|ghx)$/i, "").trim();
      const actual = state.fichasProducto[limpiaKey] || state.getFichaProductoActivo();
      const actualizada = { ...actual, ...cambios };
      const nuevasFichas = { ...state.fichasProducto, [limpiaKey]: actualizada };
      if (typeof window !== "undefined" && window.localStorage) {
        localStorage.setItem("3bf_fichas_v2", JSON.stringify(nuevasFichas));
      }

      // Si hay un mueble guardado activo, mantenerlo sincronizado
      let muebleActualizado = state.muebleActivoGuardado;
      if (muebleActualizado && (muebleActualizado.id === muebleId || muebleActualizado.nombre === muebleId || muebleActualizado.id === state.muebleActivoGuardado?.id)) {
        muebleActualizado = { ...muebleActualizado, fichaProducto: actualizada };
      }

      return { 
        fichasProducto: nuevasFichas,
        muebleActivoGuardado: muebleActualizado
      };
    });
  },

  aplicarRecetaColor: (muebleId, recetaId) => {
    const state = get();
    const limpiaKey = muebleId.replace(/\.(gh|ghx)$/i, "").trim();
    const ficha = state.fichasProducto[limpiaKey] || state.getFichaProductoActivo();

    // 💡 AUTO-GUARDADO REACTIVO: Guardar estado actual de capas, partes y parámetros en la receta saliente antes de conmutar
    const recetaSalienteId = ficha.recetaColorActivaId;
    let recetasActualizadas = [...ficha.recetasColor];
    if (recetaSalienteId && recetaSalienteId !== recetaId) {
      const asignacionesCapaMaterialSaliente: Record<string, string> = {};
      state.capas.forEach((c) => {
        asignacionesCapaMaterialSaliente[c.id] = c.materialId;
      });
      const asignacionesPartesSaliente: Record<string, { capaId: string; materialId: string }> = {};
      Object.entries(state.asignacionesPartes).forEach(([k, v]) => {
        asignacionesPartesSaliente[k] = { capaId: v.capaId, materialId: v.materialId };
      });
      const objetoActivo = state.objetoActivoId ? state.instancias[state.objetoActivoId] : null;
      const parametrosSaliente = { ...(objetoActivo?.parametros || state.parametros || {}) };

      const matPrincipal = state.materialesPBR.find((m) => m.id === state.capas.find((c) => c.id === "capa_tono")?.materialId);
      recetasActualizadas = recetasActualizadas.map((r) => {
        if (r.id === recetaSalienteId) {
          const swatchActualizado = {
            ...r.swatch,
            ...(r.swatch.tipo === "solido" && matPrincipal?.colorBase ? { colorPrimario: matPrincipal.colorBase } : {})
          };
          return {
            ...r,
            swatch: swatchActualizado,
            asignacionesCapaMaterial: asignacionesCapaMaterialSaliente,
            asignacionesPartes: asignacionesPartesSaliente,
            parametros: parametrosSaliente
          };
        }
        return r;
      });
    }

    const recetaEntrante = recetasActualizadas.find((r) => r.id === recetaId);
    if (!recetaEntrante) return;

    state.actualizarFichaProducto(limpiaKey, {
      recetasColor: recetasActualizadas,
      recetaColorActivaId: recetaId
    });

    // 1. Restaurar TODAS las capas guardadas en la receta entrante
    if (recetaEntrante.asignacionesCapaMaterial) {
      Object.entries(recetaEntrante.asignacionesCapaMaterial).forEach(([capaId, materialId]) => {
        state.actualizarCapa(capaId, { materialId });
      });
    }

    // 2. Restaurar TODAS las asignaciones de partes guardadas en la receta entrante
    if (recetaEntrante.asignacionesPartes) {
      const prevPartes = { ...state.asignacionesPartes };
      Object.entries(recetaEntrante.asignacionesPartes).forEach(([parteKey, def]) => {
        const kLow = parteKey.toLowerCase();
        const isBalance = kLow.includes("balance") || kLow.endsWith(" b") || kLow.endsWith("_b") || /pe[cç]a\s*\d+\s*b$/i.test(kLow);
        const isFondo = kLow.includes("fondo") || kLow.includes("fundo") || kLow.includes("costa") || kLow.includes("espaldar") || kLow.includes("trasera");
        const resolvedCapaId = (isFondo && isBalance && def.capaId === "capa_tono_fondo") ? "capa_mdf" : def.capaId;
        if (prevPartes[parteKey]) {
          prevPartes[parteKey] = {
            ...prevPartes[parteKey],
            capaId: resolvedCapaId,
            materialId: def.materialId
          };
        } else {
          prevPartes[parteKey] = {
            parteKey,
            nombreVisible: parteKey.replace(/^RH_OUT:/, ""),
            capaId: resolvedCapaId,
            materialId: def.materialId,
            visible: true
          };
        }
      });
      if (typeof window !== "undefined" && window.localStorage) {
        localStorage.setItem("3bf_asignaciones_partes_v1", JSON.stringify(prevPartes));
      }
      set({ asignacionesPartes: prevPartes });
    }

    // 3. 🪵 Restaurar parámetros paramétricos de piezas, lados de balance (Cara A / Cara B) y sustratos (D/B, D/D)
    if (recetaEntrante.parametros && Object.keys(recetaEntrante.parametros).length > 0) {
      const objetoActivoId = state.objetoActivoId;
      const paramsEntrantes = recetaEntrante.parametros;
      const paramsActuales = (objetoActivoId && state.instancias[objetoActivoId])
        ? state.instancias[objetoActivoId].parametros
        : state.parametros;

      let hayCambiosParametricos = false;
      for (const [k, v] of Object.entries(paramsEntrantes)) {
        if (paramsActuales && (paramsActuales as Record<string, any>)[k] !== v) {
          hayCambiosParametricos = true;
          break;
        }
      }

      if (hayCambiosParametricos) {
        if (objetoActivoId && state.instancias[objetoActivoId]) {
          const nextParams = { ...state.instancias[objetoActivoId].parametros, ...paramsEntrantes };
          set((s) => ({
            instancias: {
              ...s.instancias,
              [objetoActivoId]: {
                ...s.instancias[objetoActivoId],
                parametros: nextParams
              }
            },
            parametros: nextParams as any
          }));
          // Recomputar Grasshopper para regenerar caras de balance A/B y geometrías
          get().recomputarInstancia(objetoActivoId);
        } else {
          set((s) => ({
            parametros: { ...s.parametros, ...paramsEntrantes } as any
          }));
        }
      }
    }
  },

  guardarNuevaRecetaColor: (muebleId, nuevaReceta) => {
    const state = get();
    const limpiaKey = muebleId.replace(/\.(gh|ghx)$/i, "").trim();
    const ficha = state.fichasProducto[limpiaKey] || state.getFichaProductoActivo();

    // 💡 Auto-guardar receta saliente antes de añadir la nueva
    const recetaSalienteId = ficha.recetaColorActivaId;
    let recetasBase = [...ficha.recetasColor];
    if (recetaSalienteId && recetaSalienteId !== nuevaReceta.id) {
      const asignacionesCapaMaterialSaliente: Record<string, string> = {};
      state.capas.forEach((c) => {
        asignacionesCapaMaterialSaliente[c.id] = c.materialId;
      });
      const asignacionesPartesSaliente: Record<string, { capaId: string; materialId: string }> = {};
      Object.entries(state.asignacionesPartes).forEach(([k, v]) => {
        asignacionesPartesSaliente[k] = { capaId: v.capaId, materialId: v.materialId };
      });
      const objetoActivo = state.objetoActivoId ? state.instancias[state.objetoActivoId] : null;
      const parametrosSaliente = { ...(objetoActivo?.parametros || state.parametros || {}) };

      const matPrincipal = state.materialesPBR.find((m) => m.id === state.capas.find((c) => c.id === "capa_tono")?.materialId);
      recetasBase = recetasBase.map((r) => {
        if (r.id === recetaSalienteId) {
          const swatchActualizado = {
            ...r.swatch,
            ...(r.swatch.tipo === "solido" && matPrincipal?.colorBase ? { colorPrimario: matPrincipal.colorBase } : {})
          };
          return {
            ...r,
            swatch: swatchActualizado,
            asignacionesCapaMaterial: asignacionesCapaMaterialSaliente,
            asignacionesPartes: asignacionesPartesSaliente,
            parametros: parametrosSaliente
          };
        }
        return r;
      });
    }

    const objetoActivo = state.objetoActivoId ? state.instancias[state.objetoActivoId] : null;
    const recetaConParametros: RecetaColorMueble = {
      ...nuevaReceta,
      parametros: nuevaReceta.parametros || { ...(objetoActivo?.parametros || state.parametros || {}) }
    };

    const recetasActualizadas = [...recetasBase.filter((r) => r.id !== nuevaReceta.id), recetaConParametros];
    state.actualizarFichaProducto(limpiaKey, {
      recetasColor: recetasActualizadas,
      recetaColorActivaId: nuevaReceta.id
    });
  },

  eliminarRecetaColor: (muebleId, recetaId) => {
    const state = get();
    const limpiaKey = muebleId.replace(/\.(gh|ghx)$/i, "").trim();
    const ficha = state.fichasProducto[limpiaKey] || state.getFichaProductoActivo();
    if (ficha.recetasColor.length <= 1) return;
    const filtradas = ficha.recetasColor.filter((r) => r.id !== recetaId);
    state.actualizarFichaProducto(limpiaKey, {
      recetasColor: filtradas,
      recetaColorActivaId: ficha.recetaColorActivaId === recetaId ? filtradas[0].id : ficha.recetaColorActivaId
    });
  },

  recetaEnEdicion: null,
  iniciarEdicionReceta: (muebleId, recetaId) => {
    const limpiaKey = muebleId.replace(/\.(gh|ghx)$/i, "").trim();
    set({ recetaEnEdicion: { muebleId: limpiaKey, recetaId } });
  },
  cancelarEdicionReceta: () => set({ recetaEnEdicion: null }),
  guardarEstadoActualEnReceta: () => {
    const state = get();
    if (!state.recetaEnEdicion) return;
    const { muebleId, recetaId } = state.recetaEnEdicion;
    const limpiaKey = muebleId.replace(/\.(gh|ghx)$/i, "").trim();
    const ficha = state.fichasProducto[limpiaKey] || state.getFichaProductoActivo();
    const receta = ficha.recetasColor.find((r) => r.id === recetaId);
    if (!receta) {
      set({ recetaEnEdicion: null });
      return;
    }

    // Capturar el 100% de las capas actuales del modelo
    const asignacionesCapaMaterial: Record<string, string> = {};
    state.capas.forEach((c) => {
      asignacionesCapaMaterial[c.id] = c.materialId;
    });

    // Capturar el 100% de las asignaciones de partes actuales
    const asignacionesPartesMap: Record<string, { capaId: string; materialId: string }> = {};
    Object.entries(state.asignacionesPartes).forEach(([k, v]) => {
      asignacionesPartesMap[k] = { capaId: v.capaId, materialId: v.materialId };
    });

    // Capturar el 100% de los parámetros paramétricos de piezas, caras de balance y sustratos
    const objetoActivo = state.objetoActivoId ? state.instancias[state.objetoActivoId] : null;
    const parametrosActuales = { ...(objetoActivo?.parametros || state.parametros || {}) };

    const matPrincipal = state.materialesPBR.find((m) => m.id === state.capas.find((c) => c.id === "capa_tono")?.materialId);
    const swatchActualizado: RecetaColorSwatch = {
      ...receta.swatch,
      ...(receta.swatch.tipo === "solido" && matPrincipal?.colorBase ? { colorPrimario: matPrincipal.colorBase } : {})
    };

    const recetaActualizada: RecetaColorMueble = {
      ...receta,
      swatch: swatchActualizado,
      asignacionesCapaMaterial,
      asignacionesPartes: asignacionesPartesMap,
      parametros: parametrosActuales
    };

    const recetasNuevas = ficha.recetasColor.map((r) =>
      r.id === recetaId ? recetaActualizada : r
    );

    state.actualizarFichaProducto(limpiaKey, {
      recetasColor: recetasNuevas,
      recetaColorActivaId: recetaId
    });

    set({ recetaEnEdicion: null });
  },

  // 🎨 Estado e Implementación de Capas, Materiales PBR y Partes GHX (Siempre 100% visibles por defecto)
  capas: (typeof window !== "undefined" && window.localStorage && localStorage.getItem("3bf_capas_v1")
    ? (() => {
        try {
          const stored = JSON.parse(localStorage.getItem("3bf_capas_v1")!) as CapaDef[];
          const storedIds = new Set(stored.map((c) => c.id));
          const missing = PRESET_CAPAS.filter((p) => !storedIds.has(p.id));
          return [...stored, ...missing];
        } catch {
          return PRESET_CAPAS;
        }
      })()
    : PRESET_CAPAS).map((c) => ({ ...c, visible: true })),
  materialesPBR: typeof window !== "undefined" && window.localStorage && localStorage.getItem("3bf_materiales_pbr_v1")
    ? (() => {
        try {
          const stored = JSON.parse(localStorage.getItem("3bf_materiales_pbr_v1")!) as MaterialPBRDef[];
          const storedIds = new Set(stored.map((m) => m.id));
          const missing = PRESET_MATERIALES_PBR.filter((p) => !storedIds.has(p.id));
          return [...stored, ...missing];
        } catch {
          return PRESET_MATERIALES_PBR;
        }
      })()
    : PRESET_MATERIALES_PBR,
  materialSeleccionadoId: "mat_acero",
  asignacionesPartes: typeof window !== "undefined" && window.localStorage && localStorage.getItem("3bf_asignaciones_partes_v1")
    ? Object.fromEntries(
        Object.entries(JSON.parse(localStorage.getItem("3bf_asignaciones_partes_v1")!) as Record<string, AsignacionParteDef>).map(([k, v]) => {
          const kLow = k.toLowerCase();
          const isHardware = kLow.includes("perno") || kLow.includes("caja") || kLow.includes("tarugo") || kLow.includes("cavilha") || kLow.includes("tornillo") || kLow.includes("parafuso") || kLow.includes("prego") || kLow.includes("puntilla") || kLow.includes("clavo") || kLow.includes("soporte") || kLow.includes("suporte") || kLow.includes("corredera") || kLow.includes("corredi") || kLow.includes("trilho") || kLow.includes("cantoneira") || kLow.includes("angulo") || kLow.includes("pata") || kLow.includes("pes") || kLow.includes("clavilha") || kLow.includes("porca") || kLow.includes("tuerca") || kLow.includes("tampa") || kLow.includes("tapa") || kLow.includes("adesivo");
          const isBoard = !isHardware;
          const isInvalidLayer = ["capa_acero", "capa_aluminio", "capa_cromo", "capa_zinc", "capa_zincado", "capa_herrajes", "capa_plastico_1", "capa_plastico_2"].includes(v.capaId);
          
          const isFondo = (
            kLow.includes("fondo") ||
            kLow.includes("fundo") ||
            kLow.includes("tono fondo") ||
            kLow.includes("costa") ||
            kLow.includes("costas") ||
            kLow.includes("espaldar") ||
            kLow.includes("trasera") ||
            kLow.includes("back") ||
            kLow.includes("peça 15") ||
            kLow.includes("peca 15") ||
            kLow.includes("pk15") ||
            kLow.includes("peça 18") ||
            kLow.includes("peca 18") ||
            kLow.includes("pk18")
          );

          const isBalance = (
            kLow.includes("balance") ||
            kLow.includes("equilibrio") ||
            kLow.includes("reverso") ||
            kLow.endsWith(" b") ||
            kLow.endsWith("_b") ||
            kLow.endsWith("-b") ||
            /pe[cç]a\s*\d+\s*b$/i.test(kLow) ||
            /pk\s*\d+\s*b$/i.test(kLow)
          );

          let safeCapaId = v.capaId;
          if (kLow.includes("mdf") || (isFondo && isBalance)) {
            safeCapaId = "capa_mdf";
          } else if (isFondo && !kLow.includes("mdp")) {
            safeCapaId = "capa_tono_fondo";
          } else if (isBoard && isInvalidLayer) {
            if (isBalance) safeCapaId = "capa_back";
            else safeCapaId = "capa_tono";
          }
          return [k, { ...v, capaId: safeCapaId, visible: true }];
        })
      )
    : {},

  crearCapa: (nueva) => {
    const id = nueva?.id || `capa_${Date.now()}`;
    const capaCompleta: CapaDef = {
      id,
      nombre: nueva?.nombre || `Capa_${get().capas.length + 1}`,
      activa: false,
      visible: nueva?.visible ?? true,
      bloqueada: nueva?.bloqueada ?? false,
      color: nueva?.color || "#8A9EA7",
      materialId: nueva?.materialId || get().materialesPBR[0]?.id || "mat_acero",
      tipoLinea: "Continua",
      ...nueva,
    };
    const listaActualizada = [...get().capas, capaCompleta];
    if (typeof window !== "undefined" && window.localStorage) {
      localStorage.setItem("3bf_capas_v1", JSON.stringify(listaActualizada));
    }
    set({ capas: listaActualizada });
    return id;
  },

  actualizarCapa: (id, cambios) => {
    const listaActualizada = get().capas.map((c) => (c.id === id ? { ...c, ...cambios } : c));
    if (cambios.activa) {
      listaActualizada.forEach((c) => {
        if (c.id !== id) c.activa = false;
      });
    }
    if (typeof window !== "undefined" && window.localStorage) {
      localStorage.setItem("3bf_capas_v1", JSON.stringify(listaActualizada));
    }
    set({ capas: listaActualizada });
  },

  eliminarCapa: (id) => {
    if (get().capas.length <= 1) return;
    if (get().prepararHistorialParaCambio) get().prepararHistorialParaCambio();
    const listaActualizada = get().capas.filter((c) => c.id !== id);
    if (typeof window !== "undefined" && window.localStorage) {
      localStorage.setItem("3bf_capas_v1", JSON.stringify(listaActualizada));
    }
    set({ capas: listaActualizada });
    if (get().guardarEstadoHistorial) get().guardarEstadoHistorial();
  },

  toggleVisibilidadCapa: (id) => {
    const listaActualizada = get().capas.map((c) => (c.id === id ? { ...c, visible: !c.visible } : c));
    if (typeof window !== "undefined" && window.localStorage) {
      localStorage.setItem("3bf_capas_v1", JSON.stringify(listaActualizada));
    }
    set({ capas: listaActualizada });
  },

  toggleBloqueoCapa: (id) => {
    const listaActualizada = get().capas.map((c) => (c.id === id ? { ...c, bloqueada: !c.bloqueada } : c));
    if (typeof window !== "undefined" && window.localStorage) {
      localStorage.setItem("3bf_capas_v1", JSON.stringify(listaActualizada));
    }
    set({ capas: listaActualizada });
  },

  crearMaterialPBR: (nuevo) => {
    const id = nuevo?.id || `mat_${Date.now()}`;
    const materialCompleto: MaterialPBRDef = {
      id,
      nombre: nuevo?.nombre || `Material_${get().materialesPBR.length + 1}`,
      tipo: nuevo?.tipo || "PBR",
      colorBase: nuevo?.colorBase || "#C5B39A",
      metalico: nuevo?.metalico ?? 0.05,
      rugosidad: nuevo?.rugosidad ?? 0.50,
      especularidad: nuevo?.especularidad ?? 0.50,
      opacidad: nuevo?.opacidad ?? 1.0,
      ior: nuevo?.ior ?? 1.50,
      texturaUrl: nuevo?.texturaUrl,
      notas: nuevo?.notas || "",
      ...nuevo,
    };
    const listaActualizada = [...get().materialesPBR, materialCompleto];
    // 🛡️ 1. Persistencia de Alta Capacidad en IndexedDB (soporta Texturas y Mapas PBR sin límite de 5MB)
    saveMaterialesToIndexedDB(listaActualizada);

    // 💾 2. Fallback de compatibilidad en localStorage
    if (typeof window !== "undefined" && window.localStorage) {
      try {
        localStorage.setItem("3bf_materiales_pbr_v1", JSON.stringify(listaActualizada));
      } catch (e) {
        try {
          const listaLigera = listaActualizada.map((m) => ({
            ...m,
            normalMapUrl: m.normalMapUrl?.startsWith("data:") ? null : m.normalMapUrl,
            roughnessMapUrl: m.roughnessMapUrl?.startsWith("data:") ? null : m.roughnessMapUrl,
            aoMapUrl: m.aoMapUrl?.startsWith("data:") ? null : m.aoMapUrl,
          }));
          localStorage.setItem("3bf_materiales_pbr_v1", JSON.stringify(listaLigera));
        } catch {
          console.warn("Storage cuota excedida: Materiales respaldados de forma segura en IndexedDB.");
        }
      }
    }
    set({ materialesPBR: listaActualizada, materialSeleccionadoId: id });
    return id;
  },

  actualizarMaterialPBR: (id, cambios) => {
    const listaActualizada = get().materialesPBR.map((m) => (m.id === id ? { ...m, ...cambios } : m));
    // 🛡️ 1. Persistencia de Alta Capacidad en IndexedDB
    saveMaterialesToIndexedDB(listaActualizada);

    // 💾 2. Fallback de compatibilidad en localStorage
    if (typeof window !== "undefined" && window.localStorage) {
      try {
        localStorage.setItem("3bf_materiales_pbr_v1", JSON.stringify(listaActualizada));
      } catch (e) {
        try {
          const listaLigera = listaActualizada.map((m) => ({
            ...m,
            normalMapUrl: m.normalMapUrl?.startsWith("data:") ? null : m.normalMapUrl,
            roughnessMapUrl: m.roughnessMapUrl?.startsWith("data:") ? null : m.roughnessMapUrl,
            aoMapUrl: m.aoMapUrl?.startsWith("data:") ? null : m.aoMapUrl,
          }));
          localStorage.setItem("3bf_materiales_pbr_v1", JSON.stringify(listaLigera));
        } catch {
          console.warn("Storage cuota excedida: Materiales respaldados de forma segura en IndexedDB.");
        }
      }
    }
    set({ materialesPBR: listaActualizada });
  },

  eliminarMaterialPBR: (id) => {
    if (get().materialesPBR.length <= 1) return;
    const listaActualizada = get().materialesPBR.filter((m) => m.id !== id);
    const nuevoSel = listaActualizada[0]?.id || "";
    // 🛡️ 1. Persistencia de Alta Capacidad en IndexedDB
    saveMaterialesToIndexedDB(listaActualizada);

    if (typeof window !== "undefined" && window.localStorage) {
      try {
        localStorage.setItem("3bf_materiales_pbr_v1", JSON.stringify(listaActualizada));
      } catch {
        console.warn("Storage cuota excedida al eliminar material.");
      }
    }
    set({ materialesPBR: listaActualizada, materialSeleccionadoId: nuevoSel });
  },

  cargarMaterialesDesdeDB: async () => {
    try {
      const persistidos = await loadMaterialesFromIndexedDB();
      if (persistidos && persistidos.length > 0) {
        const storedIds = new Set(persistidos.map((m) => m.id));
        const missing = PRESET_MATERIALES_PBR.filter((p) => !storedIds.has(p.id));
        const final = [...persistidos, ...missing];
        set({ materialesPBR: final });
      }
    } catch (err) {
      console.warn("Error cargando materiales PBR desde IndexedDB:", err);
    }
  },

  setMaterialSeleccionadoId: (materialSeleccionadoId) => set({ materialSeleccionadoId }),

  asignarParteACapa: (parteKey, capaId, nombreVisible) => {
    const prev = get().asignacionesPartes;
    const actual = prev[parteKey] || {
      parteKey,
      nombreVisible: nombreVisible || parteKey.replace(/^RH_OUT:/, ""),
      capaId: "por_defecto",
      materialId: "por_capa",
      visible: true,
    };
    const nuevoMap = {
      ...prev,
      [parteKey]: {
        ...actual,
        capaId,
        materialId: "por_capa", // 💡 Heredar inmediatamente el material de la nueva capa asignada
        nombreVisible: nombreVisible || actual.nombreVisible,
      },
    };
    if (typeof window !== "undefined" && window.localStorage) {
      localStorage.setItem("3bf_asignaciones_partes_v1", JSON.stringify(nuevoMap));
    }
    set({ asignacionesPartes: nuevoMap });
  },

  asignarParteAMaterial: (parteKey, materialId) => {
    const prev = get().asignacionesPartes;
    const actual = prev[parteKey] || {
      parteKey,
      nombreVisible: parteKey.replace(/^RH_OUT:/, ""),
      capaId: "por_defecto",
      materialId: "por_capa",
      visible: true,
    };
    const nuevoMap = {
      ...prev,
      [parteKey]: {
        ...actual,
        materialId,
      },
    };
    if (typeof window !== "undefined" && window.localStorage) {
      localStorage.setItem("3bf_asignaciones_partes_v1", JSON.stringify(nuevoMap));
    }
    set({ asignacionesPartes: nuevoMap });
  },

  toggleVisibilidadParte: (parteKey) => {
    const prev = get().asignacionesPartes;
    const actual = prev[parteKey] || {
      parteKey,
      nombreVisible: parteKey.replace(/^RH_OUT:/, ""),
      capaId: "por_defecto",
      materialId: "por_capa",
      visible: true,
    };
    const nuevoMap = {
      ...prev,
      [parteKey]: {
        ...actual,
        visible: !actual.visible,
      },
    };
    if (typeof window !== "undefined" && window.localStorage) {
      localStorage.setItem("3bf_asignaciones_partes_v1", JSON.stringify(nuevoMap));
    }
    set({ asignacionesPartes: nuevoMap });
  },

  resetCapasYMateriales: () => {
    if (typeof window !== "undefined" && window.localStorage) {
      localStorage.removeItem("3bf_capas_v1");
      localStorage.removeItem("3bf_materiales_pbr_v1");
      localStorage.removeItem("3bf_asignaciones_partes_v1");
    }
    set({
      capas: PRESET_CAPAS,
      materialesPBR: PRESET_MATERIALES_PBR,
      asignacionesPartes: {},
      materialSeleccionadoId: "mat_acero",
    });
  },

  // 🎨 Apariencia & Personalización de Colores (Perfiles Claro y Oscuro)
  esquemaColor: "claro",
  coloresApariencia: PRESET_COLORES_CLARO,
  fuenteInterfaz: "sistema",
  setFuenteInterfaz: (fuente) => {
    if (typeof window !== "undefined" && window.localStorage) {
      localStorage.setItem("3bf_fuente_interfaz", fuente);
    }
    set({ fuenteInterfaz: fuente });
  },
  setEsquemaColor: (esquema) => {
    if (typeof window !== "undefined" && window.localStorage) {
      localStorage.setItem("3bf_perfil_activo", esquema);
    }
    
    if (esquema === "claro") {
      let coloresClaro = PRESET_COLORES_CLARO;
      if (typeof window !== "undefined" && window.localStorage) {
        const guardado = localStorage.getItem("3bf_preset_claro");
        if (guardado) {
          try {
            coloresClaro = { ...PRESET_COLORES_CLARO, ...JSON.parse(guardado) };
          } catch (e) {
            console.warn("Error leyendo preset claro:", e);
          }
        }
      }
      set({ esquemaColor: "claro", coloresApariencia: coloresClaro, tema: "tech" });
      if (typeof document !== "undefined") {
        document.documentElement.setAttribute("data-theme", "tech");
        document.documentElement.classList.remove("dark");
      }
    } else {
      let coloresOscuro = PRESET_COLORES_OSCURO;
      if (typeof window !== "undefined" && window.localStorage) {
        const guardado = localStorage.getItem("3bf_preset_oscuro");
        if (guardado) {
          try {
            coloresOscuro = { ...PRESET_COLORES_OSCURO, ...JSON.parse(guardado) };
          } catch (e) {
            console.warn("Error leyendo preset oscuro:", e);
          }
        }
      }
      set({ esquemaColor: "oscuro", coloresApariencia: coloresOscuro, tema: "obsidian" });
      if (typeof document !== "undefined") {
        document.documentElement.setAttribute("data-theme", "obsidian");
        document.documentElement.classList.add("dark");
      }
    }
  },
  setColorApariencia: (clave, valor) =>
    set((state) => ({
      coloresApariencia: {
        ...state.coloresApariencia,
        [clave]: valor,
        ...(clave === "fondoPaneles" ? { fondoTopNav: valor } : {}),
        ...(clave === "bordePaneles" ? { colorMarca: valor } : {}),
        ...(clave === "botonActivo" ? { iconosFijos: valor } : {}),
      },
      calibracion: {
        ...state.calibracion,
        ...(clave === "rejillaPrincipal" ? { colorGrillaGruesa: valor } : {}),
        ...(clave === "rejillaSecundaria" ? { colorGrillaDelgada: valor } : {}),
      },
    })),
  restaurarColoresApariencia: () => {
    const state = get();
    if (state.esquemaColor === "claro") {
      if (typeof window !== "undefined" && window.localStorage) {
        localStorage.removeItem("3bf_preset_claro");
      }
      set({ coloresApariencia: PRESET_COLORES_CLARO });
    } else {
      if (typeof window !== "undefined" && window.localStorage) {
        localStorage.removeItem("3bf_preset_oscuro");
      }
      set({ coloresApariencia: PRESET_COLORES_OSCURO });
    }
  },
  guardarComoPredefinido: () => {
    const state = get();
    if (typeof window !== "undefined" && window.localStorage) {
      if (state.esquemaColor === "claro") {
        localStorage.setItem("3bf_preset_claro", JSON.stringify(state.coloresApariencia));
        localStorage.setItem("3bf_perfil_activo", "claro");
      } else {
        localStorage.setItem("3bf_preset_oscuro", JSON.stringify(state.coloresApariencia));
        localStorage.setItem("3bf_perfil_activo", "oscuro");
      }
      localStorage.setItem("3bf_fuente_interfaz", state.fuenteInterfaz);
    }
  },
  cargarColoresPredefinidos: () => {
    if (typeof window !== "undefined" && window.localStorage) {
      const fuenteGuardada = localStorage.getItem("3bf_fuente_interfaz") || "sistema";
      const perfilActivo = (localStorage.getItem("3bf_perfil_activo") as "claro" | "oscuro") || "claro";
      if (perfilActivo === "oscuro") {
        let coloresOscuro = PRESET_COLORES_OSCURO;
        const guardado = localStorage.getItem("3bf_preset_oscuro");
        if (guardado) {
          try {
            coloresOscuro = { ...PRESET_COLORES_OSCURO, ...JSON.parse(guardado) };
          } catch {}
        }
        set({
          esquemaColor: "oscuro",
          coloresApariencia: coloresOscuro,
          tema: "obsidian",
          fuenteInterfaz: fuenteGuardada,
        });
        if (typeof document !== "undefined") {
          document.documentElement.setAttribute("data-theme", "obsidian");
          document.documentElement.classList.add("dark");
        }
      } else {
        let coloresClaro = PRESET_COLORES_CLARO;
        const guardado = localStorage.getItem("3bf_preset_claro");
        if (guardado) {
          try {
            coloresClaro = { ...PRESET_COLORES_CLARO, ...JSON.parse(guardado) };
          } catch {}
        }
        set({
          esquemaColor: "claro",
          coloresApariencia: coloresClaro,
          tema: "tech",
          fuenteInterfaz: fuenteGuardada,
        });
        if (typeof document !== "undefined") {
          document.documentElement.setAttribute("data-theme", "tech");
          document.documentElement.classList.remove("dark");
        }
      }
    }
  },

  // =========================================================================
  // 🪑 CATÁLOGO DE MUEBLES (ASSET BROWSER BLENDER STYLE & GOOGLE DRIVE)
  // =========================================================================
  arbolCarpetasMuebles: [],
  mueblesGuardados: [],
  muebleActivoGuardado: null,
  carpetaSeleccionadaId: "all",
  modalGuardarComoAbierto: false,
  guardandoMueble: false,
  urlGoogleDrive: "https://drive.google.com/drive/u/0/folders/1zzeGpgyLbCUKrUUhT7Lk-_7xRW_kZf9t",

  setCarpetaSeleccionadaId: (carpetaSeleccionadaId) => set({ carpetaSeleccionadaId }),
  setModalGuardarComoAbierto: (modalGuardarComoAbierto) => set({ modalGuardarComoAbierto }),
  setUrlGoogleDrive: (urlGoogleDrive) => set({ urlGoogleDrive }),

  cargarArbolMuebles: async () => {
    try {
      const res = await fetch("/api/drive/muebles?action=list_tree");
      if (res.ok) {
        const data = await res.json();
        if (data.tree) {
          set({ arbolCarpetasMuebles: data.tree });
        }
        if (data.muebles) {
          set({ mueblesGuardados: data.muebles });
          const state = get();
          if (!state.muebleActivoGuardado && typeof window !== "undefined" && window.localStorage) {
            const ultimoId = localStorage.getItem("3bf_ultimo_mueble_id");
            if (ultimoId) {
              const targetMueble = (data.muebles as MuebleGuardadoItem[]).find(
                (m) => m.id === ultimoId
              );
              if (targetMueble) {
                // Hidratar mueble completo con geometrías 3D y diseños bajo demanda
                get().abrirMueble(targetMueble);
              }
            }
          }
        }
        if (data.driveUrl) {
          set({ urlGoogleDrive: data.driveUrl });
        }
      }
    } catch (e) {
      console.warn("Usando catálogo local de muebles:", e);
    }
  },

  crearCarpetaMueble: async (nombre: string, tipo: "marca" | "tipologia" = "tipologia", padreId: string | null = null) => {
    const cleanName = nombre.trim();
    if (!cleanName) return false;

    const state = get();
    const slug = cleanName.toLowerCase().replace(/\s+/g, "-");
    const id = padreId ? `${padreId}/${slug}` : slug;

    // 📁 Resolver ruta física real buscando el nodo padre en el árbol de carpetas
    let ruta = cleanName;
    if (padreId) {
      const padreNode = state.arbolCarpetasMuebles.find((m) => m.id === padreId || m.nombre === padreId);
      if (padreNode) {
        ruta = `${padreNode.nombre}/${cleanName}`;
      } else {
        ruta = `${padreId}/${cleanName}`;
      }
    }

    const nuevaCarpeta: CarpetaMuebleNode = {
      id,
      nombre: cleanName,
      tipo,
      padreId: padreId || null,
      ruta,
      subcarpetas: []
    };

    set((state) => {
      if (!padreId) {
        return { arbolCarpetasMuebles: [...state.arbolCarpetasMuebles, nuevaCarpeta] };
      }
      const updatedTree = state.arbolCarpetasMuebles.map((m) => {
        if (m.id === padreId) {
          return { ...m, subcarpetas: [...(m.subcarpetas || []), nuevaCarpeta] };
        }
        return m;
      });
      return { arbolCarpetasMuebles: updatedTree };
    });

    try {
      await fetch("/api/drive/muebles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create_folder", folder: nuevaCarpeta }),
      });
    } catch (e) {
      console.warn("Carpeta persistida localmente:", e);
    }
    return true;
  },

  guardarMuebleComo: async (datos: { nombre: string; marca: string; tipologia: string; descripcion?: string }) => {
    set({ guardandoMueble: true });
    try {
      // 🛡️ 0. Si hay algún debounce pendiente en vuelo, ejecutarlo y esperar su cómputo antes de serializar
      const pendingTimers = (globalThis as any).__3bf_debounce_timers;
      if (pendingTimers && typeof pendingTimers === "object") {
        const pendingIds = Object.keys(pendingTimers);
        for (const pId of pendingIds) {
          clearTimeout(pendingTimers[pId]);
          delete pendingTimers[pId];
          await get().recomputarInstancia(pId);
        }
      }

      const state = get();
      const cleanNombre = datos.nombre.trim();
      const safeName = cleanNombre.replace(/[\\/:*?"<>|]/g, "_");
      const id = safeName;
      const rutaCarpeta = `${datos.marca}/${datos.tipologia}`;

      // Sanitizar instancias y consolidar colecciones de diseños
      const rawInst = state.instancias || {};
      const targetInstId = state.objetoActivoId || Object.keys(rawInst)[0];
      const instPrincipal = targetInstId ? rawInst[targetInstId] : Object.values(rawInst)[0];

      const defKey = instPrincipal?.definitionId || state.parametros.model_id || cleanNombre;
      const fichaConfig =
        state.fichasConfig?.[cleanNombre] ||
        state.fichasConfig?.[id] ||
        state.fichasConfig?.[defKey] ||
        state.muebleActivoGuardado?.fichaConfig ||
        state.getFichaConfig(defKey);
      const despieceGlobal = state.getDespieceGlobal();

      // Capturar miniatura 3D real desde el Canvas WebGL
      let thumbnail: string | undefined = undefined;
      if (typeof window !== "undefined" && (window as any).__capturarThumbnail3BF) {
        thumbnail = (window as any).__capturarThumbnail3BF() || undefined;
      }

      // Capturar ficha técnica y variantes de color del producto (ya sincronizada con instPrincipal.parametros)
      const fichaActual = state.getFichaProductoActivo();
      const fichaGuardada: FichaProductoDef = {
        ...fichaActual,
        muebleId: cleanNombre,
        titulo: cleanNombre,
        descripcionCorta: datos.descripcion || fichaActual.descripcionCorta,
      };
      
      const disenosDesdeInst = (instPrincipal && Array.isArray(instPrincipal.disenos)) ? instPrincipal.disenos : [];
      const disenosDesdeMueble = Array.isArray(state.muebleActivoGuardado?.disenos) ? state.muebleActivoGuardado!.disenos! : [];
      const mapaDisenos = new Map<string, DisenoEncapsulado3BF>();
      disenosDesdeMueble.forEach((d) => mapaDisenos.set(d.id, d));
      disenosDesdeInst.forEach((d) => mapaDisenos.set(d.id, d));
      const disenosVivos: DisenoEncapsulado3BF[] = Array.from(mapaDisenos.values());

      const disenoActivoVivo = (instPrincipal && instPrincipal.disenoActivoId) || state.muebleActivoGuardado?.disenoActivoId || null;

      const camaraActual =
        (typeof window !== "undefined" && (window as any).__obtenerCamaraActual3BF
          ? (window as any).__obtenerCamaraActual3BF()
          : null) ||
        state.camaraEscena ||
        state.muebleActivoGuardado?.camara;
      const modoVisualActual = state.modoVisual || state.muebleActivoGuardado?.modoVisual || "semitransparente";

      const sanitizedInst: Record<string, ObjetoInstancia3BF> = {};
      for (const [k, v] of Object.entries(rawInst)) {
        const disenosInst = (v.disenos && v.disenos.length > 0) ? v.disenos : disenosVivos;
        sanitizedInst[k] = {
          ...v,
          posicion: Array.isArray(v.posicion) ? [...v.posicion] : [0, 0, 0],
          rotacion: Array.isArray(v.rotacion) ? [...v.rotacion] : [0, 0, 0],
          parametros: { ...(v.parametros || {}) },
          resultado: v.resultado ? purgarResultadoGeometria(v.resultado) : undefined,
          disenos: disenosInst,
          disenoActivoId: v.disenoActivoId || disenoActivoVivo,
          gruposColapsados: v.gruposColapsados || state.muebleActivoGuardado?.gruposColapsados || {},
          modoVisual: modoVisualActual as any,
        };
      }

      const pasosAClonar = state.pasosManual && state.pasosManual.length > 0 
        ? state.pasosManual 
        : (state.muebleActivoGuardado?.pasosManual || generarPasosManualesPorDefecto());

      const nuevoMueble: MuebleGuardadoItem = {
        id,
        nombre: cleanNombre,
        marca: datos.marca,
        tipologia: datos.tipologia,
        rutaCarpeta,
        fechaGuardado: new Date().toISOString(),
        thumbnail,
        descripcionComercial: datos.descripcion || `Mueble diseñado en 3dBimFab (${datos.marca})`,
        instancias: sanitizedInst,
        disenos: disenosVivos,
        disenoActivoId: disenoActivoVivo,
        fichaConfig,
        fichaProducto: fichaGuardada,
        totalPiezas: despieceGlobal.reduce((acc, p) => acc + (p.cantidad || 1), 0),
        pasosManual: pasosAClonar,
        manualVinculadoId: safeName,
        camara: camaraActual,
        gruposColapsados: instPrincipal?.gruposColapsados || state.muebleActivoGuardado?.gruposColapsados || {},
        modoVisual: modoVisualActual as any,
      };

      if (typeof window !== "undefined" && window.localStorage) {
        try {
          if (camaraActual) localStorage.setItem(`3bf_camara_${id}`, JSON.stringify(camaraActual));
          localStorage.setItem(`3bf_modo_visual_${id}`, modoVisualActual);
          localStorage.setItem("3bf_modo_visual", modoVisualActual);
        } catch {}
      }

      // Guardar en Store y localStorage
      state.actualizarFichaProducto(cleanNombre, fichaGuardada);
      state.actualizarFichaProducto(id, fichaGuardada);
      state.setFichaConfig(cleanNombre, fichaConfig);
      state.setFichaConfig(id, fichaConfig);

      set((s) => ({
        mueblesGuardados: [nuevoMueble, ...s.mueblesGuardados.filter((m) => m.id !== id && m.nombre !== cleanNombre)],
        muebleActivoGuardado: nuevoMueble,
        modalGuardarComoAbierto: false,
      }));

      // 1. Guardar archivo 3D .3bf.json en Google Drive
      try {
        const payloadDisco = sanitizarMuebleParaDisco(nuevoMueble);
        const res = await fetch("/api/drive/muebles", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "save_furniture", furniture: payloadDisco }),
          signal: AbortSignal.timeout(10000),
        });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          console.warn("[3dBimFab] Advertencia guardando nuevo mueble en Drive:", res.status, errData);
        }
      } catch (err) {
        console.warn("Mueble guardado en local:", err);
      }

      // 2. Guardar archivo hermano .3bm.json de animación con el MISMO nombre en la MISMA carpeta
      try {
        const manualPayload: Manual3BMProyecto = {
          id: safeName,
          muebleOrigenId: id,
          nombre: cleanNombre,
          marca: datos.marca,
          tipologia: datos.tipologia,
          fechaModificacion: new Date().toISOString(),
          parametrosMueble: { ...(instPrincipal?.parametros || state.parametros) },
          pasos: pasosAClonar,
        };
        await fetch("/api/drive/manuales", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "save_manual", manual: manualPayload }),
          signal: AbortSignal.timeout(10000),
        });
        set({ manualActivoGuardado: manualPayload });
        guardarPasosEnCacheLocal(pasosAClonar, manualPayload);
      } catch (errM) {
        console.warn("Manual hermano guardado en local:", errM);
      }

      if (typeof window !== "undefined" && window.localStorage) {
        localStorage.setItem("3bf_ultimo_mueble_id", id);
      }

      return true;
    } catch (err) {
      console.error("Error al guardar mueble:", err);
      return false;
    } finally {
      set({ guardandoMueble: false });
    }
  },

  guardarProyectoCompleto: async () => {
    const initialState = get();
    if (!initialState.muebleActivoGuardado) {
      set({ modalGuardarComoAbierto: true });
      return false;
    }

    set({ guardandoMueble: true, guardandoManual: true });
    try {
      // 🛡️ 0. Si hay algún debounce pendiente en vuelo, ejecutarlo y esperar su cómputo antes de serializar
      const pendingTimers = (globalThis as any).__3bf_debounce_timers;
      if (pendingTimers && typeof pendingTimers === "object") {
        const pendingIds = Object.keys(pendingTimers);
        for (const pId of pendingIds) {
          clearTimeout(pendingTimers[pId]);
          delete pendingTimers[pId];
          await get().recomputarInstancia(pId);
        }
      }

      const state = get();
      if (!state.muebleActivoGuardado) return false;

      const cleanNombre = state.muebleActivoGuardado.nombre.trim();
      const safeName = cleanNombre.replace(/[\\/:*?"<>|]/g, "_");
      const id = safeName;
      const marca = state.muebleActivoGuardado.marca || "RTA Design";
      const tipologia = state.muebleActivoGuardado.tipologia || "Muebles";

      // Sanitizar instancias y consolidar colecciones de diseños vivos
      const rawInst = state.instancias || {};
      const targetInstId = state.objetoActivoId || Object.keys(rawInst)[0];
      const instPrincipal = targetInstId ? rawInst[targetInstId] : Object.values(rawInst)[0];

      const defKey = instPrincipal?.definitionId || state.parametros.model_id || cleanNombre;
      const fichaConfig =
        state.fichasConfig?.[cleanNombre] ||
        state.fichasConfig?.[id] ||
        state.fichasConfig?.[defKey] ||
        state.muebleActivoGuardado?.fichaConfig ||
        state.getFichaConfig(defKey);
      const despieceGlobal = state.getDespieceGlobal();

      let thumbnail = state.muebleActivoGuardado.thumbnail;
      if (typeof window !== "undefined" && (window as any).__capturarThumbnail3BF) {
        const nuevoThumb = (window as any).__capturarThumbnail3BF();
        if (nuevoThumb) thumbnail = nuevoThumb;
      }

      const disenosDesdeInst = (instPrincipal && Array.isArray(instPrincipal.disenos)) ? instPrincipal.disenos : [];
      const disenosDesdeMueble = Array.isArray(state.muebleActivoGuardado?.disenos) ? state.muebleActivoGuardado!.disenos! : [];
      const mapaDisenos = new Map<string, DisenoEncapsulado3BF>();

      const agregarOActualizarDiseno = (d: DisenoEncapsulado3BF) => {
        const existente = mapaDisenos.get(d.id);
        if (!existente) {
          mapaDisenos.set(d.id, d);
          return;
        }
        const entranteTieneMallas = !!(d.resultado && Array.isArray(d.resultado.real_meshes) && d.resultado.real_meshes.length > 0);
        const existenteTieneMallas = !!(existente.resultado && Array.isArray(existente.resultado.real_meshes) && existente.resultado.real_meshes.length > 0);
        if (entranteTieneMallas && !existenteTieneMallas) {
          mapaDisenos.set(d.id, d);
        } else if (entranteTieneMallas === existenteTieneMallas && (d.fecha || 0) >= (existente.fecha || 0)) {
          mapaDisenos.set(d.id, d);
        }
      };

      disenosDesdeMueble.forEach(agregarOActualizarDiseno);
      disenosDesdeInst.forEach(agregarOActualizarDiseno);
      const disenosVivos: DisenoEncapsulado3BF[] = Array.from(mapaDisenos.values());

      const disenoActivoVivo = (instPrincipal && instPrincipal.disenoActivoId) || state.muebleActivoGuardado?.disenoActivoId || null;

      const camaraActual =
        (typeof window !== "undefined" && (window as any).__obtenerCamaraActual3BF
          ? (window as any).__obtenerCamaraActual3BF()
          : null) ||
        state.camaraEscena ||
        state.muebleActivoGuardado?.camara;
      const modoVisualActual = state.modoVisual || state.muebleActivoGuardado?.modoVisual || "semitransparente";

      const sanitizedInst: Record<string, ObjetoInstancia3BF> = {};
      for (const [k, v] of Object.entries(rawInst)) {
        const disenosInst = (v.disenos && v.disenos.length > 0) ? v.disenos : disenosVivos;
        sanitizedInst[k] = {
          ...v,
          posicion: Array.isArray(v.posicion) ? [...v.posicion] : [0, 0, 0],
          rotacion: Array.isArray(v.rotacion) ? [...v.rotacion] : [0, 0, 0],
          parametros: { ...(v.parametros || {}) },
          resultado: v.resultado ? purgarResultadoGeometria(v.resultado) : undefined,
          disenos: disenosInst,
          disenoActivoId: v.disenoActivoId || disenoActivoVivo,
          gruposColapsados: v.gruposColapsados || state.muebleActivoGuardado?.gruposColapsados || {},
          modoVisual: modoVisualActual as any,
        };
      }

      // getFichaProductoActivo() ya sincroniza automáticamente la receta activa con instPrincipal.parametros
      const fichaActual = state.getFichaProductoActivo();
      const pasosActuales = state.pasosManual || [];

      // 1. Objeto Mueble (.3bf.json)
      const muebleActualizado: MuebleGuardadoItem = {
        ...state.muebleActivoGuardado,
        id,
        nombre: cleanNombre,
        marca,
        tipologia,
        fechaGuardado: new Date().toISOString(),
        thumbnail,
        instancias: sanitizedInst,
        disenos: disenosVivos,
        disenoActivoId: disenoActivoVivo,
        fichaConfig,
        fichaProducto: fichaActual,
        totalPiezas: despieceGlobal.reduce((acc, p) => acc + (p.cantidad || 1), 0),
        pasosManual: pasosActuales,
        manualVinculadoId: safeName,
        camara: camaraActual,
        gruposColapsados: instPrincipal?.gruposColapsados || state.muebleActivoGuardado?.gruposColapsados || {},
        modoVisual: modoVisualActual as any,
      };

      if (typeof window !== "undefined" && window.localStorage) {
        try {
          if (camaraActual) localStorage.setItem(`3bf_camara_${id}`, JSON.stringify(camaraActual));
          localStorage.setItem(`3bf_modo_visual_${id}`, modoVisualActual);
          localStorage.setItem("3bf_modo_visual", modoVisualActual);
        } catch {}
      }

      // 2. Objeto Manual (.3bm.json)
      const manualPayload: Manual3BMProyecto = {
        id: safeName,
        muebleOrigenId: id,
        nombre: cleanNombre,
        marca,
        tipologia,
        fechaModificacion: new Date().toISOString(),
        parametrosMueble: { ...(instPrincipal?.parametros || state.parametros) },
        pasos: pasosActuales,
      };

      state.actualizarFichaProducto(cleanNombre, fichaActual);
      state.actualizarFichaProducto(id, fichaActual);
      state.setFichaConfig(cleanNombre, fichaConfig);
      state.setFichaConfig(id, fichaConfig);

      set((s) => ({
        mueblesGuardados: s.mueblesGuardados.map((m) => (m.id === state.muebleActivoGuardado!.id || m.id === id ? muebleActualizado : m)),
        muebleActivoGuardado: muebleActualizado,
        manualActivoGuardado: manualPayload,
        instancias: sanitizedInst,
        resultado: purgarResultadoGeometria(s.resultado),
      }));

      // Guardar .3bf.json en Drive
      try {
        const payloadDisco = sanitizarMuebleParaDisco(muebleActualizado);
        const res = await fetch("/api/drive/muebles", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "save_furniture", furniture: payloadDisco }),
          signal: AbortSignal.timeout(10000),
        });
        if (!res.ok) {
          console.warn("[3dBimFab] Advertencia al guardar .3bf en Drive:", res.status);
        }
      } catch (err3bf) {
        console.warn("Mueble .3bf guardado en local:", err3bf);
      }

      // Guardar .3bm.json en Drive (misma carpeta)
      try {
        await fetch("/api/drive/manuales", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "save_manual", manual: manualPayload }),
          signal: AbortSignal.timeout(10000),
        });
      } catch (errManual) {
        console.warn("Manual .3bm guardado en local:", errManual);
      }

      if (typeof window !== "undefined" && window.localStorage) {
        localStorage.setItem("3bf_ultimo_mueble_id", id);
      }
      guardarPasosEnCacheLocal(pasosActuales, manualPayload);

      return true;
    } catch (err) {
      console.error("Error al guardar proyecto completo:", err);
      return false;
    } finally {
      set({ guardandoMueble: false, guardandoManual: false });
    }
  },

  guardarCambiosMueble: async () => {
    return await get().guardarProyectoCompleto();
  },

  renombrarMuebleGuardado: async (id: string, nuevoNombre: string) => {
    const clean = nuevoNombre.trim();
    if (!clean) return false;

    set((state) => ({
      mueblesGuardados: state.mueblesGuardados.map((m) =>
        m.id === id ? { ...m, nombre: clean } : m
      ),
      muebleActivoGuardado:
        state.muebleActivoGuardado?.id === id
          ? { ...state.muebleActivoGuardado, nombre: clean }
          : state.muebleActivoGuardado,
    }));

    try {
      await fetch("/api/drive/muebles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "rename_furniture", id, nuevoNombre: clean }),
      });
    } catch (e) {
      console.warn("Renombrado persistido localmente:", e);
    }
    return true;
  },

  actualizarThumbnailMueble: async (id: string, thumbnail: string) => {
    set((state) => ({
      mueblesGuardados: state.mueblesGuardados.map((m) =>
        m.id === id ? { ...m, thumbnail } : m
      ),
      muebleActivoGuardado:
        state.muebleActivoGuardado?.id === id
          ? { ...state.muebleActivoGuardado, thumbnail }
          : state.muebleActivoGuardado,
    }));

    try {
      await fetch("/api/drive/muebles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "update_thumbnail", id, thumbnail }),
      });
    } catch (e) {
      console.warn("Actualización de thumbnail persistida localmente:", e);
    }
    return true;
  },

  eliminarMuebleGuardado: async (id: string) => {
    set((state) => ({
      mueblesGuardados: state.mueblesGuardados.filter((m) => m.id !== id),
      muebleActivoGuardado:
        state.muebleActivoGuardado?.id === id ? null : state.muebleActivoGuardado,
    }));

    try {
      await fetch("/api/drive/muebles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete_furniture", id }),
      });
    } catch (e) {
      console.warn("Eliminación persistida localmente:", e);
    }
    return true;
  },

  duplicarMuebleGuardado: async (id: string) => {
    const state = get();
    const original = state.mueblesGuardados.find((m) => m.id === id);
    if (!original) return null;

    // Generar nombre único agregando _Copia
    const baseNombre = original.nombre.replace(/_Copia(\s*\d+)?$/, "");
    let nuevoNombre = `${original.nombre}_Copia`;
    
    // Si ya existe un mueble con ese nombre, calcular correlativo _Copia 2, _Copia 3, etc.
    const nombresExistentes = new Set(state.mueblesGuardados.map((m) => m.nombre));
    if (nombresExistentes.has(nuevoNombre)) {
      let index = 2;
      while (nombresExistentes.has(`${baseNombre}_Copia ${index}`)) {
        index++;
      }
      nuevoNombre = `${baseNombre}_Copia ${index}`;
    }

    const nuevoId = `mueble_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    
    // Clonar instancias en profundidad
    const rawInst = original.instancias || {};
    const clonInstancias: Record<string, ObjetoInstancia3BF> = {};
    for (const [k, v] of Object.entries(rawInst)) {
      clonInstancias[k] = {
        ...v,
        posicion: Array.isArray(v.posicion) ? [...v.posicion] : [0, 0, 0],
        rotacion: Array.isArray(v.rotacion) ? [...v.rotacion] : [0, 0, 0],
        parametros: { ...(v.parametros || {}) },
      };
    }

    const muebleDuplicado: MuebleGuardadoItem = {
      ...original,
      id: nuevoId,
      nombre: nuevoNombre,
      fechaGuardado: new Date().toISOString(),
      instancias: clonInstancias,
      fichaConfig: original.fichaConfig ? JSON.parse(JSON.stringify(original.fichaConfig)) : undefined,
    };

    set((s) => ({
      mueblesGuardados: [muebleDuplicado, ...s.mueblesGuardados],
    }));

    try {
      await fetch("/api/drive/muebles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "save_furniture", furniture: muebleDuplicado }),
      });
    } catch (err) {
      console.warn("Mueble duplicado persistido en local:", err);
    }

    return nuevoId;
  },

  abrirMueble: async (mueble: MuebleGuardadoItem) => {
    if (!mueble) return;

    let targetMueble = mueble;
    // 🛡️ SIEMPRE consultar el archivo .3bf.json completo y fresco desde disco (sin caché de navegador)
    // para garantizar que las modificaciones recién guardadas se carguen al 100%.
    try {
      const res = await fetch(
        `/api/drive/muebles?action=get_furniture&id=${encodeURIComponent(targetMueble.id)}&_t=${Date.now()}`,
        { cache: "no-store" }
      );
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.furniture) {
          targetMueble = data.furniture;
        }
      }
    } catch (err) {
      console.error("[3dBimFab] Error cargando datos completos del mueble desde disco, usando respaldo en memoria:", err);
    }

    // 1. Restaurar y sanitizar instancias en el Store (purgando cualquier duplicado persistente)
    const rawInst = targetMueble.instancias || {};
    const restoredInstancias: Record<string, ObjetoInstancia3BF> = {};
    for (const [k, v] of Object.entries(rawInst)) {
      const cleanParams = { ...(v.parametros || {}) };
      // Eliminar llaves sin prefijo numérico contaminadas de versiones previas para que nunca interfieran con piezas numeradas
      delete (cleanParams as any)["canto_frontal"];
      delete (cleanParams as any)["canto_trasero"];
      delete (cleanParams as any)["canto_izquierdo_-_arriba"];
      delete (cleanParams as any)["canto_derecho_-_abajo"];
      delete (cleanParams as any)["lado_balance"];
      delete (cleanParams as any)["mapeado"];

      let fallbackColapsados: Record<string, boolean> = {};
      if (typeof window !== "undefined" && window.localStorage) {
        try {
          const raw = localStorage.getItem(`3bf_grupos_colapsados_${targetMueble.id}`) ||
                      localStorage.getItem(`3bf_grupos_colapsados_${v.definitionId}`);
          if (raw) fallbackColapsados = JSON.parse(raw);
        } catch {}
      }
      const colapsadosGuardados =
        (v.gruposColapsados && Object.keys(v.gruposColapsados).length > 0 ? v.gruposColapsados : null) ||
        (targetMueble.gruposColapsados && Object.keys(targetMueble.gruposColapsados).length > 0 ? targetMueble.gruposColapsados : null) ||
        fallbackColapsados;

      restoredInstancias[k] = {
        ...v,
        posicion: Array.isArray(v.posicion) ? [...v.posicion] : [0, 0, 0],
        rotacion: Array.isArray(v.rotacion) ? [...v.rotacion] : [0, 0, 0],
        parametros: cleanParams,
        resultado: v.resultado ? purgarResultadoGeometria(v.resultado) : undefined,
        disenos: v.disenos || targetMueble.disenos || [],
        disenoActivoId: v.disenoActivoId || targetMueble.disenoActivoId || null,
        gruposColapsados: colapsadosGuardados,
      };
    }
    const firstKey = Object.keys(restoredInstancias)[0] || null;
    const firstInst = firstKey ? restoredInstancias[firstKey] : null;
    const cleanNombre = targetMueble.nombre.trim();

    // 2. Restaurar ficha técnica y comercial si existe (registrando bajo nombre, id y definitionId real)
    if (targetMueble.fichaConfig) {
      get().setFichaConfig(cleanNombre, targetMueble.fichaConfig);
      get().setFichaConfig(targetMueble.id, targetMueble.fichaConfig);
      if (firstInst?.definitionId) {
        get().setFichaConfig(firstInst.definitionId, targetMueble.fichaConfig);
      }
      if (firstInst?.parametros?.model_id) {
        get().setFichaConfig(String(firstInst.parametros.model_id), targetMueble.fichaConfig);
      }
    }

    // 🛡️ SOBERANÍA DE INSTANCIA AL ABRIR:
    // Sincronizar la receta de color activa de fichaProducto con los parámetros guardados en la instancia (`firstInst.parametros`)
    // para que `aplicarRecetaColor` NUNCA sobreescriba los cantos o parámetros guardados en la instancia con valores viejos.
    let fichaProductoSincronizada = targetMueble.fichaProducto;
    if (fichaProductoSincronizada && firstInst?.parametros) {
      const activeRecetaId =
        fichaProductoSincronizada.recetaColorActivaId ||
        fichaProductoSincronizada.recetasColor?.[0]?.id;
      if (activeRecetaId && Array.isArray(fichaProductoSincronizada.recetasColor)) {
        fichaProductoSincronizada = {
          ...fichaProductoSincronizada,
          recetaColorActivaId: activeRecetaId,
          recetasColor: fichaProductoSincronizada.recetasColor.map((r) =>
            r.id === activeRecetaId
              ? { ...r, parametros: { ...firstInst.parametros } }
              : r
          ),
        };
      }
    }

    if (fichaProductoSincronizada) {
      const idKey = targetMueble.id;
      set((s) => ({
        fichasProducto: {
          ...s.fichasProducto,
          [cleanNombre]: fichaProductoSincronizada!,
          [idKey]: fichaProductoSincronizada!
        }
      }));
    }

    let modoVisualRestaurado: any = targetMueble.modoVisual || firstInst?.modoVisual;
    if (!modoVisualRestaurado && typeof window !== "undefined" && window.localStorage) {
      try {
        modoVisualRestaurado =
          localStorage.getItem(`3bf_modo_visual_${targetMueble.id}`) ||
          localStorage.getItem("3bf_modo_visual");
      } catch {}
    }
    modoVisualRestaurado = modoVisualRestaurado || get().modoVisual || "semitransparente";

    let camaraRestaurada = targetMueble.camara || null;
    if (!camaraRestaurada && typeof window !== "undefined" && window.localStorage) {
      try {
        const rawCam = localStorage.getItem(`3bf_camara_${targetMueble.id}`);
        if (rawCam) {
          const parsedCam = JSON.parse(rawCam);
          if (Array.isArray(parsedCam?.position) && Array.isArray(parsedCam?.target)) {
            camaraRestaurada = parsedCam;
          }
        }
      } catch {}
    }

    if (typeof window !== "undefined" && window.localStorage) {
      try {
        localStorage.setItem("3bf_modo_visual", modoVisualRestaurado);
        localStorage.setItem(`3bf_modo_visual_${targetMueble.id}`, modoVisualRestaurado);
      } catch {}
    }

    set({
      instancias: restoredInstancias,
      objetoActivoId: firstKey,
      objetoSeleccionado: !!firstKey,
      muebleActivoGuardado: {
        ...targetMueble,
        fichaProducto: fichaProductoSincronizada || targetMueble.fichaProducto,
        instancias: restoredInstancias,
        disenos: targetMueble.disenos || (firstKey ? restoredInstancias[firstKey]?.disenos : []) || [],
        disenoActivoId: targetMueble.disenoActivoId || (firstKey ? restoredInstancias[firstKey]?.disenoActivoId : null),
        modoVisual: modoVisualRestaurado,
        camara: camaraRestaurada || targetMueble.camara,
      },
      escenarioLimpio: false,
      pestanaActiva: "3d",
      modoVisual: modoVisualRestaurado,
      resultado: firstInst?.resultado ? purgarResultadoGeometria(firstInst.resultado) : null,
      parametros: firstInst?.parametros ? (firstInst.parametros as any) : get().parametros,
      camaraEscena: camaraRestaurada,
    });

    if (camaraRestaurada && typeof window !== "undefined" && (window as any).__aplicarCamaraGuardada3BF) {
      (window as any).__aplicarCamaraGuardada3BF(camaraRestaurada);
    }

    // 🎨 Inyectar diseños directamente en IndexedDB aislados por el ID único del mueble
    const coleccionDisenos = targetMueble.disenos || (firstKey ? restoredInstancias[firstKey]?.disenos : []) || [];
    if (typeof window !== "undefined" && Array.isArray(coleccionDisenos) && coleccionDisenos.length > 0) {
      const storageEntityId = `mueble_${targetMueble.id}`;
      saveDisenosToIndexedDB(storageEntityId, coleccionDisenos).catch(() => {});
    }

    // Si la ficha guardada tiene una receta activa, aplicarla (restaurará capas y materiales con parámetros ya sincronizados)
    if (fichaProductoSincronizada?.recetaColorActivaId) {
      get().aplicarRecetaColor(cleanNombre, fichaProductoSincronizada.recetaColorActivaId);
    }

    // 2.2 Vinculación Inteligente con el Manual 3D (.3bm)
    const manualVinculadoId = targetMueble.manualVinculadoId || `manual_${cleanNombre.toLowerCase().replace(/[^a-z0-9]/gi, "_")}`;
    
    // Asegurar que la lista de manuales en Drive esté cargada si aún está vacía
    let manualesList = get().manualesDrive || [];
    if (!manualesList || manualesList.length === 0) {
      try {
        await get().cargarManualesDesdeDrive();
        manualesList = get().manualesDrive || [];
      } catch (eDrive) {
        console.warn("[3dBimFab] Error cargando lista de manuales en abrirMueble:", eDrive);
      }
    }

    const scoreCandidate = (m: any) => {
      const matchId = m.muebleOrigenId === targetMueble.id ? 100 : 0;
      const matchMarca = (m.marca && targetMueble.marca && m.marca.toLowerCase() === targetMueble.marca.toLowerCase()) ? 50 : 0;
      const matchManualId = m.id === manualVinculadoId ? 25 : 0;
      const matchNombre = (m.nombre && cleanNombre && m.nombre.toLowerCase() === cleanNombre.toLowerCase()) ? 20 : 0;
      const pasosCount = Array.isArray(m.pasos) ? m.pasos.length : 0;
      const p00 = m.pasos?.find((p: any) => p.id === "P00");
      const gruposCount = p00?.showcase?.gruposCinematicos?.length || 0;
      return matchId + matchMarca + matchManualId + matchNombre + (pasosCount * 10) + gruposCount;
    };

    let candidates = (manualesList || []).filter(
      (m: any) =>
        m.muebleOrigenId === targetMueble.id ||
        m.id === manualVinculadoId ||
        m.nombre?.toLowerCase() === cleanNombre.toLowerCase() ||
        (cleanNombre.toLowerCase().includes("comoda") && m.id === "manual_1_comoda_ravenna")
    );

    candidates.sort((a: any, b: any) => scoreCandidate(b) - scoreCandidate(a));
    let manualEnDrive = candidates[0] || null;

    // Si aún no se encontró en la lista de memoria o el candidato tiene solo 1 paso pero el mueble tampoco tiene pasos, consultar directamente al endpoint
    if ((!manualEnDrive || manualEnDrive.pasos?.length <= 1) && (!targetMueble.pasosManual || targetMueble.pasosManual.length <= 1)) {
      try {
        const resM = await fetch("/api/drive/manuales");
        if (resM.ok) {
          const datM = await resM.json();
          if (datM.manuales && Array.isArray(datM.manuales)) {
            set({ manualesDrive: datM.manuales });
            const directCandidates = datM.manuales.filter(
              (m: any) =>
                m.muebleOrigenId === targetMueble.id ||
                m.id === manualVinculadoId ||
                m.nombre?.toLowerCase() === cleanNombre.toLowerCase() ||
                (cleanNombre.toLowerCase().includes("comoda") && m.id === "manual_1_comoda_ravenna")
            );
            directCandidates.sort((a: any, b: any) => scoreCandidate(b) - scoreCandidate(a));
            if (directCandidates.length > 0) {
              manualEnDrive = directCandidates[0];
            }
          }
        }
      } catch {}
    }

    const mueblePasos = targetMueble.pasosManual && targetMueble.pasosManual.length > 0 ? targetMueble.pasosManual : null;
    const drivePasos = manualEnDrive?.pasos && manualEnDrive.pasos.length > 0 ? manualEnDrive.pasos : null;

    let pasosFinales: PasoManualStudio[];
    if (mueblePasos && drivePasos) {
      const p00Drive = drivePasos.find((p: any) => p.id === "P00");
      const p00Mueble = mueblePasos.find((p: any) => p.id === "P00");
      const gruposDrive = p00Drive?.showcase?.gruposCinematicos?.length || 0;
      const gruposMueble = p00Mueble?.showcase?.gruposCinematicos?.length || 0;
      if (drivePasos.length > mueblePasos.length || gruposDrive >= gruposMueble) {
        pasosFinales = drivePasos;
      } else {
        pasosFinales = mueblePasos;
      }
    } else if (drivePasos) {
      pasosFinales = drivePasos;
    } else if (mueblePasos) {
      pasosFinales = mueblePasos;
    } else {
      pasosFinales = generarPasosManualesPorDefecto();
    }

    pasosFinales = sanitizarPasosManuales(pasosFinales);

    const manualActivo: Manual3BMProyecto = {
      id: manualEnDrive?.id || manualVinculadoId,
      muebleOrigenId: targetMueble.id,
      nombre: cleanNombre,
      marca: targetMueble.marca || "RTA Design",
      tipologia: targetMueble.tipologia || "Manuales 3D",
      fechaModificacion: new Date().toISOString(),
      parametrosMueble: { ...get().parametros },
      pasos: pasosFinales,
    };

    set({
      pasosManual: pasosFinales,
      pasoActivoManualId: pasosFinales[0]?.id || "P00",
      manualActivoGuardado: manualActivo,
    });

    guardarPasosEnCacheLocal(pasosFinales, manualActivo);
    if (typeof window !== "undefined" && window.localStorage) {
      localStorage.setItem("3bf_ultimo_mueble_id", targetMueble.id);
    }

    // 3. Recomputar si alguna instancia no tiene geometría 3D guardada o si el .ghx en disco tiene piezas/salidas nuevas
    const requiereComputo = Object.values(restoredInstancias).some(
      (inst) => !inst.resultado || !inst.resultado.real_meshes || inst.resultado.real_meshes.length === 0
    );

    if (requiereComputo) {
      await get().recomputarTodas();
    } else {
      for (const inst of Object.values(restoredInstancias)) {
        try {
          const metaRes = await fetch("/api/metadata", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              model_id: inst.definitionId,
              custom_filename: inst.archivo,
            }),
          });
          if (metaRes.ok) {
            const meta = await metaRes.json();
            const diskOutputs: string[] = meta.declared_outputs || [];
            const savedOutputs: string[] = inst.resultado?.declared_outputs || [];
            const hasNewOutputs = diskOutputs.some((o) => !savedOutputs.includes(o));
            if (hasNewOutputs || (diskOutputs.length > 0 && diskOutputs.length !== savedOutputs.length)) {
              console.log(`[3dBimFab] 🔄 Detectadas nuevas salidas GHX en disco para '${inst.id}' (${savedOutputs.length} -> ${diskOutputs.length}). Recalculando geometría 3D...`);
              await get().recargarDefinicionInstancia(inst.id, true);
              try {
                await get().guardarCambiosMueble();
              } catch (eSave) {
                console.warn("[3dBimFab] Aviso al auto-guardar mueble actualizado:", eSave);
              }
            }
          }
        } catch {}
      }
    }
    get().guardarEstadoHistorial();
  },

  purgarMallasDuplicadas: () => {
    const state = get();
    const nuevoResultado = purgarResultadoGeometria(state.resultado);

    const nuevasInstancias: Record<string, ObjetoInstancia3BF> = {};
    Object.entries(state.instancias).forEach(([id, inst]) => {
      nuevasInstancias[id] = {
        ...inst,
        resultado: purgarResultadoGeometria(inst.resultado),
      };
    });

    let nuevoMuebleActivo = state.muebleActivoGuardado;
    if (nuevoMuebleActivo && nuevoMuebleActivo.instancias) {
      const instanciasMueble: Record<string, ObjetoInstancia3BF> = {};
      Object.entries(nuevoMuebleActivo.instancias).forEach(([id, inst]) => {
        instanciasMueble[id] = {
          ...inst,
          resultado: purgarResultadoGeometria(inst.resultado),
        };
      });
      nuevoMuebleActivo = {
        ...nuevoMuebleActivo,
        instancias: instanciasMueble,
      };
    }

    set({
      resultado: nuevoResultado,
      instancias: nuevasInstancias,
      muebleActivoGuardado: nuevoMuebleActivo,
    });

    get().guardarEstadoHistorial();
  },


  // 🧪 3BF PBR Material Studio & Shader Ball Lab
  modalPBRStudioAbierto: false,
  setModalPBRStudioAbierto: (abierto) => set({ modalPBRStudioAbierto: abierto }),
  materialEnCalibracion: null,
  setMaterialEnCalibracion: (mat) => set({ materialEnCalibracion: mat }),
  abrirPBRStudioParaMaterial: (materialId) => {
    const state = get();
    const targetId = materialId || state.materialSeleccionadoId || "mat_duna";
    const mat = state.materialesPBR.find((m) => m.id === targetId) || state.materialesPBR[0];
    if (mat) {
      set({
        materialEnCalibracion: JSON.parse(JSON.stringify(mat)),
        materialSeleccionadoId: mat.id,
        modalPBRStudioAbierto: true,
      });
    }
  },
  aplicarMaterialAMuebleActivo: (materialId) => {
    const state = get();
    const mat = state.materialesPBR.find((m) => m.id === materialId);
    if (!mat) return;

    // 1. Asignar el material a la capa Tono y Capa Madera para que todas las piezas por defecto lo adopten (excluyendo Tono Fondo)
    const capasActualizadas = state.capas.map((c) => {
      if (c.id === "capa_tono" || (c.nombre.toLowerCase().includes("tono") && !c.id.includes("fondo") && !c.nombre.toLowerCase().includes("fondo")) || c.id === "capa_madera") {
        return { ...c, materialId: mat.id };
      }
      return c;
    });

    // 2. Extraer todas las partes conocidas del modelo activo
    const res = state.resultado;
    const salidas = res?.declared_outputs || [];
    const mallas = (res?.real_meshes || []).map((m: any) => m.name);
    const todasLasPartes = Array.from(new Set([...Object.keys(state.asignacionesPartes), ...salidas, ...mallas])).filter(Boolean);

    const nuevasAsignaciones = { ...state.asignacionesPartes };
    todasLasPartes.forEach((parteKey) => {
      const kLow = parteKey.toLowerCase();
      const isHardware = kLow.includes("perno") || kLow.includes("caja") || kLow.includes("tarugo") || kLow.includes("cavilha") || kLow.includes("tornillo") || kLow.includes("parafuso") || kLow.includes("prego") || kLow.includes("puntilla") || kLow.includes("clavo") || kLow.includes("soporte") || kLow.includes("suporte") || kLow.includes("corredi") || kLow.includes("corredera") || kLow.includes("trilho") || kLow.includes("cantoneira") || kLow.includes("angulo") || kLow.includes("pes") || kLow.includes("pata") || kLow.includes("maquinado") || kLow.includes("porca") || kLow.includes("tuerca") || kLow.includes("tampa") || kLow.includes("tapa") || kLow.includes("adesivo");
      const isMdfMdp = kLow.includes("mdf") || kLow.includes("mdp");
      const isFondo = (
        kLow.includes("fondo") ||
        kLow.includes("fundo") ||
        kLow.includes("costa") ||
        kLow.includes("costas") ||
        kLow.includes("espaldar") ||
        kLow.includes("trasera") ||
        kLow.includes("back") ||
        kLow.includes("peça 15") ||
        kLow.includes("peca 15") ||
        kLow.includes("pk15") ||
        kLow.includes("peça 18") ||
        kLow.includes("peca 18") ||
        kLow.includes("pk18")
      ) && !isMdfMdp;
      const isBalance = (
        kLow.includes("balance") ||
        kLow.includes("equilibrio") ||
        kLow.includes("reverso") ||
        kLow.endsWith(" b") ||
        kLow.endsWith("_b") ||
        kLow.endsWith("-b") ||
        /pe[cç]a\s*\d+\s*b$/i.test(kLow) ||
        /pk\s*\d+\s*b$/i.test(kLow)
      );
      if (!isHardware && !isMdfMdp) {
        nuevasAsignaciones[parteKey] = {
          ...(nuevasAsignaciones[parteKey] || {
            parteKey,
            nombreVisible: parteKey.replace(/^RH_OUT:/, ""),
            visible: true,
          }),
          capaId: (isFondo && isBalance) ? "capa_mdf" : isBalance ? "capa_back" : isFondo ? "capa_tono_fondo" : "capa_tono",
          materialId: "por_capa",
        };
      }
    });

    if (typeof window !== "undefined" && window.localStorage) {
      localStorage.setItem("3bf_asignaciones_partes_v1", JSON.stringify(nuevasAsignaciones));
      localStorage.setItem("3bf_capas_v1", JSON.stringify(capasActualizadas));
    }
    set({ asignacionesPartes: nuevasAsignaciones, capas: capasActualizadas, materialSeleccionadoId: mat.id });
  },

});
