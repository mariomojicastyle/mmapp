@echo off
title Reparador de Grasshopper 8.35
echo ===================================================
echo   REPARADOR DE GRASSHOPPER 8.35 (MARIO MOJICA)
echo ===================================================
echo.
echo 1. Cerrando procesos de Rhino y Grasshopper...
taskkill /F /IM Rhino.exe /T >nul 2>&1
taskkill /F /IM rhino.compute.exe /T >nul 2>&1
taskkill /F /IM compute.geometry.exe /T >nul 2>&1

echo 2. Accediendo a la carpeta de Grasshopper...
cd /d "C:\Program Files\Rhino 8\Plug-ins\Grasshopper"

if exist TBMA68D.tmp (
    echo 3. Reemplazando Grasshopper.dll a la version 8.35...
    if exist Grasshopper_8.34.bak del /F /Q Grasshopper_8.34.bak
    ren Grasshopper.dll Grasshopper_8.34.bak
    ren TBMA68D.tmp Grasshopper.dll
    echo.
    echo ===================================================
    echo   EXITO! Grasshopper.dll fue actualizado a 8.35!
    echo   Ya puedes abrir Rhino y Grasshopper con normalidad.
    echo ===================================================
) else (
    echo.
    echo TBMA68D.tmp no encontrado. Es posible que ya haya sido renombrado.
)
echo.
pause
