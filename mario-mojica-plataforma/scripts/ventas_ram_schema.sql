-- ============================================================================
-- ESQUEMA SQL: RAM DE VENTAS B2B (Supabase PostgreSQL)
-- ============================================================================

-- 1. Tabla de Prospectos Activos
CREATE TABLE IF NOT EXISTS public.ventas_prospectos (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    empresa text NOT NULL,
    contacto_nombre text NOT NULL,
    contacto_cargo text,
    canal_preferido text DEFAULT 'LinkedIn' CHECK (canal_preferido IN ('LinkedIn', 'WhatsApp', 'Email', 'Teléfono', 'Otro')),
    pais text DEFAULT 'Brasil',
    temperatura text NOT NULL DEFAULT 'tibio' CHECK (temperatura IN ('caliente', 'tibio', 'enfriando', 'pausado', 'cerrado_ganado', 'cerrado_perdido')),
    ultima_interaccion_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    proxima_accion_at timestamp with time zone,
    proxima_accion_descripcion text,
    avatar_url text,
    notas_estrategicas text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Tabla de Interacciones / Bitácora y Capturas
CREATE TABLE IF NOT EXISTS public.ventas_interacciones (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    prospecto_id uuid REFERENCES public.ventas_prospectos(id) ON DELETE CASCADE NOT NULL,
    canal text NOT NULL CHECK (canal IN ('LinkedIn', 'WhatsApp', 'Email', 'Reunión', 'Otro')),
    tipo_entrada text NOT NULL CHECK (tipo_entrada IN ('screenshot', 'texto')),
    imagen_url text,
    resumen_es text NOT NULL,
    intencion_detectada text,
    termometro text NOT NULL DEFAULT 'tibio',
    borrador_pt text NOT NULL,
    traduccion_es text NOT NULL,
    mensaje_final_enviado text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Índices de Rendimiento
CREATE INDEX IF NOT EXISTS idx_ventas_prospectos_temperatura ON public.ventas_prospectos(temperatura);
CREATE INDEX IF NOT EXISTS idx_ventas_prospectos_ultima_interaccion ON public.ventas_prospectos(ultima_interaccion_at DESC);
CREATE INDEX IF NOT EXISTS idx_ventas_interacciones_prospecto ON public.ventas_interacciones(prospecto_id);

-- 4. Habilitar Seguridad a Nivel de Fila (RLS)
ALTER TABLE public.ventas_prospectos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ventas_interacciones ENABLE ROW LEVEL SECURITY;

-- 5. Políticas RLS (Exclusivo SuperAdmin / Usuarios Autenticados con Permiso)
CREATE POLICY "Permitir todo a usuarios autenticados en ventas_prospectos"
    ON public.ventas_prospectos
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Permitir todo a usuarios autenticados en ventas_interacciones"
    ON public.ventas_interacciones
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- 6. Inserción de Datos Iniciales (Seed de Prospectos Activos de la RAM)
INSERT INTO public.ventas_prospectos (empresa, contacto_nombre, contacto_cargo, canal_preferido, pais, temperatura, ultima_interaccion_at, proxima_accion_at, proxima_accion_descripcion, notas_estrategicas)
VALUES 
(
    'Politorno Móveis', 
    'Marcelo Novo', 
    'Diretor / Líder P&D', 
    'WhatsApp', 
    'Brasil', 
    'caliente', 
    NOW(), 
    NOW() + INTERVAL '7 days', 
    'Fijar hora de reunión el miércoles 26 tras Movelsul 2026', 
    'Reunión confirmada para la próxima semana. Interesado en manuales 3D y motor paramétrico.'
),
(
    'Grupo K1 (Kappesberg)', 
    'Julio Santos', 
    'Especialista em IA & Automação / Marketing', 
    'LinkedIn', 
    'Brasil', 
    'caliente', 
    NOW() - INTERVAL '1 day', 
    NOW() + INTERVAL '2 days', 
    'Esperar feedback de reunión interna con su gerente sobre costos y piloto', 
    'Enviada propuesta detallada, ahorro 30% en P&D y suscripción $1 USD/mes por mueble activo.'
),
(
    'Kit''s Paraná', 
    'Marcos Benedito & Jamylle Duarte', 
    'Directivos P&D / Marketing', 
    'Email', 
    'Brasil', 
    'tibio', 
    NOW() - INTERVAL '1 day', 
    NOW() + INTERVAL '1 day', 
    'Enviar correo corporativo formal referenciado por Andre Luis', 
    'Andre Luis (comercio exterior) facilitó los correos de Marcos y Jamylle para la presentación.'
),
(
    'Móveis Henn', 
    'Rudgeri Henkel', 
    'Gerente de Planejamento e Materiais', 
    'WhatsApp', 
    'Brasil', 
    'tibio', 
    NOW() - INTERVAL '15 days', 
    NOW() + INTERVAL '2 days', 
    'Enviar mensaje inicial por WhatsApp para presentar la demo', 
    'Recomendado por Jonas Borck. Facilitó su número directo.'
),
(
    'Indústria de Móveis Bartira', 
    'Denis Roveri', 
    'Ex-Gerente de Engenharia', 
    'LinkedIn', 
    'Brasil', 
    'pausado', 
    NOW() - INTERVAL '1 day', 
    NULL, 
    'Mantener contacto para futuros proyectos en la industria', 
    'Informó amablemente que ya no está en Bartira. Canal profesional abierto.'
),
(
    'Demóbile', 
    'Junio César Françolin', 
    'Gerente de Produção', 
    'LinkedIn', 
    'Brasil', 
    'enfriando', 
    NOW() - INTERVAL '20 days', 
    NOW() + INTERVAL '3 days', 
    'Enviar mensaje de seguimiento corto sobre control de calidad extendido', 
    'Vio el perfil de Mario en LinkedIn.'
)
ON CONFLICT DO NOTHING;
