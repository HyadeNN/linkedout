@echo off
echo Starting LinkedOut Development Environment...
echo.

REM Check if Python is installed
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Python is not installed or not in the PATH. Please install Python first.
    exit /b 1
)

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Node.js is not installed or not in the PATH. Please install Node.js first.
    exit /b 1
)

REM Create a Python virtual environment if it doesn't exist
if not exist backend\.venv (
    echo Creating Python virtual environment...
    python -m venv backend\.venv
    if %errorlevel% neq 0 (
        echo Failed to create Python virtual environment.
        exit /b 1
    )
)

REM Activate the virtual environment and install dependencies
echo Installing/Updating Python dependencies...
call backend\.venv\Scripts\activate.bat
pip install -r backend\requirements.txt
if %errorlevel% neq 0 (
    echo Failed to install Python dependencies.
    exit /b 1
)

REM Install Node.js dependencies
echo Installing/Updating Node.js dependencies...
cd frontend
call npm install
if %errorlevel% neq 0 (
    echo Failed to install Node.js dependencies.
    cd ..
    exit /b 1
)
cd ..

REM Start the backend and frontend in separate windows
echo Starting backend server...
start cmd /k "title LinkedOut Backend && call backend\.venv\Scripts\activate.bat && python -m backend.app.main"

echo Starting frontend development server...
start cmd /k "title LinkedOut Frontend && cd frontend && npm start"

echo.
echo Development environment started successfully!
echo Backend: http://localhost:8000
echo Frontend: http://localhost:3000
echo.
echo Test page: http://localhost:3000/test-api
echo.