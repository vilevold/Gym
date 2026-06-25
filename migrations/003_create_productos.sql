CREATE TABLE IF NOT EXISTS productos (
  id BIGSERIAL PRIMARY KEY,
  nombre TEXT NOT NULL,
  descripcion TEXT DEFAULT '',
  precio DECIMAL(10,2) DEFAULT 0,
  categoria TEXT DEFAULT 'General',
  cantidad INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE productos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Acceso publico a productos"
  ON productos FOR ALL USING (true);

DROP TABLE IF EXISTS inventario CASCADE;
