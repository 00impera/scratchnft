import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import { NFT_SERIES, PRIZE_TABLE } from "../nftData";
import { CONTRACT_ADDR, ABI, CHAIN_ID, RPC_URL, CARD_STATE, TIER_LABELS } from "../hooks/useContract";
import SpinWheel from "./SpinWheel";
import ScratchCard from "./ScratchCard";

function burst() {
  const colors = ["#00c8ff","#836ef9","#00ff88","#fff","#ffcc00"];
  for (let i = 0; i < 60; i++) {
    const el = document.createElement("div");
    el.style.cssText = `position:fixed;left:${Math.random()*100}vw;top:-10px;width:8px;height:8px;border-radius:50%;background:${colors[~~(Math.random()*colors.length)]};pointer-events:none;z-index:9999;animation:fall ${1.2+Math.random()*1.5}s linear forwards;`;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 3000);
  }
}

async function ensureMonad() {
  const chainHex = "0x" + CHAIN_ID.toString(16);
  try {
    await window.ethereum.request({ method:"wallet_switchEthereumChain", params:[{ chainId: chainHex }] });
  } catch(e) {
    if (e.code === 4902) {
      await window.ethereum.request({ method:"wallet_addEthereumChain",
        params:[{ chainId: chainHex, chainName:"Monad",
          rpcUrls:["https://rpc.monad.xyz"], nativeCurrency:{name:"MON",symbol:"MON",decimals:18},
          blockExplorerUrls:["https://monadscan.com"] }] });
    } else throw e;
  }
}

function cidToUrl(cid) {
  if (!cid) return "";
  if (cid.startsWith("http")) return cid;
  return `https://ipfs.io/ipfs/${cid}`;
}

export default function NFTGallery({ walletAddress }) {
  const [modal,        setModal]       = useState(null);
  const [spinning,     setSpinning]    = useState(false);
  const [minting,      setMinting]     = useState(false);
  const [mintedTx,     setMintedTx]    = useState(null);
  const [mintedId,     setMintedId]    = useState(null);
  const [scratchDone,  setScratchDone] = useState(false);
  const [error,        setError]       = useState("");
  const [revealImg,    setRevealImg]   = useState("");
  const [coverImg,     setCoverImg]    = useState("");
  const [cardData,     setCardData]    = useState(null);
  const [scratching,   setScratching]  = useState(false);
  const [claiming,     setClaiming]    = useState(false);
  const [myCards,      setMyCards]     = useState([]);
  const [loadingCards, setLoadingCards]= useState(false);
  const [prizePool,    setPrizePool]   = useState("—");
  const [cardPrice,    setCardPrice]   = useState("—");
  const [activeTab,    setActiveTab]   = useState("buy");

  useEffect(() => {
    async function loadStats() {
      try {
        const provider = new ethers.JsonRpcProvider(RPC_URL);
        const contract = new ethers.Contract(CONTRACT_ADDR, ABI, provider);
        const [price, pool] = await Promise.all([contract.cardPrice(), contract.prizePool()]);
        setCardPrice(ethers.formatEther(price) + " MON");
        setPrizePool(ethers.formatEther(pool) + " MON");
      } catch(_) {}
    }
    loadStats();
  }, []);

  useEffect(() => {
    if (!walletAddress) { setMyCards([]); return; }
    loadMyCards();
  }, [walletAddress]);

  async function loadMyCards() {
    if (!walletAddress) return;
    setLoadingCards(true);
    try {
      const provider = new ethers.JsonRpcProvider(RPC_URL);
      const contract = new ethers.Contract(CONTRACT_ADDR, ABI, provider);
      const nextId = await contract.nextTokenId();
      const total = Number(nextId);
      const cards = [];
      for (let i = 0; i < Math.min(total, 200); i++) {
        try {
          const owner = await contract.ownerOf(i);
          if (owner.toLowerCase() === walletAddress.toLowerCase()) {
            const data = await contract.getCard(i);
            cards.push({ tokenId: i, charType: Number(data.charType), tier: Number(data.tier), prize: data.prize, state: Number(data.state) });
          }
        } catch(_) {}
      }
      setMyCards(cards);
    } catch(e) { console.error(e); }
    setLoadingCards(false);
  }

  function openModal(series) {
    const randOutcome = series.outcomes[Math.floor(Math.random()*series.outcomes.length)];
    setRevealImg(randOutcome.image);
    setCoverImg(series.coverImage);
    setModal({ series, step:"spin" });
    setSpinning(false); setMinting(false);
    setMintedTx(null); setMintedId(null);
    setScratchDone(false); setError(""); setCardData(null);
  }

  function closeModal() {
    setModal(null); setSpinning(false); setMinting(false);
    setMintedTx(null); setMintedId(null);
    setScratchDone(false); setError(""); setCardData(null);
  }

  async function handleBuy() {
    if (!window.ethereum) return setError("Install MetaMask first!");
    if (!walletAddress)   return setError("Connect your wallet first!");
    setMinting(true); setError("");
    try {
      await ensureMonad();
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer   = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDR, ABI, signer);
      const price    = await contract.cardPrice();
      const tx = await contract.mintSpecific(modal.series.charType, { value: price });
      const receipt = await tx.wait();
      let tokenId = null;
      try {
        const iface = new ethers.Interface(ABI);
        for (const log of receipt.logs) {
          try {
            const parsed = iface.parseLog(log);
            if (parsed?.name === "CardMinted") { tokenId = parsed.args.tokenId?.toString(); break; }
          } catch(_) {}
        }
      } catch(_) {}
      setMintedTx(receipt.hash);
      setMintedId(tokenId);
      burst();
      setModal(m => ({ ...m, step:"scratch" }));
    } catch(e) {
      setError(e.reason || e.shortMessage || e.message || "Transaction failed");
    }
    setMinting(false);
  }

  async function handleScratch() {
    if (!mintedId) return;
    setScratching(true); setError("");
    try {
      await ensureMonad();
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer   = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDR, ABI, signer);
      const tx = await contract.scratch(mintedId);
      await tx.wait();
      const readContract = new ethers.Contract(CONTRACT_ADDR, ABI, provider);
      const data = await readContract.getCard(mintedId);
      setCardData(data);
      const tier = Number(data.tier);
      const charType = modal.series.charType ?? 0;
      try {
        const cids = await readContract.getCIDs(charType);
        const tierToIdx = { 3:1, 2:2, 1:3, 0:4 };
        const cidIdx = tierToIdx[tier] ?? 1;
        if (cids[cidIdx]) setRevealImg(cidToUrl(cids[cidIdx]));
      } catch(_) {
        setRevealImg(modal.series.outcomes[Math.min(tier, modal.series.outcomes.length-1)].image);
      }
      setScratchDone(true);
      burst();
    } catch(e) {
      setError(e.reason || e.shortMessage || e.message || "Scratch failed");
    }
    setScratching(false);
  }

  async function handleClaim(tokenId) {
    if (!window.ethereum) return;
    setClaiming(true); setError("");
    try {
      await ensureMonad();
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer   = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDR, ABI, signer);
      const tx = await contract.claim(tokenId);
      await tx.wait();
      burst();
      await loadMyCards();
    } catch(e) {
      setError(e.reason || e.shortMessage || e.message || "Claim failed");
    }
    setClaiming(false);
  }

  const seriesForCharType = (ct) => NFT_SERIES.find(s => s.charType === ct) || NFT_SERIES[0];

  return (
    <>
      <div className="stats-bar">
        <div className="stat-item">
          <span className="stat-label">💰 Prize Pool</span>
          <span className="stat-value green">{prizePool}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">🎴 Card Price</span>
          <span className="stat-value">{cardPrice}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">📄 Contract</span>
          <a className="stat-value mono"
            href={`https://monadscan.com/address/${CONTRACT_ADDR}`}
            target="_blank" rel="noreferrer">
            {CONTRACT_ADDR.slice(0,8)}…{CONTRACT_ADDR.slice(-6)}
          </a>
        </div>
      </div>

      <div className="inner-tabs">
        <button className={`inner-tab ${activeTab==="buy"?"active":""}`}
          onClick={() => setActiveTab("buy")}>🎰 Buy Cards</button>
        <button className={`inner-tab ${activeTab==="mycards"?"active":""}`}
          onClick={() => { setActiveTab("mycards"); if(walletAddress) loadMyCards(); }}>
          🃏 My Cards {myCards.length > 0 ? `(${myCards.length})` : ""}
        </button>
      </div>

      <section className="prize-table-section">
        <h3 className="section-title" style={{color:"#00c8ff"}}>🏆 Prize Tiers</h3>
        <table className="prize-table">
          <thead><tr><th>Tier</th><th>Multiplier</th><th>Chance</th></tr></thead>
          <tbody>
            {PRIZE_TABLE.map((p,i) => (
              <tr key={i}>
                <td>{p.tier}</td>
                <td style={{color:"#00ff88"}}>{p.multiplier}</td>
                <td style={{color:"#836ef9"}}>{p.chance}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {activeTab === "buy" && (
        <section className="gallery-section">
          <h3 className="section-title" style={{color:"#836ef9"}}>🃏 Choose Your Series</h3>
          <div className="series-grid">
            {NFT_SERIES.map((series, si) => (
              <div key={si} className="series-card" style={{"--c": series.color}}>
                {/* ── COVER IMAGE ── */}
                <div style={{
                  width:"100%", height:180, borderRadius:12, overflow:"hidden",
                  marginBottom:8, border:`1.5px solid ${series.color}33`
                }}>
                  <img
                    src={series.coverImage}
                    alt={series.series}
                    style={{width:"100%", height:"100%", objectFit:"cover", display:"block"}}
                    onError={e => { e.target.style.display="none"; }}
                  />
                </div>
                <div className="series-rarity">{series.rarity}</div>
                <div className="series-name">{series.series}</div>
                <div className="series-price">Price: <b>{series.price} MON</b></div>
                <div className="series-outcomes">
                  {series.outcomes.map((o,oi) => (
                    <span key={oi} className="outcome-tag">{o.label}</span>
                  ))}
                </div>
                <button className="btn-spin"
                  style={{borderColor:series.color, color:series.color}}
                  onClick={() => openModal(series)}>
                  🎰 Spin &amp; Buy
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {activeTab === "mycards" && (
        <section className="gallery-section">
          <h3 className="section-title" style={{color:"#836ef9"}}>🃏 My Cards</h3>
          {!walletAddress && <p style={{color:"#888",textAlign:"center"}}>Connect your wallet.</p>}
          {walletAddress && loadingCards && <p style={{color:"#00c8ff",textAlign:"center"}}>Loading…</p>}
          {walletAddress && !loadingCards && myCards.length === 0 && <p style={{color:"#888",textAlign:"center"}}>No cards yet. Buy one!</p>}
          <div className="series-grid">
            {myCards.map(card => {
              const series = seriesForCharType(card.charType);
              const prizeEth = card.prize > 0n ? ethers.formatEther(card.prize) : null;
              return (
                <div key={card.tokenId} className="series-card" style={{"--c": series.color}}>
                  {/* cover image for owned cards */}
                  <div style={{
                    width:"100%", height:150, borderRadius:12, overflow:"hidden",
                    marginBottom:8, border:`1.5px solid ${series.color}33`
                  }}>
                    <img
                      src={card.state >= 1
                        ? series.outcomes[Math.min(card.tier ?? 0, series.outcomes.length-1)].image
                        : series.coverImage}
                      alt={`Token #${card.tokenId}`}
                      style={{width:"100%", height:"100%", objectFit:"cover", display:"block"}}
                      onError={e => { e.target.style.display="none"; }}
                    />
                  </div>
                  <div className="series-rarity">{CARD_STATE[card.state]}</div>
                  <div className="series-name">Token #{card.tokenId}</div>
                  <div style={{color:series.color,fontWeight:700}}>{series.series}</div>
                  {card.state >= 1 && (
                    <div style={{color:"#00ff88"}}>
                      {TIER_LABELS[card.tier]}
                      {prizeEth && <span style={{color:"#ffcc00"}}> — {prizeEth} MON</span>}
                    </div>
                  )}
                  {card.state === 0 && (
                    <button className="btn-spin" style={{borderColor:series.color,color:series.color}}
                      onClick={() => {
                        const randOutcome = series.outcomes[Math.floor(Math.random()*series.outcomes.length)];
                        setRevealImg(randOutcome.image);
                        setCoverImg(series.coverImage);
                        setModal({ series, step:"scratch_existing" });
                        setMintedId(card.tokenId.toString());
                        setScratchDone(false); setError(""); setCardData(null);
                      }}>✨ Scratch Card</button>
                  )}
                  {card.state === 1 && card.prize > 0n && (
                    <button className="btn-spin" style={{borderColor:"#00ff88",color:"#00ff88"}}
                      onClick={() => handleClaim(card.tokenId)} disabled={claiming}>
                      {claiming ? "⏳…" : `💰 Claim ${prizeEth} MON`}
                    </button>
                  )}
                  {card.state === 2 && <div style={{color:"#888",fontSize:12}}>✅ Claimed</div>}
                </div>
              );
            })}
          </div>
          {error && <div className="modal-error" style={{textAlign:"center",marginTop:12}}>{error}</div>}
        </section>
      )}

      {modal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-box" style={{"--c": modal.series.color}} onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={closeModal}>✕</button>
            <h2 className="modal-title">{modal.series.series}</h2>

            {modal.step === "spin" && (
              <div className="modal-step">
                <p className="modal-hint">Spin for luck then buy your scratch card!</p>
                <div className="spin-wrap">
                  <SpinWheel spinning={spinning} color={modal.series.color}
                    onSpinDone={() => { setSpinning(false); setModal(m=>({...m,step:"buy"})); }} />
                </div>
                <button className="btn-neon" style={{background:modal.series.color}}
                  onClick={() => setSpinning(true)} disabled={spinning}>
                  {spinning ? "Spinning…" : "🎡 Spin!"}
                </button>
              </div>
            )}

            {modal.step === "buy" && (
              <div className="modal-step">
                <div className="buy-price">{modal.series.price} MON</div>
                {error && <div className="modal-error">⚠️ {error}</div>}
                <button className="btn-neon" style={{background:modal.series.color}}
                  onClick={handleBuy} disabled={minting}>
                  {minting ? "⏳ Minting…" : `⚡ Buy & Mint (${modal.series.price} MON)`}
                </button>
              </div>
            )}

            {(modal.step === "scratch" || modal.step === "scratch_existing") && (
              <div className="modal-step">
                <p style={{color:"#00ff88",fontWeight:700}}>
                  {modal.step === "scratch" ? "🎉 Minted! Scratch to reveal:" : "Scratch your card!"}
                </p>
                {mintedTx && (
                  <a href={`https://monadscan.com/tx/${mintedTx}`}
                    target="_blank" rel="noreferrer" className="tx-link">View tx ↗</a>
                )}
                <div className="token-id-badge">Token #{mintedId}</div>
                {!scratchDone ? (
                  <>
                    <ScratchCard coverSrc={coverImg} revealSrc={revealImg} onScratched={handleScratch} />
                    {scratching && <p style={{color:"#00c8ff"}}>⏳ Sending scratch tx…</p>}
                    {error && <div className="modal-error">⚠️ {error}</div>}
                  </>
                ) : (
                  <>
                    <img src={revealImg} alt="result"
                      style={{width:200,height:200,borderRadius:14,objectFit:"cover",margin:"12px auto",display:"block"}} />
                    {cardData && (
                      <div className="result-box">
                        <div className="result-tier">{TIER_LABELS[Number(cardData.tier)]}</div>
                        {Number(cardData.prize) > 0 && (
                          <div className="result-prize">Prize: {ethers.formatEther(cardData.prize)} MON</div>
                        )}
                        {Number(cardData.prize) > 0 && (
                          <button className="btn-neon" style={{background:"#00ff88",color:"#000"}}
                            onClick={() => handleClaim(mintedId)}>💰 Claim Prize</button>
                        )}
                      </div>
                    )}
                    <button className="btn-neon" style={{background:"#836ef9"}}
                      onClick={() => { closeModal(); loadMyCards(); }}>Close</button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
