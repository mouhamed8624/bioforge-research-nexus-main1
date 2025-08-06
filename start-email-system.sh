#!/bin/bash

echo "🚀 Starting Email Notification System..."

# Function to cleanup background processes
cleanup() {
    echo "🛑 Shutting down servers..."
    pkill -f "node.*emailServer.js"
    pkill -f "vite"
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Start the email server in the background
echo "📧 Starting email server on port 3001..."
node server/emailServer.js &
EMAIL_SERVER_PID=$!

# Wait a moment for the server to start
sleep 2

# Check if email server started successfully
if ! curl -s http://localhost:3001/api/health > /dev/null; then
    echo "❌ Email server failed to start"
    exit 1
fi

echo "✅ Email server is running on http://localhost:3001"

# Start the frontend development server
echo "🌐 Starting frontend on port 8084..."
npm run dev &
FRONTEND_PID=$!

echo ""
echo "🎉 Email Notification System is running!"
echo "📧 Email Server: http://localhost:3001"
echo "🌐 Frontend: http://localhost:8084"
echo ""
echo "Press Ctrl+C to stop both servers"

# Wait for both processes
wait $EMAIL_SERVER_PID $FRONTEND_PID 