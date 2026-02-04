import React, { useState, useEffect } from 'react';
import './RecentReports.css';

function RecentReports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:3001';
      const response = await fetch(`${apiUrl}/api/reports?limit=5`);
      const data = await response.json();
      setReports(data.reports || []);
    } catch (error) {
      console.error('Failed to fetch reports:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="recent-reports">
        <h2>Recent Reports</h2>
        <div className="loading">Loading...</div>
      </div>
    );
  }

  if (reports.length === 0) {
    return (
      <div className="recent-reports">
        <h2>Recent Reports</h2>
        <div className="empty-state">
          <p>No reports yet. Be the first to contribute!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="recent-reports">
      <h2>Recent Reports</h2>
      <div className="reports-grid">
        {reports.map((report) => (
          <div key={report.id} className="report-card">
            <div className="report-card-header">
              <span className="report-reason-badge">{report.reason}</span>
              <span className="report-time">
                {new Date(report.timestamp).toLocaleDateString()}
              </span>
            </div>
            <code className="report-address">
              {report.targetAddress.slice(0, 10)}...{report.targetAddress.slice(-8)}
            </code>
            {report.ensName && (
              <div className="report-ens">{report.ensName}</div>
            )}
            <div className="report-votes">
              👍 {report.upvotes} | 👎 {report.downvotes}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default RecentReports;
