// @ts-nocheck
import { guardarPasosEnCacheLocal } from "../../storeDefaults";

export const createManualCameraSlice = (set: any, get: any): any => ({
  // 🎥 Keyframes de Cámara Cinematográfica por Paso
  capturarKeyframeCamaraPaso: (
    pasoId: string,
    tiempo: number,
    posicion: [number, number, number],
    target: [number, number, number],
    fov?: number
  ) => {
    set((state: any) => {
      const tiempoNormalizado = Math.max(0, Math.round(tiempo * 100) / 100);
      const nuevosPasos = state.pasosManual.map((p: any) => {
        if (p.id !== pasoId) return p;

        const kfsExistentes = [...(p.keyframesCamara || [])];
        // Buscar si ya existe un keyframe dentro de una tolerancia de 0.1s para sobreescribirlo
        const idxExistente = kfsExistentes.findIndex(
          (k: any) => Math.abs(k.tiempo - tiempoNormalizado) < 0.1
        );

        const nuevoKf = {
          id:
            idxExistente >= 0
              ? kfsExistentes[idxExistente].id
              : `kf_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
          tiempo: tiempoNormalizado,
          posicion,
          target,
          fov,
        };

        if (idxExistente >= 0) {
          kfsExistentes[idxExistente] = nuevoKf;
        } else {
          kfsExistentes.push(nuevoKf);
        }

        // Mantener ordenados cronológicamente
        kfsExistentes.sort((a: any, b: any) => a.tiempo - b.tiempo);

        return {
          ...p,
          keyframesCamara: kfsExistentes,
          camaraCinematicaActiva: true, // Auto-activar al capturar un keyframe
        };
      });

      guardarPasosEnCacheLocal(nuevosPasos, state.manualActivoGuardado);
      return { pasosManual: nuevosPasos };
    });
  },

  eliminarKeyframeCamaraPaso: (pasoId: string, kfId: string) => {
    set((state: any) => {
      const nuevosPasos = state.pasosManual.map((p: any) => {
        if (p.id !== pasoId) return p;
        const kfsRestantes = (p.keyframesCamara || []).filter((k: any) => k.id !== kfId);
        return {
          ...p,
          keyframesCamara: kfsRestantes,
        };
      });

      guardarPasosEnCacheLocal(nuevosPasos, state.manualActivoGuardado);
      return { pasosManual: nuevosPasos };
    });
  },

  toggleCamaraCinematicaPaso: (pasoId: string) => {
    set((state: any) => {
      const nuevosPasos = state.pasosManual.map((p: any) => {
        if (p.id !== pasoId) return p;
        const estadoActual = p.camaraCinematicaActiva ?? true;
        return {
          ...p,
          camaraCinematicaActiva: !estadoActual,
        };
      });

      guardarPasosEnCacheLocal(nuevosPasos, state.manualActivoGuardado);
      return { pasosManual: nuevosPasos };
    });
  },

  moverKeyframeCamaraPaso: (pasoId: string, kfId: string, nuevoTiempo: number) => {
    set((state: any) => {
      const tiempoNormalizado = Math.max(0, Math.round(nuevoTiempo * 100) / 100);
      const nuevosPasos = state.pasosManual.map((p: any) => {
        if (p.id !== pasoId) return p;
        const kfs = (p.keyframesCamara || []).map((k: any) =>
          k.id === kfId ? { ...k, tiempo: tiempoNormalizado } : k
        );
        kfs.sort((a: any, b: any) => a.tiempo - b.tiempo);
        return {
          ...p,
          keyframesCamara: kfs,
        };
      });

      guardarPasosEnCacheLocal(nuevosPasos, state.manualActivoGuardado);
      return { pasosManual: nuevosPasos };
    });
  },

  sobrescribirKeyframeCamaraPaso: (
    pasoId: string,
    kfId: string,
    posicion: [number, number, number],
    target: [number, number, number],
    fov?: number
  ) => {
    set((state: any) => {
      const nuevosPasos = state.pasosManual.map((p: any) => {
        if (p.id !== pasoId) return p;
        const kfs = (p.keyframesCamara || []).map((k: any) =>
          k.id === kfId ? { ...k, posicion, target, fov: fov ?? k.fov } : k
        );
        return {
          ...p,
          keyframesCamara: kfs,
        };
      });

      guardarPasosEnCacheLocal(nuevosPasos, state.manualActivoGuardado);
      return { pasosManual: nuevosPasos };
    });
  },
});
