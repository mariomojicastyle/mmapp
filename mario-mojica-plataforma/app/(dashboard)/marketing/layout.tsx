"use client"

import React, { useState, useEffect } from "react"
import { Megaphone, Calendar, BarChart2, FileText, Inbox, CheckCircle2, AlertCircle } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { usePermissions } from "@/hooks/use-permissions"
import { getMarketingCuentas } from "@/app/actions/marketing"

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { role } = usePermissions()
  const [cuentas, setCuentas] = useState<Array<{ id: string; plataforma: string; nombre_cuenta: string }>>([])

  useEffect(() => {
    async function loadCuentas() {
      const res = await getMarketingCuentas()
      if (res.data) {
        setCuentas(res.data)
      }
    }
    loadCuentas()
  }, [])

  if (role && role !== "superadmin") {
    return (
      <div className="flex h-full min-h-[400px] flex-col items-center justify-center p-12 text-center">
        <AlertCircle className="mb-4 h-12 w-12 text-error/50" />
        <h2 className="mb-2 text-xl font-bold text-on-surface">Acceso Denegado</h2>
        <p className="max-w-md text-sm text-on-surface-variant">
          El módulo de Marketing es de acceso exclusivo para el Administrador Principal (Superadmin).
        </p>
      </div>
    )
  }

  const tabs = [
    { name: "Planificación", href: "/marketing", icon: Calendar, active: true },
    { name: "Analítica", href: "/marketing/analitica", icon: BarChart2, active: false, badge: "Fase 2" },
    { name: "Reporting", href: "/marketing/reporting", icon: FileText, active: false, badge: "Fase 2" },
    { name: "Inbox", href: "/marketing/inbox", icon: Inbox, active: false, badge: "Fase 3" },
  ]

  const plataformasConectadas = new Set(cuentas.map((c) => c.plataforma))

  return (
    <div className="space-y-6 p-6 h-full pb-12">
      {/* Header del Módulo */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-outline-variant/20 pb-5">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/15 text-primary">
            <Megaphone className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-on-surface">Marketing & Redes Sociales</h1>
            <p className="text-sm text-on-surface-variant">
              Planificación, automatización y análisis de contenidos multicanal B2B.
            </p>
          </div>
        </div>

        {/* Conexiones Rápidas de Redes */}
        <div className="flex items-center gap-2 bg-surface-container px-3 py-2 rounded-xl border border-outline-variant/20">
          <span className="text-xs font-semibold text-on-surface-variant mr-1">Cuentas:</span>

          <Link
            href="/api/auth/linkedin"
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
              plataformasConectadas.has("linkedin")
                ? "bg-primary/15 text-primary border border-primary/30"
                : "bg-surface-container-high text-on-surface-variant hover:bg-primary/10 hover:text-primary"
            }`}
            title="Conectar LinkedIn"
          >
            LinkedIn {plataformasConectadas.has("linkedin") && <CheckCircle2 className="h-3 w-3" />}
          </Link>

          <Link
            href="/api/auth/facebook"
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
              plataformasConectadas.has("facebook") || plataformasConectadas.has("instagram")
                ? "bg-primary/15 text-primary border border-primary/30"
                : "bg-surface-container-high text-on-surface-variant hover:bg-primary/10 hover:text-primary"
            }`}
            title="Conectar Meta (FB/IG)"
          >
            Meta (IG/FB) {(plataformasConectadas.has("facebook") || plataformasConectadas.has("instagram")) && <CheckCircle2 className="h-3 w-3" />}
          </Link>

          <Link
            href="/api/auth/google"
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
              plataformasConectadas.has("google_drive") || plataformasConectadas.has("youtube")
                ? "bg-primary/15 text-primary border border-primary/30"
                : "bg-surface-container-high text-on-surface-variant hover:bg-primary/10 hover:text-primary"
            }`}
            title="Conectar Google Drive & YouTube"
          >
            Drive / YT {(plataformasConectadas.has("google_drive") || plataformasConectadas.has("youtube")) && <CheckCircle2 className="h-3 w-3" />}
          </Link>
        </div>
      </div>

      {/* Sub-navegación por Pestañas */}
      <div className="flex border-b border-outline-variant/20 gap-2">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isSelected = pathname === tab.href || (tab.href === "/marketing" && pathname === "/marketing")

          return (
            <Link
              key={tab.name}
              href={tab.active ? tab.href : "#"}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all ${
                isSelected
                  ? "border-primary text-primary bg-primary/5 rounded-t-lg"
                  : "border-transparent text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high/40 rounded-t-lg"
              } ${!tab.active ? "opacity-50 cursor-not-allowed" : ""}`}
              onClick={(e) => !tab.active && e.preventDefault()}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.name}</span>
              {tab.badge && (
                <span className="ml-1.5 rounded-full bg-surface-container-highest px-2 py-0.5 text-[10px] font-semibold text-on-surface-variant">
                  {tab.badge}
                </span>
              )}
            </Link>
          )
        })}
      </div>

      {/* Contenido Principal */}
      <div className="flex-1">{children}</div>
    </div>
  )
}
