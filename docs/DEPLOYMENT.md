# Deployment (all free)

You'll set up three free services in this order: the database (Neon), the API (Render), then the website (Vercel). It takes about 20 minutes. You need a GitHub account with this repo pushed to it.

## 1. Database: Neon

1. Sign up at [neon.tech](https://neon.tech) and create a project (pick the region closest to your users, for example Sydney).
2. On the dashboard, copy the **connection string**. It looks like `postgresql://user:password@host/dbname?sslmode=require`.
3. Change the start from `postgresql://` to `postgresql+psycopg://`. Keep `?sslmode=require` at the end. This is your `DATABASE_URL`.

## 2. API: Render

1. Sign up at [render.com](https://render.com) with GitHub.
2. Click **New**, then **Blueprint**, and pick this repo. Render reads `render.yaml` and creates a free web service called `phonemestudio-api`.
3. Fill in the environment variables it asks for:
   - `DATABASE_URL`: the Neon string from step 1
   - `ALLOWED_ORIGINS`: your website's address. You don't know it yet, so put `https://placeholder.vercel.app` and fix it in step 4.
   - `CRON_SECRET`: a long random string (for example from a password generator). Keep it; Vercel needs the same value.
   - leave `SENTRY_DSN` and `REDIS_URL` empty
4. Deploy. The first deploy takes a few minutes and runs the database migrations and seed data automatically.
5. Open `https://YOUR-API.onrender.com/ready`. It should say `{"status":"ready"}`. Copy this API address.

The free plan sleeps after 15 minutes without traffic. Step 5 below keeps it awake.

## 3. Website: Vercel

1. Sign up at [vercel.com](https://vercel.com) with GitHub, click **Add New**, then **Project**, and import this repo.
2. Set **Root Directory** to `apps/web`. Vercel detects Next.js.
3. Add environment variables:
   - `API_URL`: the Render address from step 2 (no trailing slash)
   - `CRON_SECRET`: the same value as on Render
   - `NEXT_PUBLIC_SITE_URL`: leave for now
4. Deploy. When it's done, copy your site address, for example `https://phoneme-studio.vercel.app`.
5. Set `NEXT_PUBLIC_SITE_URL` to that address and redeploy (Deployments, then the three dots, then **Redeploy**).
6. Optional: turn on **Analytics** and **Speed Insights** in the project's settings (both have free tiers).

`vercel.json` already schedules the daily cleanup job.

## 4. Connect them

On Render, change `ALLOWED_ORIGINS` to your real Vercel address (for example `https://phoneme-studio.vercel.app`) and save. Render redeploys automatically. Without this, creating share links and save codes is refused by the CSRF check.

## 5. Keep the API awake

`.github/workflows/keep-awake.yml` pings the API every 10 minutes.

1. On GitHub, open the repo's **Settings**, then **Secrets and variables**, then **Actions**, then **Variables**.
2. Add a variable named `API_HEALTH_URL` with the value `https://YOUR-API.onrender.com/health`.
3. Open the **Actions** tab and enable workflows if GitHub asks.

GitHub Actions is free for public repos. For a private repo the pings would use most of the free monthly minutes, so instead use a free cron service such as [cron-job.org](https://cron-job.org) to call the same `/health` address every 10 minutes, and disable the workflow.

## 6. Check it works

- Open the site, build a Wordle, and click **Share**. A link and QR code should appear.
- Open the link in a private window and play it.
- Open the daily challenge and make a guess.
- In My activities, make a save code, then restore it in another browser.

## Optional extras (also free)

- **Uptime monitor:** point [Better Stack](https://betterstack.com) or UptimeRobot at `https://YOUR-API.onrender.com/ready` to get an email if it goes down.
- **Sentry:** create Python and Next.js projects and put their DSNs in `SENTRY_DSN` (Render) and `NEXT_PUBLIC_SENTRY_DSN` / `SENTRY_DSN` (Vercel).
- **Upstash Redis** (`REDIS_URL`): only needed if you run more than one API instance.
- **Custom domain:** add it in Vercel, then add it to `ALLOWED_ORIGINS` on Render.

## Production checklist

- [ ] `ENV=production` on Render (set by `render.yaml`; turns off API docs and dev sign-in, turns on HSTS)
- [ ] `COOKIE_SECURE=true` (set by `render.yaml`)
- [ ] `IP_HASH_SALT` generated (set by `render.yaml`) and `CRON_SECRET` set to a long random value
- [ ] `ALLOWED_ORIGINS` is exactly your live site address
- [ ] `API_HEALTH_URL` variable set on GitHub, or a cron-job.org ping
