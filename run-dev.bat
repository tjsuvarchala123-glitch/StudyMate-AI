@echo off
echo ===============================================================
echo     StudyMate AI - Alexa+-Inspired Student Assistant
echo            Amazon Developer Hackathon Submission
echo ===============================================================
echo.

echo Starting FastAPI backend on http://127.0.0.1:8000 ...
start "StudyMate Backend" cmd /k "cd backend && python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload"

timeout /t 2 /nobreak >nul

echo Starting Vite React frontend on http://127.0.0.1:5173 ...
start "StudyMate Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo Both servers are spinning up!
echo Access the application in your browser at: http://127.0.0.1:5173
echo.
pause
