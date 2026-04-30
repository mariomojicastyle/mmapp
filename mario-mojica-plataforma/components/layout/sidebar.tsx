"use client"

import React, { useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { LogOut } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { navigationSections } from "@/lib/navigation"
import { cn } from "@/lib/utils"
import { usePermissions } from "@/hooks/use-permissions"
import { useAuth } from "@/lib/auth/auth-context"
import { UserRole } from "@/lib/auth/roles"

const COLLAPSED_W = "w-[52px]"
const EXPANDED_W = "w-56"

export function Sidebar() {
  const pathname = usePathname()
  const { canViewSection } = usePermissions()
  const [expanded, setExpanded] = useState(false)

  return (
    <aside
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
      className={cn(
        "fixed left-0 top-0 z-40 flex h-screen flex-col bg-sidebar-bg border-r border-outline-variant/30 transition-all duration-200 ease-out",
        expanded ? EXPANDED_W : COLLAPSED_W
      )}
    >
      {/* Brand */}
      <div className="flex h-14 items-center justify-center px-2.5 shrink-0">
        <Link href="/solicitudes" className="flex items-center gap-2.5 overflow-hidden">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary">
            <span className="text-sm font-bold text-primary-foreground">MM</span>
          </div>
          <span className={cn(
            "text-sm font-semibold text-on-surface whitespace-nowrap transition-opacity duration-200",
            expanded ? "opacity-100" : "opacity-0"
          )}>
            Mario Mojica
          </span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden px-2 pb-4">
        {navigationSections.map((section, sectionIdx) => {
          const visibleItems = section.items.filter(item => {
            const permissionKey = item.name
              .toUpperCase()
              .normalize("NFD")
              .replace(/[\u0300-\u036f]/g, "") as any
            return canViewSection(permissionKey)
          })

          if (visibleItems.length === 0) return null

          return (
            <div key={section.label}>
              {sectionIdx > 0 && (
                <div className="mx-1 my-2 border-t" style={{ borderColor: "var(--sidebar-divider)" }} />
              )}

              {/* Section header — only visible when expanded */}
              <p className={cn(
                "mb-1 px-2 pt-2 text-[0.6rem] font-medium uppercase tracking-[0.08em] text-sidebar-header whitespace-nowrap transition-opacity duration-200",
                expanded ? "opacity-100" : "opacity-0 h-0 overflow-hidden mb-0 pt-0"
              )}>
                {section.label}
              </p>

              <ul className="space-y-0.5">
                {visibleItems.map((item) => {
                  const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
                  const Icon = item.icon

                  return (
                    <li key={item.href} className="relative group/item">
                      <Link
                        href={item.href}
                        className={cn(
                          "flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                          expanded ? "gap-3" : "justify-center",
                          isActive
                            ? "bg-sidebar-active-bg text-sidebar-active-text"
                            : "text-sidebar-text hover:bg-sidebar-active-bg/50 hover:text-on-surface"
                        )}
                      >
                        <Icon className="h-[18px] w-[18px] shrink-0" />
                        <span className={cn(
                          "whitespace-nowrap transition-opacity duration-200",
                          expanded ? "opacity-100" : "opacity-0 w-0 overflow-hidden"
                        )}>
                          {item.name}
                        </span>
                      </Link>

                      {/* Tooltip when collapsed */}
                      {!expanded && (
                        <div className="pointer-events-none absolute left-full top-1/2 z-50 ml-2 -translate-y-1/2 rounded-md bg-surface-container-highest px-2.5 py-1.5 text-xs font-medium text-on-surface shadow-lg opacity-0 transition-opacity group-hover/item:opacity-100">
                          {item.name}
                        </div>
                      )}
                    </li>
                  )
                })}
              </ul>
            </div>
          )
        })}
      </nav>

      {/* Bottom: Role Selector */}
      <div className="border-t px-2 py-2 shrink-0" style={{ borderColor: "var(--sidebar-divider)" }}>
        <RoleSelector expanded={expanded} />
      </div>
    </aside>
  )
}

function RoleSelector({ expanded }: { expanded: boolean }) {
  const { user, setRole, originalRole } = useAuth()
  const [isOpen, setIsOpen] = useState(false)

  const router = useRouter()

  if (!user) return null

  const roles: { id: UserRole; label: string }[] = [
    { id: "superadmin", label: "SuperAdmin" },
    { id: "admin", label: "Admin Cliente" },
    { id: "designer", label: "Diseñador" },
    { id: "viewer", label: "Lector" },
  ]

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/login")
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex w-full items-center rounded-lg px-3 py-2 text-sm font-medium text-sidebar-text transition-colors hover:bg-sidebar-active-bg/50 hover:text-on-surface cursor-pointer",
          expanded ? "gap-3" : "justify-center"
        )}
      >
        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-primary/20 text-[10px] font-bold text-primary">
          {(user?.role?.[0] || 'V').toUpperCase()}
        </div>
        {expanded && (
          <div className="flex flex-1 flex-col items-start overflow-hidden">
            <span className="text-xs font-semibold text-on-surface truncate w-full">{user?.name || 'Usuario'}</span>
            <span className="text-[10px] text-sidebar-text leading-none">{user?.role || 'viewer'}</span>
          </div>
        )}
        {expanded && (
          <svg className={cn("h-4 w-4 shrink-0 transition-transform", isOpen && "rotate-180")} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="m6 9 6 6 6-6" />
          </svg>
        )}
      </button>

      {isOpen && expanded && (
        <div className="absolute bottom-full left-0 mb-2 w-full rounded-xl border border-outline-variant bg-surface-container-high p-1 shadow-xl shadow-black/20 backdrop-blur-md">
          {originalRole === "superadmin" && (
            <>
              {roles.map((r) => (
                <button
                  key={r.id}
                  onClick={() => { setRole(r.id); setIsOpen(false) }}
                  className={cn(
                    "flex w-full items-center px-3 py-2 text-xs font-medium rounded-lg transition-colors",
                    user.role === r.id
                      ? "bg-primary text-primary-foreground"
                      : "text-on-surface hover:bg-surface-container-highest"
                  )}
                >
                  {r.label}
                </button>
              ))}
              <div className="my-1 h-px w-full bg-outline-variant/50" />
            </>
          )}
          
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-2 px-3 py-2 text-xs font-medium rounded-lg text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <LogOut className="h-3.5 w-3.5" />
            Cerrar sesión
          </button>
        </div>
      )}
    </div>
  )
}
