"use client"

import { useState } from "react"
import { 
  Lightbulb, 
  Layers, 
  Box, 
  Sparkles,
  ChevronRight
} from "lucide-react"
import { cn } from "@/lib/utils"

const SUB_SECTIONS = [
  { 
    id: "armado", 
    label: "Aplicativo de armado", 
    icon: Layers,
    description: "Configura y visualiza el ensamblaje de componentes."
  },
  { 
    id: "empaque", 
    label: "Definidor de empaque", 
    icon: Box,
    description: "Optimiza las dimensiones y materiales de embalaje."
  },
  { 
    id: "contenido", 
    label: "Creador de contenido", 
    icon: Sparkles,
    description: "Genera material visual y descriptivo para marketing."
  },
]

export default function AplicacionesPage() {
  const [activeTab, setActiveTab] = useState(SUB_SECTIONS[0].id)

  const activeSection = SUB_SECTIONS.find(s => s.id === activeTab) || SUB_SECTIONS[0]

  return (
    <div className="mx-auto w-full max-w-screen-2xl p-6 lg:p-10">
      <div className="flex flex-col gap-8">
        {/* PageHeader Area */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Lightbulb className="h-5 w-5" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-on-surface">Aplicaciones</h1>
          </div>
          <p className="text-on-surface-variant">
            Herramientas especializadas para optimizar tu flujo de trabajo B2B.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
          {/* TabMenu Area */}
          <div className="flex flex-col gap-1 rounded-2xl bg-surface-container-low p-2 lg:col-span-1 h-fit shadow-sm border border-outline-variant/10">
            {SUB_SECTIONS.map((item) => {
              const Icon = item.icon
              const isActive = activeTab === item.id
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={cn(
                    "group flex items-center justify-between rounded-xl px-4 py-3 text-sm font-medium transition-all",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 ring-1 ring-inset ring-primary"
                      : "text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={cn("h-4 w-4", isActive ? "text-primary-foreground" : "text-primary/70")} />
                    <span>{item.label}</span>
                  </div>
                  <ChevronRight className={cn("h-3 w-3 opacity-0 transition-all group-hover:opacity-100", isActive && "opacity-100")} />
                </button>
              )
            })}
          </div>

          {/* SubContent Area */}
          <div className="lg:col-span-3">
            <div className="rounded-3xl border border-outline-variant/10 bg-surface-container-low p-8 lg:p-12 shadow-sm min-h-[500px] flex flex-col items-center justify-center text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-3xl bg-primary/5 ring-1 ring-inset ring-primary/10">
                <activeSection.icon className="h-10 w-10 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-on-surface">{activeSection.label}</h2>
              <p className="mt-4 max-w-md text-on-surface-variant">
                {activeSection.description}
              </p>
              
              <div className="mt-10 grid w-full max-w-lg grid-cols-1 gap-4 text-left md:grid-cols-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="rounded-2xl border border-outline-variant/20 bg-surface-container p-4">
                    <div className="mb-2 h-2 w-12 rounded-full bg-primary/20" />
                    <div className="h-3 w-full rounded-full bg-on-surface-variant/10" />
                    <div className="mt-2 h-3 w-2/3 rounded-full bg-on-surface-variant/5" />
                  </div>
                ))}
              </div>

              <div className="mt-12 flex items-center gap-4">
                <button className="rounded-xl bg-primary px-6 py-3 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all">
                  Configurar Módulo
                </button>
                <button className="rounded-xl border border-outline-variant px-6 py-3 text-sm font-medium text-on-surface hover:bg-surface-container-high transition-all">
                  Ver Documentación
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
