"use client";
import type { ActivityData, Word } from "./types";
import { createStore } from "./store";

export type LocalActivity = ActivityData & { id: string; updated_at: string; remote_id?: string };
export type DailyState = { streak: number; best: number; last_win: string | null; history: Record<string, "won" | "lost"> };

export type Workspace = {
  activities: LocalActivity[];
  custom_words: Word[];
  stars: Record<string, number>;
  daily: DailyState;
  player_id: string;
  nickname: string;
  save: { code: string; token: string } | null;
  last_backup: string | null;
  imported: boolean;
};

const EMPTY: Workspace = {
  activities: [],
  custom_words: [],
  stars: {},
  daily: { streak: 0, best: 0, last_win: null, history: {} },
  player_id: "",
  nickname: "",
  save: null,
  last_backup: null,
  imported: false,
};

export const workspace = createStore<Workspace>("phonemestudio:workspace:v1", EMPTY);

export function newId(prefix = "local"): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36).slice(-4)}`;
}

export function playerId(): string {
  const ws = workspace.get();
  if (ws.player_id) return ws.player_id;
  const id = newId("p").replace(/[^A-Za-z0-9_-]/g, "");
  workspace.set({ player_id: id });
  return id;
}

export function saveActivity(activity: LocalActivity): void {
  workspace.set((ws) => {
    const others = ws.activities.filter((a) => a.id !== activity.id);
    return { ...ws, activities: [{ ...activity, updated_at: new Date().toISOString() }, ...others] };
  });
}

export function deleteActivity(id: string): void {
  workspace.set((ws) => ({ ...ws, activities: ws.activities.filter((a) => a.id !== id) }));
}

export function recordStars(key: string, solved: number, total: number): number {
  const ratio = total ? solved / total : 0;
  const stars = ratio === 1 ? 3 : ratio >= 0.7 ? 2 : solved > 0 ? 1 : 0;
  workspace.set((ws) => ({ ...ws, stars: { ...ws.stars, [key]: Math.max(ws.stars[key] ?? 0, stars) } }));
  return stars;
}

/** Portable data for backups and save codes (no preferences, no tokens). */
export function exportData() {
  const { activities, custom_words, stars, daily, nickname } = workspace.get();
  return { version: 1, activities, custom_words, stars, daily, nickname };
}

export function importData(data: unknown): number {
  if (!data || typeof data !== "object") throw new Error("That file isn't a Phoneme Studio backup.");
  const d = data as Partial<Workspace> & { version?: number };
  if (!Array.isArray(d.activities)) throw new Error("That file isn't a Phoneme Studio backup.");
  const valid = d.activities.filter(
    (a) => a && typeof a.title === "string" && (a.kind === "wordle" || a.kind === "wordsearch") && Array.isArray(a.words),
  );
  workspace.set((ws) => {
    const ids = new Set(ws.activities.map((a) => a.id));
    return {
      ...ws,
      activities: [...ws.activities, ...valid.filter((a) => !ids.has(a.id))],
      custom_words: [...ws.custom_words, ...(Array.isArray(d.custom_words) ? d.custom_words : [])].slice(0, 500),
      stars: { ...ws.stars, ...(d.stars ?? {}) },
      daily: d.daily && typeof d.daily === "object" ? { ...ws.daily, ...d.daily } : ws.daily,
    };
  });
  return valid.length;
}
