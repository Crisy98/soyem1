import { pool } from "@/lib/db";
import { NextResponse } from "next/server";
import bcrypt from "bcrypt";

function generateRandomPassword(): string {
  return Array.from({ length: 12 }, () => Math.floor(Math.random() * 10)).join('');
}

export async function GET() {
  try {
    const result = await pool.query(
      `SELECT 
        c.idcomercio,
        c.nombrecomercio,
        c.fechaafiliacion,
        c.calle,
        c.numerocalle,
        c.localidad,
        c.activo,
        c.idrubro,
        c.idusuario,
        json_build_object(
          'idrubro', r.idrubro,
          'nombrerubro', r.nombrerubro
        ) as rubro,
        json_build_object(
          'id', u.id,
          'username', u.username
        ) as usuario
      FROM comercios c
      LEFT JOIN rubros r ON c.idrubro = r.idrubro
      LEFT JOIN users u ON c.idusuario = u.id
      ORDER BY c.nombrecomercio ASC`
    );

    return NextResponse.json(result.rows);
  } catch (err) {
    console.error("Error obteniendo comercios:", err);
    return NextResponse.json(
      { error: "Error obteniendo comercios" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const {
      nombrecomercio,
      fechaafiliacion,
      calle,
      numerocalle,
      localidad,
      idrubro,
    } = data;

    // Validaciones
    if (!nombrecomercio || !fechaafiliacion || !idrubro) {
      return NextResponse.json(
        { error: "Faltan campos obligatorios" },
        { status: 400 }
      );
    }

    // Verificar que el rubro existe
    const rubroExists = await pool.query(
      "SELECT idrubro FROM rubros WHERE idrubro = $1",
      [idrubro]
    );

    if (rubroExists.rowCount === 0) {
      return NextResponse.json(
        { error: "El rubro especificado no existe" },
        { status: 400 }
      );
    }

    // Iniciar transacción
    await pool.query('BEGIN');

    try {
      // 1. Generar datos de usuario
      const username = nombrecomercio.toLowerCase()
        .replace(/[^a-z0-9]/g, '') // Eliminar caracteres especiales
        .slice(0, 15); // Limitar longitud
      const password = generateRandomPassword();
      const hashedPassword = await bcrypt.hash(password, 10);

      // 2. Crear usuario
      const userResult = await pool.query(
        `INSERT INTO users (username, password_hash, roles)
         VALUES ($1, $2, 'comercio')
         RETURNING id`,
        [username, hashedPassword]
      );

      const userId = userResult.rows[0].id;

      // 3. Insertar comercio
      const comercioResult = await pool.query(
        `INSERT INTO comercios 
          (nombrecomercio, fechaafiliacion, calle, numerocalle, localidad, idrubro, idusuario, activo)
         VALUES ($1, $2, $3, $4, $5, $6, $7, true)
         RETURNING *`,
        [
          nombrecomercio,
          fechaafiliacion,
          calle || null,
          numerocalle || null,
          localidad || null,
          idrubro,
          userId,
        ]
      );

      // Confirmar transacción
      await pool.query('COMMIT');

      return NextResponse.json({
        message: "Comercio creado correctamente",
        comercio: comercioResult.rows[0],
        username,
        password, // Devolver en el nivel raíz para que el formulario lo capture
      });
    } catch (error) {
      // Si hay error, revertir la transacción
      await pool.query('ROLLBACK');
      throw error;
    }
  } catch (err) {
    console.error("Error creando comercio:", err);
    return NextResponse.json(
      { error: "Error creando comercio" },
      { status: 500 }
    );
  }
}