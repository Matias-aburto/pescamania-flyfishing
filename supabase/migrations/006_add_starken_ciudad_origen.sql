-- Agregar campo starken_ciudad_origen a app_settings
ALTER TABLE app_settings
ADD COLUMN IF NOT EXISTS starken_ciudad_origen INTEGER;

-- Comentario para documentar el campo
COMMENT ON COLUMN app_settings.starken_ciudad_origen IS 'Código numérico de la ciudad de origen para calcular tarifas de envío con Starken';

