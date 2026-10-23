// @ts-nocheck
import {
  getCachedManualData,
  sanitizarPasosManuales,
  generarPasosManualesPorDefecto,
  guardarPasosEnCacheLocal,
  purgarResultadoGeometria,
  STORAGE_KEY_MANUAL_ACTIVO,
  STORAGE_KEY_LAST_MANUAL_ID,
} from "../../storeDefaults";
import type {
  Manual3BMProyecto,
  ObjetoInstancia3BF,
  MuebleGuardadoItem,
} from "../../storeTypes";

export const createManualProyectosSlice = (set: any, get: any): any => {
  const initialCachedManual = getCachedManualData();

  return {
    // 📦 Persistencia de Manuales en Google Drive (.3bm.json) y Caché Local
    manualActivoGuardado: initialCachedManual.manual,
    manualesDrive: [],
    modalBibliotecaManualesAbierto: false,
    guardandoManual: false,

    setModalBibliotecaManualesAbierto: (modalBibliotecaManualesAbierto: boolean) =>
      set({ modalBibliotecaManualesAbierto }),

        cargarManualesDesdeDrive: async () => {
      try {
        const res = await fetch("/api/drive/manuales", { method: "GET" });
        if (res.ok) {
          const data = await res.json();
          if (data.manuales && Array.isArray(data.manuales)) {
            set({ manualesDrive: data.manuales });
          }
        }
      } catch (e) {
        console.warn("[3dBimFab Drive] Error cargando manuales:", e);
      }
    },

    cargarManualProyecto: (manual: Manual3BMProyecto) => {
      const pasosCrudos = manual.pasos && manual.pasos.length > 0 ? manual.pasos : [];
      const pasos = sanitizarPasosManuales(pasosCrudos);
      set({
        manualActivoGuardado: manual,
        pasosManual: pasos,
        pasoActivoManualId: pasos[0]?.id || null,
        timelineCurrentTime: 0,
        isTimelinePlaying: false,
        modalBibliotecaManualesAbierto: false,
      });
      guardarPasosEnCacheLocal(pasos, manual);
    },

    guardarManualProyecto: async (_nombre?: string, _marca?: string, _tipologia?: string) => {
      return await get().guardarProyectoCompleto();
    },

    eliminarManualProyecto: async (manualId: string) => {
      try {
        const res = await fetch("/api/drive/manuales", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "delete_manual", id: manualId }),
        });
        if (res.ok) {
          const state = get();
          if (state.manualActivoGuardado?.id === manualId) {
            set({ manualActivoGuardado: null });
            if (typeof window !== "undefined" && window.localStorage) {
              localStorage.removeItem(STORAGE_KEY_MANUAL_ACTIVO);
              localStorage.removeItem(STORAGE_KEY_LAST_MANUAL_ID);
            }
          }
          await get().cargarManualesDesdeDrive();
        }
      } catch (e) {
        console.error("[3dBimFab Drive] Error eliminando manual:", e);
      }
    },
  };
};
