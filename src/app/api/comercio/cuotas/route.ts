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

    const idComercio = payload.idcomercio as number;

    if (!idComercio) {
      return NextResponse.json({ error: "Usuario no es un comercio" }, { status: 403 });
    }

    // Obtener todas las cuotas de ventas de este comercio con datos del afiliado
    const result = await pool.query(
      `SELECT 
        mc.idcuota,
        mc.idmovimiento,
        mc.numerocuota,
        mc.fechavencimiento,
        mc.importecuota,
        m.fechacompra,
        m.cuotas as total_cuotas,
        CONCAT(p.apellido, ', ', p.nombre) as afiliado_nombre
       FROM movimiento_cuotas mc
       INNER JOIN movimientos m ON mc.idmovimiento = m.idmovimiento
       INNER JOIN afiliados a ON m.idafiliado = a.idafiliado
       INNER JOIN personas p ON a.dni = p.dni
       WHERE m.idcomercio = $1
       ORDER BY mc.fechavencimiento ASC`,
      [idComercio]
    );

    return NextResponse.json({
      cuotas: result.rows,
    });
  } catch (error) {
    console.error("Error obteniendo cuotas del comercio:", error);
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }
}
