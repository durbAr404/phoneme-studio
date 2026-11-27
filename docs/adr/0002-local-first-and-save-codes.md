# 2. Local-first, with save codes instead of accounts

**Status:** accepted

**Context.** Students shouldn't need accounts, teachers want to try the tool before signing up for anything, and the site has to run for free.

**Decision.** Everything a visitor makes is saved in `localStorage`. Save codes give account-free device-to-device sync: the workspace is uploaded once, anyone with the code can restore it, and only the device holding the private edit token can overwrite it.

**Consequences.**
- The site is fully usable with zero sign-up, and the privacy story is simple.
- The database only stores what has to be shared (share links, save codes, play results), which keeps it inside a free tier.
- Data in a browser can be lost when the browser is cleared, so the UI nudges people towards backups and save codes.
