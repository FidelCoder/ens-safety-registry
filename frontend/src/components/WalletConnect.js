import React, { useState, useEffect } from 'react';
import './WalletConnect.css';
import { connectWallet, getCurrentAccount, formatAddress, isMetaMaskInstalled } from '../utils/wallet';

function WalletConnect({ onAccountChange }) {
  const [account, setAccount] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check if already connected
    checkConnection();

    // Listen for account changes
    if (isMetaMaskInstalled()) {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', () => window.location.reload());
    }

    return () => {
      if (isMetaMaskInstalled()) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      }
    };
  }, []);

  const checkConnection = async () => {
    const currentAccount = await getCurrentAccount();
    if (currentAccount) {
      setAccount(currentAccount);
      onAccountChange && onAccountChange(currentAccount);
    }
  };

  const handleAccountsChanged = (accounts) => {
    if (accounts.length === 0) {
      setAccount(null);
      onAccountChange && onAccountChange(null);
    } else {
      setAccount(accounts[0]);
      onAccountChange && onAccountChange(accounts[0]);
    }
  };

  const handleConnect = async () => {
    setLoading(true);
    try {
      const connectedAccount = await connectWallet();
      setAccount(connectedAccount);
      onAccountChange && onAccountChange(connectedAccount);
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isMetaMaskInstalled()) {
    return (
      <div className="wallet-connect">
        <a
          href="https://metamask.io/download/"
          target="_blank"
          rel="noopener noreferrer"
          className="install-metamask-button"
        >
          Install MetaMask
        </a>
      </div>
    );
  }

  if (account) {
    return (
      <div className="wallet-connect">
        <div className="connected-wallet">
          <span className="wallet-icon">🦊</span>
          <span className="wallet-address">{formatAddress(account)}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="wallet-connect">
      <button
        onClick={handleConnect}
        disabled={loading}
        className="connect-button"
      >
        {loading ? 'Connecting...' : '🦊 Connect Wallet'}
      </button>
    </div>
  );
}

export default WalletConnect;
