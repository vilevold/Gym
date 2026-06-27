CREATE TABLE IF NOT EXISTS ventas (
  id BIGSERIAL PRIMARY KEY,
  producto_id BIGINT NOT NULL REFERENCES productos(id),
  producto_nombre TEXT NOT NULL,
  cantidad INT NOT NULL,
  precio_unitario DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE ventas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Acceso publico a ventas"
  ON ventas FOR ALL USING (true);
