"use client"

import { useAuth } from "@/lib/auth/auth-context"
import { PERMISSIONS, UserRole } from "@/lib/auth/roles"

export function usePermissions() {
  const { user } = useAuth()
  
  const hasPermission = (allowedRoles: readonly UserRole[]) => {
    if (!user) return false
    return allowedRoles.includes(user.role)
  }

  const canViewSection = (section: keyof typeof PERMISSIONS) => {
    if (!user) return false
    
    // Si la sección tiene VIEW_ALL o VIEW_OWN, comprobamos si el rol está en alguno
    const perms = (PERMISSIONS as any)[section]
    if (!perms) {
      console.warn(`Permission key not found: ${section}`)
      return true // Por defecto permitir si no está definido para no bloquear el dev
    }
    
    const allowed = [...(perms.VIEW_ALL || []), ...(perms.VIEW_OWN || []), ...(perms.VIEW || [])]
    
    return allowed.includes(user.role)
  }

  return {
    user,
    role: user?.role,
    hasPermission,
    canViewSection,
    isSuperAdmin: user?.role === "superadmin",
    isAdmin: user?.role === "admin",
    isDesigner: user?.role === "designer",
    isViewer: user?.role === "viewer",
  }
}
