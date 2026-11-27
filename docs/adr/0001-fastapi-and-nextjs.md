# 1. Separate FastAPI backend with a Next.js frontend

**Status:** accepted

**Context.** The original project was a single Next.js app with SQLite. The rebuild needs real authentication, role checks, rate limiting, auditing and observability. It should also show backend skills in Python, the main language for the AI and backend roles this portfolio targets.

**Decision.** FastAPI owns all data, authentication and authorisation. Next.js renders pages and proxies `/api/*` to FastAPI through a rewrite.

**Consequences.**
- Business rules sit in one place, tested with pytest.
- The browser sees a single origin, so cookies are first-party and no CORS is needed.
- There are two deployables (Vercel and Render) instead of one, and the free Render plan has cold starts.
