-- Agregar campos para dimensiones por defecto de Starken
ALTER TABLE app_settings
ADD COLUMN IF NOT EXISTS starken_default_alto INTEGER DEFAULT 10,
ADD COLUMN IF NOT EXISTS starken_default_ancho INTEGER DEFAULT 10,
ADD COLUMN IF NOT EXISTS starken_default_largo INTEGER DEFAULT 10,
ADD COLUMN IF NOT EXISTS starken_default_kilos NUMERIC(5,2) DEFAULT 0.1;

-- Comentarios para documentar los campos
COMMENT ON COLUMN app_settings.starken_default_alto IS 'Alto por defecto en cm para productos sin dimensiones especificadas (Starken)';
COMMENT ON COLUMN app_settings.starken_default_ancho IS 'Ancho por defecto en cm para productos sin dimensiones especificadas (Starken)';
COMMENT ON COLUMN app_settings.starken_default_largo IS 'Largo por defecto en cm para productos sin dimensiones especificadas (Starken)';
COMMENT ON COLUMN app_settings.starken_default_kilos IS 'Peso por defecto en kg para productos sin peso especificado (Starken)';

