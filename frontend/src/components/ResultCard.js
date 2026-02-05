import React, { useState } from 'react';
import './ResultCard.css';
import { getProviderAndSigner } from '../utils/wallet';
import { voteOnReport } from '../utils/contract';

function ResultCard({ result, onReport, account }) {
  const { 
    address, 
    isFlagged, 
    riskScore, 
    privacyScore, 
    privacyGrade,
    privacyFactors,
    reportCount, 
    reports, 
    externalFlags 
  } = result;
  const [voting, setVoting] = useState(null);

  const getRiskLevel = (score) => {
    if (score >= 70) return { label: 'High Risk', color: '#e74c3c' };
    if (score >= 40) return { label: 'Medium Risk', color: '#f39c12' };
    if (score > 0) return { label: 'Low Risk', color: '#f1c40f' };
    return { label: 'No Risk', color: '#2ecc71' };
  };

  const getPrivacyLevel = (score, grade) => {
    // Map grades to colors and icons
    const gradeMap = {
      'A+': { color: '#2ecc71', icon: '🌟', label: 'Excellent Privacy' },
      'A': { color: '#27ae60', icon: '✨', label: 'Great Privacy' },
      'B': { color: '#3498db', icon: '👍', label: 'Good Privacy' },
      'C': { color: '#f39c12', icon: '⚠️', label: 'Fair Privacy' },
      'D': { color: '#e67e22', icon: '🔶', label: 'Poor Privacy' },
      'F': { color: '#e74c3c', icon: '🚨', label: 'Critical Privacy Risk' }
    };
    
    return gradeMap[grade] || gradeMap['C'];
  };

  const getFactorSeverity = (factorName, value) => {
    if (factorName === 'transactionActivity') {
      if (value > 50) return { level: 'High', color: '#e74c3c' };
      if (value > 20) return { level: 'Medium', color: '#f39c12' };
      if (value > 10) return { level: 'Low', color: '#3498db' };
      return { level: 'Minimal', color: '#2ecc71' };
    }
    if (factorName === 'balanceExposure') {
      if (value > 10) return { level: 'High', color: '#e74c3c' };
      if (value > 1) return { level: 'Medium', color: '#f39c12' };
      if (value > 0) return { level: 'Low', color: '#3498db' };
      return { level: 'None', color: '#2ecc71' };
    }
    if (factorName === 'publicScrutiny' || factorName === 'addressReuse') {
      if (value > 5) return { level: 'High', color: '#e74c3c' };
      if (value > 2) return { level: 'Medium', color: '#f39c12' };
      if (value > 0) return { level: 'Low', color: '#3498db' };
      return { level: 'None', color: '#2ecc71' };
    }
    return { level: 'N/A', color: '#95a5a6' };
  };

  const risk = getRiskLevel(riskScore);
  const privacy = getPrivacyLevel(privacyScore || 0, privacyGrade || 'C');

  const handleVote = async (reportId, isUpvote) => {
    if (!account) {
      alert('Please connect your wallet to vote');
      return;
    }

    setVoting(reportId);
    
    try {
      const { signer } = await getProviderAndSigner();
      await voteOnReport(signer, reportId, isUpvote);
      
      alert('Vote submitted successfully!');
      setTimeout(() => window.location.reload(), 2000);
    } catch (error) {
      console.error('Error voting:', error);
      alert('Failed to vote: ' + error.message);
    } finally {
      setVoting(null);
    }
  };

  return (
    <div className="result-card">
      <div className="result-header">
        <h2>Safety Check Result</h2>
        <div className="status-badge" style={{ background: risk.color }}>
          {isFlagged ? '⚠️ Flagged' : '✓ Clean'}
        </div>
      </div>

      <div className="result-body">
        <div className="result-section">
          <label>Address:</label>
          <code className="address-code">{address}</code>
        </div>

        <div className="result-section">
          <label>Security Risk Score:</label>
          <div className="risk-display">
            <div className="risk-bar-container">
              <div 
                className="risk-bar" 
                style={{ 
                  width: `${riskScore}%`,
                  background: risk.color 
                }}
              />
            </div>
            <span className="risk-label" style={{ color: risk.color }}>
              {riskScore}/100 - {risk.label}
            </span>
          </div>
        </div>

        <div className="result-section privacy-section">
          <div className="privacy-header">
            <label>Privacy Analysis:</label>
            <div className="privacy-grade-badge" style={{ background: privacy.color }}>
              Grade: {privacyGrade || 'N/A'}
            </div>
          </div>
          
          <div className="risk-display">
            <div className="risk-bar-container">
              <div 
                className="risk-bar" 
                style={{ 
                  width: `${privacyScore || 0}%`,
                  background: privacy.color 
                }}
              />
            </div>
            <span className="risk-label" style={{ color: privacy.color }}>
              {privacy.icon} {privacyScore || 0}/100 - {privacy.label}
            </span>
          </div>
          
          <p className="privacy-explanation">
            Higher score = better privacy. Score reflects on-chain exposure and activity patterns.
          </p>

          {privacyFactors && (
            <div className="privacy-factors">
              <h4>Privacy Factors:</h4>
              
              <div className="factor-item">
                <div className="factor-header">
                  <span className="factor-name">📊 Transaction Activity</span>
                  <span className="factor-value" style={{ 
                    color: getFactorSeverity('transactionActivity', privacyFactors.transactionActivity).color 
                  }}>
                    {privacyFactors.transactionActivity} txs ({getFactorSeverity('transactionActivity', privacyFactors.transactionActivity).level})
                  </span>
                </div>
                <p className="factor-tip">More transactions = more on-chain footprint</p>
              </div>

              <div className="factor-item">
                <div className="factor-header">
                  <span className="factor-name">💰 Balance Exposure</span>
                  <span className="factor-value" style={{ 
                    color: getFactorSeverity('balanceExposure', privacyFactors.balanceExposure).color 
                  }}>
                    {Number(privacyFactors.balanceExposure).toFixed(4)} ETH ({getFactorSeverity('balanceExposure', privacyFactors.balanceExposure).level})
                  </span>
                </div>
                <p className="factor-tip">Holding balance makes address trackable</p>
              </div>

              <div className="factor-item">
                <div className="factor-header">
                  <span className="factor-name">👁️ Public Scrutiny</span>
                  <span className="factor-value" style={{ 
                    color: getFactorSeverity('publicScrutiny', privacyFactors.publicScrutiny).color 
                  }}>
                    {privacyFactors.publicScrutiny} reports ({getFactorSeverity('publicScrutiny', privacyFactors.publicScrutiny).level})
                  </span>
                </div>
                <p className="factor-tip">Reports make address publicly known</p>
              </div>

              <div className="factor-item">
                <div className="factor-header">
                  <span className="factor-name">🔄 Address Reuse</span>
                  <span className="factor-value" style={{ 
                    color: getFactorSeverity('addressReuse', privacyFactors.addressReuse).color 
                  }}>
                    {privacyFactors.addressReuse}% ({getFactorSeverity('addressReuse', privacyFactors.addressReuse).level})
                  </span>
                </div>
                <p className="factor-tip">Repeated interactions reduce privacy</p>
              </div>

              <div className="factor-item">
                <div className="factor-header">
                  <span className="factor-name">📝 Account Type</span>
                  <span className="factor-value" style={{ color: '#3498db' }}>
                    {privacyFactors.isContract ? 'Smart Contract' : 'EOA (Wallet)'}
                  </span>
                </div>
                <p className="factor-tip">{privacyFactors.isContract ? 'Contracts have better privacy' : 'Personal wallet'}</p>
              </div>
            </div>
          )}

          {result.privacyRecommendations && result.privacyRecommendations.length > 0 && (
            <div className="privacy-recommendations">
              <h4>💡 Privacy Recommendations:</h4>
              <ul>
                {result.privacyRecommendations.map((rec, i) => (
                  <li key={i}>{rec}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="result-section">
          <label>Community Reports:</label>
          <span className="report-count">{reportCount} report(s)</span>
        </div>

        {externalFlags && externalFlags.totalFlags > 0 && (
          <div className="result-section external-flags">
            <label>External Databases:</label>
            <span className="flag-count">
              🚩 Found in {externalFlags.totalFlags} scam list(s)
            </span>
          </div>
        )}

        {reports && reports.length > 0 && (
          <div className="reports-list">
            <h3>Reports:</h3>
            {reports.map((report) => (
              <div key={report.id} className="report-item">
                <div className="report-header">
                  <span className="report-reason">{report.reason}</span>
                  <div className="report-votes">
                    <button
                      className="vote-button upvote"
                      onClick={() => handleVote(report.id, true)}
                      disabled={voting === report.id || !account}
                      title={account ? "Vote this is malicious" : "Connect wallet to vote"}
                    >
                      👍 {report.upvotes}
                    </button>
                    <button
                      className="vote-button downvote"
                      onClick={() => handleVote(report.id, false)}
                      disabled={voting === report.id || !account}
                      title={account ? "Vote this is safe" : "Connect wallet to vote"}
                    >
                      👎 {report.downvotes}
                    </button>
                  </div>
                </div>
                <p className="report-evidence">{report.evidence}</p>
                <span className="report-date">
                  {new Date(report.timestamp).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        )}

        <button className="report-button" onClick={onReport}>
          📝 Submit a Report
        </button>
      </div>
    </div>
  );
}

export default ResultCard;
