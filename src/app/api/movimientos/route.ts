import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

export async function GET() {
  try {
    const result = await pool.query(`
      SELECT 
        mc.idcuota,
        mc.idmovimiento,
        mc.numerocuota,
        mc.fechavencimiento,
        mc.importecuota,
        m.fechacompra,
        m.importe as importetotal,
        m.cuotas as totalcuotas,
        c.idcomercio,
        c.nombrecomercio,
        c.localidad,
        a.idafiliado,
        a.legajo,
        a.activo,
        p.nombre,
        p.apellido,
        p.dni,
        p.email
      FROM movimiento_cuotas mc
      JOIN movimientos m ON mc.idmovimiento = m.idmovimiento
      LEFT JOIN comercios c ON m.idcomercio = c.idcomercio
      LEFT JOIN afiliados a ON m.idafiliado = a.idafiliado
      LEFT JOIN personas p ON a.dni = p.dni
      ORDER BY mc.fechavencimiento DESC, mc.numerocuota ASC
    `);

    const { rows } = result;

    const formattedMovimientos = rows.map((row: any) => ({
      idcuota: row.idcuota,
      idmovimiento: row.idmovimiento,
      numeroCuota: row.numerocuota,
      totalCuotas: row.totalcuotas,
      fechaVencimiento: row.fechavencimiento,
      importeCuota: parseFloat(row.importecuota),
      fechaCompra: row.fechacompra,
      importeTotal: parseFloat(row.importetotal),
      comercio: {
        idcomercio: row.idcomercio,
        nombrecomercio: row.nombrecomercio,
        localidad: row.localidad
      },
      afiliado: {
        idafiliado: row.idafiliado,
        legajo: row.legajo,
        activo: row.activo,
        persona: {
          nombre: row.nombre,
          apellido: row.apellido,
          dni: row.dni,
          email: row.email
        }
      }
    }));

    return NextResponse.json(formattedMovimientos);
  } catch (error) {
    console.error('Error al obtener movimientos:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}