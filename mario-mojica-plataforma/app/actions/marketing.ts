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
      persistSession: false,
    },
  })
}

export interface MarketingCuentaData {
  id?: string
  plataforma: "facebook" | "instagram" | "linkedin" | "youtube" | "google_drive"
  cuenta_id_externo: string
  nombre_cuenta: string
  avatar_url?: string | null
  access_token: string
  refresh_token?: string | null
  expires_at?: string | null
  metadatos?: Record<string, unknown>
}

export interface MarketingPostData {
  id?: string
  titulo?: string | null
  contenido_base: string
  overrides_redes?: Record<string, any>
  drive_file_ids?: string[]
  plataformas_destino: string[]
  estado?: "borrador" | "programado" | "en_cola" | "publicando" | "publicado" | "fallido"
  error_mensaje?: string | null
  fecha_programada?: string | null
  publicado_at?: string | null
  created_by?: string | null
}

// ----------------------------------------------------
// ACTIONS PARA CUENTAS DE REDES SOCIALES / GOOGLE DRIVE
// ----------------------------------------------------

export async function getMarketingCuentas() {
  try {
    const supabase = getSupabaseAdmin()
    const { data, error } = await supabase
      .from("marketing_cuentas")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) throw error

    // Filtrar duplicados por plataforma en la vista si existieran
    const uniqueMap = new Map<string, typeof data[0]>()
    if (data) {
      for (const item of data) {
        if (!uniqueMap.has(item.plataforma)) {
          uniqueMap.set(item.plataforma, item)
        }
      }
    }

    return { data: Array.from(uniqueMap.values()) }
  } catch (err: unknown) {
    console.error("Error en getMarketingCuentas:", err)
    return { error: err instanceof Error ? err.message : "Error al obtener las cuentas de marketing" }
  }
}

export async function saveMarketingCuenta(cuenta: MarketingCuentaData) {
  try {
    const supabase = getSupabaseAdmin()

    // Eliminar previas cuentas de la misma plataforma para mantener limpio 1 registro por proveedor
    await supabase
      .from("marketing_cuentas")
      .delete()
      .eq("plataforma", cuenta.plataforma)

    const { data, error } = await supabase
      .from("marketing_cuentas")
      .insert({
        plataforma: cuenta.plataforma,
        cuenta_id_externo: cuenta.cuenta_id_externo,
        nombre_cuenta: cuenta.nombre_cuenta,
        avatar_url: cuenta.avatar_url || null,
        access_token: cuenta.access_token,
        refresh_token: cuenta.refresh_token || null,
        expires_at: cuenta.expires_at || null,
        metadatos: cuenta.metadatos || {},
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) throw error
    return { success: true, data }
  } catch (err: unknown) {
    console.error("Error en saveMarketingCuenta:", err)
    return { error: err instanceof Error ? err.message : "Error al guardar la cuenta de marketing" }
  }
}

export async function deleteMarketingCuenta(id: string) {
  try {
    const supabase = getSupabaseAdmin()
    const { error } = await supabase
      .from("marketing_cuentas")
      .delete()
      .eq("id", id)

    if (error) throw error
    return { success: true }
  } catch (err: unknown) {
    console.error("Error en deleteMarketingCuenta:", err)
    return { error: err instanceof Error ? err.message : "Error al eliminar la cuenta" }
  }
}

export async function getDriveFiles() {
  try {
    const supabase = getSupabaseAdmin()
    const { data: cuentas } = await supabase
      .from("marketing_cuentas")
      .select("*")
      .or("plataforma.eq.google_drive,plataforma.eq.youtube")
      .order("created_at", { ascending: false })

    if (cuentas && cuentas.length > 0) {
      const cuenta = cuentas[0]
      if (cuenta.access_token) {
        const res = await fetch(
          "https://www.googleapis.com/drive/v3/files?pageSize=30&fields=files(id,name,mimeType,thumbnailLink,webContentLink)&q=trashed=false",
          {
            headers: {
              Authorization: `Bearer ${cuenta.access_token}`,
            },
          }
        )
        if (res.ok) {
          const json = await res.json()
          if (json.files && json.files.length > 0) {
            return {
              data: json.files.map((f: { id: string; name: string; mimeType: string; thumbnailLink?: string; webContentLink?: string }) => ({
                id: f.id,
                name: f.name,
                mimeType: f.mimeType,
                thumbnailUrl: f.thumbnailLink,
                webContentLink: f.webContentLink,
              })),
            }
          }
        }
      }
    }

    return { data: null }
  } catch (err: unknown) {
    console.error("Error en getDriveFiles:", err)
    return { error: err instanceof Error ? err.message : "Error al obtener archivos de Drive" }
  }
}

// ----------------------------------------------------
// ACTIONS PARA PUBLICACIONES (POSTS)
// ----------------------------------------------------

export async function getMarketingPosts(estado?: string) {
  try {
    const supabase = getSupabaseAdmin()
    let query = supabase.from("marketing_posts").select("*").order("created_at", { ascending: false })

    if (estado) {
      query = query.eq("estado", estado)
    }

    const { data, error } = await query

    if (error) throw error
    return { data: data || [] }
  } catch (err: unknown) {
    console.error("Error en getMarketingPosts:", err)
    return { error: err instanceof Error ? err.message : "Error al obtener las publicaciones" }
  }
}

export async function createMarketingPost(post: MarketingPostData) {
  try {
    const supabase = getSupabaseAdmin()
    const { data, error } = await supabase
      .from("marketing_posts")
      .insert({
        titulo: post.titulo || null,
        contenido_base: post.contenido_base,
        overrides_redes: post.overrides_redes || {},
        drive_file_ids: post.drive_file_ids || [],
        plataformas_destino: post.plataformas_destino,
        estado: post.estado || "borrador",
        fecha_programada: post.fecha_programada || null,
        created_by: post.created_by || null,
      })
      .select()
      .single()

    if (error) throw error
    return { success: true, data }
  } catch (err: unknown) {
    console.error("Error en createMarketingPost:", err)
    return { error: err instanceof Error ? err.message : "Error al crear la publicación" }
  }
}

export async function updateMarketingPost(id: string, post: Partial<MarketingPostData>) {
  try {
    const supabase = getSupabaseAdmin()
    const { data, error } = await supabase
      .from("marketing_posts")
      .update({
        ...post,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single()

    if (error) throw error
    return { success: true, data }
  } catch (err: unknown) {
    console.error("Error en updateMarketingPost:", err)
    return { error: err instanceof Error ? err.message : "Error al actualizar la publicación" }
  }
}

export async function deleteMarketingPost(id: string) {
  try {
    const supabase = getSupabaseAdmin()
    const { error } = await supabase
      .from("marketing_posts")
      .delete()
      .eq("id", id)

    if (error) throw error
    return { success: true }
  } catch (err: unknown) {
    console.error("Error en deleteMarketingPost:", err)
    return { error: err instanceof Error ? err.message : "Error al eliminar la publicación" }
  }
}

// ----------------------------------------------------
// ACTIONS PARA COLAS DE PUBLICACIÓN
// ----------------------------------------------------

export async function getMarketingColas() {
  try {
    const supabase = getSupabaseAdmin()
    const { data, error } = await supabase
      .from("marketing_colas")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) throw error
    return { data: data || [] }
  } catch (err: unknown) {
    console.error("Error en getMarketingColas:", err)
    return { error: err instanceof Error ? err.message : "Error al obtener las colas de publicación" }
  }
}
