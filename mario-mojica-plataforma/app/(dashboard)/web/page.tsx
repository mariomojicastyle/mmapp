import { Globe } from "lucide-react"

export default function WebPage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-surface-container">
        <Globe className="h-10 w-10 text-on-surface-variant/40" />
      </div>
      <h1 className="text-2xl font-semibold text-on-surface">Web</h1>
      <p className="mt-2 max-w-md text-sm text-on-surface-variant">
        El contenido de esta sección se definirá próximamente.
      </p>
    </div>
  )
}
