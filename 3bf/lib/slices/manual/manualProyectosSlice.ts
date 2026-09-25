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
          if (data.manuales) {
            set({ manualesDrive: data.manuales });

            // 🛡️ Auto-restauración en recarga (F5):
            // REGLA SUPREMA: NUNCA sobreescribir pasos si el usuario ya tiene grupos cinemáticos o piezas locales
            const state = get();
            const p00 = (state.pasosManual || []).find((p: any) => p.id === "P00");
            const tieneGruposConfigurados = (p00?.showcase?.gruposCinematicos?.length || 0) > 0;
            const tienePiezasAsignadas = (state.pasosManual || []).some(
              (p: any) => (p.piezasAsignadas && p.piezasAsignadas.length > 0) || (p.herrajesAsignados && p.herrajesAsignados.length > 0)
            );
            const tienePasosMultiples = (state.pasosManual || []).length > 1;
            const tieneTrabajoLocal = tieneGruposConfigurados || tienePiezasAsignadas || tienePasosMultiples;

            // 1. Intentar vincular por muebleActivoGuardado y puntuación de relevancia
            const muebleActivoId = state.muebleActivoGuardado?.id;
            const muebleActivoNombre = state.muebleActivoGuardado?.nombre;

            const scoreManual = (m: any) => {
              const matchId = (muebleActivoId && m.muebleOrigenId === muebleActivoId) ? 100 : 0;
              const matchManualId = (state.muebleActivoGuardado?.manualVinculadoId && m.id === state.muebleActivoGuardado.manualVinculadoId) ? 30 : 0;
              const matchMarca = (m.marca && state.muebleActivoGuardado?.marca && m.marca.toLowerCase() === state.muebleActivoGuardado.marca.toLowerCase()) ? 50 : 0;
              const matchNombre = (muebleActivoNombre && m.nombre && m.nombre.toLowerCase().includes(muebleActivoNombre.toLowerCase())) ? 20 : 0;
              const pasosCount = Array.isArray(m.pasos) ? m.pasos.length : 0;
              const p00 = m.pasos?.find((p: any) => p.id === "P00");
              const gruposCount = p00?.showcase?.gruposCinematicos?.length || 0;
              return matchId + matchMarca + matchManualId + matchNombre + (pasosCount * 10) + gruposCount;
            };

            const sortedManuales = [...data.manuales].sort((a: any, b: any) => scoreManual(b) - scoreManual(a));
            const bestCandidate = sortedManuales[0];
            let target = (bestCandidate && scoreManual(bestCandidate) > 0) ? bestCandidate : null;

            // 2. Si no hay target específico por ID pero el manual actual local no tiene grupos cinemáticos,
            // buscar el manual guardado en Drive que sí tenga grupos cinemáticos en P00 o múltiples pasos
            if (!target && !tieneTrabajoLocal) {
              target = data.manuales.find((m: any) => {
                const p00m = (m.pasos || []).find((p: any) => p.id === "P00");
                return (p00m?.showcase?.gruposCinematicos?.length || 0) > 0 || (m.pasos || []).length > 1;
              });
            }

            if (target && target.pasos && target.pasos.length > 0) {
              const numPasosLocales = (state.pasosManual || []).length;
              const numPasosTarget = target.pasos.length;
              if (tieneTrabajoLocal && numPasosLocales >= numPasosTarget) {
                if (!state.manualActivoGuardado) {
                  const manualEnlazado: Manual3BMProyecto = {
                    ...target,
                    pasos: state.pasosManual,
                    fechaModificacion: new Date().toISOString(),
                  };
                  set({ manualActivoGuardado: manualEnlazado });
                  guardarPasosEnCacheLocal(state.pasosManual, manualEnlazado);
                }
              } else {
                // Restaurar automáticamente la versión completa guardada con animaciones y pasos
                console.log("[3dBimFab] Auto-hidratando manual guardado desde Drive:", target.nombre, "con", numPasosTarget, "pasos");
                get().cargarManualProyecto(target);
              }
            }
          }
        }
      } catch (e) {
        console.warn("[3dBimFab Drive] Error cargando manuales:", e);
      }
    },

    cargarManualProyecto: (manual: Manual3BMProyecto) => {
      const pasosCrudos = manual.pasos && manual.pasos.length > 0 ? manual.pasos : generarPasosManualesPorDefecto();
      const pasos = sanitizarPasosManuales(pasosCrudos);
      set({
        manualActivoGuardado: manual,
        pasosManual: pasos,
        pasoActivoManualId: pasos[0]?.id || "P00",
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
