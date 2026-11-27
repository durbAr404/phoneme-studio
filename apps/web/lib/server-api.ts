import "server-only";
import { cookies } from "next/headers";

const BASE = process.env.API_INTERNAL_URL ?? process.env.API_URL ?? "http://localhost:8000";

/**
 * Server-side fetch to the API, forwarding the visitor's session cookie. Returns null on any failure
 * or after the timeout, so a sleeping free-tier API never leaves a page hanging.
 */
export async function serverApi<T>(path: string, { revalidate, timeoutMs = 10_000 }: { revalidate?: number; timeoutMs?: number } = {}): Promise<T | null> {
  try {
    const jar = await cookies();
    const session = jar.get("ps_session")?.value;
    const res = await fetch(`${BASE}${path}`, {
      headers: session ? { cookie: `ps_session=${session}` } : {},
      signal: AbortSignal.timeout(timeoutMs),
      ...(session || revalidate === undefined ? { cache: "no-store" as const } : { next: { revalidate } }),
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}
