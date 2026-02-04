import React, { useState } from 'react';
import './ReportForm.css';

function ReportForm({ defaultAddress = '', onClose }) {
  const [formData, setFormData] = useState({
    address: defaultAddress,
    ensName: '',
    reason: 'Phishing',
    evidence: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    alert(
      'To submit a report, you need to:\n\n' +
      '1. Connect your wallet\n' +
      '2. Sign the transaction on-chain\n\n' +
      'This is a demo - in production, this would interact with MetaMask/WalletConnect.'
    );
    
    console.log('Report data:', formData);
    onClose();
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="report-form-container" onClick={(e) => e.stopPropagation()}>
        <div className="form-header">
          <h2>Submit a Report</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        
        <form onSubmit={handleSubmit} className="report-form">
          <div className="form-group">
            <label>Target Address *</label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="0x1234..."
              required
            />
          </div>

          <div className="form-group">
            <label>ENS Name (optional)</label>
            <input
              type="text"
              name="ensName"
              value={formData.ensName}
              onChange={handleChange}
              placeholder="scammer.eth"
            />
          </div>

          <div className="form-group">
            <label>Reason *</label>
            <select name="reason" value={formData.reason} onChange={handleChange} required>
              <option value="Phishing">Phishing</option>
              <option value="Scam">Scam</option>
              <option value="RugPull">Rug Pull</option>
              <option value="MaliciousContract">Malicious Contract</option>
              <option value="Spam">Spam</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="form-group">
            <label>Evidence *</label>
            <textarea
              name="evidence"
              value={formData.evidence}
              onChange={handleChange}
              placeholder="Provide details and evidence (URLs, transaction hashes, etc.)"
              rows="4"
              required
              minLength="10"
            />
            <span className="form-hint">Minimum 10 characters</span>
          </div>

          <div className="form-actions">
            <button type="button" className="cancel-button" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="submit-button">
              Submit Report
            </button>
          </div>

          <p className="form-note">
            ℹ️ Reports are stored on-chain and require a small gas fee
          </p>
        </form>
      </div>
    </div>
  );
}

export default ReportForm;
