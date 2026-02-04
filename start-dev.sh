#!/bin/bash

# ENS Safety Registry - Development Startup Script

echo "🚀 Starting ENS Safety Registry Development Environment..."
echo ""

# Check if Anvil is already running
if curl -s -X POST http://127.0.0.1:8545 > /dev/null 2>&1; then
    echo "✅ Anvil already running on port 8545"
else
    echo "🔧 Starting Anvil (local blockchain)..."
    anvil > /dev/null 2>&1 &
    sleep 3
    echo "✅ Anvil started on port 8545"
fi

# Deploy contract
echo ""
echo "📝 Deploying SafetyRegistry contract..."
cd contracts
CONTRACT_OUTPUT=$(forge script script/Deploy.s.sol \
    --rpc-url http://127.0.0.1:8545 \
    --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 \
    --broadcast 2>&1)

CONTRACT_ADDRESS=$(echo "$CONTRACT_OUTPUT" | grep "deployed to:" | awk '{print $NF}')

if [ -z "$CONTRACT_ADDRESS" ]; then
    echo "❌ Failed to deploy contract"
    exit 1
fi

echo "✅ Contract deployed to: $CONTRACT_ADDRESS"
cd ..

# Update backend .env
echo ""
echo "🔧 Updating backend configuration..."
cat > backend/.env << EOF
CONTRACT_ADDRESS=$CONTRACT_ADDRESS
RPC_URL=http://127.0.0.1:8545
PORT=3001
NODE_ENV=development
EOF
echo "✅ Backend .env updated"

# Update frontend .env
echo ""
echo "🔧 Updating frontend configuration..."
cat > frontend/.env << EOF
REACT_APP_API_URL=http://localhost:3001
REACT_APP_CONTRACT_ADDRESS=$CONTRACT_ADDRESS
EOF
echo "✅ Frontend .env updated"

# Start backend
echo ""
echo "🔧 Starting backend API..."
cd backend
node src/index.js > /dev/null 2>&1 &
BACKEND_PID=$!
sleep 2
cd ..

if curl -s http://localhost:3001/health > /dev/null 2>&1; then
    echo "✅ Backend API running on port 3001"
else
    echo "❌ Backend failed to start"
    exit 1
fi

# Start frontend
echo ""
echo "🔧 Starting frontend..."
cd frontend
BROWSER=none npm start > /dev/null 2>&1 &
FRONTEND_PID=$!
cd ..

echo ""
echo "⏳ Waiting for frontend to compile..."
sleep 20

if curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo "✅ Frontend running on port 3000"
else
    echo "⚠️  Frontend is starting (may take 1-2 minutes)"
fi

# Summary
echo ""
echo "=================================================="
echo "🎉 ENS Safety Registry is ready!"
echo "=================================================="
echo ""
echo "📍 Service URLs:"
echo "   - Frontend:  http://localhost:3000"
echo "   - Backend:   http://localhost:3001"
echo "   - Anvil:     http://127.0.0.1:8545"
echo ""
echo "📝 Contract Address: $CONTRACT_ADDRESS"
echo ""
echo "🧪 Test Account (for MetaMask):"
echo "   Private Key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
echo "   Address: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
echo ""
echo "📚 Next Steps:"
echo "   1. Open http://localhost:3000 in your browser"
echo "   2. Install MetaMask extension"
echo "   3. Add Anvil network (Chain ID: 31337, RPC: http://127.0.0.1:8545)"
echo "   4. Import test account using private key above"
echo "   5. Connect wallet and start testing!"
echo ""
echo "📖 See TESTING.md for detailed instructions"
echo "=================================================="
