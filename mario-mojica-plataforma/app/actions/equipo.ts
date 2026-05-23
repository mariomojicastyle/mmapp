 
/* eslint-disable @typescript-eslint/no-explicit-any */
 
 
 
"use server"

import { createClient } from "@supabase/supabase-js"

export async function invitarMiembro(data: {
  nombre: string
  correo: string
  rol: string
  cargo: string
  empresa?: string
  password?: string // Opcional, si no se envía se usa el flujo de invitación por mail
}) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    return { 
      error: "No se ha configurado SUPABASE_SERVICE_ROLE_KEY en el entorno." 
    }
  }

  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })

  try {
    if (data.password) {
      // 1. Create user directly with password (Admin flow)
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: data.correo,
        password: data.password,
        email_confirm: true, // Auto-confirm email
        user_metadata: {
          full_name: data.nombre,
          role: data.rol,
          job_title: data.cargo,
          company: data.empresa
        }
      })

      if (authError) {
        console.error("Error creating user:", authError)
        return { error: authError.message }
      }

      return { success: true, user: authData.user, mode: "created" }
    } else {
      // 2. Original flow: Send invite email
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.inviteUserByEmail(data.correo, {
        data: {
          full_name: data.nombre,
          role: data.rol,
          job_title: data.cargo,
          company: data.empresa
        }
      })

      if (authError) {
        console.error("Error inviting user:", authError)
        return { error: authError.message }
      }

      return { success: true, user: authData.user, mode: "invited" }
    }
    
  } catch (error: any) {
    console.error("Unexpected error inviting member:", error)
    return { error: "Error inesperado al invitar al miembro." }
  }
}

export async function eliminarMiembro(id: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    return { error: "No se ha configurado SUPABASE_SERVICE_ROLE_KEY." }
  }

  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey)

  try {
    // 1. Obtener los IDs de los superadmins para enviarles la notificación
    const { data: superadmins } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("role", "superadmin")

    // 2. Identificar solicitudes huérfanas
    const { data: solicitudes } = await supabaseAdmin
      .from("solicitudes")
      .select("id, titulo")
      .eq("client_id", id)

    // 2.5 Obtener nombre del miembro
    const { data: memberData } = await supabaseAdmin
      .from("profiles")
      .select("full_name")
      .eq("id", id)
      .single()
    const memberName = memberData?.full_name || "Usuario"

    const hasOrphans = solicitudes && solicitudes.length > 0
    const ticketsStr = hasOrphans ? solicitudes.map(s => `#${String(s.id).padStart(5, "0")} - ${s.titulo}`).join(", ") : ""
    const mensaje = hasOrphans
      ? `Se eliminó al miembro "${memberName}". Se eliminaron ${solicitudes.length} solicitudes huérfanas: ${ticketsStr}`
      : `Se eliminó al miembro "${memberName}". No quedaron solicitudes huérfanas.`
      
    // Enviar notificación a los superadmins
    if (superadmins) {
      for (const sa of superadmins) {
        const { error: notifError } = await supabaseAdmin.from("notificaciones").insert({
          user_id: sa.id,
          tipo: "sistema",
          mensaje: mensaje,
          solicitud_id: null // Usar null para evitar FK errors o eliminaciones en cascada de notificaciones
        })
        if (notifError) console.error("Error insertando notificación de miembro:", notifError)
      }
    }

    if (hasOrphans) {
      // Borrar dependencias
      await supabaseAdmin.from("solicitudes").delete().eq("client_id", id)
    }

    // Luego, eliminamos al usuario de profiles.
    const { error: profileError } = await supabaseAdmin.from("profiles").delete().eq("id", id)
    if (profileError) {
      console.error("Error deleting from profiles:", profileError)
      return { error: `No se pudo eliminar el perfil: ${profileError.message}` }
    }

    // Finalmente, eliminamos de auth
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(id)
    if (authError) {
      console.error("Error deleting from auth:", authError)
      return { error: authError.message }
    }

    return { success: true }
  } catch (error: any) {
    console.error("Unexpected error deleting member:", error)
    return { error: "Error inesperado al eliminar miembro." }
  }
}

export async function eliminarEmpresa(company: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    return { error: "No se ha configurado SUPABASE_SERVICE_ROLE_KEY." }
  }

  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey)

  try {
    const { data: superadmins } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("role", "superadmin")

    // 1. Obtener todos los perfiles de la empresa
    const { data: profiles, error: fetchError } = await supabaseAdmin
      .from("profiles")
      .select("id, full_name")
      .eq("company", company)

    if (fetchError) {
      return { error: fetchError.message }
    }

    if (!profiles || profiles.length === 0) {
      return { error: "No se encontraron miembros en esta empresa." }
    }

    let totalOrphaned = 0
    const orphanedDetails: string[] = []

    // 2. Iterar y eliminar
    const errors = []
    for (const p of profiles) {
      // 2a. Identificar solicitudes huérfanas
      const { data: solicitudes } = await supabaseAdmin
        .from("solicitudes")
        .select("id, titulo")
        .eq("client_id", p.id)

      if (solicitudes && solicitudes.length > 0) {
        totalOrphaned += solicitudes.length
        solicitudes.forEach(s => orphanedDetails.push(`#${String(s.id).padStart(5, "0")}`))
        await supabaseAdmin.from("solicitudes").delete().eq("client_id", p.id)
      }
      
      // Borrar de profiles
      const { error: pError } = await supabaseAdmin.from("profiles").delete().eq("id", p.id)
      if (pError) {
        errors.push(`Error borrando perfil ${p.id}: ${pError.message}`)
        continue
      }

      // Borrar de auth
      const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(p.id)
      if (authError) {
        errors.push(`Error borrando auth de ${p.id}: ${authError.message}`)
      }
    }

    // 3. Generar notificación de empresa
    if (superadmins) {
      const mensaje = totalOrphaned > 0 
        ? `Se eliminó la empresa "${company}". Se eliminaron ${totalOrphaned} solicitudes huérfanas en total (${orphanedDetails.join(", ")}).`
        : `Se eliminó la empresa "${company}". No quedaron solicitudes huérfanas.`
        
      for (const sa of superadmins) {
        const { error: notifError } = await supabaseAdmin.from("notificaciones").insert({
          user_id: sa.id,
          tipo: "sistema",
          mensaje: mensaje,
          solicitud_id: null // Usar null para evitar FK errors
        })
        if (notifError) {
          console.error("Error insertando notificación de empresa:", notifError)
        }
      }
    }

    if (errors.length > 0) {
      console.error("Some members could not be deleted:", errors)
      return { error: "Algunos miembros no pudieron ser eliminados de autenticación.", details: errors }
    }

    return { success: true }
  } catch (error: any) {
    console.error("Unexpected error deleting company:", error)
    return { error: "Error inesperado al eliminar empresa." }
  }
}


