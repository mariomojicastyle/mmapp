-- Crear la tabla de leads
CREATE TABLE leads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  company TEXT,
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'pending', 'contacted', 'won', 'lost')),
  phone TEXT,
  notes TEXT
);

-- Habilitar Row Level Security (RLS)
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Crear política para permitir lectura pública (para demo/desarrollo)
-- En producción real, se debería restringir a usuarios autenticados
CREATE POLICY "Permitir lectura pública de leads" 
ON leads FOR SELECT 
USING (true);

-- Crear política para permitir inserción desde el frontend (contacto)
CREATE POLICY "Permitir inserción pública de leads" 
ON leads FOR INSERT 
WITH CHECK (true);

-- Insertar datos de prueba iniciales (opcional)
INSERT INTO leads (name, email, company, status, phone)
VALUES 
('Mario Mojica', 'mario@example.com', 'MMA Corp', 'new', '+57 300...'),
('DeepMind Tech', 'contact@deepmind.com', 'Google', 'pending', '+1 650...'),
('Hetzner Cloud', 'support@hetzner.com', 'Hetzner', 'new', '+49 9831...');
