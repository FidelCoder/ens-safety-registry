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
        // New address should have low privacy score (no activity)
        uint256 initialScore = registry.calculatePrivacyScore(alice);
        
        // Submit report (increases transaction count for alice)
        vm.prank(alice);
        registry.submitReport(maliciousAddr, "", SafetyRegistry.ReportReason.Scam, "Evidence");

        // Alice's privacy score should increase (she made a transaction)
        uint256 afterReportScore = registry.calculatePrivacyScore(alice);
        assertGt(afterReportScore, initialScore);

        // More transactions = higher privacy risk
        vm.prank(alice);
        registry.voteOnReport(0, true);
        
        uint256 afterVoteScore = registry.calculatePrivacyScore(alice);
        assertGt(afterVoteScore, afterReportScore);

        // Target address privacy score should be > 0 (has reports against it)
        uint256 targetScore = registry.calculatePrivacyScore(maliciousAddr);
        assertGt(targetScore, 0);
    }

    function testPrivacyScoreFactors() public {
        // Test that privacy score considers multiple factors
        vm.prank(alice);
        registry.submitReport(maliciousAddr, "", SafetyRegistry.ReportReason.Scam, "Evidence");

        // Address with reports should have higher score than no activity
        uint256 reportedScore = registry.calculatePrivacyScore(maliciousAddr);
        uint256 cleanScore = registry.calculatePrivacyScore(address(0x99999));
        
        assertGt(reportedScore, cleanScore);
    }
}
