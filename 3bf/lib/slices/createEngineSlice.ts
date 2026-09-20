export interface EngineSlice {
  centrarCamaraTrigger: number;
  centrarCamara: () => void;
  parametros: Record<string, any>;
  setParametro: (key: string, value: any) => void;
  resultado: any;
  cargando: boolean;
  error: string | null;
  setResultado: (resultado: any) => void;
  tema: string;
  setTema: (tema: string) => void;
  pestanaActiva: string;
  setPestanaActiva: (pestana: string) => void;
  cargarDefinicion: (item: { id: string; archivo?: string; nombre?: string }) => Promise<void>;
  camaraEscena?: any;
  setCamaraEscena: (camara: any) => void;
}

export const createEngineSlice = (set: any, get: any): any => ({
  camaraEscena: null,
  setCamaraEscena: (camara: any) => set({ camaraEscena: camara }),
  centrarCamaraTrigger: 0,
  centrarCamara: () => set((s: any) => ({ centrarCamaraTrigger: (s.centrarCamaraTrigger || 0) + 1 })),

  parametros: {
    model_id: "",
    ancho: 1200,
    alto: 800,
    profundidad: 400,
    espesor_madera: 15,
    material: "MDP_15mm",
    color_acabado: "#0088aa",
    incluir_puertas: true,
    tipo_herraje: "Minifix",
    cant_cajones: 3,
    apertura_cajones: 0,
    profundidad_cajon: 351,
    altura_lateral_cajon: 102,
    distancia_bajo_laterales: 30,
    tipo_cajon: "Corredera Estandar",
    recedido_izquierdo: 0,
    recedido_derecho: 0,
    union_izquierda: "Minifix",
    union_derecha: "Tornillo tarugo",
    orientacion_maquinado_minifix: "abajo",
    orientacion_minifix: "abajo",
    posicion_tarugo: "1",
    posicion_tornillo: "1",
    borde_izquierdo: "MDP",
    borde_derecho: "MDP",
    lado_balance_cubierta: "Cara B",
    tipo_mapeado_cubierta: "Cubierta",
    lado_balance_entrepanio: "Cara B",
    tipo_mapeado_entrepanio: "Cubierta",
  },

  setParametro: (key: string, value: any) =>
    set((state: any) => ({
      parametros: { ...state.parametros, [key]: value },
    })),
    
  resultado: null,
  cargando: false,
  error: null,
  setResultado: (resultado: any) => set({ resultado }),
  
  tema: "tech",
  setTema: (tema: string) => {
    const fn = get().setEsquemaColor;
    if (fn) fn(tema === "tech" ? "claro" : "oscuro");
  },
  
  pestanaActiva: "3d",
  setPestanaActiva: (pestanaActiva: string) => {
    const patch: any = { pestanaActiva };
    if (pestanaActiva !== "manual") {
      patch.modoPickingManual = {
        activo: false,
        modo: "agregar",
        grupoId: null,
        pasoId: null,
        piezasTemporalmenteSeleccionadas: [],
      };
    }
    set(patch);
  },

  cargarDefinicion: async (item: { id: string; archivo?: string; nombre?: string }) => {
    if (get().agregarInstanciaGHX) {
      await get().agregarInstanciaGHX(item);
    }
  },
});
