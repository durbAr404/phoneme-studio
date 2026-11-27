"use client";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

/**
 * The API runs on a free plan that sleeps when nobody has used it for a while, and the first
 * request then takes up to a minute. If the API hasn't answered within a couple of seconds, say
 * what's happening instead of leaving the page looking broken. Hidden as soon as it answers.
 */
export function ServerWake() {
  const [waking, setWaking] = useState(false);
  useEffect(() => {
    let done = false;
    const timer = setTimeout(() => !done && setWaking(true), 2500);
    const ping = async (tries: number): Promise<void> => {
      try {
        const r = await fetch("/api/health", { cache: "no-store", signal: AbortSignal.timeout(20_000) });
        if (r.ok) return;
      } catch {
        // still waking up
      }
      if (tries > 0) return ping(tries - 1);
    };
    ping(4).finally(() => {
      done = true;
      clearTimeout(timer);
      setWaking(false);
    });
    return () => clearTimeout(timer);
  }, []);
  if (!waking) return null;
  return (
    <div role="status" className="fixed inset-x-0 bottom-5 z-50 mx-auto flex w-fit max-w-[92vw] items-center gap-3 rounded-full bg-ink px-5 py-3 text-[15px] text-surface shadow-lg">
      <Loader2 className="size-4 shrink-0 animate-spin motion-reduce:animate-none" />
      Starting the server. This can take up to a minute the first time.
    </div>
  );
}
