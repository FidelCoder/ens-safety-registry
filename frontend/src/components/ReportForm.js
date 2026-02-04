import React, { useState } from 'react';
import './ReportForm.css';
import { getProviderAndSigner } from '../utils/wallet';
import { submitReport } from '../utils/contract';

function ReportForm({ defaultAddress = '', onClose, account }) {
  const [formData, setFormData] = useState({
    address: defaultAddress,
    ensName: '',
    reason: 'Phishing',
    evidence: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!account) {
      alert('Please connect your wallet first');
      return;
    }
    
    setSubmitting(true);
    
    try {
      const { signer } = await getProviderAndSigner();
      
      const receipt = await submitReport(
        signer,
        formData.address,
        formData.ensName,
        formData.reason,
        formData.evidence
      );
      
      alert('Report submitted successfully!\n\nTransaction: ' + receipt.hash);
      onClose();
      
      // Refresh the page to show new report
      setTimeout(() => window.location.reload(), 2000);
    } catch (error) {
      console.error('Error submitting report:', error);
      alert('Failed to submit report: ' + error.message);
    } finally {
      setSubmitting(false);
    }
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
            <button type="button" className="cancel-button" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="submit-button" disabled={submitting}>
              {submitting ? 'Submitting...' : 'Submit Report'}
            </button>
          </div>

          <p className="form-note">
            {account ? (
              <>ℹ️ Reports are stored on-chain and require a small gas fee</>
            ) : (
              <>⚠️ Please connect your wallet first</>
            )}
          </p>
        </form>
      </div>
    </div>
  );
}

export default ReportForm;
