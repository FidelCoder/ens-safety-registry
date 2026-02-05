import React, { useState, useEffect } from 'react';
import './WalletConnect.css';
import { connectWallet, getCurrentAccount, formatAddress, isMetaMaskInstalled, getChainId } from '../utils/wallet';

function WalletConnect({ onAccountChange }) {
  const [account, setAccount] = useState(null);
  const [loading, setLoading] = useState(false);
  const [network, setNetwork] = useState(null);

  useEffect(() => {
    // Check if already connected
    checkConnection();

    // Listen for account changes
    if (isMetaMaskInstalled()) {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);
    }

    return () => {
      if (isMetaMaskInstalled()) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkConnection = async () => {
    const currentAccount = await getCurrentAccount();
    if (currentAccount) {
      setAccount(currentAccount);
      onAccountChange && onAccountChange(currentAccount);
      
      // Check network and auto-switch if not Sepolia
      const chainId = await getChainId();
      setNetwork(getNetworkName(chainId));
      
      const SEPOLIA_CHAIN_ID = 11155111;
      if (chainId !== SEPOLIA_CHAIN_ID) {
        console.log(`⚠️ Wrong network detected (${getNetworkName(chainId)}), please switch to Sepolia`);
      }
    }
  };

  const getNetworkName = (chainId) => {
    switch (chainId) {
      case 1: return 'Mainnet';
      case 11155111: return 'Sepolia';
      case 5: return 'Goerli';
      default: return `Chain ${chainId}`;
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

  const handleChainChanged = async (chainIdHex) => {
    const chainId = parseInt(chainIdHex, 16);
    console.log(`Network changed to: ${chainId}`);
    setNetwork(getNetworkName(chainId));
  };

  const handleConnect = async () => {
    setLoading(true);
    try {
      const connectedAccount = await connectWallet();
      setAccount(connectedAccount);
      onAccountChange && onAccountChange(connectedAccount);
      
      // Get network after connection
      const chainId = await getChainId();
      setNetwork(getNetworkName(chainId));
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
    const isSepolia = network === 'Sepolia';
    return (
      <div className="wallet-connect">
        <div className="connected-wallet">
          <span className="wallet-icon">🦊</span>
          <span className="wallet-address">{formatAddress(account)}</span>
          <span 
            className="network-badge" 
            style={{ 
              background: isSepolia ? '#3498db' : '#e74c3c',
              color: 'white',
              padding: '4px 8px',
              borderRadius: '4px',
              fontSize: '12px',
              marginLeft: '8px',
              cursor: isSepolia ? 'default' : 'pointer'
            }}
            onClick={!isSepolia ? handleConnect : undefined}
            title={!isSepolia ? 'Click to switch to Sepolia' : ''}
          >
            {network || 'Unknown'} {!isSepolia && '⚠️'}
          </span>
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
