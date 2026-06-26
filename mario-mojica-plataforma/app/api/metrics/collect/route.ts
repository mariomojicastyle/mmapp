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

// Rate Limiter en Memoria muy simple
interface RateLimitInfo {
  count: number
  resetTime: number
}
const rateLimitMap = new Map<string, RateLimitInfo>()
const LIMIT_WINDOW_MS = 60000 // 1 minuto
const MAX_REQUESTS_PER_WINDOW = 40 // máximo 40 eventos por minuto por sesión/IP

function isRateLimited(key: string): boolean {
  const now = Date.now()
  const info = rateLimitMap.get(key)

  if (!info) {
    rateLimitMap.set(key, { count: 1, resetTime: now + LIMIT_WINDOW_MS })
    return false
  }

  if (now > info.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + LIMIT_WINDOW_MS })
    return false
  }

  info.count++
  if (info.count > MAX_REQUESTS_PER_WINDOW) {
    return true
  }

  return false
}

// Limpieza de memoria del rate limiter cada 5 minutos
if (typeof global !== 'undefined') {
  const globalAny = global as typeof globalThis & { rateLimitCleanupInterval?: ReturnType<typeof setInterval> }
  if (!globalAny.rateLimitCleanupInterval) {
    globalAny.rateLimitCleanupInterval = setInterval(() => {
      const now = Date.now()
      for (const [key, info] of rateLimitMap.entries()) {
        if (now > info.resetTime) {
          rateLimitMap.delete(key)
        }
      }
    }, 300000) // 5 minutos
  }
}

// Cabeceras de CORS por defecto
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, x-n8n-token",
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders })
}

export async function POST(req: Request) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "unknown-ip"
    const body = await req.json()

    const { session_id, proyecto_id, tipo_evento, metadata } = body

    if (!session_id || !proyecto_id || !tipo_evento) {
      return NextResponse.json(
        { error: "Faltan campos requeridos (session_id, proyecto_id, tipo_evento)" },
        { status: 400, headers: corsHeaders }
      )
    }

    // Aplicar Rate Limiter por session_id + IP
    const rateLimitKey = `${session_id}_${ip}`
    if (isRateLimited(rateLimitKey)) {
      return NextResponse.json(
        { error: "Too many requests. Rate limit exceeded." },
        { status: 429, headers: corsHeaders }
      )
    }

    const supabase = getSupabaseAdmin()

    // Mapear campos para guardar correctamente en la tabla
    const row = {
      session_id,
      proyecto_id,
      tipo_evento: tipo_evento === 'feedback' ? 'feedback_submitted' : tipo_evento,
      metadata: metadata || {},
      created_at: new Date().toISOString()
    }

    const { data, error } = await supabase
      .from("telemetria_manuales")
      .insert(row)
      .select()
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json({ success: true, data }, { status: 200, headers: corsHeaders })
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Internal server error"
    console.error("Error en API collect metrics:", errorMessage)
    return NextResponse.json(
      { error: errorMessage },
      { status: 500, headers: corsHeaders }
    )
  }
}
