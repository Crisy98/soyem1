-- =========================================
-- Script para corregir idcomercio en users
-- =========================================

-- Este script actualiza los usuarios de tipo comercio
-- que tienen idcomercio NULL, enlazándolos con su comercio correspondiente

-- 1. Ver los usuarios comercio sin idcomercio
SELECT 
    u.id as user_id,
    u.username,
    u.roles,
    u.idcomercio,
    c.idcomercio as comercio_id,
    c.nombrecomercio
FROM users u
LEFT JOIN comercios c ON u.id = c.idusuario
WHERE u.roles = 'comercio' 
  AND u.idcomercio IS NULL;

-- 2. Actualizar los usuarios comercio con su idcomercio correspondiente
UPDATE users u
SET idcomercio = c.idcomercio
FROM comercios c
WHERE u.id = c.idusuario
  AND u.roles = 'comercio'
  AND u.idcomercio IS NULL;

-- 3. Verificar que se actualizaron correctamente
SELECT 
    u.id as user_id,
    u.username,
    u.roles,
    u.idcomercio,
    c.nombrecomercio
FROM users u
INNER JOIN comercios c ON u.idcomercio = c.idcomercio
WHERE u.roles = 'comercio'
ORDER BY u.id;

-- Resultado esperado:
-- Todos los usuarios comercio deberían tener su idcomercio completado
