"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Check, Search, Volume2 } from "lucide-react";
import { api } from "@/lib/api";
import { speak } from "@/lib/sound";
import { workspace } from "@/lib/workspace";
import { PHONEME_SYMBOLS } from "@/lib/phonemes";
import { cn } from "@/lib/cn";
import { Spinner, Tag, buttonClass, inputClass } from "@/components/ui";
import { PhonemeTiles } from "@/components/phoneme/keys";

type W = { id: number; english: string; phonemes: string[]; count: number; lists: string[] };
type L = { slug: string; name: string; count: number };

export function LibraryClient() {
  const params = useSearchParams();
  const ws = workspace.useStore();
  const [words, setWords] = useState<W[] | null>(null);
  const [lists, setLists] = useState<L[]>([]);
  const [q, setQ] = useState(params.get("q") ?? "");
  const [list, setList] = useState("");
  const [sound, setSound] = useState("");
  const [picked, setPicked] = useState<Set<string>>(new Set());

  useEffect(() => {
    api<{ items: W[] }>("/words?limit=500").then((r) => setWords(r.items)).catch(() => setWords([]));
    api<L[]>("/lists").then(setLists).catch(() => {});
  }, []);

  const mine: W[] = ws.custom_words.map((w, i) => ({ id: -i - 1, english: w.english, phonemes: w.phonemes, count: w.phonemes.length, lists: ["mine"] }));
  const shown = useMemo(() => {
    const term = q.trim().toLowerCase();
    return [...(words ?? []), ...mine].filter(
      (w) => (!term || w.english.includes(term)) && (!list || w.lists.includes(list)) && (!sound || w.phonemes.includes(sound)),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [words, ws.custom_words, q, list, sound]);

  const toggle = (e: string) => setPicked((p) => {
    const n = new Set(p);
    if (n.has(e)) n.delete(e);
    else n.add(e);
    return n;
  });
  const listName = (slug: string) => (slug === "mine" ? "My words" : lists.find((l) => l.slug === slug)?.name ?? slug);

  if (!words) return <Spinner />;
  const query = [...picked].join(",");
  return (
    <>
      <div className="mb-6 space-y-4 rounded-[28px] bg-surface p-5 ring-1 ring-line">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-full sm:w-80">
            <label htmlFor="lq" className="sr-only">Search words</label>
            <input id="lq" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search a word" className={`${inputClass} h-12 pr-11`} />
            <Search className="absolute top-3.5 right-4 size-5 text-ink-soft" />
          </div>
          {[{ slug: "", name: "All" }, ...lists, ...(mine.length ? [{ slug: "mine", name: "My words" }] : [])].map((l) => (
            <button key={l.slug} type="button" aria-pressed={list === l.slug} onClick={() => setList(l.slug)} className={cn("h-10 rounded-full px-4 text-[15px]", list === l.slug ? "bg-ink text-paper" : "bg-sunken hover:bg-mint")}>
              {l.name}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="mr-2 text-[15px] font-medium">Has the sound</span>
          {PHONEME_SYMBOLS.map((s) => (
            <button key={s} type="button" aria-pressed={sound === s} onClick={() => setSound(sound === s ? "" : s)} className={cn("ipa h-9 min-w-9 rounded-xl px-2", sound === s ? "bg-ink text-paper" : "bg-sunken hover:bg-mint")}>
              {s}
            </button>
          ))}
        </div>
      </div>
      <div className="overflow-hidden rounded-[28px] bg-surface ring-1 ring-line">
        <div className="max-h-[60vh] min-h-72 overflow-y-auto overscroll-contain" tabIndex={0} aria-label="Word list, scrolls">
        <table className="w-full text-left">
          <caption className="sr-only">Words</caption>
          <thead className="sticky top-0 z-10 bg-surface text-[15px] text-ink-soft shadow-[0_1px_0_var(--line)]">
            <tr className="border-b border-line">
              <th className="w-14 px-5 py-3"><span className="sr-only">Select</span></th>
              <th className="py-3 font-medium">Word</th>
              <th className="py-3 font-medium">Sounds</th>
              <th className="hidden py-3 font-medium sm:table-cell">Count</th>
              <th className="hidden py-3 font-medium md:table-cell">List</th>
              <th className="py-3"><span className="sr-only">Listen</span></th>
            </tr>
          </thead>
          <tbody>
            {shown.map((w) => {
              const on = picked.has(w.english);
              return (
                <tr key={`${w.id}-${w.english}`} className={cn("border-b border-line last:border-0", on && "bg-mint/50")}>
                  <td className="px-5 py-3">
                    <button type="button" role="checkbox" aria-checked={on} aria-label={`Select ${w.english}`} onClick={() => toggle(w.english)} className={cn("grid size-7 place-items-center rounded-lg", on ? "bg-correct text-white" : "bg-sunken")}>
                      {on && <Check className="size-4" />}
                    </button>
                  </td>
                  <td className="font-medium">{w.english}</td>
                  <td className="py-2"><PhonemeTiles phonemes={w.phonemes} /></td>
                  <td className="hidden text-ink-soft sm:table-cell">{w.count}</td>
                  <td className="hidden md:table-cell">{w.lists.slice(0, 2).map((l) => <Tag key={l} className="mr-1">{listName(l)}</Tag>)}</td>
                  <td className="pr-4 text-right">
                    <button type="button" onClick={() => speak(w.english)} aria-label={`Hear ${w.english}`} className="grid size-10 place-items-center rounded-xl hover:bg-sunken">
                      <Volume2 className="size-5" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {shown.length === 0 && <p className="px-6 py-12 text-center text-ink-soft">No words match. Try another sound or list.</p>}
        </div>
        <p className="border-t border-line px-6 py-3 text-sm text-ink-soft">{shown.length} words · scroll the list to see them all</p>
      </div>
      {picked.size > 0 && (
        <div className="sticky bottom-6 z-20 mx-auto mt-6 flex w-fit animate-rise items-center gap-3 rounded-full bg-ink py-2 pr-2 pl-6 text-paper shadow-xl">
          <span>{picked.size} word{picked.size > 1 ? "s" : ""} selected</span>
          <Link href={`/create/wordle?words=${encodeURIComponent(query)}`} className={buttonClass("accent", "sm")}>Make a Wordle</Link>
          <Link href={`/create/word-search?words=${encodeURIComponent(query)}`} className="inline-flex h-10 items-center rounded-full bg-white/15 px-4 font-semibold">Word search</Link>
        </div>
      )}
    </>
  );
}
