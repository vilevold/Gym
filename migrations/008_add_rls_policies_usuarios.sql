ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Todos pueden leer usuarios"
  ON usuarios FOR SELECT
  USING (true);

CREATE POLICY "Todos pueden insertar usuarios"
  ON usuarios FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Todos pueden actualizar usuarios"
  ON usuarios FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Todos pueden eliminar usuarios"
  ON usuarios FOR DELETE
  USING (true);
