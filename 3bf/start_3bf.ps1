# ==============================================================================
# Script de Arranque Unificado para 3DBimFab (3BF)
# Inicia RhinoCompute 8, 3BF Python Worker Engine y la Web App Next.js 3BF
# ==============================================================================

Write-Host "🚀 Iniciando Protocolo de Arranque Unificado 3DBimFab (3BF)..." -ForegroundColor Cyan

# 1. Ruta de RhinoCompute 8
$rhinoComputeExe = "$env:USERPROFILE\AppData\Roaming\McNeel\Rhinoceros\packages\8.0\Hops\0.17.0\rhino.compute\rhino.compute.exe"
$3bfFolder = "C:\Desarrollo\mmapp\3BF"

# 2. Iniciar RhinoCompute 8 si no está activo (Puerto 5000)
$rcTest = Get-NetTCPConnection -LocalPort 5000 -ErrorAction SilentlyContinue
if (-not $rcTest) {
    Write-Host "⚡ arrancando RhinoCompute 8 (Puerto 5000)..." -ForegroundColor Yellow
    Start-Process -FilePath $rhinoComputeExe -WindowStyle Hidden
    Start-Sleep -Seconds 2
} else {
    Write-Host "✅ RhinoCompute 8 ya se encuentra activo en puerto 5000." -ForegroundColor Green
}

# 3. Iniciar 3BF Python Worker Engine si no está activo (Puerto 8005)
$workerTest = Get-NetTCPConnection -LocalPort 8005 -ErrorAction SilentlyContinue
if (-not $workerTest) {
    Write-Host "⚡ arrancando 3BF Worker Python Engine (Puerto 8005)..." -ForegroundColor Yellow
    Start-Process -FilePath "python" -ArgumentList "-u worker/3bf_worker.py" -WorkingDirectory $3bfFolder -WindowStyle Hidden
    Start-Sleep -Seconds 2
} else {
    Write-Host "✅ 3BF Worker Python Engine ya se encuentra activo en puerto 8005." -ForegroundColor Green
}

# 4. Iniciar Aplicación Web Next.js si no está activa (Puerto 3005)
$webTest = Get-NetTCPConnection -LocalPort 3005 -ErrorAction SilentlyContinue
if (-not $webTest) {
    Write-Host "⚡ arrancando Aplicación Web Next.js 3BF (Puerto 3005)..." -ForegroundColor Yellow
    Start-Process -FilePath "npm" -ArgumentList "run dev" -WorkingDirectory $3bfFolder -WindowStyle Hidden
    Start-Sleep -Seconds 3
} else {
    Write-Host "✅ Aplicación Web Next.js ya se encuentra activa en puerto 3005." -ForegroundColor Green
}

Write-Host "`n🎉 ¡Ecosistema 3DBimFab 100% Operativo!" -ForegroundColor Green
Write-Host "🌐 Web UI: http://localhost:3005" -ForegroundColor Cyan
Write-Host "🐍 Worker API: http://localhost:8005" -ForegroundColor Cyan
Write-Host "🦏 RhinoCompute API: http://localhost:5000`n" -ForegroundColor Cyan
