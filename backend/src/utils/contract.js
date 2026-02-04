const { ethers } = require('ethers');

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

let provider;
let contract;

function getContractInstance() {
  if (!contract) {
    const rpcUrl = process.env.RPC_URL || 'http://localhost:8545';
    const contractAddress = process.env.CONTRACT_ADDRESS;

    if (!contractAddress) {
      throw new Error('CONTRACT_ADDRESS not set in environment variables');
    }

    provider = new ethers.JsonRpcProvider(rpcUrl);
    contract = new ethers.Contract(contractAddress, SAFETY_REGISTRY_ABI, provider);
  }

  return contract;
}

function getProvider() {
  if (!provider) {
    getContractInstance();
  }
  return provider;
}

module.exports = {
  getContractInstance,
  getProvider,
  SAFETY_REGISTRY_ABI
};
