"use server"

import { createClient } from "@supabase/supabase-js"

export async function sendPlatformFeedback(
  userId: string,
  feedbackText: string,
  category: string = "general"
) {
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
    // 1. Obtener la información del remitente
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("full_name, company")
      .eq("id", userId)
      .single()

    if (profileError) throw profileError

    const senderName = profile?.full_name || "Usuario Desconocido"
    const senderCompany = profile?.company ? ` (${profile.company})` : ""
    
    // Formatear el mensaje de la notificación
    const categoryLabel = category.toUpperCase()
    const mensajeNotificacion = `[FEEDBACK - ${categoryLabel}] ${senderName}${senderCompany}: "${feedbackText}"`

    // 2. Obtener todos los administradores y coequiperos (equipo de Mario Mojica)
    const { data: teamMembers, error: teamError } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .in("role", ["superadmin", "coequipero"])

    if (teamError) throw teamError

    if (!teamMembers || teamMembers.length === 0) {
      return { success: true, message: "No hay miembros del equipo registrados para notificar." }
    }

    // 3. Crear las notificaciones
    const notificationsToInsert = teamMembers.map(member => ({
      user_id: member.id,
      tipo: "feedback",
      mensaje: mensajeNotificacion,
      leido_at: null
    }))

    const { error: insertError } = await supabaseAdmin
      .from("notificaciones")
      .insert(notificationsToInsert)

    if (insertError) throw insertError

    return { success: true }
  } catch (err: unknown) {
    console.error("Error en sendPlatformFeedback:", err)
    return { error: err instanceof Error ? err.message : "Error al enviar el feedback" }
  }
}
