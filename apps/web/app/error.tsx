"use client";
import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";
import { Buddy } from "@/components/games/buddy";
import { Button } from "@/components/ui";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);
  return (
    <main id="main" className="mx-auto max-w-xl px-5 py-24 text-center">
      <Buddy mood="wow" size={140} className="mx-auto" />
      <h1 className="mt-6 text-4xl font-semibold">Something went wrong on our side.</h1>
      <p className="mt-3 text-lg text-ink-soft">Your saved games are safe. Try again, and if it keeps happening, reload the page.</p>
      {error.digest && <p className="mt-2 text-sm text-ink-soft">Reference: {error.digest}</p>}
      <Button variant="primary" className="mt-8" onClick={reset}>Try again</Button>
    </main>
  );
}
