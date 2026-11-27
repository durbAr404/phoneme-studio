/**
 * Phoneme Wordle engine. Pure functions over arrays of phoneme symbols:
 * a guess is string[] (never a joined string), so "tʃ" stays one unit.
 */

export type TileState = "correct" | "present" | "absent";

/**
 * Score a guess against the target using standard Wordle rules, including
 * repeated phonemes: exact matches are claimed first, then remaining target
 * phonemes are matched left to right.
 */
export function evaluateGuess(guess: readonly string[], target: readonly string[]): TileState[] {
  if (guess.length !== target.length) {
    throw new Error(`Guess has ${guess.length} phonemes but the word has ${target.length}`);
  }
  const result: TileState[] = new Array(guess.length).fill("absent");
  const remaining = new Map<string, number>();

  guess.forEach((ph, i) => {
    if (ph === target[i]) result[i] = "correct";
    else remaining.set(target[i], (remaining.get(target[i]) ?? 0) + 1);
  });

  guess.forEach((ph, i) => {
    if (result[i] === "correct") return;
    const left = remaining.get(ph) ?? 0;
    if (left > 0) {
      result[i] = "present";
      remaining.set(ph, left - 1);
    }
  });

  return result;
}

const RANK: Record<TileState, number> = { absent: 0, present: 1, correct: 2 };

/** Best-known state per phoneme across all scored guesses, for colouring the keyboard. */
export function keyboardStates(
  guesses: readonly { phonemes: string[]; states: TileState[] }[],
): Record<string, TileState> {
  const out: Record<string, TileState> = {};
  for (const g of guesses) {
    g.phonemes.forEach((ph, i) => {
      const next = g.states[i];
      const prev = out[ph];
      if (!prev || RANK[next] > RANK[prev]) out[ph] = next;
    });
  }
  return out;
}

export type WordleRound = {
  target: string[];
  guesses: { phonemes: string[]; states: TileState[] }[];
  current: string[];
  status: "playing" | "won" | "lost";
};

export function newRound(target: string[]): WordleRound {
  return { target, guesses: [], current: [], status: "playing" };
}

export type WordleAction =
  | { type: "add"; phoneme: string }
  | { type: "remove" }
  | { type: "submit" };

/** Reducer for one round. Returns the same object when an action is a no-op. */
export function reduceRound(round: WordleRound, action: WordleAction, maxAttempts: number): WordleRound {
  if (round.status !== "playing") return round;
  switch (action.type) {
    case "add":
      if (round.current.length >= round.target.length) return round;
      return { ...round, current: [...round.current, action.phoneme] };
    case "remove":
      if (round.current.length === 0) return round;
      return { ...round, current: round.current.slice(0, -1) };
    case "submit": {
      if (round.current.length !== round.target.length) return round;
      const states = evaluateGuess(round.current, round.target);
      const guesses = [...round.guesses, { phonemes: round.current, states }];
      const won = states.every((s) => s === "correct");
      const status = won ? "won" : guesses.length >= maxAttempts ? "lost" : "playing";
      return { ...round, guesses, current: [], status };
    }
  }
}
