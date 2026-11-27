/**
 * Browser API client. All calls go to /api/* on our own origin (Next.js proxies them to
 * the FastAPI service), so the session cookie is first-party and CORS never comes into it.
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public requestId?: string,
  ) {
    super(message);
  }
}

type Options = { method?: string; body?: unknown; headers?: Record<string, string>; text?: string };

export async function api<T = unknown>(path: string, opts: Options = {}): Promise<T> {
  const headers: Record<string, string> = { "X-Requested-With": "phonemestudio", ...opts.headers };
  let body: BodyInit | undefined;
  if (opts.text !== undefined) {
    headers["Content-Type"] = "text/plain";
    body = opts.text;
  } else if (opts.body !== undefined) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(opts.body);
  }
  let res: Response;
  try {
    res = await fetch(`/api${path}`, { method: opts.method ?? (body ? "POST" : "GET"), headers, body, credentials: "same-origin" });
  } catch {
    throw new ApiError("You seem to be offline. Check your connection and try again.", 0);
  }
  if (res.status === 204) return undefined as T;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const detail = typeof data?.detail === "string" ? data.detail : "Something went wrong. Try again.";
    throw new ApiError(detail, res.status, res.headers.get("x-request-id") ?? undefined);
  }
  return data as T;
}
