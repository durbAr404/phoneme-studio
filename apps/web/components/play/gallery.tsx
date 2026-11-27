"use client";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import type { ActivitySummary } from "@/lib/types";
import { workspace } from "@/lib/workspace";
import { Empty, Segmented, inputClass } from "@/components/ui";
import { ActivityCard } from "./activity-card";

export function Gallery({ items }: { items: ActivitySummary[] }) {
  const [kind, setKind] = useState<"all" | "wordle" | "wordsearch">("all");
  const [sort, setSort] = useState<"featured" | "popular" | "az">("featured");
  const [q, setQ] = useState("");
  const ws = workspace.useStore();
  const shown = useMemo(() => {
    const term = q.trim().toLowerCase();
    const list = items.filter((a) => (kind === "all" || a.kind === kind) && (!term || a.title.toLowerCase().includes(term) || (a.all_sounds ?? a.sounds).some((s) => s === term)));
    if (sort === "popular") return [...list].sort((a, b) => (b.plays ?? 0) - (a.plays ?? 0));
    if (sort === "az") return [...list].sort((a, b) => a.title.localeCompare(b.title));
    return list;
  }, [items, kind, sort, q]);
  return (
    <>
      <div className="mb-8 flex flex-wrap items-center gap-3">
        <div className="relative w-full sm:w-80">
          <label htmlFor="gq" className="sr-only">Search games</label>
          <input id="gq" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name or a sound, like θ" className={`${inputClass} h-12 pr-11`} />
          <Search className="absolute top-3.5 right-4 size-5 text-ink-soft" />
        </div>
        <Segmented label="Game type" value={kind} onChange={setKind} options={[{ value: "all", label: "All" }, { value: "wordle", label: "Wordle" }, { value: "wordsearch", label: "Word search" }]} />
        <Segmented label="Sort" value={sort} onChange={setSort} options={[{ value: "featured", label: "Featured" }, { value: "popular", label: "Most played" }, { value: "az", label: "A to Z" }]} />
        <span className="ml-auto text-[15px] text-ink-soft">{shown.length} games</span>
      </div>
      {shown.length ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((a) => (
            <ActivityCard key={a.id} a={a} href={`/play/${a.id}`} stars={ws.stars[`activity:${a.id}`]} />
          ))}
        </div>
      ) : (
        <Empty title="No games match" body="Try another sound or clear the search." />
      )}
    </>
  );
}
