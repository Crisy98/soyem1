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

    async function obtenerSaldoYTope(mes: number, anio: number) {
      const resTope = await pool.query(
        `SELECT importe 
         FROM topes 
         WHERE EXTRACT(MONTH FROM fecha) = $1 
           AND EXTRACT(YEAR FROM fecha) = $2
         ORDER BY fecha DESC
         LIMIT 1`,
        [mes, anio]
      );
      if (resTope.rows.length === 0) return { tope: 0, totalGastado: 0, saldo: 0 };
      const topeVal = parseFloat(resTope.rows[0].importe);
      const primerDia = new Date(anio, mes - 1, 1);
      const ultimoDia = new Date(anio, mes, 0, 23, 59, 59);
      const resGastado = await pool.query(
        `SELECT COALESCE(SUM(mc.importecuota), 0) as total_gastado
         FROM movimiento_cuotas mc
         JOIN movimientos m ON mc.idmovimiento = m.idmovimiento
         WHERE m.idafiliado = $1
           AND mc.fechavencimiento >= $2
           AND mc.fechavencimiento <= $3`,
        [idAfiliado, primerDia, ultimoDia]
      );
      const totalGastadoVal = parseFloat(resGastado.rows[0].total_gastado);
      return { tope: topeVal, totalGastado: totalGastadoVal, saldo: topeVal - totalGastadoVal };
    }

    const { tope, totalGastado, saldo: saldoDisponible } = await obtenerSaldoYTope(mesValidacion, anioValidacion);
    const mesSiguiente = mesValidacion === 12 ? 1 : mesValidacion + 1;
    const anioSiguiente = mesValidacion === 12 ? anioValidacion + 1 : anioValidacion;
    const { tope: topeSiguiente, totalGastado: gastadoSiguiente, saldo: saldoMesSiguiente } = await obtenerSaldoYTope(mesSiguiente, anioSiguiente);

    return NextResponse.json({
      saldoDisponible: Math.max(0, saldoDisponible),
      tope,
      totalGastado,
      mesValidacion,
      anioValidacion,
      diaActual,
      mensaje: diaActual >= 20 
        ? `Validando contra el mes siguiente (${mesValidacion}/${anioValidacion})`
        : `Validando contra el mes actual (${mesValidacion}/${anioValidacion})`,
      mesSiguiente,
      anioSiguiente,
      topeMesSiguiente: topeSiguiente,
      totalGastadoMesSiguiente: gastadoSiguiente,
      saldoMesSiguiente
    });
  } catch (error) {
    console.error("Error obteniendo saldo disponible:", error);
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }
}
