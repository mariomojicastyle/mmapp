import { Folder, Plus, Search } from "lucide-react"

const projects = [
  { name: "Residencia Valle Verde", status: "En progreso", date: "15 Abr 2026", progress: 65 },
  { name: "Oficinas Corporativas TechHub", status: "En revisión", date: "10 Abr 2026", progress: 90 },
  { name: "Loft Urbano Centro", status: "Completado", date: "28 Mar 2026", progress: 100 },
  { name: "Casa de Playa Barú", status: "En progreso", date: "20 Mar 2026", progress: 40 },
  { name: "Showroom Mobiliario Premium", status: "Nuevo", date: "18 Mar 2026", progress: 10 },
  { name: "Apartamento Penthouse 360°", status: "En progreso", date: "05 Mar 2026", progress: 55 },
]

function getStatusColor(status: string) {
  switch (status) {
    case "Completado": return "bg-success/20 text-success"
    case "En revisión": return "bg-tertiary/20 text-tertiary"
    case "En progreso": return "bg-primary/20 text-primary"
    default: return "bg-on-surface-variant/20 text-on-surface-variant"
  }
}

export default function ProyectosPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-on-surface">Proyectos</h1>
          <p className="mt-1 text-sm text-on-surface-variant">
            Gestiona y visualiza todos tus proyectos de diseño y arquitectura.
          </p>
        </div>
        <button className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90">
          <Plus className="h-4 w-4" />
          Nuevo Proyecto
        </button>
      </div>

      {/* Search and filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant" />
          <input
            type="text"
            placeholder="Buscar proyectos..."
            className="h-10 w-full rounded-lg bg-surface-container pl-10 pr-4 text-sm text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <select className="h-10 rounded-lg bg-surface-container px-4 text-sm text-on-surface-variant focus:outline-none">
          <option>Todos los estados</option>
          <option>En progreso</option>
          <option>En revisión</option>
          <option>Completado</option>
        </select>
      </div>

      {/* Project grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {projects.map((project) => (
          <div
            key={project.name}
            className="group cursor-pointer rounded-xl bg-surface-container p-5 transition-colors hover:bg-surface-container-high"
          >
            {/* Card header */}
            <div className="mb-4 flex items-start justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Folder className="h-5 w-5 text-primary" />
              </div>
              <span className={`rounded-full px-2.5 py-1 text-[0.6875rem] font-medium ${getStatusColor(project.status)}`}>
                {project.status}
              </span>
            </div>

            {/* Card content */}
            <h3 className="mb-1 text-sm font-semibold text-on-surface group-hover:text-primary transition-colors">
              {project.name}
            </h3>
            <p className="text-xs text-on-surface-variant">{project.date}</p>

            {/* Progress bar */}
            <div className="mt-4">
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="text-on-surface-variant">Progreso</span>
                <span className="font-medium text-on-surface">{project.progress}%</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-outline-variant/30">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${project.progress}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
