# 🚀 Guía de Despliegue - Sistema SOYEM

## Prerequisitos
- Cuenta en GitHub (gratuita)
- Cuenta en Vercel (gratuita)
- Cuenta en Neon/Vercel Postgres (gratuita)

---

## 📦 PASO 1: Preparar el Repositorio en GitHub

### 1.1 Crear repositorio en GitHub
1. Ve a https://github.com/new
2. Nombre del repositorio: `soyem-sistema` (o el que prefieras)
3. **NO** marques "Add a README file"
4. Click en "Create repository"

### 1.2 Subir tu código
Abre PowerShell en la carpeta del proyecto y ejecuta:

```powershell
# Inicializar git (si no lo hiciste)
git init

# Agregar todos los archivos
git add .

# Hacer commit
git commit -m "Initial commit - Sistema SOYEM"

# Conectar con GitHub (reemplaza TU_USUARIO y TU_REPO)
git remote add origin https://github.com/TU_USUARIO/TU_REPO.git

# Subir el código
git branch -M main
git push -u origin main
```

---

## 🗄️ PASO 2: Configurar Base de Datos

### Opción A: Neon (Recomendada) ⭐

#### 2.1 Crear cuenta en Neon
1. Ve a https://neon.tech
2. Regístrate con GitHub o email
3. Click en "Create a project"

#### 2.2 Configurar el proyecto
1. Nombre del proyecto: `soyem-db`
2. Región: Elige la más cercana (ej: `US East (Ohio)`)
3. PostgreSQL version: 16 (la más reciente)
4. Click en "Create project"

#### 2.3 Obtener la Connection String
1. En el dashboard, copia el **Connection String**
2. Se ve así: `postgresql://usuario:password@ep-xxx.region.aws.neon.tech/neondb?sslmode=require`
3. **GUÁRDALA** - la necesitarás para Vercel

#### 2.4 Migrar tu base de datos

**Opción 1: Usando pgAdmin/DBeaver**
1. Conecta a tu base de datos Neon con los datos de conexión
2. Exporta tu base de datos local actual como SQL
3. Ejecuta el script SQL en Neon

**Opción 2: Usando comandos (PowerShell)**
```powershell
# Exportar tu DB local (ajusta los valores)
pg_dump -U tu_usuario -h localhost -d tu_base_datos -f backup.sql

# Importar a Neon (usa el connection string de Neon)
psql "postgresql://usuario:password@ep-xxx.region.aws.neon.tech/neondb?sslmode=require" -f backup.sql
```

**Opción 3: Copiar tabla por tabla**
Puedes conectarte a Neon con pgAdmin y copiar/pegar los datos manualmente.

---

### Opción B: Vercel Postgres (Alternativa)

#### 2.1 Crear base de datos
1. Ve a https://vercel.com/dashboard
2. Click en "Storage" en el menú lateral
3. Click en "Create Database"
4. Selecciona "Postgres"
5. Nombre: `soyem-db`
6. Región: Elige la más cercana
7. Click en "Create"

#### 2.2 Obtener credenciales
1. En la pestaña ".env.local", copia todas las variables
2. La más importante es `POSTGRES_URL` o `DATABASE_URL`

#### 2.3 Migrar datos
Usa los mismos métodos que con Neon (Option 1, 2 o 3)

---

## 🌐 PASO 3: Desplegar en Vercel

### 3.1 Conectar GitHub con Vercel
1. Ve a https://vercel.com
2. Regístrate/Inicia sesión con GitHub
3. Click en "Add New..." → "Project"
4. Busca tu repositorio `soyem-sistema`
5. Click en "Import"

### 3.2 Configurar el proyecto
1. **Framework Preset**: Next.js (se detecta automáticamente)
2. **Root Directory**: `./` (dejar por defecto)
3. **Build Command**: `next build` (por defecto)
4. **Output Directory**: `.next` (por defecto)

### 3.3 Configurar Variables de Entorno ⚠️ **MUY IMPORTANTE**

Click en "Environment Variables" y agrega:

| Name | Value | Environments |
|------|-------|--------------|
| `DATABASE_URL` | Tu connection string de Neon/Vercel Postgres | Production, Preview, Development |
| `JWT_SECRET` | Un string aleatorio seguro (mínimo 32 caracteres) | Production, Preview, Development |
| `NODE_ENV` | `production` | Production |

**Generar JWT_SECRET seguro:**
```powershell
# En PowerShell, ejecuta:
-join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | ForEach-Object {[char]$_})
```

### 3.4 Desplegar
1. Click en "Deploy"
2. Espera 2-5 minutos mientras Vercel construye y despliega
3. ¡Listo! Te dará una URL como `https://soyem-sistema.vercel.app`

---

## ✅ PASO 4: Verificar Despliegue

### 4.1 Probar la aplicación
1. Abre la URL de Vercel
2. Intenta hacer login con tus credenciales
3. Verifica que las funcionalidades principales funcionen:
   - Login
   - Ver afiliados
   - Ver comercios
   - Generar PDFs
   - Generar QR

### 4.2 Ver logs (si hay errores)
1. En Vercel dashboard, click en tu proyecto
2. Click en "Deployments"
3. Click en el último deployment
4. Click en "Functions" para ver logs de errores

---

## 🔧 PASO 5: Configuraciones Adicionales

### 5.1 Configurar Dominio Personalizado (Opcional)
1. En Vercel, ve a "Settings" → "Domains"
2. Agrega tu dominio personalizado
3. Sigue las instrucciones de DNS

### 5.2 Configurar Límites de Topes (si usas cron jobs)
Por ahora, los topes se configuran manualmente en el admin panel.

### 5.3 Backups de Base de Datos
**Neon:**
- Backups automáticos diarios (plan gratuito)
- Puedes restaurar hasta 7 días atrás

**Vercel Postgres:**
- Backups automáticos (según plan)

**Manual:**
```powershell
# Exportar backup manual
pg_dump "tu_connection_string_de_neon" -f backup_$(Get-Date -Format 'yyyy-MM-dd').sql
```

---

## 🐛 Solución de Problemas Comunes

### Error: "DATABASE_URL is not defined"
- Verifica que agregaste la variable en Vercel
- Redeploy el proyecto después de agregar variables

### Error: "Connection timeout"
- Verifica que el connection string sea correcto
- Asegúrate de incluir `?sslmode=require` al final (Neon)
- Vercel Postgres ya incluye SSL

### Error 500 en producción
1. Ve a Vercel → Deployments → Functions
2. Revisa los logs para ver el error exacto
3. Comúnmente son problemas de variables de entorno

### Base de datos vacía después de migrar
- Verifica que ejecutaste el script SQL completo
- Revisa que todas las tablas se crearon: `users`, `personas`, `afiliados`, `comercios`, etc.

---

## 📊 Monitoreo

### Métricas de Vercel (gratuito)
- Visitas
- Tiempo de respuesta
- Errores 4xx/5xx
- Uso de funciones

### Métricas de Base de Datos
**Neon Dashboard:**
- Tamaño de BD
- Queries por segundo
- Conexiones activas

---

## 🔒 Seguridad

### Checklist de Seguridad
- ✅ Variables de entorno configuradas en Vercel (no en código)
- ✅ `.env.local` en `.gitignore` (no subir a GitHub)
- ✅ JWT_SECRET fuerte y aleatorio
- ✅ SSL habilitado en conexión a BD
- ✅ Passwords hasheados con bcrypt

---

## 📝 Comandos Útiles

```powershell
# Ver estado de git
git status

# Actualizar código después de cambios
git add .
git commit -m "Descripción de cambios"
git push

# Vercel redesplegará automáticamente después de push

# Conectar a base de datos (para queries manuales)
psql "tu_connection_string"
```

---

## 🆘 Ayuda

- **Vercel Docs**: https://vercel.com/docs
- **Neon Docs**: https://neon.tech/docs
- **Next.js Docs**: https://nextjs.org/docs

---

## 🎉 ¡Éxito!

Tu aplicación SOYEM ahora está en producción y accesible desde cualquier lugar del mundo.

**URL de producción**: Vercel te la proporciona (ej: `https://tu-proyecto.vercel.app`)

