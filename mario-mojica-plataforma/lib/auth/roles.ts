export type UserRole = "superadmin" | "coequipero" | "admin" | "designer" | "viewer"

export interface User {
  id: string
  email: string
  role: UserRole
  organization_id?: string
  name: string
  avatar?: string
  company?: string
  credits?: number
}

export const PERMISSIONS = {
  SOLICITUDES: {
    VIEW_ALL: ["superadmin"],
    VIEW_OWN: ["coequipero", "admin", "designer", "viewer"],
    CREATE: ["superadmin", "admin"],
    EDIT: ["superadmin", "coequipero", "admin", "designer"],
    COMMENT: ["superadmin", "coequipero", "admin", "designer"],
    DELETE: ["superadmin"],
  },
  NOTIFICACIONES: {
    VIEW: ["superadmin", "coequipero", "admin", "designer", "viewer"],
  },
  PROYECTOS: {
    VIEW_ALL: ["superadmin"],
    VIEW_OWN: ["coequipero", "admin", "designer", "viewer"],
    MANAGE: ["superadmin", "admin"],
  },
  EQUIPO: {
    VIEW: ["superadmin", "coequipero", "admin"],
    MANAGE: ["superadmin", "admin"],
  },
  FACTURACION: {
    VIEW: ["superadmin", "admin"],
    MANAGE: ["superadmin", "admin"],
  },
  CONFIGURACION: {
    VIEW: ["superadmin", "coequipero", "admin", "designer", "viewer"],
    MANAGE: ["superadmin", "admin"],
  },
  WEB: {
    VIEW: ["superadmin", "coequipero", "admin", "designer", "viewer"],
    MANAGE: ["superadmin", "coequipero", "admin", "designer"],
  },
  PRODUCTOS: {
    VIEW: ["superadmin", "coequipero", "admin", "designer", "viewer"],
    MANAGE: ["superadmin", "admin"],
  },
  PORTAFOLIO: {
    VIEW: ["superadmin", "coequipero", "admin", "designer", "viewer"],
    MANAGE: ["superadmin", "admin"],
  },
  APLICACIONES: {
    VIEW: ["superadmin", "coequipero", "admin", "designer", "viewer"],
    MANAGE: ["superadmin", "admin"],
  },
  USO: {
    VIEW: ["superadmin", "coequipero", "admin", "designer", "viewer"],
    MANAGE: ["superadmin"],
  },
  INTEGRACIONES: {
    VIEW: ["superadmin", "coequipero", "admin", "designer", "viewer"],
    MANAGE: ["superadmin", "admin"],
  },
} as const
