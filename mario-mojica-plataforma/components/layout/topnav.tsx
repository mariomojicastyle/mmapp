"use client"

import { usePathname } from "next/navigation"
import { Search, MessageSquare, HelpCircle, User as UserIcon } from "lucide-react"
import { useAuth } from "@/lib/auth/auth-context"

export function TopNav() {
  const { user } = useAuth()
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-50 flex h-16 w-full items-center justify-between border-b border-outline-variant bg-surface/80 backdrop-blur-xl">
      {/* ⬅️ Franja Izquierda */}
      <div className="flex h-full items-center gap-4">
        {/* 1. Logosimbolo Aligned with Sidebar Icons */}
        <div className="flex h-full w-[52px] items-center justify-center border-r border-outline-variant/30 shrink-0">
          <img src="/Logosimbolo.svg" alt="Logo" className="h-[18px] w-[18px]" />
        </div>

        {/* Breadcrumbs Path */}
        <div className="flex items-center gap-3 text-on-surface-variant px-2">
          <span className="text-sm font-semibold text-on-surface">Mario Mojica</span>
          
          <span className="text-outline-variant">/</span>
          
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium capitalize">
              {pathname.split('/').filter(Boolean).pop()?.replace(/-/g, ' ') || 'Dashboard'}
            </span>
          </div>
        </div>

        {/* Separador */}
        <div className="mx-2 h-4 w-px bg-outline-variant/50"></div>

        {/* 2. Nombre del usuario (Opcional si ya está en breadcrumbs, pero el usuario lo pidió) */}
        <div className="flex items-center gap-2 text-on-surface-variant hover:text-on-surface transition-colors cursor-default">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-surface-container-highest">
            <UserIcon className="h-3.5 w-3.5" />
          </div>
          <span className="text-xs font-medium">
            {user?.name || "Cargando..."}
          </span>
        </div>

        {/* 3. Créditos */}
        <div className="flex items-center gap-2 rounded-full border border-outline-variant/20 bg-surface-container-low px-3 py-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant/70">Créditos</span>
          <div className="flex h-6 min-w-[24px] items-center justify-center rounded-full bg-primary px-2 text-[11px] font-black text-primary-foreground shadow-sm shadow-primary/30">
            {(user?.credits ?? 0).toLocaleString()}
          </div>
        </div>
      </div>

      {/* ➡️ Franja Derecha */}
      <div className="flex items-center gap-4 pr-[17px]">
        {/* 5. Feedback */}
        <button className="group flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-semibold text-primary transition-all hover:bg-primary hover:text-primary-foreground hover:shadow-lg hover:shadow-primary/20">
          <MessageSquare className="h-4 w-4 transition-transform group-hover:scale-110" />
          <span>Feedback</span>
        </button>

        {/* Separador vertical */}
        <div className="h-4 w-px bg-outline-variant/30"></div>

        {/* 6. Búsqueda */}
        <div className="relative hidden items-center lg:flex">
          <Search className="absolute left-3 h-3.5 w-3.5 text-on-surface-variant" />
          <input 
            type="text" 
            placeholder="Buscar..." 
            className="h-9 w-48 rounded-xl border border-outline-variant/30 bg-surface-container-lowest pl-9 pr-12 text-sm text-on-surface focus:w-64 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all"
          />
          <div className="absolute right-2 flex items-center rounded bg-surface-container-high px-1.5 py-0.5 text-[9px] font-bold text-on-surface-variant">
            ⌘ K
          </div>
        </div>

        {/* 7. Ayuda */}
        <button className="flex h-9 w-9 items-center justify-center rounded-xl border border-outline-variant/30 text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface" title="Centro de Ayuda">
          <HelpCircle className="h-4 w-4" />
        </button>

        {/* 8. Cargar Créditos */}
        <button className="hidden h-9 items-center justify-center rounded-xl bg-surface-container-highest px-4 text-xs font-bold text-on-surface transition-all hover:bg-primary hover:text-primary-foreground md:flex">
          Cargar Créditos
        </button>

        {/* 9. Perfil / Logout */}
        <button className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 ring-1 ring-primary/20 text-xs font-black text-primary transition-all hover:ring-2 hover:ring-primary/50">
          {user?.name ? user.name.substring(0, 2).toUpperCase() : "MM"}
        </button>
      </div>
    </header>
  )
}

