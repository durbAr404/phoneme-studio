"use client";
/** Small sound effects (Web Audio, no files) and word read-aloud (browser speech, Australian voice if available). */
import { prefs } from "./prefs";

let ctx: AudioContext | null = null;

function tone(freq: number, duration: number, type: OscillatorType = "sine", delay = 0) {
  const p = prefs.get();
  if (!p.sound || typeof window === "undefined") return;
  try {
    ctx ??= new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    const start = ctx.currentTime + delay;
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(0.12 * p.volume, start + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    osc.connect(gain).connect(ctx.destination);
    osc.start(start);
    osc.stop(start + duration + 0.02);
  } catch {
    /* audio blocked */
  }
}

export const sfx = {
  tap: () => tone(520, 0.06, "triangle"),
  flip: () => tone(380, 0.05, "sine"),
  error: () => tone(160, 0.18, "sawtooth"),
  win: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.18, "triangle", i * 0.09)),
  found: () => [660, 880].forEach((f, i) => tone(f, 0.12, "triangle", i * 0.07)),
};

export function speak(text: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return false;
  const u = new SpeechSynthesisUtterance(text);
  const voices = window.speechSynthesis.getVoices();
  u.voice = voices.find((v) => v.lang === "en-AU") ?? voices.find((v) => v.lang.startsWith("en")) ?? null;
  u.lang = u.voice?.lang ?? "en-AU";
  u.rate = 0.85;
  u.volume = prefs.get().volume;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(u);
  return true;
}
