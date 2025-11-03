# Script de validación pre-despliegue
# Ejecutar: .\scripts\validar_antes_deploy.ps1

Write-Host "═══════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  🔍 VALIDACIÓN PRE-DESPLIEGUE - SISTEMA SOYEM  " -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

$errores = 0
$advertencias = 0

# 1. Verificar que existe package.json
Write-Host "✓ Verificando package.json..." -NoNewline
if (Test-Path "package.json") {
    Write-Host " OK" -ForegroundColor Green
} else {
    Write-Host " ❌ FALTA" -ForegroundColor Red
    $errores++
}

# 2. Verificar que existe .gitignore
Write-Host "✓ Verificando .gitignore..." -NoNewline
if (Test-Path ".gitignore") {
    Write-Host " OK" -ForegroundColor Green
} else {
    Write-Host " ⚠️  FALTA (recomendado)" -ForegroundColor Yellow
    $advertencias++
}

# 3. Verificar que NO existe .env.local en git
Write-Host "✓ Verificando que .env.local no esté en git..." -NoNewline
$gitStatus = git status --porcelain 2>$null | Select-String ".env.local"
if ($null -eq $gitStatus) {
    Write-Host " OK" -ForegroundColor Green
} else {
    Write-Host " ⚠️  .env.local está trackeado - ELIMÍNALO de git" -ForegroundColor Yellow
    Write-Host "   Ejecuta: git rm --cached .env.local" -ForegroundColor Yellow
    $advertencias++
}

# 4. Verificar estructura de carpetas
Write-Host "✓ Verificando estructura de carpetas..." -NoNewline
$requiredFolders = @("src", "src/app", "src/lib", "public")
$missingFolders = @()
foreach ($folder in $requiredFolders) {
    if (-not (Test-Path $folder)) {
        $missingFolders += $folder
    }
}
if ($missingFolders.Count -eq 0) {
    Write-Host " OK" -ForegroundColor Green
} else {
    Write-Host " ❌ FALTAN: $($missingFolders -join ', ')" -ForegroundColor Red
    $errores++
}

# 5. Verificar archivos críticos
Write-Host "✓ Verificando archivos críticos..." -NoNewline
$requiredFiles = @(
    "src/lib/db.js",
    "next.config.ts",
    "tsconfig.json",
    "vercel.json"
)
$missingFiles = @()
foreach ($file in $requiredFiles) {
    if (-not (Test-Path $file)) {
        $missingFiles += $file
    }
}
if ($missingFiles.Count -eq 0) {
    Write-Host " OK" -ForegroundColor Green
} else {
    Write-Host " ⚠️  FALTAN: $($missingFiles -join ', ')" -ForegroundColor Yellow
    $advertencias++
}

# 6. Verificar node_modules
Write-Host "✓ Verificando node_modules..." -NoNewline
if (Test-Path "node_modules") {
    Write-Host " OK" -ForegroundColor Green
} else {
    Write-Host " ⚠️  FALTA - Ejecuta: npm install" -ForegroundColor Yellow
    $advertencias++
}

# 7. Verificar que Git está inicializado
Write-Host "✓ Verificando Git..." -NoNewline
if (Test-Path ".git") {
    Write-Host " OK" -ForegroundColor Green
} else {
    Write-Host " ❌ FALTA - Ejecuta: git init" -ForegroundColor Red
    $errores++
}

# 8. Verificar que existe .env.example
Write-Host "✓ Verificando .env.example..." -NoNewline
if (Test-Path ".env.example") {
    Write-Host " OK" -ForegroundColor Green
} else {
    Write-Host " ⚠️  FALTA (recomendado para documentación)" -ForegroundColor Yellow
    $advertencias++
}

# 9. Verificar dependencias importantes en package.json
Write-Host "✓ Verificando dependencias críticas..." -NoNewline
$packageJson = Get-Content "package.json" -Raw | ConvertFrom-Json
$requiredDeps = @("next", "react", "pg", "bcrypt", "jose", "jspdf")
$missingDeps = @()
foreach ($dep in $requiredDeps) {
    if (-not $packageJson.dependencies.$dep) {
        $missingDeps += $dep
    }
}
if ($missingDeps.Count -eq 0) {
    Write-Host " OK" -ForegroundColor Green
} else {
    Write-Host " ❌ FALTAN: $($missingDeps -join ', ')" -ForegroundColor Red
    $errores++
}

# 10. Verificar scripts de build
Write-Host "✓ Verificando scripts de build..." -NoNewline
if ($packageJson.scripts.build -and $packageJson.scripts.start) {
    Write-Host " OK" -ForegroundColor Green
} else {
    Write-Host " ❌ FALTAN scripts en package.json" -ForegroundColor Red
    $errores++
}

Write-Host ""
Write-Host "═══════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  📊 RESUMEN DE VALIDACIÓN" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════" -ForegroundColor Cyan

if ($errores -eq 0 -and $advertencias -eq 0) {
    Write-Host ""
    Write-Host "✅ ¡TODO LISTO PARA DESPLEGAR!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Próximos pasos:" -ForegroundColor Cyan
    Write-Host "1. Exportar base de datos: .\scripts\exportar_db.ps1" -ForegroundColor White
    Write-Host "2. Subir a GitHub: Ver GIT_COMANDOS.txt" -ForegroundColor White
    Write-Host "3. Configurar Neon: https://neon.tech" -ForegroundColor White
    Write-Host "4. Desplegar en Vercel: https://vercel.com" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "⚠️  ERRORES: $errores" -ForegroundColor $(if ($errores -gt 0) { "Red" } else { "Green" })
    Write-Host "⚠️  ADVERTENCIAS: $advertencias" -ForegroundColor $(if ($advertencias -gt 0) { "Yellow" } else { "Green" })
    Write-Host ""
    if ($errores -gt 0) {
        Write-Host "❌ Corrige los errores antes de desplegar" -ForegroundColor Red
    }
    if ($advertencias -gt 0) {
        Write-Host "⚠️  Las advertencias no son críticas pero se recomienda resolverlas" -ForegroundColor Yellow
    }
    Write-Host ""
}

Write-Host "═══════════════════════════════════════════════" -ForegroundColor Cyan
