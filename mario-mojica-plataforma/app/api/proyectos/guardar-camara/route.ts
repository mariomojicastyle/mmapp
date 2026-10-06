import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Faltan variables de entorno NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY");
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

// Permitir solicitudes CORS desde el visor 3D embebido o standalone
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { codigoManual, step, cameraPosition, cameraTarget } = body;

    if (!codigoManual || step === undefined || !cameraPosition || !cameraTarget) {
      return NextResponse.json(
        { error: "Parámetros incompletos (requerido: codigoManual, step, cameraPosition, cameraTarget)" },
        { 
          status: 400,
          headers: { "Access-Control-Allow-Origin": "*" }
        }
      );
    }

    const supabase = getSupabaseAdmin();

    // 1. Buscar el proyecto por código de manual o id (validando si es UUID para no romper postgres)
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(codigoManual);
    let query = supabase.from("proyectos").select("id, codigo_manual");
    if (isUuid) {
      query = query.or(`codigo_manual.eq.${codigoManual},id.eq.${codigoManual}`);
    } else {
      query = query.eq("codigo_manual", codigoManual);
    }
    const { data: proyecto, error: projError } = await query.maybeSingle();

    if (projError || !proyecto) {
      return NextResponse.json(
        { error: `No se encontró el proyecto con código: ${codigoManual}` },
        { 
          status: 404,
          headers: { "Access-Control-Allow-Origin": "*" }
        }
      );
    }

    // 2. Obtener la configuración actual del manual
    const { data: config, error: configError } = await supabase
      .from("configuraciones_manual")
      .select("id, glb_pasos")
      .eq("proyecto_id", proyecto.id)
      .single();

    if (configError || !config) {
      return NextResponse.json(
        { error: "No se encontró configuración_manual asociada al proyecto" },
        { 
          status: 404,
          headers: { "Access-Control-Allow-Origin": "*" }
        }
      );
    }

    const currentPasos: any[] = Array.isArray(config.glb_pasos) ? config.glb_pasos : [];

    // 3. Actualizar o agregar el paso con modo manual explícito
    const stepStr = String(step);
    let updated = false;

    const newGlbPasos = currentPasos.map((s: any) => {
      if (String(s.step) === stepStr) {
        updated = true;
        return {
          ...s,
          cameraPosition: cameraPosition,
          cameraTarget: cameraTarget,
          cameraMode: "manual",
          useGlbCamera: false
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
        cameraMode: "manual",
        useGlbCamera: false
      });
    }

    // 4. Persistir con privilegios de administrador (Service Role)
    const { error: updateError } = await supabase
      .from("configuraciones_manual")
      .update({
        glb_pasos: newGlbPasos,
        updated_at: new Date().toISOString()
      })
      .eq("id", config.id);

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json(
      { 
        success: true, 
        message: `Posición de cámara guardada exitosamente para el paso ${stepStr}`,
        glb_pasos: newGlbPasos
      },
      { 
        status: 200,
        headers: { "Access-Control-Allow-Origin": "*" }
      }
    );
  } catch (err: any) {
    console.error("Error en /api/proyectos/guardar-camara:", err);
    return NextResponse.json(
      { error: err?.message || "Error interno del servidor" },
      { 
        status: 500,
        headers: { "Access-Control-Allow-Origin": "*" }
      }
    );
  }
}
