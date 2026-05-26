"use server"

import { createClient } from "@supabase/supabase-js"

function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

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

export async function getClientes() {
  try {
    const supabase = getSupabaseAdmin()
    // Obtener los perfiles que representan clientes (admin, designer, viewer) o cualquier perfil registrado
    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, email, company, role")
      .order("full_name", { ascending: true })

    if (error) throw error
    return { data: data || [] }
  } catch (err: unknown) {
    console.error("Error en getClientes:", err)
    return { error: err instanceof Error ? err.message : "Error al obtener clientes" }
  }
}

export async function getSolicitudesPorCliente(clientId: string) {
  try {
    const supabase = getSupabaseAdmin()
    const { data, error } = await supabase
      .from("solicitudes")
      .select("id, titulo, estado, created_at")
      .eq("client_id", clientId)
      .neq("estado", "Eliminada")
      .order("created_at", { ascending: false })

    if (error) throw error
    return { data: data || [] }
  } catch (err: unknown) {
    console.error("Error en getSolicitudesPorCliente:", err)
    return { error: err instanceof Error ? err.message : "Error al obtener solicitudes" }
  }
}

export async function getSolicitudesConCliente() {
  try {
    const supabase = getSupabaseAdmin()
    const { data, error } = await supabase
      .from("solicitudes")
      .select("id, titulo, client_id, profiles!client_id(full_name, company)")
      .neq("estado", "Eliminada")
      .order("id", { ascending: false })

    if (error) throw error
    return { data: data || [] }
  } catch (err: unknown) {
    console.error("Error en getSolicitudesConCliente:", err)
    return { error: err instanceof Error ? err.message : "Error al obtener solicitudes con cliente" }
  }
}


export async function getProyectos() {
  try {
    const supabase = getSupabaseAdmin()
    const { data, error } = await supabase
      .from("proyectos")
      .select("*, profiles!client_id(full_name, company), solicitudes!solicitud_id(titulo)")
      .order("created_at", { ascending: false })

    if (error) throw error
    return { data: data || [] }
  } catch (err: unknown) {
    console.error("Error en getProyectos:", err)
    return { error: err instanceof Error ? err.message : "Error al obtener proyectos" }
  }
}

export async function crearProyecto(data: {
  nombre: string
  tipo_proyecto: "Aplicativo de armado" | "B2B" | "B2C" | "Genérico"
  client_id: string
  solicitud_id?: number | null
  codigo_manual?: string | null
}) {
  try {
    const supabase = getSupabaseAdmin()

    // 1. Insertar el proyecto
    const { data: proyecto, error: proyectoError } = await supabase
      .from("proyectos")
      .insert({
        nombre: data.nombre,
        tipo_proyecto: data.tipo_proyecto,
        client_id: data.client_id,
        solicitud_id: data.solicitud_id || null,
        codigo_manual: data.codigo_manual || null,
        estado: "Nuevo",
        progreso: 10
      })
      .select()
      .single()

    if (proyectoError) throw proyectoError

    // 2. Si es de tipo "Aplicativo de armado", crear también la configuración del manual por defecto
    if (data.tipo_proyecto === "Aplicativo de armado" && proyecto) {
      const { error: configError } = await supabase
        .from("configuraciones_manual")
        .insert({
          proyecto_id: proyecto.id,
          color_primario: "#0D9488", // Obsidian Teal
          color_secundario: "#111827",
          glb_pasos: [],
          audio_es_pasos: [],
          audio_en_pasos: [],
          imagenes_ensambles: [],
          fotos_herrajes: [],
          renders_fotorealistas: []
        })

      if (configError) {
        console.error("Error al crear configuración de manual para el proyecto:", configError)
        // No revertimos el proyecto pero dejamos registro del error
      }
    }

    return { success: true, data: proyecto }
  } catch (err: unknown) {
    console.error("Error en crearProyecto:", err)
    return { error: err instanceof Error ? err.message : "Error al crear el proyecto" }
  }
}
