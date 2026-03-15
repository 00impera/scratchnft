import Irys from "@irys/sdk";
import fs from "fs";

const key = process.env.PRIVATE_KEY;
const rpc = "https://monad-mainnet.g.alchemy.com/v2/Uwb7T0DbXMQHjiJBNf9_b005qYjLmJqk";

const irys = new Irys({
  network: "mainnet",
  token: "monad",
  key,
  config: { providerUrl: rpc },
});

await irys.ready();
console.log("Connected:", irys.address);

const images = [
  ["images/usdc_unscratched.jpg",  "usdc_unscratched"],
  ["images/usdc_lose.jpg",         "usdc_lose"],
  ["images/usdc_small.jpg",        "usdc_small"],
  ["images/usdc_big.jpg",          "usdc_big"],
  ["images/eth_unscratched.jpg",   "eth_unscratched"],
  ["images/eth_lose.jpg",          "eth_lose"],
  ["images/monad_unscratched.jpg", "monad_unscratched"],
  ["images/monad_lose.jpg",        "monad_lose"],
  ["images/monad_big.jpg",         "monad_big"],
];

for (const [file, name] of images) {
  try {
    const data = fs.readFileSync(file);
    const receipt = await irys.upload(data, {
      tags: [{ name: "Content-Type", value: "image/jpeg" }],
    });
    console.log(`${name} => ar://${receipt.id}`);
  } catch(e) {
    console.log(`${name} FAILED: ${e.message}`);
  }
}
