"use client";
import type { CSSProperties, ComponentProps } from "react";
import { CLASS_COLOURS } from "@/lib/design-tokens";
import { getPhoneme, phonemeHint, SOUND_CLASSES, phonemesByClass } from "@/lib/phonemes";
import type { TileState } from "@/lib/games/wordle";
import { cn } from "@/lib/cn";

export function classStyle(symbol: string): CSSProperties {
  const ph = getPhoneme(symbol);
  const c = ph ? CLASS_COLOURS[ph.soundClass] : null;
  return c ? ({ "--tint": c.tint, "--key-ink": c.ink, "--tint-dark": c.tintDark, "--key-ink-dark": c.inkDark } as CSSProperties) : {};
}

const STATE_CLASS: Record<TileState, string> = {
  correct: "!bg-correct !text-white !shadow-none",
  present: "!bg-present !text-[#2b2410] !shadow-none",
  absent: "!bg-absent !text-ink-soft !shadow-none",
};

export function StateMark({ state }: { state?: TileState }) {
  if (!state || state === "absent") return null;
  return (
    <span aria-hidden className="cb-mark absolute top-1 right-1 size-3">
      {state === "correct" ? (
        <svg viewBox="0 0 12 12"><path d="M2 6l3 3 5-6" stroke="currentColor" strokeWidth="2" fill="none" /></svg>
      ) : (
        <svg viewBox="0 0 12 12"><circle cx="6" cy="6" r="4" stroke="currentColor" strokeWidth="2" fill="none" /></svg>
      )}
    </span>
  );
}

export function Keycap({
  symbol,
  state,
  size = "md",
  className,
  ...props
}: Omit<ComponentProps<"button">, "children"> & { symbol: string; state?: TileState; size?: "sm" | "md" | "lg" }) {
  const label = phonemeHint(symbol) + (state ? `, ${state === "correct" ? "correct" : state === "present" ? "in the word" : "not in the word"}` : "");
  return (
    <button
      type="button"
      data-keycap=""
      aria-label={label}
      title={phonemeHint(symbol)}
      className={cn(
        "keycap ipa relative grid place-items-center leading-none",
        size === "sm" && "h-10 min-w-10 px-1.5 text-lg",
        size === "md" && "h-12 min-w-12 px-2 text-xl",
        size === "lg" && "h-16 min-w-16 px-3 text-3xl",
        state && STATE_CLASS[state],
        className,
      )}
      style={classStyle(symbol)}
      {...props}
    >
      {symbol}
      <StateMark state={state} />
    </button>
  );
}

/** Display-only phoneme chips: /θ ɪ n/ */
export function PhonemeTiles({ phonemes, size = "sm", className }: { phonemes: string[]; size?: "xs" | "sm" | "md"; className?: string }) {
  return (
    <span role="img" aria-label={`/${phonemes.join(" ")}/`} className={cn("inline-flex flex-wrap gap-1", className)}>
      {phonemes.map((p, i) => (
        <span
          key={i}
          aria-hidden
          style={classStyle(p)}
          className={cn(
            "keycap ipa grid place-items-center leading-none !shadow-none",
            size === "xs" && "h-6 min-w-6 rounded-md px-1 text-[13px]",
            size === "sm" && "h-8 min-w-8 rounded-lg px-1.5 text-base",
            size === "md" && "h-11 min-w-11 px-2 text-xl",
          )}
        >
          {p}
        </span>
      ))}
    </span>
  );
}

/** All 44 sounds, grouped consonants / vowels, wrapping to fit. */
export function SoundKeyboard({
  onPress,
  states = {},
  only,
  size = "sm",
  disabled,
}: {
  onPress: (symbol: string) => void;
  states?: Record<string, TileState>;
  only?: string[];
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
}) {
  const allowed = only ? new Set(only) : null;
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {(["consonant", "vowel"] as const).map((family) => {
        const symbols = SOUND_CLASSES.filter((c) => c.family === family)
          .flatMap((c) => phonemesByClass(c.id))
          .filter((p) => !allowed || allowed.has(p.symbol));
        if (!symbols.length) return null;
        return (
          <div key={family} role="group" aria-label={family === "consonant" ? "Consonants" : "Vowels"}>
            <p className="mb-2 text-sm font-medium text-ink-soft">{family === "consonant" ? "Consonants" : "Vowels"}</p>
            <div className="flex flex-wrap gap-1.5">
              {symbols.map((p) => (
                <Keycap key={p.symbol} symbol={p.symbol} size={size} state={states[p.symbol]} disabled={disabled} onClick={() => onPress(p.symbol)} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
