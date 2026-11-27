"use client";
import Link from "next/link";
import { SHOWCASE } from "@/lib/showcase";
import { useEffect, useState } from "react";
import { Copy, Link2, MoreHorizontal, Pencil, Play, Plus, Printer, Star, Trash2 } from "lucide-react";
import { deleteActivity, newId, saveActivity, workspace, type LocalActivity } from "@/lib/workspace";
import { cn } from "@/lib/cn";
import { Empty, LinkButton, PageHeader } from "@/components/ui";
import { useToast } from "@/components/ui/toast";
import { toneFor } from "./activity-card";
import { SaveCode } from "./save-code";

function Menu({ a }: { a: LocalActivity }) {
  const [open, setOpen] = useState(false);
  const toast = useToast();
  return (
    <div className="relative">
      <button type="button" aria-label={`More actions for ${a.title}`} aria-expanded={open} onClick={() => setOpen(!open)} className="grid size-10 place-items-center rounded-xl hover:bg-sunken">
        <MoreHorizontal className="size-5" />
      </button>
      {open && (
        <div className="absolute right-0 z-20 mt-1 w-52 animate-rise rounded-2xl bg-surface p-1.5 shadow-xl ring-1 ring-line" onMouseLeave={() => setOpen(false)}>
          <Link href={`/print?local=${a.id}`} className="flex items-center gap-2 rounded-xl px-3 py-2.5 hover:bg-sunken"><Printer className="size-4" /> Print</Link>
          <button type="button" className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 hover:bg-sunken" onClick={() => { saveActivity({ ...a, id: newId(), remote_id: undefined, title: `${a.title} (copy)` }); setOpen(false); toast("Duplicated"); }}>
            <Copy className="size-4" /> Duplicate
          </button>
          <button type="button" className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-danger hover:bg-sunken" onClick={() => {
            if (!window.confirm(`Delete "${a.title}"?`)) return;
            deleteActivity(a.id);
            toast("Deleted");
          }}>
            <Trash2 className="size-4" /> Delete
          </button>
        </div>
      )}
    </div>
  );
}

export function MyActivities() {
  const ws = workspace.useStore();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return null;
  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="My activities"
        description="Saved in this browser. Nothing leaves your device unless you share a game or make a save code."
        actions={
          <>
            <LinkButton href="/create/wordle" variant="primary"><Plus className="size-4" /> New game</LinkButton>
          </>
        }
      />
      {ws.activities.length === 0 ? (
        <Empty
          title="Make your first game"
          body="Games you make are saved here automatically."
          icon={<Plus className="size-6" />}
          action={<><LinkButton href="/create/wordle" variant="primary">Wordle</LinkButton><LinkButton href="/create/word-search">Word search</LinkButton></>}
        />
      ) : (
        <ul className="divide-y divide-line rounded-[28px] bg-surface px-3 ring-1 ring-line">
          {ws.activities.map((a) => {
            const stars = ws.stars[`local:${a.id}`] ?? 0;
            return (
              <li key={a.id} className="flex flex-wrap items-center gap-4 px-3 py-4">
                <span className={cn("ipa grid size-14 place-items-center rounded-2xl text-xl", toneFor(a.title))}>{a.words[0]?.phonemes[0] ?? "?"}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-lg font-medium">{a.title}</p>
                  <p className="text-[15px] text-ink-soft">
                    {a.kind === "wordle" ? "Wordle" : "Word search"} · {a.words.length} words · edited {a.updated_at ? new Date(a.updated_at).toLocaleDateString("en-AU") : "now"}
                  </p>
                </div>
                {stars > 0 && <span className="flex" aria-label={`${stars} stars`}>{[0, 1, 2].map((i) => <Star key={i} className={cn("size-4", i < stars ? "fill-present text-present" : "text-line-strong")} />)}</span>}
                <div className="flex items-center gap-1.5">
                  <LinkButton href={`/play/local/${a.id}`} size="sm"><Play className="size-4" /> Play</LinkButton>
                  <LinkButton href={`/create/${a.kind === "wordle" ? "wordle" : "word-search"}?id=${a.id}`} size="sm"><Pencil className="size-4" /> Edit</LinkButton>
                  <LinkButton href={`/create/${a.kind === "wordle" ? "wordle" : "word-search"}?id=${a.id}`} size="sm" aria-label={`Share ${a.title}`}><Link2 className="size-4" /></LinkButton>
                  <Menu a={a} />
                </div>
              </li>
            );
          })}
        </ul>
      )}
      <div className="mt-8 rounded-[28px] bg-surface p-7 ring-1 ring-line">
        <SaveCode />
        {SHOWCASE && (
          <p className="mt-6 border-t border-line pt-5 text-[15px] text-ink-soft">
            Wondering about teacher accounts and class results?{" "}
            <Link href="/teacher-sign-in" className="font-medium text-ink underline decoration-primary underline-offset-4">See the teacher demo</Link>
          </p>
        )}
      </div>
    </div>
  );
}
