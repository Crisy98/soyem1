-- =========================================
-- SCHEMA FINAL ACTUAL - SOYEM
-- Consolida todas las modificaciones aplicadas por la app actual
-- y alinea la BD con el código en src/app/api/*
-- =========================================

-- NOTA: Este script es idempotente si lo ejecutas sobre una BD vacía.
-- Si tienes una BD existente, usa primero scripts/migrar_desde_tu_script.sql

-- =========================================
-- (Opcional) Limpiar todo (peligroso: borra datos)
-- =========================================
-- DROP TABLE IF EXISTS movimiento_cuotas CASCADE;
-- DROP TABLE IF EXISTS movimientos CASCADE;
-- DROP TABLE IF EXISTS comercios CASCADE;
-- DROP TABLE IF EXISTS hijos CASCADE;
-- DROP TABLE IF EXISTS afiliados CASCADE;
-- DROP TABLE IF EXISTS personas CASCADE;
-- DROP TABLE IF EXISTS users CASCADE;
-- DROP TABLE IF EXISTS rubros CASCADE;
-- DROP TABLE IF EXISTS topes CASCADE;
-- DROP SEQUENCE IF EXISTS rubros_idrubro_seq CASCADE;
-- DROP SEQUENCE IF EXISTS comercios_idcomercio_seq CASCADE;

-- =========================================
-- 1) PERSONAS
-- =========================================
CREATE TABLE IF NOT EXISTS personas (
  dni BIGINT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  apellido VARCHAR(100) NOT NULL,
  fechanacimiento DATE NOT NULL,
  telefono BIGINT NOT NULL,
  email VARCHAR(100),
  sexo VARCHAR(20) NOT NULL
);

-- =========================================
-- 2) AFILIADOS (sin idusuario; relación 1-1 va desde users.idafiliado)
-- =========================================
CREATE TABLE IF NOT EXISTS afiliados (
  idafiliado SERIAL PRIMARY KEY,
  dni BIGINT NOT NULL UNIQUE,
  area VARCHAR(100) NOT NULL,
  cargo VARCHAR(100) NOT NULL,
  tipocontratacion VARCHAR(50) NOT NULL,
  legajo INT UNIQUE,
  categoria INT,
  fechaafiliacion DATE NOT NULL,
  fechamunicipio DATE,
  lugartrabajo VARCHAR(150),
  activo BOOLEAN DEFAULT TRUE,
  CONSTRAINT fk_persona_afiliado
    FOREIGN KEY (dni) REFERENCES personas(dni)
    ON UPDATE CASCADE ON DELETE RESTRICT
);

-- =========================================
-- 3) USERS (con idafiliado nullable; sin idcomercio)
-- =========================================
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  roles VARCHAR(20) NOT NULL DEFAULT 'afiliado',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  idafiliado INT NULL,
  CONSTRAINT fk_afiliado_user
    FOREIGN KEY (idafiliado) REFERENCES afiliados(idafiliado)
    ON UPDATE CASCADE ON DELETE SET NULL
);

-- Asegurar unicidad 1-1 entre users y afiliados (permite múltiples NULL)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname = 'public' AND indexname = 'users_idafiliado_key'
  ) THEN
    ALTER TABLE users ADD CONSTRAINT users_idafiliado_key UNIQUE (idafiliado);
  END IF;
END $$;

-- =========================================
-- 4) RUBROS
-- =========================================
CREATE SEQUENCE IF NOT EXISTS rubros_idrubro_seq START 1;
CREATE TABLE IF NOT EXISTS rubros (
  idrubro BIGINT PRIMARY KEY DEFAULT nextval('rubros_idrubro_seq'),
  nombrerubro VARCHAR(100) NOT NULL UNIQUE
);

-- =========================================
-- 5) COMERCIOS (relación via idusuario -> users.id)
-- =========================================
CREATE SEQUENCE IF NOT EXISTS comercios_idcomercio_seq START 1;
CREATE TABLE IF NOT EXISTS comercios (
  idcomercio BIGINT PRIMARY KEY DEFAULT nextval('comercios_idcomercio_seq'),
  nombrecomercio VARCHAR(150) NOT NULL,
  fechaafiliacion DATE NOT NULL,
  calle VARCHAR(150),
  numerocalle INT,
  localidad VARCHAR(100),
  activo BOOLEAN DEFAULT TRUE,
  idrubro BIGINT NOT NULL,
  idusuario INT NOT NULL UNIQUE,
  CONSTRAINT fk_rubro_comercio
    FOREIGN KEY (idrubro) REFERENCES rubros(idrubro)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_user_comercio
    FOREIGN KEY (idusuario) REFERENCES users(id)
    ON UPDATE CASCADE ON DELETE CASCADE
);

-- =========================================
-- 6) TOPES
-- =========================================
CREATE TABLE IF NOT EXISTS topes (
  idtope SERIAL PRIMARY KEY,
  fecha DATE NOT NULL UNIQUE,
  importe NUMERIC(10,2) NOT NULL
);

-- =========================================
-- 7) MOVIMIENTOS
-- =========================================
CREATE TABLE IF NOT EXISTS movimientos (
  idmovimiento SERIAL PRIMARY KEY,
  idcomercio BIGINT NOT NULL,
  idafiliado INT NOT NULL,
  fechacompra TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  importe NUMERIC(10,2) NOT NULL,
  cuotas INT NOT NULL DEFAULT 1,
  CONSTRAINT fk_movimiento_comercio
    FOREIGN KEY (idcomercio) REFERENCES comercios(idcomercio)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_movimiento_afiliado
    FOREIGN KEY (idafiliado) REFERENCES afiliados(idafiliado)
    ON UPDATE CASCADE ON DELETE RESTRICT
);

-- =========================================
-- 8) MOVIMIENTO_CUOTAS
-- =========================================
CREATE TABLE IF NOT EXISTS movimiento_cuotas (
  idcuota SERIAL PRIMARY KEY,
  idmovimiento INT NOT NULL,
  numerocuota INT NOT NULL,
  fechavencimiento DATE NOT NULL,
  importecuota NUMERIC(10,2) NOT NULL,
  pagado BOOLEAN DEFAULT FALSE,
  fechapago TIMESTAMP,
  CONSTRAINT fk_cuota_movimiento
    FOREIGN KEY (idmovimiento) REFERENCES movimientos(idmovimiento)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT unique_movimiento_numerocuota UNIQUE (idmovimiento, numerocuota)
);

-- =========================================
-- 9) HIJOS
-- =========================================
CREATE TABLE IF NOT EXISTS hijos (
  idhijo SERIAL PRIMARY KEY,
  dni BIGINT NOT NULL,
  nombre VARCHAR(100) NOT NULL,
  sexo VARCHAR(20),
  fechanacimiento DATE NOT NULL,
  CONSTRAINT fk_persona_hijo
    FOREIGN KEY (dni) REFERENCES personas(dni)
    ON UPDATE CASCADE ON DELETE CASCADE
);

-- =========================================
-- 10) ÍNDICES
-- =========================================
CREATE INDEX IF NOT EXISTS idx_afiliados_dni ON afiliados(dni);
CREATE INDEX IF NOT EXISTS idx_afiliados_activo ON afiliados(activo);
CREATE INDEX IF NOT EXISTS idx_comercios_activo ON comercios(activo);
CREATE INDEX IF NOT EXISTS idx_comercios_idrubro ON comercios(idrubro);
CREATE INDEX IF NOT EXISTS idx_movimientos_fechacompra ON movimientos(fechacompra);
CREATE INDEX IF NOT EXISTS idx_movimientos_comercio ON movimientos(idcomercio);
CREATE INDEX IF NOT EXISTS idx_movimientos_afiliado ON movimientos(idafiliado);
CREATE INDEX IF NOT EXISTS idx_cuotas_vencimiento ON movimiento_cuotas(fechavencimiento);
CREATE INDEX IF NOT EXISTS idx_cuotas_pagado ON movimiento_cuotas(pagado);

-- =========================================
-- 11) DATOS INICIALES
-- =========================================
INSERT INTO rubros (nombrerubro) VALUES 
  ('Gastronomía'),('Tecnología'),('Indumentaria'),('Salud'),('Educación'),
  ('Entretenimiento'),('Hogar'),('Automotor'),('Deportes'),('Otros')
ON CONFLICT (nombrerubro) DO NOTHING;

INSERT INTO topes (fecha, importe) VALUES ('2025-11-01', 50000.00)
ON CONFLICT (fecha) DO NOTHING;

-- Admin por defecto (password hash de "admin123"; cámbiala en producción)
INSERT INTO users (username, password_hash, roles, idafiliado)
VALUES ('admin', '$2b$10$rHj8YvF5s3mGNXVL0E0gVe7JZkGvJKH5xJ0LlZ9YvVKd5LNJ8.0qK', 'administrador', NULL)
ON CONFLICT (username) DO NOTHING;

-- =========================================
-- 12) VERIFICACIONES
-- =========================================
-- SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name;
-- SELECT 'users' t, COUNT(*) FROM users UNION ALL
-- SELECT 'personas', COUNT(*) FROM personas UNION ALL
-- SELECT 'afiliados', COUNT(*) FROM afiliados UNION ALL
-- SELECT 'comercios', COUNT(*) FROM comercios UNION ALL
-- SELECT 'rubros', COUNT(*) FROM rubros UNION ALL
-- SELECT 'topes', COUNT(*) FROM topes UNION ALL
-- SELECT 'movimientos', COUNT(*) FROM movimientos UNION ALL
-- SELECT 'movimiento_cuotas', COUNT(*) FROM movimiento_cuotas UNION ALL
-- SELECT 'hijos', COUNT(*) FROM hijos;
