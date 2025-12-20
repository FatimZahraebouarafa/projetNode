@echo off
echo ================================================
echo Creation du compte administrateur RABTA
echo ================================================
echo.

cd /d "%~dp0"
node insertAdmin.js

echo.
echo ================================================
echo Appuyez sur une touche pour fermer...
pause > nul
