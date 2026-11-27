"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Volume2 } from "lucide-react";
import { api } from "@/lib/api";
import { getPhoneme, getSoundClass, PHONEMES, SOUND_CLASSES, normaliseSymbol } from "@/lib/phonemes";
import { speak } from "@/lib/sound";
import { cn } from "@/lib/cn";
import { Button, buttonClass } from "@/components/ui";
import { classStyle } from "@/components/phoneme/keys";

const HOW: Record<string, string> = {
  plosive: "Close your lips or tongue to stop the air, then let it burst out.",
  affricate: "Start with a stop, then let the air slide out with friction.",
  fricative: "Squeeze the air through a narrow gap so you hear a hiss or buzz.",
  nasal: "Keep your mouth closed at one point and let the air out through your nose.",
  approximant: "Bring your tongue or lips close together, but not close enough to hiss.",
  "short-vowel": "An open, quick vowel sound.",
  "long-vowel": "Hold the vowel a little longer. The ː mark means long.",
  diphthong: "Glide from one vowel shape to another in one sound.",
};
const PAIRS: Record<string, string> = { p: "b", b: "p", t: "d", d: "t", k: "g", g: "k", f: "v", v: "f", θ: "ð", ð: "θ", s: "z", z: "s", ʃ: "ʒ", ʒ: "ʃ", tʃ: "dʒ", dʒ: "tʃ" };
const VOICED = new Set(["b", "d", "g", "v", "ð", "z", "ʒ", "dʒ", "m", "n", "ŋ", "l", "ɹ", "w", "j"]);

export function SoundGuide() {
  const params = useSearchParams();
  const [selected, setSelected] = useState(() => normaliseSymbol(params.get("s") ?? "θ"));
  const [examples, setExamples] = useState<string[]>([]);
  const ph = getPhoneme(selected) ?? PHONEMES[10];
  const cls = getSoundClass(ph.soundClass);

  useEffect(() => {
    api<{ items: { english: string }[] }>(`/words?sound=${encodeURIComponent(ph.symbol)}&limit=8`)
      .then((r) => setExamples(r.items.map((w) => w.english)))
      .catch(() => setExamples([]));
  }, [ph.symbol]);

  return (
    <div className="grid items-start gap-8 lg:grid-cols-[1.6fr_1fr]">
      <div className="space-y-8">
        {(["consonant", "vowel"] as const).map((family) => (
          <section key={family}>
            <h2 className="mb-4 text-xl font-semibold">{family === "consonant" ? "Consonants" : "Vowels"}</h2>
            <div className="space-y-4">
              {SOUND_CLASSES.filter((c) => c.family === family).map((c) => (
                <div key={c.id}>
                  <p className="mb-2 text-[15px] text-ink-soft">{c.label}</p>
                  <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 xl:grid-cols-8">
                    {PHONEMES.filter((p) => p.soundClass === c.id).map((p) => (
                      <button
                        key={p.symbol}
                        type="button"
                        aria-pressed={p.symbol === ph.symbol}
                        onClick={() => { setSelected(p.symbol); speak(p.example); }}
                        style={classStyle(p.symbol)}
                        className={cn("keycap grid gap-0.5 py-3 text-center", p.symbol === ph.symbol && "outline-3 outline-offset-2 outline-ink")}
                      >
                        <span className="ipa text-2xl leading-none">{p.symbol}</span>
                        <span className="text-[13px]">{p.example}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
      <aside className="rounded-[28px] bg-surface p-7 ring-1 ring-line lg:sticky lg:top-28" aria-live="polite">
        <div className="flex items-start justify-between">
          <span className="ipa text-8xl leading-none" style={{ color: "var(--key-ink)", ...classStyle(ph.symbol) }}>{ph.symbol}</span>
          <Button variant="accent" size="sm" onClick={() => speak(ph.example)}><Volume2 className="size-4" /> Listen</Button>
        </div>
        <h2 className="mt-4 text-2xl font-semibold">/{ph.symbol}/ as in {ph.example}</h2>
        <p className="mt-1 text-ink-soft">{cls.label.replace(/s$/, "")} · {cls.family === "consonant" ? (VOICED.has(ph.symbol) ? "voiced" : "voiceless") : "vowel"} · often spelt &ldquo;{ph.spelling}&rdquo;</p>
        <p className="mt-4">{HOW[ph.soundClass]}</p>
        {PAIRS[ph.symbol] && (
          <p className="mt-3 text-ink-soft">
            Its partner is{" "}
            <button type="button" className="ipa font-bold text-ink underline decoration-primary underline-offset-4" onClick={() => setSelected(PAIRS[ph.symbol])}>
              /{PAIRS[ph.symbol]}/
            </button>
            , made the same way {VOICED.has(ph.symbol) ? "without" : "with"} voice.
          </p>
        )}
        {examples.length > 0 && (
          <div className="mt-5 flex flex-wrap gap-2">
            {examples.map((w) => <button key={w} type="button" onClick={() => speak(w)} className="h-9 rounded-full bg-sunken px-3.5 text-[15px] hover:bg-mint">{w}</button>)}
          </div>
        )}
        {examples.length > 0 && (
          <Link href={`/create/wordle?words=${encodeURIComponent(examples.join(","))}`} className={buttonClass("primary", "md", "mt-6 w-full")}>
            Make a game with /{ph.symbol}/
          </Link>
        )}
      </aside>
    </div>
  );
}
