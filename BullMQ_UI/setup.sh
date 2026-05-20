#!/bin/bash
# Quick setup script for BullMQ Dashboard

echo "🚀 Setting up BullMQ Dashboard..."

# Check if .env exists
if [ ! -f .env ]; then
    echo "📝 Creating .env from template..."
    cp .env.example .env
    echo "✅ .env created. Please edit it with your Redis connection details."
else
    echo "✅ .env already exists"
fi

# Check Node modules
if [ ! -d node_modules ]; then
    echo "📦 Installing dependencies..."
    npm install
    echo "✅ Dependencies installed"
else
    echo "✅ Dependencies already installed"
fi

echo ""
echo "✨ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit .env with your Redis connection (Upstash or local)"
echo "2. Run: npm run dev"
echo "3. Open: http://localhost:3001/admin/queues"
echo ""
