"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { ActivityData } from "@/lib/types";
import { workspace } from "@/lib/workspace";

export type SourceRef = { type: "share" | "activity" | "local"; id: string };

export function sourceFromParams(params: URLSearchParams): SourceRef | null {
  for (const type of ["share", "activity", "local"] as const) {
    const id = params.get(type);
    if (id) return { type, id };
  }
  return null;
}

/** Load an activity from a share link, a published activity, or this browser. */
export function useActivity(src: SourceRef | null) {
  const [data, setData] = useState<ActivityData | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    if (!src) {
      setError("No activity chosen.");
      return;
    }
    if (src.type === "local") {
      const a = workspace.get().activities.find((x) => x.id === src.id);
      if (a) setData(a);
      else setError("This game isn't saved on this device.");
      return;
    }
    api<ActivityData>(src.type === "share" ? `/shares/${src.id}` : `/activities/${src.id}`)
      .then(setData)
      .catch(() => setError("That activity couldn't be found."));
  }, [src?.type, src?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  return { data, error };
}
