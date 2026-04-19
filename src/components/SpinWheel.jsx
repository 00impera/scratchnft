import React, { useRef, useEffect } from "react";

const SEGMENTS = [
  { label: "JACKPOT",   color: "#00ff88" },
  { label: "NO PRIZE",  color: "#1a1a3e" },
  { label: "BIG WIN",   color: "#836ef9" },
  { label: "NO PRIZE",  color: "#1a1a3e" },
  { label: "SMALL WIN", color: "#00c8ff" },
  { label: "NO PRIZE",  color: "#1a1a3e" },
  { label: "BIG WIN",   color: "#836ef9" },
  { label: "NO PRIZE",  color: "#1a1a3e" },
];

export default function SpinWheel({ onSpinDone, spinning, color }) {
  const canvasRef = useRef(null);
  const angleRef  = useRef(0);
  const animRef   = useRef(null);

  function drawWheel(angle) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const W = canvas.width;
    const cx = W / 2, cy = W / 2, r = W / 2 - 8;
    ctx.clearRect(0, 0, W, W);
    const slice = (2 * Math.PI) / SEGMENTS.length;
    SEGMENTS.forEach((seg, i) => {
      const start = angle + i * slice;
      const end   = start + slice;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, r, start, end);
      ctx.fillStyle = seg.color;
      ctx.fill();
      ctx.strokeStyle = "#0a0a23";
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(start + slice / 2);
      ctx.textAlign = "right";
      ctx.fillStyle = "#fff";
      ctx.font = "bold 10px monospace";
      ctx.fillText(seg.label, r - 10, 4);
      ctx.restore();
    });
    ctx.beginPath();
    ctx.arc(cx, cy, 22, 0, 2 * Math.PI);
    ctx.fillStyle = "#0a0a23";
    ctx.fill();
    ctx.strokeStyle = color || "#00c8ff";
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx + r + 6, cy);
    ctx.lineTo(cx + r - 14, cy - 10);
    ctx.lineTo(cx + r - 14, cy + 10);
    ctx.closePath();
    ctx.fillStyle = "#fff";
    ctx.fill();
  }

  useEffect(() => { drawWheel(angleRef.current); }, []);

  useEffect(() => {
    if (!spinning) return;
    const totalSpins = (Math.random() * 4 + 6) * 2 * Math.PI;
    const duration = 3500;
    const start = performance.now();
    const startAngle = angleRef.current;
    function animate(now) {
      const elapsed = now - start;
      const t = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - t, 4);
      angleRef.current = startAngle + totalSpins * ease;
      drawWheel(angleRef.current);
      if (t < 1) { animRef.current = requestAnimationFrame(animate); }
      else { onSpinDone && onSpinDone(); }
    }
    animRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animRef.current);
  }, [spinning]);

  return (
    <canvas ref={canvasRef} width={260} height={260}
      style={{ borderRadius: "50%", display: "block" }} />
  );
}
