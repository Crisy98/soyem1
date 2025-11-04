# Script para crear la base de datos completa
# Ejecutar: .\scripts\ejecutar_crear_db.ps1

Write-Host "════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  🗄️  CREACIÓN DE BASE DE DATOS - SISTEMA SOYEM  " -ForegroundColor Cyan
Write-Host "════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Configuración
$DB_USER = Read-Host "Usuario de PostgreSQL (por defecto: postgres)"
if ([string]::IsNullOrWhiteSpace($DB_USER)) {
    $DB_USER = "postgres"
}

$DB_NAME = Read-Host "Nombre de la base de datos (por defecto: soyem_db)"
if ([string]::IsNullOrWhiteSpace($DB_NAME)) {
    $DB_NAME = "soyem_db"
}

$DB_HOST = Read-Host "Host (por defecto: localhost)"
if ([string]::IsNullOrWhiteSpace($DB_HOST)) {
    $DB_HOST = "localhost"
}

$DB_PORT = Read-Host "Puerto (por defecto: 5432)"
if ([string]::IsNullOrWhiteSpace($DB_PORT)) {
    $DB_PORT = "5432"
}

Write-Host ""
Write-Host "═══════════════════════════════════════════════" -ForegroundColor Yellow
Write-Host "  📋 RESUMEN DE CONFIGURACIÓN" -ForegroundColor Yellow
Write-Host "═══════════════════════════════════════════════" -ForegroundColor Yellow
Write-Host "Usuario: $DB_USER" -ForegroundColor White
Write-Host "Base de datos: $DB_NAME" -ForegroundColor White
Write-Host "Host: $DB_HOST" -ForegroundColor White
Write-Host "Puerto: $DB_PORT" -ForegroundColor White
Write-Host "═══════════════════════════════════════════════" -ForegroundColor Yellow
Write-Host ""

$confirmar = Read-Host "¿Continuar? (S/N)"
if ($confirmar -ne "S" -and $confirmar -ne "s") {
    Write-Host "❌ Operación cancelada" -ForegroundColor Red
    exit
}

Write-Host ""
Write-Host "🔍 Verificando que PostgreSQL esté corriendo..." -ForegroundColor Cyan

# Verificar si PostgreSQL está corriendo
try {
    $pgStatus = Get-Service -Name "*postgresql*" -ErrorAction SilentlyContinue
    if ($pgStatus -and $pgStatus.Status -eq "Running") {
        Write-Host "✅ PostgreSQL está corriendo" -ForegroundColor Green
    } else {
        Write-Host "⚠️  PostgreSQL no está corriendo o no se pudo verificar" -ForegroundColor Yellow
        Write-Host "   Asegúrate de que PostgreSQL esté iniciado" -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠️  No se pudo verificar el estado de PostgreSQL" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🗄️  Creando base de datos '$DB_NAME'..." -ForegroundColor Cyan

# Intentar crear la base de datos (puede fallar si ya existe, está ok)
$env:PGPASSWORD = Read-Host "Ingresa la contraseña de PostgreSQL" -AsSecureString | ConvertFrom-SecureString -AsPlainText

try {
    $createDb = "CREATE DATABASE $DB_NAME;" | psql -U $DB_USER -h $DB_HOST -p $DB_PORT -d postgres 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Base de datos '$DB_NAME' creada" -ForegroundColor Green
    } else {
        if ($createDb -match "already exists") {
            Write-Host "⚠️  Base de datos '$DB_NAME' ya existe (usando existente)" -ForegroundColor Yellow
        } else {
            Write-Host "⚠️  No se pudo crear la base de datos: $createDb" -ForegroundColor Yellow
        }
    }
} catch {
    Write-Host "⚠️  Error al crear base de datos: $_" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "📝 Ejecutando script de creación de tablas..." -ForegroundColor Cyan
Write-Host ""

# Ejecutar el script SQL
$scriptPath = ".\scripts\crear_base_datos_completa.sql"

if (-not (Test-Path $scriptPath)) {
    Write-Host "❌ Error: No se encuentra el archivo $scriptPath" -ForegroundColor Red
    exit 1
}

try {
    psql -U $DB_USER -h $DB_HOST -p $DB_PORT -d $DB_NAME -f $scriptPath
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "════════════════════════════════════════════════" -ForegroundColor Green
        Write-Host "  ✅ ¡BASE DE DATOS CREADA EXITOSAMENTE!  " -ForegroundColor Green
        Write-Host "════════════════════════════════════════════════" -ForegroundColor Green
        Write-Host ""
        Write-Host "📊 Detalles de conexión:" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "DATABASE_URL para .env.local:" -ForegroundColor Yellow
        Write-Host "postgresql://$DB_USER:TU_PASSWORD@$($DB_HOST):$DB_PORT/$DB_NAME" -ForegroundColor White
        Write-Host ""
        Write-Host "🔐 Credenciales de administrador:" -ForegroundColor Cyan
        Write-Host "Usuario: admin" -ForegroundColor White
        Write-Host "Contraseña: admin123" -ForegroundColor White
        Write-Host ""
        Write-Host "⚠️  IMPORTANTE: Cambia la contraseña en producción" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "🚀 Próximos pasos:" -ForegroundColor Cyan
        Write-Host "1. Copia el DATABASE_URL a tu archivo .env.local" -ForegroundColor White
        Write-Host "2. Ejecuta: npm run dev" -ForegroundColor White
        Write-Host "3. Abre: http://localhost:3000/login" -ForegroundColor White
        Write-Host "4. Login con admin/admin123" -ForegroundColor White
        Write-Host ""
    } else {
        Write-Host ""
        Write-Host "❌ Error al ejecutar el script SQL" -ForegroundColor Red
        Write-Host "Revisa los mensajes de error arriba" -ForegroundColor Yellow
    }
} catch {
    Write-Host ""
    Write-Host "❌ Error: $_" -ForegroundColor Red
} finally {
    # Limpiar password del entorno
    $env:PGPASSWORD = $null
}

Write-Host ""
Write-Host "════════════════════════════════════════════════" -ForegroundColor Cyan
