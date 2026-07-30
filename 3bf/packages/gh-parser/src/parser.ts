import { 
  GHParameterSchema, 
  GHSchemaDefinition, 
  GHSupportedType, 
  UIComponentType 
} from './types';

export interface RawIOParam {
  Name: string;
  ParamType: string;
  Description?: string;
  AtLeast?: number;
  AtMost?: number;
  Minimum?: number;
  Maximum?: number;
  Default?: any;
  Values?: string[];
}

export interface RawIOResponse {
  InputNames?: string[];
  OutputNames?: string[];
  Inputs?: RawIOParam[];
  Outputs?: RawIOParam[];
  Description?: string;
  CacheKey?: string;
}

export function parseRawParamNameToClean(rawName: any): string {
  let cleaned = typeof rawName === 'string' ? rawName : (rawName?.Name || rawName?.ParamName || String(rawName || ''));
  if (cleaned.startsWith('RH_IN:')) cleaned = cleaned.replace('RH_IN:', '');
  if (cleaned.startsWith('RH_OUT:')) cleaned = cleaned.replace('RH_OUT:', '');
  return cleaned;
}

export function mapGHTypeToUIComponent(typeStr: string): UIComponentType {
  const normalized = String(typeStr || '').toLowerCase();
  if (normalized.includes('point3d') || normalized.includes('point')) {
    return 'coordinate';
  }
  if (normalized.includes('double') || normalized.includes('int') || normalized.includes('number')) {
    return 'slider';
  }
  if (normalized.includes('boolean') || normalized.includes('bool')) {
    return 'toggle';
  }
  if (normalized.includes('string') || normalized.includes('text')) {
    return 'select';
  }
  if (normalized.includes('color') || normalized.includes('colour')) {
    return 'color';
  }
  return 'text';
}

export function buildMultiLangLabels(cleanName: string, customLabel?: any): Record<string, string> {
  const labelStr = typeof customLabel === 'string' ? customLabel : undefined;
  const base = labelStr || cleanName.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  
  // Mapeos predefinidos comunes para RTA Brasil / B2B Latam
  const dictionary: Record<string, { es: string; pt: string; en: string }> = {
    ancho: { es: 'Ancho', pt: 'Largura', en: 'Width' },
    alto: { es: 'Alto', pt: 'Altura', en: 'Height' },
    profundidad: { es: 'Profundidad', pt: 'Profundidade', en: 'Depth' },
    radio: { es: 'Radio', pt: 'Raio', en: 'Radius' },
    radius: { es: 'Radio', pt: 'Raio', en: 'Radius' },
    color: { es: 'Color', pt: 'Cor', en: 'Color' },
    material: { es: 'Material', pt: 'Material', en: 'Material' },
    pata: { es: 'Tipo de Pata', pt: 'Tipo de Pé', en: 'Leg Type' },
    repisa: { es: 'Incluir Repisa', pt: 'Incluir Prateleira', en: 'Include Shelf' }
  };

  const lowerKey = cleanName.toLowerCase();
  if (dictionary[lowerKey]) {
    return dictionary[lowerKey];
  }

  return {
    es: base,
    pt: base,
    en: base
  };
}

export function parseIOResponseToSchema(
  productName: string,
  rawIO: RawIOResponse,
  version: string = '1.0'
): GHSchemaDefinition {
  const inputs: GHParameterSchema[] = [];
  const outputs: Array<{ name: string; cleanName: string; type: GHSupportedType }> = [];
  let hasClusters = false;

  // Procesar Entradas (Inputs)
  const rawInputs: RawIOParam[] = rawIO.Inputs || (rawIO.InputNames || []).map(name => ({ Name: name, ParamType: 'System.Double' }));

  for (const raw of rawInputs) {
    const rawNameStr = typeof raw.Name === 'string' ? raw.Name : (typeof raw.Name === 'object' && (raw.Name as any)?.ParamName ? (raw.Name as any).ParamName : 'Param');
    const clean = parseRawParamNameToClean(rawNameStr);
    const component = mapGHTypeToUIComponent(raw.ParamType || '');
    
    let defaultVal = raw.Default;
    if (typeof defaultVal === 'object' && defaultVal !== null) {
      defaultVal = component === 'slider' ? 50 : true;
    }
    
    // Inferencia de metadatos según el tipo
    const paramSchema: GHParameterSchema = {
      name: rawNameStr,
      cleanName: clean,
      label: buildMultiLangLabels(clean, raw.Description),
      type: (raw.ParamType as GHSupportedType) || 'System.Double',
      component,
      default: defaultVal !== undefined ? defaultVal : (component === 'slider' ? 50 : true),
      min: typeof raw.Minimum === 'number' ? raw.Minimum : 0,
      max: typeof raw.Maximum === 'number' ? raw.Maximum : 3000,
      step: component === 'slider' ? 10 : undefined,
      options: raw.Values || undefined,
      unit: clean.includes('mm') || ['ancho', 'alto', 'profundidad', 'radio', 'radius'].some(k => clean.toLowerCase().includes(k)) ? 'mm' : undefined,
      group: clean.toLowerCase().includes('pata') || clean.toLowerCase().includes('herraje') ? 'Herrajes' : 'Geometría'
    };

    inputs.push(paramSchema);
  }

  // Procesar Salidas (Outputs)
  const rawOutputs = rawIO.Outputs || (rawIO.OutputNames || []).map(name => ({ Name: name, ParamType: 'Rhino.Geometry.Mesh' }));

  for (const raw of rawOutputs) {
    const clean = parseRawParamNameToClean(raw.Name);
    outputs.push({
      name: raw.Name,
      cleanName: clean,
      type: (raw.ParamType as GHSupportedType) || 'Rhino.Geometry.Mesh'
    });
  }

  return {
    id: `schema_${productName.toLowerCase()}_${Date.now()}`,
    productName,
    version,
    inputs,
    outputs,
    hasClusters,
    createdAt: new Date().toISOString()
  };
}
