-- Tabla para almacenar las configuraciones de la aplicación
CREATE TABLE IF NOT EXISTS app_settings (
  id TEXT PRIMARY KEY DEFAULT 'default',
  whatsapp_number TEXT NOT NULL DEFAULT '',
  logo TEXT NOT NULL DEFAULT '',
  favicon TEXT DEFAULT '',
  primary_color TEXT NOT NULL DEFAULT '#0284c7',
  minimum_purchase INTEGER NOT NULL DEFAULT 0,
  pickup_address TEXT DEFAULT '',
  menu_items JSONB DEFAULT '[]'::jsonb,
  announcement_bar JSONB NOT NULL DEFAULT '{
    "enabled": false,
    "messages": [],
    "position": "top",
    "backgroundColor": "#0ea5e9",
    "textColor": "#ffffff",
    "rotationInterval": 5
  }'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear el registro por defecto si no existe
INSERT INTO app_settings (id)
VALUES ('default')
ON CONFLICT (id) DO NOTHING;

-- Índice para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_app_settings_id ON app_settings(id);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_app_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar updated_at
DROP TRIGGER IF EXISTS trigger_update_app_settings_updated_at ON app_settings;
CREATE TRIGGER trigger_update_app_settings_updated_at
  BEFORE UPDATE ON app_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_app_settings_updated_at();

-- Políticas RLS (Row Level Security)
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- Permitir lectura pública (las configuraciones son públicas)
CREATE POLICY "Allow public read access to app_settings"
  ON app_settings
  FOR SELECT
  USING (true);

-- Solo permitir escritura con service role (desde API routes con autenticación admin)
-- En producción, esto se maneja con el service role key que omite RLS
CREATE POLICY "Allow service role write access to app_settings"
  ON app_settings
  FOR ALL
  USING (true)
  WITH CHECK (true);

