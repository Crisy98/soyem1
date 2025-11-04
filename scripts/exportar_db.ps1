# Script para exportar la base de datos actual
# Ejecutar: .\scripts\exportar_db.ps1

# Configuración - AJUSTA ESTOS VALORES
$DB_USER = "tu_usuario"
$DB_NAME = "nombre_base_datos"
$DB_HOST = "localhost"
$DB_PORT = "5432"

# Generar nombre de archivo con fecha
$fecha = Get-Date -Format "yyyy-MM-dd_HHmmss"
$outputFile = "backup_$fecha.sql"

Write-Host "🗄️  Exportando base de datos..." -ForegroundColor Cyan
Write-Host "Base de datos: $DB_NAME" -ForegroundColor Yellow
Write-Host "Archivo de salida: $outputFile" -ForegroundColor Yellow
Write-Host ""

# Ejecutar pg_dump
$env:PGPASSWORD = Read-Host "Ingresa la contraseña de PostgreSQL" -AsSecureString | ConvertFrom-SecureString -AsPlainText

try {
    pg_dump -U $DB_USER -h $DB_HOST -p $DB_PORT -d $DB_NAME -f $outputFile
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Base de datos exportada exitosamente!" -ForegroundColor Green
        Write-Host "📁 Archivo guardado: $outputFile" -ForegroundColor Green
        Write-Host ""
        Write-Host "Ahora puedes importar este archivo a tu base de datos en la nube:" -ForegroundColor Cyan
        Write-Host 'psql "tu_connection_string_de_neon" -f ' $outputFile -ForegroundColor Yellow
    } else {
        Write-Host "❌ Error al exportar la base de datos" -ForegroundColor Red
        Write-Host "Verifica que pg_dump esté instalado y en el PATH" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Error: $_" -ForegroundColor Red
}
