// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Base64.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

contract ScratchCardNFT is ERC721, Ownable, ReentrancyGuard {
    using Strings for uint256;

    uint8 public constant USDC_RIDER   = 0;
    uint8 public constant ETH_WARRIOR  = 1;
    uint8 public constant MONAD_RACER  = 2;
    uint8 public constant TIER_LOSE    = 0;
    uint8 public constant TIER_SMALL   = 1;
    uint8 public constant TIER_BIG     = 2;
    uint8 public constant TIER_JACKPOT = 3;

    enum CardState { Unscratched, Scratched, Claimed }

    struct CardData {
        uint8     charType;
        uint8     tier;
        uint256   prize;
        CardState state;
        uint40    mintedAt;
        uint40    scratchedAt;
        bytes32   seed;
    }

    mapping(uint8 => string) public unscratchedCID;
    mapping(uint8 => mapping(uint8 => string)) public revealedCID;
    mapping(uint256 => CardData) public cardData;

    uint256 public cardPrice  = 0.01 ether;
    uint256 public nextTokenId;
    uint256 public prizePool;
    bool    public soulbound;
    bool    public mintOpen   = true;

    event CardMinted   (uint256 indexed tokenId, address indexed to, uint8 charType);
    event CardScratched(uint256 indexed tokenId, uint8 tier, uint256 prize);
    event PrizeClaimed (uint256 indexed tokenId, address indexed player, uint256 amount);
    event CIDsUpdated  (uint8 indexed charType);

    constructor(address _owner, bool _soulbound)
        ERC721("ScratchCard", "SCRATCH")
        Ownable(_owner)
    {
        soulbound = _soulbound;
    }

    function setCIDs(uint8 charType, string calldata unscratched, string calldata lose, string calldata small, string calldata big, string calldata jackpot) external onlyOwner {
        require(charType <= MONAD_RACER, "Invalid char");
        unscratchedCID[charType] = unscratched;
        revealedCID[charType][TIER_LOSE] = lose;
        revealedCID[charType][TIER_SMALL] = small;
        revealedCID[charType][TIER_BIG] = big;
        revealedCID[charType][TIER_JACKPOT] = jackpot;
        emit CIDsUpdated(charType);
    }

    function mint() external payable nonReentrant returns (uint256 tokenId) {
        require(mintOpen, "Mint closed");
        require(msg.value >= cardPrice, "Insufficient payment");
        tokenId = nextTokenId++;
        bytes32 seed = keccak256(abi.encodePacked(block.prevrandao, block.timestamp, msg.sender, tokenId));
        uint8 cType = uint8(uint256(seed) % 3);
        cardData[tokenId] = CardData({charType: cType, tier: TIER_LOSE, prize: 0, state: CardState.Unscratched, mintedAt: uint40(block.timestamp), scratchedAt: 0, seed: seed});
        prizePool += msg.value;
        _safeMint(msg.sender, tokenId);
        emit CardMinted(tokenId, msg.sender, cType);
    }

    function mintSpecific(uint8 charType) external payable nonReentrant returns (uint256 tokenId) {
        require(mintOpen, "Mint closed");
        require(msg.value >= cardPrice, "Insufficient payment");
        require(charType <= MONAD_RACER, "Invalid char");
        tokenId = nextTokenId++;
        bytes32 seed = keccak256(abi.encodePacked(block.prevrandao, block.timestamp, msg.sender, tokenId));
        cardData[tokenId] = CardData({charType: charType, tier: TIER_LOSE, prize: 0, state: CardState.Unscratched, mintedAt: uint40(block.timestamp), scratchedAt: 0, seed: seed});
        prizePool += msg.value;
        _safeMint(msg.sender, tokenId);
        emit CardMinted(tokenId, msg.sender, charType);
    }

    function scratch(uint256 tokenId) external nonReentrant {
        require(ownerOf(tokenId) == msg.sender, "Not owner");
        require(cardData[tokenId].state == CardState.Unscratched, "Already scratched");
        CardData storage card = cardData[tokenId];
        uint256 roll = uint256(keccak256(abi.encodePacked(card.seed, block.prevrandao))) % 100;
        uint8 tier; uint256 prize;
        if (roll < 2) { tier = TIER_JACKPOT; prize = cardPrice * 20; }
        else if (roll < 12) { tier = TIER_BIG; prize = cardPrice * 5; }
        else if (roll < 35) { tier = TIER_SMALL; prize = cardPrice * 2; }
        else { tier = TIER_LOSE; prize = 0; }
        if (prize > address(this).balance) prize = 0;
        card.tier = tier; card.prize = prize;
        card.state = CardState.Scratched;
        card.scratchedAt = uint40(block.timestamp);
        emit CardScratched(tokenId, tier, prize);
    }

    function claim(uint256 tokenId) external nonReentrant {
        require(ownerOf(tokenId) == msg.sender, "Not owner");
        require(cardData[tokenId].state == CardState.Scratched, "Not scratched");
        require(cardData[tokenId].prize > 0, "No prize");
        require(address(this).balance >= cardData[tokenId].prize, "Pool empty");
        uint256 amount = cardData[tokenId].prize;
        cardData[tokenId].state = CardState.Claimed;
        if (soulbound) _burn(tokenId);
        (bool ok,) = msg.sender.call{value: amount}("");
        require(ok, "Transfer failed");
        emit PrizeClaimed(tokenId, msg.sender, amount);
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        _requireOwned(tokenId);
        CardData memory card = cardData[tokenId];
        string memory image;
        if (card.state == CardState.Unscratched) {
            string memory cid = unscratchedCID[card.charType];
            image = bytes(cid).length > 0 ? cid : _fallbackSVG(card.charType, 255);
        } else {
            string memory cid = revealedCID[card.charType][card.tier];
            image = bytes(cid).length > 0 ? cid : _fallbackSVG(card.charType, card.tier);
        }
        string memory name = string(abi.encodePacked(_charName(card.charType), " #", tokenId.toString()));
        string memory attrs = string(abi.encodePacked('[{"trait_type":"Collection","value":"', _collectionName(card.charType), '"},{"trait_type":"Character","value":"', _charName(card.charType), '"},{"trait_type":"Rarity","value":"', _charRarity(card.charType), '"},{"trait_type":"State","value":"', _stateName(card.state), '"},{"trait_type":"Tier","value":"', _tierName(card.tier), '"}]'));
        string memory json = Base64.encode(bytes(string(abi.encodePacked('{"name":"', name, '","description":"On-chain NFT Scratch Card on Monad.","image":"', image, '","attributes":', attrs,'}'))));
        return string(abi.encodePacked("data:application/json;base64,", json));
    }

    function _fallbackSVG(uint8 charType, uint8 tier) internal pure returns (string memory) {
        string memory color = charType == 0 ? "#00aaff" : charType == 1 ? "#cc44ff" : "#dd00ff";
        string memory label = tier == 255 ? string(abi.encodePacked(_charName(charType), " - Scratch Me!")) : _tierName(tier);
        string memory svg = string(abi.encodePacked('', _charName(charType), '', label, 'Monad Mainnet'));
        return string(abi.encodePacked("data:image/svg+xml;base64,", Base64.encode(bytes(svg))));
    }

    function _update(address to, uint256 tokenId, address auth) internal override returns (address) {
        address from = _ownerOf(tokenId);
        if (soulbound && from != address(0) && to != address(0)) {
            require(cardData[tokenId].state == CardState.Unscratched, "Soulbound: already scratched");
        }
        return super._update(to, tokenId, auth);
    }

    function setCardPrice(uint256 p) external onlyOwner { cardPrice = p; }
    function setMintOpen(bool o) external onlyOwner { mintOpen = o; }
    function setSoulbound(bool s) external onlyOwner { soulbound = s; }
    function fundPrizePool() external payable { prizePool += msg.value; }
    function withdrawHouseEdge(uint256 amount) external onlyOwner { require(amount <= address(this).balance, "Too much"); (bool ok,) = owner().call{value: amount}(""); require(ok); }
    function getCard(uint256 tokenId) external view returns (CardData memory) { return cardData[tokenId]; }
    function getCIDs(uint8 charType) external view returns (string memory, string memory, string memory, string memory, string memory) { return (unscratchedCID[charType], revealedCID[charType][0], revealedCID[charType][1], revealedCID[charType][2], revealedCID[charType][3]); }
    function totalSupply() external view returns (uint256) { return nextTokenId; }
    receive() external payable { prizePool += msg.value; }

    function _charName(uint8 t) internal pure returns (string memory) { if (t == 0) return "USDC Rider"; if (t == 1) return "ETH Warrior"; return "Monad Racer"; }
    function _collectionName(uint8 t) internal pure returns (string memory) { if (t == 0) return "USDC Series"; if (t == 1) return "ETH Series"; return "Monad Series"; }
    function _charRarity(uint8 t) internal pure returns (string memory) { if (t == 0) return "Rare"; if (t == 1) return "Epic"; return "Legendary"; }
    function _tierName(uint8 t) internal pure returns (string memory) { if (t == 3) return "JACKPOT"; if (t == 2) return "Big Win"; if (t == 1) return "Small Win"; return "No Prize"; }
    function _stateName(CardState s) internal pure returns (string memory) { if (s == CardState.Unscratched) return "Unscratched"; if (s == CardState.Scratched) return "Scratched"; return "Claimed"; }
}
