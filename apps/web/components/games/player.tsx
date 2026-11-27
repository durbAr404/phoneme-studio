"use client";
import Link from "next/link";
import { useState } from "react";
import { Moon, Monitor, Sun, Volume2, VolumeX, X } from "lucide-react";
import type { ActivityData, Word } from "@/lib/types";
import { api } from "@/lib/api";
import { playerId, recordStars, workspace } from "@/lib/workspace";
import { prefs, resolvedTheme } from "@/lib/prefs";
import { Logo } from "@/components/site/logo";
import { WordleGame, type GameResult } from "./wordle-game";
import { WordSearchGame } from "./wordsearch-game";
import { FinishScreen } from "./finish";

type Source = { type: "share" | "activity" | "local"; id: string };

function shuffled<T>(items: T[]): T[] {
  return [...items].sort(() => Math.random() - 0.5);
}

/** Student play screen: only the game, a slim top bar, and the finish screen. */
export function Player({ activity, source }: { activity: ActivityData; source: Source }) {
  const p = prefs.useStore();
  const [round, setRound] = useState(0);
  const [words, setWords] = useState<Word[]>(() => (activity.settings.shuffle ? shuffled(activity.words) : activity.words));
  const [result, setResult] = useState<GameResult | null>(null);
  const [stars, setStars] = useState(0);
  const [sent, setSent] = useState(false);
  const ws = workspace.useStore();
  const dark = resolvedTheme(p.theme) === "dark";
  const starKey = `${source.type}:${source.id}`;

  const report = async (r: GameResult, nickname = "") => {
    if (source.type === "local") return;
    try {
      await api("/plays", {
        body: {
          [source.type === "share" ? "share_id" : "activity_id"]: source.id,
          player_id: playerId(),
          nickname,
          solved: r.solved,
          total: r.total,
          duration_ms: Math.round(r.durationMs),
          per_word: r.perWord,
        },
      });
    } catch {
      /* results are best-effort; the game still works offline */
    }
  };

  const onFinish = (r: GameResult) => {
    setResult(r);
    setStars(recordStars(starKey, r.solved, r.total));
    if (source.type === "activity") void report(r);
    if (source.type === "share" && ws.nickname) {
      void report(r, ws.nickname);
      setSent(true);
    }
  };

  const replay = (list = activity.words) => {
    if (result && source.type === "share" && !sent) void report(result); // count the play even without a nickname
    setResult(null);
    setSent(false);
    setWords(activity.settings.shuffle ? shuffled(list) : list);
    setRound((n) => n + 1);
  };

  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-[1240px] flex-wrap items-center gap-4 px-5 py-4 md:px-8">
        <Logo compact />
        <div className="min-w-0">
          <p className="text-sm text-ink-soft">{activity.kind === "wordle" ? "Phoneme Wordle" : "Word search"}</p>
          <h1 className="truncate text-xl font-semibold">{activity.title}</h1>
        </div>
        <div className="ml-auto flex items-center gap-1">
          <button type="button" aria-label={p.sound ? "Turn sound off" : "Turn sound on"} onClick={() => prefs.set({ sound: !p.sound })} className="grid size-11 place-items-center rounded-xl hover:bg-sunken">
            {p.sound ? <Volume2 className="size-5" /> : <VolumeX className="size-5" />}
          </button>
          <button type="button" aria-label={dark ? "Switch to light mode" : "Switch to dark mode"} onClick={() => prefs.set({ theme: dark ? "light" : "dark" })} className="grid size-11 place-items-center rounded-xl hover:bg-sunken">
            {dark ? <Sun className="size-5" /> : <Moon className="size-5" />}
          </button>
          {source.type !== "local" && (
            <Link href={`/classroom?${source.type}=${source.id}`} aria-label="Classroom mode" title="Classroom mode" className="grid size-11 place-items-center rounded-xl hover:bg-sunken">
              <Monitor className="size-5" />
            </Link>
          )}
          <Link href={source.type === "local" ? "/my-activities" : "/play"} className="inline-flex h-10 items-center gap-1.5 rounded-full bg-sunken px-4 font-semibold">
            <X className="size-4" /> Exit
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-[1240px] px-5 pb-16 md:px-8">
        {result ? (
          <FinishScreen
            result={result}
            stars={stars}
            onReplay={() => replay()}
            onRetryMissed={activity.kind === "wordle" ? () => replay(activity.words.filter((w) => result.perWord.some((r) => !r.solved && r.english === w.english))) : undefined}
            nickname={source.type === "share" ? { value: ws.nickname, saved: sent } : undefined}
            onNickname={async (name) => {
              workspace.set({ nickname: name });
              await report(result, name);
              setSent(true);
            }}
          />
        ) : activity.kind === "wordle" ? (
          <WordleGame
            key={round}
            words={words}
            maxGuesses={activity.settings.max_guesses}
            hints={activity.settings.hints}
            showSpelling={activity.settings.show_spelling}
            instructions={activity.instructions}
            onFinish={onFinish}
          />
        ) : (
          <WordSearchGame
            key={round}
            words={words}
            gridSize={activity.settings.grid_size}
            difficulty={activity.settings.difficulty}
            seed={activity.settings.seed + round}
            showSpelling={activity.settings.show_spelling}
            instructions={activity.instructions}
            onFinish={onFinish}
          />
        )}
      </main>
    </div>
  );
}
