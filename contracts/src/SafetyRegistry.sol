// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title SafetyRegistry
 * @notice Community-driven registry for reporting malicious addresses and ENS names
 * @dev Public good infrastructure for Web3 security
 */
contract SafetyRegistry {
    struct Report {
        address reporter;
        address targetAddress;
        string ensName;
        ReportReason reason;
        string evidence;
        uint256 timestamp;
        uint256 upvotes;
        uint256 downvotes;
        bool resolved;
    }

    enum ReportReason {
        Phishing,
        Scam,
        RugPull,
        MaliciousContract,
        Spam,
        Other
    }

    // State variables
    mapping(uint256 => Report) public reports;
    mapping(address => uint256[]) public addressToReports;
    mapping(address => mapping(uint256 => bool)) public hasVoted;
    uint256 public reportCount;
    uint256 public constant MIN_UPVOTES_FOR_FLAG = 3;

    // Events
    event ReportSubmitted(
        uint256 indexed reportId,
        address indexed reporter,
        address indexed targetAddress,
        ReportReason reason
    );
    event ReportVoted(uint256 indexed reportId, address indexed voter, bool upvote);
    event ReportResolved(uint256 indexed reportId, bool malicious);

    /**
     * @notice Submit a report for a potentially malicious address
     * @param _targetAddress The address being reported
     * @param _ensName The ENS name (if applicable, can be empty)
     * @param _reason The category of the report
     * @param _evidence URL or description of evidence
     */
    function submitReport(
        address _targetAddress,
        string memory _ensName,
        ReportReason _reason,
        string memory _evidence
    ) external returns (uint256) {
        require(_targetAddress != address(0), "Invalid target address");
        require(bytes(_evidence).length > 0, "Evidence required");

        uint256 reportId = reportCount++;
        
        reports[reportId] = Report({
            reporter: msg.sender,
            targetAddress: _targetAddress,
            ensName: _ensName,
            reason: _reason,
            evidence: _evidence,
            timestamp: block.timestamp,
            upvotes: 0,
            downvotes: 0,
            resolved: false
        });

        addressToReports[_targetAddress].push(reportId);

        emit ReportSubmitted(reportId, msg.sender, _targetAddress, _reason);
        
        return reportId;
    }

    /**
     * @notice Vote on a report (upvote = malicious, downvote = safe)
     * @param _reportId The ID of the report
     * @param _upvote True for upvote (confirm malicious), false for downvote
     */
    function voteOnReport(uint256 _reportId, bool _upvote) external {
        require(_reportId < reportCount, "Report does not exist");
        require(!hasVoted[msg.sender][_reportId], "Already voted");
        require(!reports[_reportId].resolved, "Report already resolved");

        hasVoted[msg.sender][_reportId] = true;

        if (_upvote) {
            reports[_reportId].upvotes++;
        } else {
            reports[_reportId].downvotes++;
        }

        emit ReportVoted(_reportId, msg.sender, _upvote);
    }

    /**
     * @notice Get all report IDs for a specific address
     * @param _address The address to query
     * @return Array of report IDs
     */
    function getReportsForAddress(address _address) external view returns (uint256[] memory) {
        return addressToReports[_address];
    }

    /**
     * @notice Check if an address is flagged as malicious
     * @param _address The address to check
     * @return isFlagged True if the address has confirmed malicious reports
     * @return reportIds Array of report IDs for this address
     */
    function checkAddress(address _address) 
        external 
        view 
        returns (bool isFlagged, uint256[] memory reportIds) 
    {
        reportIds = addressToReports[_address];
        
        // Check if any report has enough upvotes
        for (uint256 i = 0; i < reportIds.length; i++) {
            Report memory report = reports[reportIds[i]];
            if (report.upvotes >= MIN_UPVOTES_FOR_FLAG && 
                report.upvotes > report.downvotes) {
                isFlagged = true;
                break;
            }
        }
        
        return (isFlagged, reportIds);
    }

    /**
     * @notice Get detailed information about a specific report
     * @param _reportId The ID of the report
     */
    function getReport(uint256 _reportId) 
        external 
        view 
        returns (Report memory) 
    {
        require(_reportId < reportCount, "Report does not exist");
        return reports[_reportId];
    }

    /**
     * @notice Calculate risk score for an address (0-100)
     * @param _address The address to evaluate
     * @return score Risk score (higher = more risky)
     */
    function calculateRiskScore(address _address) external view returns (uint256 score) {
        uint256[] memory reportIds = addressToReports[_address];
        
        if (reportIds.length == 0) {
            return 0;
        }

        uint256 totalUpvotes = 0;
        uint256 totalDownvotes = 0;

        for (uint256 i = 0; i < reportIds.length; i++) {
            Report memory report = reports[reportIds[i]];
            totalUpvotes += report.upvotes;
            totalDownvotes += report.downvotes;
        }

        // Calculate score (capped at 100)
        if (totalUpvotes == 0) return 0;
        
        uint256 netVotes = totalUpvotes > totalDownvotes ? 
            totalUpvotes - totalDownvotes : 0;
        
        score = (netVotes * 100) / (reportIds.length + 1);
        if (score > 100) score = 100;

        return score;
    }
}
