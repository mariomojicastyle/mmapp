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

