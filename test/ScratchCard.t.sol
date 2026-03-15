// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;
import "forge-std/Test.sol";
import "../src/ScratchCardNFT.sol";

contract ScratchCardTest is Test {
    ScratchCardNFT nft;
    address owner  = makeAddr("owner");
    address player = makeAddr("player");

    function setUp() public {
        vm.prank(owner);
        nft = new ScratchCardNFT(owner, false);
        vm.deal(address(nft), 5 ether);
        vm.deal(player, 1 ether);
    }

    function test_Mint() public {
        vm.prank(player);
        uint256 id = nft.mint{value: 0.01 ether}();
        assertEq(nft.ownerOf(id), player);
    }

    function test_Scratch() public {
        vm.prank(player);
        uint256 id = nft.mint{value: 0.01 ether}();
        vm.prank(player);
        nft.scratch(id);
        assertTrue(nft.getCard(id).state == ScratchCardNFT.CardState.Scratched);
    }

    function test_TokenURI() public {
        vm.prank(player);
        uint256 id = nft.mint{value: 0.01 ether}();
        string memory uri = nft.tokenURI(id);
        assertTrue(bytes(uri).length > 0);
    }

    function test_OnlyOwnerSetCIDs() public {
        vm.prank(player);
        vm.expectRevert();
        nft.setCIDs(0, "ar://a", "ar://b", "ar://c", "ar://d", "ar://e");
    }
}
