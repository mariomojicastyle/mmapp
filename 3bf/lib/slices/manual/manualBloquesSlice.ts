// @ts-nocheck
import {
  BLOQUES_ESTANDAR_DEFAULT,
  sanitizarPasosManuales,
  guardarPasosEnCacheLocal,
} from "../../storeDefaults";
import type {
  BloqueEstandarDef,
  BloqueEstandarRef,
  PasoManualStudio,
  Manual3BMProyecto,
} from "../../storeTypes";

export const createManualBloquesSlice = (set: any, get: any): any => ({
  // 📦 Bloques Estándar de Armado (.3bb.json)
  bloquesEstandar: BLOQUES_ESTANDAR_DEFAULT,
  carpetaBloquesSeleccionada: "Universales",
  setCarpetaBloquesSeleccionada: (carpetaBloquesSeleccionada: string) => set({ carpetaBloquesSeleccionada }),
  bloqueEstandarEnEdicion: null,
  manualPadrePrevioEdicionBloque: null,

  setBloqueEstandarEnEdicion: (bloqueEstandarEnEdicion: BloqueEstandarDef | null) => {
    const state = get();
    if (bloqueEstandarEnEdicion === null && state.manualPadrePrevioEdicionBloque) {
      // 🛡️ BLINDAJE TOTAL: Al salir o cancelar la edición del bloque,
      // restaurar inmediatamente el manual completo del mueble (ej. Cómoda Ravenna con sus 6 cajones)
      const padre = state.manualPadrePrevioEdicionBloque;
      set({
        bloqueEstandarEnEdicion: null,
        manualPadrePrevioEdicionBloque: null,
        manualActivoGuardado: padre.manual,
        pasosManual: padre.pasos,
        pasoActivoManualId: padre.pasoActivoId,
        timelineCurrentTime: 0,
        isTimelinePlaying: false,
      });
      guardarPasosEnCacheLocal(padre.pasos, padre.manual);
      return;
    }
    set({ bloqueEstandarEnEdicion });
  },

  cargarBloquesEstandar: async () => {
    try {
      const res = await fetch("/api/bloques");
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.bloques) && data.bloques.length > 0) {
          set({ bloquesEstandar: data.bloques });
          return;
        }
      }
    } catch (err) {
      console.warn("[3dBimFab] Error cargando bloques estándar de API:", err);
    }
    set({ bloquesEstandar: BLOQUES_ESTANDAR_DEFAULT });
  },

  insertarBloqueEstandarComoPaso: (bloque: BloqueEstandarDef, indiceInsercion?: number) => {
    const state = get();
    const pasosActuales = sanitizarPasosManuales(state.pasosManual);
    const pasoActivoIdx = pasosActuales.findIndex((p: any) => p.id === state.pasoActivoManualId);
    // P00 (índice 0) está reservado para Showcase, nunca insertar antes del 1
    const pos = Math.max(1, indiceInsercion !== undefined ? indiceInsercion : (pasoActivoIdx >= 0 ? pasoActivoIdx + 1 : pasosActuales.length));

    const ref: BloqueEstandarRef = {
      id: bloque.id,
      nombre: bloque.nombre,
      categoriaMarca: bloque.categoriaMarca,
      subcategoria: bloque.subcategoria,
      descripcion: bloque.descripcion,
      archivo: bloque.archivo,
      thumbnail: bloque.thumbnail,
      duracion: bloque.duracion || 8.0,
      guionEs: bloque.guionEs,
      guionPt: bloque.guionPt,
      guionEn: bloque.guionEn,
      carpetaModelos: bloque.carpetaModelos,
      partesGlb: bloque.partesGlb,
      animacionTracks: bloque.animacionTracks,
    };

    const nuevoPaso: PasoManualStudio = {
      id: "TEMP",
      numero: 1,
      tipo: "bloque_estandar",
      titulo: bloque.nombre,
      descripcion: bloque.descripcion,
      duracionTotal: bloque.duracion || 8.0,
      piezaMaster: "",
      orientacionBanco: { rotacion: [0, 0, 0], apoyoEnPiso: true },
      piezasAsignadas: [],
      herrajesAsignados: [],
      secuencia: [],
      bloqueEstandar: ref,
      guionEs: bloque.guionEs || `Paso: ${bloque.nombre}. Sigue las instrucciones del bloque estándar.`,
      guionPt: bloque.guionPt || `Passo: ${bloque.nombre}. Siga as instruções do bloco padrão.`,
      guionEn: bloque.guionEn || `Step: ${bloque.nombre}. Follow the standard block instructions.`,
      vozEs: "es-MX-DaliaNeural",
      vozPt: "pt-BR-FranciscaNeural",
      vozEn: "en-US-JennyNeural",
      duracionAudioSegundos: bloque.duracion || 8.0,
    };

    const lista = [...pasosActuales];
    lista.splice(pos, 0, nuevoPaso);
    const reindexados = sanitizarPasosManuales(lista);
    const pasoInsertado = reindexados[pos] || reindexados[reindexados.length - 1];

    set({
      pasosManual: reindexados,
      pasoActivoManualId: pasoInsertado?.id || state.pasoActivoManualId,
      timelineCurrentTime: 0,
      isTimelinePlaying: false,
    });
    guardarPasosEnCacheLocal(reindexados, state.manualActivoGuardado);
  },

  cargarBloqueEstandarParaEdicion: (bloque: BloqueEstandarDef) => {
    const ref: BloqueEstandarRef = {
      id: bloque.id,
      nombre: bloque.nombre,
      categoriaMarca: bloque.categoriaMarca,
      subcategoria: bloque.subcategoria,
      descripcion: bloque.descripcion,
      archivo: bloque.archivo,
      thumbnail: bloque.thumbnail,
      duracion: bloque.duracion || 8.0,
      guionEs: bloque.guionEs,
      guionPt: bloque.guionPt,
      guionEn: bloque.guionEn,
      carpetaModelos: bloque.carpetaModelos,
      partesGlb: bloque.partesGlb,
      animacionTracks: bloque.animacionTracks,
    };

    const pasoEdicion: PasoManualStudio = {
      id: "P01",
      numero: 1,
      tipo: "bloque_estandar",
      titulo: bloque.nombre,
      descripcion: bloque.descripcion,
      duracionTotal: bloque.duracion || 8.0,
      piezaMaster: "",
      orientacionBanco: { rotacion: [0, 0, 0], apoyoEnPiso: true },
      piezasAsignadas: [],
      herrajesAsignados: [],
      secuencia: [],
      bloqueEstandar: ref,
      guionEs: bloque.guionEs || `Paso: ${bloque.nombre}. Sigue las instrucciones del bloque estándar.`,
      guionPt: bloque.guionPt || `Passo: ${bloque.nombre}. Siga as instruções do bloco padrão.`,
      guionEn: bloque.guionEn || `Step: ${bloque.nombre}. Follow the standard block instructions.`,
      vozEs: "es-MX-DaliaNeural",
      vozPt: "pt-BR-FranciscaNeural",
      vozEn: "en-US-JennyNeural",
      duracionAudioSegundos: bloque.duracion || 8.0,
    };

    // 🛡️ AISLAMIENTO DE SEGURIDAD TOTAL:
    // Si estamos en un manual de mueble (ej. Cómoda Ravenna), salvaguardar todo su estado para restaurarlo intacto al salir
    const state = get();
    let respaldo = state.manualPadrePrevioEdicionBloque;
    if (!respaldo && state.manualActivoGuardado && !state.manualActivoGuardado.id.startsWith("bloque_")) {
      respaldo = {
        manual: state.manualActivoGuardado,
        pasos: state.pasosManual,
        pasoActivoId: state.pasoActivoManualId,
      };
    }

    // Siempre garantizar P00 al inicio en la vista previa del bloque estándar
    const pasosSanitizados = sanitizarPasosManuales([pasoEdicion]);

    const manualBloque: Manual3BMProyecto = {
      id: `bloque_${bloque.id}`,
      muebleOrigenId: bloque.id,
      nombre: `Bloque: ${bloque.nombre}`,
      marca: bloque.categoriaMarca || "Universales",
      tipologia: "Bloques Estándar",
      fechaModificacion: new Date().toISOString(),
      parametrosMueble: {},
      pasos: pasosSanitizados,
    };

    set({
      manualPadrePrevioEdicionBloque: respaldo,
      bloqueEstandarEnEdicion: bloque,
      manualActivoGuardado: manualBloque,
      pasosManual: pasosSanitizados,
      pasoActivoManualId: "P01",
      timelineCurrentTime: 0,
      isTimelinePlaying: false,
      mostrarNPanel: false, // Cerrar panel lateral para ver inmediatamente el 3D
    });
    // NOTA: NO llamamos a guardarPasosEnCacheLocal aquí para no sobreescribir la memoria persistente del mueble padre
  },

  reordenarPasosManual: (origenIndex: number, destinoIndex: number) => {
    const state = get();
    if (origenIndex <= 0 || destinoIndex <= 0) return; // P00 está fijo y protegido
    if (origenIndex === destinoIndex) return;
    if (origenIndex >= state.pasosManual.length || destinoIndex >= state.pasosManual.length) return;

    const lista = [...state.pasosManual];
    const [removido] = lista.splice(origenIndex, 1);
    lista.splice(destinoIndex, 0, removido);

    const idActivoAnterior = state.pasoActivoManualId;
    let nuevoIdActivo = idActivoAnterior;

    const reindexados = lista.map((p, idx) => {
      if (idx === 0) return p; // P00 inalterado
      const nuevoId = `P${String(idx).padStart(2, "0")}`;
      if (p.id === idActivoAnterior) {
        nuevoIdActivo = nuevoId;
      }
      return {
        ...p,
        id: nuevoId,
        numero: idx,
      };
    });

    set({
      pasosManual: reindexados,
      pasoActivoManualId: nuevoIdActivo,
    });
    guardarPasosEnCacheLocal(reindexados, state.manualActivoGuardado);
  },

  guardarNuevoBloqueEstandar: async (bloque: BloqueEstandarDef) => {
    try {
      const res = await fetch("/api/bloques", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bloque),
      });
      if (res.ok) {
        const state = get();
        const existe = state.bloquesEstandar.some((b: any) => b.id === bloque.id);
        const actualizados = existe
          ? state.bloquesEstandar.map((b: any) => (b.id === bloque.id ? bloque : b))
          : [...state.bloquesEstandar, bloque];
        set({ bloquesEstandar: actualizados });
        return true;
      }
    } catch (err) {
      console.error("[3dBimFab] Error guardando bloque estándar:", err);
    }
    return false;
  },

  eliminarBloqueEstandar: async (id: string, categoriaMarca?: string, archivo?: string) => {
    try {
      const res = await fetch("/api/bloques", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, categoriaMarca, archivo }),
      });
      if (res.ok) {
        set((state: any) => ({
          bloquesEstandar: state.bloquesEstandar.filter((b: any) => b.id !== id),
        }));
        return true;
      }
    } catch (err) {
      console.error("[3dBimFab] Error eliminando bloque estándar:", err);
    }
    return false;
  },
});
