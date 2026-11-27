"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Check, Lightbulb, X } from "lucide-react";
import { api } from "@/lib/api";
import type { Word } from "@/lib/types";
import { workspace } from "@/lib/workspace";
import { Button, Tag, Textarea } from "@/components/ui";
import { useToast } from "@/components/ui/toast";
import { PhonemeTiles } from "@/components/phoneme/keys";
import { AddSoundsDialog } from "./add-sounds-dialog";

type ListInfo = { slug: string; name: string; count: number };
export type Library = Map<string, string[]>;

export function useLibrary() {
  const [lib, setLib] = useState<Library>(new Map());
  const [lists, setLists] = useState<ListInfo[]>([]);
  useEffect(() => {
    api<{ items: { english: string; phonemes: string[] }[] }>("/words?limit=500").then((r) => setLib(new Map(r.items.map((w) => [w.english, w.phonemes])))).catch(() => {});
    api<ListInfo[]>("/lists").then(setLists).catch(() => {});
  }, []);
  return { lib, lists };
}

export function WordsStep({ words, setWords, lib, lists }: { words: Word[]; setWords: (w: Word[]) => void; lib: Library; lists: ListInfo[] }) {
  const toast = useToast();
  const ws = workspace.useStore();
  const [text, setText] = useState("");
  const [pending, setPending] = useState<string[]>([]);
  const [adding, setAdding] = useState<string | null>(null);
  const [tip, setTip] = useState(true);
  const custom = useMemo(() => new Map(ws.custom_words.map((w) => [w.english, w.phonemes])), [ws.custom_words]);

  useEffect(() => setTip(localStorage.getItem("ps:tip:paste") !== "hidden"), []);

  const lookup = (english: string) => custom.get(english) ?? lib.get(english);

  const addFromText = (raw: string) => {
    const names = raw.split(/[\n,;]+/).map((s) => s.trim().toLowerCase()).filter(Boolean);
    const have = new Set(words.map((w) => w.english));
    const known: Word[] = [];
    const unknown: string[] = [];
    for (const n of names) {
      if (have.has(n) || n.length > 40) continue;
      have.add(n);
      const ph = lookup(n);
      if (ph) known.push({ english: n, phonemes: ph });
      else unknown.push(n);
    }
    const room = 30 - words.length;
    setWords([...words, ...known.slice(0, room)]);
    setPending((p) => [...new Set([...p, ...unknown])]);
    setText("");
    if (known.length > room) toast("A game can have up to 30 words.");
  };

  const addList = async (slug: string) => {
    const r = await api<{ items: Word[] }>(`/words?list=${slug}&limit=12`);
    const have = new Set(words.map((w) => w.english));
    setWords([...words, ...r.items.filter((w) => !have.has(w.english)).map((w) => ({ english: w.english, phonemes: w.phonemes }))].slice(0, 30));
  };

  const saveCustom = (english: string, phonemes: string[]) => {
    workspace.set((w) => ({ ...w, custom_words: [...w.custom_words.filter((x) => x.english !== english), { english, phonemes }] }));
    setWords([...words.filter((w) => w.english !== english), { english, phonemes }].slice(0, 30));
    setPending((p) => p.filter((x) => x !== english && x !== adding));
    setAdding(null);
  };

  return (
    <div className="space-y-6">
      {tip && (
        <div className="flex items-center gap-3 rounded-[22px] bg-butter px-5 py-4 text-butter-ink">
          <Lightbulb className="size-5 shrink-0" />
          <p>Tip: paste a whole list. We fill in the sounds for words we know and ask you about the rest.</p>
          <button type="button" aria-label="Hide tip" className="ml-auto grid size-9 place-items-center rounded-lg hover:bg-black/5" onClick={() => { setTip(false); localStorage.setItem("ps:tip:paste", "hidden"); }}>
            <X className="size-4" />
          </button>
        </div>
      )}
      <div>
        <label htmlFor="paste" className="mb-2 block font-medium">Type or paste words</label>
        <Textarea
          id="paste"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              addFromText(text);
            }
          }}
          placeholder="thin, three, bath, mother"
        />
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Button variant="primary" size="sm" onClick={() => addFromText(text)} disabled={!text.trim()}>
            Add words
          </Button>
          <span className="ml-2 text-[15px] text-ink-soft">Or start from</span>
          {lists.map((l) => (
            <Button key={l.slug} size="sm" onClick={() => addList(l.slug)}>
              {l.name}
            </Button>
          ))}
          <Link href="/library" className="ml-1 text-[15px] font-medium underline decoration-primary underline-offset-4">
            Browse the library
          </Link>
        </div>
      </div>
      <div className="rounded-[28px] bg-surface p-2 ring-1 ring-line">
        {words.length === 0 && pending.length === 0 && <p className="px-5 py-10 text-center text-ink-soft">Your words appear here.</p>}
        <ul className="divide-y divide-line">
          {words.map((w) => (
            <li key={w.english} className="flex items-center gap-4 px-4 py-3">
              <span className="grid size-7 place-items-center rounded-full bg-correct text-white"><Check className="size-4" /></span>
              <span className="w-32 font-medium">{w.english}</span>
              <PhonemeTiles phonemes={w.phonemes} />
              <button type="button" aria-label={`Remove ${w.english}`} onClick={() => setWords(words.filter((x) => x.english !== w.english))} className="ml-auto grid size-10 place-items-center rounded-xl hover:bg-sunken">
                <X className="size-5" />
              </button>
            </li>
          ))}
          {pending.map((n) => (
            <li key={n} className="flex items-center gap-4 px-4 py-3">
              <span className="grid size-7 place-items-center rounded-full bg-present text-[#2b2410]"><AlertTriangle className="size-4" /></span>
              <span className="w-32 font-medium">{n}</span>
              <span className="text-ink-soft">Not in the library yet</span>
              <span className="ml-auto flex gap-1">
                <Button size="sm" variant="accent" onClick={() => setAdding(n)}>Add its sounds</Button>
                <button type="button" aria-label={`Remove ${n}`} onClick={() => setPending(pending.filter((x) => x !== n))} className="grid size-10 place-items-center rounded-xl hover:bg-sunken">
                  <X className="size-5" />
                </button>
              </span>
            </li>
          ))}
        </ul>
      </div>
      <p className="flex flex-wrap gap-2 text-[15px] text-ink-soft">
        <Tag tone="mint">{words.length} ready</Tag>
        {pending.length > 0 && <Tag tone="butter">{pending.length} need sounds</Tag>}
        <span>Up to 30 words per game.</span>
      </p>
      <AddSoundsDialog word={adding} onClose={() => setAdding(null)} onSave={saveCustom} />
    </div>
  );
}
