import Link from "next/link";
import { Play, Star } from "lucide-react";
import type { ActivitySummary } from "@/lib/types";
import { cn } from "@/lib/cn";

const TONES = ["bg-mint text-mint-ink", "bg-peach text-peach-ink", "bg-butter text-butter-ink", "bg-sky text-sky-ink", "bg-lilac text-lilac-ink"];

export function toneFor(title: string) {
  return TONES[[...title].reduce((n, c) => n + c.charCodeAt(0), 0) % TONES.length];
}

export function ActivityCard({ a, href, stars }: { a: ActivitySummary; href: string; stars?: number }) {
  return (
    <Link href={href} className="group flex flex-col overflow-hidden rounded-[28px] bg-surface ring-1 ring-line transition hover:-translate-y-1 hover:shadow-[0_10px_0_var(--shadow-ring)]">
      <div className={cn("relative grid h-36 place-items-center", toneFor(a.title))}>
        <span className="text-center">
          <span className="ipa block text-4xl">/{a.sounds.join(" ")}/</span>
          {a.first_word && <span className="mt-1 block text-sm opacity-80">{a.first_word}</span>}
        </span>
        <span className="absolute top-4 right-4 rounded-full bg-surface px-3 py-0.5 text-[13px] font-medium text-ink">{a.kind === "wordle" ? "Wordle" : "Word search"}</span>
        {a.is_featured && <span className="absolute top-4 left-4 rounded-full bg-surface px-3 py-0.5 text-[13px] font-medium text-ink">Featured</span>}
      </div>
      <div className="flex flex-1 items-end justify-between gap-3 p-5">
        <div>
          <h3 className="text-lg font-semibold">{a.title}</h3>
          <p className="text-[15px] text-ink-soft">
            {a.word_count} words{typeof a.plays === "number" && a.plays > 0 ? ` · played ${a.plays} times` : ""}
          </p>
          {!!stars && (
            <span className="mt-1 flex gap-0.5" aria-label={`${stars} stars earned`}>
              {[0, 1, 2].map((i) => (
                <Star key={i} className={cn("size-4", i < stars ? "fill-present text-present" : "text-line-strong")} />
              ))}
            </span>
          )}
        </div>
        <span className="grid size-11 shrink-0 place-items-center rounded-full bg-primary text-on-primary transition group-hover:scale-110" aria-hidden>
          <Play className="size-5 fill-current" />
        </span>
      </div>
    </Link>
  );
}
