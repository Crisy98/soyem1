const bcrypt = require('bcrypt');
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Leer DATABASE_URL desde .env.local
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
    console.error('Error leyendo .env:', e.message);
  }
  return out;
}

// Cargar DATABASE_URL
let connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  const envPath = path.join(__dirname, '.env.local');
  if (fs.existsSync(envPath)) {
    const env = parseDotEnvFile(envPath);
    connectionString = env.DATABASE_URL;
  }
}

if (!connectionString) {
  console.error('❌ No se encontró DATABASE_URL en .env.local');
  console.log('Por favor agrega DATABASE_URL a tu archivo .env.local');
  console.log('Ejemplo: DATABASE_URL=postgresql://postgres:password@localhost:5432/db_soyem');
  process.exit(1);
}

// Configuración de la base de datos
const pool = new Pool({
  connectionString: connectionString,
});

async function createAdmin() {
  try {
    // Contraseña que quieres para el administrador
    const password = 'admin123'; // ⚠️ CÁMBIALA POR UNA SEGURA
    
    // Generar hash de la contraseña
    const passwordHash = await bcrypt.hash(password, 10);
    console.log('✅ Hash generado:', passwordHash);
    
    // Primero, verificar si el usuario ya existe
    const checkQuery = 'SELECT * FROM users WHERE username = $1';
    const checkResult = await pool.query(checkQuery, ['admin']);
    
    if (checkResult.rows.length > 0) {
      console.log('\n⚠️  El usuario "admin" ya existe. Actualizando...');
      
      // Actualizar el usuario existente
      const updateQuery = `
        UPDATE users 
        SET password_hash = $1, roles = $2
        WHERE username = $3
        RETURNING *;
      `;
      
      const result = await pool.query(updateQuery, [
        passwordHash,
        'administrador',
        'admin'
      ]);
      
      console.log('\n✅ Usuario administrador ACTUALIZADO exitosamente:');
      console.log('ID:', result.rows[0].id);
      console.log('Username:', result.rows[0].username);
      console.log('Roles:', result.rows[0].roles);
      console.log('Password Hash:', result.rows[0].password_hash);
    } else {
      // Insertar el usuario administrador
      const insertQuery = `
        INSERT INTO users (username, password_hash, roles, idafiliado)
        VALUES ($1, $2, $3, $4)
        RETURNING *;
      `;
      
      const result = await pool.query(insertQuery, [
        'admin',
        passwordHash,
        'administrador',
        null
      ]);
      
      console.log('\n✅ Usuario administrador CREADO exitosamente:');
      console.log('ID:', result.rows[0].id);
      console.log('Username:', result.rows[0].username);
      console.log('Roles:', result.rows[0].roles);
      console.log('Password Hash:', result.rows[0].password_hash);
    }
    
    console.log('\n📝 Usa estas credenciales para login:');
    console.log('Usuario: admin');
    console.log('Contraseña:', password);
    
    // Verificar que el hash funciona
    const testCompare = await bcrypt.compare(password, passwordHash);
    console.log('\n🔐 Verificación del hash:', testCompare ? '✅ CORRECTO' : '❌ ERROR');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

createAdmin();
