-- Añade columnas de tiempo de inicio/fin y duración a la tabla surveys
-- Permite al supervisor analizar cuánto tiempo invierte cada GVM en cada PDV

ALTER TABLE surveys
  ADD COLUMN IF NOT EXISTS started_at    TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS completed_at  TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS duration_seconds INTEGER;

-- Índice para consultas por duración en el dashboard del supervisor
CREATE INDEX IF NOT EXISTS idx_surveys_duration ON surveys (duration_seconds)
  WHERE duration_seconds IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_surveys_started_at ON surveys (started_at)
  WHERE started_at IS NOT NULL;

COMMENT ON COLUMN surveys.started_at IS
  'Timestamp ISO cuando el GVM abrió el formulario del levantamiento';
COMMENT ON COLUMN surveys.completed_at IS
  'Timestamp ISO cuando el GVM confirmó el envío del levantamiento';
COMMENT ON COLUMN surveys.duration_seconds IS
  'Duración total del levantamiento en segundos (completed_at - started_at)';
