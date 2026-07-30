export type GHSupportedType = 
  | 'System.Double' 
  | 'System.String' 
  | 'System.Boolean' 
  | 'System.Int32' 
  | 'Rhino.Geometry.Point3d' 
  | 'Rhino.Geometry.Mesh' 
  | 'Rhino.Geometry.Brep';

export type UIComponentType = 'slider' | 'select' | 'toggle' | 'text' | 'color' | 'coordinate';

export interface GHParameterSchema {
  name: string;               // ej. "RH_IN:ancho"
  cleanName: string;          // ej. "ancho"
  label: Record<string, string>; // { es: "Ancho", pt: "Largura", en: "Width" }
  type: GHSupportedType;
  component: UIComponentType;
  default: unknown;
  min?: number;
  max?: number;
  step?: number;
  options?: string[];
  unit?: string;
  group?: string;
}

export interface GHSchemaDefinition {
  id: string;
  productName: string;
  version: string;
  inputs: GHParameterSchema[];
  outputs: Array<{
    name: string;
    cleanName: string;
    type: GHSupportedType;
  }>;
  hasClusters: boolean;
  createdAt: string;
}
