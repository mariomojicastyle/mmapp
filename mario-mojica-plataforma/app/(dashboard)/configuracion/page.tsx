import { Settings, User, Bell, Shield, Globe } from "lucide-react"

export default function ConfiguracionPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-on-surface">Configuración</h1>
        <p className="mt-1 text-sm text-on-surface-variant">
          Ajusta las preferencias de tu cuenta y plataforma.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Settings navigation */}
        <div className="rounded-xl bg-surface-container p-2">
          {[
            { icon: User, label: "Perfil", active: true },
            { icon: Bell, label: "Notificaciones", active: false },
            { icon: Shield, label: "Seguridad", active: false },
            { icon: Globe, label: "Idioma y región", active: false },
            { icon: Settings, label: "Avanzado", active: false },
          ].map((item) => {
            const Icon = item.icon
            return (
              <button
                key={item.label}
                className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
                  item.active
                    ? "bg-sidebar-active-bg text-sidebar-active-text"
                    : "text-on-surface-variant hover:bg-surface-container-high"
                }`}
              >
                <Icon className="h-[18px] w-[18px]" />
                {item.label}
              </button>
            )
          })}
        </div>

        {/* Settings form */}
        <div className="col-span-2 space-y-6">
          <div className="rounded-xl bg-surface-container p-6">
            <h2 className="mb-4 text-sm font-semibold text-on-surface">Información Personal</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-on-surface-variant">Nombre</label>
                <input
                  type="text"
                  defaultValue="Mario"
                  className="h-10 w-full rounded-lg bg-surface px-3 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-on-surface-variant">Apellido</label>
                <input
                  type="text"
                  defaultValue="Mojica"
                  className="h-10 w-full rounded-lg bg-surface px-3 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div className="col-span-2">
                <label className="mb-1.5 block text-xs font-medium text-on-surface-variant">Email</label>
                <input
                  type="email"
                  defaultValue="mario@mariomojica.com"
                  className="h-10 w-full rounded-lg bg-surface px-3 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div className="col-span-2">
                <label className="mb-1.5 block text-xs font-medium text-on-surface-variant">Empresa</label>
                <input
                  type="text"
                  defaultValue="Mario Mojica Studio"
                  className="h-10 w-full rounded-lg bg-surface px-3 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <button className="rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90">
                Guardar Cambios
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
