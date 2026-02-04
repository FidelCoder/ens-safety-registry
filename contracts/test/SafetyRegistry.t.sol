// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/SafetyRegistry.sol";

contract SafetyRegistryTest is Test {
    SafetyRegistry public registry;
    address public alice = address(0x1);
    address public bob = address(0x2);
    address public maliciousAddr = address(0x999);

    function setUp() public {
        registry = new SafetyRegistry();
        vm.label(alice, "Alice");
        vm.label(bob, "Bob");
        vm.label(maliciousAddr, "Malicious");
    }

    function testSubmitReport() public {
        vm.prank(alice);
        uint256 reportId = registry.submitReport(
            maliciousAddr,
            "scammer.eth",
            SafetyRegistry.ReportReason.Phishing,
            "https://evidence.com/proof"
        );

        assertEq(reportId, 0);
        assertEq(registry.reportCount(), 1);

        SafetyRegistry.Report memory report = registry.getReport(0);
        assertEq(report.reporter, alice);
        assertEq(report.targetAddress, maliciousAddr);
        assertEq(report.upvotes, 0);
    }

    function testVoteOnReport() public {
        // Alice submits report
        vm.prank(alice);
        uint256 reportId = registry.submitReport(
            maliciousAddr,
            "",
            SafetyRegistry.ReportReason.Scam,
            "Lost 10 ETH"
        );

        // Bob upvotes
        vm.prank(bob);
        registry.voteOnReport(reportId, true);

        SafetyRegistry.Report memory report = registry.getReport(0);
        assertEq(report.upvotes, 1);
        assertEq(report.downvotes, 0);
    }

    function testCannotVoteTwice() public {
        vm.prank(alice);
        uint256 reportId = registry.submitReport(
            maliciousAddr,
            "",
            SafetyRegistry.ReportReason.Scam,
            "Evidence"
        );

        vm.prank(bob);
        registry.voteOnReport(reportId, true);

        // Try to vote again
        vm.prank(bob);
        vm.expectRevert("Already voted");
        registry.voteOnReport(reportId, true);
    }

    function testCheckAddress() public {
        // Submit multiple reports
        vm.prank(alice);
        registry.submitReport(maliciousAddr, "", SafetyRegistry.ReportReason.Phishing, "Evidence1");

        // Not flagged yet (need MIN_UPVOTES_FOR_FLAG)
        (bool isFlagged, uint256[] memory reportIds) = registry.checkAddress(maliciousAddr);
        assertEq(isFlagged, false);
        assertEq(reportIds.length, 1);

        // Add votes to reach threshold
        address voter1 = address(0x10);
        address voter2 = address(0x11);
        address voter3 = address(0x12);

        vm.prank(voter1);
        registry.voteOnReport(0, true);
        vm.prank(voter2);
        registry.voteOnReport(0, true);
        vm.prank(voter3);
        registry.voteOnReport(0, true);

        // Now should be flagged
        (isFlagged, ) = registry.checkAddress(maliciousAddr);
        assertEq(isFlagged, true);
    }

    function testCalculateRiskScore() public {
        vm.prank(alice);
        registry.submitReport(maliciousAddr, "", SafetyRegistry.ReportReason.Scam, "Evidence");

        // Score should be 0 with no votes
        uint256 score = registry.calculateRiskScore(maliciousAddr);
        assertEq(score, 0);

        // Add upvotes
        vm.prank(bob);
        registry.voteOnReport(0, true);

        score = registry.calculateRiskScore(maliciousAddr);
        assertGt(score, 0);
    }

    function testCalculatePrivacyScore() public {
        // New address should have perfect privacy score (100)
        uint256 initialScore = registry.calculatePrivacyScore(alice);
        assertEq(initialScore, 100); // Perfect privacy
        
        // Submit many reports to trigger score reduction (need >10 for -10 points)
        vm.startPrank(alice);
        for (uint i = 0; i < 12; i++) {
            registry.submitReport(address(uint160(i + 1000)), "", SafetyRegistry.ReportReason.Scam, "Evidence");
        }
        vm.stopPrank();

        // Alice's privacy score should decrease (12 transactions = -10 points)
        uint256 aliceScore = registry.calculatePrivacyScore(alice);
        assertLe(aliceScore, 90); // At least -10 points

        // Submit report against malicious address
        vm.prank(bob);
        registry.submitReport(maliciousAddr, "", SafetyRegistry.ReportReason.Scam, "Evidence");

        // Target address with reports should have reduced privacy
        uint256 targetScore = registry.calculatePrivacyScore(maliciousAddr);
        assertLt(targetScore, 100); // Reports reduce privacy (at least -5)
    }

    function testPrivacyScoreFactors() public {
        // Test that privacy score considers multiple factors
        vm.prank(alice);
        registry.submitReport(maliciousAddr, "", SafetyRegistry.ReportReason.Scam, "Evidence");

        // Address with reports should have lower privacy score
        uint256 reportedScore = registry.calculatePrivacyScore(maliciousAddr);
        uint256 cleanScore = registry.calculatePrivacyScore(address(0x99999));
        
        assertLt(reportedScore, cleanScore); // Reported = less private
    }

    function testPrivacyAnalysis() public {
        // Submit multiple transactions for meaningful analysis
        vm.startPrank(alice);
        for (uint i = 0; i < 15; i++) {
            registry.submitReport(address(uint160(i + 1000)), "", SafetyRegistry.ReportReason.Scam, "Evidence");
        }
        vm.stopPrank();
        
        (uint256 score, uint8 grade, uint256[5] memory factors) = registry.getPrivacyAnalysis(alice);
        
        // Should have score and grade
        assertLt(score, 100); // 15 transactions reduce privacy
        assertGe(grade, 0);
        assertLe(grade, 5);
        
        // Factors should reflect activity
        assertEq(factors[0], 15); // 15 transactions
        assertEq(factors[2], 0); // 0 reports against alice
    }

    function testPrivacyGradeString() public view {
        // Test grade conversion
        string memory gradeAPlus = registry.getPrivacyGradeString(0);
        string memory gradeA = registry.getPrivacyGradeString(1);
        string memory gradeF = registry.getPrivacyGradeString(5);
        
        assertEq(keccak256(bytes(gradeAPlus)), keccak256(bytes("A+")));
        assertEq(keccak256(bytes(gradeA)), keccak256(bytes("A")));
        assertEq(keccak256(bytes(gradeF)), keccak256(bytes("F")));
    }
}
