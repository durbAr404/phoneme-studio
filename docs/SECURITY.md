# Security

The public site has no accounts, so the main risks are abuse of the public endpoints, bad data in shared games, and attacks on visitors' browsers.

## Threat model (short)

| Threat | Control | Where |
| --- | --- | --- |
| Cross-site scripting | Nonce-based CSP with `strict-dynamic` (no inline script runs without the nonce); React escaping | `web/middleware.ts` |
| Cross-site request forgery | Custom `X-Requested-With` header required on every write, plus an `Origin` allowlist | `api/app/security/middleware.py` |
| Clickjacking | `frame-ancestors 'none'`, `X-Frame-Options: DENY` | both |
| Abuse of public endpoints | Per-IP rate limits on shares, plays, saves and daily guesses; size limits on every request body | `security/ratelimit.py`, `schemas.py` |
| Save code guessing | Around 4 million codes, restore limited to 15 tries per 15 minutes per IP | `routers/play.py` |
| Someone overwrites another person's save | Updates need a private edit token kept on the device that made the code; the server stores only its hash | `routers/play.py`, `test_save_code_update_needs_token` |
| Bad data in shared games | Every sound validated against the 44 HCE symbols on the server | `phonemes.py` |
| Database filling up | Rate limits, size limits, and results deleted after 90 days | `routers/ops.py` |
| Unauthorised cleanup calls | The daily cron endpoint needs `Authorization: Bearer $CRON_SECRET` | `routers/ops.py`, `test_cron_needs_secret` |
| Information leaks in errors | Unhandled errors return a generic message and a request ID only; API docs are off in production | `main.py`, `config.py` |
| Personal data | No accounts; IPs stored only as salted hashes; nicknames optional; results deleted after 90 days | `security/net.py`, `routers/ops.py` |
| Surprise costs | No paid APIs; everything runs on free plans | the whole design |
| Vulnerable dependencies | Dependabot, CodeQL | `.github/` |

## Headers

Every response from the site and the API includes HSTS (in production), `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, a `Permissions-Policy` that turns off camera, microphone and geolocation, and the CSP above.

## Reporting

Please report security problems privately to the maintainer rather than opening a public issue.
