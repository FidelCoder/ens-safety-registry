const express = require('express');
const { ethers } = require('ethers');
const { getContractInstance } = require('../utils/contract');
const { aggregateExternalData } = require('../utils/external');

const router = express.Router();

/**
 * GET /api/check/:address
 * Check if an address is flagged as malicious
 */
router.get('/:address', async (req, res) => {
  try {
    const { address } = req.params;

    // Validate address
    if (!ethers.isAddress(address)) {
      return res.status(400).json({ error: 'Invalid Ethereum address' });
    }

    const cache = req.app.get('cache');
    const cacheKey = `check_${address}`;

    // Check cache first
    const cached = cache.get(cacheKey);
    if (cached) {
      return res.json({ ...cached, cached: true });
    }

    // Get on-chain data
    const contract = getContractInstance();
    const [isFlagged, reportIds] = await contract.checkAddress(address);
    const riskScore = await contract.calculateRiskScore(address);
    
    // Get detailed privacy analysis
    const [privacyScore, privacyGrade, privacyFactors] = await contract.getPrivacyAnalysis(address);
    const gradeString = await contract.getPrivacyGradeString(privacyGrade);

    // Get external data (from known scam lists)
    const externalData = await aggregateExternalData(address);

    // Fetch report details
    const reports = [];
    for (const reportId of reportIds) {
      try {
        const report = await contract.getReport(reportId);
        reports.push({
          id: reportId.toString(),
          reporter: report.reporter,
          reason: getReasonLabel(Number(report.reason)),
          evidence: report.evidence,
          timestamp: Number(report.timestamp) * 1000,
          upvotes: Number(report.upvotes),
          downvotes: Number(report.downvotes)
        });
      } catch (err) {
        console.error(`Error fetching report ${reportId}:`, err);
      }
    }

    const result = {
      address,
      isFlagged,
      riskScore: Number(riskScore),
      privacyScore: Number(privacyScore),
      privacyGrade: gradeString,
      privacyFactors: {
        transactionActivity: Number(privacyFactors[0]),
        balanceExposure: Number(privacyFactors[1]),
        publicScrutiny: Number(privacyFactors[2]),
        addressReuse: Number(privacyFactors[3]),
        isContract: Number(privacyFactors[4]) === 1
      },
      reportCount: reports.length,
      reports,
      externalFlags: externalData,
      timestamp: new Date().toISOString()
    };

    // Cache the result
    cache.set(cacheKey, result);

    res.json(result);
  } catch (error) {
    console.error('Error checking address:', error);
    res.status(500).json({ error: 'Failed to check address' });
  }
});

function getReasonLabel(reasonCode) {
  const reasons = ['Phishing', 'Scam', 'RugPull', 'MaliciousContract', 'Spam', 'Other'];
  return reasons[reasonCode] || 'Unknown';
}

module.exports = router;
