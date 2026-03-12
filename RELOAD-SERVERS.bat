@echo off
echo ============================================
echo    RELANCER LES SERVEURS
echo ============================================
echo.

echo Arret des processus Node existants...
taskkill /F /IM node.exe 2>nul
timeout /t 2 /nobreak >nul

echo.
echo Demarrage du BACKEND...
start "BACKEND SERVER" cmd /k "cd /d %~dp0backend && npm start"
timeout /t 3 /nobreak >nul

echo.
echo Demarrage du FRONTEND...
start "FRONTEND SERVER" cmd /k "cd /d %~dp0frontend && set PORT=3001 && npm start"

echo.
echo ============================================
echo Les serveurs sont en cours de demarrage...
echo Backend: http://localhost:5000
echo Frontend: http://localhost:3001
echo ============================================
echo.
echo Appuyez sur une touche pour fermer cette fenetre...
pause >nul
