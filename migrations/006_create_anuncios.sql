CREATE TABLE IF NOT EXISTS anuncios (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  titulo TEXT NOT NULL,
  contenido TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE anuncios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Todos pueden leer anuncios"
  ON anuncios FOR SELECT
  USING (true);

CREATE POLICY "Solo admin puede insertar anuncios"
  ON anuncios FOR INSERT
  WITH CHECK (auth.uid() IS NULL);

CREATE POLICY "Solo admin puede eliminar anuncios"
  ON anuncios FOR DELETE
  USING (auth.uid() IS NULL);
