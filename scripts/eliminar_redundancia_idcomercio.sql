-- =========================================
-- Script para eliminar redundancia idcomercio de users
-- =========================================

-- PASO 1: Verificar la estructura actual
SELECT 
    u.id,
    u.username,
    u.roles,
    u.idcomercio as "idcomercio en users (REDUNDANTE)",
    c.idcomercio as "idcomercio real",
    c.nombrecomercio
FROM users u
LEFT JOIN comercios c ON u.id = c.idusuario
WHERE u.roles = 'comercio';

-- PASO 2: Backup - Guardar datos antes de modificar (opcional)
-- CREATE TABLE users_backup AS SELECT * FROM users;

-- PASO 3: Eliminar la columna idcomercio de users
ALTER TABLE users DROP COLUMN IF EXISTS idcomercio;

-- PASO 4: Verificar que se eliminó correctamente
\d users

-- PASO 5: Verificar que todo sigue funcionando
-- La relación ahora es: users.id <- comercios.idusuario
SELECT 
    u.id as user_id,
    u.username,
    u.roles,
    c.idcomercio,
    c.nombrecomercio
FROM users u
INNER JOIN comercios c ON u.id = c.idusuario
WHERE u.roles = 'comercio';

-- =========================================
-- RESUMEN:
-- =========================================
-- ANTES: users.idcomercio <-> comercios.idusuario (REDUNDANTE)
-- DESPUÉS: users.id <- comercios.idusuario (LIMPIO)
