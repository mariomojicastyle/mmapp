import { ParametrosMueble } from "./store";

export function generateJsonSchemaFromParams(params: ParametrosMueble) {
  return {
    $schema: "http://json-schema.org/draft-07/schema#",
    title: "Esquema Paramétrico 3BF DfMA",
    type: "object",
    properties: {
      ancho: { type: "number", minimum: 600, maximum: 2400, default: params.ancho },
      alto: { type: "number", minimum: 400, maximum: 2200, default: params.alto },
      profundidad: { type: "number", minimum: 300, maximum: 800, default: params.profundidad },
      espesor_madera: { type: "number", enum: [15, 18, 25], default: params.espesor_madera },
      material: { type: "string", enum: ["MDP_15mm", "MDF_18mm", "Madera_Guadua"], default: params.material },
      color_acabado: { type: "string", default: params.color_acabado },
      incluir_puertas: { type: "boolean", default: params.incluir_puertas },
      tipo_herraje: { type: "string", enum: ["Minifix", "Perno"], default: params.tipo_herraje },
    },
  };
}
