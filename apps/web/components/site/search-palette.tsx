"use client";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { BookOpen, FileText, Play, Search } from "lucide-react";
import { api } from "@/lib/api";
import { cn } from "@/lib/cn";
import { PHONEMES } from "@/lib/phonemes";

import { SHOWCASE } from "@/lib/showcase";
type Result = { label: string; detail: string; href: string; group: string; icon: "sound" | "play" | "word" | "page" };
const PAGES: Result[] = [
  { label: "Create a Wordle", detail: "Builder", href: "/create/wordle", group: "Pages", icon: "page" },
  { label: "Create a word search", detail: "Builder", href: "/create/word-search", group: "Pages", icon: "page" },
  { label: "Daily challenge", detail: "Play", href: "/daily", group: "Pages", icon: "page" },
  { label: "My activities", detail: "Saved games", href: "/my-activities", group: "Pages", icon: "page" },
  { label: "Settings", detail: "Theme, text size, sound", href: "/settings", group: "Pages", icon: "page" },
  { label: "Sound guide", detail: "All 44 sounds", href: "/sounds", group: "Pages", icon: "page" },
  ...(SHOWCASE
    ? ([
        { label: "For Developers", detail: "How it's built", href: "/developers", group: "Pages", icon: "page" },
        { label: "Admin demo", detail: "Read-only dashboard", href: "/admin-login", group: "Pages", icon: "page" },
      ] as Result[])
    : []),
];

let opener: (() => void) | null = null;
export const openSearch = () => opener?.();

/** Ctrl/Cmd+K quick search across sounds, published games, words and pages. */
export function SearchPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [active, setActive] = useState(0);
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    opener = () => setOpen(true);
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    const d = dialog.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
    if (open) setQ("");
  }, [open]);

  useEffect(() => {
    const term = q.trim().toLowerCase();
    if (!term) {
      setResults(PAGES);
      return;
    }
    const local: Result[] = [
      ...PHONEMES.filter((p) => p.symbol === term || p.spelling === term || p.example.startsWith(term))
        .slice(0, 4)
        .map((p) => ({ label: `/${p.symbol}/`, detail: `${p.spelling} as in ${p.example}`, href: `/sounds?s=${encodeURIComponent(p.symbol)}`, group: "Sounds", icon: "sound" as const })),
      ...PAGES.filter((p) => p.label.toLowerCase().includes(term)),
    ];
    setResults(local);
    const t = setTimeout(async () => {
      try {
        const r = await api<{ activities: { id: string; title: string; kind: string; word_count: number }[]; words: { english: string; phonemes: string[] }[] }>(
          `/search?q=${encodeURIComponent(term)}`,
        );
        setResults([
          ...local,
          ...r.activities.map((a) => ({ label: a.title, detail: `${a.kind === "wordle" ? "Wordle" : "Word search"}, ${a.word_count} words`, href: `/play/${a.id}`, group: "Games", icon: "play" as const })),
          ...r.words.map((w) => ({ label: w.english, detail: `/${w.phonemes.join(" ")}/`, href: `/library?q=${encodeURIComponent(w.english)}`, group: "Words", icon: "word" as const })),
        ]);
      } catch {
        /* keep local results */
      }
    }, 180);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => setActive(0), [results]);

  const go = (r: Result) => {
    setOpen(false);
    router.push(r.href);
  };

  const icon = (r: Result) =>
    r.icon === "sound" ? <span className="ipa text-lg">{r.label.replace(/\//g, "")}</span> : r.icon === "play" ? <Play className="size-4" /> : r.icon === "word" ? <BookOpen className="size-4" /> : <FileText className="size-4" />;

  let lastGroup = "";
  return (
    <dialog
      ref={dialog}
      onClose={() => setOpen(false)}
      onClick={(e) => e.target === dialog.current && setOpen(false)}
      aria-label="Search"
      className="mx-auto mt-[12vh] w-[min(92vw,640px)] overflow-hidden rounded-[24px] bg-surface p-0 text-ink shadow-2xl backdrop:bg-[#0c1a15]/40 backdrop:backdrop-blur-[3px]"
    >
      <div className="flex items-center gap-3 border-b border-line px-5">
        <Search className="size-5 text-ink-soft" />
        <input
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setActive((a) => Math.min(a + 1, results.length - 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setActive((a) => Math.max(a - 1, 0));
            } else if (e.key === "Enter" && results[active]) go(results[active]);
          }}
          placeholder="Search sounds, games and words, like th"
          aria-label="Search"
          className="h-16 flex-1 bg-transparent text-lg outline-none placeholder:text-ink-faint"
        />
        <kbd className="rounded-md border border-line-strong px-1.5 text-xs text-ink-soft">Esc</kbd>
      </div>
      <ul className="max-h-[50vh] overflow-y-auto p-2" role="listbox" aria-label="Results">
        {results.length === 0 && <li className="px-4 py-8 text-center text-ink-soft">No matches. Try a word like ship or a sound like θ.</li>}
        {results.map((r, i) => {
          const header = r.group !== lastGroup ? r.group : null;
          lastGroup = r.group;
          return (
            <li key={`${r.group}-${r.href}-${i}`} role="option" aria-selected={i === active}>
              {header && <p className="px-3 pt-3 pb-1 text-[13px] text-ink-soft">{header}</p>}
              <button
                type="button"
                onMouseEnter={() => setActive(i)}
                onClick={() => go(r)}
                className={cn("flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left", i === active && "bg-sunken")}
              >
                <span className="grid size-9 place-items-center rounded-lg bg-mint text-mint-ink">{icon(r)}</span>
                <span className="font-medium">{r.label}</span>
                <span className="ml-auto truncate text-sm text-ink-soft">{r.detail}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </dialog>
  );
}
