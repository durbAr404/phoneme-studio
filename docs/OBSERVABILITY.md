# Observability

## Signals

| Signal | How | Where to see it |
| --- | --- | --- |
| Logs | structlog JSON, one line per request with `request_id`, route, status, duration, role | Render logs, Vercel logs |
| Request IDs | Accepted from `X-Request-ID` or generated; returned on every response and in 500 error bodies | Response headers, error log, audit log |
| Latency | Per-route timings stored in `request_metrics` | Database; p50 and p95 for the last 24 h |
| Errors | Unhandled exceptions grouped by type and route in `error_events`, with count and last request ID; also sent to Sentry when configured | Database; Sentry |
| Real-user page speed | `useReportWebVitals` samples 25% of page loads (LCP, INP, CLS, FCP, TTFB) | Database (`web_vitals`); Vercel Speed Insights |
| Traffic | Vercel Analytics in production | Vercel dashboard |
| Health | `GET /health` (process up), `GET /ready` (database answers); Docker `HEALTHCHECK`; Render health check; a GitHub Actions ping every 10 minutes | Uptime monitor (for example Better Stack, free) |
| Business metrics | Plays, completion rate, players, most played | Database (`plays`) |

## Alerts

Sentry (optional) alerts on new error types. An uptime monitor on `/ready` alerts when the API or database is down. `ALERT_WEBHOOK_URL` (Slack, Discord or any webhook) is available for custom alerts.

## Retention

The daily cron (`/internal/cron/cleanup`, called by Vercel Cron with `Authorization: Bearer $CRON_SECRET`) deletes:
- plays after 90 days
- request metrics after 14 days
- web vitals after 30 days

## Debugging a user's error

1. The user reports "Something went wrong" and the reference shown on the error page.
2. Search the logs for that `request_id`. The log line has the route, role and duration.
3. Look up the request ID in `error_events`: the error is grouped there with its count.
4. With Sentry configured, the same error appears there with the stack trace and release.
