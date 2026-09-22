import {
  getCachedManualData,
  generarPasosManualesPorDefecto,
  sanitizarPasosManuales,
  guardarPasosEnCacheLocal,
  encontrarSiguienteIdPasoDisponible,
} from "../../storeDefaults";
import type {
  PasoManualStudio,
  ElementoSecuenciaCinematica,
} from "../../storeTypes";
import { extraerPiezaMadre } from "../../piezaMadreUtils";

export const createManualStepsSlice = (set: any, get: any): any => {
  const initialCachedManual = getCachedManualData();
  const pasosIniciales =
    initialCachedManual && initialCachedManual.pasos && initialCachedManual.pasos.length > 0
      ? initialCachedManual.pasos
      : generarPasosManualesPorDefecto();

  return {
    pasosManual: pasosIniciales,
    pasoActivoManualId: pasosIniciales[0]?.id || "P00",
    simuladorMovilActivo: false,
    simuladorMovilOrientacion: "horizontal",
    setSimuladorMovilActivo: (simuladorMovilActivo: boolean) => set({ simuladorMovilActivo }),
    toggleSimuladorMovil: () => set((s: any) => ({ simuladorMovilActivo: !s.simuladorMovilActivo })),
    setSimuladorMovilOrientacion: (simuladorMovilOrientacion: "vertical" | "horizontal") =>
      set({ simuladorMovilOrientacion }),
    toggleSimuladorMovilOrientacion: () =>
      set((s: any) => ({
        simuladorMovilOrientacion: s.simuladorMovilOrientacion === "vertical" ? "horizontal" : "vertical",
      })),
    autoEnfoqueCamaraManual: false,
    setAutoEnfoqueCamaraManual: (autoEnfoqueCamaraManual: boolean) => set({ autoEnfoqueCamaraManual }),

    piezaEnPosicionamientoManual: null,
    setPiezaEnPosicionamientoManual: (piezaEnPosicionamientoManual: any) =>
      set({ piezaEnPosicionamientoManual }),
    ultimaPiezaCalibrada: null,
    setUltimaPiezaCalibrada: (ultimaPiezaCalibrada: string | null) => set({ ultimaPiezaCalibrada }),
    herrajesHovered: null,
    setHerrajesHovered: (herrajesHovered: string[] | null) => set({ herrajesHovered }),
    vistaPiezasDesplazadas: false,
    setVistaPiezasDesplazadas: (vistaPiezasDesplazadas: boolean) => set({ vistaPiezasDesplazadas }),

    setPasosManual: (pasosManual: PasoManualStudio[]) => {
      const sanitizados = sanitizarPasosManuales(pasosManual);
      set({ pasosManual: sanitizados });
      guardarPasosEnCacheLocal(sanitizados, get().manualActivoGuardado);
    },

  seleccionarPasoManualActivo: (pasoActivoManualId: string) =>
    set({
      pasoActivoManualId,
      timelineCurrentTime: 0,
      isTimelinePlaying: false,
      piezaEnPosicionamientoManual: null,
      modoPickingManual: {
        activo: false,
        modo: "agregar",
        grupoId: null,
        pasoId: null,
        piezasTemporalmenteSeleccionadas: [],
      },
    }),

  crearPasoManual: (tipo: "ensamble" | "showcase" | "bloque_estandar" = "ensamble") => {
    const state = get();
    const { id: nuevoId, numero: num } = encontrarSiguienteIdPasoDisponible(state.pasosManual);

    const nuevoPaso: PasoManualStudio = {
      id: nuevoId,
      numero: num,
      tipo,
      titulo: tipo === "showcase" ? `${nuevoId}: Showcase` : `Bloque de armado ${nuevoId}`,
      descripcion: "Nuevo paso de ensamble",
      duracionTotal: 10.0,
      piezaMaster: "",
      orientacionBanco: { rotacion: [0, 0, 0], apoyoEnPiso: true },
      piezasAsignadas: [],
      herrajesAsignados: [],
      secuencia: [],
      subbloques: [],
      piezasOcultas: false,
      ocultarNoAsignadas: false,
      guionEs: "",
      guionPt: "",
      guionEn: "",
      vozEs: "es-MX-DaliaNeural",
      vozPt: "pt-BR-FranciscaNeural",
      vozEn: "en-US-JennyNeural",
      duracionAudioSegundos: 10.0,
    };

    const nuevosPasos = [...state.pasosManual];
    const indiceInsercion = nuevosPasos.findIndex((p) => (p.numero ?? 0) > num);
    if (indiceInsercion >= 0) {
      nuevosPasos.splice(indiceInsercion, 0, nuevoPaso);
    } else {
      nuevosPasos.push(nuevoPaso);
    }

    set({
      pasosManual: nuevosPasos,
      pasoActivoManualId: nuevoId,
      timelineCurrentTime: 0,
      isTimelinePlaying: false,
      modoPickingManual: {
        activo: false,
        modo: "agregar",
        grupoId: null,
        pasoId: null,
        piezasTemporalmenteSeleccionadas: [],
      },
    });
    guardarPasosEnCacheLocal(nuevosPasos, state.manualActivoGuardado);
  },

  eliminarPasoManual: (pasoId: string) => {
    const state = get();
    if (pasoId === "P00" || state.pasosManual.length <= 1) return;
    const filtrados = state.pasosManual.filter((p: any) => p.id !== pasoId);
    const sanitizados = sanitizarPasosManuales(filtrados);
    let siguienteActivo = state.pasoActivoManualId;
    if (state.pasoActivoManualId === pasoId) {
      const idxEliminado = state.pasosManual.findIndex((p: any) => p.id === pasoId);
      const prevIdx = Math.max(0, idxEliminado - 1);
      siguienteActivo = sanitizados[prevIdx]?.id || sanitizados[0]?.id || "P00";
    }
    set({
      pasosManual: sanitizados,
      pasoActivoManualId: siguienteActivo,
      timelineCurrentTime: 0,
      isTimelinePlaying: false,
      modoPickingManual: {
        activo: false,
        modo: "agregar",
        grupoId: null,
        pasoId: null,
        piezasTemporalmenteSeleccionadas: [],
      },
    });
    guardarPasosEnCacheLocal(sanitizados, state.manualActivoGuardado);
  },

  actualizarPasoManual: (pasoId: string, data: Partial<PasoManualStudio>) => {
    const state = get();
    const actualizados = state.pasosManual.map((p: any) => (p.id === pasoId ? { ...p, ...data } : p));
    set({ pasosManual: actualizados });
    guardarPasosEnCacheLocal(actualizados, state.manualActivoGuardado);
  },

  reordenarSecuenciaPaso: (pasoId: string, nuevaSecuencia: ElementoSecuenciaCinematica[]) => {
    const state = get();
    const actualizados = state.pasosManual.map((p: any) => (p.id === pasoId ? { ...p, secuencia: nuevaSecuencia } : p));
    set({ pasosManual: actualizados });
    guardarPasosEnCacheLocal(actualizados, state.manualActivoGuardado);
  },

  asignarPiezaAPasoManual: (pasoId: string, nombrePieza: string) => {
    const state = get();
    const actualizados = state.pasosManual.map((p: any) => {
      if (p.id !== pasoId) return p;
      if (p.piezasAsignadas.includes(nombrePieza)) return p;
      const nuevasPiezas = [...p.piezasAsignadas, nombrePieza];
      return { ...p, piezasAsignadas: nuevasPiezas };
    });
    set({ pasosManual: actualizados });
    guardarPasosEnCacheLocal(actualizados, state.manualActivoGuardado);
    get().autoGenerarSecuenciaPaso(pasoId);
  },

  desasignarPiezaDePasoManual: (pasoId: string, nombrePieza: string) => {
    const state = get();
    const pm = extraerPiezaMadre(nombrePieza);
    const actualizados = state.pasosManual.map((p: any) => {
      if (p.id !== pasoId) return p;
      return {
        ...p,
        piezasAsignadas: p.piezasAsignadas.filter((nom: string) => nom !== nombrePieza && extraerPiezaMadre(nom) !== pm),
        secuencia: p.secuencia.filter((s: any) => s.nombreNodo !== nombrePieza && extraerPiezaMadre(s.nombreNodo) !== pm),
      };
    });
    let nuevoPicking = state.modoPickingManual;
    if (state.modoPickingManual.activo && state.modoPickingManual.pasoId === pasoId) {
      nuevoPicking = {
        ...state.modoPickingManual,
        piezasTemporalmenteSeleccionadas: state.modoPickingManual.piezasTemporalmenteSeleccionadas.filter(
          (nom: string) => nom !== nombrePieza && extraerPiezaMadre(nom) !== pm
        ),
      };
    }
    set({ pasosManual: actualizados, modoPickingManual: nuevoPicking });
    guardarPasosEnCacheLocal(actualizados, state.manualActivoGuardado);
  },

  asignarHerrajeAPasoManual: (pasoId: string, nombreHerraje: string) => {
    const state = get();
    const actualizados = state.pasosManual.map((p: any) => {
      if (p.id !== pasoId) return p;
      if (p.herrajesAsignados.includes(nombreHerraje)) return p;
      const nuevosHerrajes = [...p.herrajesAsignados, nombreHerraje];
      return { ...p, herrajesAsignados: nuevosHerrajes };
    });
    set({ pasosManual: actualizados });
    guardarPasosEnCacheLocal(actualizados, state.manualActivoGuardado);
    get().autoGenerarSecuenciaPaso(pasoId);
  },

  desasignarHerrajeDePasoManual: (pasoId: string, nombreHerraje: string) => {
    const state = get();
    const pm = extraerPiezaMadre(nombreHerraje);
    const actualizados = state.pasosManual.map((p: any) => {
      if (p.id !== pasoId) return p;
      return {
        ...p,
        herrajesAsignados: p.herrajesAsignados.filter((nom: string) => nom !== nombreHerraje && extraerPiezaMadre(nom) !== pm),
        secuencia: p.secuencia.filter((s: any) => s.nombreNodo !== nombreHerraje && extraerPiezaMadre(s.nombreNodo) !== pm),
      };
    });
    let nuevoPicking = state.modoPickingManual;
    if (state.modoPickingManual.activo && state.modoPickingManual.pasoId === pasoId) {
      nuevoPicking = {
        ...state.modoPickingManual,
        piezasTemporalmenteSeleccionadas: state.modoPickingManual.piezasTemporalmenteSeleccionadas.filter(
          (nom: string) => nom !== nombreHerraje && extraerPiezaMadre(nom) !== pm
        ),
      };
    }
    set({ pasosManual: actualizados, modoPickingManual: nuevoPicking });
    guardarPasosEnCacheLocal(actualizados, state.manualActivoGuardado);
  },

  autoGenerarSecuenciaPaso: (pasoId: string) => {
    const state = get();
    const paso = state.pasosManual.find((p: any) => p.id === pasoId);
    if (!paso) return;
    if (paso.tipo === "showcase") return;

    let t = 0.5;
    const nuevaSecuencia: ElementoSecuenciaCinematica[] = [];

    // 1. Tarugos entran primero con martillo de goma
    paso.herrajesAsignados
      .filter((h: string) => h.toLowerCase().includes("tarugo") || h.toLowerCase().includes("cavilha"))
      .forEach((tarugo: string, idx: number) => {
        nuevaSecuencia.push({
          id: `seq_${tarugo}_${idx}`,
          nombreNodo: tarugo,
          tipo: "herraje",
          tiempoInicio: Number(t.toFixed(1)),
          duracionMovimiento: 2.0,
          popIn: true,
          distanciaAproximacion: 0.12,
          herramienta: "martillo",
          impactosHerramienta: 3,
        });
        t += 1.8;
      });

    // 2. Pernos / Minifix con destornillador
    paso.herrajesAsignados
      .filter((h: string) => (h.toLowerCase().includes("minifix") || h.toLowerCase().includes("perno")) && !h.toLowerCase().includes("tarugo"))
      .forEach((perno: string, idx: number) => {
        nuevaSecuencia.push({
          id: `seq_${perno}_${idx}`,
          nombreNodo: perno,
          tipo: "herraje",
          tiempoInicio: Number(t.toFixed(1)),
          duracionMovimiento: 2.0,
          popIn: true,
          distanciaAproximacion: 0.15,
          rotacionGrados: 180,
          herramienta: "destornillador",
        });
        t += 1.8;
      });

    // 3. Piezas de madera que se acoplan (distintas de la piezaMaster)
    paso.piezasAsignadas
      .filter((p: string) => p !== paso.piezaMaster)
      .forEach((pieza: string, idx: number) => {
        nuevaSecuencia.push({
          id: `seq_${pieza}_${idx}`,
          nombreNodo: pieza,
          tipo: "pieza",
          tiempoInicio: Number(t.toFixed(1)),
          duracionMovimiento: 2.5,
          popIn: true,
          distanciaAproximacion: 0.25,
          herramienta: "ninguna",
        });
        t += 2.8;
      });

    // 4. Tornillos estructurales con Llave Allen (720 deg)
    paso.herrajesAsignados
      .filter((h: string) => h.toLowerCase().includes("tornillo") || h.toLowerCase().includes("parafuso"))
      .forEach((tornillo: string, idx: number) => {
        nuevaSecuencia.push({
          id: `seq_${tornillo}_${idx}`,
          nombreNodo: tornillo,
          tipo: "herraje",
          tiempoInicio: Number(t.toFixed(1)),
          duracionMovimiento: 2.5,
          popIn: true,
          distanciaAproximacion: 0.15,
          rotacionGrados: 720,
          herramienta: "llave_allen",
        });
        t += 2.2;
      });

    const duracionFinal = Math.max(paso.duracionAudioSegundos || 8.0, Number((t + 1.0).toFixed(1)));

    const actualizados = state.pasosManual.map((p: any) =>
      p.id === pasoId ? { ...p, secuencia: nuevaSecuencia, duracionTotal: duracionFinal } : p
    );
    set({ pasosManual: actualizados });
    guardarPasosEnCacheLocal(actualizados, state.manualActivoGuardado);
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
  };
};
