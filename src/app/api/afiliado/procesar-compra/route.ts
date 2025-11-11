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

    // Validación de saldo disponible (permitiendo diferir al mes siguiente si no alcanza este mes)
    const hoy = new Date();
    const diaActual = hoy.getDate();
    const mesActual = hoy.getMonth() + 1;
    const anioActual = hoy.getFullYear();

    const montoPorCuota = monto / cuotas;

    async function obtenerSaldoDisponibleMes(mes: number, anio: number) {
      const resTope = await pool.query(
        `SELECT importe 
         FROM topes 
         WHERE EXTRACT(MONTH FROM fecha) = $1 
           AND EXTRACT(YEAR FROM fecha) = $2
         ORDER BY fecha DESC
         LIMIT 1`,
        [mes, anio]
      );
      if (resTope.rows.length === 0) return { tope: 0, saldo: 0 };
      const topeMes = parseFloat(resTope.rows[0].importe);
      const primerDiaMesTmp = new Date(anio, mes - 1, 1);
      const ultimoDiaMesTmp = new Date(anio, mes, 0, 23, 59, 59);
      const resGastado = await pool.query(
        `SELECT COALESCE(SUM(mc.importecuota), 0) as total_gastado
         FROM movimiento_cuotas mc
         JOIN movimientos m ON mc.idmovimiento = m.idmovimiento
         WHERE m.idafiliado = $1
           AND mc.fechavencimiento >= $2
           AND mc.fechavencimiento <= $3`,
        [idAfiliado, primerDiaMesTmp, ultimoDiaMesTmp]
      );
      const totalGastadoMes = parseFloat(resGastado.rows[0].total_gastado);
      return { tope: topeMes, saldo: topeMes - totalGastadoMes };
    }

    // Por regla general: si es día >=20, validar contra el mes siguiente
    let mesValidacion = mesActual;
    let anioValidacion = anioActual;
    let mesesADesfasar = 0;
    if (diaActual >= 20) {
      mesValidacion = mesActual === 12 ? 1 : mesActual + 1;
      anioValidacion = mesActual === 12 ? anioActual + 1 : anioActual;
      mesesADesfasar = 1;
    }

    // Calcular saldo para el mes de validación inicial
    const { saldo: saldoMesInicial } = await obtenerSaldoDisponibleMes(mesValidacion, anioValidacion);

    if (montoPorCuota > saldoMesInicial) {
      // Intentar diferir al mes siguiente sólo si aún no estábamos ya en el mes siguiente
      const siguienteMes = mesValidacion === 12 ? 1 : mesValidacion + 1;
      const siguienteAnio = mesValidacion === 12 ? anioValidacion + 1 : anioValidacion;
      const { saldo: saldoMesSiguiente } = await obtenerSaldoDisponibleMes(siguienteMes, siguienteAnio);

      if (montoPorCuota <= saldoMesSiguiente) {
        // Aceptar diferir: primera cuota el mes siguiente al de validación inicial
        mesValidacion = siguienteMes;
        anioValidacion = siguienteAnio;
        // mesesADesfasar será recalculado en base a mes/año final más abajo
      } else {
        return NextResponse.json({ 
          error: `Saldo insuficiente. Disponible este mes: $${saldoMesInicial.toFixed(2)} y mes siguiente: $${saldoMesSiguiente.toFixed(2)}`,
          saldoMesInicial,
          saldoMesSiguiente,
          montoSolicitado: montoPorCuota
        }, { status: 400 });
      }
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

  // Determinar mes de inicio según la validación final (puede estar diferida)
  const fechaCompra = new Date();
  // Recalcular mesesADesfasar con respecto al mes/año final decidido
  const base = new Date();
  const baseYear = base.getUTCFullYear();
  const baseMonthIndex = base.getUTCMonth();
  const targetMonthIndex = mesValidacion - 1; // 0-11
  const monthsDiff = (anioValidacion - baseYear) * 12 + (targetMonthIndex - baseMonthIndex);
  mesesADesfasar = Math.max(0, monthsDiff);

      // Insertar cuotas
      for (let i = 1; i <= cuotas; i++) {
        // Calcular fecha de vencimiento
  const base2 = new Date();
  const vencYear = base2.getUTCFullYear();
  const vencMonthIndex = base2.getUTCMonth() + mesesADesfasar + (i - 1);
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
