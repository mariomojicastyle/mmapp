import { BarChart3, TrendingUp, Eye, Clock } from "lucide-react"

const stats = [
  { label: "Proyectos Activos", value: "12", change: "+3", icon: BarChart3 },
  { label: "Renders Generados", value: "284", change: "+42", icon: TrendingUp },
  { label: "Visitas al Portafolio", value: "1,847", change: "+18%", icon: Eye },
  { label: "Horas de Compute", value: "56.3h", change: "+8.2h", icon: Clock },
]

const usageHistory = [
  { month: "Ene", renders: 32, compute: 8.1, storage: 2.4 },
  { month: "Feb", renders: 45, compute: 11.2, storage: 3.1 },
  { month: "Mar", renders: 68, compute: 15.7, storage: 4.8 },
  { month: "Abr", renders: 42, compute: 10.3, storage: 5.2 },
]

export default function UsoPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-on-surface">Uso</h1>
        <p className="mt-1 text-sm text-on-surface-variant">
          Monitorea el consumo de recursos y métricas de tu plataforma.
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <div key={stat.label} className="rounded-xl bg-surface-container p-5">
              <div className="mb-3 flex items-center justify-between">
                <Icon className="h-5 w-5 text-on-surface-variant" />
                <span className="text-xs font-medium text-success">{stat.change}</span>
              </div>
              <p className="text-2xl font-semibold text-on-surface">{stat.value}</p>
              <p className="mt-1 text-xs text-on-surface-variant">{stat.label}</p>
            </div>
          )
        })}
      </div>

      {/* Usage table */}
      <div className="rounded-xl bg-surface-container">
        <div className="border-b border-outline-variant/20 px-5 py-3">
          <h2 className="text-sm font-semibold text-on-surface">Historial de uso mensual</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-outline-variant/20">
                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-on-surface-variant">Mes</th>
                <th className="px-5 py-3 text-right text-xs font-medium uppercase tracking-wider text-on-surface-variant">Renders</th>
                <th className="px-5 py-3 text-right text-xs font-medium uppercase tracking-wider text-on-surface-variant">Compute (h)</th>
                <th className="px-5 py-3 text-right text-xs font-medium uppercase tracking-wider text-on-surface-variant">Storage (GB)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20">
              {usageHistory.map((row) => (
                <tr key={row.month} className="transition-colors hover:bg-surface-container-high/50">
                  <td className="px-5 py-3 text-sm font-medium text-on-surface">{row.month} 2026</td>
                  <td className="px-5 py-3 text-right text-sm text-on-surface">{row.renders}</td>
                  <td className="px-5 py-3 text-right text-sm text-on-surface">{row.compute}</td>
                  <td className="px-5 py-3 text-right text-sm text-on-surface">{row.storage}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
