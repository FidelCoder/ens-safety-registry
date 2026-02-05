import React, { useState } from 'react';
import './App.css';
import SearchBar from './components/SearchBar';
import ResultCard from './components/ResultCard';
import ReportForm from './components/ReportForm';
import RecentReports from './components/RecentReports';
import WalletConnect from './components/WalletConnect';

function App() {
  const [searchResult, setSearchResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showReportForm, setShowReportForm] = useState(false);
  const [account, setAccount] = useState(null);

  const handleSearch = async (address) => {
    setLoading(true);
    console.log(`🔍 Searching for address: ${address}`);
    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:3001';
      console.log(`📡 API URL: ${apiUrl}/api/check/${address}`);
      
      const response = await fetch(`${apiUrl}/api/check/${address}`);
      const data = await response.json();
      
      console.log('✅ Search result:', data);
      console.log(`📊 Privacy Factors:`, data.privacyFactors);
      
      setSearchResult(data);
    } catch (error) {
      console.error('❌ Search failed:', error);
      alert('Failed to check address. Make sure the backend API is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <div className="container">
          <h1>🛡️ ENS Safety Registry</h1>
          <p className="subtitle">
            Community-driven protection for Web3
          </p>
        </div>
      </header>

      <main className="container">
        <WalletConnect onAccountChange={setAccount} />
        
        <SearchBar onSearch={handleSearch} loading={loading} />

        {searchResult && (
          <ResultCard 
            result={searchResult} 
            onReport={() => setShowReportForm(true)}
            account={account}
          />
        )}

        {showReportForm && (
          <ReportForm 
            defaultAddress={searchResult?.address}
            onClose={() => setShowReportForm(false)}
            account={account}
          />
        )}

        <RecentReports />
      </main>

      <footer className="App-footer">
        <p>Built with ❤️ for the Web3 community | Open Source Public Good</p>
        <div className="footer-links">
          <a href="https://github.com/FidelCoder/ens-safety-registry" target="_blank" rel="noopener noreferrer">
            GitHub
          </a>
          <span>•</span>
          <a href="#docs">API Docs</a>
          <span>•</span>
          <a href="#about">About</a>
        </div>
      </footer>
    </div>
  );
}

export default App;
