# ENS Safety Registry 🛡️

Community-driven safety registry for Ethereum addresses and ENS names. A public good for Web3 security.

## 🌐 Live Deployment

- **Frontend**: [https://beamish-mandazi-4440f4.netlify.app](https://beamish-mandazi-4440f4.netlify.app)
- **Backend API**: [https://backend-griffins-projects-4324ce43.vercel.app](https://backend-griffins-projects-4324ce43.vercel.app)
- **Contract (Sepolia)**: `0x69Ba96799Bd414968854A3cb35162d33683554C2`

## What It Does

- **Report** malicious addresses on-chain
- **Vote** on reports (community validation)
- **Check** addresses for security & privacy risks
- **Protect** users from phishing and scams

## Tech Stack

- **Smart Contracts**: Solidity 0.8.20, Foundry
- **Backend**: Node.js, Express, ethers.js v6
- **Frontend**: React 18

## Quick Start

```bash
# Clone
git clone https://github.com/FidelCoder/ens-safety-registry.git
cd ens-safety-registry

# Install dependencies
cd contracts && forge install foundry-rs/forge-std && cd ..
cd backend && npm install && cd ..
cd frontend && npm install && cd ..

# Start everything
./start-dev.sh
```

## Contributing

This is a **public good** built for the Web3 community. Contributions welcome!

- 🐛 Found a bug? Open an issue
- 💡 Have an idea? Start a discussion
- 🔧 Want to code? Fork, branch, and submit a PR

We welcome improvements to:
- Privacy scoring algorithms
- UI/UX enhancements
- Additional security checks
- Documentation

## API Endpoints

- `GET /health` - Health check
- `GET /api/check/:address` - Check address safety & privacy
- `GET /api/reports` - Get recent reports

## License

MIT License - Open source public good
