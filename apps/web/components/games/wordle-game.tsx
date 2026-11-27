"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Delete, Lightbulb, Volume2 } from "lucide-react";
import { evaluateGuess, keyboardStates, type TileState } from "@/lib/games/wordle";
import { phonemeHint, isKnownPhoneme } from "@/lib/phonemes";
import type { Word } from "@/lib/types";
import { sfx, speak } from "@/lib/sound";
import { confetti } from "@/lib/confetti";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui";
import { classStyle, PhonemeTiles, SoundKeyboard, StateMark } from "@/components/phoneme/keys";
import { Buddy, type Mood } from "./buddy";

export type WordResult = { english: string; solved: boolean; guesses: number };
export type GameResult = { solved: number; total: number; durationMs: number; perWord: WordResult[] };

type Guess = { phonemes: string[]; states: TileState[] };

export function WordleGame({
  words,
  maxGuesses = 5,
  hints = true,
  showSpelling = true,
  instructions,
  onFinish,
  onProgress,
  big,
}: {
  words: Word[];
  maxGuesses?: number;
  hints?: boolean;
  showSpelling?: boolean;
  instructions?: string;
  onFinish?: (r: GameResult) => void;
  onProgress?: (index: number, results: WordResult[]) => void;
  big?: boolean;
}) {
  const [index, setIndex] = useState(0);
  const [guesses, setGuesses] = useState<Guess[]>([]);
  const [current, setCurrent] = useState<string[]>([]);
  const [status, setStatus] = useState<"playing" | "won" | "lost">("playing");
  const [results, setResults] = useState<WordResult[]>([]);
  const [revealRow, setRevealRow] = useState(-1);
  const [shake, setShake] = useState(false);
  const [mood, setMood] = useState<Mood>("calm");
  const [say, setSay] = useState("Tap the sounds you hear, then press Check.");
  const [hint, setHint] = useState(false);
  const started = useRef(Date.now());
  const key = JSON.stringify(words) + maxGuesses;

  useEffect(() => {
    setIndex(0);
    setGuesses([]);
    setCurrent([]);
    setStatus("playing");
    setResults([]);
    setMood("calm");
    setHint(false);
    started.current = Date.now();
  }, [key]);

  const word = words[index];
  const target = useMemo(() => word?.phonemes ?? [], [word]);

  const add = useCallback(
    (sym: string) => {
      if (status !== "playing" || current.length >= target.length) return;
      sfx.tap();
      setCurrent((c) => [...c, sym]);
    },
    [status, current.length, target.length],
  );
  const remove = useCallback(() => status === "playing" && setCurrent((c) => c.slice(0, -1)), [status]);

  const check = useCallback(() => {
    if (status !== "playing") return;
    if (current.length < target.length) {
      const missing = target.length - current.length;
      setShake(true);
      sfx.error();
      setTimeout(() => setShake(false), 450);
      setMood("wow");
      setSay(`Add ${missing} more sound${missing > 1 ? "s" : ""}. This word has ${target.length}.`);
      return;
    }
    const states = evaluateGuess(current, target);
    const next = [...guesses, { phonemes: current, states }];
    setGuesses(next);
    setRevealRow(next.length - 1);
    setCurrent([]);
    target.forEach((_, i) => setTimeout(sfx.flip, i * 280));
    const won = states.every((s) => s === "correct");
    const lost = !won && next.length >= maxGuesses;
    setTimeout(() => {
      if (won) {
        setStatus("won");
        setMood("happy");
        setSay(next.length === 1 ? "First try! Brilliant listening." : "You got it!");
        sfx.win();
        confetti();
        setResults((r) => [...r, { english: word.english, solved: true, guesses: next.length }]);
      } else if (lost) {
        setStatus("lost");
        setMood("sad");
        setSay(`So close. It was ${word.english}.`);
        setResults((r) => [...r, { english: word.english, solved: false, guesses: next.length }]);
      } else {
        const right = states.filter((s) => s === "correct").length;
        setMood(right ? "happy" : "calm");
        setSay(right ? `Nice, ${right} in the right place.` : "Keep going. Try different sounds.");
      }
    }, target.length * 280 + 260);
  }, [status, current, target, guesses, maxGuesses, word]);

  const nextWord = useCallback(() => {
    if (index + 1 >= words.length) {
      const final = results;
      onFinish?.({ solved: final.filter((r) => r.solved).length, total: words.length, durationMs: Date.now() - started.current, perWord: final });
      return;
    }
    onProgress?.(index + 1, results);
    setIndex(index + 1);
    setGuesses([]);
    setCurrent([]);
    setStatus("playing");
    setRevealRow(-1);
    setHint(false);
    setMood("calm");
    setSay("New word. Listen carefully.");
  }, [index, words.length, results, onFinish, onProgress]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target as HTMLElement;
      if (t.closest("input, textarea, select, dialog[open] input")) return;
      if (e.key === "Backspace") {
        e.preventDefault();
        remove();
      } else if (e.key === "Enter") {
        if (t.tagName === "BUTTON" && !t.hasAttribute("data-keycap")) return;
        e.preventDefault();
        if (status === "playing") check();
        else nextWord();
      } else if (e.key.length === 1) {
        const sym = ({ r: "ɹ", y: "j" } as Record<string, string>)[e.key.toLowerCase()] ?? e.key.toLowerCase();
        if (sym.length === 1 && isKnownPhoneme(sym)) add(sym);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [add, remove, check, nextWord, status]);

  const keyStates = useMemo(() => keyboardStates(guesses), [guesses]);
  if (!word) return null;
  const tile = big ? "size-24 text-5xl rounded-[26px]" : "size-16 text-3xl rounded-[18px] sm:size-[72px]";

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
      <div className="rounded-[28px] bg-surface p-5 ring-1 ring-line sm:p-8">
        <div className="mb-5 flex items-center justify-between gap-3">
          <p className="text-ink-soft">
            Word {index + 1} of {words.length} · {target.length} sounds
          </p>
          <div className="flex gap-1.5" aria-label={`${results.filter((r) => r.solved).length} solved`}>
            {words.map((_, i) => (
              <span key={i} className={cn("h-2.5 w-6 rounded-full", i < results.length ? (results[i].solved ? "bg-correct" : "bg-accent") : i === index ? "bg-primary" : "bg-line")} />
            ))}
          </div>
        </div>
        {instructions && <p className="mb-4 text-center text-ink-soft">{instructions}</p>}
        <div className="grid justify-center gap-2.5" role="grid" aria-label="Guesses">
          {Array.from({ length: maxGuesses }, (_, r) => {
            const g = guesses[r];
            const isCurrent = r === guesses.length && status === "playing";
            const won = status === "won" && r === guesses.length - 1;
            return (
              <div key={`${index}-${r}`} role="row" className={cn("flex gap-2.5", isCurrent && shake && "animate-shake")}>
                {target.map((_, c) => {
                  const sym = g ? g.phonemes[c] : isCurrent ? current[c] : undefined;
                  const state = g?.states[c];
                  const revealing = r === revealRow;
                  return (
                    <div
                      key={c}
                      role="gridcell"
                      aria-label={sym ? `${sym}${state ? `, ${state}` : ""}` : "empty"}
                      style={{
                        ...(sym && !state ? classStyle(sym) : {}),
                        animation: revealing && state ? `flip .5s ease ${c * 0.28}s both` : won ? `hop .5s ease ${0.9 + c * 0.1}s` : undefined,
                        transitionDelay: revealing ? `${c * 0.28 + 0.25}s` : undefined,
                      }}
                      className={cn(
                        "ipa relative grid place-items-center border-2 transition-colors duration-0",
                        tile,
                        !sym && "border-line bg-surface",
                        sym && !state && "keycap border-transparent",
                        sym && !state && isCurrent && "animate-pop",
                        state === "correct" && "border-correct bg-correct text-white",
                        state === "present" && "border-present bg-present text-[#2b2410]",
                        state === "absent" && "border-absent bg-absent text-ink-soft",
                      )}
                    >
                      {sym}
                      <StateMark state={state} />
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
        <div className="mt-6">
          {status === "playing" ? (
            <>
              <SoundKeyboard onPress={add} states={keyStates} size={big ? "lg" : "sm"} />
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                <Button onClick={remove} aria-label="Delete last sound">
                  <Delete className="size-5" /> Delete
                </Button>
                <Button variant="accent" onClick={check}>
                  Check
                </Button>
              </div>
            </>
          ) : (
            <div className="animate-rise rounded-3xl bg-mint p-6 text-center text-mint-ink">
              <p className="text-sm font-medium">The word was</p>
              <p className="mt-1 text-4xl font-semibold">{showSpelling ? word.english : "…"}</p>
              <PhonemeTiles phonemes={word.phonemes} size="md" className="mt-3 justify-center" />
              <div className="mt-5 flex justify-center">
                <Button variant="primary" onClick={nextWord} autoFocus>
                  {index + 1 >= words.length ? "See my results" : "Next word"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
      <aside className="grid content-start gap-4">
        <div className="flex items-center gap-4 rounded-[28px] bg-surface p-5 ring-1 ring-line">
          <Buddy mood={mood} size={96} />
          <p className="text-lg font-medium" aria-live="polite">
            {say}
          </p>
        </div>
        {hints && status === "playing" && (
          <div className="rounded-[28px] bg-surface p-5 ring-1 ring-line">
            <div className="flex flex-wrap gap-2">
              <Button size="sm" onClick={() => speak(word.english) || setSay("Your browser can't read words aloud.")}>
                <Volume2 className="size-4" /> Hear the word
              </Button>
              <Button size="sm" onClick={() => setHint(true)} disabled={hint}>
                <Lightbulb className="size-4" /> First sound
              </Button>
            </div>
            {hint && <p className="mt-3 animate-rise rounded-2xl bg-butter px-4 py-3 text-butter-ink">It starts with <span className="ipa">{phonemeHint(target[0])}</span></p>}
          </div>
        )}
      </aside>
    </div>
  );
}
