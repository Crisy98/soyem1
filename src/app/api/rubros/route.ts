// src/app/api/rubros/route.ts
import { pool } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const result = await pool.query(
      `SELECT idrubro, nombrerubro 
       FROM rubros 
       ORDER BY nombrerubro ASC`
    );

    return NextResponse.json(result.rows);
  } catch (err) {
    console.error("Error obteniendo rubros:", err);
    return NextResponse.json(
      { error: "Error obteniendo rubros" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const { nombrerubro } = await req.json();

    if (!nombrerubro) {
      return NextResponse.json(
        { error: "El nombre del rubro es obligatorio" },
        { status: 400 }
      );
    }

    const result = await pool.query(
      `INSERT INTO rubros (nombrerubro) 
       VALUES ($1) 
       RETURNING *`,
      [nombrerubro]
    );

    return NextResponse.json({
      message: "Rubro creado correctamente",
      rubro: result.rows[0],
    });
  } catch (err) {
    console.error("Error creando rubro:", err);
    return NextResponse.json(
      { error: "Error creando rubro" },
      { status: 500 }
    );
  }
}