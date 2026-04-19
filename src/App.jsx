import { useState } from "react";
import { ThirdwebProvider, ConnectButton, useActiveAccount } from "thirdweb/react";
import { createThirdwebClient, defineChain } from "thirdweb";
import AdBanner from "./components/AdBanner";
import NFTGallery from "./components/NFTGallery";
import NearSwapBridge from "./components/NearSwapBridge";
import "./styles.css";

export const client = createThirdwebClient({ clientId: "821819db832d1a313ae3b1a62fbeafb7" });

export const MONAD_CHAIN = defineChain({
  id: 143,
  name: "Monad",
  nativeCurrency: { name: "MON", symbol: "MON", decimals: 18 },
  rpc: "https://rpc.monad.xyz",
  blockExplorers: [{ name: "Monadscan", url: "https://monadscan.com" }],
});

function Inner() {
  const account = useActiveAccount();
  const [tab, setTab] = useState("gallery");
  return (
    <div className="app-root">
      <header className="app-header">
        <div className="logo-area">
          <span className="logo-icon">🎴</span>
          <span className="logo-text">ScratchNFT</span>
          <span className="logo-sub">on Monad</span>
        </div>
        <nav className="nav-tabs">
          <button className={`nav-tab $<AdBanner />
        {tab === "gallery" ? "active" : ""}`}
            onClick={() => setTab("gallery")}>🃏 Gallery</button>
          <button className={`nav-tab ${tab === "bridge" ? "active" : ""}`}
            onClick={() => setTab("bridge")}>🌉 Bridge / Swap</button>
        </nav>
        <div className="wallet-area">
          <ConnectButton client={client} chain={MONAD_CHAIN} theme="dark"
            btnTitle="Connect Wallet" connectModal={{ size: "compact" }} />
        </div>
      </header>
      {account
        ? <div className="wallet-banner">✅ Connected: <span className="addr">{account.address}</span></div>
        : <div className="wallet-banner warn">⚠️ Connect your wallet to mint NFTs</div>
      }
      <main className="app-main">
        <AdBanner />
        {tab === "gallery" && <NFTGallery walletAddress={account?.address || ""} />}
        {tab === "bridge"  && <NearSwapBridge monadAddress={account?.address || ""} />}
      </main>
    </div>
  );
}

export default function App() {
  return <ThirdwebProvider><Inner /></ThirdwebProvider>;
}
