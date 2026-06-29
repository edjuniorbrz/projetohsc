@echo off
cd /d "C:\Users\ed010472\.gemini\antigravity\brain\fee54186-a897-4ee4-a2d5-34ab97c9d7fc"

REM Start Docker Desktop if not running
docker info >nul 2>&1
if errorlevel 1 (
    start "" "C:\Program Files\Docker\Docker\Docker Desktop.exe"
)

REM Wait for Docker daemon to become responsive
:wait_docker
docker info >nul 2>&1
if errorlevel 1 (
    timeout /t 2 >nul
    goto wait_docker
)

docker-compose up -d
pm2.cmd resurrect
