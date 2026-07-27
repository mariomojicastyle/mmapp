-- Script de migración: Módulo de Marketing (v1)
-- Fecha: 2026-07-24

CREATE TABLE IF NOT EXISTS public.marketing_cuentas (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    plataforma text NOT NULL CHECK (plataforma IN ('facebook', 'instagram', 'linkedin', 'youtube', 'google_drive')),
    cuenta_id_externo text NOT NULL,
    nombre_cuenta text NOT NULL,
    avatar_url text,
    access_token text NOT NULL,
    refresh_token text,
    expires_at timestamp with time zone,
    metadatos jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.marketing_posts (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    titulo text,
    contenido_base text NOT NULL,
    overrides_redes jsonb DEFAULT '{}'::jsonb,
    drive_file_ids jsonb DEFAULT '[]'::jsonb,
    plataformas_destino jsonb NOT NULL,
    estado text DEFAULT 'borrador' CHECK (estado IN ('borrador', 'programado', 'en_cola', 'publicando', 'publicado', 'fallido')),
    error_mensaje text,
    fecha_programada timestamp with time zone,
    publicado_at timestamp with time zone,
    created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.marketing_colas (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    nombre text NOT NULL,
    plataforma text NOT NULL,
    horarios jsonb DEFAULT '[]'::jsonb,
    activa boolean DEFAULT true,
    reciclar_posts boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.marketing_metricas (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    cuenta_id uuid REFERENCES public.marketing_cuentas(id) ON DELETE CASCADE,
    fecha date NOT NULL,
    seguidores integer DEFAULT 0,
    impresiones integer DEFAULT 0,
    alcance integer DEFAULT 0,
    engagement_rate numeric(5,2) DEFAULT 0.00,
    metadatos jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.marketing_post_metricas (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    post_id uuid REFERENCES public.marketing_posts(id) ON DELETE CASCADE,
    plataforma text NOT NULL,
    impresiones integer DEFAULT 0,
    likes integer DEFAULT 0,
    comentarios integer DEFAULT 0,
    compartidos integer DEFAULT 0,
    clics integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar Row Level Security (RLS)
ALTER TABLE public.marketing_cuentas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_colas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_metricas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_post_metricas ENABLE ROW LEVEL SECURITY;

-- Crear Políticas RLS restringidas a superadmin
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Superadmin full access marketing_cuentas') THEN
        CREATE POLICY "Superadmin full access marketing_cuentas" ON public.marketing_cuentas
        FOR ALL USING (
            EXISTS (
                SELECT 1 FROM public.profiles
                WHERE profiles.id = auth.uid() AND profiles.role = 'superadmin'
            )
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Superadmin full access marketing_posts') THEN
        CREATE POLICY "Superadmin full access marketing_posts" ON public.marketing_posts
        FOR ALL USING (
            EXISTS (
                SELECT 1 FROM public.profiles
                WHERE profiles.id = auth.uid() AND profiles.role = 'superadmin'
            )
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Superadmin full access marketing_colas') THEN
        CREATE POLICY "Superadmin full access marketing_colas" ON public.marketing_colas
        FOR ALL USING (
            EXISTS (
                SELECT 1 FROM public.profiles
                WHERE profiles.id = auth.uid() AND profiles.role = 'superadmin'
            )
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Superadmin full access marketing_metricas') THEN
        CREATE POLICY "Superadmin full access marketing_metricas" ON public.marketing_metricas
        FOR ALL USING (
            EXISTS (
                SELECT 1 FROM public.profiles
                WHERE profiles.id = auth.uid() AND profiles.role = 'superadmin'
            )
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Superadmin full access marketing_post_metricas') THEN
        CREATE POLICY "Superadmin full access marketing_post_metricas" ON public.marketing_post_metricas
        FOR ALL USING (
            EXISTS (
                SELECT 1 FROM public.profiles
                WHERE profiles.id = auth.uid() AND profiles.role = 'superadmin'
            )
        );
    END IF;
END $$;
