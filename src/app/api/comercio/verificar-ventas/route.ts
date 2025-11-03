import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { pool } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key');
    const { payload } = await jwtVerify(token, secret);
    const idComercio = payload.idcomercio as number;

    if (!idComercio) {
      return NextResponse.json({ error: 'Usuario no es un comercio' }, { status: 403 });
    }

    // Obtener el timestamp del último check (query param)
    const ultimoCheck = request.nextUrl.searchParams.get('desde');
    const fechaDesde = ultimoCheck ? new Date(parseInt(ultimoCheck)) : new Date(Date.now() - 60000); // último minuto

    // Buscar movimientos nuevos
    const result = await pool.query(
      `SELECT m.idmovimiento, m.importe as monto, m.cuotas, m.fechacompra,
              CONCAT(p.apellido, ', ', p.nombre) as nombre_afiliado
       FROM movimientos m
       JOIN afiliados a ON m.idafiliado = a.idafiliado
       JOIN personas p ON a.dni = p.dni
       WHERE m.idcomercio = $1 AND m.fechacompra > $2
       ORDER BY m.fechacompra DESC
       LIMIT 1`,
      [idComercio, fechaDesde]
    );

    if (result.rows.length > 0) {
      return NextResponse.json({
        nuevaVenta: true,
        datos: result.rows[0]
      });
    }

    return NextResponse.json({ nuevaVenta: false });
  } catch (error) {
    console.error('Error verificando ventas:', error);
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}
