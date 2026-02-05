const { ethers } = require('ethers');
const { getProvider } = require('./contract');

/**
 * Calculate privacy score based on real on-chain data
 * @param {string} address - Ethereum address
 * @param {number} reportCount - Number of reports for this address
 */
async function calculatePrivacyScore(address, reportCount = 0) {
  try {
    const provider = getProvider();
    
    console.log(`\n🔍 Calculating privacy for: ${address}`);
    
    // 1. Get transaction count (both mainnet and current network)
    const txCount = await provider.getTransactionCount(address);
    console.log(`📊 Transaction count: ${txCount}`);
    
    // 2. Get current balance
    const balance = await provider.getBalance(address);
    const balanceInEth = Number(ethers.formatEther(balance));
    console.log(`💰 Balance: ${balanceInEth} ETH`);
    
    // 3. Check if it's a contract
    const code = await provider.getCode(address);
    const isContract = code !== '0x';
    console.log(`📝 Is contract: ${isContract}`);
    console.log(`👁️  Report count: ${reportCount}`);
    
    // 4. Calculate factors
    const factors = {
      transactionActivity: txCount,
      balanceExposure: balanceInEth,
      publicScrutiny: reportCount, // Number of reports = public exposure
      addressReuse: 0, // Skip for MVP (requires tx history analysis)
      isContract: isContract
    };
    
    // 5. Calculate privacy score (0-100, lower = worse privacy)
    let score = 100;
    
    // Transaction activity penalty (more txs = more exposure)
    if (txCount > 1000) score -= 30;
    else if (txCount > 500) score -= 25;
    else if (txCount > 100) score -= 20;
    else if (txCount > 50) score -= 15;
    else if (txCount > 10) score -= 10;
    else if (txCount > 0) score -= 5;
    
    // Balance exposure penalty (higher balance = more attractive target)
    if (balanceInEth > 100) score -= 30;
    else if (balanceInEth > 10) score -= 20;
    else if (balanceInEth > 1) score -= 15;
    else if (balanceInEth > 0.1) score -= 10;
    else if (balanceInEth > 0.01) score -= 5;
    
    // Public scrutiny penalty (reported addresses are publicly known)
    if (reportCount > 10) score -= 25;
    else if (reportCount > 5) score -= 20;
    else if (reportCount > 2) score -= 15;
    else if (reportCount > 0) score -= 10;
    
    // Contract addresses get penalty (more public)
    if (isContract) {
      score -= 10;
    }
    
    // Ensure score doesn't go below 0
    score = Math.max(0, score);
    
    // 6. Determine grade
    const grade = getPrivacyGrade(score);
    
    console.log(`✅ Privacy Score: ${score}/100 (Grade: ${grade})\n`);
    
    return {
      score,
      grade,
      factors,
      recommendations: getRecommendations(score, factors)
    };
    
  } catch (error) {
    console.error('Error calculating privacy score:', error);
    // Return default values on error
    return {
      score: 100,
      grade: 'A',
      factors: {
        transactionActivity: 0,
        balanceExposure: 0,
        publicScrutiny: 0,
        addressReuse: 0,
        isContract: false
      },
      recommendations: []
    };
  }
}

function getPrivacyGrade(score) {
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'F';
}

function getRecommendations(score, factors) {
  const recs = [];
  
  if (factors.transactionActivity > 50) {
    recs.push('Consider using fresh addresses for sensitive transactions');
  }
  
  if (factors.balanceExposure > 1) {
    recs.push('Consider splitting funds across multiple addresses');
  }
  
  if (factors.publicScrutiny > 0) {
    recs.push('This address is publicly flagged - consider using a new address');
  }
  
  if (factors.transactionActivity > 100) {
    recs.push('Use privacy tools like Tornado Cash alternatives or mixing services');
  }
  
  if (score < 70) {
    recs.push('This address has significant on-chain exposure');
  }
  
  return recs;
}

module.exports = {
  calculatePrivacyScore
};
