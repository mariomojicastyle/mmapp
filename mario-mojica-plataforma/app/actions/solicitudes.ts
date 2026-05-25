"use server"

import { createClient } from "@supabase/supabase-js"

export async function getCompanySolicitudes(companyName: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    return { error: "Falta configuración de Supabase Service Role" }
  }

  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })

  try {
    // 1. Obtener todos los IDs de usuarios que pertenecen a esa empresa
    const { data: usersData, error: usersError } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('company', companyName)
      
    if (usersError) throw usersError
    
    if (!usersData || usersData.length === 0) {
      return { data: [] }
    }

    const userIds = usersData.map(u => u.id)

    // 2. Obtener las solicitudes de esos IDs saltándose RLS
    const { data: solicitudesData, error: solicitudesError } = await supabaseAdmin
      .from('solicitudes')
      .select('*, profiles!client_id(full_name, company)')
      .in('client_id', userIds)
      .order('created_at', { ascending: false })

    if (solicitudesError) throw solicitudesError

    return { data: solicitudesData }
  } catch (err: unknown) {
    console.error("Error en getCompanySolicitudes:", err)
    return { error: err instanceof Error ? err.message : "Error al obtener solicitudes" }
  }
}

export async function notifySolicitudModification(
  solicitudId: string | number,
  modifications: string[],
  editorId: string,
  assignedToId?: string
) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) return { error: "Falta configuración de Supabase Service Role" }

  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  })

  try {
    const { data: superadmins } = await supabaseAdmin.from("profiles").select("id").eq("role", "superadmin")
    const notifyIds = new Set<string>()
    superadmins?.forEach(s => notifyIds.add(s.id))
    if (assignedToId) notifyIds.add(assignedToId)
    
    notifyIds.delete(editorId)

    if (notifyIds.size > 0) {
       const mensaje = modifications.length > 0
         ? `Se han modificado: ${modifications.join(", ")} en la solicitud #${String(solicitudId).padStart(5, "0")}.`
         : `Se ha modificado la solicitud #${String(solicitudId).padStart(5, "0")}.`

       const notificaciones = Array.from(notifyIds).map(userId => ({
          user_id: userId,
          tipo: "modificacion_solicitud",
          solicitud_id: typeof solicitudId === "string" ? parseInt(solicitudId, 10) : solicitudId,
          mensaje
       }))
       
       const { error } = await supabaseAdmin.from("notificaciones").insert(notificaciones)
       if (error) throw error
    }
    return { success: true }
  } catch (err: unknown) {
    console.error("Error en notifySolicitudModification:", err)
    return { error: err instanceof Error ? err.message : "Error desconocido" }
  }
}

export async function softDeleteSolicitud(
  solicitudId: string | number,
  deleterId: string,
  assignedToId?: string
) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) return { error: "Falta configuración de Supabase Service Role" }

  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  })

  try {
    const id = typeof solicitudId === "string" ? parseInt(solicitudId, 10) : solicitudId
    
    // 1. Actualizar estado a "Eliminada"
    const { error: updateError } = await supabaseAdmin.from("solicitudes").update({
      estado: "Eliminada"
    }).eq("id", id)
    
    if (updateError) throw updateError

    // 2. Notificar a los superadmins y colaborador
    const { data: superadmins } = await supabaseAdmin.from("profiles").select("id").eq("role", "superadmin")
    const notifyIds = new Set<string>()
    superadmins?.forEach(s => notifyIds.add(s.id))
    if (assignedToId) notifyIds.add(assignedToId)
    
    notifyIds.delete(deleterId)

    if (notifyIds.size > 0) {
       const notificaciones = Array.from(notifyIds).map(userId => ({
          user_id: userId,
          tipo: "eliminacion_solicitud",
          solicitud_id: id,
          mensaje: `El cliente ha eliminado la solicitud #${String(id).padStart(5, "0")}. Puedes restaurarla o eliminarla definitivamente.`
       }))
       
       const { error } = await supabaseAdmin.from("notificaciones").insert(notificaciones)
       if (error) console.error("Error al insertar notificaciones de eliminación:", error)
    }
    return { success: true }
  } catch (err: unknown) {
    console.error("Error en softDeleteSolicitud:", err)
    return { error: err instanceof Error ? err.message : "Error desconocido" }
  }
}

export async function notifyDateProposal(
  solicitudId: string | number,
  clientId: string
) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) return { error: "Falta configuración de Supabase Service Role" }

  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  })

  try {
    const id = typeof solicitudId === "string" ? parseInt(solicitudId, 10) : solicitudId

    const { error } = await supabaseAdmin.from("notificaciones").insert({
      user_id: clientId,
      tipo: "sistema",
      solicitud_id: id,
      mensaje: `El equipo ha propuesto una nueva fecha para la solicitud #${String(id).padStart(5, "0")}`
    })

    if (error) throw error
    return { success: true }
  } catch (err: unknown) {
    console.error("Error en notifyDateProposal:", err)
    return { error: err instanceof Error ? err.message : "Error desconocido" }
  }
}

export async function markNotificationAsRead(notificationId: string | number) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) return { error: "Falta configuración de Supabase Service Role" }

  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  })

  try {
    const id = typeof notificationId === "string" && !isNaN(Number(notificationId)) ? parseInt(notificationId, 10) : notificationId
    
    const { error } = await supabaseAdmin.from("notificaciones").update({
      leido_at: new Date().toISOString()
    }).eq("id", id)
    
    if (error) throw error

    return { success: true }
  } catch (err: unknown) {
    console.error("Error en markNotificationAsRead:", err)
    return { error: err instanceof Error ? err.message : "Error desconocido" }
  }
}
