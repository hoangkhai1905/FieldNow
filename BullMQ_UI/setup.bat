@echo off
REM Quick setup script for BullMQ Dashboard (Windows)

echo.
echo 🚀 Setting up BullMQ Dashboard...
echo.

REM Check if .env exists
if not exist .env (
    echo 📝 Creating .env from template...
    copy .env.example .env
    echo ✅ .env created. Please edit it with your Redis connection details.
) else (
    echo ✅ .env already exists
)

REM Check node_modules
if not exist node_modules (
    echo 📦 Installing dependencies...
    call npm install
    echo ✅ Dependencies installed
) else (
    echo ✅ Dependencies already installed
)

echo.
echo ✨ Setup complete!
echo.
echo Next steps:
echo 1. Edit .env with your Redis connection ^(Upstash or local^)
echo 2. Run: npm run dev
echo 3. Open: http://localhost:3001/admin/queues
echo.
pause
