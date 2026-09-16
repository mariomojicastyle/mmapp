import { PromptTemplateItem, RenderIAResultado, PROMPTS_INICIALES_DEFECTO } from "../store";

export interface RenderIASlice {
  modalRenderIAAbierto: boolean;
  setModalRenderIAAbierto: (abierto: boolean) => void;
  geminiApiKey: string;
  setGeminiApiKey: (key: string) => void;
  falApiKey: string;
  setFalApiKey: (key: string) => void;
  bibliotecaPrompts: PromptTemplateItem[];
  promptActivoRender: string;
  setPromptActivoRender: (prompt: string) => void;
  motorSeleccionadoRender: string;
  setMotorSeleccionadoRender: (motor: string) => void;
  aspectRatioRender: string;
  setAspectRatioRender: (aspect: string) => void;
  guardarNuevoPrompt: (item: Omit<PromptTemplateItem, "id" | "esPresetSistema" | "creadoEn">) => string;
  actualizarPrompt: (id: string, cambios: Partial<PromptTemplateItem>) => void;
  eliminarPrompt: (id: string) => void;
  toggleFavoritoPrompt: (id: string) => void;
  restaurarPromptsDefecto: () => void;
  historialRendersIA: RenderIAResultado[];
  agregarRenderHistorial: (resultado: RenderIAResultado) => void;
  eliminarRenderHistorial: (id: string) => void;
  limpiarHistorialRenders: () => void;
}

export const createRenderIASlice = (set: any, get: any): RenderIASlice => ({
  modalRenderIAAbierto: false,
  setModalRenderIAAbierto: (modalRenderIAAbierto) => set({ modalRenderIAAbierto }),
  geminiApiKey: typeof window !== "undefined" && window.localStorage ? (localStorage.getItem("3bf_gemini_api_key") || "") : "",
  setGeminiApiKey: (geminiApiKey) => {
    if (typeof window !== "undefined" && window.localStorage) {
      localStorage.setItem("3bf_gemini_api_key", geminiApiKey);
    }
    set({ geminiApiKey });
  },
  falApiKey: typeof window !== "undefined" && window.localStorage ? localStorage.getItem("3bf_fal_api_key") || "" : "",
  setFalApiKey: (falApiKey) => {
    if (typeof window !== "undefined" && window.localStorage) {
      localStorage.setItem("3bf_fal_api_key", falApiKey);
    }
    set({ falApiKey });
  },
  bibliotecaPrompts: PROMPTS_INICIALES_DEFECTO,
  promptActivoRender: "",
  setPromptActivoRender: (promptActivoRender) => set({ promptActivoRender }),
  motorSeleccionadoRender: "fal_nano_banana_2",
  setMotorSeleccionadoRender: (motorSeleccionadoRender) => set({ motorSeleccionadoRender }),
  aspectRatioRender: "1:1",
  setAspectRatioRender: (aspectRatioRender) => set({ aspectRatioRender }),

  guardarNuevoPrompt: (item) => {
    const id = `prompt_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const nuevo: PromptTemplateItem = {
      ...item,
      id,
      esPresetSistema: false,
      creadoEn: new Date().toISOString()
    };
    set((state: any) => {
      const updated = [nuevo, ...state.bibliotecaPrompts];
      if (typeof window !== "undefined" && window.localStorage) {
        localStorage.setItem("3bf_biblioteca_prompts", JSON.stringify(updated));
      }
      return { bibliotecaPrompts: updated, promptActivoRender: nuevo.prompt };
    });
    return id;
  },

  actualizarPrompt: (id, cambios) => {
    set((state: any) => {
      const updated = state.bibliotecaPrompts.map((p: any) => (p.id === id ? { ...p, ...cambios } : p));
      if (typeof window !== "undefined" && window.localStorage) {
        localStorage.setItem("3bf_biblioteca_prompts", JSON.stringify(updated));
      }
      return { bibliotecaPrompts: updated };
    });
  },

  eliminarPrompt: (id) => {
    set((state: any) => {
      const target = state.bibliotecaPrompts.find((p: any) => p.id === id);
      if (target?.esPresetSistema) return state;
      const updated = state.bibliotecaPrompts.filter((p: any) => p.id !== id);
      if (typeof window !== "undefined" && window.localStorage) {
        localStorage.setItem("3bf_biblioteca_prompts", JSON.stringify(updated));
      }
      return { bibliotecaPrompts: updated };
    });
  },

  toggleFavoritoPrompt: (id) => {
    set((state: any) => {
      const updated = state.bibliotecaPrompts.map((p: any) => (p.id === id ? { ...p, esFavorito: !p.esFavorito } : p));
      if (typeof window !== "undefined" && window.localStorage) {
        localStorage.setItem("3bf_biblioteca_prompts", JSON.stringify(updated));
      }
      return { bibliotecaPrompts: updated };
    });
  },

  restaurarPromptsDefecto: () => {
    set((state: any) => {
      const userPrompts = state.bibliotecaPrompts.filter((p: any) => !p.esPresetSistema);
      const restored = [...userPrompts, ...PROMPTS_INICIALES_DEFECTO];
      if (typeof window !== "undefined" && window.localStorage) {
        localStorage.setItem("3bf_biblioteca_prompts", JSON.stringify(restored));
      }
      return { bibliotecaPrompts: restored };
    });
  },

  historialRendersIA: [],
  agregarRenderHistorial: (resultado) => {
    set((state: any) => {
      const updated = [resultado, ...state.historialRendersIA.slice(0, 24)];
      if (typeof window !== "undefined" && window.localStorage) {
        try { localStorage.setItem("3bf_historial_renders", JSON.stringify(updated)); } catch {}
      }
      return { historialRendersIA: updated };
    });
  },

  eliminarRenderHistorial: (id) => {
    set((state: any) => {
      const updated = state.historialRendersIA.filter((r: any) => r.id !== id);
      if (typeof window !== "undefined" && window.localStorage) {
        try { localStorage.setItem("3bf_historial_renders", JSON.stringify(updated)); } catch {}
      }
      return { historialRendersIA: updated };
    });
  },

  limpiarHistorialRenders: () => {
    if (typeof window !== "undefined" && window.localStorage) {
      localStorage.removeItem("3bf_historial_renders");
    }
    set({ historialRendersIA: [] });
  },
});
