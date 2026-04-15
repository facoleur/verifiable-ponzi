// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/g50erc20.sol";

contract DeployG50 is Script {
    function run() external {
        uint256 deployerKey = vm.envUint("ADDRESS_PK");

        vm.startBroadcast(deployerKey);
        G50ERC20 g50 = new G50ERC20();
        vm.stopBroadcast();

        console.log("G50 deployed at:", address(g50));
    }
}
