-- Crear tabla para carritos compartidos
CREATE TABLE IF NOT EXISTS shared_carts (
  id TEXT PRIMARY KEY,
  items JSONB NOT NULL,
  delivery_type TEXT,
  comuna TEXT,
  customer_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

-- Crear índice para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_shared_carts_created_at ON shared_carts(created_at);
CREATE INDEX IF NOT EXISTS idx_shared_carts_expires_at ON shared_carts(expires_at);

-- Habilitar Row Level Security (RLS)
ALTER TABLE shared_carts ENABLE ROW LEVEL SECURITY;

-- Política: Permitir lectura pública (cualquiera puede ver los carritos compartidos)
CREATE POLICY "Allow public read access" ON shared_carts
  FOR SELECT
  USING (true);

-- Nota: Las operaciones de escritura (INSERT, UPDATE, DELETE) se realizan
-- usando el service_role key, que bypassa RLS automáticamente

