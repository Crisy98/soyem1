-- =========================================
-- GUÍA COMPLETA: Eliminar redundancia idcomercio
-- =========================================

-- =============================================
-- PASO 1: BACKUP (Recomendado)
-- =============================================
CREATE TABLE users_backup AS SELECT * FROM users;
-- Para restaurar en caso de error: 
-- DROP TABLE users; 
-- ALTER TABLE users_backup RENAME TO users;

-- =============================================
-- PASO 2: Verificar estructura actual
-- =============================================
SELECT 
    u.id,
    u.username,
    u.roles,
    u.idcomercio as "idcomercio_en_users (REDUNDANTE)",
    c.idcomercio as "idcomercio_real",
    c.nombrecomercio,
    c.idusuario
FROM users u
LEFT JOIN comercios c ON u.id = c.idusuario
WHERE u.roles = 'comercio'
ORDER BY u.id;

-- =============================================
-- PASO 3: Eliminar columna idcomercio de users
-- =============================================
ALTER TABLE users DROP COLUMN IF EXISTS idcomercio;

-- =============================================
-- PASO 4: Verificar estructura nueva
-- =============================================
\d users

-- Deberías ver algo como:
-- Column      | Type          | 
-- id          | integer       | 
-- username    | varchar(50)   | 
-- password_hash| text         | 
-- roles       | varchar(20)   | 
-- idafiliado  | integer       |
-- (sin idcomercio)

-- =============================================
-- PASO 5: Verificar relaciones
-- =============================================

-- Verificar comercios
SELECT 
    u.id as user_id,
    u.username,
    u.roles,
    c.idcomercio,
    c.nombrecomercio
FROM users u
INNER JOIN comercios c ON u.id = c.idusuario
WHERE u.roles = 'comercio'
ORDER BY c.idcomercio;

-- Verificar afiliados
SELECT 
    u.id as user_id,
    u.username,
    u.roles,
    a.idafiliado,
    p.nombre,
    p.apellido
FROM users u
INNER JOIN afiliados a ON u.idafiliado = a.idafiliado
INNER JOIN personas p ON a.dni = p.dni
WHERE u.roles = 'afiliado'
ORDER BY a.idafiliado;

-- =============================================
-- RESULTADO ESPERADO
-- =============================================
-- ✅ La columna idcomercio ya no existe en users
-- ✅ La relación users <-> comercios funciona via: users.id <- comercios.idusuario
-- ✅ Todos los comercios siguen enlazados correctamente
-- ✅ Código actualizado usa JOIN para obtener idcomercio cuando sea necesario

-- =============================================
-- ROLLBACK (Solo si algo salió mal)
-- =============================================
-- DROP TABLE users;
-- ALTER TABLE users_backup RENAME TO users;
