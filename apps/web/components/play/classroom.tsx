"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Clock, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { Button, ErrorNote, Spinner } from "@/components/ui";
import { Logo } from "@/components/site/logo";
import { WordleGame, type WordResult } from "@/components/games/wordle-game";
import { WordSearchGame } from "@/components/games/wordsearch-game";
import { sourceFromParams, useActivity } from "./use-activity";

const TEAMS = [
  { name: "Team Koala", tone: "bg-mint text-mint-ink" },
  { name: "Team Wombat", tone: "bg-peach text-peach-ink" },
];

/** Big-screen mode: two teams take turns, one word each, with a turn timer. */
export function Classroom() {
  const params = useSearchParams();
  const src = useMemo(() => sourceFromParams(params), [params]);
  const { data, error } = useActivity(src);
  const [results, setResults] = useState<WordResult[]>([]);
  const [index, setIndex] = useState(0);
  const [seconds, setSeconds] = useState(60);
  const [done, setDone] = useState(false);

  useEffect(() => {
    setSeconds(60);
    const t = setInterval(() => setSeconds((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [index]);

  if (error) return <div className="mx-auto max-w-xl px-5 py-24"><ErrorNote>{error}</ErrorNote></div>;
  if (!data) return <Spinner />;
  const score = TEAMS.map((_, t) => results.filter((r, i) => i % 2 === t && r.solved).length);
  const turn = index % 2;

  return (
    <div className="flex min-h-screen flex-col px-6 py-5 md:px-10">
      <header className="flex items-center gap-4">
        <Logo compact />
        <h1 className="text-2xl font-semibold">{data.title}</h1>
        <span className="text-ink-soft">Word {Math.min(index + 1, data.words.length)} of {data.words.length}</span>
        <span className={cn("ml-auto inline-flex items-center gap-2 text-2xl tabular-nums", seconds <= 10 && "text-accent-ink")} aria-label={`${seconds} seconds left`}>
          <Clock className="size-6" /> 0:{String(seconds).padStart(2, "0")}
        </span>
        <Link href="/play" className="inline-flex h-11 items-center gap-1.5 rounded-full bg-sunken px-4 font-semibold"><X className="size-4" /> Exit</Link>
      </header>
      {data.kind === "wordle" && (
        <div className="my-6 grid grid-cols-2 gap-6">
          {TEAMS.map((t, i) => (
            <div key={t.name} className={cn("rounded-[28px] p-5 text-center transition", t.tone, turn === i && !done && "ring-4 ring-ink ring-offset-4 ring-offset-paper")}>
              <p className="text-xl">{t.name}</p>
              <p className="text-7xl font-semibold leading-none">{score[i]}</p>
              {turn === i && !done && <p className="mt-1 font-medium">Your turn</p>}
            </div>
          ))}
        </div>
      )}
      <div className="flex-1">
        {done ? (
          <div className="py-16 text-center">
            <h2 className="text-5xl font-semibold">{score[0] === score[1] ? "It's a tie!" : `${TEAMS[score[0] > score[1] ? 0 : 1].name} wins!`}</h2>
            <Button variant="primary" size="lg" className="mt-8" onClick={() => { setResults([]); setIndex(0); setDone(false); }}>Play again</Button>
          </div>
        ) : data.kind === "wordle" ? (
          <WordleGame
            big
            words={data.words}
            maxGuesses={data.settings.max_guesses}
            hints={data.settings.hints}
            showSpelling={data.settings.show_spelling}
            onProgress={(i, r) => { setResults(r); setIndex(i); }}
            onFinish={(r) => { setResults(r.perWord); setDone(true); }}
          />
        ) : (
          <WordSearchGame big words={data.words} gridSize={data.settings.grid_size} difficulty={data.settings.difficulty} seed={data.settings.seed} showSpelling={data.settings.show_spelling} />
        )}
      </div>
    </div>
  );
}
