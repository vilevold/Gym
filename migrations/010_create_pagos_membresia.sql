CREATE TABLE IF NOT EXISTS pagos_membresia (
  id BIGSERIAL PRIMARY KEY,
  usuario_id BIGINT NOT NULL REFERENCES usuarios(id),
  usuario_nombre TEXT NOT NULL,
  periodo TEXT NOT NULL,
  precio DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE pagos_membresia ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Acceso publico a pagos_membresia"
  ON pagos_membresia FOR ALL USING (true);
