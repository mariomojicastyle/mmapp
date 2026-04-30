"use client"

import { usePathname } from "next/navigation"
import { navigationSections } from "@/lib/navigation"
import { Bell, Search } from "lucide-react"
import { NotificationBell } from "./notification-bell"

export function TopNav() {
  const pathname = usePathname()

  // Find current page name from navigation config
  const currentPage = navigationSections
    .flatMap((s) => s.items)
    .find((item) => pathname === item.href || pathname.startsWith(item.href + "/"))

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-outline-variant/20 bg-surface/80 px-6 backdrop-blur-xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <span className="text-on-surface-variant">Mario Mojica Platform</span>
        {currentPage && (
          <>
            <span className="text-on-surface-variant">/</span>
            <span className="font-medium text-on-surface">{currentPage.name}</span>
          </>
        )}
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-3">
        {/* Search */}
        <button className="flex h-9 w-9 items-center justify-center rounded-lg text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface">
          <Search className="h-[18px] w-[18px]" />
        </button>

        {/* Notifications */}
        <NotificationBell />

        {/* User avatar */}
        <button className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
          MM
        </button>
      </div>
    </header>
  )
}
