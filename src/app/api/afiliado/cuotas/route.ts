import { pool } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

interface DecodedToken {
  id: number;
  roles: string;
  idafiliado: number;
  activo: boolean;
}

export async function GET(req: NextRequest) {
  try {
    // Obtener token
    const token = req.cookies.get("token")?.value;

    if (!token) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Verificar token
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    const decoded = payload as unknown as DecodedToken;

    // Verificar que sea un afiliado
    if (decoded.roles !== "afiliado") {
      return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
    }

    if (!decoded.idafiliado) {
      return NextResponse.json({ error: "Afiliado no encontrado" }, { status: 404 });
    }

    // Consultar cuotas del afiliado
    const resultCuotas = await pool.query(
      `SELECT 
        mc.idcuota,
        mc.idmovimiento,
        mc.numerocuota,
        mc.fechavencimiento,
        mc.importecuota,
        false as pagada,
        c.nombrecomercio as comercio_nombre,
        m.fechacompra,
        m.cuotas as total_cuotas
       FROM movimiento_cuotas mc
       JOIN movimientos m ON mc.idmovimiento = m.idmovimiento
       JOIN comercios c ON m.idcomercio = c.idcomercio
       WHERE m.idafiliado = $1
       ORDER BY mc.fechavencimiento DESC`,
      [decoded.idafiliado]
    );

    // Consultar topes
    const resultTopes = await pool.query(
      `SELECT 
        EXTRACT(MONTH FROM fecha) as mes,
        EXTRACT(YEAR FROM fecha) as anio,
        importe
       FROM topes
       ORDER BY fecha DESC`
    );

    // Normalizar tipos numéricos para evitar strings en el cliente
    type CuotaRow = {
      importecuota: number | string | null;
      total_cuotas: number | string | null;
      numerocuota: number | string | null;
      [key: string]: unknown;
    };

    type TopeRow = {
      mes: number | string | null;
      anio: number | string | null;
      importe: number | string | null;
      [key: string]: unknown;
    };

    const cuotas = resultCuotas.rows.map((row: CuotaRow) => ({
      ...row,
      importecuota: Number(row.importecuota) || 0,
      total_cuotas: Number(row.total_cuotas) || 0,
      numerocuota: Number(row.numerocuota) || 0,
    }));

    const topes = resultTopes.rows.map((row: TopeRow) => ({
      ...row,
      mes: Number(row.mes) || 0,
      anio: Number(row.anio) || 0,
      importe: Number(row.importe) || 0,
    }));

    return NextResponse.json({
      cuotas,
      topes,
    });
  } catch (error) {
    console.error("Error obteniendo cuotas:", error);
    return NextResponse.json(
      { error: "Error al obtener cuotas" },
      { status: 500 }
    );
  }
}
