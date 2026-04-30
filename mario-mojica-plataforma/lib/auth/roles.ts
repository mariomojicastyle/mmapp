export type UserRole = "superadmin" | "admin" | "designer" | "viewer"

export interface User {
  id: string
  email: string
  role: UserRole
  organization_id?: string
  name: string
  avatar?: string
  company?: string
}

export const PERMISSIONS = {
  SOLICITUDES: {
    VIEW_ALL: ["superadmin"],
    VIEW_OWN: ["admin", "designer", "viewer"],
    CREATE: ["superadmin", "admin"],
    EDIT: ["superadmin", "admin", "designer"],
    COMMENT: ["superadmin", "admin", "designer"],
    DELETE: ["superadmin"],
  },
  NOTIFICACIONES: {
    VIEW: ["superadmin", "admin", "designer", "viewer"],
  },
  PROYECTOS: {
    VIEW_ALL: ["superadmin"],
    VIEW_OWN: ["admin", "designer", "viewer"],
    MANAGE: ["superadmin", "admin"],
  },
  EQUIPO: {
    VIEW: ["superadmin", "admin"],
    MANAGE: ["superadmin", "admin"],
  },
  FACTURACION: {
    VIEW: ["superadmin", "admin"],
    MANAGE: ["superadmin", "admin"],
  },
  CONFIGURACION: {
    VIEW: ["superadmin", "admin", "designer", "viewer"],
    MANAGE: ["superadmin", "admin"],
  },
  WEB: {
    VIEW: ["superadmin", "admin", "designer", "viewer"],
    MANAGE: ["superadmin", "admin", "designer"],
  },
  PRODUCTOS: {
    VIEW: ["superadmin", "admin", "designer", "viewer"],
    MANAGE: ["superadmin", "admin"],
  },
  PORTAFOLIO: {
    VIEW: ["superadmin", "admin", "designer", "viewer"],
    MANAGE: ["superadmin", "admin"],
  },
  APLICACIONES: {
    VIEW: ["superadmin", "admin", "designer", "viewer"],
    MANAGE: ["superadmin", "admin"],
  },
  USO: {
    VIEW: ["superadmin", "admin", "designer", "viewer"],
    MANAGE: ["superadmin"],
  },
  INTEGRACIONES: {
    VIEW: ["superadmin", "admin", "designer", "viewer"],
    MANAGE: ["superadmin", "admin"],
  },
} as const
