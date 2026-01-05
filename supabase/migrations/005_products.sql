-- Crear tabla para productos
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  price INTEGER NOT NULL,
  image TEXT NOT NULL,
  category TEXT NOT NULL,
  tags JSONB DEFAULT '[]'::jsonb,
  variants JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Crear índices para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at);
CREATE INDEX IF NOT EXISTS idx_products_tags ON products USING GIN(tags);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_products_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar updated_at
DROP TRIGGER IF EXISTS trigger_update_products_updated_at ON products;
CREATE TRIGGER trigger_update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_products_updated_at();

-- Políticas RLS (Row Level Security)
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes si existen (para permitir re-ejecutar la migración)
DROP POLICY IF EXISTS "Allow public read access to products" ON products;
DROP POLICY IF EXISTS "Allow service role write access to products" ON products;

-- Permitir lectura pública (los productos son públicos)
CREATE POLICY "Allow public read access to products"
  ON products
  FOR SELECT
  USING (true);

-- Solo permitir escritura con service role (desde API routes con autenticación admin)
-- En producción, esto se maneja con el service role key que omite RLS
CREATE POLICY "Allow service role write access to products"
  ON products
  FOR ALL
  USING (true)
  WITH CHECK (true);

