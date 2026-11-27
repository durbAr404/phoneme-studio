"use client";
import { useCallback, useEffect, useState } from "react";
import { Copy, Delete, Flame } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import type { TileState } from "@/lib/games/wordle";
import { keyboardStates } from "@/lib/games/wordle";
import { workspace } from "@/lib/workspace";
import { sfx } from "@/lib/sound";
import { confetti } from "@/lib/confetti";
import { cn } from "@/lib/cn";
import { Button, ErrorNote, Spinner } from "@/components/ui";
import { classStyle, Keycap, PhonemeTiles, StateMark } from "@/components/phoneme/keys";
import { useToast } from "@/components/ui/toast";

type Info = { date: string; length: number; max_guesses: number; keys: string[] };
type Row = { phonemes: string[]; states: TileState[] };
const localDate = () => new Date().toLocaleDateString("en-CA");
const STORE = "phonemestudio:daily:v1";

export function DailyChallenge() {
  const toast = useToast();
  const ws = workspace.useStore();
  const [info, setInfo] = useState<Info | null>(null);
  const [error, setError] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [current, setCurrent] = useState<string[]>([]);
  const [answer, setAnswer] = useState<{ english: string; phonemes: string[] } | null>(null);
  const [shake, setShake] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api<Info>(`/daily?day=${localDate()}`)
      .then((i) => {
        setInfo(i);
        try {
          const saved = JSON.parse(localStorage.getItem(STORE) ?? "{}");
          if (saved.date === i.date) {
            setRows(saved.rows ?? []);
            setAnswer(saved.answer ?? null);
          }
        } catch {
          /* ignore */
        }
      })
      .catch((e) => setError(e instanceof ApiError ? e.message : "Couldn't load today's challenge."));
  }, []);

  const persist = (r: Row[], a: typeof answer) => info && localStorage.setItem(STORE, JSON.stringify({ date: info.date, rows: r, answer: a }));
  const done = !!answer;
  const won = done && rows.at(-1)?.states.every((s) => s === "correct");

  const finishDay = (didWin: boolean) => {
    if (!info) return;
    workspace.set((w) => {
      if (w.daily.history[info.date]) return w;
      const yesterday = new Date(Date.parse(info.date) - 86400000).toISOString().slice(0, 10);
      const streak = didWin ? (w.daily.last_win === yesterday ? w.daily.streak + 1 : 1) : 0;
      return { ...w, daily: { streak, best: Math.max(w.daily.best, streak), last_win: didWin ? info.date : w.daily.last_win, history: { ...w.daily.history, [info.date]: didWin ? "won" : "lost" } } };
    });
  };

  const check = useCallback(async () => {
    if (!info || done || busy) return;
    if (current.length < info.length) {
      setShake(true);
      sfx.error();
      setTimeout(() => setShake(false), 450);
      return;
    }
    setBusy(true);
    try {
      const r = await api<{ states: TileState[]; solved: boolean; answer: typeof answer }>("/daily/guess", { body: { date: info.date, guess: current, attempt: rows.length + 1 } });
      const next = [...rows, { phonemes: current, states: r.states }];
      setRows(next);
      setCurrent([]);
      setAnswer(r.answer);
      persist(next, r.answer);
      if (r.solved) {
        setTimeout(() => {
          sfx.win();
          confetti();
        }, info.length * 280);
        finishDay(true);
      } else if (r.answer) finishDay(false);
    } catch (e) {
      toast(e instanceof ApiError ? e.message : "Couldn't check that guess.");
    } finally {
      setBusy(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [info, current, rows, done, busy]);

  if (error) return <div className="mx-auto max-w-xl py-24"><ErrorNote>{error}</ErrorNote></div>;
  if (!info) return <Spinner label="Loading today's word" />;

  const keyStates = keyboardStates(rows);
  const shareText = () =>
    `Phoneme Studio daily ${info.date} ${won ? rows.length : "X"}/${info.max_guesses}\n` +
    rows.map((r) => r.states.map((s) => (s === "correct" ? "🟩" : s === "present" ? "🟨" : "⬜")).join("")).join("\n");

  return (
    <div className="mx-auto max-w-3xl py-10 text-center">
      <p className="text-ink-soft">Daily challenge · {new Date(info.date + "T12:00:00").toLocaleDateString("en-AU", { weekday: "long", day: "numeric", month: "long" })}</p>
      <h1 className="mt-2 text-4xl font-semibold">Today&apos;s word has {info.length} sounds</h1>
      <div className="mt-8 grid justify-center gap-2.5">
        {Array.from({ length: info.max_guesses }, (_, r) => {
          const row = rows[r];
          const isCur = r === rows.length && !done;
          return (
            <div key={r} className={cn("flex justify-center gap-2.5", isCur && shake && "animate-shake")}>
              {Array.from({ length: info.length }, (_, c) => {
                const sym = row ? row.phonemes[c] : isCur ? current[c] : undefined;
                const st = row?.states[c];
                return (
                  <div
                    key={c}
                    style={{ ...(sym && !st ? classStyle(sym) : {}), animation: st && r === rows.length - 1 ? `flip .5s ease ${c * 0.28}s both` : undefined }}
                    className={cn(
                      "ipa relative grid size-16 place-items-center rounded-[18px] border-2 text-3xl",
                      !sym && "border-line bg-surface",
                      sym && !st && "keycap animate-pop border-transparent",
                      st === "correct" && "border-correct bg-correct text-white",
                      st === "present" && "border-present bg-present text-[#2b2410]",
                      st === "absent" && "border-absent bg-absent text-ink-soft",
                    )}
                  >
                    {sym}
                    <StateMark state={st} />
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
      {!done ? (
        <div className="mt-8">
          <div className="flex flex-wrap justify-center gap-2">
            {info.keys.map((k) => (
              <Keycap key={k} symbol={k} state={keyStates[k]} onClick={() => current.length < info.length && (sfx.tap(), setCurrent([...current, k]))} />
            ))}
          </div>
          <div className="mt-4 flex justify-center gap-2">
            <Button onClick={() => setCurrent(current.slice(0, -1))}><Delete className="size-5" /> Delete</Button>
            <Button variant="accent" onClick={check} disabled={busy}>Check</Button>
          </div>
        </div>
      ) : (
        <div className="mx-auto mt-8 max-w-md animate-rise rounded-[28px] bg-mint p-7 text-mint-ink">
          <p className="text-xl font-semibold">{won ? `Solved in ${rows.length}!` : "Out of guesses"}</p>
          <p className="mt-3">Today&apos;s word was <b>{answer!.english}</b></p>
          <PhonemeTiles phonemes={answer!.phonemes} size="md" className="mt-2 justify-center" />
          <Button className="mt-5" onClick={async () => { try { await navigator.clipboard.writeText(shareText()); toast("Result copied"); } catch { toast("Couldn't copy"); } }}>
            <Copy className="size-4" /> Copy my result
          </Button>
          <p className="mt-4 text-sm">A new word arrives tomorrow.</p>
        </div>
      )}
      <div className="mt-12 flex justify-center gap-12">
        <div>
          <p className="flex items-center justify-center gap-1.5 text-3xl font-semibold"><Flame className="size-7 text-accent" /> {ws.daily.streak}</p>
          <p className="text-ink-soft">day streak</p>
        </div>
        <div>
          <p className="text-3xl font-semibold">{ws.daily.best}</p>
          <p className="text-ink-soft">best streak</p>
        </div>
        <div>
          <div className="flex justify-center gap-1.5 pt-2" aria-label="This week">
            {Array.from({ length: 7 }, (_, i) => {
              const d = new Date(Date.now() - (6 - i) * 86400000).toLocaleDateString("en-CA");
              const h = ws.daily.history[d];
              return <span key={d} title={d} className={cn("size-5 rounded-md", h === "won" ? "bg-correct" : h === "lost" ? "bg-accent" : "bg-line")} />;
            })}
          </div>
          <p className="mt-2 text-ink-soft">this week</p>
        </div>
      </div>
    </div>
  );
}
