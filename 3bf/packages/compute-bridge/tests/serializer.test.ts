import { serializeParamToInnerTree, buildComputePayload } from '../src';

describe('@3bf/compute-bridge', () => {
  test('serializeParamToInnerTree genera entradas con y sin prefijo RH_IN:', () => {
    const nodes = serializeParamToInnerTree('RH_IN:ancho', 1500, 'System.Double');
    expect(nodes).toHaveLength(2);
    expect(nodes[0].ParamName).toBe('RH_IN:ancho');
    expect(nodes[1].ParamName).toBe('ancho');
    expect(nodes[0].InnerTree['{0}'][0].data).toBe('1500');
  });

  test('serializeParamToInnerTree maneja correctamente objetos Point3d', () => {
    const nodes = serializeParamToInnerTree('origin', { X: 10, Y: 20, Z: 30 }, 'Rhino.Geometry.Point3d');
    expect(nodes[0].InnerTree['{0}'][0].type).toBe('Rhino.Geometry.Point3d');
    const parsedData = JSON.parse(nodes[0].InnerTree['{0}'][0].data);
    expect(parsedData).toEqual({ X: 10, Y: 20, Z: 30 });
  });

  test('buildComputePayload ensambla estructura final con Base64 algo', () => {
    const payload = buildComputePayload('BASE64_GH_DATA', {
      ancho: { value: 1200, type: 'System.Double' },
      tiene_pata: { value: true, type: 'System.Boolean' }
    });

    expect(payload.algo).toBe('BASE64_GH_DATA');
    expect(payload.pointer).toBeNull();
    expect(payload.values.length).toBeGreaterThanOrEqual(4); // 2 nodos por cada parámetro
  });
});
