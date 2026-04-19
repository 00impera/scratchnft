import React, { useRef, useEffect, useState } from "react";

export default function ScratchCard({ coverSrc, revealSrc, onScratched }) {
  const canvasRef    = useRef(null);
  const [scratching, setScratching] = useState(false);
  const [done, setDone]             = useState(false);
  const scratchedRef = useRef(false);

  useEffect(() => {
    setDone(false);
    scratchedRef.current = false;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const img = new window.Image();
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    };
    img.src = coverSrc;
  }, [coverSrc]);

  function getPos(e, canvas) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return { x: (clientX - rect.left) * scaleX, y: (clientY - rect.top) * scaleY };
  }

  function scratch(e) {
    if (!scratching || done) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const { x, y } = getPos(e, canvas);
    ctx.globalCompositeOperation = "destination-out";
    ctx.beginPath();
    ctx.arc(x, y, 28, 0, 2 * Math.PI);
    ctx.fill();
    if (scratchedRef.current) return;
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    let cleared = 0;
    for (let i = 3; i < data.length; i += 4) { if (data[i] === 0) cleared++; }
    if (cleared / (canvas.width * canvas.height) > 0.55) {
      scratchedRef.current = true;
      setDone(true);
      onScratched && onScratched();
    }
  }

  return (
    <div style={{ position:"relative", width:220, height:220 }}>
      <img src={revealSrc} alt="reveal"
        style={{ position:"absolute", top:0, left:0, width:220, height:220,
          borderRadius:14, objectFit:"cover" }} />
      <canvas ref={canvasRef} width={220} height={220}
        style={{ position:"absolute", top:0, left:0, borderRadius:14,
          cursor: done ? "default" : "crosshair", touchAction:"none",
          opacity: done ? 0 : 1, transition:"opacity 0.5s" }}
        onMouseDown={() => setScratching(true)}
        onMouseUp={()   => setScratching(false)}
        onMouseLeave={()=> setScratching(false)}
        onMouseMove={scratch}
        onTouchStart={() => setScratching(true)}
        onTouchEnd={()   => setScratching(false)}
        onTouchMove={scratch}
      />
      {done && (
        <div style={{ position:"absolute", bottom:8, left:0, right:0,
          textAlign:"center", color:"#00ff88", fontWeight:700, fontSize:13 }}>
          Revealed! ✨
        </div>
      )}
    </div>
  );
}
