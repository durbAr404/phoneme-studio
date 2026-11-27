"use client";
import { useEffect, useRef } from "react";
import { cn } from "@/lib/cn";

export type Mood = "calm" | "happy" | "sad" | "wow";
const MOUTH: Record<Mood, string> = {
  calm: "M48 80 Q60 88 72 80",
  happy: "M44 76 Q60 96 76 76",
  sad: "M48 86 Q60 76 72 86",
  wow: "M54 80 Q60 92 66 80 Q60 74 54 80",
};

/** The game buddy: eyes follow the pointer, blinks, hops when you win and droops when you lose. */
export function Buddy({ mood = "calm", size = 110, className }: { mood?: Mood; size?: number; className?: string }) {
  const svg = useRef<SVGSVGElement>(null);
  useEffect(() => {
    const move = (e: PointerEvent) => {
      const el = svg.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      el.querySelectorAll<SVGCircleElement>("[data-pupil]").forEach((p) => {
        const cx = r.left + (Number(p.dataset.pupil) / 120) * r.width;
        const cy = r.top + (54 / 120) * r.height;
        const a = Math.atan2(e.clientY - cy, e.clientX - cx);
        const d = Math.min(5, Math.hypot(e.clientX - cx, e.clientY - cy) / 40);
        p.style.transform = `translate(${Math.cos(a) * d}px, ${Math.sin(a) * d}px)`;
      });
    };
    window.addEventListener("pointermove", move);
    return () => window.removeEventListener("pointermove", move);
  }, []);
  return (
    <svg ref={svg} width={size} height={size} viewBox="0 0 120 120" aria-hidden className={cn("shrink-0 overflow-visible", className)}>
      <g key={mood} style={{ animation: mood === "happy" ? "hop .5s ease 2" : undefined, transform: mood === "sad" ? "translateY(5px) scale(1.03,.95)" : undefined, transformOrigin: "60px 110px", transition: "transform .6s" }}>
        <ellipse cx="60" cy="112" rx="38" ry="6" fill="var(--line-strong)" />
        <path d="M60 14c30 0 46 22 46 50s-14 44-46 44-46-16-46-44 16-50 46-50z" fill="#ff8a7a" />
        <path d="M30 40c6-10 14-15 22-16" stroke="#fff" strokeWidth="5" strokeLinecap="round" fill="none" opacity=".55" />
        <circle cx="44" cy="54" r="11" fill="#fff" />
        <circle cx="76" cy="54" r="11" fill="#fff" />
        <circle data-pupil="44" cx="44" cy="54" r="5" fill="#17352e" />
        <circle data-pupil="76" cx="76" cy="54" r="5" fill="#17352e" />
        <g style={{ animation: "blink 4.5s infinite", transformOrigin: "60px 54px" }}>
          <rect x="31" y="42" width="26" height="24" rx="12" fill="#ff8a7a" />
          <rect x="63" y="42" width="26" height="24" rx="12" fill="#ff8a7a" />
        </g>
        <path d={MOUTH[mood]} stroke="#17352e" strokeWidth="4" strokeLinecap="round" fill="none" />
        <circle cx="32" cy="74" r="6" fill="#ffd3b8" />
        <circle cx="88" cy="74" r="6" fill="#ffd3b8" />
      </g>
    </svg>
  );
}
