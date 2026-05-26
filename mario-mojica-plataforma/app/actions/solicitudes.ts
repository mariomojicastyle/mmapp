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
    // Get client info from the solicitud
    const id = typeof solicitudId === "string" ? parseInt(solicitudId, 10) : solicitudId
    const { data: solicitud } = await supabaseAdmin
      .from("solicitudes")
      .select("client_id")
      .eq("id", id)
      .single()

    let clientDisplay = ""
    if (solicitud?.client_id) {
      const { data: clientProfile } = await supabaseAdmin
        .from("profiles")
        .select("full_name, company")
        .eq("id", solicitud.client_id)
        .single()
      if (clientProfile) {
        clientDisplay = clientProfile.full_name || ""
        if (clientProfile.company) clientDisplay += ` (${clientProfile.company})`
      }
    }

    const { data: superadmins } = await supabaseAdmin.from("profiles").select("id").eq("role", "superadmin")
    const notifyIds = new Set<string>()
    superadmins?.forEach(s => notifyIds.add(s.id))
    if (assignedToId) notifyIds.add(assignedToId)
    
    notifyIds.delete(editorId)

    if (notifyIds.size > 0) {
       const clientPrefix = clientDisplay ? `El cliente ${clientDisplay} ha editado` : `Se ha editado`
       const mensaje = modifications.length > 0
         ? `${clientPrefix} la solicitud #${String(solicitudId).padStart(5, "0")} (${modifications.join(", ")}). Estado: En revisión.`
         : `${clientPrefix} la solicitud #${String(solicitudId).padStart(5, "0")}. Estado: En revisión.`

       const notificaciones = Array.from(notifyIds).map(userId => ({
          user_id: userId,
          tipo: "modificacion_solicitud",
          solicitud_id: id,
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

export async function notifyDateAccepted(
  solicitudId: string | number,
  clientId: string,
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
    
    let clientDisplay = ""
    if (clientId) {
      const { data: clientProfile } = await supabaseAdmin
        .from("profiles")
        .select("full_name, company")
        .eq("id", clientId)
        .single()
        
      if (clientProfile) {
        clientDisplay = clientProfile.full_name || ""
        if (clientProfile.company) clientDisplay += ` (${clientProfile.company})`
      }
    }

    const { data: superadmins } = await supabaseAdmin.from("profiles").select("id").eq("role", "superadmin")
    const notifyIds = new Set<string>()
    superadmins?.forEach(s => notifyIds.add(s.id))
    if (assignedToId) notifyIds.add(assignedToId)
    
    notifyIds.delete(clientId)

    if (notifyIds.size > 0) {
      const clientPrefix = clientDisplay ? `El cliente ${clientDisplay}` : `El cliente`
      const mensaje = `${clientPrefix} ha ACEPTADO la fecha propuesta por el equipo para la solicitud #${String(solicitudId).padStart(5, "0")}.`

      const notificaciones = Array.from(notifyIds).map(userId => ({
        user_id: userId,
        tipo: "sistema",
        solicitud_id: id,
        mensaje
      }))
       
      const { error } = await supabaseAdmin.from("notificaciones").insert(notificaciones)
      if (error) throw error
    }
    
    return { success: true }
  } catch (err: unknown) {
    console.error("Error en notifyDateAccepted:", err)
    return { error: err instanceof Error ? err.message : "Error desconocido" }
  }
}

export async function notifyDateRejected(
  solicitudId: string | number,
  clientId: string,
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
    
    let clientDisplay = ""
    if (clientId) {
      const { data: clientProfile } = await supabaseAdmin
        .from("profiles")
        .select("full_name, company")
        .eq("id", clientId)
        .single()
        
      if (clientProfile) {
        clientDisplay = clientProfile.full_name || ""
        if (clientProfile.company) clientDisplay += ` (${clientProfile.company})`
      }
    }

    const { data: superadmins } = await supabaseAdmin.from("profiles").select("id").eq("role", "superadmin")
    const notifyIds = new Set<string>()
    superadmins?.forEach(s => notifyIds.add(s.id))
    if (assignedToId) notifyIds.add(assignedToId)
    
    notifyIds.delete(clientId)

    if (notifyIds.size > 0) {
      const clientPrefix = clientDisplay ? `El cliente ${clientDisplay}` : `El cliente`
      const mensaje = `${clientPrefix} ha RECHAZADO la fecha propuesta por el equipo para la solicitud #${String(solicitudId).padStart(5, "0")}.`

      const notificaciones = Array.from(notifyIds).map(userId => ({
        user_id: userId,
        tipo: "sistema",
        solicitud_id: id,
        mensaje
      }))
       
      const { error } = await supabaseAdmin.from("notificaciones").insert(notificaciones)
      if (error) throw error
    }
    
    return { success: true }
  } catch (err: unknown) {
    console.error("Error en notifyDateRejected:", err)
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

    // 2. Obtener el nombre del cliente
    const { data: solicitud } = await supabaseAdmin
      .from("solicitudes")
      .select("client_id")
      .eq("id", id)
      .single()

    let clientDisplay = "desconocido"
    if (solicitud?.client_id) {
      const { data: clientProfile } = await supabaseAdmin
        .from("profiles")
        .select("full_name, company")
        .eq("id", solicitud.client_id)
        .single()
      if (clientProfile) {
        clientDisplay = clientProfile.full_name || "desconocido"
        if (clientProfile.company) clientDisplay += ` (${clientProfile.company})`
      }
    }

    // 3. Notificar a los superadmins y colaborador
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
          mensaje: `El cliente ${clientDisplay} ha CANCELADO la solicitud #${String(id).padStart(5, "0")}. Puedes restaurarla o eliminarla definitivamente.`
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

export async function notifyNewSolicitud(
  solicitudId: string | number,
  clientName: string,
  clientCompany?: string
) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) return { error: "Falta configuración de Supabase Service Role" }

  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  })

  try {
    const id = typeof solicitudId === "string" ? parseInt(solicitudId, 10) : solicitudId

    const { data: superadmins } = await supabaseAdmin.from("profiles").select("id").eq("role", "superadmin")
    
    if (superadmins && superadmins.length > 0) {
       const notificaciones = superadmins.map(s => ({
          user_id: s.id,
          tipo: "nueva_solicitud",
          solicitud_id: id,
          mensaje: `El cliente ${clientName || "desconocido"}${clientCompany ? ` (${clientCompany})` : ""} ha creado una nueva solicitud #${String(id).padStart(5, "0")}.`
       }))
       
       const { error } = await supabaseAdmin.from("notificaciones").insert(notificaciones)
       if (error) throw error
    }
    return { success: true }
  } catch (err: unknown) {
    console.error("Error en notifyNewSolicitud:", err)
    return { error: err instanceof Error ? err.message : "Error desconocido" }
  }
}

export async function notifyAssignment(
  solicitudId: string | number,
  assigneeId: string
) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) return { error: "Falta configuración de Supabase Service Role" }

  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  })

  try {
    const id = typeof solicitudId === "string" ? parseInt(solicitudId, 10) : solicitudId

    // 1. Obtener la solicitud para saber quién es el cliente
    const { data: solicitud } = await supabaseAdmin
      .from("solicitudes")
      .select("client_id")
      .eq("id", id)
      .single()

    let clientDisplay = "desconocido"
    if (solicitud?.client_id) {
      // 2. Obtener el nombre y empresa del cliente
      const { data: clientProfile } = await supabaseAdmin
        .from("profiles")
        .select("full_name, company")
        .eq("id", solicitud.client_id)
        .single()
        
      if (clientProfile) {
        clientDisplay = clientProfile.full_name || "desconocido"
        if (clientProfile.company) {
          clientDisplay += ` (${clientProfile.company})`
        }
      }
    }

    // 3. Crear notificación para el asignado
    const { error } = await supabaseAdmin.from("notificaciones").insert({
      user_id: assigneeId,
      tipo: "asignacion_solicitud",
      solicitud_id: id,
      mensaje: `Se te ha asignado la solicitud #${String(id).padStart(5, "0")} creada por el cliente ${clientDisplay}.`
    })

    if (error) throw error

    return { success: true }
  } catch (err: unknown) {
    console.error("Error en notifyAssignment:", err)
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
