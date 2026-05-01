#!/bin/bash

# Script to start both backend and frontend servers
# Run this from the project root directory

echo "========================================"
echo "Starting Security Camera App"
echo "========================================"

# Check if we're in the right directory
if [ ! -f ".env" ]; then
  echo "Error: .env file not found. Are you in the project root?"
  exit 1
fi

echo ""
echo "Starting Backend Server (Port 5000)..."
cd backend
npm run dev &
BACKEND_PID=$!

echo ""
echo "Waiting 3 seconds for backend to start..."
sleep 3

echo ""
echo "Starting Frontend Server (Port 3000)..."
cd ../frontend
npm run dev &
FRONTEND_PID=$!

echo ""
echo "========================================"
echo "Both servers are starting!"
echo "========================================"
echo "Backend:  http://localhost:5000"
echo "Frontend: http://localhost:3000"
echo "========================================"
echo ""
echo "Press Ctrl+C to stop both servers"

# Wait for both processes
wait $BACKEND_PID $FRONTEND_PID
