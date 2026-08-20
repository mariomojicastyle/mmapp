export type TemperaturaLead =
  | "caliente"
  | "tibio"
  | "enfriando"
  | "pausado"
  | "cerrado_ganado"
  | "cerrado_perdido"

export type CanalContacto = "LinkedIn" | "WhatsApp" | "Email" | "Teléfono" | "Reunión" | "Google Meet" | "Zoom" | "Teams" | "Otro"

export interface VentasProspecto {
  id: string
  empresa: string
  contacto_nombre: string
  contacto_cargo: string | null
  contacto_telefono?: string | null
  contacto_email?: string | null
  perfil_url?: string | null
  canal_preferido: CanalContacto
  pais: string
  temperatura: TemperaturaLead
  ultima_interaccion_at: string
  proxima_accion_at: string | null
  proxima_accion_descripcion: string | null
  avatar_url: string | null
  notas_estrategicas: string | null
  referido_por_id?: string | null
  referido_por_nombre?: string | null
  tipo_relacion?: string | null
  created_at: string
  updated_at: string
  interacciones_count?: number
}

export interface VentasInteraccion {
  id: string
  prospecto_id: string
  canal: CanalContacto
  tipo_entrada: "screenshot" | "texto"
  imagen_url: string | null
  resumen_es: string
  intencion_detectada: string | null
  termometro: TemperaturaLead
  borrador_pt: string
  traduccion_es: string
  mensaje_final_enviado: string | null
  contactos_referidos?: {
    nombre: string
    cargo?: string
    contacto?: string
  }[]
  proxima_accion_sugerida?: string | null
  created_at: string
}

export interface AnalisisIAResponse {
  contacto_detectado?: {
    nombre: string
    cargo?: string
    empresa?: string
  }
  contactos_referidos?: {
    nombre: string
    cargo?: string
    contacto?: string
  }[]
  analisis_es: string
  intencion_detectada: string
  termometro: TemperaturaLead
  timing_horas: number
  proxima_accion_sugerida: string
  borrador_pt: string
  traduccion_es: string
}

export interface RefinamientoIAResponse {
  borrador_pt: string
  traduccion_es: string
}
