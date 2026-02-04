const express = require('express');
const { ethers } = require('ethers');
const { getContractInstance } = require('../utils/contract');

const router = express.Router();

/**
 * GET /api/reports
 * Get recent reports (paginated)
 */
router.get('/', async (req, res) => {
  try {
    const { limit = 20, offset = 0 } = req.query;
    const contract = getContractInstance();
    
    const reportCount = await contract.reportCount();
    const totalReports = Number(reportCount);
    
    const start = Math.max(0, totalReports - offset - limit);
    const end = totalReports - offset;
    
    const reports = [];
    for (let i = end - 1; i >= start; i--) {
      if (i < 0) break;
      
      try {
        const report = await contract.getReport(i);
        reports.push({
          id: i,
          targetAddress: report.targetAddress,
          ensName: report.ensName || null,
          reason: getReasonLabel(Number(report.reason)),
          evidence: report.evidence,
          timestamp: Number(report.timestamp) * 1000,
          upvotes: Number(report.upvotes),
          downvotes: Number(report.downvotes),
          resolved: report.resolved
        });
      } catch (err) {
        console.error(`Error fetching report ${i}:`, err);
      }
    }

    res.json({
      reports,
      total: totalReports,
      limit: Number(limit),
      offset: Number(offset)
    });
  } catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
});

/**
 * GET /api/reports/:id
 * Get a specific report by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const contract = getContractInstance();
    
    const report = await contract.getReport(id);
    
    res.json({
      id,
      reporter: report.reporter,
      targetAddress: report.targetAddress,
      ensName: report.ensName || null,
      reason: getReasonLabel(Number(report.reason)),
      evidence: report.evidence,
      timestamp: Number(report.timestamp) * 1000,
      upvotes: Number(report.upvotes),
      downvotes: Number(report.downvotes),
      resolved: report.resolved
    });
  } catch (error) {
    console.error('Error fetching report:', error);
    res.status(404).json({ error: 'Report not found' });
  }
});

/**
 * POST /api/reports
 * Submit a new report (requires signed transaction)
 */
router.post('/', async (req, res) => {
  try {
    const { targetAddress, ensName, reason, evidence, signature } = req.body;

    if (!ethers.isAddress(targetAddress)) {
      return res.status(400).json({ error: 'Invalid target address' });
    }

    if (!evidence || evidence.length < 10) {
      return res.status(400).json({ error: 'Evidence is required (min 10 characters)' });
    }

    // This endpoint provides info for frontend to submit transaction
    // Actual submission happens on client side via wallet
    res.json({
      message: 'Use the frontend or submit transaction directly to the contract',
      contract: process.env.CONTRACT_ADDRESS,
      method: 'submitReport',
      params: {
        targetAddress,
        ensName: ensName || '',
        reason: getReasonCode(reason),
        evidence
      }
    });
  } catch (error) {
    console.error('Error preparing report:', error);
    res.status(500).json({ error: 'Failed to prepare report' });
  }
});

function getReasonLabel(reasonCode) {
  const reasons = ['Phishing', 'Scam', 'RugPull', 'MaliciousContract', 'Spam', 'Other'];
  return reasons[reasonCode] || 'Unknown';
}

function getReasonCode(reasonLabel) {
  const reasons = {
    'Phishing': 0,
    'Scam': 1,
    'RugPull': 2,
    'MaliciousContract': 3,
    'Spam': 4,
    'Other': 5
  };
  return reasons[reasonLabel] || 5;
}

module.exports = router;
