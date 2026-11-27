"use client";
import { RotateCcw, Star } from "lucide-react";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui";
import { Buddy } from "./buddy";
import type { GameResult } from "./wordle-game";

export function FinishScreen({
  result,
  stars,
  onReplay,
  onRetryMissed,
  nickname,
  onNickname,
  extra,
}: {
  result: GameResult;
  stars: number;
  onReplay: () => void;
  onRetryMissed?: () => void;
  nickname?: { value: string; saved: boolean };
  onNickname?: (name: string) => void;
  extra?: React.ReactNode;
}) {
  const missed = result.perWord.filter((w) => !w.solved);
  return (
    <div className="mx-auto max-w-2xl animate-rise py-8 text-center">
      <Buddy mood={stars >= 2 ? "happy" : "calm"} size={130} className="mx-auto" />
      <h1 className="mt-4 text-4xl font-semibold">
        You solved {result.solved} of {result.total}!
      </h1>
      <div className="mt-4 flex justify-center gap-2" aria-label={`${stars} of 3 stars`}>
        {[0, 1, 2].map((i) => (
          <Star
            key={i}
            className={cn("size-12", i < stars ? "fill-present text-present" : "text-line-strong")}
            style={{ animation: i < stars ? `pop .45s cubic-bezier(.3,1.6,.5,1) ${0.2 + i * 0.15}s both` : undefined }}
          />
        ))}
      </div>
      <p className="mt-2 text-ink-soft">{stars === 3 ? "Every word. Three stars!" : "Solve every word for three stars."}</p>
      {result.perWord.length > 0 && (
        <ul className="mt-8 divide-y divide-line rounded-[28px] bg-surface px-6 text-left ring-1 ring-line">
          {result.perWord.map((w, i) => (
            <li key={i} className="flex items-center gap-3 py-3">
              <span className={cn("size-3 rounded-full", w.solved ? "bg-correct" : "bg-accent")} />
              <span className="font-medium">{w.english}</span>
              <span className="ml-auto text-ink-soft">{w.solved ? `${w.guesses} guess${w.guesses > 1 ? "es" : ""}` : "not solved"}</span>
            </li>
          ))}
        </ul>
      )}
      {nickname && onNickname && !nickname.saved && (
        <form
          className="mx-auto mt-6 flex max-w-md flex-wrap items-end justify-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            const v = new FormData(e.currentTarget).get("nick")?.toString().trim() ?? "";
            onNickname(v);
          }}
        >
          <label className="w-full text-left text-[15px] font-medium" htmlFor="nick">
            Want your teacher to see your score? Add a nickname (optional)
          </label>
          <input id="nick" name="nick" maxLength={24} defaultValue={nickname.value} pattern="[\w .'-]{1,24}" className="h-12 flex-1 rounded-2xl border-2 border-line bg-surface px-4" />
          <Button type="submit" variant="primary">
            Send score
          </Button>
          <Button onClick={() => onNickname("")}>Skip</Button>
        </form>
      )}
      {nickname?.saved && <p className="mt-6 text-ink-soft">Score sent. Nice work!</p>}
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        {onRetryMissed && missed.length > 0 && (
          <Button variant="primary" onClick={onRetryMissed}>
            Try the missed word{missed.length > 1 ? "s" : ""}
          </Button>
        )}
        <Button onClick={onReplay}>
          <RotateCcw className="size-4" /> Play again
        </Button>
        {extra}
      </div>
    </div>
  );
}
