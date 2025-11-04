# Script para importar la base de datos a Neon/Vercel Postgres
# Ejecutar: .\scripts\importar_db.ps1

param(
    [Parameter(Mandatory=$true)]
    [string]$ConnectionString,
    
    [Parameter(Mandatory=$true)]
    [string]$BackupFile
)

Write-Host "🗄️  Importando base de datos..." -ForegroundColor Cyan
Write-Host "Archivo: $BackupFile" -ForegroundColor Yellow
Write-Host ""

if (-not (Test-Path $BackupFile)) {
    Write-Host "❌ Error: No se encuentra el archivo $BackupFile" -ForegroundColor Red
    exit 1
}

try {
    Write-Host "Ejecutando importación..." -ForegroundColor Yellow
    psql $ConnectionString -f $BackupFile
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✅ Base de datos importada exitosamente!" -ForegroundColor Green
    } else {
        Write-Host "❌ Error al importar la base de datos" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Error: $_" -ForegroundColor Red
}

# Uso:
# .\scripts\importar_db.ps1 -ConnectionString "postgresql://user:pass@host/db" -BackupFile "backup.sql"
