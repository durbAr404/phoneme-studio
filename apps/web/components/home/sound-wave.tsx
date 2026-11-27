"use client";
import { useEffect, useRef, useState } from "react";

const HEIGHTS = [20, 34, 58, 80, 62, 40, 24, 30, 52, 88, 96, 70, 44, 28, 36, 60, 84, 72, 50, 32, 22, 38, 64, 90, 76, 48, 30, 26, 44, 70, 92, 66, 40, 24, 18, 30, 56, 78, 58, 36, 22, 14];
// Colour pairs cycle every 3 seconds. Each pair reads well on both themes.
const PAIRS: [string, string][] = [
  ["var(--wave-1)", "var(--wave-2)"],
  ["#3b8fd1", "#f4b740"],
  ["#e0784f", "#7fb8f0"],
  ["#8a6cd6", "#72cfa9"],
  ["#d1607e", "#f4b740"],
  ["#2f9fa8", "#ff8a7a"],
];

/** Decorative, animated sound wave. Purely visual: no letters, colours change every 3s, tap to make it jump. */
export function SoundWave({ compact }: { compact?: boolean }) {
  const [pair, setPair] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const id = setInterval(() => setPair((p) => (p + 1) % PAIRS.length), 3000);
    return () => clearInterval(id);
  }, []);
  const surge = () => {
    const el = ref.current;
    if (!el) return;
    el.classList.remove("wave-surge");
    void el.offsetWidth;
    el.classList.add("wave-surge");
    setTimeout(() => el.classList.remove("wave-surge"), 800);
  };
  const [c1, c2] = PAIRS[pair];
  const bars = compact ? HEIGHTS.slice(0, 26) : HEIGHTS;
  return (
    <div ref={ref} onClick={surge} aria-hidden className="flex cursor-pointer items-center gap-[5px] sm:gap-1.5" style={{ height: compact ? 96 : 160 }}>
      {bars.map((h, i) => (
        <span key={i} className="wave-bar flex-1 rounded-full" style={{ height: `${h * 0.85}%`, background: i % 3 === 2 ? c2 : c1, animationDelay: `${(-i * 0.07).toFixed(2)}s` }} />
      ))}
    </div>
  );
}
