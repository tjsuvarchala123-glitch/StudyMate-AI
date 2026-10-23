#!/usr/bin/env bash
echo "==============================================================="
echo "    StudyMate AI - Alexa+-Inspired Student Assistant"
echo "           Amazon Developer Hackathon Submission"
echo "==============================================================="

# Start backend
cd backend
python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload &
BACKEND_PID=$!
cd ..

# Start frontend
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

echo "StudyMate AI is running!"
echo "Backend: http://127.0.0.1:8000"
echo "Frontend: http://127.0.0.1:5173"

trap "kill $BACKEND_PID $FRONTEND_PID" EXIT
wait
