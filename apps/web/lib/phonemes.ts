/**
 * Australian English phoneme inventory using HCE symbols
 * (Harrington, Cox & Evans, 1997; Cox, 2012).
 *
 * Colour families follow the Montessori moveable alphabet convention:
 * consonants are blue-family, vowels are red-family.
 */

export type SoundClass =
  | "plosive"
  | "affricate"
  | "fricative"
  | "nasal"
  | "approximant"
  | "short-vowel"
  | "long-vowel"
  | "diphthong";

export type Phoneme = {
  symbol: string;
  /** Keyword showing the sound, e.g. "thin" */
  example: string;
  /** Spelling cue a non-specialist can read, e.g. "th" */
  spelling: string;
  soundClass: SoundClass;
};

export type SoundClassInfo = {
  id: SoundClass;
  label: string;
  family: "consonant" | "vowel";
  description: string;
};

export const SOUND_CLASSES: SoundClassInfo[] = [
  { id: "plosive", label: "Plosives", family: "consonant", description: "Air is stopped completely, then released." },
  { id: "affricate", label: "Affricates", family: "consonant", description: "A stop released into a fricative." },
  { id: "fricative", label: "Fricatives", family: "consonant", description: "Air is forced through a narrow gap." },
  { id: "nasal", label: "Nasals", family: "consonant", description: "Air flows out through the nose." },
  { id: "approximant", label: "Approximants", family: "consonant", description: "Articulators come close without friction." },
  { id: "short-vowel", label: "Short vowels", family: "vowel", description: "Brief monophthongs, plus schwa." },
  { id: "long-vowel", label: "Long vowels", family: "vowel", description: "Monophthongs held longer, marked with ː." },
  { id: "diphthong", label: "Diphthongs", family: "vowel", description: "Vowels that glide from one quality to another." },
];

const p = (symbol: string, spelling: string, example: string, soundClass: SoundClass): Phoneme => ({
  symbol,
  spelling,
  example,
  soundClass,
});

export const PHONEMES: Phoneme[] = [
  // Plosives
  p("p", "p", "pin", "plosive"),
  p("b", "b", "bin", "plosive"),
  p("t", "t", "tin", "plosive"),
  p("d", "d", "din", "plosive"),
  p("k", "k", "kin", "plosive"),
  p("g", "g", "gun", "plosive"),
  // Affricates
  p("tʃ", "ch", "chin", "affricate"),
  p("dʒ", "j", "jam", "affricate"),
  // Fricatives
  p("f", "f", "fan", "fricative"),
  p("v", "v", "van", "fricative"),
  p("θ", "th", "thin", "fricative"),
  p("ð", "th", "then", "fricative"),
  p("s", "s", "sun", "fricative"),
  p("z", "z", "zip", "fricative"),
  p("ʃ", "sh", "ship", "fricative"),
  p("ʒ", "s", "vision", "fricative"),
  p("h", "h", "hat", "fricative"),
  // Nasals
  p("m", "m", "map", "nasal"),
  p("n", "n", "nap", "nasal"),
  p("ŋ", "ng", "sing", "nasal"),
  // Approximants
  p("l", "l", "light", "approximant"),
  p("ɹ", "r", "right", "approximant"),
  p("w", "w", "win", "approximant"),
  p("j", "y", "yes", "approximant"),
  // Short vowels
  p("ɪ", "i", "hid", "short-vowel"),
  p("e", "e", "head", "short-vowel"),
  p("æ", "a", "had", "short-vowel"),
  p("ɐ", "u", "hut", "short-vowel"),
  p("ɔ", "o", "hot", "short-vowel"),
  p("ʊ", "oo", "hood", "short-vowel"),
  p("ə", "a", "about", "short-vowel"),
  // Long vowels
  p("iː", "ee", "heed", "long-vowel"),
  p("ɐː", "ar", "hard", "long-vowel"),
  p("ɜː", "ir", "heard", "long-vowel"),
  p("ʉː", "oo", "who'd", "long-vowel"),
  p("oː", "or", "fork", "long-vowel"),
  p("eː", "air", "hair", "long-vowel"),
  // Diphthongs
  p("æɪ", "ay", "hay", "diphthong"),
  p("ɑe", "igh", "high", "diphthong"),
  p("oɪ", "oy", "boy", "diphthong"),
  p("æɔ", "ow", "how", "diphthong"),
  p("əʉ", "oa", "boat", "diphthong"),
  p("ɪə", "ear", "here", "diphthong"),
  p("ʊə", "oor", "tour", "diphthong"),
];

const BY_SYMBOL = new Map(PHONEMES.map((ph) => [ph.symbol, ph]));
const CLASS_INFO = new Map(SOUND_CLASSES.map((c) => [c.id, c]));

/** Longest symbols first so greedy tokenising prefers "tʃ" over "t" + "ʃ". */
const SYMBOLS_LONGEST_FIRST = [...BY_SYMBOL.keys()].sort((a, b) => b.length - a.length);

export const PHONEME_SYMBOLS = PHONEMES.map((ph) => ph.symbol);

export function getPhoneme(symbol: string): Phoneme | undefined {
  return BY_SYMBOL.get(normaliseSymbol(symbol));
}

export function isKnownPhoneme(symbol: string): boolean {
  return BY_SYMBOL.has(normaliseSymbol(symbol));
}

export function getSoundClass(id: SoundClass): SoundClassInfo {
  return CLASS_INFO.get(id)!;
}

export function phonemesByClass(id: SoundClass): Phoneme[] {
  return PHONEMES.filter((ph) => ph.soundClass === id);
}

/** Human-readable hint, e.g. "/θ/ th as in thin". */
export function phonemeHint(symbol: string): string {
  const ph = getPhoneme(symbol);
  if (!ph) return `/${symbol}/`;
  return `/${ph.symbol}/ ${ph.spelling} as in ${ph.example}`;
}

/**
 * Normalise look-alike characters people commonly type or paste:
 * ":" for the length mark, "r" for the HCE approximant ɹ, "ɡ" (IPA g) for g.
 */
export function normaliseSymbol(raw: string): string {
  return raw
    .trim()
    .normalize("NFC")
    .replace(/[:ˑ]/g, "ː")
    .replace(/ɡ/g, "g")
    .replace(/^r$/, "ɹ")
    .replace(/^ʧ$/, "tʃ")
    .replace(/^ʤ$/, "dʒ");
}

export type TokenizeResult = { phonemes: string[]; unknown: string[] };

/**
 * Split a transcription into phonemes. Accepts space/comma/dot separated
 * symbols ("tʃ ɪ n") or an unbroken string ("tʃɪn"), matched greedily
 * against the inventory. Slashes and brackets are ignored.
 */
export function tokenizeTranscription(input: string): TokenizeResult {
  const cleaned = input.normalize("NFC").replace(/[\/\[\]]/g, " ").trim();
  if (!cleaned) return { phonemes: [], unknown: [] };

  const phonemes: string[] = [];
  const unknown: string[] = [];
  const chunks = cleaned.split(/[\s,.·]+/).filter(Boolean);

  for (const chunk of chunks) {
    const whole = normaliseSymbol(chunk);
    if (BY_SYMBOL.has(whole)) {
      phonemes.push(whole);
      continue;
    }
    // Greedy longest match inside an unbroken chunk
    let rest = chunk.replace(/[:ˑ]/g, "ː").replace(/ɡ/g, "g").replace(/ʧ/g, "tʃ").replace(/ʤ/g, "dʒ").replace(/r/g, "ɹ");
    while (rest.length > 0) {
      const match = SYMBOLS_LONGEST_FIRST.find((s) => rest.startsWith(s));
      if (match) {
        phonemes.push(match);
        rest = rest.slice(match.length);
      } else {
        unknown.push(rest[0]);
        rest = rest.slice(1);
      }
    }
  }
  return { phonemes, unknown };
}

/** Display form used across the UI: /tʃ ɪ n/ */
export function formatTranscription(phonemes: string[]): string {
  return `/${phonemes.join(" ")}/`;
}
