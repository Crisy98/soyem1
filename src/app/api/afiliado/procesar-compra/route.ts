import { NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { pool } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const token = request.headers.get("cookie")?.split("token=")[1]?.split(";")[0];

    if (!token) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);

    const idAfiliado = payload.idafiliado as number;

    if (!idAfiliado) {
      return NextResponse.json({ error: "Usuario no es un afiliado" }, { status: 403 });
    }

    const body = await request.json();
    const { idComercio, nombreComercio, monto, cuotas, timestamp } = body;

    // Validar que el timestamp no sea muy antiguo (5 minutos)
    const ahora = Date.now();
    if (ahora - timestamp > 5 * 60 * 1000) {
      return NextResponse.json({ error: "El código QR ha expirado" }, { status: 400 });
    }

    // Validar saldo disponible
    const hoy = new Date();
    const diaActual = hoy.getDate();
    const mesActual = hoy.getMonth() + 1;
    const anioActual = hoy.getFullYear();

    // Si es día 20 o después, validar contra el mes siguiente
    let mesValidacion = mesActual;
    let anioValidacion = anioActual;
    
    if (diaActual >= 20) {
      mesValidacion = mesActual === 12 ? 1 : mesActual + 1;
      anioValidacion = mesActual === 12 ? anioActual + 1 : anioActual;
    }

    // Obtener el tope del mes a validar
    const resultTope = await pool.query(
      `SELECT importe 
       FROM topes 
       WHERE EXTRACT(MONTH FROM fecha) = $1 
         AND EXTRACT(YEAR FROM fecha) = $2
       ORDER BY fecha DESC
       LIMIT 1`,
      [mesValidacion, anioValidacion]
    );

    if (resultTope.rows.length === 0) {
      return NextResponse.json({ 
        error: "No hay tope definido para el mes a validar" 
      }, { status: 400 });
    }

    const tope = parseFloat(resultTope.rows[0].importe);

    // Calcular cuánto ya está comprometido para ese mes
    const primerDiaMes = new Date(anioValidacion, mesValidacion - 1, 1);
    const ultimoDiaMes = new Date(anioValidacion, mesValidacion, 0, 23, 59, 59);

    const resultGastado = await pool.query(
      `SELECT COALESCE(SUM(mc.importecuota), 0) as total_gastado
       FROM movimiento_cuotas mc
       JOIN movimientos m ON mc.idmovimiento = m.idmovimiento
       WHERE m.idafiliado = $1
         AND mc.fechavencimiento >= $2
         AND mc.fechavencimiento <= $3`,
      [idAfiliado, primerDiaMes, ultimoDiaMes]
    );

    const totalGastado = parseFloat(resultGastado.rows[0].total_gastado);
    const saldoDisponible = tope - totalGastado;

    // Verificar si hay saldo suficiente SOLO para la cuota del mes a validar
    const montoPorCuota = monto / cuotas;
    if (montoPorCuota > saldoDisponible) {
      return NextResponse.json({ 
        error: `Saldo insuficiente. Disponible: $${saldoDisponible.toFixed(2)}`,
        saldoDisponible,
        montoSolicitado: montoPorCuota
      }, { status: 400 });
    }

    // Iniciar transacción
    const client = await pool.connect();
    
    try {
      await client.query("BEGIN");

      // Insertar movimiento
      const resultMovimiento = await client.query(
        `INSERT INTO movimientos (idafiliado, idcomercio, fechacompra, importe, cuotas) 
         VALUES ($1, $2, NOW(), $3, $4) 
         RETURNING idmovimiento`,
        [idAfiliado, idComercio, monto, cuotas]
      );

      const idMovimiento = resultMovimiento.rows[0].idmovimiento;

      // Determinar mes de inicio según la fecha de compra
      const fechaCompra = new Date();
      const diaCompra = fechaCompra.getDate();
      
      // Si la compra es del día 20 en adelante, la primera cuota vence el mes siguiente
      const mesesADesfasar = diaCompra >= 20 ? 1 : 0;

      // Insertar cuotas
      for (let i = 1; i <= cuotas; i++) {
        // Calcular fecha de vencimiento
        const base = new Date();
        const vencYear = base.getUTCFullYear();
        const vencMonthIndex = base.getUTCMonth() + mesesADesfasar + (i - 1);
        // Fecha al mediodía UTC del primer día del mes objetivo para evitar retrocesos por huso horario
        const fechaVencimiento = new Date(Date.UTC(vencYear, vencMonthIndex, 1, 12, 0, 0));

        await client.query(
          `INSERT INTO movimiento_cuotas (idmovimiento, numerocuota, fechavencimiento, importecuota) 
           VALUES ($1, $2, $3, $4)`,
          [idMovimiento, i, fechaVencimiento, montoPorCuota]
        );
      }

      await client.query("COMMIT");

      // Guardar notificación para el comercio (usando una tabla temporal en memoria)
      // Por simplicidad, vamos a usar el response body con información adicional
      
      return NextResponse.json({
        success: true,
        idMovimiento,
        idComercio,
        nombreComercio,
        monto,
        cuotas,
        mensaje: "Compra procesada exitosamente",
      });
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Error en transacción:", error);
      return NextResponse.json({ error: "Error al procesar la compra" }, { status: 500 });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error procesando compra:", error);
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }
}
