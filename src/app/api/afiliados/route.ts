import { pool } from "@/lib/db";
import bcrypt from "bcrypt";
import { NextResponse } from "next/server";
import crypto from "crypto";


export async function GET() {
  try {
    const result = await pool.query(
      `SELECT 
  a.idafiliado,
  a.area,
  a.cargo,
  a.tipocontratacion,
  a.legajo,
  a.categoria,
  a.fechaafiliacion,
  a.fechamunicipio,
  a.lugartrabajo,
  a.activo,  
  json_build_object(
    'dni', p.dni,
    'nombre', p.nombre,
    'apellido', p.apellido,
    'fechanacimiento', p.fechanacimiento,
    'telefono', p.telefono,
    'email', p.email,
    'sexo', p.sexo
  ) as persona
FROM afiliados a
JOIN personas p ON a.dni = p.dni
ORDER BY p.apellido ASC
`
    );

    return NextResponse.json(result.rows);
  } catch (err) {
    console.error("Error obteniendo afiliados:", err);
    return NextResponse.json(
      { error: "Error obteniendo afiliados" },
      { status: 500 }
    );
  }
}
export async function POST(req: Request) {
  try {
    const data = await req.json();

    const {
      persona,
      afiliado,
      hijos,
    }: {
      persona: {
        dni: number;
        nombre: string;
        apellido: string;
        fechanacimiento: string;
        telefono: number;
        email: string;
        sexo: string;
      };
      afiliado: {
        idafiliado: number;
        area: string;
        cargo: string;
        tipocontratacion: string;
        legajo: number;
        categoria?: number;
        fechaafiliacion: string;
        fechamunicipio?: string;
        lugartrabajo?: string;

      };
      hijos: {
        nombre: string;
        sexo: string;
        fechanacimiento: string;
      }[];
    } = data;

    // 1. Insert persona
    await pool.query(
      `INSERT INTO personas (dni, nombre, apellido, fechanacimiento, telefono, email, sexo) 
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       ON CONFLICT (dni) DO NOTHING`,
      [
        persona.dni,
        persona.nombre,
        persona.apellido,
        persona.fechanacimiento,
        persona.telefono,
        persona.email,
        persona.sexo,
      ]
    );

    // 2. Insert afiliado
    await pool.query(
      `INSERT INTO afiliados 
        (idafiliado, dni, area, cargo, tipocontratacion, legajo, categoria, fechaafiliacion, fechamunicipio, lugartrabajo)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
      [
        afiliado.idafiliado,
        persona.dni,
        afiliado.area,
        afiliado.cargo,
        afiliado.tipocontratacion,
        afiliado.legajo,
        afiliado.categoria ?? null,
        afiliado.fechaafiliacion,
        afiliado.fechamunicipio ?? null,
        afiliado.lugartrabajo ?? null,
        
      ]
    );

    // 3. Insert hijos
    for (const h of hijos) {
      await pool.query(
        `INSERT INTO hijos (dni, nombre, sexo, fechanacimiento) 
         VALUES ($1,$2,$3,$4)`,
        [persona.dni, h.nombre, h.sexo, h.fechanacimiento]
      );
    }

    // 4. Crear usuario
    const username = `${persona.nombre.toLowerCase()}.${persona.apellido.toLowerCase()}`;
    const plainPassword = crypto.randomBytes(9).toString("base64").slice(0, 12); // contraseña aleatoria 12 chars
    const password_hash = await bcrypt.hash(plainPassword, 10);

    await pool.query(
      `INSERT INTO users (username, password_hash, roles, idafiliado)
       VALUES ($1,$2,'afiliado',$3)`,
      [username, password_hash, afiliado.idafiliado]
    );

    return NextResponse.json({
      message: "Afiliado creado correctamente",
      username,
      password: plainPassword, // ⚠️ mostrar solo una vez, no guardarlo en texto plano
    });
  } catch (err) {
    console.error("Error creando afiliado:", err);
    return NextResponse.json({ error: "Error creando afiliado" }, { status: 500 });
  }
}




