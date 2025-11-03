import fs from "fs";
import path from "path";
import { Pool } from "pg";

/**
 * Leer y parsear .env.local/.env manualmente.
 * Devuelve un objeto con las variables encontradas.
 */
function parseDotEnvFile(filePath) {
  const out = {};
  try {
    const content = fs.readFileSync(filePath, "utf8");
    const lines = content.split(/\r?\n/);
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      let val = trimmed.slice(eq + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      out[key] = val;
    }
  } catch (e) {
    // no existe o no se pudo leer
  }
  return out;
}

// intentar cargar variables desde disco (si process.env no las tiene)
let parsedEnv = {};
if (!process.env.DATABASE_URL) {
  const candidates = [path.join(process.cwd(), ".env.local"), path.join(process.cwd(), ".env")];
  for (const p of candidates) {
    if (fs.existsSync(p)) {
      parsedEnv = parseDotEnvFile(p);
      console.info(`Variables cargadas desde ${p}`);
      break;
    }
  }
}

// Elegir connectionString: prioridad process.env, luego parsedEnv
const connectionString =
  typeof process.env.DATABASE_URL === "string" && process.env.DATABASE_URL
    ? process.env.DATABASE_URL
    : parsedEnv.DATABASE_URL;

// DEBUG enmascarado (no mostrar password)
const masked = typeof connectionString === "string" 
  ? connectionString.replace(/:\/\/([^:]+):([^@]+)@/, "://$1:***@") 
  : connectionString;
console.log("DEBUG ─ connectionString (masked):", masked, "typeof:", typeof connectionString);

if (!connectionString || typeof connectionString !== "string") {
  console.error("DATABASE_URL inválida o no definida:", connectionString);
  throw new Error(
    "DATABASE_URL no está definida o no es una cadena. Asegurate de tener .env/.env.local con DATABASE_URL (ej: postgresql://user:pass@host:port/dbname) y reiniciá el servidor."
  );
}

// Configuración de SSL para producción (Vercel, Neon, etc.)
const isProduction = process.env.NODE_ENV === "production";
let sslConfig = false;

if (isProduction) {
  // Para Vercel Postgres, Neon, Supabase, etc.
  sslConfig = {
    rejectUnauthorized: false, // Acepta certificados self-signed
  };
}

export const pool = new Pool({
  connectionString,
  ssl: sslConfig,
  // Configuraciones adicionales para serverless (Vercel)
  max: 20, // máximo de conexiones en el pool
  idleTimeoutMillis: 30000, // cerrar conexiones idle después de 30s
  connectionTimeoutMillis: 10000, // timeout de conexión 10s
});

// Manejar errores del pool
pool.on('error', (err) => {
  console.error('Error inesperado en el pool de conexiones:', err);
});

