// @ts-nocheck
import { guardarPasosEnCacheLocal } from "../../storeDefaults";
import type {
  GrupoCinematicoShowcase,
  CoreografiaShowcase,
  EjeAperturaShowcase,
} from "../../storeTypes";
import { agruparMallasEnPiezasMadre, extraerPiezaMadre } from "../../piezaMadreUtils";

export const createManualShowcaseSlice = (set: any, get: any): any => ({
  autoDetectarGruposCinematicos: (pasoId: string) => {
    const state = get();
    const paso = state.pasosManual.find((p: any) => p.id === pasoId);
    if (!paso || paso.tipo !== "showcase") return;

    const rawMeshes = state.resultado?.real_meshes || [];
    const declaredOutputs = state.resultado?.declared_outputs || [];
    const partesAsignadas = Object.keys(state.asignacionesPartes || {});
    const rawNombres = [
      ...rawMeshes.map((m: any) => (m.name || "").replace(/^RH_OUT:/i, "").trim()),
      ...declaredOutputs.map((d: string) => d.replace(/^RH_OUT:/i, "").trim()),
      ...partesAsignadas.map((p: string) => p.replace(/^RH_OUT:/i, "").trim()),
    ].filter(Boolean);

    const todasPiezasMadre = agruparMallasEnPiezasMadre(rawNombres);
    const tieneRavenna = todasPiezasMadre.some((p: string) => p === "Peça 6" || p === "Peça 7") || (state.parametros?.model_id || "").toLowerCase().includes("ravenna");
    const distGlobal = paso.showcase?.distanciaAperturaMm || 350;

    const existentes = paso.showcase?.gruposCinematicos || [];
    const tieneGruposConfigurados = existentes.some((g: any) => g.piezas && g.piezas.length > 0);

    let gruposDetectados: GrupoCinematicoShowcase[] = [];

    if (tieneGruposConfigurados) {
      gruposDetectados = existentes;
    } else if (tieneRavenna) {
      gruposDetectados = [
        { id: "cajon_1", nombre: "Cajón 1 (Superior Izq)", tipo: "cajon", piezas: [], ejeApertura: paso.showcase?.ejeGlobal || "+Z", distanciaMm: distGlobal, oculto: false },
        { id: "cajon_2", nombre: "Cajón 2 (Superior Der)", tipo: "cajon", piezas: [], ejeApertura: paso.showcase?.ejeGlobal || "+Z", distanciaMm: distGlobal, oculto: false },
        { id: "cajon_3", nombre: "Cajón 3 (Medio Izq)", tipo: "cajon", piezas: [], ejeApertura: paso.showcase?.ejeGlobal || "+Z", distanciaMm: distGlobal, oculto: false },
        { id: "cajon_4", nombre: "Cajón 4 (Medio Der)", tipo: "cajon", piezas: [], ejeApertura: paso.showcase?.ejeGlobal || "+Z", distanciaMm: distGlobal, oculto: false },
        { id: "cajon_5", nombre: "Cajón 5 (Inferior Izq)", tipo: "cajon", piezas: [], ejeApertura: paso.showcase?.ejeGlobal || "+Z", distanciaMm: distGlobal, oculto: false },
        { id: "cajon_6", nombre: "Cajón 6 (Inferior Der)", tipo: "cajon", piezas: [], ejeApertura: paso.showcase?.ejeGlobal || "+Z", distanciaMm: distGlobal, oculto: false },
      ];
    } else {
      gruposDetectados = [
        { id: "cajon_1", nombre: "Cajón 1 (Superior)", tipo: "cajon", piezas: [], ejeApertura: paso.showcase?.ejeGlobal || "+Z", distanciaMm: distGlobal, oculto: false },
        { id: "cajon_2", nombre: "Cajón 2 (Inferior)", tipo: "cajon", piezas: [], ejeApertura: paso.showcase?.ejeGlobal || "+Z", distanciaMm: distGlobal, oculto: false },
      ];
    }

    const actualizados = state.pasosManual.map((p: any) => {
      if (p.id !== pasoId) return p;
      return {
        ...p,
        showcase: {
          ...(p.showcase || {
            abrirCajones: true,
            distanciaAperturaMm: 300,
            abrirPuertas: true,
            anguloPuertasDeg: 90,
            giroPresentacion360: true,
          }),
          distanciaAperturaMm: distGlobal,
          sincronizarCarreraCajones: true,
          coreografia: (p.showcase?.coreografia || "secuencial") as CoreografiaShowcase,
          ejeGlobal: (p.showcase?.ejeGlobal || "+Z") as EjeAperturaShowcase,
          gruposCinematicos: gruposDetectados,
        },
      };
    });

    set({ pasosManual: actualizados, timelineCurrentTime: 0, isTimelinePlaying: false });
    guardarPasosEnCacheLocal(actualizados, state.manualActivoGuardado);
  },

  agregarGrupoCinematico: (pasoId: string, grupo: GrupoCinematicoShowcase) => {
    const state = get();
    const actualizados = state.pasosManual.map((p: any) => {
      if (p.id !== pasoId) return p;
      const showcaseActual = p.showcase || {
        abrirCajones: true,
        distanciaAperturaMm: 300,
        abrirPuertas: true,
        anguloPuertasDeg: 90,
        giroPresentacion360: true,
        coreografia: "secuencial" as CoreografiaShowcase,
        ejeGlobal: "+Z" as EjeAperturaShowcase,
        gruposCinematicos: [],
      };
      const actuales = showcaseActual.gruposCinematicos || [];
      return {
        ...p,
        showcase: {
          ...showcaseActual,
          gruposCinematicos: [...actuales, grupo],
        },
      };
    });
    set({ pasosManual: actualizados });
    guardarPasosEnCacheLocal(actualizados, state.manualActivoGuardado);
  },

  actualizarGrupoCinematico: (pasoId: string, grupoId: string, data: Partial<GrupoCinematicoShowcase>) => {
    const state = get();
    const actualizados = state.pasosManual.map((p: any) => {
      if (p.id !== pasoId || !p.showcase) return p;
      const modificados = (p.showcase.gruposCinematicos || []).map((g: any) =>
        g.id === grupoId ? { ...g, ...data } : g
      );
      return {
        ...p,
        showcase: {
          ...p.showcase,
          gruposCinematicos: modificados,
        },
      };
    });
    set({ pasosManual: actualizados });
    guardarPasosEnCacheLocal(actualizados, state.manualActivoGuardado);
  },

  eliminarGrupoCinematico: (pasoId: string, grupoId: string) => {
    const state = get();
    const actualizados = state.pasosManual.map((p: any) => {
      if (p.id !== pasoId || !p.showcase) return p;
      return {
        ...p,
        showcase: {
          ...p.showcase,
          gruposCinematicos: (p.showcase.gruposCinematicos || []).filter((g: any) => g.id !== grupoId),
        },
      };
    });
    set({ pasosManual: actualizados });
    guardarPasosEnCacheLocal(actualizados, state.manualActivoGuardado);
  },

  asignarPiezasAGrupoCinematico: (pasoId: string, grupoId: string, nombrePieza: string) => {
    const state = get();
    const piezaKey = (nombrePieza || "").trim();

    const actualizados = state.pasosManual.map((p: any) => {
      if (p.id !== pasoId || !p.showcase) return p;
      const modificados = (p.showcase.gruposCinematicos || []).map((g: any) => {
        if (g.id !== grupoId) return g;
        if (g.piezas.includes(piezaKey)) return g;
        return { ...g, piezas: [...g.piezas, piezaKey] };
      });
      return {
        ...p,
        showcase: {
          ...p.showcase,
          gruposCinematicos: modificados,
        },
      };
    });

    let nuevoPicking = state.modoPickingManual;
    if (state.modoPickingManual.activo && state.modoPickingManual.grupoId === grupoId) {
      if (!state.modoPickingManual.piezasTemporalmenteSeleccionadas.includes(piezaKey)) {
        nuevoPicking = {
          ...state.modoPickingManual,
          piezasTemporalmenteSeleccionadas: [...state.modoPickingManual.piezasTemporalmenteSeleccionadas, piezaKey],
        };
      }
    }

    set({ 
      pasosManual: actualizados,
      modoPickingManual: nuevoPicking,
    });
    guardarPasosEnCacheLocal(actualizados, state.manualActivoGuardado);
  },

  desasignarPiezaDeGrupoCinematico: (pasoId: string, grupoId: string, nombrePieza: string) => {
    const state = get();
    const piezaKey = (nombrePieza || "").trim();
    const pmKey = extraerPiezaMadre(piezaKey);
    const actualizados = state.pasosManual.map((p: any) => {
      if (p.id !== pasoId || !p.showcase) return p;
      const modificados = (p.showcase.gruposCinematicos || []).map((g: any) => {
        if (g.id !== grupoId) return g;
        return { 
          ...g, 
          piezas: g.piezas.filter((pz: string) => pz !== piezaKey && pz !== nombrePieza && pz !== pmKey && extraerPiezaMadre(pz) !== pmKey) 
        };
      });
      return {
        ...p,
        showcase: {
          ...p.showcase,
          gruposCinematicos: modificados,
        },
      };
    });

    let nuevoPicking = state.modoPickingManual;
    if (state.modoPickingManual.activo && (!state.modoPickingManual.grupoId || state.modoPickingManual.grupoId === grupoId)) {
      nuevoPicking = {
        ...state.modoPickingManual,
        piezasTemporalmenteSeleccionadas: state.modoPickingManual.piezasTemporalmenteSeleccionadas.filter(
          (p: string) => p !== piezaKey && p !== nombrePieza && p !== pmKey && extraerPiezaMadre(p) !== pmKey
        ),
      };
    }

    set({ 
      pasosManual: actualizados,
      modoPickingManual: nuevoPicking,
    });
    guardarPasosEnCacheLocal(actualizados, state.manualActivoGuardado);
  },

  conmutarVisibilidadGrupoCinematico: (pasoId: string, grupoId: string) => {
    const state = get();
    const actualizados = state.pasosManual.map((p: any) => {
      if (p.id !== pasoId || !p.showcase) return p;
      const modificados = (p.showcase.gruposCinematicos || []).map((g: any) => {
        if (g.id !== grupoId) return g;
        return { ...g, oculto: !g.oculto };
      });
      return {
        ...p,
        showcase: {
          ...p.showcase,
          gruposCinematicos: modificados,
        },
      };
    });
    set({ pasosManual: actualizados });
    guardarPasosEnCacheLocal(actualizados, state.manualActivoGuardado);
  },

  conmutarVisibilidadTodosGruposCinematicos: (pasoId = "P00", forzarOcultar?: boolean) => {
    const state = get();
    const actualizados = state.pasosManual.map((p: any) => {
      if ((p.id !== pasoId && p.tipo !== "showcase") || !p.showcase) return p;
      const grupos = p.showcase.gruposCinematicos || [];
      const algunVisible = grupos.some((g: any) => !g.oculto);
      const nuevoEstado = forzarOcultar !== undefined ? forzarOcultar : algunVisible;
      const modificados = grupos.map((g: any) => ({ ...g, oculto: nuevoEstado }));
      return {
        ...p,
        showcase: {
          ...p.showcase,
          gruposCinematicos: modificados,
        },
      };
    });
    set({ pasosManual: actualizados });
    guardarPasosEnCacheLocal(actualizados, state.manualActivoGuardado);
  },

  conmutarVisibilidadPiezasPaso: (pasoId: string) => {
    const state = get();
    const actualizados = state.pasosManual.map((p: any) => {
      if (p.id !== pasoId) return p;
      return { ...p, piezasOcultas: !p.piezasOcultas };
    });
    set({ pasosManual: actualizados });
    guardarPasosEnCacheLocal(actualizados, state.manualActivoGuardado);
  },

  conmutarOcultarNoAsignadasPaso: (pasoId: string) => {
    const state = get();
    const actualizados = state.pasosManual.map((p: any) => {
      if (p.id !== pasoId) return p;
      return { ...p, ocultarNoAsignadas: !p.ocultarNoAsignadas };
    });
    set({ pasosManual: actualizados });
    guardarPasosEnCacheLocal(actualizados, state.manualActivoGuardado);
  },
});
