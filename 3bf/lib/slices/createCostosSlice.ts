// @ts-nocheck
import { StateCreator } from "zustand";
import { State3BF } from "../store";
import {
  HERRAJES_INICIALES_DEFECTO,
  TABLEROS_INICIALES_DEFECTO,
  CANTOS_INICIALES_DEFECTO,
  COSTOS_CONVERSION_DEFECTO,
  NEGOCIACION_NOVOPAN_DEFECTO,
  HerrajeRecord,
  TableroRecord,
  CantoRecord,
  CostosConversionConfig,
  NegociacionNovopan,
  FichaCostosConfig,
  getCachedManualData,
  calcularCostoLaminaNovopan,
  FICHA_DEFECTO,
  PromptTemplateItem,
  PROMPTS_INICIALES_DEFECTO,
  STORAGE_KEY_ILUMINACION,
  defaultLucesEstudio,
} from "../store";

export interface CostosSlice {
  dbHerrajes: HerrajeRecord[];
  dbTableros: TableroRecord[];
  dbCantos: CantoRecord[];
  costosConversion: CostosConversionConfig;
  fichasConfig: Record<string, FichaCostosConfig>;
  moneda: string;
  negociacionNovopan: NegociacionNovopan;

  setDbHerrajes: (db: HerrajeRecord[]) => void;
  setDbTableros: (db: TableroRecord[]) => void;
  setDbCantos: (db: CantoRecord[]) => void;
  setCostosConversion: (cfg: CostosConversionConfig) => void;
  updateCostoConversion: (field: keyof CostosConversionConfig, value: number) => void;
  setMoneda: (m: string) => void;
  setNegociacionNovopan: (neg: NegociacionNovopan) => void;
  updateNegociacionNovopan: (field: keyof NegociacionNovopan, value: number) => void;
  addHerraje: (item: HerrajeRecord) => void;
  updateHerraje: (id: string, item: Partial<HerrajeRecord>) => void;
  deleteHerraje: (id: string) => void;
  addTablero: (item: TableroRecord) => void;
  updateTablero: (id: string, item: Partial<TableroRecord>) => void;
  deleteTablero: (id: string) => void;
  addCanto: (item: CantoRecord) => void;
  updateCanto: (id: string, item: Partial<CantoRecord>) => void;
  deleteCanto: (id: string) => void;
  getFichaConfig: (muebleId: string) => FichaCostosConfig;
  setFichaConfig: (muebleId: string, cfg: FichaCostosConfig) => void;
  updateFichaField: (muebleId: string, field: keyof FichaCostosConfig, value: number) => void;
  hidratarBaseDatos: () => void;
}

export const createCostosSlice = (set: any, get: any): any => ({
  dbHerrajes: HERRAJES_INICIALES_DEFECTO,
  dbTableros: TABLEROS_INICIALES_DEFECTO,
  dbCantos: CANTOS_INICIALES_DEFECTO,
  costosConversion: COSTOS_CONVERSION_DEFECTO,
  fichasConfig: {},
  moneda: "COP",
  negociacionNovopan: NEGOCIACION_NOVOPAN_DEFECTO,

  setDbHerrajes: (dbHerrajes: any) => {
    try { localStorage.setItem("3bf_db_herrajes", JSON.stringify(dbHerrajes)); } catch {}
    set({ dbHerrajes });
  },
  setDbTableros: (dbTableros: any) => {
    try { localStorage.setItem("3bf_db_tableros", JSON.stringify(dbTableros)); } catch {}
    set({ dbTableros });
  },
  setDbCantos: (dbCantos: any) => {
    try { localStorage.setItem("3bf_db_cantos", JSON.stringify(dbCantos)); } catch {}
    set({ dbCantos });
  },
  setCostosConversion: (costosConversion: any) => {
    try { localStorage.setItem("3bf_costos_conversion", JSON.stringify(costosConversion)); } catch {}
    set({ costosConversion });
  },
  updateCostoConversion: (field: any, value: any) =>
    set((state) => {
      const updated = { ...state.costosConversion, [field]: value };
      try { localStorage.setItem("3bf_costos_conversion", JSON.stringify(updated)); } catch {}
      return { costosConversion: updated };
    }),
  setFichaConfig: (modelKey: any, config: any) =>
    set((state) => {
      const current = state.fichasConfig[modelKey] || FICHA_DEFECTO;
      const updatedModelConfig = { ...current, ...config };
      const updated = {
        ...state.fichasConfig,
        [modelKey]: updatedModelConfig
      };
      try {
        localStorage.setItem(`3bf_ficha_config_${modelKey}`, JSON.stringify(updatedModelConfig));
        localStorage.setItem("3bf_fichas_config", JSON.stringify(updated));
      } catch {}
      return { fichasConfig: updated };
    }),
  getFichaConfig: (modelKey: any) => {
    const state = get();
    if (state.fichasConfig[modelKey]) {
      return state.fichasConfig[modelKey];
    }
    try {
      const saved = localStorage.getItem(`3bf_ficha_config_${modelKey}`);
      if (saved) return JSON.parse(saved);
    } catch {}
    return FICHA_DEFECTO;
  },
  setMoneda: (moneda: any) => set({ moneda }),

  setNegociacionNovopan: (negociacionNovopan: any) =>
    set((state) => {
      const recalculated = state.dbTableros.map((t) => {
        if (t.proveedor === "Novopan" || t.proveedor === "Duratex") {
          const cal = calcularCostoLaminaNovopan(t.costoListaUsd, t.largoLaminaMm, t.anchoLaminaMm, t.calibreMm, undefined, negociacionNovopan, t.nombreComercial);
          return {
            ...t,
            costoLaminaUsd: cal.costoLaminaUsd,
            costoLaminaCop: cal.costoLaminaCop,
            costoM2Usd: cal.costoM2Usd,
            costoM2Cop: cal.costoM2Cop
          };
        }
        return t;
      });
      try {
        localStorage.setItem("3bf_negociacion_novopan", JSON.stringify(negociacionNovopan));
        localStorage.setItem("3bf_db_tableros", JSON.stringify(recalculated));
      } catch {}
      return { negociacionNovopan, dbTableros: recalculated };
    }),

  updateNegociacionNovopan: (field: any, value: any) =>
    set((state) => {
      const updatedNeg = { ...state.negociacionNovopan, [field]: value };
      const recalculated = state.dbTableros.map((t) => {
        if (t.proveedor === "Novopan" || t.proveedor === "Duratex") {
          const cal = calcularCostoLaminaNovopan(t.costoListaUsd, t.largoLaminaMm, t.anchoLaminaMm, t.calibreMm, undefined, updatedNeg, t.nombreComercial);
          return {
            ...t,
            costoLaminaUsd: cal.costoLaminaUsd,
            costoLaminaCop: cal.costoLaminaCop,
            costoM2Usd: cal.costoM2Usd,
            costoM2Cop: cal.costoM2Cop
          };
        }
        return t;
      });
      try {
        localStorage.setItem("3bf_negociacion_novopan", JSON.stringify(updatedNeg));
        localStorage.setItem("3bf_db_tableros", JSON.stringify(recalculated));
      } catch {}
      return { negociacionNovopan: updatedNeg, dbTableros: recalculated };
    }),

  updateDbHerraje: (id: any, field: any, value: any) =>
    set((state) => {
      const updated = state.dbHerrajes.map((h) => (h.id === id ? { ...h, [field]: value } : h));
      try { localStorage.setItem("3bf_db_herrajes", JSON.stringify(updated)); } catch {}
      return { dbHerrajes: updated };
    }),

  updateDbTablero: (id: any, field: any, value: any) =>
    set((state) => {
      const updated = state.dbTableros.map((t) => {
        if (t.id !== id) return t;
        const mod = { ...t, [field]: value };
        if (mod.proveedor === "Novopan" || mod.proveedor === "Duratex") {
          const cal = calcularCostoLaminaNovopan(mod.costoListaUsd, mod.largoLaminaMm, mod.anchoLaminaMm, mod.calibreMm, mod.descuentoCaraPct, state.negociacionNovopan, mod.nombreComercial);
          mod.costoLaminaUsd = cal.costoLaminaUsd;
          mod.costoLaminaCop = cal.costoLaminaCop;
          mod.costoM2Usd = cal.costoM2Usd;
          mod.costoM2Cop = cal.costoM2Cop;
          mod.descuentoCaraPct = cal.descuentoCaraPct;
        } else {
          const areaM2 = (mod.largoLaminaMm * mod.anchoLaminaMm) / 1_000_000.0;
          mod.costoM2Usd = Number((mod.costoLaminaUsd / areaM2).toFixed(2));
          mod.costoLaminaCop = Math.round(mod.costoLaminaUsd * 4000);
          mod.costoM2Cop = Math.round(mod.costoM2Usd * 4000);
        }
        return mod;
      });
      try { localStorage.setItem("3bf_db_tableros", JSON.stringify(updated)); } catch {}
      return { dbTableros: updated };
    }),

  hidratarDesdeLocalStorage: () => {
    if (typeof window === "undefined") return;
    try {
      const hSaved = localStorage.getItem("3bf_db_herrajes");
      if (hSaved) {
        const parsed: HerrajeRecord[] = JSON.parse(hSaved);
        const hasLegacy = parsed.some((h) => ["20070022", "20070009", "005895", "0000149", "010679", "20060067", "000478", "000468", "4829104", "4829015"].includes(h.codigo) || (h.id === "h1" && h.costoCop < 100));
        if (hasLegacy) {
          set({ dbHerrajes: HERRAJES_INICIALES_DEFECTO });
          localStorage.setItem("3bf_db_herrajes", JSON.stringify(HERRAJES_INICIALES_DEFECTO));
        } else {
          set({ dbHerrajes: parsed });
        }
      } else {
        set({ dbHerrajes: HERRAJES_INICIALES_DEFECTO });
      }

      const nSaved = localStorage.getItem("3bf_negociacion_novopan");
      let currentNeg: NegociacionNovopan = nSaved ? JSON.parse(nSaved) : NEGOCIACION_NOVOPAN_DEFECTO;
      if (currentNeg.trmNovopan === 4000 || !currentNeg.trmNovopan) {
        currentNeg = { ...currentNeg, trmNovopan: 3000 };
        localStorage.setItem("3bf_negociacion_novopan", JSON.stringify(currentNeg));
      }
      set({ negociacionNovopan: currentNeg });

      const tSaved = localStorage.getItem("3bf_db_tableros");
      if (tSaved) {
        const parsed: TableroRecord[] = JSON.parse(tSaved);
        const hasLegacyTableros = parsed.some((t) => ["NH0030615", "NP2020625", "CB2251415"].includes(t.codigo) || (t.nombreComercial && t.nombreComercial.includes("Ceniza")) || (t.nombreComercial && t.nombreComercial.includes("Poro")) || t.proveedor === "Novopan" || (t.id === "t1" && (t.costoListaUsd || 0) < 50));
        if (hasLegacyTableros) {
          set({ dbTableros: TABLEROS_INICIALES_DEFECTO });
          localStorage.setItem("3bf_db_tableros", JSON.stringify(TABLEROS_INICIALES_DEFECTO));
        } else {
          const sanitized = parsed.map((t: TableroRecord) => {
            const lista = t.costoListaUsd ?? t.costoLaminaUsd ?? 58.468;
            if (t.proveedor === "Novopan" || t.proveedor === "Duratex") {
              const cal = calcularCostoLaminaNovopan(lista, t.largoLaminaMm || 2440, t.anchoLaminaMm || 2150, t.calibreMm || 15, undefined, currentNeg, t.nombreComercial);
              return {
                ...t,
                costoListaUsd: lista,
                costoLaminaUsd: cal.costoLaminaUsd,
                costoLaminaCop: cal.costoLaminaCop,
                costoM2Usd: cal.costoM2Usd,
                costoM2Cop: cal.costoM2Cop,
              };
            }
            const areaM2 = ((t.largoLaminaMm || 2440) * (t.anchoLaminaMm || 2150)) / 1_000_000.0;
            const laminaUsd = t.costoLaminaUsd ?? lista;
            const m2Usd = Number((laminaUsd / areaM2).toFixed(2));
            return {
              ...t,
              costoListaUsd: lista,
              costoLaminaUsd: laminaUsd,
              costoLaminaCop: Math.round(laminaUsd * 3000),
              costoM2Usd: m2Usd,
              costoM2Cop: Math.round(m2Usd * 3000),
            };
          });
          set({ dbTableros: sanitized });
        }
      } else {
        set({ dbTableros: TABLEROS_INICIALES_DEFECTO });
      }

      const cSaved = localStorage.getItem("3bf_db_cantos");
      if (cSaved) {
        const parsed: CantoRecord[] = JSON.parse(cSaved);
        const hasLegacyCantos = parsed.some(
          (c) =>
            c.descripcion.toUpperCase().includes("CENIZA") ||
            c.descripcion.toUpperCase().includes("CENDRA") ||
            c.descripcion.toUpperCase().includes("NEVADO") ||
            c.descripcion.toUpperCase().includes("GLACIAL") ||
            c.descripcion.endsWith(" N") ||
            ["0002788", "017288", "0004623", "000360", "000361", "0000253", "0000313"].includes(c.codigo) ||
            (c.id === "c_948201" && c.costoMlCop < 250)
        );
        if (hasLegacyCantos || parsed.length !== CANTOS_INICIALES_DEFECTO.length) {
          set({ dbCantos: CANTOS_INICIALES_DEFECTO });
          localStorage.setItem("3bf_db_cantos", JSON.stringify(CANTOS_INICIALES_DEFECTO));
        } else {
          set({ dbCantos: parsed });
        }
      } else {
        set({ dbCantos: CANTOS_INICIALES_DEFECTO });
      }

      const mSaved = localStorage.getItem("3bf_moneda");
      if (mSaved === "USD" || mSaved === "COP") set({ moneda: mSaved });

      const convSaved = localStorage.getItem("3bf_costos_conversion");
      if (convSaved) set({ costosConversion: JSON.parse(convSaved) });

      const fSaved = localStorage.getItem("3bf_fichas_config");
      if (fSaved) set({ fichasConfig: JSON.parse(fSaved) });

      // Hidratar AI Render Studio
      const pSaved = localStorage.getItem("3bf_biblioteca_prompts");
      if (pSaved) {
        try {
          const parsedPrompts: PromptTemplateItem[] = JSON.parse(pSaved);
          const customUserPrompts = parsedPrompts.filter(p => !p.esPresetSistema);
          set({ bibliotecaPrompts: [...customUserPrompts, ...PROMPTS_INICIALES_DEFECTO] });
        } catch {
          set({ bibliotecaPrompts: PROMPTS_INICIALES_DEFECTO });
        }
      }

      const keySaved = localStorage.getItem("3bf_gemini_api_key");
      if (keySaved) {
        set({ geminiApiKey: keySaved });
      } else {
        set({ geminiApiKey: "" });
      }

      const falKeySaved = localStorage.getItem("3bf_fal_api_key");
      if (falKeySaved) set({ falApiKey: falKeySaved });

      const hRendersSaved = localStorage.getItem("3bf_historial_renders");
      if (hRendersSaved) {
        try { set({ historialRendersIA: JSON.parse(hRendersSaved) }); } catch {}
      }

      const luzPred = localStorage.getItem(STORAGE_KEY_ILUMINACION);
      if (luzPred) {
        try {
          const parsedLuz = JSON.parse(luzPred);
          const parsedLuces = parsedLuz.lucesEstudio || {};
          set((state) => ({
            tieneIluminacionPredeterminada: true,
            calibracion: {
              ...state.calibracion,
              ...parsedLuz,
              lucesEstudio: {
                ...defaultLucesEstudio,
                ...parsedLuces,
                env_hdri: parsedLuces["env_hdri"]
                  ? { ...defaultLucesEstudio.env_hdri, ...parsedLuces["env_hdri"] }
                  : defaultLucesEstudio.env_hdri,
              },
            },
          }));
        } catch {}
      }
      // Hidratar Manual 3D Studio (Pasos, Bloques Cinemáticos y Proyecto Activo)
      const cachedManual = getCachedManualData();
      if (cachedManual && cachedManual.pasos && cachedManual.pasos.length > 0) {
        const p00Cached = cachedManual.pasos.find((p) => p.id === "P00");
        const tieneGrupos = (p00Cached?.showcase?.gruposCinematicos?.length || 0) > 0;
        const tienePiezas = cachedManual.pasos.some((p) => p.piezasAsignadas && p.piezasAsignadas.length > 0);
        if (tieneGrupos || tienePiezas) {
          set({
            pasosManual: cachedManual.pasos,
            manualActivoGuardado: cachedManual.manual,
            pasoActivoManualId: cachedManual.pasos[0]?.id || "P00",
          });
        }
      }
    } catch (e) {
      console.error("Error hidratando base de datos desde localStorage:", e);
    }
  },

});
