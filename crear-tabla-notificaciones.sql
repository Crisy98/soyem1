-- Tabla para notificaciones temporales
CREATE TABLE IF NOT EXISTS notificaciones_compra (
  id SERIAL PRIMARY KEY,
  idcomercio INT NOT NULL,
  idmovimiento INT NOT NULL,
  monto FLOAT NOT NULL,
  cuotas INT NOT NULL,
  nombre_afiliado VARCHAR(200),
  fecha_creacion TIMESTAMP DEFAULT NOW(),
  leida BOOLEAN DEFAULT FALSE
);

-- Índice para consultas rápidas
CREATE INDEX IF NOT EXISTS idx_notificaciones_comercio ON notificaciones_compra(idcomercio, leida);
