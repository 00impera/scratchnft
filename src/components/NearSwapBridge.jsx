import React, { useState, useEffect, useCallback } from "react";
import { BuyWidget } from "thirdweb/react";
import { client, MONAD_CHAIN } from "../App";

const NEAR_JWT = "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IjIwMjUtMDEtMTItdjEifQ.eyJ2IjoxLCJrZXlfdHlwZSI6ImRpc3RyaWJ1dGlvbl9jaGFubmVsIiwicGFydG5lcl9pZCI6ImNyeXB0b2Nhc2gtbmZ0IiwiaWF0IjoxNzczMDc3MzExLCJleHAiOjE4MDQ2MTMzMTF9.Wi55S8cwVmAXPtOG0ymr7ldX-5CXVygzuanbjAAJHP-Am14_52C6i4cQG5FvjcAorw0KD8k8JD_YX5AM4QKhNqYtU5gsI4-KKe0KavO5_69NowzUKc_ubtjYn85eFjWskzZQvICMqSZkdGOSnMT_hNEePA8qYi_wSov4a4bQh4zIfNA0znEdDIV3rGI_bDM9dgOk0PnJRIpwi_aXOQ8Q4e50IO2UMrZEDtBVmUhK5-Mno3S_iS7tZl4QSui_4_bNCapQolFwUPB9Zqyxay_6rPVEr7j-8Ez5-htwkR5ZYvTb1mJaj3DVPpWPL9QTxhjvhbJ7nKrWpibcWX3AVoXZ6g";
const NEAR_API = "https://1click.chaindefuser.com/v0";

const AMOUNTS = [5, 10, 20, 50, 100, 200, 300, 500, 1000];

async function nearFetch(path, opts = {}) {
  const res = await fetch(NEAR_API + path, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + NEAR_JWT,
      ...(opts.headers || {}),
    },
  });
  if (!res.ok) throw new Error(`NEAR API ${path}: ${res.status}`);
  return res.json();
}

function shortAddr(addr) {
  if (!addr) return "";
  return addr.slice(0, 8) + "…" + addr.slice(-6);
}

export default function NearSwapBridge({ monadAddress }) {
  const [tokens,       setTokens]   = useState([]);
  const [loadingTokens,setLT]       = useState(true);
  const [tokenError,   setTE]       = useState("");
  const [originAsset,  setOA]       = useState("");
  const [amount,       setAmount]   = useState("");
  const [quote,        setQuote]    = useState(null);
  const [quoteLoading, setQL]       = useState(false);
  const [quoteError,   setQE]       = useState("");
  const [copied,       setCopied]   = useState(false);
  const [tab,          setTab]      = useState("bridge");
  const [fiatAmt,      setFiatAmt]  = useState(50);

  useEffect(() => {
    setLT(true);
    nearFetch("/tokens")
      .then(data => setTokens(Array.isArray(data) ? data : (data.tokens || [])))
      .catch(e => setTE(e.message))
      .finally(() => setLT(false));
  }, []);

  const getQuote = useCallback(async () => {
    if (!originAsset || !amount || parseFloat(amount) <= 0) return;
    if (!monadAddress) { setQE("Connect your wallet first."); return; }
    setQL(true); setQE(""); setQuote(null);
    try {
      const token = tokens.find(t => t.assetId === originAsset);
      const decimals = token?.decimals ?? 18;
      const amountRaw = BigInt(Math.round(parseFloat(amount) * 10 ** decimals)).toString();
      const deadline = new Date(Date.now() + 10 * 60 * 1000).toISOString();
      const data = await nearFetch("/quote", {
        method: "POST",
        body: JSON.stringify({
          dry: false, swapType: "EXACT_INPUT", slippageTolerance: 100,
          originAsset, depositType: "ORIGIN_CHAIN",
          destinationAsset: "nep141:wrap.near",
          amount: amountRaw, recipient: monadAddress,
          recipientType: "DESTINATION_CHAIN",
          refundTo: monadAddress, refundType: "ORIGIN_CHAIN", deadline,
        }),
      });
      setQuote(data);
    } catch (e) { setQE(e.message); }
    setQL(false);
  }, [originAsset, amount, monadAddress, tokens]);

  const selectedToken = tokens.find(t => t.assetId === originAsset);

  return (
    <div className="bridge-root">
      <div className="bridge-tabs">
        <button className={`bridge-tab-btn ${tab === "bridge" ? "active" : ""}`}
          onClick={() => setTab("bridge")}>🌉 Cross-Chain Swap</button>
        <button className={`bridge-tab-btn ${tab === "card" ? "active" : ""}`}
          onClick={() => setTab("card")}>💳 Buy with Card</button>
      </div>

      {tab === "bridge" && (
        <div className="bridge-panel">
          <div className="bridge-header">
            <h2 className="bridge-title">🌉 NEAR Intents Bridge</h2>
            <p className="bridge-desc">Swap ETH, USDC, NEAR and more to your Monad wallet.</p>
          </div>
          <div className="bridge-field">
            <label className="bridge-label">From Token</label>
            {loadingTokens ? <div className="bridge-loading">Loading tokens…</div>
              : tokenError ? <div className="bridge-error">⚠️ {tokenError}</div>
              : (
                <select className="bridge-select" value={originAsset}
                  onChange={e => { setOA(e.target.value); setQuote(null); setQE(""); }}>
                  <option value="">— Select source token —</option>
                  {tokens.map(t => (
                    <option key={t.assetId} value={t.assetId}>
                      {t.symbol} · {t.blockchain?.toUpperCase() || ""}
                    </option>
                  ))}
                </select>
              )}
          </div>
          <div className="bridge-field">
            <label className="bridge-label">Amount{selectedToken ? ` (${selectedToken.symbol})` : ""}</label>
            <input className="bridge-input" type="number" min="0" step="any"
              placeholder="0.00" value={amount}
              onChange={e => { setAmount(e.target.value); setQuote(null); setQE(""); }} />
          </div>
          <div className="bridge-field">
            <label className="bridge-label">Your Monad Address</label>
            <input className="bridge-input mono" type="text"
              value={monadAddress || "Connect wallet above"} readOnly />
          </div>
          <button className="bridge-btn" onClick={getQuote}
            disabled={quoteLoading || !originAsset || !amount || !monadAddress}>
            {quoteLoading ? <span className="spinner" /> : "⚡ Get Quote"}
          </button>
          {quoteError && <div className="bridge-error">⚠️ {quoteError}</div>}
          {quote && (
            <div className="bridge-quote">
              <div className="bridge-quote-row">
                <span>You send</span>
                <strong>{amount} {selectedToken?.symbol}</strong>
              </div>
              <div className="bridge-quote-row">
                <span>You receive (est.)</span>
                <strong className="green">{quote.amountOutFormatted ?? "—"} MON</strong>
              </div>
              {quote.depositAddress && (
                <>
                  <div className="bridge-quote-row">
                    <span>Deposit address</span>
                    <span className="deposit-addr">
                      {shortAddr(quote.depositAddress)}
                      <button className="copy-btn"
                        onClick={() => { navigator.clipboard.writeText(quote.depositAddress);
                          setCopied(true); setTimeout(() => setCopied(false), 2000); }}>
                        {copied ? "✅" : "📋"}
                      </button>
                    </span>
                  </div>
                  <div className="bridge-quote-full-addr">
                    <span className="addr-label">Full address:</span>
                    <code className="full-addr">{quote.depositAddress}</code>
                  </div>
                  <div className="bridge-instructions">
                    Send <b>{amount} {selectedToken?.symbol}</b> to the deposit address
                    on <b>{selectedToken?.blockchain?.toUpperCase()}</b>.
                    NEAR Intents bridges it to your Monad wallet automatically.
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {tab === "card" && (
        <div className="bridge-panel">
          <div className="bridge-header">
            <h2 className="bridge-title">💳 Buy MON with Card</h2>
            <p className="bridge-desc">Visa, Mastercard, Apple Pay or Google Pay. MON lands in your wallet.</p>
          </div>

          {!monadAddress ? (
            <div className="bridge-warning">⚠️ Connect your wallet first.</div>
          ) : (
            <>
              {/* Amount presets */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 12, color: "#888", fontWeight: 700,
                  letterSpacing: 1, marginBottom: 10, textTransform: "uppercase" }}>
                  Select Amount (USD)
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {AMOUNTS.map(a => (
                    <button key={a} onClick={() => setFiatAmt(a)}
                      style={{
                        padding: "7px 14px",
                        borderRadius: 10,
                        border: fiatAmt === a ? "2px solid #836ef9" : "1px solid #2a2a5e",
                        background: fiatAmt === a ? "rgba(131,110,249,0.2)" : "rgba(255,255,255,0.03)",
                        color: fiatAmt === a ? "#836ef9" : "#aaa",
                        fontWeight: fiatAmt === a ? 800 : 400,
                        fontSize: 14,
                        cursor: "pointer",
                        transition: "all 0.15s",
                        boxShadow: fiatAmt === a ? "0 0 12px #836ef955" : "none",
                      }}>
                      ${a}
                    </button>
                  ))}
                </div>
                {/* custom input */}
                <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ color: "#888", fontSize: 13 }}>Custom $</span>
                  <input
                    type="number" min="1" max="10000"
                    value={fiatAmt}
                    onChange={e => setFiatAmt(Number(e.target.value))}
                    style={{
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid #836ef9",
                      color: "#e0e0ff", padding: "6px 12px",
                      borderRadius: 8, fontSize: 14, width: 100,
                      outline: "none",
                    }}
                  />
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "center" }}>
                <BuyWidget
                  client={client}
                  chain={MONAD_CHAIN}
                  theme="dark"
                  amount={fiatAmt.toString()}
                  style={{ width: "100%", maxWidth: 420 }}
                />
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
