import { parseIOResponseToSchema, parseRawParamNameToClean, mapGHTypeToUIComponent } from '../src';

describe('@3bf/gh-parser', () => {
  test('parseRawParamNameToClean elimina prefijos RH_IN: y RH_OUT:', () => {
    expect(parseRawParamNameToClean('RH_IN:radius')).toBe('radius');
    expect(parseRawParamNameToClean('RH_OUT:geometry')).toBe('geometry');
    expect(parseRawParamNameToClean('sin_prefijo')).toBe('sin_prefijo');
  });

  test('mapGHTypeToUIComponent asigna componentes web correctos', () => {
    expect(mapGHTypeToUIComponent('System.Double')).toBe('slider');
    expect(mapGHTypeToUIComponent('System.Boolean')).toBe('toggle');
    expect(mapGHTypeToUIComponent('System.String')).toBe('select');
    expect(mapGHTypeToUIComponent('Rhino.Geometry.Point3d')).toBe('coordinate');
  });

  test('parseIOResponseToSchema genera un esquema con labels i18n y metadatos', () => {
    const rawIO = {
      InputNames: ['RH_IN:radius', 'RH_IN:ancho', 'RH_IN:tiene_repisa'],
      Inputs: [
        { Name: 'RH_IN:radius', ParamType: 'System.Double', Minimum: 10, Maximum: 500, Default: 50 },
        { Name: 'RH_IN:ancho', ParamType: 'System.Double', Minimum: 600, Maximum: 2400, Default: 1500 },
        { Name: 'RH_IN:tiene_repisa', ParamType: 'System.Boolean', Default: true }
      ],
      OutputNames: ['RH_OUT:geometry'],
      Outputs: [
        { Name: 'RH_OUT:geometry', ParamType: 'Rhino.Geometry.Mesh' }
      ]
    };

    const schema = parseIOResponseToSchema('Mueble_Test', rawIO);

    expect(schema.productName).toBe('Mueble_Test');
    expect(schema.inputs).toHaveLength(3);
    expect(schema.outputs).toHaveLength(1);

    // Verificar i18n en radio
    const radiusParam = schema.inputs.find(p => p.cleanName === 'radius');
    expect(radiusParam).toBeDefined();
    expect(radiusParam?.label.es).toBe('Radio');
    expect(radiusParam?.label.pt).toBe('Raio');
    expect(radiusParam?.label.en).toBe('Radius');
    expect(radiusParam?.min).toBe(10);
    expect(radiusParam?.max).toBe(500);

    // Verificar booleano
    const repisaParam = schema.inputs.find(p => p.cleanName === 'tiene_repisa');
    expect(repisaParam?.component).toBe('toggle');
  });
});
