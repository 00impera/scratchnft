const IMG = "/images";

export const PRIZE_TABLE = [
  { tier: "🏆 Jackpot",   multiplier: "100x", chance: "0.1%"  },
  { tier: "💎 Big Win",   multiplier: "10x",  chance: "2%"    },
  { tier: "⭐ Small Win", multiplier: "2x",   chance: "15%"   },
  { tier: "😶 No Prize",  multiplier: "0x",   chance: "82.9%" },
];

const LOGOS = [
  "/images/logo1.png","/images/logo2.png","/images/logo3.png","/images/logo4.png",
  "/images/logo5.png","/images/logo6.png","/images/logo7.png","/images/logo8.png",
  "/images/logo9.png","/images/logo10.png","/images/logo11.png","/images/logo12.png",
];

export const NFT_SERIES = [
  {
    series:     "🟣 Monad Series",
    rarity:     "LEGENDARY",
    color:      "#836ef9",
    price:      100,
    charType:   0,
    coverImage: `${IMG}/monad_unscratched.jpg`,
    outcomes: [
      { label: "🏆 Jackpot",   image: `${IMG}/monad_big.jpg`  },
      { label: "💎 Big Win",   image: `${IMG}/monad_big.jpg`  },
      { label: "⭐ Small Win", image: `${IMG}/monad_big.jpg`  },
      { label: "😶 No Prize",  image: `${IMG}/monad_lose.jpg` },
    ],
    logos: [LOGOS[0], LOGOS[1], LOGOS[2], LOGOS[3]],
  },
  {
    series:     "💠 ETH Series",
    rarity:     "EPIC",
    color:      "#00c8ff",
    price:      500,
    charType:   1,
    coverImage: `${IMG}/eth_unscratched.jpg`,
    outcomes: [
      { label: "🏆 Jackpot",   image: `${IMG}/eth_unscratched.jpg` },
      { label: "💎 Big Win",   image: `${IMG}/eth_unscratched.jpg` },
      { label: "⭐ Small Win", image: `${IMG}/eth_unscratched.jpg` },
      { label: "😶 No Prize",  image: `${IMG}/eth_lose.jpg`        },
    ],
    logos: [LOGOS[4], LOGOS[5], LOGOS[6], LOGOS[7]],
  },
  {
    series:     "💵 USDC Series",
    rarity:     "RARE",
    color:      "#00ff88",
    price:      1000,
    charType:   2,
    coverImage: `${IMG}/usdc_unscratched.jpg`,
    outcomes: [
      { label: "🏆 Jackpot",   image: `${IMG}/usdc_big.jpg`   },
      { label: "💎 Big Win",   image: `${IMG}/usdc_big.jpg`   },
      { label: "⭐ Small Win", image: `${IMG}/usdc_small.jpg` },
      { label: "😶 No Prize",  image: `${IMG}/usdc_lose.jpg`  },
    ],
    logos: [LOGOS[8], LOGOS[9], LOGOS[10], LOGOS[11]],
  },
];
