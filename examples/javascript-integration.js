/**
 * Example: Integrate ENS Safety Registry into your JavaScript/Node.js app
 */

const API_URL = 'http://localhost:3001';

/**
 * Check if an address is flagged as malicious
 * @param {string} address - Ethereum address to check
 * @returns {Promise<Object>} Safety check result
 */
async function checkAddress(address) {
  try {
    const response = await fetch(`${API_URL}/api/check/${address}`);
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Failed to check address:', error);
    return null;
  }
}

/**
 * Display a warning if address is risky
 * @param {string} address - Address to check
 */
async function warnIfRisky(address) {
  const result = await checkAddress(address);
  
  if (!result) {
    console.log('⚠️  Unable to verify address safety');
    return;
  }
  
  if (result.isFlagged) {
    console.warn(`🚨 WARNING: This address has been flagged as malicious!`);
    console.warn(`   Risk Score: ${result.riskScore}/100`);
    console.warn(`   Reports: ${result.reportCount}`);
    
    if (result.reports.length > 0) {
      console.warn(`   Latest report: ${result.reports[0].reason}`);
    }
    
    return false; // Block transaction
  } else if (result.riskScore > 30) {
    console.warn(`⚠️  CAUTION: This address has a moderate risk score (${result.riskScore}/100)`);
    return true; // Allow but warn
  } else {
    console.log(`✅ Address appears safe (Risk: ${result.riskScore}/100)`);
    return true;
  }
}

/**
 * Get recent reports
 * @param {number} limit - Number of reports to fetch
 */
async function getRecentReports(limit = 10) {
  try {
    const response = await fetch(`${API_URL}/api/reports?limit=${limit}`);
    const data = await response.json();
    return data.reports;
  } catch (error) {
    console.error('Failed to fetch reports:', error);
    return [];
  }
}

/**
 * Example: Check address before sending transaction
 */
async function beforeTransaction(toAddress, amount) {
  console.log(`Preparing to send ${amount} ETH to ${toAddress}...`);
  
  const isSafe = await warnIfRisky(toAddress);
  
  if (!isSafe) {
    console.log('❌ Transaction blocked for safety');
    return false;
  }
  
  console.log('✅ Proceeding with transaction');
  return true;
}

// ============================================
// Usage Examples
// ============================================

// Example 1: Check a single address
checkAddress('0x1234567890123456789012345678901234567890')
  .then(result => {
    console.log('Safety Check Result:', result);
  });

// Example 2: Check before transaction
beforeTransaction('0x1234567890123456789012345678901234567890', '1.5');

// Example 3: Get recent community reports
getRecentReports(5)
  .then(reports => {
    console.log('Recent Reports:', reports);
  });

// ============================================
// Browser Extension Example
// ============================================

/**
 * Monitor MetaMask transactions and warn users
 */
if (typeof window !== 'undefined' && window.ethereum) {
  // Listen for transaction requests
  const originalRequest = window.ethereum.request;
  
  window.ethereum.request = async function(args) {
    // Intercept eth_sendTransaction
    if (args.method === 'eth_sendTransaction' && args.params[0].to) {
      const toAddress = args.params[0].to;
      
      const isSafe = await warnIfRisky(toAddress);
      
      if (!isSafe) {
        const proceed = confirm(
          'WARNING: This address has been flagged as potentially malicious.\n\n' +
          'Do you want to proceed anyway?'
        );
        
        if (!proceed) {
          throw new Error('Transaction cancelled by user (safety check)');
        }
      }
    }
    
    return originalRequest.call(this, args);
  };
  
  console.log('🛡️ ENS Safety Registry protection enabled');
}

// ============================================
// React Hook Example
// ============================================

/**
 * Custom React hook for address safety check
 */
function useSafetyCheck(address) {
  const [result, setResult] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  
  React.useEffect(() => {
    if (!address) return;
    
    setLoading(true);
    checkAddress(address)
      .then(setResult)
      .finally(() => setLoading(false));
  }, [address]);
  
  return { result, loading };
}

// Usage in React component:
// const { result, loading } = useSafetyCheck(walletAddress);
// if (result?.isFlagged) return <Warning />;

module.exports = {
  checkAddress,
  warnIfRisky,
  getRecentReports,
  beforeTransaction
};
