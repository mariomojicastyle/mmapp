// @ts-nocheck
import {
  crearFichaEstandarLimpia,
  PRESET_MATERIALES_PBR,
  PRESET_CAPAS,
  PRESET_COLORES_CLARO,
  PRESET_COLORES_OSCURO,
  purgarResultadoGeometria,
  guardarPasosEnCacheLocal,
  generarPasosManualesPorDefecto,
} from "../storeDefaults";
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
    // 1. Si hay un mueble guardado activo en carpeta, prioridad absoluta a su ficha técnica personalizada
    if (state.muebleActivoGuardado) {
      if (state.muebleActivoGuardado.fichaProducto) {
        return state.muebleActivoGuardado.fichaProducto;
      }
      const idKey = state.muebleActivoGuardado.id;
      const nombreKey = state.muebleActivoGuardado.nombre.trim();
      if (state.fichasProducto[idKey]) return state.fichasProducto[idKey];
      if (state.fichasProducto[nombreKey]) return state.fichasProducto[nombreKey];
    }

    // 2. Si estamos en un componente inteligente de biblioteca:
    const objetoActivo = state.objetoActivoId ? state.instancias[state.objetoActivoId] : null;
    const muebleId = objetoActivo?.definitionId || "Componente Inteligente";
    const limpiaKey = muebleId.replace(/\.(gh|ghx)$/i, "").trim();

    // Si ya tiene una ficha personalizada modificada en esta sesión:
    if (state.fichasProducto[limpiaKey]) {
      return state.fichasProducto[limpiaKey];
    }

    // 3. De lo contrario, generar SIEMPRE la ficha estándar básica limpia con 1 solo color por defecto
    const capaTono = state.capas.find((c) => c.id === "capa_tono");
    const matTono = state.materialesPBR.find((m) => m.id === capaTono?.materialId);
    const colorPrimario = matTono?.colorBase || "#CBD5E1";

    const nuevaFicha = crearFichaEstandarLimpia(limpiaKey, objetoActivo?.nombreVisible || limpiaKey);
    if (nuevaFicha.recetasColor[0]) {
      nuevaFicha.recetasColor[0].swatch.colorPrimario = colorPrimario;

      // 🛡️ Capturar el 100% de las capas actuales del modelo en el color por defecto
      const todasLasCapas: Record<string, string> = {};
      state.capas.forEach((c) => {
        todasLasCapas[c.id] = c.materialId;
      });
      nuevaFicha.recetasColor[0].asignacionesCapaMaterial = todasLasCapas;

      // 🛡️ Capturar el 100% de las asignaciones de partes actuales en el color por defecto
      const todasLasPartes: Record<string, { capaId: string; materialId: string }> = {};
      Object.entries(state.asignacionesPartes).forEach(([k, v]) => {
        todasLasPartes[k] = { capaId: v.capaId, materialId: v.materialId };
      });
      nuevaFicha.recetasColor[0].asignacionesPartes = todasLasPartes;

      // 🛡️ Capturar el 100% de los parámetros de piezas actuales en el color por defecto
      nuevaFicha.recetasColor[0].parametros = { ...(objetoActivo?.parametros || state.parametros || {}) };
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
        if (prevPartes[parteKey]) {
          prevPartes[parteKey] = {
            ...prevPartes[parteKey],
            capaId: def.capaId,
            materialId: def.materialId
          };
        } else {
          prevPartes[parteKey] = {
            parteKey,
            nombreVisible: parteKey.replace(/^RH_OUT:/, ""),
            capaId: def.capaId,
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
          const allCapas = [...stored, ...missing];
          // 🛡️ Blindaje de Capa Tono: Si fue sobreescrita accidentalmente con un material de plástico o metal, restaurar mat_marfil
          const allMats = typeof window !== "undefined" && window.localStorage && localStorage.getItem("3bf_materiales_pbr_v1")
            ? JSON.parse(localStorage.getItem("3bf_materiales_pbr_v1")!)
            : PRESET_MATERIALES_PBR;
          return allCapas.map((c) => {
            if (c.id === "capa_tono") {
              const matActual = allMats.find((m: any) => m.id === c.materialId);
              if (matActual && (matActual.tipo === "Plastico" || matActual.tipo === "Metal" || matActual.nombre?.toLowerCase().includes("beige"))) {
                return { ...c, materialId: "mat_marfil" };
              }
            }
            if (c.id === "capa_tono_fondo") {
              const matActual = allMats.find((m: any) => m.id === c.materialId);
              if (!matActual || matActual.tipo === "Metal" || c.materialId === "mat_zinc" || c.materialId === "mat_acero") {
                return { ...c, materialId: "mat_offwhite" };
              }
            }
            return c;
          });
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

          let safeCapaId = v.capaId;
          if (kLow.includes("mdf")) {
            safeCapaId = "capa_mdf";
          } else if (isFondo && !kLow.includes("mdp")) {
            safeCapaId = "capa_tono_fondo";
          } else if (isBoard && isInvalidLayer) {
            if (kLow.includes("balance") || kLow.endsWith(" b") || /pe[cç]a\s*\d+\s*b$/i.test(kLow)) safeCapaId = "capa_back";
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
    const listaActualizada = get().capas.filter((c) => c.id !== id);
    if (typeof window !== "undefined" && window.localStorage) {
      localStorage.setItem("3bf_capas_v1", JSON.stringify(listaActualizada));
    }
    set({ capas: listaActualizada });
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
    if (typeof window !== "undefined" && window.localStorage) {
      try {
        localStorage.setItem("3bf_materiales_pbr_v1", JSON.stringify(listaActualizada));
      } catch (e) {
        try {
          // Fallback: Si supera cuota, omitir dataURIs pesados de mapas generados en localStorage
          const listaLigera = listaActualizada.map((m) => ({
            ...m,
            normalMapUrl: m.normalMapUrl?.startsWith("data:") ? null : m.normalMapUrl,
            roughnessMapUrl: m.roughnessMapUrl?.startsWith("data:") ? null : m.roughnessMapUrl,
            aoMapUrl: m.aoMapUrl?.startsWith("data:") ? null : m.aoMapUrl,
          }));
          localStorage.setItem("3bf_materiales_pbr_v1", JSON.stringify(listaLigera));
        } catch {
          console.warn("Storage cuota excedida: Materiales conservados en memoria Zustand.");
        }
      }
    }
    set({ materialesPBR: listaActualizada, materialSeleccionadoId: id });
    return id;
  },

  actualizarMaterialPBR: (id, cambios) => {
    const listaActualizada = get().materialesPBR.map((m) => (m.id === id ? { ...m, ...cambios } : m));
    if (typeof window !== "undefined" && window.localStorage) {
      try {
        localStorage.setItem("3bf_materiales_pbr_v1", JSON.stringify(listaActualizada));
      } catch (e) {
        try {
          // Fallback seguro contra cuota de 5MB
          const listaLigera = listaActualizada.map((m) => ({
            ...m,
            normalMapUrl: m.normalMapUrl?.startsWith("data:") ? null : m.normalMapUrl,
            roughnessMapUrl: m.roughnessMapUrl?.startsWith("data:") ? null : m.roughnessMapUrl,
            aoMapUrl: m.aoMapUrl?.startsWith("data:") ? null : m.aoMapUrl,
          }));
          localStorage.setItem("3bf_materiales_pbr_v1", JSON.stringify(listaLigera));
        } catch {
          console.warn("Storage cuota excedida: Materiales actualizados en memoria Zustand.");
        }
      }
    }
    set({ materialesPBR: listaActualizada });
  },

  eliminarMaterialPBR: (id) => {
    if (get().materialesPBR.length <= 1) return;
    const listaActualizada = get().materialesPBR.filter((m) => m.id !== id);
    const nuevoSel = listaActualizada[0]?.id || "";
    if (typeof window !== "undefined" && window.localStorage) {
      try {
        localStorage.setItem("3bf_materiales_pbr_v1", JSON.stringify(listaActualizada));
      } catch {
        console.warn("Storage cuota excedida al eliminar material.");
      }
    }
    set({ materialesPBR: listaActualizada, materialSeleccionadoId: nuevoSel });
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
          const tieneInstancias3D = Object.keys(state.instancias).length > 0;
          if (!state.muebleActivoGuardado && tieneInstancias3D && typeof window !== "undefined" && window.localStorage) {
            const ultimoId = localStorage.getItem("3bf_ultimo_mueble_id");
            if (ultimoId) {
              const targetMueble = (data.muebles as MuebleGuardadoItem[]).find(
                (m) => m.id === ultimoId
              );
              if (targetMueble) {
                set({ muebleActivoGuardado: targetMueble });
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

    const slug = cleanName.toLowerCase().replace(/\s+/g, "-");
    const id = padreId ? `${padreId}/${slug}` : slug;
    const ruta = padreId ? `${padreId}/${cleanName}` : cleanName;

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
    const state = get();
    try {
      const id = `mueble_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const rutaCarpeta = `${datos.marca}/${datos.tipologia}`;
      const modelKey = state.parametros.model_id || "Cubierta";
      const fichaConfig = state.getFichaConfig(modelKey);
      const despieceGlobal = state.getDespieceGlobal();

      // Capturar miniatura 3D real desde el Canvas WebGL
      let thumbnail: string | undefined = undefined;
      if (typeof window !== "undefined" && (window as any).__capturarThumbnail3BF) {
        thumbnail = (window as any).__capturarThumbnail3BF() || undefined;
      }

      // Capturar ficha técnica y variantes de color del producto
      const fichaActual = state.getFichaProductoActivo();
      const fichaGuardada: FichaProductoDef = {
        ...fichaActual,
        muebleId: datos.nombre,
        titulo: datos.nombre,
        descripcionCorta: datos.descripcion || fichaActual.descripcionCorta,
      };

      const rawInst = state.instancias || {};
      const sanitizedInst: Record<string, ObjetoInstancia3BF> = {};
      for (const [k, v] of Object.entries(rawInst)) {
        sanitizedInst[k] = {
          ...v,
          posicion: Array.isArray(v.posicion) ? [...v.posicion] : [0, 0, 0],
          rotacion: Array.isArray(v.rotacion) ? [...v.rotacion] : [0, 0, 0],
          parametros: { ...(v.parametros || {}) },
          resultado: v.resultado ? purgarResultadoGeometria(v.resultado) : undefined,
        };
      }

      const nuevoMueble: MuebleGuardadoItem = {
        id,
        nombre: datos.nombre,
        marca: datos.marca,
        tipologia: datos.tipologia,
        rutaCarpeta,
        fechaGuardado: new Date().toISOString(),
        thumbnail,
        descripcionComercial: datos.descripcion || `Mueble diseñado en 3BF (${datos.marca})`,
        instancias: sanitizedInst,
        fichaConfig,
        fichaProducto: fichaGuardada,
        totalPiezas: despieceGlobal.reduce((acc, p) => acc + (p.cantidad || 1), 0),
        pasosManual: state.pasosManual,
      };

      // Guardar en Store y localStorage
      state.actualizarFichaProducto(datos.nombre, fichaGuardada);
      state.actualizarFichaProducto(id, fichaGuardada);

      set((s) => ({
        mueblesGuardados: [nuevoMueble, ...s.mueblesGuardados.filter((m) => m.id !== id)],
        muebleActivoGuardado: nuevoMueble,
        modalGuardarComoAbierto: false,
      }));

      try {
        await fetch("/api/drive/muebles", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "save_furniture", furniture: nuevoMueble }),
        });
      } catch (err) {
        console.warn("Mueble guardado en local:", err);
      }

      set({ guardandoMueble: false });
      return true;
    } catch (err) {
      console.error("Error al guardar mueble:", err);
      set({ guardandoMueble: false });
      return false;
    }
  },

  guardarCambiosMueble: async () => {
    const state = get();
    if (!state.muebleActivoGuardado) {
      set({ modalGuardarComoAbierto: true });
      return false;
    }

    set({ guardandoMueble: true });
    try {
      const id = state.muebleActivoGuardado.id;
      const modelKey = state.parametros.model_id || "Cubierta";
      const fichaConfig = state.getFichaConfig(modelKey);
      const despieceGlobal = state.getDespieceGlobal();

      let thumbnail = state.muebleActivoGuardado.thumbnail;
      if (typeof window !== "undefined" && (window as any).__capturarThumbnail3BF) {
        const nuevoThumb = (window as any).__capturarThumbnail3BF();
        if (nuevoThumb) thumbnail = nuevoThumb;
      }

      // Sanitizar instancias y purgar duplicados geométricos
      const rawInst = state.instancias || {};
      const sanitizedInst: Record<string, ObjetoInstancia3BF> = {};
      for (const [k, v] of Object.entries(rawInst)) {
        sanitizedInst[k] = {
          ...v,
          posicion: Array.isArray(v.posicion) ? [...v.posicion] : [0, 0, 0],
          rotacion: Array.isArray(v.rotacion) ? [...v.rotacion] : [0, 0, 0],
          parametros: { ...(v.parametros || {}) },
          resultado: v.resultado ? purgarResultadoGeometria(v.resultado) : undefined,
        };
      }

      const fichaActual = state.getFichaProductoActivo();
      const muebleActualizado: MuebleGuardadoItem = {
        ...state.muebleActivoGuardado,
        fechaGuardado: new Date().toISOString(),
        thumbnail,
        instancias: sanitizedInst,
        fichaConfig,
        fichaProducto: fichaActual,
        totalPiezas: despieceGlobal.reduce((acc, p) => acc + (p.cantidad || 1), 0),
        pasosManual: state.pasosManual,
      };

      state.actualizarFichaProducto(state.muebleActivoGuardado.nombre, fichaActual);
      state.actualizarFichaProducto(id, fichaActual);

      set((s) => ({
        mueblesGuardados: s.mueblesGuardados.map((m) => (m.id === id ? muebleActualizado : m)),
        muebleActivoGuardado: muebleActualizado,
        instancias: sanitizedInst,
        resultado: purgarResultadoGeometria(s.resultado),
        guardandoMueble: false,
      }));

      try {
        await fetch("/api/drive/muebles", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "save_furniture", furniture: muebleActualizado }),
        });
        if (typeof window !== "undefined" && window.localStorage) {
          localStorage.setItem("3bf_ultimo_mueble_id", muebleActualizado.id);
        }
      } catch (err) {
        console.warn("Mueble actualizado en local:", err);
      }

      // 🔗 Sincronización Hermana: Guardar también el .3bm del manual
      try {
        const manualVinculadoId = muebleActualizado.manualVinculadoId || `manual_${muebleActualizado.nombre.toLowerCase().replace(/[^a-z0-9]/gi, "_")}`;
        const manualPayload: Manual3BMProyecto = {
          id: manualVinculadoId,
          muebleOrigenId: id,
          nombre: muebleActualizado.nombre,
          marca: muebleActualizado.marca,
          tipologia: muebleActualizado.tipologia,
          fechaModificacion: new Date().toISOString(),
          parametrosMueble: { ...state.parametros },
          pasos: state.pasosManual,
        };
        await fetch("/api/drive/manuales", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "save_manual", manual: manualPayload }),
        });
        set({ manualActivoGuardado: manualPayload });
        guardarPasosEnCacheLocal(state.pasosManual, manualPayload);
      } catch (errManual) {
        console.warn("Manual .3bm sincronizado en caché local:", errManual);
      }

      return true;
    } catch (err) {
      console.error("Error al actualizar cambios de mueble:", err);
      set({ guardandoMueble: false });
      return false;
    }
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
    if (!mueble || !mueble.instancias) return;

    // 1. Restaurar y sanitizar instancias en el Store (purgando cualquier duplicado persistente)
    const rawInst = mueble.instancias || {};
    const restoredInstancias: Record<string, ObjetoInstancia3BF> = {};
    for (const [k, v] of Object.entries(rawInst)) {
      restoredInstancias[k] = {
        ...v,
        posicion: Array.isArray(v.posicion) ? [...v.posicion] : [0, 0, 0],
        rotacion: Array.isArray(v.rotacion) ? [...v.rotacion] : [0, 0, 0],
        parametros: { ...(v.parametros || {}) },
        resultado: v.resultado ? purgarResultadoGeometria(v.resultado) : undefined,
      };
    }
    const firstKey = Object.keys(restoredInstancias)[0] || null;

    // 2. Restaurar ficha técnica y comercial si existe
    if (mueble.fichaConfig) {
      const modelKey = get().parametros.model_id || "Cubierta";
      get().setFichaConfig(modelKey, mueble.fichaConfig);
    }
    if (mueble.fichaProducto) {
      const limpiaKey = mueble.nombre.trim();
      const idKey = mueble.id;
      set((s) => ({
        fichasProducto: {
          ...s.fichasProducto,
          [limpiaKey]: mueble.fichaProducto!,
          [idKey]: mueble.fichaProducto!
        }
      }));
    }

    const firstInst = firstKey ? restoredInstancias[firstKey] : null;

    set({
      instancias: restoredInstancias,
      objetoActivoId: firstKey,
      objetoSeleccionado: !!firstKey,
      muebleActivoGuardado: {
        ...mueble,
        instancias: restoredInstancias,
      },
      escenarioLimpio: false,
      pestanaActiva: "3d",
      resultado: firstInst?.resultado ? purgarResultadoGeometria(firstInst.resultado) : null,
      parametros: firstInst?.parametros ? (firstInst.parametros as any) : get().parametros,
    });

    // Si la ficha guardada tiene una receta activa, aplicarla
    if (mueble.fichaProducto?.recetaColorActivaId) {
      get().aplicarRecetaColor(mueble.nombre.trim(), mueble.fichaProducto.recetaColorActivaId);
    }

    // 2.2 Vinculación Inteligente con el Manual 3D (.3bm)
    const cleanNombre = mueble.nombre.trim();
    const manualVinculadoId = mueble.manualVinculadoId || `manual_${cleanNombre.toLowerCase().replace(/[^a-z0-9]/gi, "_")}`;
    const manualesList = get().manualesDrive || [];
    const manualEnDrive = manualesList.find(
      (m) =>
        m.id === manualVinculadoId ||
        m.muebleOrigenId === mueble.id ||
        m.nombre.toLowerCase() === cleanNombre.toLowerCase() ||
        (cleanNombre.toLowerCase().includes("comoda") && m.id === "manual_1_comoda_ravenna")
    );

    let pasosFinales = mueble.pasosManual && mueble.pasosManual.length > 0 ? mueble.pasosManual : (manualEnDrive?.pasos || generarPasosManualesPorDefecto());

    // Si el archivo en Drive tiene más grupos configurados o es más reciente, priorizarlo
    if (manualEnDrive?.pasos && manualEnDrive.pasos.length > 0) {
      const p00Drive = manualEnDrive.pasos.find((p) => p.id === "P00");
      const p00Mueble = pasosFinales.find((p) => p.id === "P00");
      const gruposDrive = p00Drive?.showcase?.gruposCinematicos?.length || 0;
      const gruposMueble = p00Mueble?.showcase?.gruposCinematicos?.length || 0;
      if (gruposDrive >= gruposMueble) {
        pasosFinales = manualEnDrive.pasos;
      }
    }

    const manualActivo: Manual3BMProyecto = {
      id: manualEnDrive?.id || manualVinculadoId,
      muebleOrigenId: mueble.id,
      nombre: cleanNombre,
      marca: mueble.marca || "RTA Design",
      tipologia: mueble.tipologia || "Manuales 3D",
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
      localStorage.setItem("3bf_ultimo_mueble_id", mueble.id);
    }

    // 3. Recomputar SOLO si alguna instancia no tiene geometría 3D guardada
    const requiereComputo = Object.values(restoredInstancias).some(
      (inst) => !inst.resultado || !inst.resultado.real_meshes || inst.resultado.real_meshes.length === 0
    );

    if (requiereComputo) {
      await get().recomputarTodas();
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
      if (!isHardware && !isMdfMdp) {
        nuevasAsignaciones[parteKey] = {
          ...(nuevasAsignaciones[parteKey] || {
            parteKey,
            nombreVisible: parteKey.replace(/^RH_OUT:/, ""),
            visible: true,
          }),
          capaId: isFondo ? "capa_tono_fondo" : "capa_tono",
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
