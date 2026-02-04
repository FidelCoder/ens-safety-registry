import React, { useState } from 'react';
import './SearchBar.css';

function SearchBar({ onSearch, loading }) {
  const [address, setAddress] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (address.trim()) {
      onSearch(address.trim());
    }
  };

  return (
    <div className="search-bar-container">
      <form onSubmit={handleSubmit} className="search-form">
        <input
          type="text"
          placeholder="Enter Ethereum address or ENS name..."
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          className="search-input"
          disabled={loading}
        />
        <button 
          type="submit" 
          className="search-button"
          disabled={loading || !address.trim()}
        >
          {loading ? '🔍 Checking...' : '🔍 Check'}
        </button>
      </form>
      <p className="search-hint">
        Example: 0x1234... or vitalik.eth
      </p>
    </div>
  );
}

export default SearchBar;
