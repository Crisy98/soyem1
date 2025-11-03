const bcrypt = require('bcrypt');

// Generar hash para la contraseña "admin123"
const password = 'admin123';
const saltRounds = 10;

bcrypt.hash(password, saltRounds, (err, hash) => {
  if (err) {
    console.error('Error generando hash:', err);
    return;
  }
  
  console.log('\n==============================================');
  console.log('HASH GENERADO PARA USUARIO ADMINISTRADOR');
  console.log('==============================================');
  console.log('Usuario: admin');
  console.log('Contraseña: admin123');
  console.log('Hash:', hash);
  console.log('==============================================\n');
  
  // SQL completo con el hash real
  console.log('-- Script SQL completo:');
  console.log(`
-- 1. Insertar persona de prueba
INSERT INTO personas (dni, nombre, apellido, fechanacimiento, telefono, email, sexo)
VALUES (
    12345678,
    'Admin',
    'Prueba',
    '1990-01-01',
    1234567890,
    'admin@prueba.com',
    'Masculino'
)
ON CONFLICT (dni) DO NOTHING;

-- 2. Insertar afiliado de prueba
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
-- Contraseña: admin123
INSERT INTO users (username, password_hash, roles, idafiliado)
VALUES (
    'admin',
    '${hash}',
    'admin',
    1
)
ON CONFLICT (username) DO UPDATE 
SET password_hash = EXCLUDED.password_hash,
    roles = EXCLUDED.roles;

-- Verificar
SELECT 
    u.id,
    u.username,
    u.roles,
    p.nombre,
    p.apellido,
    p.email
FROM users u
JOIN afiliados a ON u.idafiliado = a.idafiliado
JOIN personas p ON a.dni = p.dni
WHERE u.username = 'admin';
`);
});
