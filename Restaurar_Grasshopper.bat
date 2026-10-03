@echo off
echo ========================================================
echo   Restaurando Grasshopper.dll para Rhino 8...
echo ========================================================
copy /Y "C:\Program Files\Rhino 8\Plug-ins\Grasshopper\Grasshopper_8.34.bak" "C:\Program Files\Rhino 8\Plug-ins\Grasshopper\Grasshopper.dll"
if %ERRORLEVEL% EQU 0 (
    echo.
    echo [EXITO] Grasshopper.dll ha sido restaurado correctamente.
    echo Ya puedes abrir Grasshopper en Rhino 8.
) else (
    echo.
    echo [ERROR] No se pudo copiar. Asegurate de ejecutar este archivo como Administrador.
)
echo.
pause
