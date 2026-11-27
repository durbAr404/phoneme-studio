"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { Check, Printer } from "lucide-react";
import { generateWordSearch } from "@/lib/games/wordsearch";
import { cn } from "@/lib/cn";
import { Button, ErrorNote, Spinner } from "@/components/ui";
import { sourceFromParams, useActivity } from "./use-activity";

function Option({ on, set, label }: { on: boolean; set: (v: boolean) => void; label: string }) {
  return (
    <button type="button" role="checkbox" aria-checked={on} onClick={() => set(!on)} className={cn("inline-flex h-10 items-center gap-1.5 rounded-full px-4 text-[15px]", on ? "bg-ink text-paper" : "bg-sunken")}>
      {on && <Check className="size-4" />} {label}
    </button>
  );
}

/** A4 worksheet with an optional answer key page. */
export function PrintSheet() {
  const params = useSearchParams();
  const src = useMemo(() => sourceFromParams(params), [params]);
  const { data, error } = useActivity(src);
  const [key, setKey] = useState(true);
  const [nameLine, setNameLine] = useState(true);
  const [spelling, setSpelling] = useState(false);
  const puzzle = useMemo(
    () => (data?.kind === "wordsearch" ? generateWordSearch(data.words, { rows: data.settings.grid_size, cols: data.settings.grid_size, seed: data.settings.seed, difficulty: data.settings.difficulty }) : null),
    [data],
  );
  if (error) return <div className="mx-auto max-w-xl px-5 py-24"><ErrorNote>{error}</ErrorNote></div>;
  if (!data) return <Spinner />;
  const answer = new Set(puzzle?.placed.flatMap((w) => w.cells.map((c) => `${c.row}:${c.col}`)) ?? []);
  const page = "mx-auto w-[210mm] min-h-[297mm] bg-white p-[16mm] text-[#1b1b1b] shadow-xl print:shadow-none print:w-auto print:min-h-0 print:p-0";

  return (
    <div className="min-h-screen bg-sunken pb-16 print:bg-white">
      <div className="no-print sticky top-0 z-10 flex flex-wrap items-center gap-3 bg-surface px-6 py-4 shadow-sm">
        <Link href="/my-activities" className="font-medium">Back</Link>
        <h1 className="text-lg font-semibold">Print: {data.title}</h1>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <Option on={key} set={setKey} label="Answer key" />
          <Option on={nameLine} set={setNameLine} label="Name and date line" />
          <Option on={spelling} set={setSpelling} label="Spellings" />
          <Button variant="primary" onClick={() => window.print()}><Printer className="size-4" /> Print</Button>
        </div>
      </div>
      <div className="mt-8 space-y-8 print:mt-0">
        <section className={page}>
          {nameLine && <div className="mb-6 flex justify-between text-sm"><span>Name: ______________________</span><span>Date: ____________</span></div>}
          <h2 className="text-3xl font-semibold">{data.title}</h2>
          <p className="mt-1 text-sm text-[#444]">{data.instructions || (data.kind === "wordle" ? "Write each word in sounds, one sound per box." : "Find each word written in sounds.")}</p>
          {puzzle ? (
            <>
              <div className="mt-6 grid border-2 border-[#1b1b1b]" style={{ gridTemplateColumns: `repeat(${puzzle.cols}, 1fr)` }}>
                {puzzle.grid.flatMap((row, r) => row.map((s, c) => <span key={`${r}:${c}`} className="ipa grid aspect-square place-items-center border border-[#ccc] text-lg">{s}</span>))}
              </div>
              <ul className="mt-6 grid grid-cols-3 gap-2 text-[15px]">
                {puzzle.placed.map((w) => <li key={w.index}>☐ <span className="ipa">/{w.phonemes.join(" ")}/</span>{spelling && ` ${w.english}`}</li>)}
              </ul>
            </>
          ) : (
            <ol className="mt-8 space-y-6">
              {data.words.map((w, i) => (
                <li key={i} className="flex items-center gap-4">
                  <span className="w-28 text-lg">{i + 1}. {spelling ? w.english : "________"}</span>
                  <span className="flex gap-2">{w.phonemes.map((_, j) => <span key={j} className="size-12 rounded-lg border-2 border-[#1b1b1b]" />)}</span>
                </li>
              ))}
            </ol>
          )}
          <p className="mt-10 text-xs text-[#666]">Made with Phoneme Studio</p>
        </section>
        {key && (
          <section className={cn(page, "print:break-before-page")}>
            <h2 className="text-2xl font-semibold">Answer key: {data.title}</h2>
            {puzzle ? (
              <div className="mt-6 grid max-w-md border-2 border-[#1b1b1b]" style={{ gridTemplateColumns: `repeat(${puzzle.cols}, 1fr)` }}>
                {puzzle.grid.flatMap((row, r) => row.map((s, c) => <span key={`${r}:${c}`} className={cn("ipa grid aspect-square place-items-center text-sm", answer.has(`${r}:${c}`) && "bg-[#1b1b1b] text-white")}>{s}</span>))}
              </div>
            ) : (
              <ol className="mt-6 space-y-3 text-lg">{data.words.map((w, i) => <li key={i}>{i + 1}. {w.english} <span className="ipa">/{w.phonemes.join(" ")}/</span></li>)}</ol>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
