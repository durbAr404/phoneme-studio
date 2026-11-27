import Link from "next/link";

/** Logo: a "p" making sound (sound arcs). Colours follow the theme. */
export function LogoMark({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden className="shrink-0">
      <rect width="64" height="64" rx="16" fill="var(--mint)" />
      <text x="22" y="44" textAnchor="middle" fontFamily="Andika, Arial, sans-serif" fontWeight="700" fontSize="34" fill="var(--primary)">p</text>
      <path d="M38 24a10 10 0 0 1 0 16M44 19a17 17 0 0 1 0 26" fill="none" stroke="var(--accent)" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}

export function Logo({ compact }: { compact?: boolean }) {
  return (
    <Link href="/" className="flex items-center gap-2.5 rounded-xl font-semibold" aria-label="Phoneme Studio home">
      <LogoMark />
      {!compact && (
        <span className="text-[21px] tracking-tight">
          phoneme<span className="text-primary">studio</span>
        </span>
      )}
    </Link>
  );
}
