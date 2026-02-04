import { ethers } from 'ethers';

const SAFETY_REGISTRY_ABI = [
  "function submitReport(address _targetAddress, string memory _ensName, uint8 _reason, string memory _evidence) external returns (uint256)",
  "function voteOnReport(uint256 _reportId, bool _upvote) external",
  "function getReportsForAddress(address _address) external view returns (uint256[] memory)",
  "function checkAddress(address _address) external view returns (bool isFlagged, uint256[] memory reportIds)",
  "function getReport(uint256 _reportId) external view returns (tuple(address reporter, address targetAddress, string ensName, uint8 reason, string evidence, uint256 timestamp, uint256 upvotes, uint256 downvotes, bool resolved))",
  "function calculateRiskScore(address _address) external view returns (uint256 score)",
  "function calculatePrivacyScore(address _address) external view returns (uint256 privacyScore)",
  "function getPrivacyAnalysis(address _address) external view returns (uint256 score, uint8 grade, uint256[5] factors)",
  "function getPrivacyGradeString(uint8 _grade) external pure returns (string)",
  "function reportCount() external view returns (uint256)"
];

/**
 * Get contract instance with signer (for write operations)
 */
export const getContract = (signer) => {
  const contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS;
  
  if (!contractAddress) {
    throw new Error('Contract address not configured');
  }

  return new ethers.Contract(contractAddress, SAFETY_REGISTRY_ABI, signer);
};

/**
 * Submit a report to the contract
 */
export const submitReport = async (signer, targetAddress, ensName, reason, evidence) => {
  const contract = getContract(signer);
  
  // Convert reason string to enum number
  const reasonMap = {
    'Phishing': 0,
    'Scam': 1,
    'RugPull': 2,
    'MaliciousContract': 3,
    'Spam': 4,
    'Other': 5
  };
  
  const reasonCode = reasonMap[reason] || 5;
  
  const tx = await contract.submitReport(
    targetAddress,
    ensName || '',
    reasonCode,
    evidence
  );
  
  const receipt = await tx.wait();
  return receipt;
};

/**
 * Vote on a report
 */
export const voteOnReport = async (signer, reportId, upvote) => {
  const contract = getContract(signer);
  
  const tx = await contract.voteOnReport(reportId, upvote);
  const receipt = await tx.wait();
  
  return receipt;
};

/**
 * Get report count
 */
export const getReportCount = async (provider) => {
  const contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS;
  const contract = new ethers.Contract(contractAddress, SAFETY_REGISTRY_ABI, provider);
  
  const count = await contract.reportCount();
  return Number(count);
};
