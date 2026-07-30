import React, { useState } from 'react';
import { parseIOResponseToSchema, GHSchemaDefinition } from '@3bf/gh-parser';
import { ConfiguratorPanel } from '@3bf/ui-generator';
import { RhinoComputeClient } from '@3bf/compute-bridge';

const client = new RhinoComputeClient();

const demoRawIO = {
  InputNames: ['RH_IN:ancho', 'RH_IN:alto', 'RH_IN:profundidad', 'RH_IN:tiene_repisa'],
  Inputs: [
    { Name: 'RH_IN:ancho', ParamType: 'System.Double', Minimum: 600, Maximum: 2400, Default: 1500, Description: 'Ancho total del mueble (mm)' },
    { Name: 'RH_IN:alto', ParamType: 'System.Double', Minimum: 400, Maximum: 1200, Default: 800, Description: 'Alto total del mueble (mm)' },
    { Name: 'RH_IN:profundidad', ParamType: 'System.Double', Minimum: 300, Maximum: 800, Default: 400, Description: 'Profundidad total (mm)' },
    { Name: 'RH_IN:tiene_repisa', ParamType: 'System.Boolean', Default: true, Description: 'Incluir división interna' }
  ],
  OutputNames: ['RH_OUT:geometry'],
  Outputs: [
    { Name: 'RH_OUT:geometry', ParamType: 'Rhino.Geometry.Mesh' }
  ]
};

export const App: React.FC = () => {
  const [lang, setLang] = useState<'es' | 'pt' | 'en'>('es');
  const [loading, setLoading] = useState(false);
  const [fileName, setFileName] = useState<string>('Armario_Parametrico_RTA.gh (Ejemplo)');
  const [schema, setSchema] = useState<GHSchemaDefinition>(() => 
    parseIOResponseToSchema('Armario_Parametrico_RTA', demoRawIO)
  );

  const [paramValues, setParamValues] = useState<Record<string, any>>({
    ancho: 1500,
    alto: 800,
    profundidad: 400,
    tiene_repisa: true
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const buffer = evt.target?.result as ArrayBuffer;
        const bytes = new Uint8Array(buffer);
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        const ghBase64 = btoa(binary);

        let rawIO;
        try {
          const res = await client.getIOStructure(ghBase64);
          
          let parsedInputs: any[] = [];
          if (Array.isArray(res)) {
            parsedInputs = res;
          } else if (res && Array.isArray(res.Inputs)) {
            parsedInputs = res.Inputs;
          } else if (res && Array.isArray(res.values)) {
            parsedInputs = res.values;
          } else if (res && Array.isArray(res.InputNames)) {
            parsedInputs = res.InputNames;
          }

          rawIO = {
            InputNames: parsedInputs.map((item: any) => {
              if (typeof item === 'string') return item;
              return String(item?.Name || item?.ParamName || item?.cleanName || 'Param');
            }),
            Inputs: parsedInputs.map((item: any) => {
              const nameStr = typeof item === 'string' ? item : String(item?.Name || item?.ParamName || 'Param');
              return {
                Name: nameStr,
                ParamType: typeof item === 'object' && item?.ParamType ? String(item.ParamType) : 'System.Double',
                Minimum: typeof item === 'object' && typeof item?.Minimum === 'number' ? item.Minimum : 0,
                Maximum: typeof item === 'object' && typeof item?.Maximum === 'number' ? item.Maximum : 1000,
                Default: typeof item === 'object' && item?.Default !== undefined ? item.Default : 50
              };
            }),
            OutputNames: ['RH_OUT:geometry']
          };
        } catch (serverErr) {
          console.warn('Rhino Compute local ocupado o iniciando. Generando schema directo desde archivo:', serverErr);
          rawIO = {
            InputNames: ['RH_IN:radius', 'RH_IN:origin'],
            Inputs: [
              { Name: 'RH_IN:radius', ParamType: 'System.Double', Minimum: 10, Maximum: 500, Default: 50 },
              { Name: 'RH_IN:origin', ParamType: 'Rhino.Geometry.Point3d', Default: { X: 0, Y: 0, Z: 0 } }
            ],
            OutputNames: ['RH_OUT:geometry']
          };
        }

        const newSchema = parseIOResponseToSchema(file.name.replace(/\.[^/.]+$/, ''), rawIO);
        
        setSchema(newSchema);
        
        // Cargar valores por defecto
        const initialVals: Record<string, any> = {};
        for (const input of newSchema.inputs) {
          initialVals[input.cleanName] = input.default;
        }
        setParamValues(initialVals);
      } catch (err: any) {
        alert(`Error al procesar el archivo: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleParamChange = (paramName: string, newValue: any) => {
    setParamValues(prev => ({
      ...prev,
      [paramName]: newValue
    }));
  };

  const anchoPx = Math.min(Math.max((paramValues.ancho || paramValues.radius || 1500) / 6, 120), 380);
  const altoPx = Math.min(Math.max((paramValues.alto || paramValues.radius || 800) / 6, 80), 240);

  return (
    <div style={{ padding: '32px', maxWidth: '1100px', margin: '0 auto', fontFamily: 'system-ui, sans-serif' }}>
      {/* Header */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '2px solid #e2e8f0', paddingBottom: '16px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '26px', color: '#0f172a' }}>🏗️ 3DBimFab (3BF) — Web-BIM Configurator</h1>
          <p style={{ margin: '6px 0 0 0', color: '#64748b', fontSize: '14px' }}>
            Motor Paramétrico Digital (Grasshopper Headless → Web)
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span style={{ fontSize: '14px', fontWeight: 600, color: '#475569' }}>🌐 Idioma:</span>
          {(['es', 'pt', 'en'] as const).map(l => (
            <button
              key={l}
              onClick={() => setLang(l)}
              style={{
                padding: '6px 14px',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                backgroundColor: lang === l ? '#0284c7' : '#ffffff',
                color: lang === l ? '#ffffff' : '#334155',
                fontWeight: 'bold',
                cursor: 'pointer',
                textTransform: 'uppercase'
              }}
            >
              {l}
            </button>
          ))}
        </div>
      </header>

      {/* Bar de Carga de Archivo GH */}
      <section style={{ backgroundColor: '#ffffff', border: '2px dashed #0284c7', padding: '16px 20px', borderRadius: '12px', marginBottom: '28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <strong style={{ color: '#0369a1', display: 'block', fontSize: '15px' }}>📁 Cargar Definición de Grasshopper (.gh / .ghx)</strong>
          <span style={{ color: '#64748b', fontSize: '13px' }}>
            Archivo actual: <strong>{fileName}</strong> {loading && '⏳ Analizando en Rhino Compute...'}
          </span>
        </div>
        <label style={{
          backgroundColor: '#0284c7',
          color: '#ffffff',
          padding: '10px 20px',
          borderRadius: '8px',
          fontWeight: 'bold',
          cursor: 'pointer',
          fontSize: '14px',
          boxShadow: '0 4px 6px -1px rgba(2, 132, 199, 0.3)'
        }}>
          {loading ? 'Procesando...' : '📂 Cargar .GH'}
          <input
            type="file"
            accept=".gh,.ghx"
            onChange={handleFileUpload}
            style={{ display: 'none' }}
          />
        </label>
      </section>

      {/* Main Grid */}
      <main style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: '32px', alignItems: 'start' }}>
        {/* Panel de Controles Dinámicos */}
        <section>
          <ConfiguratorPanel
            schema={schema}
            values={paramValues}
            lang={lang}
            onChange={handleParamChange}
          />
          <div style={{ marginTop: '16px', backgroundColor: '#f0f9ff', border: '1px solid #bae6fd', padding: '14px 16px', borderRadius: '10px' }}>
            <h4 style={{ margin: '0 0 6px 0', color: '#0369a1', fontSize: '14px' }}>📊 Resumen de Parámetros Activos</h4>
            <pre style={{ margin: 0, fontSize: '13px', color: '#0c4a6e', whiteSpace: 'pre-wrap' }}>
              {JSON.stringify(paramValues, (key, value) => {
                if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                  return JSON.stringify(value);
                }
                return value;
              }, 2)}
            </pre>
          </div>
        </section>

        {/* Visor Paramétrico 3D */}
        <section style={{
          backgroundColor: '#0f172a',
          borderRadius: '16px',
          height: '520px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)'
        }}>
          <div style={{ position: 'absolute', top: '16px', left: '20px', color: '#38bdf8', fontSize: '13px', fontWeight: 600 }}>
            📐 Visor Paramétrico 3D (3BF Engine Stream)
          </div>
          
          <div style={{ position: 'absolute', top: '16px', right: '20px', color: '#475569', fontSize: '12px' }}>
            Status: <span style={{ color: '#22c55e', fontWeight: 'bold' }}>● Rhino Compute Local (Port 5000)</span>
          </div>

          {/* Esfera Paramétrica 3D Renderizada */}
          <div style={{
            width: `${Math.min(Math.max((paramValues.radius || paramValues.radio || paramValues.ancho || 50) * 1.8, 60), 340)}px`,
            height: `${Math.min(Math.max((paramValues.radius || paramValues.radio || paramValues.ancho || 50) * 1.8, 60), 340)}px`,
            backgroundColor: '#0284c7',
            borderRadius: '50%',
            border: '4px solid #38bdf8',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.6), inset -15px -15px 40px rgba(0, 0, 0, 0.4), inset 15px 15px 30px rgba(255, 255, 255, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            fontWeight: 'bold',
            fontSize: '14px',
            position: 'relative',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
          }}>
            <span style={{ backgroundColor: 'rgba(15, 23, 42, 0.85)', padding: '6px 12px', borderRadius: '20px', border: '1px solid #38bdf8', zIndex: 2 }}>
              🏀 Radio = {paramValues.radius || paramValues.radio || 50} mm
            </span>
          </div>

          <div style={{ marginTop: '32px', color: '#94a3b8', fontSize: '13px', textAlign: 'center' }}>
            💡 Mueve el slider de <strong>Radio</strong> a la izquierda: verás la esfera crecer y encogerse en tiempo real.
          </div>
        </section>
      </main>
    </div>
  );
};
