// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;
import "forge-std/Script.sol";
import "../src/ScratchCardNFT.sol";

contract Deploy is Script {
    function run() external {
        uint256 pk = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(pk);
        vm.startBroadcast(pk);
        ScratchCardNFT nft = new ScratchCardNFT(deployer, false);
        nft.fundPrizePool{value: 0.5 ether}();
        vm.stopBroadcast();
        console.log("Deployed:", address(nft));
        console.log("Explorer: https://explorer.monad.xyz/address/", address(nft));
    }
}
