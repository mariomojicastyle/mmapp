import { UserRole } from "./roles"

// ── Tipos para la vista SuperAdmin (Kanban) ──
export type TicketStatus = "backlog" | "todo" | "in_progress" | "waiting_client" | "review" | "done"
export type TicketPriority = "low" | "medium" | "high" | "urgent"

export interface Ticket {
  id: string
  title: string
  description: string
  status: TicketStatus
  priority: TicketPriority
  client_id: string
  client_name: string
  created_at: string
  updated_at: string
  assigned_to?: string
  assigned_to_id?: string
  due_date?: string
  adjuntos?: string[]
  tipo_solicitud?: string
  estado_entrega?: 'pendiente' | 'propuesta_equipo' | 'confirmada'
  fecha_equipo?: string
}

// ── Tipos para la vista Cliente (Admin/Diseñador/Lector) ──
export type SolicitudEstado = 
  | "Nueva" 
  | "En progreso" 
  | "Esperando cliente" 
  | "En revisión" 
  | "Resuelta"

export type TipoSolicitud = 
  | "BTB"
  | "BTC"
  | "Genérica"

export interface Solicitud {
  id: string              // Formato: 00001, 00002, etc.
  titulo: string
  descripcion: string
  fecha_solicitud: string
  fecha_sugerida_entrega: string
  adjuntos: string[]      // nombres de archivos adjuntos
  tipo_solicitud: TipoSolicitud
  estado: SolicitudEstado
  assigned_to?: string
  assigned_to_id?: string
  estado_entrega?: 'pendiente' | 'propuesta_equipo' | 'confirmada'
  fecha_equipo?: string
}

// ── Mock data: Vista SuperAdmin ──
export const MOCK_TICKETS: Ticket[] = [
  {
    id: "T-1001",
    title: "Rediseño de Landing Page",
    description: "Actualizar los colores y tipografía según el nuevo manual de marca.",
    status: "in_progress",
    priority: "high",
    client_id: "org_1",
    client_name: "TechFlow Solutions",
    created_at: "2024-04-20T10:00:00Z",
    updated_at: "2024-04-25T14:30:00Z",
    assigned_to: "Mario Mojica",
  },
  {
    id: "T-1002",
    title: "Optimización SEO Mensual",
    description: "Revisión de keywords y meta tags para el blog.",
    status: "todo",
    priority: "medium",
    client_id: "org_2",
    client_name: "EcoMarket",
    created_at: "2024-04-22T09:15:00Z",
    updated_at: "2024-04-22T09:15:00Z",
  },
  {
    id: "T-1003",
    title: "Bug en Pasarela de Pagos",
    description: "Error 500 al intentar pagar con tarjeta de crédito extranjera.",
    status: "review",
    priority: "urgent",
    client_id: "org_1",
    client_name: "TechFlow Solutions",
    created_at: "2024-04-24T16:45:00Z",
    updated_at: "2024-04-25T11:20:00Z",
    assigned_to: "Equipo Backend",
  },
  {
    id: "T-1004",
    title: "Nuevas Ilustraciones para Social Media",
    description: "Set de 5 ilustraciones para la campaña de Mayo.",
    status: "done",
    priority: "low",
    client_id: "org_3",
    client_name: "SkyHigh Real Estate",
    created_at: "2024-04-15T11:00:00Z",
    updated_at: "2024-04-19T17:00:00Z",
    assigned_to: "Diseño Team",
  },
  {
    id: "T-1005",
    title: "Migración de Base de Datos",
    description: "Pasar de MySQL a PostgreSQL para mejorar escalabilidad.",
    status: "backlog",
    priority: "medium",
    client_id: "org_1",
    client_name: "TechFlow Solutions",
    created_at: "2024-04-28T14:00:00Z",
    updated_at: "2024-04-28T14:00:00Z",
  }
]

// ── Mock data: Vista Cliente ──
export const MOCK_SOLICITUDES: Solicitud[] = [
  {
    id: "00001",
    titulo: "Configurador 3D Mesa Extensible",
    descripcion: "Necesitamos un configurador 3D para la nueva línea de mesas extensibles. Debe permitir cambiar acabados, dimensiones y visualizar en tiempo real.",
    fecha_solicitud: "2025-04-20",
    fecha_sugerida_entrega: "2025-05-15",
    adjuntos: ["brief_mesa.pdf", "referencia_3d.jpg"],
    tipo_solicitud: "Codificación y desarrollo",
    estado: "En progreso",
  },
  {
    id: "00002",
    titulo: "Actualización de precios catálogo web",
    descripcion: "Actualizar la tabla de precios del catálogo online con los valores del segundo trimestre 2025.",
    fecha_solicitud: "2025-04-22",
    fecha_sugerida_entrega: "2025-04-28",
    adjuntos: ["precios_Q2_2025.xlsx"],
    tipo_solicitud: "BTC",
    estado: "Resuelta",
  },
  {
    id: "00003",
    titulo: "Render 360° Cocina Modular",
    descripcion: "Generar render 360° interactivo de la cocina modular modelo KM-200 para la feria de Milán.",
    fecha_solicitud: "2025-04-23",
    fecha_sugerida_entrega: "2025-05-10",
    adjuntos: ["planos_KM200.dwg", "materiales.zip"],
    tipo_solicitud: "Genérica",
    estado: "Esperando cliente",
  },
  {
    id: "00004",
    titulo: "Cotización rediseño app móvil",
    descripcion: "Solicito cotización para rediseñar la app móvil del equipo de ventas. Incluir módulo de pedidos.",
    fecha_solicitud: "2025-04-25",
    fecha_sugerida_entrega: "2025-05-05",
    adjuntos: [],
    tipo_solicitud: "BTB",
    estado: "Nueva",
  },
  {
    id: "00005",
    titulo: "Plugin Grasshopper Panel Solar",
    descripcion: "Desarrollar plugin de Grasshopper para calcular la disposición óptima de paneles solares en cubiertas.",
    fecha_solicitud: "2025-04-26",
    fecha_sugerida_entrega: "2025-06-01",
    adjuntos: ["especificaciones_tecnicas.pdf"],
    tipo_solicitud: "BTB",
    estado: "En revisión",
  },
  {
    id: "00006",
    titulo: "Soporte con error en visualizador web",
    descripcion: "El visualizador 3D de la estantería no carga en Safari. Adjunto captura del error.",
    fecha_solicitud: "2025-04-27",
    fecha_sugerida_entrega: "2025-04-30",
    adjuntos: ["error_safari.png"],
    tipo_solicitud: "BTC",
    estado: "En progreso",
  },
  {
    id: "00007",
    titulo: "Diseño catálogo digital temporada otoño",
    descripcion: "Diseñar catálogo digital interactivo para la colección de otoño 2025. 24 páginas aproximadamente.",
    fecha_solicitud: "2025-04-28",
    fecha_sugerida_entrega: "2025-05-20",
    adjuntos: ["fotos_productos.zip", "guidelines_marca.pdf"],
    tipo_solicitud: "Genérica",
    estado: "Nueva",
  },
]

export const TIPOS_SOLICITUD: TipoSolicitud[] = [
  "BTB",
  "BTC",
  "Genérica",
]
