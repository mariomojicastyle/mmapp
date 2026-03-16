-- Crear la tabla de leads (Esquema Premium para Portafolio)
CREATE TABLE leads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  nombre TEXT NOT NULL,
  apellido TEXT NOT NULL,
  correo TEXT NOT NULL,
  empresa TEXT,
  pais TEXT,
  telefono TEXT,
  rol TEXT,
  interes TEXT,
  status TEXT DEFAULT 'Nuevo' CHECK (status IN ('Nuevo', 'Contactado', 'Agendado', 'Descartado')),
  notas TEXT,
  origen TEXT DEFAULT 'Portafolio Web'
);

-- Habilitar Row Level Security (RLS)
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Crear política para permitir lectura (solo admin)
CREATE POLICY "Admin puede leer leads" 
ON leads FOR SELECT 
USING (auth.role() = 'authenticated');

-- Crear política para permitir inserción desde el formulario (público o vía webhook)
CREATE POLICY "Permitir inserción de leads" 
ON leads FOR INSERT 
WITH CHECK (true);

-- Datos de prueba con el nuevo formato
INSERT INTO leads (nombre, apellido, correo, empresa, pais, telefono, rol, interes, status)
VALUES 
('Mario', 'Mojica', 'mario@example.com', 'MMA Studio', 'Colombia', '+573117646907', 'Director Ejecutivo', 'Automatizaciones', 'Nuevo');
