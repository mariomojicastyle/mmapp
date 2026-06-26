import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Configuración de Supabase Admin
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

function getSupabaseAdmin() {
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Falta configuración de Supabase URL o Service Role Key")
  }
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders })
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const proyectoId = searchParams.get("proyectoId")
    const filePath = searchParams.get("filePath")

    if (!proyectoId || !filePath) {
      return NextResponse.json(
        { error: "Faltan parámetros requeridos (proyectoId, filePath)" },
        { status: 400, headers: corsHeaders }
      )
    }

    const referer = req.headers.get("referer") || req.headers.get("origin") || ""
    console.log(`[AssetSign] Referer: ${referer}, FilePath: ${filePath}, ProyectoId: ${proyectoId}`)

    // 1. Obtener la configuración del manual en Supabase
    const supabase = getSupabaseAdmin()
    const { data: config, error: configError } = await supabase
      .from("configuraciones_manual")
      .select("dominio_autorizado")
      .eq("proyecto_id", proyectoId)
      .maybeSingle()

    if (configError) {
      throw configError
    }

    const dominioAutorizado = config?.dominio_autorizado || ""

    // 2. Validación de Seguridad por Referer/Dominio
    let isAuthorized = false

    // Si es desarrollo local (localhost o 127.0.0.1) o no tiene referer (ej: pruebas curl locales), se autoriza
    const isLocal = referer.includes("localhost") || referer.includes("127.0.0.1") || referer === ""
    
    if (isLocal) {
      isAuthorized = true
    } else if (dominioAutorizado) {
      // Extraer el host del referer para evitar subdominios maliciosos
      try {
        const refererUrl = new URL(referer)
        const refererHost = refererUrl.hostname
        
        // Coincidencia estricta o subdominio del dominio autorizado
        if (refererHost === dominioAutorizado || refererHost.endsWith(`.${dominioAutorizado}`)) {
          isAuthorized = true
        }
      } catch (e) {
        console.error("[AssetSign] Error al parsear referer:", e)
      }
    }

    if (!isAuthorized) {
      console.warn(`[AssetSign] Acceso denegado. Referer '${referer}' no coincide con el dominio autorizado '${dominioAutorizado}'`)
      return NextResponse.json(
        { error: "Access Denied: Unauthorized origin." },
        { status: 403, headers: corsHeaders }
      )
    }

    // 3. Generar URL firmada de Supabase Storage
    const { data, error: signError } = await supabase.storage
      .from("insumos_manuales")
      .createSignedUrl(filePath, 300) // Expiración en 5 minutos (300s)

    if (signError || !data?.signedUrl) {
      throw signError || new Error("No se pudo generar la URL firmada")
    }

    return NextResponse.json({ signedUrl: data.signedUrl }, { status: 200, headers: corsHeaders })
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Internal server error"
    console.error("Error en API Asset Sign:", errorMessage)
    return NextResponse.json(
      { error: errorMessage },
      { status: 500, headers: corsHeaders }
    )
  }
}
