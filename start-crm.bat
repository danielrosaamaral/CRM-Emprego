@echo off
setlocal
cd /d "%~dp0"

powershell -NoProfile -Command "if (Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue) { exit 1 } else { exit 0 }"
if errorlevel 1 (
	echo O CRM ja esta a correr ou a porta 3000 esta ocupada.
	pause
	exit /b 1
)

start "CRM Emprego Server" cmd /k "cd /d ""%~dp0"" && npm run dev"

for /l %%i in (1,1,30) do (
	powershell -NoProfile -Command "if (Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue) { exit 0 } else { exit 1 }"
	if not errorlevel 1 (
		start "" "http://localhost:3000/"
		exit /b 0
	)
	timeout /t 1 /nobreak >nul
)

echo O servidor nao respondeu na porta 3000 dentro do tempo esperado.
pause