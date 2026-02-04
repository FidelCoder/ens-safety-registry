// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/SafetyRegistry.sol";

contract DeployScript is Script {
    function run() external {
        vm.startBroadcast();
        
        SafetyRegistry registry = new SafetyRegistry();
        
        console.log("SafetyRegistry deployed to:", address(registry));
        
        vm.stopBroadcast();
    }
}
