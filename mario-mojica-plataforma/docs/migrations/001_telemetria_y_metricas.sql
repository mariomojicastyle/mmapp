-- ═══════════════════════════════════════════════════════════════
-- MIGRACIÓN 001: Tabla telemetria_manuales
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- Fecha: 2026-06-19
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.telemetria_manuales (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    proyecto_id uuid NOT NULL REFERENCES public.proyectos(id) ON DELETE CASCADE,
    session_id text NOT NULL,
    tipo_evento text NOT NULL CHECK (tipo_evento IN (
        'session_start',
        'step_reached',
        'help_click',
        'session_complete',
        'feedback_submitted'
    )),
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamptz DEFAULT now() NOT NULL
);

-- Índices optimizados para dashboards con 500+ productos
CREATE INDEX IF NOT EXISTS idx_telemetria_proyecto_id ON public.telemetria_manuales(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_telemetria_proyecto_tipo ON public.telemetria_manuales(proyecto_id, tipo_evento);
CREATE INDEX IF NOT EXISTS idx_telemetria_proyecto_fecha ON public.telemetria_manuales(proyecto_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_telemetria_session ON public.telemetria_manuales(session_id);

-- RLS
ALTER TABLE public.telemetria_manuales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert telemetry events"
    ON public.telemetria_manuales FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

CREATE POLICY "Users can read telemetry of their own projects"
    ON public.telemetria_manuales FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.proyectos p
            JOIN public.profiles pr ON pr.id = auth.uid()
            WHERE p.id = telemetria_manuales.proyecto_id
            AND (
                pr.role IN ('superadmin', 'coequipero')
                OR p.client_id = auth.uid()
            )
        )
    );

CREATE POLICY "Only superadmin can delete telemetry"
    ON public.telemetria_manuales FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'superadmin'
        )
    );

-- ═══════════════════════════════════════════════════════════════
-- Vista de métricas resumidas por proyecto
-- ═══════════════════════════════════════════════════════════════

CREATE OR REPLACE VIEW public.vista_metricas_resumen AS
SELECT
    p.id AS proyecto_id,
    p.nombre AS proyecto_nombre,
    p.client_id,
    p.categoria,
    p.codigo_manual,
    p.estado,
    cm.logo_url,
    COUNT(DISTINCT t.session_id) FILTER (WHERE t.tipo_evento = 'session_start') AS total_sesiones,
    COUNT(DISTINCT t.session_id) FILTER (WHERE t.tipo_evento = 'session_complete') AS sesiones_completadas,
    CASE
        WHEN COUNT(DISTINCT t.session_id) FILTER (WHERE t.tipo_evento = 'session_start') > 0
        THEN ROUND(
            COUNT(DISTINCT t.session_id) FILTER (WHERE t.tipo_evento = 'session_complete')::numeric
            / COUNT(DISTINCT t.session_id) FILTER (WHERE t.tipo_evento = 'session_start')::numeric * 100, 1
        )
        ELSE 0
    END AS tasa_finalizacion,
    ROUND(AVG((t.metadata->>'rating')::numeric) FILTER (WHERE t.tipo_evento = 'feedback_submitted'), 1) AS calificacion_promedio,
    COUNT(*) FILTER (WHERE t.tipo_evento = 'feedback_submitted') AS total_feedbacks,
    COUNT(*) FILTER (WHERE t.tipo_evento = 'help_click') AS total_ayudas,
    MAX(t.created_at) AS ultimo_evento
FROM public.proyectos p
LEFT JOIN public.configuraciones_manual cm ON cm.proyecto_id = p.id
LEFT JOIN public.telemetria_manuales t ON t.proyecto_id = p.id
WHERE p.tipo_proyecto = 'Aplicativo de armado'
GROUP BY p.id, p.nombre, p.client_id, p.categoria, p.codigo_manual, p.estado, cm.logo_url;

-- ═══════════════════════════════════════════════════════════════
-- Agregar columna categoria a proyectos
-- ═══════════════════════════════════════════════════════════════

ALTER TABLE public.proyectos ADD COLUMN IF NOT EXISTS categoria text DEFAULT 'General';
