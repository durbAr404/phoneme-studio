/**
 * Colour tokens shared by the app and the standalone offline HTML exports.
 * Palette: Mint garden (light) and a mint-tuned charcoal (dark).
 * Consonants are cool blues, vowels are warm peach, butter and lilac, so the two
 * families read at a glance. Wordle feedback colours stay separate from both.
 */
import type { SoundClass } from "./phonemes";

export const CLASS_COLOURS: Record<SoundClass, { base: string; ink: string; tint: string; tintDark: string; inkDark: string }> = {
  plosive: { base: "#3b74b8", ink: "#1e4a80", tint: "#e1edfb", tintDark: "#1f2a3a", inkDark: "#cfe0f7" },
  affricate: { base: "#4e68b8", ink: "#2c4183", tint: "#e5e9fb", tintDark: "#222739", inkDark: "#d4dbf7" },
  fricative: { base: "#2f86a8", ink: "#185a75", tint: "#ddf0f7", tintDark: "#1d2d33", inkDark: "#c9e9f3" },
  nasal: { base: "#6a62c4", ink: "#433b8f", tint: "#ebe8fb", tintDark: "#26243a", inkDark: "#dcd8fa" },
  approximant: { base: "#3d8a9a", ink: "#1f5d69", tint: "#ddf1f3", tintDark: "#1d2e31", inkDark: "#c8ebef" },
  "short-vowel": { base: "#e0784f", ink: "#8a3d1e", tint: "#ffe3d9", tintDark: "#342a22", inkDark: "#f6d9c4" },
  "long-vowel": { base: "#c99a12", ink: "#5b4a00", tint: "#fff3c4", tintDark: "#2f2d24", inkDark: "#f1e6b5" },
  diphthong: { base: "#b05f9e", ink: "#6f2c62", tint: "#f8e4f3", tintDark: "#33242f", inkDark: "#f1d3ea" },
};

export const FEEDBACK = {
  correct: "#2e8b6a",
  present: "#f4b740",
  absent: "#9fb1aa",
};

export const BRAND = {
  paper: "#f4fbf7",
  surface: "#ffffff",
  ink: "#17352e",
  inkSoft: "#4d6a62",
  line: "#dcebe4",
  sun: "#f4b740",
  consonant: "#3b74b8",
  vowel: "#e0784f",
  primary: "#1f7a5c",
  coral: "#ff8a7a",
};
