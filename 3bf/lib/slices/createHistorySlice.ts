import type { SnapshotEscenario } from "../storeTypes";
import { guardarPasosEnCacheLocal } from "../storeDefaults";

export interface HistorySlice {
  pilaHistorial: SnapshotEscenario[];
  indiceHistorial: number;
  puedeDeshacer: boolean;
  puedeRehacer: boolean;
  guardarEstadoHistorial: () => void;
  prepararHistorialParaCambio: () => void;
  deshacer: () => void;
  rehacer: () => void;
}

export const createHistorySlice = (set: any, get: any): HistorySlice => ({
  pilaHistorial: [],
  indiceHistorial: -1,
  puedeDeshacer: false,
  puedeRehacer: false,

  prepararHistorialParaCambio: () => {
    const s = get();
    if (s.pilaHistorial.length === 0) {
      s.guardarEstadoHistorial();
    }
  },

  guardarEstadoHistorial: () => {
    const s = get();
    const snapshot: SnapshotEscenario = {
      instancias: Object.fromEntries(
        Object.entries(s.instancias || {}).map(([k, v]: [string, any]) => [
          k,
          {
            ...v,
            posicion: Array.isArray(v.posicion) ? [...v.posicion] as [number, number, number] : [0, 0, 0],
            rotacion: Array.isArray(v.rotacion) ? [...v.rotacion] as [number, number, number] : [0, 0, 0],
            parametros: { ...(v.parametros || {}) },
          },
        ])
      ),
      objetoActivoId: s.objetoActivoId,
      posicionObjeto: Array.isArray(s.posicionObjeto) ? [...s.posicionObjeto] as [number, number, number] : [0, 0, 0],
      parametros: { ...(s.parametros || {}) },
      resultado: s.resultado,
      pasosManual: s.pasosManual ? JSON.parse(JSON.stringify(s.pasosManual)) : undefined,
      pasoActivoManualId: s.pasoActivoManualId,
      capas: s.capas ? JSON.parse(JSON.stringify(s.capas)) : undefined,
    };

    const historialValido = s.pilaHistorial.slice(0, s.indiceHistorial + 1);
    const nuevoHistorial = [...historialValido, snapshot];

    // Limitar estrictamente a 100 estados de historial
    if (nuevoHistorial.length > 100) {
      nuevoHistorial.shift();
    }

    set({
      pilaHistorial: nuevoHistorial,
      indiceHistorial: nuevoHistorial.length - 1,
      puedeDeshacer: nuevoHistorial.length > 1,
      puedeRehacer: false,
    });
  },

  deshacer: () => {
    const s = get();
    if (s.indiceHistorial > 0) {
      const nuevoIndice = s.indiceHistorial - 1;
      const estado = s.pilaHistorial[nuevoIndice];
      if (estado) {
        const updates: any = {
          instancias: Object.fromEntries(
            Object.entries(estado.instancias || {}).map(([k, v]: [string, any]) => [
              k,
              {
                ...v,
                posicion: Array.isArray(v.posicion) ? [...v.posicion] : [0, 0, 0],
                rotacion: Array.isArray(v.rotacion) ? [...v.rotacion] : [0, 0, 0],
                parametros: { ...(v.parametros || {}) },
              },
            ])
          ),
          objetoActivoId: estado.objetoActivoId,
          objetoSeleccionado: estado.objetoActivoId !== null,
          posicionObjeto: Array.isArray(estado.posicionObjeto) ? [...estado.posicionObjeto] : [0, 0, 0],
          posicionPrevia: Array.isArray(estado.posicionObjeto) ? [...estado.posicionObjeto] : [0, 0, 0],
          parametros: { ...estado.parametros },
          resultado: estado.resultado,
          indiceHistorial: nuevoIndice,
          puedeDeshacer: nuevoIndice > 0,
          puedeRehacer: true,
          modoTransformacion: "none",
        };

        if (estado.pasosManual) {
          const pasosClonados = JSON.parse(JSON.stringify(estado.pasosManual));
          updates.pasosManual = pasosClonados;
          updates.versionAnimacionManual = (s.versionAnimacionManual || 0) + 1;
          if (estado.pasoActivoManualId) {
            updates.pasoActivoManualId = estado.pasoActivoManualId;
          }
          guardarPasosEnCacheLocal(pasosClonados, s.manualActivoGuardado);
        }

        if (estado.capas) {
          const capasClonadas = JSON.parse(JSON.stringify(estado.capas));
          updates.capas = capasClonadas;
          if (typeof window !== "undefined" && window.localStorage) {
            localStorage.setItem("3bf_capas_v1", JSON.stringify(capasClonadas));
          }
        }

        set(updates);
      }
    }
  },

  rehacer: () => {
    const s = get();
    if (s.indiceHistorial < s.pilaHistorial.length - 1) {
      const nuevoIndice = s.indiceHistorial + 1;
      const estado = s.pilaHistorial[nuevoIndice];
      if (estado) {
        const updates: any = {
          instancias: Object.fromEntries(
            Object.entries(estado.instancias || {}).map(([k, v]: [string, any]) => [
              k,
              {
                ...v,
                posicion: Array.isArray(v.posicion) ? [...v.posicion] : [0, 0, 0],
                rotacion: Array.isArray(v.rotacion) ? [...v.rotacion] : [0, 0, 0],
                parametros: { ...(v.parametros || {}) },
              },
            ])
          ),
          objetoActivoId: estado.objetoActivoId,
          objetoSeleccionado: estado.objetoActivoId !== null,
          posicionObjeto: Array.isArray(estado.posicionObjeto) ? [...estado.posicionObjeto] : [0, 0, 0],
          posicionPrevia: Array.isArray(estado.posicionObjeto) ? [...estado.posicionObjeto] : [0, 0, 0],
          parametros: { ...estado.parametros },
          resultado: estado.resultado,
          indiceHistorial: nuevoIndice,
          puedeDeshacer: true,
          puedeRehacer: nuevoIndice < s.pilaHistorial.length - 1,
          modoTransformacion: "none",
        };

        if (estado.pasosManual) {
          const pasosClonados = JSON.parse(JSON.stringify(estado.pasosManual));
          updates.pasosManual = pasosClonados;
          updates.versionAnimacionManual = (s.versionAnimacionManual || 0) + 1;
          if (estado.pasoActivoManualId) {
            updates.pasoActivoManualId = estado.pasoActivoManualId;
          }
          guardarPasosEnCacheLocal(pasosClonados, s.manualActivoGuardado);
        }

        if (estado.capas) {
          const capasClonadas = JSON.parse(JSON.stringify(estado.capas));
          updates.capas = capasClonadas;
          if (typeof window !== "undefined" && window.localStorage) {
            localStorage.setItem("3bf_capas_v1", JSON.stringify(capasClonadas));
          }
        }

        set(updates);
      }
    }
  },
});

