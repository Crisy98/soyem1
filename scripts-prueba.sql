-- =========================================
-- SCRIPT DE PRUEBA PARA SISTEMA DE COMPRAS
-- =========================================

-- 1. Verificar comercios existentes
SELECT c.idcomercio, c.nombrecomercio, u.username 
FROM comercios c
INNER JOIN users u ON c.idusuario = u.id
WHERE c.activo = true;

-- 2. Verificar afiliados existentes
SELECT a.idafiliado, p.nombre, p.apellido, u.username
FROM afiliados a
INNER JOIN personas p ON a.dni = p.dni
INNER JOIN users u ON u.idafiliado = a.idafiliado
WHERE a.activo = true;

-- 3. Verificar topes del mes actual (Noviembre 2025)
SELECT * FROM topes 
WHERE EXTRACT(MONTH FROM fecha) = 11 
  AND EXTRACT(YEAR FROM fecha) = 2025;

-- 4. Si NO tienes un tope para noviembre, créalo:
INSERT INTO topes (fecha, importe) 
VALUES ('2025-11-01', 5000.00);

-- 5. Ver movimientos existentes
SELECT m.idmovimiento, c.nombrecomercio, p.nombre, p.apellido, 
       m.fechacompra, m.importe, m.cuotas
FROM movimientos m
INNER JOIN comercios c ON m.idcomercio = c.idcomercio
INNER JOIN afiliados a ON m.idafiliado = a.idafiliado
INNER JOIN personas p ON a.dni = p.dni
ORDER BY m.fechacompra DESC;

-- 6. Ver cuotas existentes
SELECT mc.idcuota, mc.numerocuota, mc.fechavencimiento, mc.importecuota,
       c.nombrecomercio, p.nombre, p.apellido
FROM movimiento_cuotas mc
INNER JOIN movimientos m ON mc.idmovimiento = m.idmovimiento
INNER JOIN comercios c ON m.idcomercio = c.idcomercio
INNER JOIN afiliados a ON m.idafiliado = a.idafiliado
INNER JOIN personas p ON a.dni = p.dni
ORDER BY mc.fechavencimiento;
