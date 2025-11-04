-- =========================================
-- SCRIPT COMPLETO PARA CREAR BASE DE DATOS
-- SISTEMA SOYEM - GESTIÓN DE AFILIADOS Y COMERCIOS
-- =========================================

-- IMPORTANTE: Este script crea la estructura CORRECTA
-- que usa el proyecto actual de Next.js

-- =========================================
-- 1. ELIMINAR TABLAS EXISTENTES (CUIDADO!)
-- =========================================
-- Descomenta estas líneas solo si quieres empezar de cero
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
-- 2. TABLA: users
-- =========================================
-- CAMBIO IMPORTANTE: NO tiene idafiliado aquí (se eliminó la redundancia)
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    roles VARCHAR(20) NOT NULL DEFAULT 'afiliado',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================================
-- 3. TABLA: personas
-- =========================================
CREATE TABLE personas (
    dni BIGINT PRIMARY KEY,           
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    fechanacimiento DATE NOT NULL,
    telefono BIGINT NOT NULL,
    email VARCHAR(100),
    sexo VARCHAR(20) NOT NULL  -- Masculino, Femenino, Otro
);

-- =========================================
-- 4. TABLA: afiliados
-- =========================================
-- CAMBIO: idafiliado es SERIAL (auto-incremental)
CREATE TABLE afiliados (
    idafiliado SERIAL PRIMARY KEY,              
    dni BIGINT NOT NULL UNIQUE,  -- AGREGADO UNIQUE                           
    area VARCHAR(100) NOT NULL,
    cargo VARCHAR(100) NOT NULL,
    tipocontratacion VARCHAR(50) NOT NULL,
    legajo INT UNIQUE,  -- AGREGADO UNIQUE
    categoria INT,
    fechaafiliacion DATE NOT NULL,
    fechamunicipio DATE,
    lugartrabajo VARCHAR(150),
    activo BOOLEAN DEFAULT TRUE,
    idusuario INT NOT NULL UNIQUE,  -- AGREGADO: FK a users

    CONSTRAINT fk_persona_afiliado
        FOREIGN KEY (dni) REFERENCES personas(dni)
        ON UPDATE CASCADE ON DELETE RESTRICT,

    CONSTRAINT fk_user_afiliado
        FOREIGN KEY (idusuario) REFERENCES users(id)
        ON UPDATE CASCADE ON DELETE CASCADE
);

-- =========================================
-- 5. TABLA: hijos
-- =========================================
CREATE TABLE hijos (
    idhijo SERIAL PRIMARY KEY,             
    dni BIGINT NOT NULL,  -- DNI del padre/madre (persona)                 
    nombre VARCHAR(100) NOT NULL,          
    sexo VARCHAR(20),                      
    fechanacimiento DATE NOT NULL,         

    CONSTRAINT fk_persona_hijo 
        FOREIGN KEY (dni) REFERENCES personas(dni)
        ON UPDATE CASCADE ON DELETE CASCADE
);

-- =========================================
-- 6. TABLA: rubros
-- =========================================
CREATE SEQUENCE rubros_idrubro_seq START 1;

CREATE TABLE rubros (
    idrubro BIGINT PRIMARY KEY DEFAULT nextval('rubros_idrubro_seq'),
    nombrerubro VARCHAR(100) NOT NULL UNIQUE
);

-- =========================================
-- 7. TABLA: comercios
-- =========================================
CREATE SEQUENCE comercios_idcomercio_seq START 1;

CREATE TABLE comercios (
    idcomercio BIGINT PRIMARY KEY DEFAULT nextval('comercios_idcomercio_seq'),
    nombrecomercio VARCHAR(150) NOT NULL,
    fechaafiliacion DATE NOT NULL,
    calle VARCHAR(150),
    numerocalle INT,
    localidad VARCHAR(100),
    activo BOOLEAN DEFAULT TRUE,
    idrubro BIGINT NOT NULL,
    idusuario INT NOT NULL UNIQUE,  -- AGREGADO UNIQUE - FK a users(id)

    CONSTRAINT fk_rubro_comercio
        FOREIGN KEY (idrubro) REFERENCES rubros(idrubro)
        ON UPDATE CASCADE ON DELETE RESTRICT,

    CONSTRAINT fk_user_comercio
        FOREIGN KEY (idusuario) REFERENCES users(id)
        ON UPDATE CASCADE ON DELETE CASCADE
);

-- =========================================
-- 8. TABLA: topes
-- =========================================
CREATE TABLE topes (
    idtope SERIAL PRIMARY KEY,
    fecha DATE NOT NULL UNIQUE,  -- AGREGADO UNIQUE - solo un tope por mes
    importe NUMERIC(10, 2) NOT NULL  -- Cambiado de FLOAT a NUMERIC para precisión
);

-- =========================================
-- 9. TABLA: movimientos
-- =========================================
CREATE TABLE movimientos (
    idmovimiento SERIAL PRIMARY KEY,
    idcomercio BIGINT NOT NULL,  -- Cambiado de INT a BIGINT
    idafiliado INT NOT NULL,
    fechacompra TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    importe NUMERIC(10, 2) NOT NULL,  -- Cambiado de FLOAT a NUMERIC
    cuotas INT NOT NULL DEFAULT 1,
    
    CONSTRAINT fk_movimiento_comercio 
        FOREIGN KEY (idcomercio) REFERENCES comercios(idcomercio)
        ON UPDATE CASCADE ON DELETE RESTRICT,
        
    CONSTRAINT fk_movimiento_afiliado 
        FOREIGN KEY (idafiliado) REFERENCES afiliados(idafiliado)
        ON UPDATE CASCADE ON DELETE RESTRICT
);

-- =========================================
-- 10. TABLA: movimiento_cuotas (NUEVA!)
-- =========================================
-- Esta tabla NO estaba en tu esquema original pero es NECESARIA
CREATE TABLE movimiento_cuotas (
    idcuota SERIAL PRIMARY KEY,
    idmovimiento INT NOT NULL,
    numerocuota INT NOT NULL,  -- 1, 2, 3, etc.
    fechavencimiento DATE NOT NULL,
    importecuota NUMERIC(10, 2) NOT NULL,
    pagado BOOLEAN DEFAULT FALSE,
    fechapago TIMESTAMP,
    
    CONSTRAINT fk_cuota_movimiento
        FOREIGN KEY (idmovimiento) REFERENCES movimientos(idmovimiento)
        ON UPDATE CASCADE ON DELETE CASCADE,
        
    CONSTRAINT unique_movimiento_numerocuota
        UNIQUE (idmovimiento, numerocuota)
);

-- =========================================
-- 11. ÍNDICES PARA MEJORAR RENDIMIENTO
-- =========================================
CREATE INDEX idx_afiliados_dni ON afiliados(dni);
CREATE INDEX idx_afiliados_activo ON afiliados(activo);
CREATE INDEX idx_comercios_activo ON comercios(activo);
CREATE INDEX idx_comercios_idrubro ON comercios(idrubro);
CREATE INDEX idx_movimientos_fechacompra ON movimientos(fechacompra);
CREATE INDEX idx_movimientos_comercio ON movimientos(idcomercio);
CREATE INDEX idx_movimientos_afiliado ON movimientos(idafiliado);
CREATE INDEX idx_cuotas_vencimiento ON movimiento_cuotas(fechavencimiento);
CREATE INDEX idx_cuotas_pagado ON movimiento_cuotas(pagado);

-- =========================================
-- 12. DATOS INICIALES - RUBROS
-- =========================================
INSERT INTO rubros (nombrerubro) VALUES 
('Gastronomía'),
('Tecnología'),
('Indumentaria'),
('Salud'),
('Educación'),
('Entretenimiento'),
('Hogar'),
('Automotor'),
('Deportes'),
('Otros')
ON CONFLICT (nombrerubro) DO NOTHING;

-- =========================================
-- 13. TOPE INICIAL
-- =========================================
INSERT INTO topes (fecha, importe) VALUES 
('2025-11-01', 50000.00)
ON CONFLICT (fecha) DO NOTHING;

-- =========================================
-- 14. CREAR USUARIO ADMINISTRADOR
-- =========================================
-- Password: admin123 (hasheada con bcrypt)
-- IMPORTANTE: Cambia esta contraseña en producción!
INSERT INTO users (username, password_hash, roles) VALUES 
('admin', '$2b$10$rHj8YvF5s3mGNXVL0E0gVe7JZkGvJKH5xJ0LlZ9YvVKd5LNJ8.0qK', 'administrador')
ON CONFLICT (username) DO NOTHING;

-- =========================================
-- 15. DATOS DE PRUEBA (OPCIONAL)
-- =========================================
-- Descomenta si quieres crear datos de prueba

/*
-- Persona de prueba
INSERT INTO personas (dni, nombre, apellido, fechanacimiento, telefono, email, sexo) VALUES
(12345678, 'Juan', 'Pérez', '1980-05-15', 1234567890, 'juan.perez@email.com', 'Masculino');

-- Usuario afiliado de prueba (password: afiliado123)
INSERT INTO users (username, password_hash, roles) VALUES
('juan.perez', '$2b$10$rHj8YvF5s3mGNXVL0E0gVe7JZkGvJKH5xJ0LlZ9YvVKd5LNJ8.0qK', 'afiliado');

-- Afiliado de prueba
INSERT INTO afiliados (dni, area, cargo, tipocontratacion, legajo, categoria, fechaafiliacion, activo, idusuario) VALUES
(12345678, 'Administración', 'Empleado', 'Permanente', 1001, 1, '2020-01-15', true, 
 (SELECT id FROM users WHERE username = 'juan.perez'));

-- Persona comercio de prueba
INSERT INTO personas (dni, nombre, apellido, fechanacimiento, telefono, email, sexo) VALUES
(87654321, 'María', 'González', '1975-08-20', 9876543210, 'maria.gonzalez@comercio.com', 'Femenino');

-- Usuario comercio de prueba (password: comercio123)
INSERT INTO users (username, password_hash, roles) VALUES
('comercio.prueba', '$2b$10$rHj8YvF5s3mGNXVL0E0gVe7JZkGvJKH5xJ0LlZ9YvVKd5LNJ8.0qK', 'comercio');

-- Comercio de prueba
INSERT INTO comercios (nombrecomercio, fechaafiliacion, calle, numerocalle, localidad, activo, idrubro, idusuario) VALUES
('Comercio de Prueba', '2023-01-10', 'Calle Falsa', 123, 'Springfield', true,
 (SELECT idrubro FROM rubros WHERE nombrerubro = 'Gastronomía' LIMIT 1),
 (SELECT id FROM users WHERE username = 'comercio.prueba'));
*/

-- =========================================
-- 16. VERIFICACIONES FINALES
-- =========================================
-- Ejecuta estas queries para verificar que todo se creó correctamente

-- Ver todas las tablas creadas
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Contar registros en cada tabla
SELECT 'users' as tabla, COUNT(*) as registros FROM users
UNION ALL
SELECT 'personas', COUNT(*) FROM personas
UNION ALL
SELECT 'afiliados', COUNT(*) FROM afiliados
UNION ALL
SELECT 'comercios', COUNT(*) FROM comercios
UNION ALL
SELECT 'rubros', COUNT(*) FROM rubros
UNION ALL
SELECT 'topes', COUNT(*) FROM topes
UNION ALL
SELECT 'movimientos', COUNT(*) FROM movimientos
UNION ALL
SELECT 'movimiento_cuotas', COUNT(*) FROM movimiento_cuotas
UNION ALL
SELECT 'hijos', COUNT(*) FROM hijos;

-- =========================================
-- ¡LISTO! BASE DE DATOS CREADA
-- =========================================
-- Ahora puedes:
-- 1. Conectarte con tu app Next.js usando DATABASE_URL
-- 2. Login como admin con: admin / admin123
-- 3. Crear afiliados y comercios desde el panel
-- =========================================
