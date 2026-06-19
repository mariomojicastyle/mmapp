"use server"

import { createClient } from "@supabase/supabase-js"

// ── Supabase Admin (patrón copiado de proyectos.ts) ─────────────────────────

function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Falta configuración de Supabase URL o Service Role Key")
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

// ── Tipos ───────────────────────────────────────────────────────────────────

interface MetricasResumenRow {
  proyecto_id: string
  proyecto_nombre: string
  client_id: string
  categoria: string | null
  codigo_manual: string | null
  estado: string
  logo_url: string | null
  total_sesiones: number
  sesiones_completadas: number
  tasa_finalizacion: number
  calificacion_promedio: number | null
  total_feedbacks: number
  total_ayudas: number
  ultimo_evento: string | null
}

interface TelemetriaManualRow {
  id: string
  proyecto_id: string
  session_id: string
  event_type: string
  step_number: number | null
  step_label: string | null
  device_info: string | null
  help_type: string | null
  rating: number | null
  tags: string[] | null
  comment: string | null
  duration_ms: number | null
  metadata: Record<string, unknown> | null
  created_at: string
}

type OrdenarPor = "total_sesiones" | "calificacion_promedio" | "tasa_finalizacion" | "proyecto_nombre"

interface GetProductosConMetricasOptions {
  clientId?: string | null
  search?: string
  ordenarPor?: OrdenarPor
  orden?: "asc" | "desc"
  page?: number
  pageSize?: number
}

interface ProductosConMetricasSuccess {
  data: MetricasResumenRow[]
  totalCount: number
  page: number
  pageSize: number
  totalPages: number
}

interface ProductosConMetricasError {
  error: string
}

interface EmbудоStep {
  step: number
  count: number
  percentage: number
}

interface TiempoPorPaso {
  step: number
  avgTimeMs: number
  maxTimeMs: number
}

interface Sentimiento {
  positivas: number
  neutrales: number
  negativas: number
}

interface FeedbackEntry {
  rating: number | null
  tags: string[] | null
  comment: string | null
  created_at: string
}

interface MetricasDetalleSuccess {
  resumen: {
    totalSesiones: number
    sesionesCompletadas: number
    tasaFinalizacion: number
    calificacionPromedio: number
    totalFeedbacks: number
    totalAyudas: number
  }
  embudo: EmbудоStep[]
  tiemposPorPaso: TiempoPorPaso[]
  dispositivos: Record<string, number>
  ayudasPorTipo: Record<string, number>
  sesionesXDia: Record<string, number>
  sentimiento: Sentimiento
  feedbacks: FeedbackEntry[]
}

interface MetricasDetalleError {
  error: string
}

interface MetricasComparacionSuccess {
  data: MetricasResumenRow[]
}

interface MetricasComparacionError {
  error: string
}

// ── 1. getProductosConMetricas ──────────────────────────────────────────────

export async function getProductosConMetricas(
  options: GetProductosConMetricasOptions = {}
): Promise<ProductosConMetricasSuccess | ProductosConMetricasError> {
  try {
    const supabase = getSupabaseAdmin()

    const {
      clientId = null,
      search,
      ordenarPor = "total_sesiones",
      orden = "desc",
      page = 1,
      pageSize = 24,
    } = options

    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    // Mapear columna de ordenamiento
    const columnaOrden = ordenarPor

    let query = supabase
      .from("vista_metricas_resumen")
      .select("*", { count: "exact" })

    // Filtrar por cliente si se proporciona
    if (clientId) {
      query = query.eq("client_id", clientId)
    }

    // Buscar por nombre de proyecto o código de manual (carpeta)
    if (search && search.trim().length > 0) {
      const term = `%${search.trim()}%`
      query = query.or(`proyecto_nombre.ilike.${term},codigo_manual.ilike.${term}`)
    }

    // Ordenar y paginar
    query = query
      .order(columnaOrden, { ascending: orden === "asc" })
      .range(from, to)

    const { data, error, count } = await query

    if (error) throw error

    const totalCount = count ?? 0
    const totalPages = Math.ceil(totalCount / pageSize)

    return {
      data: (data as MetricasResumenRow[]) || [],
      totalCount,
      page,
      pageSize,
      totalPages,
    }
  } catch (err: unknown) {
    console.error("Error en getProductosConMetricas:", err)
    return { error: err instanceof Error ? err.message : "Error al obtener métricas de productos" }
  }
}

// ── 2. getMetricasDetalleProducto ───────────────────────────────────────────

export async function getMetricasDetalleProducto(
  proyectoId: string,
  rangoFechas?: { desde: string; hasta: string }
): Promise<MetricasDetalleSuccess | MetricasDetalleError> {
  try {
    const supabase = getSupabaseAdmin()

    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    let todosEventos: any[] = []
    let offset = 0
    const limitVal = 1000
    let keepFetching = true

    while (keepFetching) {
      let query = supabase
        .from("telemetria_manuales")
        .select("*")
        .eq("proyecto_id", proyectoId)

      if (rangoFechas) {
        query = query
          .gte("created_at", rangoFechas.desde)
          .lte("created_at", rangoFechas.hasta)
      }

      query = query
        .order("created_at", { ascending: true })
        .range(offset, offset + limitVal - 1)

      const { data, error } = await query
      if (error) throw error

      if (data && data.length > 0) {
        todosEventos = todosEventos.concat(data)
        offset += limitVal
        if (data.length < limitVal) {
          keepFetching = false
        }
      } else {
        keepFetching = false
      }
      
      // Safety break to prevent infinite loop
      if (offset >= 100000) {
        break
      }
    }

    const eventos = todosEventos

    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    const rows = ((eventos || []) as any[]).map((evt) => {
      const meta = evt.metadata || {}
      const mappedEventType = evt.tipo_evento === "help_click" 
        ? "help_request" 
        : (evt.tipo_evento === "feedback_submitted" ? "feedback" : evt.tipo_evento)

      return {
        id: String(evt.id),
        proyecto_id: evt.proyecto_id,
        session_id: evt.session_id,
        event_type: mappedEventType,
        step_number: meta.step !== undefined ? meta.step : null,
        step_label: meta.step_label || null,
        device_info: meta.device_type || null,
        help_type: meta.help_type || null,
        rating: meta.rating !== undefined ? meta.rating : null,
        tags: meta.tags || null,
        comment: meta.comment || null,
        duration_ms: meta.duration_ms !== undefined ? meta.duration_ms : null,
        metadata: meta,
        created_at: evt.created_at,
      } as TelemetriaManualRow
    })

    // ── Reconstruir sesiones con Map ──────────────────────────────────

    interface SessionData {
      sessionId: string
      events: TelemetriaManualRow[]
      completed: boolean
      startDate: string
      device: string | null
    }

    const sesionesMap = new Map<string, SessionData>()

    for (const evento of rows) {
      const sid = evento.session_id
      if (!sesionesMap.has(sid)) {
        sesionesMap.set(sid, {
          sessionId: sid,
          events: [],
          completed: false,
          startDate: evento.created_at,
          device: evento.device_info,
        })
      }
      const session = sesionesMap.get(sid)!
      session.events.push(evento)

      if (evento.event_type === "session_complete") {
        session.completed = true
      }
    }

    // ── Resumen ──────────────────────────────────────────────────────

    const totalSesiones = sesionesMap.size
    let sesionesCompletadas = 0
    const ratings: number[] = []
    let totalFeedbacks = 0
    let totalAyudas = 0

    // ── Embudo (paso → sesiones que alcanzaron ese paso) ─────────────

    const pasoSesiones = new Map<number, Set<string>>()

    // ── Tiempos por paso ─────────────────────────────────────────────

    const tiemposPaso = new Map<number, number[]>()

    // ── Dispositivos ─────────────────────────────────────────────────

    const dispositivos: Record<string, number> = {}

    // ── Ayudas por tipo ──────────────────────────────────────────────

    const ayudasPorTipo: Record<string, number> = {}

    // ── Sesiones por día ─────────────────────────────────────────────

    const sesionesXDia: Record<string, number> = {}

    // ── Feedbacks ────────────────────────────────────────────────────

    const feedbacksRaw: FeedbackEntry[] = []

    for (const [sessionId, session] of Array.from(sesionesMap.entries())) {
      // Completadas
      if (session.completed) {
        sesionesCompletadas++
      }

      // Dispositivo
      if (session.device) {
        dispositivos[session.device] = (dispositivos[session.device] || 0) + 1
      }

      // Sesiones por día (YYYY-MM-DD)
      const dia = session.startDate.substring(0, 10)
      sesionesXDia[dia] = (sesionesXDia[dia] || 0) + 1

      for (const evento of session.events) {
        // Embudo: paso alcanzado
        if (evento.step_number !== null && evento.step_number !== undefined) {
          if (!pasoSesiones.has(evento.step_number)) {
            pasoSesiones.set(evento.step_number, new Set())
          }
          pasoSesiones.get(evento.step_number)!.add(sessionId)
        }

        // Tiempos por paso
        if (
          evento.step_number !== null &&
          evento.step_number !== undefined &&
          evento.duration_ms !== null &&
          evento.duration_ms !== undefined
        ) {
          if (!tiemposPaso.has(evento.step_number)) {
            tiemposPaso.set(evento.step_number, [])
          }
          tiemposPaso.get(evento.step_number)!.push(evento.duration_ms)
        }

        // Ayudas
        if (evento.event_type === "help_request") {
          totalAyudas++
          const tipo = evento.help_type || "otro"
          ayudasPorTipo[tipo] = (ayudasPorTipo[tipo] || 0) + 1
        }

        // Feedback
        if (evento.event_type === "feedback") {
          totalFeedbacks++
          if (evento.rating !== null && evento.rating !== undefined) {
            ratings.push(evento.rating)
          }
          feedbacksRaw.push({
            rating: evento.rating,
            tags: evento.tags,
            comment: evento.comment,
            created_at: evento.created_at,
          })
        }
      }
    }

    // ── Calcular promedios y tasas ────────────────────────────────────

    const tasaFinalizacion =
      totalSesiones > 0
        ? Math.round((sesionesCompletadas / totalSesiones) * 10000) / 100
        : 0

    const calificacionPromedio =
      ratings.length > 0
        ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 100) / 100
        : 0

    // ── Embudo array ordenado ────────────────────────────────────────

    const embudo: EmbудоStep[] = Array.from(pasoSesiones.entries())
      .sort(([a], [b]) => a - b)
      .map(([step, sessions]) => ({
        step,
        count: sessions.size,
        percentage:
          totalSesiones > 0
            ? Math.round((sessions.size / totalSesiones) * 10000) / 100
            : 0,
      }))

    // ── Tiempos por paso array ───────────────────────────────────────

    const tiemposPorPaso: TiempoPorPaso[] = Array.from(tiemposPaso.entries())
      .sort(([a], [b]) => a - b)
      .map(([step, times]) => ({
        step,
        avgTimeMs: Math.round(times.reduce((a, b) => a + b, 0) / times.length),
        maxTimeMs: Math.max(...times),
      }))

    // ── Sentimiento ──────────────────────────────────────────────────

    const sentimiento: Sentimiento = {
      positivas: ratings.filter((r) => r >= 4).length,
      neutrales: ratings.filter((r) => r === 3).length,
      negativas: ratings.filter((r) => r <= 2).length,
    }

    const feedbacks = feedbacksRaw
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    return {
      resumen: {
        totalSesiones,
        sesionesCompletadas,
        tasaFinalizacion,
        calificacionPromedio,
        totalFeedbacks,
        totalAyudas,
      },
      embudo,
      tiemposPorPaso,
      dispositivos,
      ayudasPorTipo,
      sesionesXDia,
      sentimiento,
      feedbacks,
    }
  } catch (err: unknown) {
    console.error("Error en getMetricasDetalleProducto:", err)
    return { error: err instanceof Error ? err.message : "Error al obtener detalle de métricas" }
  }
}

// ── 3. getMetricasComparacion ───────────────────────────────────────────────

export async function getMetricasComparacion(
  proyectoIds: string[]
): Promise<MetricasComparacionSuccess | MetricasComparacionError> {
  try {
    const supabase = getSupabaseAdmin()

    if (!proyectoIds || proyectoIds.length === 0) {
      return { error: "Se requiere al menos un proyecto para comparar" }
    }

    // Limitar a máximo 4 proyectos
    const ids = proyectoIds.slice(0, 4)

    const { data, error } = await supabase
      .from("vista_metricas_resumen")
      .select("*")
      .in("proyecto_id", ids)

    if (error) throw error

    return { data: (data as MetricasResumenRow[]) || [] }
  } catch (err: unknown) {
    console.error("Error en getMetricasComparacion:", err)
    return { error: err instanceof Error ? err.message : "Error al obtener métricas de comparación" }
  }
}
