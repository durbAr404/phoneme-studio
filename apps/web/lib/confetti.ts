"use client";
const COLORS = ["#1f7a5c", "#ff8a7a", "#f4b740", "#7fb8f0", "#b58cf0", "#72cfa9"];

/** One-shot confetti burst on a temporary canvas. Skipped when motion is reduced. */
export function confetti() {
  if (typeof window === "undefined") return;
  const motion = document.documentElement.dataset.motion;
  if (motion === "off" || motion === "less" || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const canvas = document.createElement("canvas");
  canvas.className = "confetti";
  canvas.setAttribute("aria-hidden", "true");
  Object.assign(canvas.style, { position: "fixed", inset: "0", width: "100%", height: "100%", pointerEvents: "none", zIndex: "80" });
  canvas.width = innerWidth;
  canvas.height = innerHeight;
  document.body.appendChild(canvas);
  const g = canvas.getContext("2d")!;
  const parts = Array.from({ length: 150 }, (_, i) => ({
    x: innerWidth / 2 + (Math.random() - 0.5) * 160,
    y: innerHeight * 0.35,
    vx: (Math.random() - 0.5) * 18,
    vy: -4 - Math.random() * 10,
    r: Math.random() * 6,
    vr: (Math.random() - 0.5) * 0.3,
    w: 6 + Math.random() * 5,
    h: 10 + Math.random() * 6,
    c: COLORS[i % COLORS.length],
  }));
  let frame = 0;
  const tick = () => {
    frame++;
    g.clearRect(0, 0, canvas.width, canvas.height);
    for (const p of parts) {
      p.vy += 0.32;
      p.vx *= 0.99;
      p.x += p.vx;
      p.y += p.vy;
      p.r += p.vr;
      g.save();
      g.translate(p.x, p.y);
      g.rotate(p.r);
      g.fillStyle = p.c;
      g.fillRect(-p.w / 2, -p.h / 2, p.w, p.h * Math.abs(Math.cos(frame / 8)));
      g.restore();
    }
    if (frame < 170) requestAnimationFrame(tick);
    else canvas.remove();
  };
  requestAnimationFrame(tick);
}
