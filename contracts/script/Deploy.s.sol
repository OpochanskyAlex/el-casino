// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/CasinoV1.sol";

contract DeployScript is Script {
    function run() external {
        uint256 deployerKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        vm.startBroadcast(deployerKey);

        CasinoV1 casino = new CasinoV1();

        vm.stopBroadcast();

        console.log("CasinoV1 deployed at:", address(casino));
    }
}
