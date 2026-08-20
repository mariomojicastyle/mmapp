"use server"

import fs from "fs"
import path from "path"
import { createClient } from "@supabase/supabase-js"
import { VentasProspecto, VentasInteraccion, TemperaturaLead } from "@/lib/types/ventas-ram"

const DATA_FILE_PATH = path.join(process.cwd(), "data", "ventas_ram_storage.json")

function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    return null
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

function loadDiskStore(): { prospectos: VentasProspecto[]; interacciones: Record<string, VentasInteraccion[]> } {
  try {
    if (fs.existsSync(DATA_FILE_PATH)) {
      const raw = fs.readFileSync(DATA_FILE_PATH, "utf-8")
      const parsed = JSON.parse(raw)
      if (parsed.prospectos && Array.isArray(parsed.prospectos)) {
        return parsed
      }
    }
  } catch (err) {
    console.error("Error leyendo ventas_ram_storage.json:", err)
  }
  return { prospectos: SEED_PROSPECTOS, interacciones: SEED_INTERACCIONES }
}

function saveDiskStore(prospectos: VentasProspecto[], interacciones: Record<string, VentasInteraccion[]>) {
  try {
    const dir = path.dirname(DATA_FILE_PATH)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
    fs.writeFileSync(
      DATA_FILE_PATH,
      JSON.stringify({ prospectos, interacciones }, null, 2),
      "utf-8"
    )
  } catch (err) {
    console.error("Error guardando ventas_ram_storage.json:", err)
  }
}

// Fallback seed data in case Supabase is offline or table is not created yet
let SEED_PROSPECTOS: VentasProspecto[] = [
  {
    id: "p-mobille",
    empresa: "Mobille Exportação e Importação Ltda (AKEO Partner)",
    contacto_nombre: "Luiz Atilio Barse",
    contacto_cargo: "Diretor & Super-Conector B2B",
    perfil_url: "https://www.linkedin.com/in/luiz-atilio-barse-bb805874/",
    contacto_telefono: "+55 54 9909-1202",
    canal_preferido: "WhatsApp",
    pais: "Brasil (Carlos Barbosa, RS)",
    temperatura: "caliente",
    ultima_interaccion_at: new Date().toISOString(),
    proxima_accion_at: new Date(Date.now() + 2 * 86400000).toISOString(),
    proxima_accion_descripcion: "Agradecer por el puente con Marcelo Novo y actualizarlo sobre la reunión post-Movelsul",
    avatar_url: null,
    notas_estrategicas: "Aliado y Padrino B2B clave en Rio Grande do Sul. Fue quien nos conectó directamente con Marcelo Novo (Politorno) con el aval del Sr. Pedro de AKEO. Si Politorno cierra, nos abrirá las puertas a más fábricas.",
    referido_por_id: null,
    referido_por_nombre: null,
    tipo_relacion: "Padrino B2B & Super-Conector",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    interacciones_count: 3,
  },
  {
    id: "p-politorno",
    empresa: "Politorno Móveis",
    contacto_nombre: "Marcelo Novo",
    contacto_cargo: "Diretor / Líder P&D",
    canal_preferido: "WhatsApp",
    pais: "Brasil",
    temperatura: "caliente",
    ultima_interaccion_at: new Date().toISOString(),
    proxima_accion_at: new Date(Date.now() + 7 * 86400000).toISOString(),
    proxima_accion_descripcion: "Fijar hora de reunión el miércoles tras Movelsul 2026",
    avatar_url: null,
    notas_estrategicas: "Reunión confirmada para la próxima semana. Interesado en manuales 3D y motor paramétrico.",
    referido_por_id: "p-mobille",
    referido_por_nombre: "Luiz Atilio Barse (Mobille / AKEO)",
    tipo_relacion: "Recomendado por Atilio Barse & Sr. Pedro de AKEO",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    interacciones_count: 2,
  },
  {
    id: "p-k1",
    empresa: "Grupo K1 (Kappesberg)",
    contacto_nombre: "Julio Santos",
    contacto_cargo: "Especialista em IA & Automação / Marketing",
    canal_preferido: "LinkedIn",
    pais: "Brasil",
    temperatura: "caliente",
    ultima_interaccion_at: new Date(Date.now() - 1 * 86400000).toISOString(),
    proxima_accion_at: new Date(Date.now() + 2 * 86400000).toISOString(),
    proxima_accion_descripcion: "Esperar feedback de reunión interna con su gerente sobre costos y piloto",
    avatar_url: null,
    notas_estrategicas: "Enviada propuesta detallada, ahorro 30% en P&D y suscripción $1 USD/mes por mueble activo.",
    referido_por_id: null,
    referido_por_nombre: null,
    tipo_relacion: "Prospección directa en LinkedIn",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    interacciones_count: 3,
  },
  {
    id: "p-kitsparana",
    empresa: "Kit's Paraná",
    contacto_nombre: "Marcos Benedito & Jamylle Duarte",
    contacto_cargo: "Directivos P&D / Marketing",
    canal_preferido: "Email",
    pais: "Brasil",
    temperatura: "tibio",
    ultima_interaccion_at: new Date(Date.now() - 1 * 86400000).toISOString(),
    proxima_accion_at: new Date(Date.now() + 1 * 86400000).toISOString(),
    proxima_accion_descripcion: "Enviar correo corporativo formal referenciado por Andre Luis",
    avatar_url: null,
    notas_estrategicas: "Andre Luis (comercio exterior) facilitó los correos de Marcos y Jamylle para la presentación.",
    referido_por_id: null,
    referido_por_nombre: "Andre Luis de Melo Levinski",
    tipo_relacion: "Referenciado por Andre Luis (Director de Ingeniería)",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    interacciones_count: 1,
  },
  {
    id: "p-henn",
    empresa: "Móveis Henn",
    contacto_nombre: "Rudgeri Henkel",
    contacto_cargo: "Gerente de Planejamento e Materiais",
    canal_preferido: "WhatsApp",
    pais: "Brasil",
    temperatura: "tibio",
    ultima_interaccion_at: new Date(Date.now() - 15 * 86400000).toISOString(),
    proxima_accion_at: new Date(Date.now() + 2 * 86400000).toISOString(),
    proxima_accion_descripcion: "Enviar mensaje inicial por WhatsApp para presentar la demo",
    avatar_url: null,
    notas_estrategicas: "Recomendado por Jonas Borck. Facilitó su número directo.",
    referido_por_id: null,
    referido_por_nombre: "Jonas Borck",
    tipo_relacion: "Referenciado por Jonas Borck",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    interacciones_count: 1,
  },
  {
    id: "p-moncaleano",
    empresa: "Del Alba S.A. (ex-Maderkit S.A.)",
    contacto_nombre: "Andrés Felipe Moncaleano Campo",
    contacto_cargo: "Gerente de Abastecimiento / Supply Chain",
    perfil_url: "https://www.linkedin.com/in/andresfelipemoncaleano/",
    contacto_telefono: null,
    canal_preferido: "LinkedIn",
    pais: "Colombia (Cali, Valle del Cauca)",
    temperatura: "tibio",
    ultima_interaccion_at: new Date().toISOString(),
    proxima_accion_at: new Date(Date.now() + 2 * 86400000).toISOString(),
    proxima_accion_descripcion: "Reconectar como ex-colega de Maderkit y presentar solución de manuales 3D y optimización",
    avatar_url: null,
    notas_estrategicas: "Ex-colega de Mario en Maderkit S.A. Ingeniero Industrial, Economista y Negociador Internacional con más de 12 años liderando supply chain, S&OP y compras estratégicas.",
    referido_por_id: null,
    referido_por_nombre: null,
    tipo_relacion: "Ex-colega en Maderkit S.A.",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    interacciones_count: 0,
  },
  {
    id: "p-ternova",
    empresa: "Ternova",
    contacto_nombre: "Julio Sanchez",
    contacto_cargo: "Ingeniería / Automatización",
    perfil_url: "https://www.linkedin.com/in/julio-sanchez",
    contacto_telefono: null,
    canal_preferido: "LinkedIn",
    pais: "El Salvador (San Salvador)",
    temperatura: "tibio",
    ultima_interaccion_at: new Date().toISOString(),
    proxima_accion_at: new Date(Date.now() + 2 * 86400000).toISOString(),
    proxima_accion_descripcion: "Enviar mensaje suave de cortesía dejando la puerta abierta y tip de exportación web",
    avatar_url: null,
    notas_estrategicas: "Usa Fusion 360 para armar maquinaria, pero se queda corto con animaciones. Mencionó que ya va muy avanzado en su proyecto actual.",
    referido_por_id: null,
    referido_por_nombre: null,
    tipo_relacion: "Prospección directa en LinkedIn",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    interacciones_count: 1,
  },
  {
    id: "p-inval",
    empresa: "Inval S.A.",
    contacto_nombre: "Juan Carlos Londoño",
    contacto_cargo: "Presidente / CEO",
    perfil_url: "https://www.linkedin.com/in/juan-carlos-londo%C3%B1o-51a12265/",
    contacto_telefono: null,
    canal_preferido: "WhatsApp",
    pais: "Colombia (Palmira, Valle del Cauca)",
    temperatura: "caliente",
    ultima_interaccion_at: new Date().toISOString(),
    proxima_accion_at: new Date(Date.now() + 2 * 86400000).toISOString(),
    proxima_accion_descripcion: "Contactar por WhatsApp con el saludo y aval de Andrés Moncaleano",
    avatar_url: null,
    notas_estrategicas: "Andrés Felipe Moncaleano facilitó su número de WhatsApp. Presidente y CEO de Inval S.A. en Palmira. Foco: manuales interactivos 3D y optimización de ensamble.",
    referido_por_id: "p-moncaleano",
    referido_por_nombre: "Andrés Felipe Moncaleano Campo",
    tipo_relacion: "Padrino B2B: Andrés facilitó contacto directo y WhatsApp de Juan Carlos (CEO Inval)",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    interacciones_count: 1,
  },
  {
    id: "p-rta",
    empresa: "RTA DESIGN S.A.S",
    contacto_nombre: "Juan Carlos Pérez Londoño",
    contacto_cargo: "Gerente Administrativo y Financiero",
    perfil_url: "https://www.linkedin.com/in/juan-carlos-perez-londono-a7981394/",
    contacto_telefono: null,
    canal_preferido: "Email",
    pais: "Colombia (Medellín, Antioquia)",
    temperatura: "tibio",
    ultima_interaccion_at: new Date(Date.now() - 5 * 86400000).toISOString(),
    proxima_accion_at: new Date(Date.now() + 5 * 86400000).toISOString(),
    proxima_accion_descripcion: "Enviar hoja de vida al mail juan.perez@rta.com.co y agendar seguimiento",
    avatar_url: null,
    notas_estrategicas: "Gerente Administrativo y Financiero en Medellín. Solicitó hoja de vida por correo para opciones de diseño y optimización de producto.",
    referido_por_id: null,
    referido_por_nombre: null,
    tipo_relacion: "Contacto directo en LinkedIn / Email",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    interacciones_count: 1,
  },
  {
    id: "p-bartira",
    empresa: "Indústria de Móveis Bartira",
    contacto_nombre: "Denis Roveri",
    contacto_cargo: "Ex-Gerente de Engenharia",
    canal_preferido: "LinkedIn",
    pais: "Brasil",
    temperatura: "pausado",
    ultima_interaccion_at: new Date(Date.now() - 1 * 86400000).toISOString(),
    proxima_accion_at: null,
    proxima_accion_descripcion: "Mantener contacto para futuros proyectos en la industria",
    avatar_url: null,
    notas_estrategicas: "Informó amablemente que ya no está en Bartira. Canal profesional abierto.",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    interacciones_count: 1,
  },
  {
    id: "p-demobile",
    empresa: "Demóbile",
    contacto_nombre: "Junio César Françolin",
    contacto_cargo: "Gerente de Produção",
    canal_preferido: "LinkedIn",
    pais: "Brasil",
    temperatura: "enfriando",
    ultima_interaccion_at: new Date(Date.now() - 20 * 86400000).toISOString(),
    proxima_accion_at: new Date(Date.now() + 3 * 86400000).toISOString(),
    proxima_accion_descripcion: "Enviar mensaje de seguimiento corto sobre control de calidad extendido",
    avatar_url: null,
    notas_estrategicas: "Vio el perfil de Mario en LinkedIn.",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    interacciones_count: 1,
  },
]

let SEED_INTERACCIONES: Record<string, VentasInteraccion[]> = {
  "p-mobille": [
    {
      id: "i-mobille-3",
      prospecto_id: "p-mobille",
      canal: "WhatsApp",
      tipo_entrada: "screenshot",
      imagen_url: null,
      resumen_es: "Atilio escribió proactivamente a Mario preocupado al ver en noticias el sismo/temblor. Mario le confirmó que él y su familia están a salvo.",
      intencion_detectada: "Solidaridad y cercanía personal",
      termometro: "caliente",
      borrador_pt: "",
      traduccion_es: "",
      mensaje_final_enviado: "Mario: 'Todos muy bien afortunadamente! Con mi familia fuimos los primeros en salir a zona segura, muchas gracias amigo!'",
      created_at: new Date(Date.now() - 8 * 86400000).toISOString(),
    },
    {
      id: "i-mobille-2",
      prospecto_id: "p-mobille",
      canal: "WhatsApp",
      tipo_entrada: "screenshot",
      imagen_url: null,
      resumen_es: "Atilio entregó el contacto directo de Marcelo Novo (Politorno) con el aval clave del Sr. Pedro de AKEO, indicando que si todo sale bien nos presentará con más fábricas.",
      intencion_detectada: "Padrinazgo B2B y puente directo a Marcelo Novo (Politorno)",
      termometro: "caliente",
      borrador_pt: "",
      traduccion_es: "",
      mensaje_final_enviado: "Atilio: 'Sigue el contacto en Politorno. Dile que el Sr. Pedro de AKEO fue quien le indicó. Ojalá puedas avanzar con Politorno, si sale bien puedo indicarte para otras empresas.'",
      created_at: new Date(Date.now() - 13 * 86400000).toISOString(),
    },
    {
      id: "i-mobille-1",
      prospecto_id: "p-mobille",
      canal: "WhatsApp",
      tipo_entrada: "screenshot",
      imagen_url: null,
      resumen_es: "Mario presentó su nuevo desarrollo de manuales interactivos 3D tras salir de Maderkit. Atilio elogió con entusiasmo el trabajo.",
      intencion_detectada: "Reconexión y validación inicial de manual interactivo 3D",
      termometro: "caliente",
      borrador_pt: "",
      traduccion_es: "",
      mensaje_final_enviado: "Atilio: 'Mi estimado y siempre recordado Mario, qué lindo trabajo!'",
      created_at: new Date(Date.now() - 38 * 86400000).toISOString(),
    },
  ],
  "p-politorno": [
    {
      id: "i-poli-3",
      prospecto_id: "p-politorno",
      canal: "WhatsApp",
      tipo_entrada: "texto",
      imagen_url: null,
      resumen_es: "Mario saludó por Movelsul 2026 y ofreció mostrar los avances del software paramétrico. Marcelo confirmó en 7 min retomar el tema y agendar videollamada la próxima semana.",
      intencion_detectada: "Reunión confirmada para la próxima semana (tras Movelsul)",
      termometro: "caliente",
      borrador_pt: "Olá, Marcelo! Imagino que esta semana você esteja a mil por hora com a Movelsul 2026... O que acha de conversarmos 20 minutinhos na próxima semana? -> Marcelo respondeu: 'Perfeito! Abraço!'",
      traduccion_es: "¡Hola Marcelo! Me imagino que esta semana estés a mil por hora con Movelsul... ¿Qué te parece conversar 20 min la próxima semana? -> Marcelo respondió: '¡Perfecto! ¡Abrazo!'",
      mensaje_final_enviado: "Perfeito, Marcelo! Combinado. Bom trabalho e ótima feira por aí. Na próxima semana te chamo na quarta-feira para combinarmos o horário. Um grande abraço e sucesso! 🤝",
      created_at: new Date().toISOString(),
    },
    {
      id: "i-poli-2",
      prospecto_id: "p-politorno",
      canal: "WhatsApp",
      tipo_entrada: "texto",
      imagen_url: null,
      resumen_es: "Mario envió la Calculadora de Costos con ahorro del 30% en P&D. Marcelo respondió agradeciendo y confirmando que la va a revisar con su equipo.",
      intencion_detectada: "Recepción y validación de calculadora de costos de P&D",
      termometro: "caliente",
      borrador_pt: "Excelente, Marcelo! Aproveito e te envio em anexo uma planilha simples que montamos como uma estimativa inicial de custos e economia para a Politorno.",
      traduccion_es: "¡Excelente Marcelo! Aprovecho y te envío adjunta una plantilla simple con la estimación inicial de costos y ahorro para Politorno.",
      mensaje_final_enviado: "Calculadora_Costos_Politorno.xlsx compartida por WhatsApp.",
      created_at: new Date(Date.now() - 4 * 86400000).toISOString(),
    },
    {
      id: "i-poli-1",
      prospecto_id: "p-politorno",
      canal: "WhatsApp",
      tipo_entrada: "texto",
      imagen_url: null,
      resumen_es: "Primer contacto post-reunión. Mario envió enlace a la demo 3D de la Estantería Multifuncional (mariomojica.com/demo). Marcelo agradeció positivamente.",
      intencion_detectada: "Revisión de Demo 3D interactiva",
      termometro: "caliente",
      borrador_pt: "Olá, Marcelo! Muito obrigado pelo seu tempo na nossa conversa de hoje. Te envio o link da demonstração com a Estante Multifuncional...",
      traduccion_es: "¡Hola Marcelo! Muchas gracias por tu tiempo en nuestra charla de hoy. Te envío el enlace de la demo con la Estantería Multifuncional...",
      mensaje_final_enviado: "https://mariomojica.com/demo",
      created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
    },
  ],
  "p-k1": [
    {
      id: "i-k1-2",
      prospecto_id: "p-k1",
      canal: "LinkedIn",
      tipo_entrada: "screenshot",
      imagen_url: null,
      resumen_es: "Julio Santos confirmó que la solución hace total sentido con la operación de Grupo K1, la presentará a su gerente y preguntó por valores e insumos requeridos.",
      intencion_detectada: "Solicitud directa de precios e insumos técnicos",
      termometro: "caliente",
      borrador_pt: "Olá Julio! Que satisfação imensa... Preciso apenas do PDF do manual atual (até 24 peças). Sobre valores: 30% de economia em P&D e US$ 1,00/mês por móvel ativo. Segue planilha de estimativa.",
      traduccion_es: "¡Hola Julio! Qué inmensa satisfacción... Solo necesito el PDF del manual actual (hasta 24 piezas). Sobre precios: 30% de ahorro en P&D y US$ 1,00/mes por mueble activo. Adjunto la plantilla.",
      mensaje_final_enviado: "Propuesta completa con Calculadora_Costos_K1.xlsx enviada por LinkedIn chat.",
      created_at: new Date(Date.now() - 1 * 86400000).toISOString(),
    },
    {
      id: "i-k1-1",
      prospecto_id: "p-k1",
      canal: "LinkedIn",
      tipo_entrada: "texto",
      imagen_url: null,
      resumen_es: "Mario contactó a Julio felicitándolo por su rol en IA & Automatización en Grupo K1 y le compartió el enlace a la demo.",
      intencion_detectada: "Primer contacto en frío con Champion interno de Grupo K1",
      termometro: "caliente",
      borrador_pt: "Olá Julio, sensacional ver um especialista em IA e automação dentro do Grupo K1! Desenvolvemos plataformas 3D e telemetria. Veja a demo: https://mariomojica.com/demo",
      traduccion_es: "¡Hola Julio, sensacional ver un especialista en IA y automatización dentro de Grupo K1! Desarrollamos plataformas 3D y telemetría. Mira la demo: https://mariomojica.com/demo",
      mensaje_final_enviado: "Mensaje de conexión enviado por LinkedIn.",
      created_at: new Date(Date.now() - 4 * 86400000).toISOString(),
    },
  ],
  "p-bartira": [
    {
      id: "i-bartira-1",
      prospecto_id: "p-bartira",
      canal: "LinkedIn",
      tipo_entrada: "screenshot",
      imagen_url: null,
      resumen_es: "Mario contactó a Denis Roveri por recomendación de Hermes Rodrigues. Denis respondió amablemente informando que ya no trabaja en Bartira. Mario dejó la puerta abierta para futuros proyectos.",
      intencion_detectada: "Actualización de estado laboral / Red abierta",
      termometro: "pausado",
      borrador_pt: "Olá Denis, tudo bem? Muito obrigado pelo retorno! Entendido perfeitamente. Como ambos estamos no setor moveleiro e os caminhos da engenharia sempre se cruzam, sigo 100% à sua disposição...",
      traduccion_es: "¡Hola Denis, qué tal? ¡Muchas gracias por responder! Entendido perfectamente. Como ambos estamos en el sector mueblero y los caminos de la ingeniería siempre se cruzan, sigo 100% a tu disposición...",
      mensaje_final_enviado: "Mensaje cordial de despedida y red abierta enviado por LinkedIn.",
      created_at: new Date(Date.now() - 1 * 86400000).toISOString(),
    },
  ],
  "p-kitsparana": [
    {
      id: "i-kits-1",
      prospecto_id: "p-kitsparana",
      canal: "LinkedIn",
      tipo_entrada: "screenshot",
      imagen_url: null,
      resumen_es: "Andre Luis (analista de comercio exterior) respondió recomendando enviar la presentación por correo a Marcos Benedito y Jamylle Duarte.",
      intencion_detectada: "Referencia interna a tomadores de decisión",
      termometro: "tibio",
      borrador_pt: "Olá Andre, muito obrigado pelo retorno e pela indicação dos contatos! Vou preparar e enviar a apresentação completa para o Marcos e a Jamylle.",
      traduccion_es: "¡Hola Andre, muchas gracias por la respuesta y por la indicación de contactos! Prepararé y enviaré la presentación completa para Marcos y Jamylle.",
      mensaje_final_enviado: "Agradecimiento en LinkedIn + Correo preparado para marcos.benedito@kitsparana.com.br y jamylle.duarte@kitsparana.com.br.",
      created_at: new Date(Date.now() - 1 * 86400000).toISOString(),
    },
  ],
}

function getSeedInteraccionesForProspecto(id: string, empresa?: string): VentasInteraccion[] {
  if (SEED_INTERACCIONES[id] && SEED_INTERACCIONES[id].length > 0) {
    return SEED_INTERACCIONES[id]
  }
  const emp = (empresa || "").toLowerCase()
  if (emp.includes("ternova") || emp.includes("sanchez")) return SEED_INTERACCIONES["p-ternova"] || []
  if (emp.includes("politorno")) return SEED_INTERACCIONES["p-politorno"] || []
  if (emp.includes("k1") || emp.includes("kappesberg")) return SEED_INTERACCIONES["p-k1"] || []
  if (emp.includes("bartira")) return SEED_INTERACCIONES["p-bartira"] || []
  if (emp.includes("kit")) return SEED_INTERACCIONES["p-kitsparana"] || []
  return []
}

export async function getVentasProspectos(): Promise<{ success: boolean; data: VentasProspecto[]; error?: string }> {
  try {
    const disk = loadDiskStore()
    const supabase = getSupabaseAdmin()

    if (!supabase) {
      const dataWithCounts = disk.prospectos.map((p) => ({
        ...p,
        interacciones_count: (disk.interacciones[p.id] || []).length,
      }))
      return { success: true, data: dataWithCounts }
    }

    const { data, error } = await supabase
      .from("ventas_prospectos")
      .select("*, ventas_interacciones(count)")
      .order("ultima_interaccion_at", { ascending: false })

    if (error || !data || data.length === 0) {
      const dataWithCounts = disk.prospectos.map((p) => ({
        ...p,
        interacciones_count: (disk.interacciones[p.id] || []).length,
      }))
      return { success: true, data: dataWithCounts }
    }

    const mapped = data.map((p: any) => {
      const count = p.ventas_interacciones?.[0]?.count || (disk.interacciones[p.id] || []).length
      return {
        ...p,
        interacciones_count: count,
      }
    })

    // Merge con todos los prospectos del almacenamiento en disco
    const combined = [...mapped]
    disk.prospectos.forEach((dp) => {
      if (!combined.some((p) => p.id === dp.id)) {
        combined.push({
          ...dp,
          interacciones_count: (disk.interacciones[dp.id] || []).length,
        })
      }
    })

    return { success: true, data: combined }
  } catch (err: any) {
    console.error("Error en getVentasProspectos:", err)
    const disk = loadDiskStore()
    return { success: true, data: disk.prospectos }
  }
}

export async function getVentasProspectoById(id: string): Promise<{
  success: boolean
  data?: { prospecto: VentasProspecto; interacciones: VentasInteraccion[] }
  error?: string
}> {
  try {
    const disk = loadDiskStore()

    if (id.startsWith("p-")) {
      const prospecto = disk.prospectos.find((p) => p.id === id) || disk.prospectos[0]
      const interacciones = disk.interacciones[prospecto.id] || []
      return {
        success: true,
        data: {
          prospecto,
          interacciones,
        },
      }
    }

    const supabase = getSupabaseAdmin()
    if (!supabase) {
      const prospecto = disk.prospectos.find((p) => p.id === id) || disk.prospectos[0]
      const interacciones = disk.interacciones[prospecto.id] || []
      return {
        success: true,
        data: {
          prospecto,
          interacciones,
        },
      }
    }

    const { data: prospecto, error: pError } = await supabase
      .from("ventas_prospectos")
      .select("*")
      .eq("id", id)
      .single()

    if (pError || !prospecto) {
      const fallback = disk.prospectos.find((p) => p.id === id) || disk.prospectos[0]
      const interacciones = disk.interacciones[fallback.id] || []
      return {
        success: true,
        data: {
          prospecto: fallback,
          interacciones,
        },
      }
    }

    const { data: interacciones } = await supabase
      .from("ventas_interacciones")
      .select("*")
      .eq("prospecto_id", id)
      .order("created_at", { ascending: false })

    const diskInteracciones = disk.interacciones[prospecto.id] || []
    const finalInteracciones = interacciones && interacciones.length > 0 ? interacciones : diskInteracciones

    return {
      success: true,
      data: {
        prospecto,
        interacciones: finalInteracciones,
      },
    }
  } catch (err: any) {
    console.error("Error en getVentasProspectoById:", err)
    return { success: false, error: err.message }
  }
}

export async function saveVentasProspecto(
  payload: Partial<VentasProspecto>
): Promise<{ success: boolean; data?: VentasProspecto; error?: string }> {
  const disk = loadDiskStore()
  const existing = payload.id ? disk.prospectos.find((p) => p.id === payload.id) : null

  const newP: VentasProspecto = {
    id: payload.id || `p-${Date.now()}`,
    empresa: payload.empresa || existing?.empresa || "Nueva Empresa",
    contacto_nombre: payload.contacto_nombre || existing?.contacto_nombre || "Contacto",
    contacto_cargo: payload.contacto_cargo !== undefined ? payload.contacto_cargo : (existing?.contacto_cargo || null),
    contacto_telefono: payload.contacto_telefono !== undefined ? payload.contacto_telefono : (existing?.contacto_telefono || null),
    perfil_url: payload.perfil_url !== undefined ? payload.perfil_url : (existing?.perfil_url || null),
    canal_preferido: payload.canal_preferido || existing?.canal_preferido || "LinkedIn",
    pais: payload.pais || existing?.pais || "Brasil",
    temperatura: payload.temperatura || existing?.temperatura || "tibio",
    ultima_interaccion_at: payload.ultima_interaccion_at || existing?.ultima_interaccion_at || new Date().toISOString(),
    proxima_accion_at: payload.proxima_accion_at !== undefined ? payload.proxima_accion_at : (existing?.proxima_accion_at || null),
    proxima_accion_descripcion: payload.proxima_accion_descripcion !== undefined ? payload.proxima_accion_descripcion : (existing?.proxima_accion_descripcion || null),
    avatar_url: payload.avatar_url !== undefined ? payload.avatar_url : (existing?.avatar_url || null),
    notas_estrategicas: payload.notas_estrategicas !== undefined ? payload.notas_estrategicas : (existing?.notas_estrategicas || null),
    referido_por_id: payload.referido_por_id !== undefined ? payload.referido_por_id : (existing?.referido_por_id || null),
    referido_por_nombre: payload.referido_por_nombre !== undefined ? payload.referido_por_nombre : (existing?.referido_por_nombre || null),
    tipo_relacion: payload.tipo_relacion !== undefined ? payload.tipo_relacion : (existing?.tipo_relacion || null),
    created_at: existing?.created_at || new Date().toISOString(),
    updated_at: new Date().toISOString(),
    interacciones_count: existing?.interacciones_count || 0,
  }

  // Actualizar almacenamiento persistente en disco
  const existingIdx = disk.prospectos.findIndex((p) => p.id === newP.id)
  if (existingIdx >= 0) {
    disk.prospectos[existingIdx] = { ...disk.prospectos[existingIdx], ...newP }
  } else {
    disk.prospectos = [newP, ...disk.prospectos]
  }
  saveDiskStore(disk.prospectos, disk.interacciones)

  try {
    const supabase = getSupabaseAdmin()
    if (!supabase) {
      return { success: true, data: newP }
    }

    if (payload.id && !payload.id.startsWith("p-")) {
      const { data, error } = await supabase
        .from("ventas_prospectos")
        .update({
          ...payload,
          updated_at: new Date().toISOString(),
        })
        .eq("id", payload.id)
        .select()
        .single()

      if (error) {
        console.warn("Supabase update warning, guardado en disco:", error.message)
        return { success: true, data: newP }
      }
      return { success: true, data }
    } else {
      const { id, ...insertData } = payload
      const { data, error } = await supabase
        .from("ventas_prospectos")
        .insert([{ ...insertData, updated_at: new Date().toISOString() }])
        .select()
        .single()

      if (error) {
        console.warn("Supabase insert warning, guardado en disco:", error.message)
        return { success: true, data: newP }
      }
      return { success: true, data }
    }
  } catch (err: any) {
    console.warn("Error en saveVentasProspecto (usando disco):", err.message)
    return { success: true, data: newP }
  }
}

export async function updateTemperaturaProspecto(
  id: string,
  temperatura: TemperaturaLead
): Promise<{ success: boolean; error?: string }> {
  const disk = loadDiskStore()
  const pIdx = disk.prospectos.findIndex((p) => p.id === id)
  if (pIdx >= 0) {
    disk.prospectos[pIdx] = {
      ...disk.prospectos[pIdx],
      temperatura,
      updated_at: new Date().toISOString(),
    }
    saveDiskStore(disk.prospectos, disk.interacciones)
  }

  try {
    const supabase = getSupabaseAdmin()
    if (!supabase) return { success: true }

    const { error } = await supabase
      .from("ventas_prospectos")
      .update({ temperatura, updated_at: new Date().toISOString() })
      .eq("id", id)

    if (error) throw error
    return { success: true }
  } catch (err: any) {
    console.error("Error en updateTemperaturaProspecto:", err)
    return { success: true }
  }
}

export async function saveVentasInteraccion(
  payload: Omit<VentasInteraccion, "id" | "created_at">
): Promise<{ success: boolean; data?: VentasInteraccion; error?: string }> {
  const newI: VentasInteraccion = {
    ...payload,
    id: `i-${Date.now()}`,
    created_at: new Date().toISOString(),
  }

  // Guardar siempre en almacenamiento en disco
  const disk = loadDiskStore()
  if (!disk.interacciones[payload.prospecto_id]) {
    disk.interacciones[payload.prospecto_id] = []
  }
  disk.interacciones[payload.prospecto_id] = [newI, ...disk.interacciones[payload.prospecto_id]]

  // Actualizar prospecto en disco
  const pIdx = disk.prospectos.findIndex((p) => p.id === payload.prospecto_id)
  if (pIdx >= 0) {
    disk.prospectos[pIdx] = {
      ...disk.prospectos[pIdx],
      ultima_interaccion_at: new Date().toISOString(),
      temperatura: payload.termometro,
      interacciones_count: disk.interacciones[payload.prospecto_id].length,
    }
  }
  saveDiskStore(disk.prospectos, disk.interacciones)

  try {
    const supabase = getSupabaseAdmin()
    if (!supabase) {
      return { success: true, data: newI }
    }

    const { data, error } = await supabase
      .from("ventas_interacciones")
      .insert([payload])
      .select()
      .single()

    if (error) {
      console.warn("Supabase interaccion warning (guardado en disco):", error.message)
      return { success: true, data: newI }
    }

    await supabase
      .from("ventas_prospectos")
      .update({
        ultima_interaccion_at: new Date().toISOString(),
        temperatura: payload.termometro,
        updated_at: new Date().toISOString(),
      })
      .eq("id", payload.prospecto_id)

    return { success: true, data }
  } catch (err: any) {
    console.warn("Error en saveVentasInteraccion (usando disco):", err.message)
    return { success: true, data: newI }
  }
}

export async function deleteVentasProspecto(id: string): Promise<{ success: boolean; error?: string }> {
  const disk = loadDiskStore()
  disk.prospectos = disk.prospectos.filter((p) => p.id !== id)
  delete disk.interacciones[id]
  saveDiskStore(disk.prospectos, disk.interacciones)

  try {
    const supabase = getSupabaseAdmin()
    if (!supabase) return { success: true }

    const { error } = await supabase.from("ventas_prospectos").delete().eq("id", id)
    if (error) throw error
    return { success: true }
  } catch (err: any) {
    console.error("Error en deleteVentasProspecto:", err)
    return { success: true }
  }
}

export async function deleteVentasInteraccion(
  prospectoId: string,
  interaccionId: string
): Promise<{ success: boolean; error?: string }> {
  const disk = loadDiskStore()
  if (disk.interacciones[prospectoId]) {
    disk.interacciones[prospectoId] = disk.interacciones[prospectoId].filter(
      (i) => i.id !== interaccionId
    )
  }

  const pIdx = disk.prospectos.findIndex((p) => p.id === prospectoId)
  if (pIdx >= 0) {
    const count = (disk.interacciones[prospectoId] || []).length
    disk.prospectos[pIdx] = {
      ...disk.prospectos[pIdx],
      interacciones_count: count,
    }
  }

  saveDiskStore(disk.prospectos, disk.interacciones)

  try {
    const supabase = getSupabaseAdmin()
    if (!supabase) return { success: true }

    await supabase
      .from("ventas_interacciones")
      .delete()
      .eq("id", interaccionId)

    return { success: true }
  } catch (err: any) {
    console.error("Error en deleteVentasInteraccion:", err)
    return { success: true }
  }
}
