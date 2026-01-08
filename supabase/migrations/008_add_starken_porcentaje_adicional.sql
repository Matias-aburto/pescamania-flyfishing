-- Agregar campo para porcentaje adicional al costo de envío de Starken
ALTER TABLE app_settings
ADD COLUMN IF NOT EXISTS starken_porcentaje_adicional NUMERIC(5,2) DEFAULT 0;

-- Comentario para documentar el campo
COMMENT ON COLUMN app_settings.starken_porcentaje_adicional IS 'Porcentaje adicional (puede ser negativo) a aplicar al costo de envío de Starken. Ej: 10 para agregar 10%, -5 para reducir 5%';

