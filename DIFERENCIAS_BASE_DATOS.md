# 📋 DIFERENCIAS ENTRE TU ESQUEMA Y EL PROYECTO ACTUAL

## ⚠️ CAMBIOS IMPORTANTES

### 1. **Tabla `users`** ❗ CRÍTICO
**TU ESQUEMA (INCORRECTO):**
```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    roles VARCHAR(20) NOT NULL DEFAULT 'afiliado',
    idafiliado int not null,  -- ❌ ESTO SE ELIMINÓ
    CONSTRAINT fk_user_afiliado
        FOREIGN KEY (idafiliado) REFERENCES afiliado(id)
```

**ESQUEMA CORRECTO (PROYECTO ACTUAL):**
```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    roles VARCHAR(20) NOT NULL DEFAULT 'afiliado'
    -- ✅ NO tiene idafiliado aquí
);
```

**¿Por qué?** Se eliminó la columna `idafiliado` de la tabla `users` porque creaba redundancia circular. Ahora la tabla `afiliados` tiene `idusuario` que apunta a `users`.

---

### 2. **Tabla `afiliados`** ❗ CRÍTICO
**TU ESQUEMA (INCOMPLETO):**
```sql
CREATE TABLE afiliados (
    idafiliado INT PRIMARY KEY UNIQUE,  -- ❌ INT manual
    -- ... resto de campos
    -- ❌ FALTA idusuario
);
```

**ESQUEMA CORRECTO:**
```sql
CREATE TABLE afiliados (
    idafiliado SERIAL PRIMARY KEY,  -- ✅ SERIAL (auto-incremental)
    dni BIGINT NOT NULL UNIQUE,      -- ✅ Agregado UNIQUE
    -- ... resto de campos
    idusuario INT NOT NULL UNIQUE,   -- ✅ AGREGADO: FK a users
    
    CONSTRAINT fk_user_afiliado
        FOREIGN KEY (idusuario) REFERENCES users(id)
);
```

---

### 3. **Tabla `comercios`** 
**TU ESQUEMA:**
```sql
idusuario INT NOT NULL,
CONSTRAINT fk_user_comercio
    FOREIGN KEY (idusuario) REFERENCES users(id)
```

**ESQUEMA CORRECTO:**
```sql
idusuario INT NOT NULL UNIQUE,  -- ✅ Agregado UNIQUE
CONSTRAINT fk_user_comercio
    FOREIGN KEY (idusuario) REFERENCES users(id)
```

---

### 4. **Tabla `movimiento_cuotas`** ❗❗ NUEVA - NO EXISTE EN TU ESQUEMA
**FALTA COMPLETAMENTE EN TU BASE DE DATOS:**
```sql
CREATE TABLE movimiento_cuotas (
    idcuota SERIAL PRIMARY KEY,
    idmovimiento INT NOT NULL,
    numerocuota INT NOT NULL,
    fechavencimiento DATE NOT NULL,
    importecuota NUMERIC(10, 2) NOT NULL,
    pagado BOOLEAN DEFAULT FALSE,
    fechapago TIMESTAMP,
    
    CONSTRAINT fk_cuota_movimiento
        FOREIGN KEY (idmovimiento) REFERENCES movimientos(idmovimiento)
);
```

**Esta tabla es ESENCIAL** para el sistema de cuotas que usa el proyecto.

---

### 5. **Tabla `topes`**
**TU ESQUEMA:**
```sql
CREATE TABLE topes (
    idTope SERIAL PRIMARY KEY,  -- ❌ Nombre inconsistente
    fecha DATE NOT NULL,
    importe FLOAT              -- ❌ FLOAT no es preciso para dinero
);
```

**ESQUEMA CORRECTO:**
```sql
CREATE TABLE topes (
    idtope SERIAL PRIMARY KEY,     -- ✅ Minúsculas
    fecha DATE NOT NULL UNIQUE,    -- ✅ UNIQUE agregado
    importe NUMERIC(10, 2) NOT NULL -- ✅ NUMERIC para precisión
);
```

---

### 6. **Tabla `movimientos`**
**CAMBIOS:**
- `idcomercio`: INT → **BIGINT** (para coincidir con comercios.idcomercio)
- `importe`: FLOAT → **NUMERIC(10, 2)** (precisión decimal)
- `fechaCompra` → **fechacompra** (minúsculas para consistencia)

---

### 7. **Tabla `rubros`**
**CAMBIO MENOR:**
```sql
nombrerubro VARCHAR(100) NOT NULL UNIQUE  -- ✅ Agregado UNIQUE
```

---

## 🎯 RESUMEN DE ACCIONES NECESARIAS

### Si tienes datos importantes:
1. **Exporta tu base de datos actual:**
   ```powershell
   .\scripts\exportar_db.ps1
   ```

2. **Aplica las migraciones:**
   ```sql
   -- Crear tabla movimiento_cuotas
   -- Agregar idusuario a afiliados
   -- Eliminar idafiliado de users
   -- Cambiar tipos de datos
   ```

3. **Migra los datos manualmente**

### Si puedes empezar de cero:
1. **Ejecuta el script completo:**
   ```powershell
   psql -U tu_usuario -d tu_base_datos -f scripts/crear_base_datos_completa.sql
   ```

---

## 📝 CÓMO USAR EL SCRIPT

### Opción 1: PowerShell
```powershell
# Navega a la carpeta del proyecto
cd C:\Users\PC\Desktop\Proyectos\soyem

# Ejecuta el script
psql -U postgres -d nombre_base_datos -f scripts/crear_base_datos_completa.sql
```

### Opción 2: pgAdmin
1. Abre pgAdmin
2. Conecta a tu servidor PostgreSQL
3. Crea una nueva base de datos: `soyem_db`
4. Click derecho en la base de datos → "Query Tool"
5. Copia y pega todo el contenido de `crear_base_datos_completa.sql`
6. Ejecuta (F5 o botón ▶️)

### Opción 3: DBeaver
1. Conecta a PostgreSQL
2. Crea nueva base de datos
3. SQL Editor → Pega el script
4. Execute SQL Script

---

## 🔐 CREDENCIALES POR DEFECTO

Después de ejecutar el script:

**Admin:**
- Usuario: `admin`
- Contraseña: `admin123`

**⚠️ IMPORTANTE:** Cambia esta contraseña en producción!

---

## ✅ VERIFICAR QUE TODO FUNCIONÓ

```sql
-- 1. Ver todas las tablas
\dt

-- 2. Ver estructura de cada tabla
\d users
\d afiliados
\d comercios
\d movimiento_cuotas

-- 3. Verificar relaciones
SELECT 
    tc.table_name, 
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
ORDER BY tc.table_name;
```

---

## 🔧 SI TIENES ERRORES

### Error: "relation already exists"
```sql
-- Si las tablas ya existen, elimínalas primero (CUIDADO: pierdes datos)
DROP TABLE IF EXISTS movimiento_cuotas CASCADE;
DROP TABLE IF EXISTS movimientos CASCADE;
DROP TABLE IF EXISTS comercios CASCADE;
DROP TABLE IF EXISTS afiliados CASCADE;
DROP TABLE IF EXISTS hijos CASCADE;
DROP TABLE IF EXISTS personas CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS rubros CASCADE;
DROP TABLE IF EXISTS topes CASCADE;
```

### Error: "permission denied"
```powershell
# Asegúrate de tener permisos de superusuario o dueño de la BD
psql -U postgres -d nombre_bd -f script.sql
```

---

## 🚀 PRÓXIMOS PASOS

1. ✅ Ejecutar el script de creación
2. ✅ Verificar que todas las tablas existen
3. ✅ Probar login con admin/admin123
4. ✅ Crear tu primer afiliado
5. ✅ Crear tu primer comercio
6. ✅ Probar crear un movimiento

---

## 📞 AYUDA

Si tienes problemas:
1. Revisa los errores en la consola de PostgreSQL
2. Verifica que PostgreSQL esté corriendo
3. Asegúrate de tener permisos en la base de datos
4. Revisa que el nombre de la BD sea correcto
