import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { LinkButton } from "@/components/ui";
import { SoundWave } from "@/components/home/sound-wave";
import { ContinueLink } from "@/components/home/continue-link";

const ENTRIES = [
  { href: "/create/wordle", sym: "θ", tone: "bg-mint text-mint-ink", title: "Wordle", body: "Guess a word one sound at a time.", cta: "Build one" },
  { href: "/create/word-search", sym: "ʃ", tone: "bg-peach text-peach-ink", title: "Word search", body: "Find words hidden as sounds.", cta: "Build one" },
  { href: "/daily", sym: "ŋ", tone: "bg-butter text-butter-ink", title: "Daily challenge", body: "One new sound word every day.", cta: "Play today's" },
];

export default function Home() {
  return (
    <>
      <section className="pt-20 pb-12 text-center sm:pt-24">
        <h1 className="mx-auto max-w-4xl animate-rise text-5xl font-semibold tracking-tight text-balance sm:text-7xl">Sound games that feel like play.</h1>
        <p className="mx-auto mt-6 max-w-xl animate-rise text-xl text-ink-soft [animation-delay:.1s]">
          Make phoneme Wordle and word search games for Australian English in about a minute.
        </p>
        <div className="mt-9 flex animate-rise flex-wrap justify-center gap-3 [animation-delay:.2s]">
          <LinkButton href="/create/wordle" variant="primary" size="lg">
            Create a game
          </LinkButton>
          <LinkButton href="/play" size="lg">
            Play now
          </LinkButton>
        </div>
        <ContinueLink />
      </section>
      <div className="mx-auto max-w-3xl">
        <SoundWave />
      </div>
      <section className="mt-24 grid gap-5 md:grid-cols-3" aria-label="Ways to start">
        {ENTRIES.map((e, i) => (
          <Link
            key={e.href}
            href={e.href}
            className="group flex animate-rise flex-col gap-5 rounded-[28px] bg-surface p-7 ring-1 ring-line transition hover:-translate-y-1 hover:shadow-[0_10px_0_var(--shadow-ring)]"
            style={{ animationDelay: `${0.3 + i * 0.08}s` }}
          >
            <span className={`ipa grid size-14 place-items-center rounded-2xl text-2xl ${e.tone}`}>{e.sym}</span>
            <span>
              <span className="block text-xl font-semibold">{e.title}</span>
              <span className="text-ink-soft">{e.body}</span>
            </span>
            <span className="mt-auto inline-flex items-center gap-1.5 font-medium">
              <span className="decoration-primary decoration-2 underline-offset-4 group-hover:underline group-focus-visible:underline">{e.cta}</span> <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
            </span>
          </Link>
        ))}
      </section>
    </>
  );
}
