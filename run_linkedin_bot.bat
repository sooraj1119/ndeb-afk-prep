@echo off
echo ==========================================================
echo    Starting LinkedIn Anti-Sniper Auto-Apply AI Bot
echo ==========================================================

echo [1/2] Starting Backend FastAPI Server on http://127.0.0.1:8000 ...
start "LinkedIn Job Bot - Backend" cmd /k "cd /d c:\Users\sooraj\.gemini\antigravity\playground\dark-pulsar\linkedin-job-bot\backend && python main.py"

echo [2/2] Starting Frontend Vite Dashboard on http://localhost:5173 ...
start "LinkedIn Job Bot - Frontend" cmd /k "cd /d c:\Users\sooraj\.gemini\antigravity\playground\dark-pulsar\linkedin-job-bot\frontend && npm run dev"

echo Waiting 5 seconds for servers to initialize...
timeout /t 5 /nobreak > nul

echo Opening browser to dashboard...
start http://localhost:5173

echo.
echo Both servers have been launched in separate console windows.
echo You can manage the bot entirely through the browser dashboard.
echo ==========================================================
