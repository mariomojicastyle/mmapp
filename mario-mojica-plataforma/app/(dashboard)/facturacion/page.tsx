import { Receipt, Download, CreditCard } from "lucide-react"

const invoices = [
  { id: "INV-2026-004", date: "01 Abr 2026", amount: "$480.00", status: "Pagada" },
  { id: "INV-2026-003", date: "01 Mar 2026", amount: "$520.00", status: "Pagada" },
  { id: "INV-2026-002", date: "01 Feb 2026", amount: "$390.00", status: "Pagada" },
  { id: "INV-2026-001", date: "01 Ene 2026", amount: "$450.00", status: "Pagada" },
]

export default function FacturacionPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-on-surface">Facturación</h1>
        <p className="mt-1 text-sm text-on-surface-variant">
          Gestiona tu plan, métodos de pago y consulta el historial de facturas.
        </p>
      </div>

      {/* Current plan */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="col-span-2 rounded-xl bg-surface-container p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-on-surface-variant">Plan actual</p>
              <h2 className="mt-1 text-2xl font-semibold text-on-surface">Profesional</h2>
              <p className="mt-2 text-sm text-on-surface-variant">Incluye 100 renders/mes, 50h de compute, 10GB storage</p>
            </div>
            <button className="rounded-lg border border-primary/30 px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/10">
              Cambiar Plan
            </button>
          </div>
        </div>
        <div className="rounded-xl bg-surface-container p-6">
          <p className="text-xs font-medium uppercase tracking-wider text-on-surface-variant">Próximo cobro</p>
          <p className="mt-2 text-3xl font-semibold text-on-surface">$480<span className="text-base font-normal text-on-surface-variant">/mes</span></p>
          <p className="mt-2 text-xs text-on-surface-variant">01 May 2026</p>
          <div className="mt-3 flex items-center gap-2 text-xs text-on-surface-variant">
            <CreditCard className="h-3.5 w-3.5" />
            •••• 4242
          </div>
        </div>
      </div>

      {/* Invoice history */}
      <div className="rounded-xl bg-surface-container">
        <div className="border-b border-outline-variant/20 px-5 py-3">
          <h2 className="text-sm font-semibold text-on-surface">Historial de facturas</h2>
        </div>
        <div className="divide-y divide-outline-variant/20">
          {invoices.map((inv) => (
            <div key={inv.id} className="flex items-center justify-between px-5 py-4 transition-colors hover:bg-surface-container-high/50">
              <div className="flex items-center gap-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                  <Receipt className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-on-surface">{inv.id}</p>
                  <p className="text-xs text-on-surface-variant">{inv.date}</p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <span className="text-sm font-semibold text-on-surface">{inv.amount}</span>
                <span className="rounded-full bg-success/20 px-2 py-0.5 text-[0.625rem] font-medium text-success">{inv.status}</span>
                <button className="flex h-8 w-8 items-center justify-center rounded-lg text-on-surface-variant hover:bg-surface-container-high">
                  <Download className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
