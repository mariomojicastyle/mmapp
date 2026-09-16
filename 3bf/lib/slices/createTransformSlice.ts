export interface TransformSlice {
  objetoSeleccionado: boolean;
  posicionObjeto: [number, number, number];
  posicionPrevia: [number, number, number];
  rotacionObjeto: [number, number, number];
  modoTransformacion: "none" | "grab" | "rotate" | "scale";
  ejeBloqueado: "none" | "x" | "y" | "z";
  snapActivo: boolean;
  snapPicking: boolean;
  snapBasePoint: [number, number, number] | null;
  snapTargetPoint: [number, number, number] | null;
  snapTargetType: "vertex" | "midpoint" | "edge" | "face" | null;

  setObjetoSeleccionado: (sel: boolean) => void;
  setPosicionObjeto: (pos: [number, number, number]) => void;
  iniciarGrab: () => void;
  confirmarGrab: () => void;
  cancelarGrab: () => void;
  setEjeBloqueado: (eje: "x" | "y" | "z") => void;
  toggleSnapMode: () => void;
  setSnapPicking: (picking: boolean) => void;
  setSnapBasePoint: (pt: [number, number, number] | null) => void;
  setSnapTargetPoint: (pt: [number, number, number] | null, tipo?: any) => void;
  setSnapTargetType: (tipo: any) => void;
}

export const createTransformSlice = (set: any, get: any): TransformSlice => ({
  objetoSeleccionado: false,
  posicionObjeto: [0, 0, 0],
  posicionPrevia: [0, 0, 0],
  rotacionObjeto: [0, 0, 0],
  modoTransformacion: "none",
  ejeBloqueado: "none",
  snapActivo: false,
  snapPicking: false,
  snapBasePoint: null,
  snapTargetPoint: null,
  snapTargetType: null,

  setObjetoSeleccionado: (objetoSeleccionado) => {
    set((s: any) => {
      if (!objetoSeleccionado) {
        return { objetoSeleccionado: false, objetoActivoId: null };
      }
      return { objetoSeleccionado: true };
    });
  },
  setPosicionObjeto: (posicionObjeto) => {
    set((s: any) => {
      const activeId = s.objetoActivoId;
      if (activeId && s.instancias[activeId]) {
        return {
          posicionObjeto,
          instancias: {
            ...s.instancias,
            [activeId]: { ...s.instancias[activeId], posicion: posicionObjeto },
          },
        };
      }
      return { posicionObjeto };
    });
  },

  iniciarGrab: () => {
    const state = get();
    if (state.pilaHistorial && state.pilaHistorial.length === 0 && state.guardarEstadoHistorial) {
      state.guardarEstadoHistorial();
    }
    const activeId = state.objetoActivoId;
    const inst = activeId ? state.instancias[activeId] : null;
    const pos = inst ? inst.posicion : state.posicionObjeto;

    set(() => ({
      modoTransformacion: "grab",
      posicionPrevia: [...pos] as [number, number, number],
      posicionObjeto: [...pos] as [number, number, number],
      ejeBloqueado: "none",
      snapActivo: false,
      snapPicking: false,
      snapBasePoint: null,
      snapTargetPoint: null,
      snapTargetType: null,
    }));
  },

  confirmarGrab: () => {
    const state = get();
    const activeId = state.objetoActivoId;
    const currentPos = state.posicionObjeto;

    if (activeId && state.instancias[activeId]) {
      set((s: any) => ({
        modoTransformacion: "none",
        instancias: {
          ...s.instancias,
          [activeId]: {
            ...s.instancias[activeId],
            posicion: [...currentPos] as [number, number, number],
            posicionPrevia: [...currentPos] as [number, number, number],
          },
        },
        posicionPrevia: [...currentPos] as [number, number, number],
        ejeBloqueado: "none",
        snapActivo: false,
        snapPicking: false,
        snapBasePoint: null,
        snapTargetPoint: null,
        snapTargetType: null,
      }));
      if (get().guardarEstadoHistorial) {
        get().guardarEstadoHistorial();
      }
    } else {
      set({ modoTransformacion: "none" });
    }
  },

  cancelarGrab: () => {
    const state = get();
    const activeId = state.objetoActivoId;
    const prevPos = state.posicionPrevia;

    if (activeId && state.instancias[activeId]) {
      set((s: any) => ({
        modoTransformacion: "none",
        posicionObjeto: [...prevPos] as [number, number, number],
        instancias: {
          ...s.instancias,
          [activeId]: {
            ...s.instancias[activeId],
            posicion: [...prevPos] as [number, number, number],
          },
        },
        ejeBloqueado: "none",
        snapActivo: false,
        snapPicking: false,
        snapBasePoint: null,
        snapTargetPoint: null,
        snapTargetType: null,
      }));
    } else {
      set({ modoTransformacion: "none" });
    }
  },

  setEjeBloqueado: (eje) =>
    set((state: any) => ({
      ejeBloqueado: state.ejeBloqueado === eje ? "none" : eje,
    })),

  toggleSnapMode: () =>
    set((state: any) => ({
      snapPicking: !state.snapPicking,
      snapActivo: true,
      snapTargetPoint: null,
      snapTargetType: null,
    })),

  setSnapPicking: (snapPicking) => set({ snapPicking }),
  setSnapBasePoint: (snapBasePoint) => set({ snapBasePoint, snapPicking: false, snapActivo: true }),
  setSnapTargetPoint: (snapTargetPoint, tipo = null) => set({ snapTargetPoint, snapTargetType: tipo || null }),
  setSnapTargetType: (snapTargetType) => set({ snapTargetType }),
});
