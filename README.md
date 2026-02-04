# ENS Safety Registry 🛡️

Community-driven safety registry for Ethereum addresses and ENS names. A public good for Web3 security.

## What It Does

- **Report** malicious addresses on-chain
- **Vote** on reports (community validation)
- **Check** addresses via free public API
- **Protect** users from phishing and scams

## Tech Stack

- **Smart Contracts**: Solidity 0.8.20, Foundry
- **Backend**: Node.js, Express, ethers.js v6
- **Frontend**: React 18
- **Testing**: Foundry, Jest

## Project Structure

```
contracts/     # Smart contracts
backend/       # API server
frontend/      # React UI
```

## Quick Start

### Prerequisites
- Node.js v18+
- Foundry ([install](https://book.getfoundry.sh/getting-started/installation))

### Setup

```bash
# Clone
git clone https://github.com/FidelCoder/ens-safety-registry.git
cd ens-safety-registry

# Install Foundry dependencies
cd contracts
forge install foundry-rs/forge-std --no-commit
cd ..

# Install backend dependencies
cd backend && npm install && cd ..

# Install frontend dependencies
cd frontend && npm install && cd ..

# Setup environment
cp env.example .env
# Edit .env with your values
```

### Run Locally

```bash
# Terminal 1: Start Anvil (local blockchain)
anvil

# Terminal 2: Deploy contract
cd contracts
forge script script/Deploy.s.sol --rpc-url http://127.0.0.1:8545 \
  --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 \
  --broadcast

# Copy contract address to .env

# Terminal 3: Start backend
cd backend
npm run dev

# Terminal 4: Start frontend
cd frontend
npm start
```

## Testing

```bash
# Test contracts
cd contracts && forge test -vvv

# Test backend (when implemented)
cd backend && npm test
```

## Environment Variables

Copy `env.example` to `.env` and fill in:

```bash
# Smart Contract
CONTRACT_ADDRESS=          # After deployment
PRIVATE_KEY=              # Test key only!
RPC_URL=http://127.0.0.1:8545

# Backend
PORT=3001
REACT_APP_API_URL=http://localhost:3001
REACT_APP_CONTRACT_ADDRESS=  # Same as CONTRACT_ADDRESS
```

## Development Workflow

See [SETUP.md](SETUP.md) for detailed instructions.

### Git Workflow

```bash
# Create feature branch
git checkout -b feature/your-feature

# Make changes, test, commit
git add .
git commit -m "feat: add feature description"

# Push
git push origin feature/your-feature
```

### Commit Message Format

- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation
- `test:` - Tests
- `chore:` - Maintenance

## API Endpoints

- `GET /health` - Health check
- `GET /api/check/:address` - Check if address is flagged
- `GET /api/reports` - Get recent reports
- `GET /api/reports/:id` - Get specific report

## License

MIT License - see [LICENSE](LICENSE)

## Links

- **Grant Application**: [ENS Grants](https://ensgrants.xyz)
- **Foundry Docs**: https://book.getfoundry.sh
- **ethers.js**: https://docs.ethers.org/v6

---

Built for ENS Public Goods Builder Grants
