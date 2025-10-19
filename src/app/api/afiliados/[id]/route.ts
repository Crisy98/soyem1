// src/app/api/afiliados/[id]/route.ts
import { pool } from "@/lib/db";
import { NextResponse } from "next/server";

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Actualizamos el estado a inactivo (activo = false)
    const result = await pool.query(
      `UPDATE afiliados 
       SET activo = false 
       WHERE idafiliado = $1 
       RETURNING *`,
      [id]
    );

    if (result.rowCount === 0) {
      return NextResponse.json(
        { error: "Afiliado no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "Afiliado marcado como inactivo",
      afiliado: result.rows[0],
    });
  } catch (err) {
    console.error("Error eliminando (soft delete) afiliado:", err);
    return NextResponse.json(
      { error: "Error eliminando afiliado" },
      { status: 500 }
    );
  }
}
// En tu archivo route.ts - Corrección para el GET individual

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Traer afiliado + persona - AGREGAR activo al SELECT
    const afiliadoRes = await pool.query(
      `SELECT a.*, 
              p.dni, p.nombre, p.apellido, p.fechanacimiento, p.telefono, p.email, p.sexo
       FROM afiliados a
       JOIN personas p ON a.dni = p.dni
       WHERE a.idafiliado = $1`,
      [id]
    );

    if (afiliadoRes.rowCount === 0) {
      return NextResponse.json({ error: "Afiliado no encontrado" }, { status: 404 });
    }

    const afiliado = afiliadoRes.rows[0];

    // Traer hijos
    const hijosRes = await pool.query(
      `SELECT idhijo, nombre, sexo, fechanacimiento
       FROM hijos
       WHERE dni = $1`,
      [afiliado.dni]
    );

    // Traer usuario
    const userRes = await pool.query(
      `SELECT id, username, roles
       FROM users
       WHERE idafiliado = $1`,
      [id]
    );

    // Estructura consistente con la lista
    return NextResponse.json({
      persona: {
        dni: afiliado.dni,
        nombre: afiliado.nombre,
        apellido: afiliado.apellido,
        fechanacimiento: afiliado.fechanacimiento,
        telefono: afiliado.telefono,
        email: afiliado.email,
        sexo: afiliado.sexo,
      },
      afiliado: {
        idafiliado: afiliado.idafiliado,
        area: afiliado.area,
        cargo: afiliado.cargo,
        tipocontratacion: afiliado.tipocontratacion,
        legajo: afiliado.legajo,
        categoria: afiliado.categoria,
        fechaafiliacion: afiliado.fechaafiliacion,
        fechamunicipio: afiliado.fechamunicipio,
        lugartrabajo: afiliado.lugartrabajo,
        activo: afiliado.activo ?? true, // Asegurar que siempre tenga un valor
      },
      hijos: hijosRes.rows,
      usuario: userRes.rows[0] ?? null,
      activo: afiliado.activo ?? true, // También a nivel raíz para compatibilidad
    });
  } catch (err) {
    console.error("Error obteniendo detalle de afiliado:", err);
    return NextResponse.json({ error: "Error obteniendo afiliado" }, { status: 500 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params;
    const data = await req.json();
    const { persona, afiliado, hijos } = data;

    // Validar datos antes de proceder
    if (isNaN(Number(afiliado.legajo))) {
      return NextResponse.json(
        { error: "El legajo debe ser un número válido" },
        { status: 400 }
      );
    }

    // Iniciar una transacción
    await pool.query('BEGIN');

    try {
      // 1. Actualizar persona
      await pool.query(
        `UPDATE personas 
         SET nombre = $1, apellido = $2, fechanacimiento = $3, 
             telefono = $4, email = $5, sexo = $6
         WHERE dni = $7`,
        [
          persona.nombre,
          persona.apellido,
          persona.fechanacimiento,
          persona.telefono,
          persona.email,
          persona.sexo,
          persona.dni
        ]
      );

      // Convertir a número (ya validado)
      const legajo = Number(afiliado.legajo);
      const categoria = !isNaN(Number(afiliado.categoria)) ? Number(afiliado.categoria) : 0;

      // 2. Actualizar afiliado
      await pool.query(
        `UPDATE afiliados 
         SET area = $1, cargo = $2, tipocontratacion = $3, 
             legajo = $4, categoria = $5, fechaafiliacion = $6, 
             fechamunicipio = $7, lugartrabajo = $8
         WHERE idafiliado = $9`,
        [
          afiliado.area,
          afiliado.cargo,
          afiliado.tipocontratacion,
          legajo,
          categoria,
          afiliado.fechaafiliacion,
          afiliado.fechamunicipio || null,
          afiliado.lugartrabajo || null,
          id
        ]
      );

      // 3. Eliminar hijos existentes y agregar los nuevos
      await pool.query('DELETE FROM hijos WHERE dni = $1', [persona.dni]);
      
      for (const h of hijos) {
        await pool.query(
          `INSERT INTO hijos (dni, nombre, sexo, fechanacimiento) 
           VALUES ($1, $2, $3, $4)`,
          [persona.dni, h.nombre, h.sexo, h.fechanacimiento]
        );
      }

      // Confirmar la transacción
      await pool.query('COMMIT');

      return NextResponse.json({
        message: "Afiliado actualizado correctamente",
        afiliado: { ...afiliado, dni: persona.dni }
      });

    } catch (error) {
      // Revertir la transacción en caso de error
      await pool.query('ROLLBACK');
      throw error;
    }
  } catch (err) {
    console.error("Error actualizando afiliado:", err);
    return NextResponse.json(
      { error: "Error actualizando afiliado" },
      { status: 500 }
    );
  }
}