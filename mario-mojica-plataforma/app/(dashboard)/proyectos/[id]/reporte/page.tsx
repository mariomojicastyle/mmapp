import { getProyectoDetalle, getMetricasDetalleProducto } from "@/app/actions/metricas"
import { redirect } from "next/navigation"
import Link from "next/link"

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function ReportePage({ params }: PageProps) {
  const { id } = await params

  // 1. Obtener detalles del proyecto
  const proyectoRes = await getProyectoDetalle(id)
  if ("error" in proyectoRes || !proyectoRes.data) {
    console.error("Error al cargar proyecto:", proyectoRes.error)
    redirect("/proyectos")
  }

  // 2. Obtener métricas
  const metricasRes = await getMetricasDetalleProducto(id)
  if ("error" in metricasRes) {
    console.error("Error al cargar métricas:", metricasRes.error)
    redirect("/proyectos")
  }

  const proyecto = proyectoRes.data
  const metricas = metricasRes
  const resumen = metricas.resumen
  
  // Calcular alerta de fricción en los pasos del embudo
  // Si un paso tiene una caída de retención mayor al 15% respecto al anterior
  const alertSteps: number[] = []
  if (metricas.embudo && metricas.embudo.length > 0) {
    let lastPercentage = 100
    for (const stepInfo of metricas.embudo) {
      const drop = lastPercentage - stepInfo.percentage
      if (drop > 15 && stepInfo.step > 0) {
        alertSteps.push(stepInfo.step)
      }
      lastPercentage = stepInfo.percentage
    }
  }

  // Formatear tiempos ms a min:seg o seg
  const formatDuration = (ms: number) => {
    const totalSecs = Math.round(ms / 1000)
    if (totalSecs < 60) return `${totalSecs}s`
    const mins = Math.floor(totalSecs / 60)
    const secs = totalSecs % 60
    return `${mins}m ${secs}s`
  }

  const currentDate = new Date().toLocaleDateString("es-ES", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-4 md:p-8 print:bg-white print:p-0 font-sans antialiased">
      {/* Barra de Navegación superior (No se imprime) */}
      <div className="max-w-4xl mx-auto mb-6 flex items-center justify-between no-print bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <Link
          href="/proyectos"
          className="flex items-center gap-2 text-sm font-medium text-teal-600 hover:text-teal-700 transition-colors"
        >
          <span className="material-symbols-outlined text-base">arrow_back</span>
          Volver a Proyectos
        </Link>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm cursor-pointer"
        >
          <span className="material-symbols-outlined text-base">print</span>
          Imprimir Reporte (PDF)
        </button>
      </div>

      {/* Contenido Imprimible */}
      <div className="max-w-4xl mx-auto bg-white p-8 md:p-12 rounded-2xl border border-slate-200 print:border-none print:shadow-none print:p-0 shadow-lg">
        {/* Cabecera del Reporte */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b-2 border-teal-600 pb-6 mb-8 gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-800 uppercase">
              Informe de Fricción de Armado
            </h1>
            <p className="text-teal-600 font-semibold tracking-wider text-xs uppercase mt-1">
              Plataforma de Optimización Operativa - Mario Mojica
            </p>
          </div>
          <div className="text-left md:text-right text-xs text-slate-500">
            <p><strong>Fecha de Emisión:</strong> {currentDate}</p>
            <p><strong>Manual ID:</strong> {proyecto.codigo_manual || "N/D"}</p>
          </div>
        </div>

        {/* Detalles del Proyecto */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-6 rounded-xl border border-slate-100 mb-8 text-sm">
          <div>
            <p className="text-slate-500 font-medium text-xs uppercase tracking-wider mb-1">Proyecto y Cliente</p>
            <h3 className="font-bold text-base text-slate-800">{proyecto.nombre}</h3>
            <p className="text-slate-600 mt-0.5">Empresa: <strong className="text-slate-700">{proyecto.profiles?.company || "Mario Mojica"}</strong></p>
            <p className="text-slate-600">Representante: {proyecto.profiles?.full_name || "N/A"}</p>
          </div>
          <div>
            <p className="text-slate-500 font-medium text-xs uppercase tracking-wider mb-1">Información de Origen</p>
            <p className="text-slate-700"><strong>Tipo de Proyecto:</strong> {proyecto.tipo_proyecto}</p>
            <p className="text-slate-700"><strong>Solicitud Asociada:</strong> {proyecto.solicitudes?.titulo || "Ninguna"}</p>
            <p className="text-slate-700"><strong>Estado en Plataforma:</strong> {proyecto.estado}</p>
          </div>
        </div>

        {/* Resumen de KPI */}
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-4">Métricas Principales (KPI)</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 text-center">
            <p className="text-slate-500 text-xs font-semibold mb-1">Total Sesiones</p>
            <p className="text-2xl font-black text-slate-800">{resumen.totalSesiones}</p>
          </div>
          <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 text-center">
            <p className="text-slate-500 text-xs font-semibold mb-1">Tasa de Éxito</p>
            <p className="text-2xl font-black text-teal-600">{resumen.tasaFinalizacion}%</p>
          </div>
          <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 text-center">
            <p className="text-slate-500 text-xs font-semibold mb-1">Calificación Promedio</p>
            <p className="text-2xl font-black text-amber-500">{resumen.calificacionPromedio || "0.0"} / 5★</p>
          </div>
          <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 text-center">
            <p className="text-slate-500 text-xs font-semibold mb-1">Ayudas de Interfaz</p>
            <p className="text-2xl font-black text-slate-800">{resumen.totalAyudas}</p>
          </div>
        </div>

        {/* Embudo de Retención */}
        <div className="mb-8 page-break">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-4">Embudo de Retención Paso a Paso</h2>
          <div className="space-y-3">
            {metricas.embudo && metricas.embudo.length > 0 ? (
              metricas.embudo.map((stepInfo) => (
                <div key={stepInfo.step} className="flex items-center text-sm gap-4">
                  <div className="w-20 font-semibold text-slate-600">Paso {stepInfo.step.toString().padStart(2, "0")}</div>
                  <div className="flex-1 bg-slate-100 h-6 rounded-md overflow-hidden relative border border-slate-200/50">
                    <div
                      className="bg-teal-600/80 h-full rounded-l-md transition-all duration-500"
                      style={{ width: `${stepInfo.percentage}%` }}
                    />
                    <span className="absolute inset-y-0 left-3 flex items-center text-xs font-bold text-slate-700 print:text-black">
                      {stepInfo.count} sesiones
                    </span>
                  </div>
                  <div className="w-16 text-right font-bold text-slate-800">{stepInfo.percentage}%</div>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500 italic">No hay suficientes datos registrados de pasos.</p>
            )}
          </div>
        </div>

        {/* Tabla de Fricción por Paso */}
        <div className="mb-8 page-break">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-4">Detalle de Duración y Alertas</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b-2 border-slate-200 text-slate-500">
                  <th className="py-2 font-bold uppercase text-xs">Paso</th>
                  <th className="py-2 font-bold uppercase text-xs">Tiempo Promedio</th>
                  <th className="py-2 font-bold uppercase text-xs">Tiempo Máximo</th>
                  <th className="py-2 font-bold uppercase text-xs text-right">Diagnóstico</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {metricas.tiemposPorPaso && metricas.tiemposPorPaso.length > 0 ? (
                  metricas.tiemposPorPaso.map((tiempo) => {
                    const hasAlert = alertSteps.includes(tiempo.step)
                    return (
                      <tr key={tiempo.step} className={hasAlert ? "bg-red-50/50 print:bg-white" : ""}>
                        <td className="py-3 font-semibold text-slate-700">Paso {tiempo.step.toString().padStart(2, "0")}</td>
                        <td className="py-3 text-slate-600">{formatDuration(tiempo.avgTimeMs)}</td>
                        <td className="py-3 text-slate-600">{formatDuration(tiempo.maxTimeMs)}</td>
                        <td className="py-3 text-right">
                          {hasAlert ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700 border border-red-200 uppercase tracking-wide">
                              Fricción Alta ⚠
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700 border border-green-200 uppercase tracking-wide">
                              Óptimo ✓
                            </span>
                          )}
                        </td>
                      </tr>
                    )
                  })
                ) : (
                  <tr>
                    <td colSpan={4} className="py-4 text-center text-slate-500 italic">No hay suficientes registros de tiempos.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Sección de Fricción Detallada (Recomendaciones Inteligentes) */}
        {alertSteps.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 mb-8 text-sm page-break print:bg-white">
            <h3 className="font-bold text-amber-800 flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-base">warning</span>
              Alertas de Fricción Identificadas por la IA
            </h3>
            <p className="text-amber-950 mb-3 leading-relaxed">
              El sistema identificó caídas críticas en el embudo en los siguientes pasos. Se recomienda realizar una auditoría técnica o visual de los insumos cargados:
            </p>
            <ul className="list-disc list-inside space-y-1.5 text-amber-900 font-medium">
              {alertSteps.map(step => (
                <li key={step}>
                  <strong>Paso {step.toString().padStart(2, "0")}:</strong> Pérdida de retención de usuarios superior al 15%. Verifique la claridad de la locución por voz o compruebe si la malla del herraje obstaculiza la visualización de la pieza principal en Three.js.
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Dispositivos y Ayudas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8 page-break">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-4">Uso de Dispositivos</h2>
            <div className="space-y-2">
              {Object.keys(metricas.dispositivos).length > 0 ? (
                Object.entries(metricas.dispositivos).map(([device, count]) => {
                  const pct = resumen.totalSesiones > 0 ? Math.round((count / resumen.totalSesiones) * 100) : 0
                  return (
                    <div key={device} className="flex justify-between items-center text-sm border-b border-slate-100 pb-2">
                      <span className="capitalize font-medium text-slate-600">{device}</span>
                      <span className="font-bold text-slate-800">{count} visitas ({pct}%)</span>
                    </div>
                  )
                })
              ) : (
                <p className="text-sm text-slate-500 italic">No hay datos de dispositivos registrados.</p>
              )}
            </div>
          </div>
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-4">Solicitud de Ayudas Interfaz</h2>
            <div className="space-y-2">
              {Object.keys(metricas.ayudasPorTipo).length > 0 ? (
                Object.entries(metricas.ayudasPorTipo).map(([helpType, count]) => {
                  return (
                    <div key={helpType} className="flex justify-between items-center text-sm border-b border-slate-100 pb-2">
                      <span className="capitalize font-medium text-slate-600">{helpType.replace("_", " ")}</span>
                      <span className="font-bold text-slate-800">{count} veces</span>
                    </div>
                  )
                })
              ) : (
                <p className="text-sm text-slate-500 italic">No hay registros de solicitudes de ayuda.</p>
              )}
            </div>
          </div>
        </div>

        {/* Opiniones y Comentarios */}
        <div className="mb-0 page-break">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-4">Muro de Feedback de Clientes</h2>
          <div className="space-y-4">
            {metricas.feedbacks && metricas.feedbacks.length > 0 ? (
              metricas.feedbacks.slice(0, 10).map((fb, idx) => (
                <div key={idx} className="border-l-4 border-teal-500 bg-slate-50 p-4 rounded-r-lg text-sm print:bg-white print:border-slate-300">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-slate-800">Calificación: {fb.rating} ★</span>
                    <span className="text-xs text-slate-400">{new Date(fb.created_at).toLocaleDateString("es-ES")}</span>
                  </div>
                  {fb.tags && fb.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {fb.tags.map((tag, tIdx) => (
                        <span key={tIdx} className="bg-teal-50 text-teal-700 text-xxs font-bold px-1.5 py-0.5 rounded border border-teal-100 uppercase tracking-wider">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  <p className="text-slate-600 italic">
                    &quot;{fb.comment || "Sin comentarios adicionales"}&quot;
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500 italic">No hay comentarios ni valoraciones registradas para este manual.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
