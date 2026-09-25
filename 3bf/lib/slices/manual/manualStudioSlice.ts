// @ts-nocheck
import {
  obtenerCalibracionInicial,
  STORAGE_KEY_ILUMINACION,
  defaultLucesEstudio,
  defaultCalibracion,
  kelvinToHex,
  PRESETS_ILUMINACION,
  DEFAULT_HDRI_CONFIG,
} from "../../storeDefaults";
import type { StudioLightConfig, CalibracionVisual } from "../../storeTypes";

export const createManualStudioSlice = (set: any, get: any): any => ({
  workerStatus: "checking",
  setWorkerStatus: (workerStatus: string) => set({ workerStatus }),

  modoVisual: "semitransparente",
  setModoVisual: (modoVisual: string) => set({ modoVisual }),

  escenarioLimpio: false,
  setEscenarioLimpio: (escenarioLimpio: boolean) => set({ escenarioLimpio }),

  calibracion: obtenerCalibracionInicial(),
  tieneIluminacionPredeterminada:
    typeof window !== "undefined" && window.localStorage
      ? Boolean(localStorage.getItem(STORAGE_KEY_ILUMINACION))
      : false,

  setCalibracion: (key: string, value: any) =>
    set((state: any) => ({
      calibracion: { ...state.calibracion, [key]: value },
    })),

  resetCalibracion: () => set({ calibracion: defaultCalibracion }),

  // 💡 Iluminación de Estudio Interactiva
  setLuzPropiedad: (luzId: string, prop: string, valor: any) =>
    set((state: any) => {
      const luzActual = state.calibracion.lucesEstudio?.[luzId];
      if (!luzActual) return state;

      const luzActualizada: StudioLightConfig = {
        ...luzActual,
        [prop]: valor,
      };

      // Si cambia temperatura Kelvin, actualizar también el color Hex
      if (prop === "temperaturaKelvin") {
        luzActualizada.color = kelvinToHex(Number(valor));
      }

      // Sincronización retrocompatible de intensidades
      const extraSync: Partial<CalibracionVisual> = {};
      if (prop === "intensidad") {
        if (luzId === "key_sun") extraSync.intensidadLuzDirecta = Number(valor);
        if (luzId === "fill_light") extraSync.intensidadLuzRelleno = Number(valor);
        if (luzId === "ambient_light") extraSync.intensidadLuzAmbiental = Number(valor);
        if (luzId === "env_hdri") extraSync.intensidadLuzEntorno = Number(valor);
      }

      return {
        calibracion: {
          ...state.calibracion,
          ...extraSync,
          lucesEstudio: {
            ...state.calibracion.lucesEstudio,
            [luzId]: luzActualizada,
          },
        },
      };
    }),

  setLuzTarget: (luzId: string, target: [number, number, number]) =>
    set((state: any) => {
      const luz = state.calibracion.lucesEstudio?.[luzId];
      if (!luz) return state;
      return {
        calibracion: {
          ...state.calibracion,
          lucesEstudio: {
            ...state.calibracion.lucesEstudio,
            [luzId]: { ...luz, target },
          },
        },
      };
    }),

  setLuzPosicionCartesiana: (luzId: string, pos: [number, number, number]) =>
    set((state: any) => {
      const luz = state.calibracion.lucesEstudio?.[luzId];
      if (!luz) return state;
      const [x, y, z] = pos;
      const distancia = Math.max(0.5, Math.sqrt(x * x + y * y + z * z));
      const elevacion = Math.max(
        5,
        Math.min(85, Math.round((Math.asin(Math.max(-1, Math.min(1, y / distancia))) * 180) / Math.PI))
      );
      let azimut = Math.round((Math.atan2(x, z) * 180) / Math.PI);
      if (azimut < 0) azimut += 360;

      return {
        calibracion: {
          ...state.calibracion,
          lucesEstudio: {
            ...state.calibracion.lucesEstudio,
            [luzId]: {
              ...luz,
              distancia: Number(distancia.toFixed(2)),
              elevacion,
              azimut,
            },
          },
        },
      };
    }),

  enfocarLuzACentro: (luzId: string) => {
    get().setLuzTarget(luzId, [0, 0.45, 0]);
  },

  seleccionarLuzEstudio: (luzId: string | null) =>
    set((state: any) => ({
      calibracion: {
        ...state.calibracion,
        luzSeleccionadaId: luzId,
      },
    })),

  toggleGizmosLuces: (mostrar?: boolean) =>
    set((state: any) => ({
      calibracion: {
        ...state.calibracion,
        mostrarGizmosLuces: mostrar !== undefined ? mostrar : !state.calibracion.mostrarGizmosLuces,
      },
    })),

  mostrarMarcoEncuadre: false,
  setMostrarMarcoEncuadre: (mostrar: boolean) => set({ mostrarMarcoEncuadre: mostrar }),
  toggleMarcoEncuadre: () => set((s: any) => ({ mostrarMarcoEncuadre: !s.mostrarMarcoEncuadre })),

  aplicarPresetIluminacion: (presetKey: string) =>
    set((state: any) => {
      const preset = PRESETS_ILUMINACION[presetKey];
      if (!preset) return state;

      const lucesActuales = { ...(state.calibracion.lucesEstudio || defaultLucesEstudio) };
      Object.entries(preset.luces).forEach(([lId, cambios]) => {
        if (lucesActuales[lId]) {
          lucesActuales[lId] = {
            ...lucesActuales[lId],
            ...cambios,
            color: cambios.temperaturaKelvin
              ? kelvinToHex(cambios.temperaturaKelvin)
              : (cambios.color || lucesActuales[lId].color),
          };
        }
      });

      return {
        calibracion: {
          ...state.calibracion,
          presetIluminacion: presetKey,
          intensidadLuzDirecta: lucesActuales["key_sun"]?.intensidad ?? state.calibracion.intensidadLuzDirecta,
          intensidadLuzRelleno: lucesActuales["fill_light"]?.intensidad ?? state.calibracion.intensidadLuzRelleno,
          intensidadLuzAmbiental:
            lucesActuales["ambient_light"]?.intensidad ?? state.calibracion.intensidadLuzAmbiental,
          lucesEstudio: lucesActuales,
        },
      };
    }),

  guardarIluminacionPredeterminada: () => {
    const { calibracion } = get();
    if (typeof window !== "undefined" && window.localStorage) {
      const configAGuardar = {
        presetIluminacion: calibracion.presetIluminacion,
        lucesEstudio: calibracion.lucesEstudio,
        intensidadLuzDirecta: calibracion.intensidadLuzDirecta,
        intensidadLuzAmbiental: calibracion.intensidadLuzAmbiental,
        intensidadLuzEntorno: calibracion.intensidadLuzEntorno,
        intensidadLuzRelleno: calibracion.intensidadLuzRelleno,
        mostrarGizmosLuces: calibracion.mostrarGizmosLuces,
      };
      try {
        localStorage.setItem(STORAGE_KEY_ILUMINACION, JSON.stringify(configAGuardar));
      } catch (e) {
        console.error("Error guardando iluminación predeterminada:", e);
      }
      set({ tieneIluminacionPredeterminada: true });
    }
  },

  restaurarIluminacionPredeterminada: () => {
    if (typeof window !== "undefined" && window.localStorage) {
      localStorage.removeItem(STORAGE_KEY_ILUMINACION);
    }
    set((state: any) => ({
      tieneIluminacionPredeterminada: false,
      calibracion: {
        ...state.calibracion,
        presetIluminacion: "estudio_suave",
        lucesEstudio: defaultLucesEstudio,
        intensidadLuzDirecta: 0.9,
        intensidadLuzAmbiental: 0.45,
        intensidadLuzEntorno: 1.0,
        intensidadLuzRelleno: 0.6,
      },
    }));
  },

  setHdriPersonalizado: (file: File) => {
    const ext = file.name.split(".").pop()?.toLowerCase() || "";
    const isImage = ["jpg", "jpeg", "png", "webp"].includes(ext);
    const blobUrl = URL.createObjectURL(file);

    set((state: any) => {
      const lucesActuales = { ...(state.calibracion.lucesEstudio || defaultLucesEstudio) };
      const envHdriActual = lucesActuales["env_hdri"] || defaultLucesEstudio.env_hdri;

      lucesActuales["env_hdri"] = {
        ...envHdriActual,
        hdriUrl: blobUrl,
        hdriNombre: file.name,
        hdriThumbnailUrl: isImage ? blobUrl : undefined,
        esHdriPorDefecto: false,
      };

      return {
        calibracion: {
          ...state.calibracion,
          lucesEstudio: lucesActuales,
        },
      };
    });
  },

  restablecerHdriPorDefecto: () => {
    set((state: any) => {
      const lucesActuales = { ...(state.calibracion.lucesEstudio || defaultLucesEstudio) };
      const envHdriActual = lucesActuales["env_hdri"] || defaultLucesEstudio.env_hdri;

      lucesActuales["env_hdri"] = {
        ...envHdriActual,
        hdriUrl: DEFAULT_HDRI_CONFIG.url,
        hdriNombre: DEFAULT_HDRI_CONFIG.nombre,
        hdriThumbnailUrl: DEFAULT_HDRI_CONFIG.thumbnailUrl,
        esHdriPorDefecto: true,
      };

      return {
        calibracion: {
          ...state.calibracion,
          lucesEstudio: lucesActuales,
        },
      };
    });
  },

  hoveredPiece: null,
  setHoveredPiece: (hoveredPiece: string | null) => set({ hoveredPiece }),

  // Blender N-Panel (Sidebar)
  mostrarNPanel:
    typeof window !== "undefined" &&
    window.innerWidth >= 1024 &&
    window.localStorage &&
    localStorage.getItem("3bf_mostrar_npanel") === "true",
  setMostrarNPanel: (mostrar: boolean | ((prev: boolean) => boolean)) =>
    set((state: any) => {
      const nuevo = typeof mostrar === "function" ? mostrar(state.mostrarNPanel) : mostrar;
      if (typeof window !== "undefined" && window.localStorage) {
        localStorage.setItem("3bf_mostrar_npanel", String(nuevo));
      }
      return { mostrarNPanel: nuevo };
    }),

  pestanaNPanel: "componentes",
  setPestanaNPanel: (pestanaNPanel: any) => set({ pestanaNPanel }),

  anchoNPanel:
    typeof window !== "undefined" &&
    window.localStorage &&
    localStorage.getItem("3bf_ancho_npanel")
      ? (() => {
          const val = Number(localStorage.getItem("3bf_ancho_npanel"));
          const esMovil = typeof window !== "undefined" && window.innerWidth < 1024;
          if (esMovil) {
            // En móvil forzar siempre escala ultra-angosta (175px por defecto, max 195px)
            if (!val || val > 195 || val < 130) return 175;
            return Math.max(140, Math.min(195, val));
          }
          if (!val || val < 280) return 380; // En PC restaurar a 380
          const maxLimit = typeof window !== "undefined" ? Math.max(1400, window.innerWidth - 60) : 1400;
          return Math.max(280, Math.min(maxLimit, val));
        })()
      : typeof window !== "undefined" && window.innerWidth < 1024
      ? 175
      : 380,

  setAnchoNPanel: (ancho: number) => {
    const esMovil = typeof window !== "undefined" && window.innerWidth < 1024;
    const minW = esMovil ? 140 : 280;
    const maxW = esMovil ? 360 : typeof window !== "undefined" ? Math.max(1400, window.innerWidth - 60) : 1400;
    const normalizado = Math.max(minW, Math.min(maxW, ancho));
    if (typeof window !== "undefined" && window.localStorage) {
      localStorage.setItem("3bf_ancho_npanel", String(normalizado));
    }
    set({ anchoNPanel: normalizado });
  },

  anchoNPanelManual:
    typeof window !== "undefined" &&
    window.localStorage &&
    localStorage.getItem("3bf_ancho_npanel_manual")
      ? (() => {
          const val = Number(localStorage.getItem("3bf_ancho_npanel_manual"));
          const esMovil = typeof window !== "undefined" && window.innerWidth < 1024;
          if (esMovil) {
            if (!val || val > 360 || val < 140) return 260;
            return Math.max(140, Math.min(360, val));
          }
          if (!val || val < 500) return 740; // En PC Modo Manual por defecto 740px funcional
          const maxLimit = typeof window !== "undefined" ? Math.max(3840, window.innerWidth - 20) : 3840;
          return Math.max(500, Math.min(maxLimit, val));
        })()
      : typeof window !== "undefined" && window.innerWidth < 1024
      ? 260
      : 740,

  setAnchoNPanelManual: (ancho: number) => {
    const esMovil = typeof window !== "undefined" && window.innerWidth < 1024;
    const minW = esMovil ? 140 : 500;
    const maxW = esMovil ? (typeof window !== "undefined" ? Math.max(360, window.innerWidth - 10) : 360) : (typeof window !== "undefined" ? Math.max(3840, window.innerWidth - 20) : 3840);
    const normalizado = Math.max(minW, Math.min(maxW, ancho));
    if (typeof window !== "undefined" && window.localStorage) {
      localStorage.setItem("3bf_ancho_npanel_manual", String(normalizado));
    }
    set({ anchoNPanelManual: normalizado });
  },

  anchoPanelDerecho:
    typeof window !== "undefined" &&
    window.localStorage &&
    localStorage.getItem("3bf_ancho_panel_derecho")
      ? (() => {
          const val = Number(localStorage.getItem("3bf_ancho_panel_derecho"));
          const esMovil = typeof window !== "undefined" && window.innerWidth < 1024;
          if (esMovil) {
            // En móvil forzar siempre escala ultra-angosta (180px por defecto, max 210px)
            if (!val || val > 210 || val < 150) return 180;
            return Math.max(150, Math.min(210, val));
          }
          if (!val || val < 280) return 380; // En PC restaurar a 380
          const maxLimit = typeof window !== "undefined" ? Math.max(3840, window.innerWidth - 60) : 3840;
          return Math.max(280, Math.min(maxLimit, val));
        })()
      : typeof window !== "undefined" && window.innerWidth < 1024
      ? 180
      : 380,

  setAnchoPanelDerecho: (ancho: number) => {
    const esMovil = typeof window !== "undefined" && window.innerWidth < 1024;
    const minW = esMovil ? 150 : 280;
    const maxW = esMovil 
      ? (typeof window !== "undefined" ? Math.min(window.innerWidth - 20, 360) : 220) 
      : (typeof window !== "undefined" ? Math.max(3840, window.innerWidth - 60) : 3840);
    const normalizado = Math.max(minW, Math.min(maxW, ancho));
    if (typeof window !== "undefined" && window.localStorage) {
      localStorage.setItem("3bf_ancho_panel_derecho", String(normalizado));
    }
    set({ anchoPanelDerecho: normalizado });
  },
});
