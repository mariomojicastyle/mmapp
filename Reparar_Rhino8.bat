@echo off
echo ========================================================
echo   Reparando instalacion de Rhino 8 (8.35.26251)...
echo ========================================================
echo Por favor espera unos segundos mientras el instalador
echo restaura los archivos originales de Grasshopper.
echo.
msiexec.exe /famus "C:\ProgramData\Package Cache\{51160FAC-2B6D-4931-8480-FB94B1482C29}v8.35.26251.13001\rhino.msi" /qb
if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================================
    echo  [EXITO] Reparacion completada correctamente!
    echo ========================================================
    echo Ya puedes abrir Rhino 8 y ejecutar Grasshopper sin errores.
) else (
    echo.
    echo [ERROR] Codigo de salida: %ERRORLEVEL%
    echo Asegurate de ejecutar este archivo como Administrador.
)
echo.
pause
