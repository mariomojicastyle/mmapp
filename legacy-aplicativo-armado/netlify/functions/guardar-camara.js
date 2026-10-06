import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://dezaisaunoumhqpssols.supabase.co';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRlemFpc2F1bm91bWhxcHNzb2xzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTgzOTIxMSwiZXhwIjoyMDkxNDE1MjExfQ.mnDJzVs0yPDIzyAahTX-sgZDJBeXQmgQ5HP6y2iSaPg';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: corsHeaders,
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Método no permitido' })
    };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const { codigoManual, step, cameraPosition, cameraTarget, cameraMode, useGlbCamera } = body;

    if (!codigoManual || step === undefined || !cameraPosition || !cameraTarget) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Parámetros incompletos (requerido: codigoManual, step, cameraPosition, cameraTarget)' })
      };
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // 1. Buscar proyecto
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(codigoManual);
    let query = supabase.from('proyectos').select('id, codigo_manual');
    if (isUuid) {
      query = query.or(`codigo_manual.eq.${codigoManual},id.eq.${codigoManual}`);
    } else {
      query = query.eq('codigo_manual', codigoManual);
    }

    const { data: proyecto, error: projError } = await query.maybeSingle();

    if (projError || !proyecto) {
      return {
        statusCode: 404,
        headers: corsHeaders,
        body: JSON.stringify({ error: `No se encontró el proyecto con código: ${codigoManual}` })
      };
    }

    // 2. Obtener la configuración actual del manual
    const { data: config, error: configError } = await supabase
      .from('configuraciones_manual')
      .select('id, glb_pasos')
      .eq('proyecto_id', proyecto.id)
      .single();

    if (configError || !config) {
      return {
        statusCode: 404,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'No se encontró configuración_manual asociada al proyecto' })
      };
    }

    const currentPasos = Array.isArray(config.glb_pasos) ? config.glb_pasos : [];
    const stepStr = String(step);
    let updated = false;

    const newGlbPasos = currentPasos.map((s) => {
      if (String(s.step) === stepStr) {
        updated = true;
        return {
          ...s,
          cameraPosition: cameraPosition,
          cameraTarget: cameraTarget,
          cameraMode: cameraMode || 'manual',
          useGlbCamera: useGlbCamera === true
        };
      }
      return s;
    });

    if (!updated) {
      newGlbPasos.push({
        step: stepStr,
        fileName: `P${stepStr}.glb`,
        progress: 100,
        cameraPosition: cameraPosition,
        cameraTarget: cameraTarget,
        cameraMode: cameraMode || 'manual',
        useGlbCamera: useGlbCamera === true
      });
    }

    // 3. Persistir con privilegios de Service Role
    const { error: updateError } = await supabase
      .from('configuraciones_manual')
      .update({
        glb_pasos: newGlbPasos,
        updated_at: new Date().toISOString()
      })
      .eq('id', config.id);

    if (updateError) {
      throw updateError;
    }

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        success: true,
        message: `Posición de cámara guardada exitosamente para el paso ${stepStr}`,
        glb_pasos: newGlbPasos
      })
    };
  } catch (err) {
    console.error('Error en guardar-camara function:', err);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: err.message || 'Error interno' })
    };
  }
};
