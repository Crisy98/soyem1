import { NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { pool } from "@/lib/db";

export async function GET(request: Request) {
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

    // Determinar el mes que corresponde según la fecha actual
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
        error: "No hay tope definido para el mes",
        saldoDisponible: 0,
        tope: 0
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

    return NextResponse.json({
      saldoDisponible: Math.max(0, saldoDisponible),
      tope,
      totalGastado,
      mesValidacion,
      anioValidacion,
      diaActual,
      mensaje: diaActual >= 20 
        ? `Validando contra el mes siguiente (${mesValidacion}/${anioValidacion})`
        : `Validando contra el mes actual (${mesValidacion}/${anioValidacion})`
    });
  } catch (error) {
    console.error("Error obteniendo saldo disponible:", error);
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }
}
