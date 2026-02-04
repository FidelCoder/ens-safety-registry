import React, { useState } from 'react';
import './ResultCard.css';
import { getProviderAndSigner } from '../utils/wallet';
import { voteOnReport } from '../utils/contract';

function ResultCard({ result, onReport, account }) {
  const { address, isFlagged, riskScore, privacyScore, reportCount, reports, externalFlags } = result;
  const [voting, setVoting] = useState(null);

  const getRiskLevel = (score) => {
    if (score >= 70) return { label: 'High Risk', color: '#e74c3c' };
    if (score >= 40) return { label: 'Medium Risk', color: '#f39c12' };
    if (score > 0) return { label: 'Low Risk', color: '#f1c40f' };
    return { label: 'No Risk', color: '#2ecc71' };
  };

  const getPrivacyLevel = (score) => {
    if (score >= 70) return { label: 'Low Privacy', color: '#e74c3c', icon: '🔴' };
    if (score >= 40) return { label: 'Medium Privacy', color: '#f39c12', icon: '🟡' };
    if (score > 0) return { label: 'Good Privacy', color: '#3498db', icon: '🔵' };
    return { label: 'High Privacy', color: '#2ecc71', icon: '🟢' };
  };

  const risk = getRiskLevel(riskScore);
  const privacy = getPrivacyLevel(privacyScore || 0);

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

        <div className="result-section">
          <label>Privacy Risk Score:</label>
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
            Higher score = more exposed. Based on transaction activity, balance, and public scrutiny.
          </p>
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
