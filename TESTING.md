# Testing Guide

## Testing Wallet Integration Locally

### Prerequisites
- MetaMask extension installed
- Anvil running on port 8545
- Backend API running on port 3001
- Frontend running on port 3000

### Setup MetaMask for Local Testing

1. **Add Anvil Network to MetaMask:**
   - Network Name: `Anvil Local`
   - RPC URL: `http://127.0.0.1:8545`
   - Chain ID: `31337`
   - Currency Symbol: `ETH`

2. **Import Anvil Test Account:**
   - Private Key: `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80`
   - This account has 10000 test ETH

### Test Flow

#### 1. Connect Wallet
- Open http://localhost:3000
- Click "🦊 Connect Wallet"
- Approve connection in MetaMask
- Should see wallet address displayed

#### 2. Submit a Report
- Search for an address or enter one manually
- Click "📝 Submit a Report"
- Fill in the form:
  - Target Address: `0x9876543210987654321098765432109876543210`
  - ENS Name: `test-scammer.eth` (optional)
  - Reason: Select from dropdown
  - Evidence: "This is a test report from local testing"
- Click "Submit Report"
- **Approve the transaction in MetaMask**
- Wait for confirmation
- Page will reload and show your report

#### 3. Vote on Report
- Search for the address you just reported
- Click the 👍 or 👎 button on the report
- **Approve the transaction in MetaMask**
- Wait for confirmation
- Vote count should update

#### 4. Check Backend API
```bash
# Check specific address
curl http://localhost:3001/api/check/0x9876543210987654321098765432109876543210 | jq

# List all reports
curl http://localhost:3001/api/reports | jq
```

### Troubleshooting

**MetaMask shows "Chain ID mismatch":**
- Make sure Anvil chain ID is 31337
- Reconnect wallet
- Refresh page

**Transaction fails:**
- Check Anvil is running
- Check contract address in .env matches deployed contract
- Make sure you have test ETH in your wallet

**"Nonce too high" error:**
- Reset MetaMask account: Settings → Advanced → Reset Account

**Frontend can't connect to backend:**
- Check backend is running on port 3001
- Check REACT_APP_API_URL in frontend/.env

**Contract not found:**
- Redeploy contract if Anvil was restarted
- Update CONTRACT_ADDRESS in backend/.env
- Update REACT_APP_CONTRACT_ADDRESS in frontend/.env

## Testing on Sepolia Testnet

### Prerequisites
- Get Sepolia ETH from faucet: https://sepoliafaucet.com/
- Deploy contract to Sepolia (see SETUP.md)

### Setup

1. **Update Backend .env:**
   ```bash
   CONTRACT_ADDRESS=<your_sepolia_contract_address>
   RPC_URL=https://eth-sepolia.g.alchemy.com/v2/<your_key>
   ```

2. **Update Frontend .env:**
   ```bash
   REACT_APP_CONTRACT_ADDRESS=<your_sepolia_contract_address>
   ```

3. **Add Sepolia to MetaMask:**
   - MetaMask should have Sepolia pre-configured
   - Switch network to "Sepolia test network"

4. **Test same flow as local** but on real testnet

---

## Expected Behavior

### Successful Report Submission:
1. MetaMask popup appears
2. Gas estimate shown
3. Approve transaction
4. "Report submitted successfully!" alert
5. Page reloads
6. New report visible in results

### Successful Vote:
1. MetaMask popup appears
2. Gas estimate shown  
3. Approve transaction
4. "Vote submitted successfully!" alert
5. Page reloads
6. Vote count updated

---

**Note:** Local Anvil testing is free and instant. Sepolia testing requires real testnet ETH and takes ~15 seconds per transaction.
