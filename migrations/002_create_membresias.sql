CREATE TABLE IF NOT EXISTS membresias (
  id BIGSERIAL PRIMARY KEY,
  usuario_id BIGINT UNIQUE NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  ultimo_pago TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE membresias ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Todos pueden leer membresias"
  ON membresias FOR SELECT
  USING (true);

CREATE POLICY "Todos pueden insertar membresias"
  ON membresias FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Todos pueden actualizar membresias"
  ON membresias FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Todos pueden eliminar membresias"
  ON membresias FOR DELETE
  USING (true);
