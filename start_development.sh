#!/bin/bash

echo "Starting LinkedOut Development Environment..."
echo

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "Python 3 is not installed. Please install Python 3 first."
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Create a Python virtual environment if it doesn't exist
if [ ! -d "backend/.venv" ]; then
    echo "Creating Python virtual environment..."
    python3 -m venv backend/.venv
    if [ $? -ne 0 ]; then
        echo "Failed to create Python virtual environment."
        exit 1
    fi
fi

# Activate the virtual environment and install dependencies
echo "Installing/Updating Python dependencies..."
source backend/.venv/bin/activate
pip install -r backend/requirements.txt
if [ $? -ne 0 ]; then
    echo "Failed to install Python dependencies."
    exit 1
fi

# Install Node.js dependencies
echo "Installing/Updating Node.js dependencies..."
cd frontend
npm install
if [ $? -ne 0 ]; then
    echo "Failed to install Node.js dependencies."
    cd ..
    exit 1
fi
cd ..

# Start the backend and frontend in separate terminals
echo "Starting backend server..."
if command -v gnome-terminal &> /dev/null; then
    # For GNOME-based systems
    gnome-terminal -- bash -c "source backend/.venv/bin/activate && python -m backend.app.main; exec bash"
elif command -v xterm &> /dev/null; then
    # For systems with xterm
    xterm -e "source backend/.venv/bin/activate && python -m backend.app.main; exec bash" &
elif command -v open &> /dev/null; then
    # For macOS
    osascript -e 'tell app "Terminal" to do script "cd '$(pwd)' && source backend/.venv/bin/activate && python -m backend.app.main"'
else
    # Fall back to running in the background
    echo "No supported terminal found. Running backend in the background."
    source backend/.venv/bin/activate && python -m backend.app.main &
fi

echo "Starting frontend development server..."
if command -v gnome-terminal &> /dev/null; then
    # For GNOME-based systems
    gnome-terminal -- bash -c "cd frontend && npm start; exec bash"
elif command -v xterm &> /dev/null; then
    # For systems with xterm
    xterm -e "cd frontend && npm start; exec bash" &
elif command -v open &> /dev/null; then
    # For macOS
    osascript -e 'tell app "Terminal" to do script "cd '$(pwd)'/frontend && npm start"'
else
    # Fall back to running in the background
    echo "No supported terminal found. Running frontend in the background."
    cd frontend && npm start &
    cd ..
fi

echo
echo "Development environment started successfully!"
echo "Backend: http://localhost:8000"
echo "Frontend: http://localhost:3000"
echo
echo "Test page: http://localhost:3000/test-api"
echo