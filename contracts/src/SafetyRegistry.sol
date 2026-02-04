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
    mapping(address => uint256) public transactionCount; // Track transactions for privacy score
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

        // Record transaction for privacy tracking
        recordTransaction(msg.sender);

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

        // Record transaction for privacy tracking
        recordTransaction(msg.sender);

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

    /**
     * @notice Calculate privacy risk score for an address (0-100)  
     * @param _address The address to evaluate
     * @return privacyScore Privacy risk score (higher = better privacy, 0 = fully exposed)
     * @dev Enhanced scoring with multiple privacy factors
     * @dev Returns only score for backwards compatibility. Use getPrivacyAnalysis for grade.
     */
    function calculatePrivacyScore(address _address) external view returns (uint256 privacyScore) {
        (uint256 score, ) = _calculatePrivacyScoreInternal(_address);
        return score;
    }
    
    /**
     * @notice Internal privacy calculation
     * @param _address The address to evaluate
     * @return score Privacy score
     * @return grade Letter grade (0=A+, 1=A, 2=B, 3=C, 4=D, 5=F)
     */
    function _calculatePrivacyScoreInternal(address _address) internal view returns (uint256 score, uint8 grade) {
        uint256 balance = _address.balance;
        uint256 txCount = transactionCount[_address];
        uint256[] memory reportIds = addressToReports[_address];
        
        // Start with perfect score
        uint256 score = 100;
        
        // Factor 1: High transaction activity (-30 points)
        // More transactions = more on-chain footprint
        if (txCount > 50) {
            score = score >= 30 ? score - 30 : 0; // Critical exposure
        } else if (txCount > 20) {
            score = score >= 15 ? score - 15 : 0; // High exposure
        } else if (txCount > 10) {
            score = score >= 10 ? score - 10 : 0; // Medium exposure
        } else if (txCount > 5) {
            score = score >= 5 ? score - 5 : 0; // Low exposure
        } else if (txCount > 0) {
            score = score >= 2 ? score - 2 : 0; // Minimal exposure
        }
        
        // Factor 2: Active balance holder (-15 points)
        // Holding balance = active address = trackable
        if (balance > 10 ether) {
            score = score >= 15 ? score - 15 : 0; // Large balance = high profile
        } else if (balance > 1 ether) {
            score = score >= 10 ? score - 10 : 0; // Medium balance
        } else if (balance > 0) {
            score = score >= 5 ? score - 5 : 0; // Small balance
        }
        
        // Factor 3: Public reports/scrutiny (-15 points)
        // Being reported makes address publicly known
        if (reportIds.length > 5) {
            score = score >= 15 ? score - 15 : 0; // Highly scrutinized
        } else if (reportIds.length > 2) {
            score = score >= 10 ? score - 10 : 0; // Moderately known
        } else if (reportIds.length > 0) {
            score = score >= 5 ? score - 5 : 0; // Some exposure
        }
        
        // Factor 4: Address reuse pattern (-15 points)
        // Repeated interactions reduce privacy
        if (txCount > 0) {
            uint256 reuseScore = (txCount * 15) / 100; // Scale reuse impact
            if (reuseScore > 15) reuseScore = 15;
            score = score >= reuseScore ? score - reuseScore : 0;
        }
        
        // Factor 5: Contract interaction bonus (+10 points)
        // Smart contract interactions can provide some privacy
        uint256 codeSize;
        assembly {
            codeSize := extcodesize(_address)
        }
        if (codeSize > 0) {
            // This is a contract, not EOA
            if (score < 90) score += 10; // Slight privacy bonus
        }
        
        // Ensure score stays in valid range
        if (score < 0) score = 0;
        if (score > 100) score = 100;
        
        // Calculate letter grade
        uint8 gradeValue;
        if (score >= 90) gradeValue = 0; // A+
        else if (score >= 80) gradeValue = 1; // A
        else if (score >= 70) gradeValue = 2; // B
        else if (score >= 60) gradeValue = 3; // C
        else if (score >= 40) gradeValue = 4; // D
        else gradeValue = 5; // F
        
        return (score, gradeValue);
    }
    
    /**
     * @notice Get privacy grade as string
     * @param _grade Grade value (0-5)
     * @return Grade string
     */
    function getPrivacyGradeString(uint8 _grade) external pure returns (string memory) {
        if (_grade == 0) return "A+";
        if (_grade == 1) return "A";
        if (_grade == 2) return "B";
        if (_grade == 3) return "C";
        if (_grade == 4) return "D";
        return "F";
    }
    
    /**
     * @notice Get detailed privacy analysis
     * @param _address The address to analyze
     * @return score Overall privacy score
     * @return grade Letter grade
     * @return factors Array of [txActivity, balanceExposure, publicScrutiny, addressReuse, isContract]
     */
    function getPrivacyAnalysis(address _address) 
        external 
        view 
        returns (
            uint256 score,
            uint8 grade,
            uint256[5] memory factors
        ) 
    {
        (score, grade) = _calculatePrivacyScoreInternal(_address);
        
        uint256 txCount = transactionCount[_address];
        uint256 balance = _address.balance;
        uint256 reportCount = addressToReports[_address].length;
        
        // Return individual factor scores
        factors[0] = txCount; // Transaction activity
        factors[1] = balance / 1 ether; // Balance in ETH
        factors[2] = reportCount; // Public reports
        factors[3] = txCount > 0 ? (txCount * 100) / 50 : 0; // Reuse ratio
        
        // Check if contract
        uint256 codeSize;
        assembly {
            codeSize := extcodesize(_address)
        }
        factors[4] = codeSize > 0 ? 1 : 0; // Is contract
        
        return (score, grade, factors);
    }

    /**
     * @notice Record a transaction for privacy tracking
     * @param _address The address that made a transaction
     * @dev This should be called whenever someone interacts with the contract
     */
    function recordTransaction(address _address) internal {
        transactionCount[_address]++;
    }
}
