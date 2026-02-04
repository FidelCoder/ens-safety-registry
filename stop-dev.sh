#!/bin/bash

# ENS Safety Registry - Stop Development Services

echo "🛑 Stopping ENS Safety Registry services..."
echo ""

# Stop frontend
echo "Stopping frontend..."
pkill -f "react-scripts start" && echo "✅ Frontend stopped" || echo "ℹ️  Frontend not running"

# Stop backend
echo "Stopping backend..."
pkill -f "node src/index.js" && echo "✅ Backend stopped" || echo "ℹ️  Backend not running"

# Stop Anvil
echo "Stopping Anvil..."
pkill -f "anvil" && echo "✅ Anvil stopped" || echo "ℹ️  Anvil not running"

echo ""
echo "✅ All services stopped"
