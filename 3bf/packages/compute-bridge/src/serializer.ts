import { InnerTreeNode, InnerTreeValue } from './index';

export function serializeParamToInnerTree(
  paramName: string,
  value: any,
  type: string = 'System.Double'
): InnerTreeNode[] {
  const cleanName = paramName.startsWith('RH_IN:') ? paramName.replace('RH_IN:', '') : paramName;
  const fullName = paramName.startsWith('RH_IN:') ? paramName : `RH_IN:${paramName}`;

  let formattedData: string;

  if (type.includes('Point3d') || typeof value === 'object' && value !== null && 'X' in value) {
    formattedData = JSON.stringify({
      X: Number(value.X || 0),
      Y: Number(value.Y || 0),
      Z: Number(value.Z || 0)
    });
  } else if (type.includes('Boolean') || typeof value === 'boolean') {
    formattedData = value ? 'true' : 'false';
  } else {
    formattedData = String(value);
  }

  const itemValue: InnerTreeValue = {
    type: type.includes('Point3d') ? 'Rhino.Geometry.Point3d' : (type.includes('Boolean') ? 'System.Boolean' : (type.includes('String') ? 'System.String' : 'System.Double')),
    data: formattedData
  };

  // Se envían ambas llaves (con y sin RH_IN:) para compatibilidad con definiciones variadas
  return [
    {
      ParamName: fullName,
      InnerTree: {
        '{0}': [itemValue]
      }
    },
    {
      ParamName: cleanName,
      InnerTree: {
        '{0}': [itemValue]
      }
    }
  ];
}

export function buildComputePayload(
  ghBase64: string,
  paramsMap: Record<string, { value: any; type?: string }>
) {
  const values: InnerTreeNode[] = [];

  for (const [paramName, paramInfo] of Object.entries(paramsMap)) {
    const nodes = serializeParamToInnerTree(paramName, paramInfo.value, paramInfo.type);
    values.push(...nodes);
  }

  return {
    algo: ghBase64,
    pointer: null,
    values
  };
}
