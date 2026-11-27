"use client";
import { createStore } from "./store";

export type Prefs = {
  theme: "light" | "dark" | "system";
  text: "normal" | "large" | "xl";
  font: "default" | "easy";
  motion: "on" | "less" | "off";
  sound: boolean;
  volume: number;
  colorblind: boolean;
  default_guesses: number;
  default_grid: number;
  default_hints: boolean;
};

export const DEFAULT_PREFS: Prefs = {
  theme: "light",
  text: "normal",
  font: "default",
  motion: "on",
  sound: true,
  volume: 0.6,
  colorblind: false,
  default_guesses: 5,
  default_grid: 10,
  default_hints: true,
};

export const prefs = createStore<Prefs>("phonemestudio:prefs:v1", DEFAULT_PREFS);

export function resolvedTheme(theme: Prefs["theme"]): "light" | "dark" {
  if (theme !== "system") return theme;
  return typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

/** Apply preferences to <html>. Mirrors the inline script in the root layout that runs before paint. */
export function applyPrefs(p: Prefs) {
  const el = document.documentElement;
  el.classList.toggle("dark", resolvedTheme(p.theme) === "dark");
  el.dataset.text = p.text;
  el.dataset.font = p.font;
  el.dataset.motion = p.motion;
  el.dataset.colorblind = p.colorblind ? "on" : "off";
}

export const PREFS_SCRIPT = `try{var p=JSON.parse(localStorage.getItem("phonemestudio:prefs:v1")||"{}");var t=p.theme||"light";var d=t==="dark"||(t==="system"&&matchMedia("(prefers-color-scheme: dark)").matches);var e=document.documentElement;if(d)e.classList.add("dark");e.dataset.text=p.text||"normal";e.dataset.font=p.font||"default";e.dataset.motion=p.motion||"on";e.dataset.colorblind=p.colorblind?"on":"off"}catch(x){}`;
