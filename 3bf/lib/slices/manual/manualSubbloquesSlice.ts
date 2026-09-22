// @ts-nocheck
import { guardarPasosEnCacheLocal } from "../../storeDefaults";
import type { SubBloqueArmado } from "../../storeTypes";
import { esHerrajeNombre, extraerPiezaMadre } from "../../piezaMadreUtils";

export const createManualSubbloquesSlice = (set: any, get: any): any => ({
  // 🧩 Subbloques de Armado en Pasos de Ensamble
  agregarSubBloqueArmado: (pasoId: string, nombre?: string) => {
    const state = get();
    const actualizados = state.pasosManual.map((p: any) => {
      if (p.id !== pasoId) return p;
      const subbloquesActuales = p.subbloques || [];
      const sIdx = subbloquesActuales.length;
      const letra = String.fromCharCode(65 + sIdx); // A, B, C...
      const codigo = `${pasoId}${letra}`; // ej. "P02A"
      const idNuevo = `sub_${pasoId}_${letra}_${Date.now().toString().slice(-4)}`;
      const nuevoSub: SubBloqueArmado = {
        id: idNuevo,
        codigo,
        letra,
        nombre: nombre || `Sub-Bloque ${pasoId}-${letra}`,
        piezas: [],
        herrajes: [],
        oculto: false,
        transformBanco: {
          acostado: false,
          direccionAcostar: "izquierda",
          rotacionYDeg: 0,
          rotacion: [0, 0, 0] as [number, number, number],
          flipCara: false,
          offsetX: 0,
          offsetZ: 0,
          apoyoEnPiso: true,
        },
        trackAnimacion: {
          tiempoInicio: 0,
          duracion: Math.max(p.duracionTotal || 5.0, 1.0),
        },
      };
      return {
        ...p,
        subbloques: [...subbloquesActuales, nuevoSub],
      };
    });
    set({ pasosManual: actualizados });
    guardarPasosEnCacheLocal(actualizados, state.manualActivoGuardado);
  },

  actualizarSubBloqueArmado: (pasoId: string, subbloqueId: string, data: Partial<SubBloqueArmado>) => {
    const state = get();
    const actualizados = state.pasosManual.map((p: any) => {
      if (p.id !== pasoId || !p.subbloques) return p;
      const modificados = p.subbloques.map((s: SubBloqueArmado) =>
        s.id === subbloqueId ? { ...s, ...data } : s
      );
      return { ...p, subbloques: modificados };
    });
    set({ pasosManual: actualizados });
    guardarPasosEnCacheLocal(actualizados, state.manualActivoGuardado);
  },

  eliminarSubBloqueArmado: (pasoId: string, subbloqueId: string) => {
    const state = get();
    const actualizados = state.pasosManual.map((p: any) => {
      if (p.id !== pasoId || !p.subbloques) return p;
      return {
        ...p,
        subbloques: p.subbloques.filter((s: SubBloqueArmado) => s.id !== subbloqueId),
      };
    });

    let nuevoPicking = state.modoPickingManual;
    if (state.modoPickingManual.activo && state.modoPickingManual.grupoId === subbloqueId) {
      nuevoPicking = {
        activo: false,
        modo: "agregar",
        grupoId: null,
        pasoId: null,
        piezasTemporalmenteSeleccionadas: [],
      };
    }

    set({ pasosManual: actualizados, modoPickingManual: nuevoPicking });
    guardarPasosEnCacheLocal(actualizados, state.manualActivoGuardado);
  },

  asignarPiezaASubBloque: (pasoId: string, subbloqueId: string, nombrePieza: string) => {
    const state = get();
    const piezaKey = (nombrePieza || "").trim();
    if (!piezaKey) return;
    const esHerraje = esHerrajeNombre(piezaKey);

    const actualizados = state.pasosManual.map((p: any) => {
      if (p.id !== pasoId || !p.subbloques) return p;
      const modificados = p.subbloques.map((s: SubBloqueArmado) => {
        if (s.id !== subbloqueId) return s;
        if (esHerraje) {
          if (s.herrajes.includes(piezaKey)) return s;
          return { ...s, herrajes: [...s.herrajes, piezaKey] };
        } else {
          if (s.piezas.includes(piezaKey)) return s;
          return { ...s, piezas: [...s.piezas, piezaKey] };
        }
      });
      const todasPz = esHerraje ? p.piezasAsignadas : Array.from(new Set([...p.piezasAsignadas, piezaKey]));
      const todosHr = esHerraje ? Array.from(new Set([...p.herrajesAsignados, piezaKey])) : p.herrajesAsignados;

      return {
        ...p,
        piezasAsignadas: todasPz,
        herrajesAsignados: todosHr,
        subbloques: modificados,
      };
    });

    let nuevoPicking = state.modoPickingManual;
    if (state.modoPickingManual.activo && state.modoPickingManual.grupoId === subbloqueId) {
      if (!state.modoPickingManual.piezasTemporalmenteSeleccionadas.includes(piezaKey)) {
        nuevoPicking = {
          ...state.modoPickingManual,
          piezasTemporalmenteSeleccionadas: [...state.modoPickingManual.piezasTemporalmenteSeleccionadas, piezaKey],
        };
      }
    }

    set({ pasosManual: actualizados, modoPickingManual: nuevoPicking });
    guardarPasosEnCacheLocal(actualizados, state.manualActivoGuardado);
  },

  desasignarPiezaDeSubBloque: (pasoId: string, subbloqueId: string, nombrePieza: string) => {
    const state = get();
    const piezaKey = (nombrePieza || "").trim();
    const pmKey = extraerPiezaMadre(piezaKey);

    const actualizados = state.pasosManual.map((p: any) => {
      if (p.id !== pasoId || !p.subbloques) return p;
      const modificados = p.subbloques.map((s: SubBloqueArmado) => {
        if (s.id !== subbloqueId) return s;
        return {
          ...s,
          piezas: s.piezas.filter((pz) => pz !== piezaKey && pz !== nombrePieza && pz !== pmKey && extraerPiezaMadre(pz) !== pmKey),
          herrajes: s.herrajes.filter((hr) => hr !== piezaKey && hr !== nombrePieza && hr !== pmKey && extraerPiezaMadre(hr) !== pmKey),
        };
      });
      return { ...p, subbloques: modificados };
    });

    let nuevoPicking = state.modoPickingManual;
    if (state.modoPickingManual.activo && (!state.modoPickingManual.grupoId || state.modoPickingManual.grupoId === subbloqueId)) {
      nuevoPicking = {
        ...state.modoPickingManual,
        piezasTemporalmenteSeleccionadas: state.modoPickingManual.piezasTemporalmenteSeleccionadas.filter(
          (p: string) => p !== piezaKey && p !== nombrePieza && p !== pmKey && extraerPiezaMadre(p) !== pmKey
        ),
      };
    }

    set({ pasosManual: actualizados, modoPickingManual: nuevoPicking });
    guardarPasosEnCacheLocal(actualizados, state.manualActivoGuardado);
  },

  conmutarVisibilidadSubBloqueArmado: (pasoId: string, subbloqueId: string) => {
    const state = get();
    let nuevoPicking = state.modoPickingManual;
    const actualizados = state.pasosManual.map((p: any) => {
      if (p.id !== pasoId || !p.subbloques) return p;
      const modificados = p.subbloques.map((s: SubBloqueArmado) => {
        if (s.id !== subbloqueId) return s;
        const nuevoOculto = !s.oculto;
        if (nuevoOculto && state.modoPickingManual.activo && state.modoPickingManual.grupoId === subbloqueId) {
          nuevoPicking = {
            activo: false,
            modo: "agregar",
            grupoId: null,
            pasoId: null,
            piezasTemporalmenteSeleccionadas: [],
          };
        }
        return { ...s, oculto: nuevoOculto };
      });
      return { ...p, subbloques: modificados };
    });
    set({ pasosManual: actualizados, modoPickingManual: nuevoPicking });
    guardarPasosEnCacheLocal(actualizados, state.manualActivoGuardado);
  },

  subbloqueSoloId: null,
  setSubbloqueSolo: (subbloqueSoloId: string | null) => set({ subbloqueSoloId }),

  actualizarTransformBancoSubBloque: (pasoId: string, subbloqueId: string, transform: any) => {
    const state = get();
    const actualizados = state.pasosManual.map((p: any) => {
      if (p.id !== pasoId || !p.subbloques) return p;
      const modificados = p.subbloques.map((s: SubBloqueArmado) => {
        if (s.id !== subbloqueId) return s;
        const actual = s.transformBanco || {
          acostado: false,
          rotacionYDeg: 0,
          rotacion: [0, 0, 0] as [number, number, number],
          rotacionPlano: 0,
          flipCara: false,
          offsetX: 0,
          offsetZ: 0,
          apoyoEnPiso: true,
        };
        return {
          ...s,
          transformBanco: { ...actual, ...transform },
        };
      });
      return { ...p, subbloques: modificados };
    });
    set({ pasosManual: actualizados });
    guardarPasosEnCacheLocal(actualizados, state.manualActivoGuardado);
  },

  resetTransformBancoSubBloque: (pasoId: string, subbloqueId: string) => {
    const state = get();
    const actualizados = state.pasosManual.map((p: any) => {
      if (p.id !== pasoId || !p.subbloques) return p;
      const modificados = p.subbloques.map((s: SubBloqueArmado) => {
        if (s.id !== subbloqueId) return s;
        return {
          ...s,
          transformBanco: {
            acostado: false,
            rotacionYDeg: 0,
            rotacion: [0, 0, 0] as [number, number, number],
            rotacionPlano: 0,
            flipCara: false,
            offsetX: 0,
            offsetZ: 0,
            apoyoEnPiso: true,
          },
        };
      });
      return { ...p, subbloques: modificados };
    });
    set({ pasosManual: actualizados });
    guardarPasosEnCacheLocal(actualizados, state.manualActivoGuardado);
  },

  actualizarTrackSubBloque: (pasoId: string, subbloqueId: string, track: any) => {
    const state = get();
    const actualizados = state.pasosManual.map((p: any) => {
      if (p.id !== pasoId || !p.subbloques) return p;
      const modificados = p.subbloques.map((s: SubBloqueArmado) => {
        if (s.id !== subbloqueId) return s;
        const actual = s.trackAnimacion || {
          tiempoInicio: 0,
          duracion: Math.max(p.duracionTotal || 5.0, 1.0),
        };
        return {
          ...s,
          trackAnimacion: { ...actual, ...track },
        };
      });
      return { ...p, subbloques: modificados };
    });
    set({ pasosManual: actualizados });
    guardarPasosEnCacheLocal(actualizados, state.manualActivoGuardado);
  },

  setCoreografiaSubbloques: (pasoId: string, coreografia: any) => {
    const state = get();
    const actualizados = state.pasosManual.map((p: any) => {
      if (p.id !== pasoId) return p;
      return { ...p, coreografiaSubbloques: coreografia };
    });
    set({ pasosManual: actualizados });
    guardarPasosEnCacheLocal(actualizados, state.manualActivoGuardado);
  },
});
