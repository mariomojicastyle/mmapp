import { Puzzle, ExternalLink } from "lucide-react"

const integrations = [
  { name: "Supabase", desc: "Base de datos y autenticación", status: "connected", icon: "🟢" },
  { name: "n8n", desc: "Automatización de flujos", status: "connected", icon: "🔄" },
  { name: "Baserow", desc: "Gestión de datos de leads", status: "connected", icon: "📊" },
  { name: "Rhino Compute", desc: "Procesamiento 3D headless", status: "setup", icon: "🦏" },
  { name: "Netlify", desc: "Despliegue de sitios", status: "connected", icon: "🚀" },
  { name: "Google Analytics", desc: "Métricas y análisis web", status: "disconnected", icon: "📈" },
  { name: "Stripe", desc: "Procesamiento de pagos", status: "disconnected", icon: "💳" },
  { name: "Slack", desc: "Notificaciones del equipo", status: "disconnected", icon: "💬" },
]

function getStatusBadge(status: string) {
  switch (status) {
    case "connected": return { text: "Conectado", cls: "bg-success/20 text-success" }
    case "setup": return { text: "Configurando", cls: "bg-tertiary/20 text-tertiary" }
    default: return { text: "Desconectado", cls: "bg-on-surface-variant/20 text-on-surface-variant" }
  }
}

export default function IntegracionesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-on-surface">Integraciones</h1>
        <p className="mt-1 text-sm text-on-surface-variant">
          Conecta servicios externos para potenciar tu flujo de trabajo.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {integrations.map((int) => {
          const badge = getStatusBadge(int.status)
          return (
            <div key={int.name} className="group cursor-pointer rounded-xl bg-surface-container p-5 transition-colors hover:bg-surface-container-high">
              <div className="mb-3 flex items-start justify-between">
                <span className="text-2xl">{int.icon}</span>
                <span className={`rounded-full px-2 py-0.5 text-[0.625rem] font-medium ${badge.cls}`}>
                  {badge.text}
                </span>
              </div>
              <h3 className="text-sm font-semibold text-on-surface">{int.name}</h3>
              <p className="mt-1 text-xs text-on-surface-variant">{int.desc}</p>
              <button className="mt-4 flex items-center gap-1 text-xs font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
                Configurar <ExternalLink className="h-3 w-3" />
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
