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
}
