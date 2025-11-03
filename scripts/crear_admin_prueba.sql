-- =========================================
-- Script para crear usuario administrador de prueba
-- =========================================

-- 1. Insertar persona de prueba
INSERT INTO personas (dni, nombre, apellido, fechanacimiento, telefono, email, sexo)
VALUES (
    12345678,
    'Administrador',
    'Prueba',
    '1990-01-01',
    1234567890,
    'admin@prueba.com',
    'Masculino'
)
ON CONFLICT (dni) DO NOTHING;

-- 2. Insertar afiliado de prueba (necesario para el usuario)
INSERT INTO afiliados (
    idafiliado,
    dni,
    area,
    cargo,
    tipocontratacion,
    legajo,
    categoria,
    fechaafiliacion,
    fechamunicipio,
    lugartrabajo,
    activo
)
VALUES (
    1,
    12345678,
    'Administración',
    'Administrador General',
    'Planta Permanente',
    1,
    1,
    '2024-01-01',
    '2024-01-01',
    'Sede Central',
    TRUE
)
ON CONFLICT (idafiliado) DO NOTHING;

-- 3. Insertar usuario administrador
-- Usuario: admin
-- Password: admin123 (deberías cambiarlo después)
-- Hash generado con bcrypt, rounds=10
-- ROL IMPORTANTE: Debe ser "administrador" (minúscula) para que funcione con el middleware
INSERT INTO users (username, password_hash, roles, idafiliado)
VALUES (
    'admin',
    '$2b$10$RyvaQ5m5pRjw8vyeHmhVgODJXl1kovmYJ.ELN.e4tK8bJnCu4254W',
    'administrador',
    1
)
ON CONFLICT (username) DO UPDATE 
SET password_hash = EXCLUDED.password_hash,
    roles = EXCLUDED.roles;

-- Verificar la creación
SELECT 
    u.id,
    u.username,
    u.roles,
    p.nombre,
    p.apellido,
    p.email,
    a.activo
FROM users u
JOIN afiliados a ON u.idafiliado = a.idafiliado
JOIN personas p ON a.dni = p.dni
WHERE u.username = 'admin';
