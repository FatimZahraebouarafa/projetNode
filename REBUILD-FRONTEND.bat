@echo off
echo ============================================
echo    REBUILD FRONTEND DOCKER
echo ============================================
echo.
echo Arret des conteneurs...
docker-compose down

echo.
echo Rebuild du frontend (avec les nouveaux changements)...
docker-compose build frontend --no-cache

echo.
echo Redemarrage de tous les conteneurs...
docker-compose up -d

echo.
echo ============================================
echo Status des conteneurs:
docker-compose ps
echo ============================================
echo.
echo Frontend disponible sur: http://localhost:3001
echo Backend disponible sur:  http://localhost:5000
echo.
echo N'oubliez pas de faire Ctrl+F5 dans le navigateur!
echo ============================================
pause
