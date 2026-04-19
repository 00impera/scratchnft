import React, { useEffect, useRef } from "react";

const MonadIcon = ({ color }) => (
  <svg width="22" height="22" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="50" cy="50" r="48" fill="#1a0a3e" stroke={color} strokeWidth="3"/>
    <text x="50" y="67" textAnchor="middle" fontSize="52" fontWeight="900" fill={color} fontFamily="monospace">M</text>
  </svg>
);

const TelegramIcon = ({ color }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="11" fill="#0a0a23" stroke={color} strokeWidth="1.2"/>
    <path d="M5.5 11.5l10-4-3.5 10-2.5-3.5-4-2.5z" fill={color} opacity="0.9"/>
  </svg>
);

const XIcon = ({ color }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="11" fill="#0a0a23" stroke={color} strokeWidth="1.2"/>
    <path d="M7 7l9 9M7 16l9-9" stroke={color} strokeWidth="2.2" strokeLinecap="round"/>
  </svg>
);

const DiscordIcon = ({ color }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="11" fill="#0a0a23" stroke={color} strokeWidth="1.2"/>
    <path d="M8.5 14.5c1 .5 2 .8 3.5.8s2.5-.3 3.5-.8" stroke={color} strokeWidth="1.4" strokeLinecap="round"/>
    <circle cx="9.5" cy="11.5" r="1.2" fill={color}/>
    <circle cx="14.5" cy="11.5" r="1.2" fill={color}/>
    <path d="M8 9c1-1 2-1.5 4-1.5s3 .5 4 1.5" stroke={color} strokeWidth="1.2" strokeLinecap="round"/>
  </svg>
);

const LINKS = [
  {
    Icon: MonadIcon,
    label: "MonadVision",
    sub: "View Token",
    url: "https://monadvision.com/token/0x71a8F50008b08cc736E739239faF549a34fD9C8f",
    color: "#836ef9",
  },
  {
    Icon: TelegramIcon,
    label: "Telegram",
    sub: "@scratchnft_bot",
    url: "https://t.me/scratchnft_bot",
    color: "#00c8ff",
  },
  {
    Icon: XIcon,
    label: "Twitter / X",
    sub: "@bnbgold277983",
    url: "https://twitter.com/bnbgold277983",
    color: "#e0e0ff",
  },
  {
    Icon: DiscordIcon,
    label: "Discord",
    sub: "Join Server",
    url: "https://discord.com/channels/1316093079090106472",
    color: "#5865f2",
  },
];

export default function AdBanner() {
  const trackRef = useRef(null);
  const posRef   = useRef(0);
  const rafRef   = useRef(null);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    track.innerHTML += track.innerHTML;
    function animate() {
      posRef.current -= 0.5;
      const half = track.scrollWidth / 2;
      if (Math.abs(posRef.current) >= half) posRef.current = 0;
      track.style.transform = "translateX(" + posRef.current + "px)";
      rafRef.current = requestAnimationFrame(animate);
    }
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  return (
    <div style={{
      width: "100%",
      background: "rgba(8,2,28,0.98)",
      overflow: "hidden",
      position: "relative",
    }}>
      <div style={{
        height: 2,
        background: "linear-gradient(90deg,#836ef9,00c8ff,#00ff88,0#5865f2,#836ef9)",
        backgroundSize: "300% 100%",
        animation: "bannerGlow 4s linear infinite",
      }} />

      <div style={{ overflow: "hidden", padding: "8px 0" }}>
        <div ref={trackRef} style={{
          display: "flex",
          alignItems: "center",
          gap: 0,
          whiteSpace: "nowrap",
          willChange: "transform",
        }}>
          {LINKS.map((item, i) => (
            <a
              key={i}
              href={item.url}
              target="_blank"
              rel="noreferrer"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 12,
                padding: "7px 36px",
                textDecoration: "none",
                borderRight: "1px solid rgba(131,110,249,0.12)",
                transition: "background 0.25s",
                cursor: "pointer",
              }}
              onMouseEnter={e => { e.currentTarget.style.background = item.color + "14"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
            >
              <span style={{
                display: "flex",
                alignItems: "center",
                filter: "drop-shadow(0 0 7px " + item.color + ")",
              }}>
                <item.Icon color={item.color} />
              </span>
              <span style={{ display: "flex", flexDirection: "column", gap: 1 }}>
                <span style={{
                  fontSize: 12,
                  fontWeight: 800,
                  color: item.color,
                  textShadow: "0 0 10px " + item.color + ", 0 0 20px " + item.color + "55",
                  letterSpacing: 1,
                  fontFamily: "monospace",
                  textTransform: "uppercase",
                }}>{item.label}</span>
                <span style={{
                  fontSize: 10,
                  color: "#555",
                  letterSpacing: 0.5,
                  fontFamily: "monospace",
                }}>{item.sub}</span>
              </span>
            </a>
          ))}
        </div>
      </div>

      <div style={{
        height: 2,
        background: "linear-gradient(90deg,#5865f2,#00ff88,#00c8ff,#836ef9)",
        backgroundSize: "300% 100%",
        animation: "bannerGlow 4s linear infinite reverse",
      }} />

      <style>{"@keyframes bannerGlow { 0% { background-position: 0% 0% } 100% { background-position: 300% 0% } }"}</style>
    </div>
  );
}
