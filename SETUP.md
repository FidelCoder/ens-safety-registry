# Setup Guide

## Prerequisites

1. **Node.js** v18+ ([download](https://nodejs.org/))
2. **Foundry** - Solidity toolkit
   ```bash
   curl -L https://foundry.paradigm.xyz | bash
   foundryup
   ```
3. **Git**
4. **MetaMask** or compatible wallet (for testing)

## Installation

### 1. Clone Repository
```bash
git clone https://github.com/FidelCoder/ens-safety-registry.git
cd ens-safety-registry
```

### 2. Install Dependencies

**Contracts:**
```bash
cd contracts
forge install foundry-rs/forge-std --no-commit
cd ..
```

**Backend:**
```bash
cd backend
npm install
cd ..
```

**Frontend:**
```bash
cd frontend
npm install
cd ..
```

### 3. Setup Environment Variables

```bash
cp env.example .env
```

Edit `.env`:
```bash
# For local development
RPC_URL=http://127.0.0.1:8545
PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80  # Anvil default

# Backend
PORT=3001

# Frontend
REACT_APP_API_URL=http://localhost:3001
```

## Running Locally

### Step 1: Start Anvil (Local Blockchain)

In terminal 1:
```bash
anvil
```

Keep this running! It provides test accounts with ETH.

### Step 2: Deploy Contract

In terminal 2:
```bash
cd contracts
forge test  # Run tests first

# Deploy
forge script script/Deploy.s.sol \
  --rpc-url http://127.0.0.1:8545 \
  --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 \
  --broadcast
```

Copy the deployed contract address and update `.env`:
```bash
CONTRACT_ADDRESS=0x...
REACT_APP_CONTRACT_ADDRESS=0x...
```

### Step 3: Start Backend

In terminal 3:
```bash
cd backend
npm run dev
```

Should see: `🛡️ ENS Safety Registry API running on port 3001`

### Step 4: Start Frontend

In terminal 4:
```bash
cd frontend
npm start
```

Browser opens at http://localhost:3000

## Testing

### Test Smart Contract
```bash
cd contracts
forge test -vvv
```

### Test API
```bash
curl http://localhost:3001/health
```

### Test Contract Interaction
```bash
# Check report count
cast call <CONTRACT_ADDRESS> "reportCount()" --rpc-url http://127.0.0.1:8545

# Submit report
cast send <CONTRACT_ADDRESS> \
  "submitReport(address,string,uint8,string)" \
  0x1234567890123456789012345678901234567890 \
  "test.eth" \
  0 \
  "Test evidence" \
  --rpc-url http://127.0.0.1:8545 \
  --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
```

## Troubleshooting

### Port Already in Use
```bash
# Kill process on port 3001
lsof -ti:3001 | xargs kill -9

# Kill process on port 3000
lsof -ti:3000 | xargs kill -9
```

### Contract Not Found
- Check `CONTRACT_ADDRESS` in `.env`
- Ensure Anvil is running
- Redeploy contract

### API Can't Connect
- Verify `RPC_URL` in `.env`
- Check Anvil is running on port 8545
- Restart backend after changing `.env`

### Foundry Issues
```bash
# Update Foundry
foundryup

# Clean and rebuild
forge clean
forge build
```

## Deploying to Testnet

### Sepolia Testnet

1. Get Sepolia ETH from [faucet](https://sepoliafaucet.com/)

2. Update `.env`:
   ```bash
   RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY
   PRIVATE_KEY=your_real_private_key  # KEEP SECRET!
   ```

3. Deploy:
   ```bash
   cd contracts
   forge script script/Deploy.s.sol --rpc-url $RPC_URL --private-key $PRIVATE_KEY --broadcast --verify
   ```

4. Update `.env` with deployed address

5. Restart backend and frontend

## Next Steps

1. Test all features locally
2. Deploy to testnet
3. Create demo video
4. Apply for ENS grant

## Need Help?

- Check contract tests: `forge test -vvv`
- Check API logs: `npm run dev`
- Review error messages carefully
- Ensure all services are running
