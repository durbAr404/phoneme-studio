"use client";
import Link from "next/link";
import { workspace } from "@/lib/workspace";

export function ContinueLink() {
  const ws = workspace.useStore();
  const last = ws.activities[0];
  if (!last) return null;
  return (
    <p className="mt-6 text-ink-soft">
      Continue where you left off:{" "}
      <Link href={`/create/${last.kind === "wordle" ? "wordle" : "word-search"}?id=${last.id}`} className="font-medium text-ink underline decoration-primary decoration-2 underline-offset-4">
        {last.title}
      </Link>
    </p>
  );
}
