-- ==============================================================================
-- MIGRACIÓN SUPABASE: 3DBimFab (3BF) Configuraciones Paramétricas
-- Tabla para almacenar definiciones Grasshopper, Schemas JSON y parámetros por cliente B2B
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.configuraciones_3bf (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    proyecto_id UUID REFERENCES public.proyectos(id) ON DELETE CASCADE,
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    gh_file_url TEXT NOT NULL,
    gh_schema_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    valores_default_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    thumbnail_url TEXT,
    activo BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar Row Level Security (RLS)
ALTER TABLE public.configuraciones_3bf ENABLE ROW LEVEL SECURITY;

-- Política de lectura para usuarios autenticados
CREATE POLICY "Permitir lectura a usuarios autenticados en configuraciones 3bf"
ON public.configuraciones_3bf
FOR SELECT
TO authenticated
USING (true);

-- Política de inserción/edición para SuperAdmins y Coequiperos
CREATE POLICY "Permitir gestión de 3bf a admins y coequiperos"
ON public.configuraciones_3bf
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.usuarios u
    WHERE u.id = auth.uid()
    AND u.rol IN ('superadmin', 'coequipero')
  )
);
