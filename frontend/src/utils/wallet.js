import { ethers } from 'ethers';

/**
 * Check if MetaMask is installed
 */
export const isMetaMaskInstalled = () => {
  return typeof window !== 'undefined' && typeof window.ethereum !== 'undefined';
};

/**
 * Connect to MetaMask wallet and switch to Sepolia
 */
export const connectWallet = async () => {
  if (!isMetaMaskInstalled()) {
    throw new Error('MetaMask is not installed. Please install MetaMask to continue.');
  }

  try {
    // Request account access
    const accounts = await window.ethereum.request({ 
      method: 'eth_requestAccounts' 
    });
    
    // Check current network
    const chainId = await getChainId();
    const SEPOLIA_CHAIN_ID = 11155111;
    
    // If not on Sepolia, prompt to switch
    if (chainId !== SEPOLIA_CHAIN_ID) {
      console.log(`Current network: ${chainId}, switching to Sepolia (${SEPOLIA_CHAIN_ID})...`);
      await switchToSepolia();
    }
    
    return accounts[0];
  } catch (error) {
    if (error.code === 4001) {
      throw new Error('Please connect to MetaMask.');
    }
    throw error;
  }
};

/**
 * Get the current connected account
 */
export const getCurrentAccount = async () => {
  if (!isMetaMaskInstalled()) {
    return null;
  }

  try {
    const accounts = await window.ethereum.request({ 
      method: 'eth_accounts' 
    });
    return accounts[0] || null;
  } catch (error) {
    console.error('Error getting current account:', error);
    return null;
  }
};

/**
 * Get provider and signer
 */
export const getProviderAndSigner = async () => {
  if (!isMetaMaskInstalled()) {
    throw new Error('MetaMask is not installed');
  }

  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  
  return { provider, signer };
};

/**
 * Format address for display (0x1234...5678)
 */
export const formatAddress = (address) => {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

/**
 * Switch to correct network
 */
export const switchNetwork = async (chainId) => {
  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: `0x${chainId.toString(16)}` }],
    });
  } catch (error) {
    // This error code indicates that the chain has not been added to MetaMask
    if (error.code === 4902) {
      throw new Error('Please add this network to MetaMask first');
    }
    throw error;
  }
};

/**
 * Switch to Sepolia testnet
 */
export const switchToSepolia = async () => {
  const SEPOLIA_CHAIN_ID = 11155111; // 0xaa36a7
  
  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: '0xaa36a7' }], // Sepolia chain ID in hex
    });
    console.log('✅ Switched to Sepolia testnet');
  } catch (error) {
    // If Sepolia is not added to MetaMask, add it
    if (error.code === 4902) {
      try {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: '0xaa36a7',
            chainName: 'Sepolia Testnet',
            nativeCurrency: {
              name: 'Sepolia ETH',
              symbol: 'SEP',
              decimals: 18
            },
            rpcUrls: ['https://sepolia.infura.io/v3/'],
            blockExplorerUrls: ['https://sepolia.etherscan.io']
          }]
        });
        console.log('✅ Added and switched to Sepolia testnet');
      } catch (addError) {
        throw new Error('Failed to add Sepolia network to MetaMask');
      }
    } else {
      throw error;
    }
  }
};

/**
 * Get current chain ID
 */
export const getChainId = async () => {
  if (!isMetaMaskInstalled()) {
    return null;
  }

  const chainId = await window.ethereum.request({ method: 'eth_chainId' });
  return parseInt(chainId, 16);
};
