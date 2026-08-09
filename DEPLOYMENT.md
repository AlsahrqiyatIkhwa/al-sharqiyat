# 🚀 Deployment Guide — Vercel (Frontend) + Railway (Backend + PostgreSQL)

This guide deploys:
- **Backend API + PostgreSQL** → Railway
- **Frontend (Next.js)** → Vercel

Both Vercel and Railway deploy by connecting to a **GitHub repo**, so the code has to be pushed to GitHub first.

---

## Part 0 — Push the code to GitHub

1. Create an empty repo on GitHub (github.com → New repository). Don't initialize it with a README/`.gitignore` — this project already has its own `.gitignore`. Copy the repo URL it gives you (e.g. `https://github.com/<you>/al-sharqiyat.git`).

2. From the project root (the folder containing `backend/` and `frontend/`), run:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/<you>/al-sharqiyat.git
   git push -u origin main
   ```

3. **Double-check no secrets got committed** before pushing: run `git status` — you should NOT see `backend/.env` or `frontend/.env.local` listed (the `.gitignore` excludes them). If either shows up, remove it from staging with `git rm --cached backend/.env` (or the matching path) before committing.

Once the push succeeds, Vercel and Railway (below) can both import directly from this GitHub repo — and every future `git push` to `main` auto-redeploys both.

---

## Part 1 — Backend on Railway

1. **Create project**
   - Go to railway.app → New Project → **Deploy from GitHub repo** → select this repo, set the **root directory to `backend/`**.

2. **Add PostgreSQL**
   - In the same Railway project: New → Database → **PostgreSQL**.
   - Railway auto-generates `DATABASE_URL` — Railway will inject it automatically if the DB and backend service are in the same project (reference it as `${{Postgres.DATABASE_URL}}` in the backend service's variables).

3. **Set environment variables** on the backend service (Settings → Variables). Copy every key from `backend/.env.example` and set real values:
   - `DATABASE_URL` → reference the Postgres plugin's URL
   - `JWT_SECRET`, `JWT_REFRESH_SECRET`, `COOKIE_SECRET` → three **different** long random values, e.g. `openssl rand -base64 48` (run it 3 times)
   - `NODE_ENV=production`
   - `CLIENT_URL` → your Vercel domain, e.g. `https://al-sharqiyat.vercel.app` (no trailing slash) — this must be exact since CORS checks it directly, and in production the refresh-token cookie is set `SameSite=None; Secure` (required because Vercel and Railway are different domains — see the comment in `admin-auth.routes.ts`)
   - `ADMIN_USERNAME` / `ADMIN_PASSWORD` → real admin credentials (used once by the seed script)
   - `LOGIN_MAX_ATTEMPTS` / `LOGIN_LOCK_MINUTES` → brute-force lockout thresholds (defaults: 5 attempts / 15 min)
   - `SENTRY_DSN` → from sentry.io, if you want error monitoring (leave empty to disable)
   - `ADMIN_WHATSAPP_NUMBER`, `ADMIN_PANEL_URL`, WhatsApp/manual-payment variables as needed

4. **Build & start commands** — already configured via `backend/railway.json`:
   - Build: `npm install && npx prisma generate && npm run build`
   - Start: `npx prisma migrate deploy && npm start` (applies migrations, then boots the server)
   - Health check: `GET /health`

5. **Deploy**, then run the seed once (Railway → service → the "Deploy Logs" panel has a shell, or run locally against the production `DATABASE_URL`):
   ```bash
   DATABASE_URL="<railway-postgres-url>" npm run seed
   ```
   This creates the shipping zones and the first admin user. **Immediately log in and treat `ADMIN_PASSWORD` as compromised if it was ever a placeholder** — change it by re-hashing a new password directly in the DB or adding a small one-off admin-password-reset script.

6. **File uploads**: the default `/uploads` local disk storage does **not** persist across Railway redeploys/restarts. Set `STORAGE_DRIVER=s3` plus `S3_BUCKET` / `S3_REGION` / `S3_ACCESS_KEY_ID` / `S3_SECRET_ACCESS_KEY` (and `S3_ENDPOINT` for Cloudflare R2 or another S3-compatible provider) in the backend's Railway variables to switch uploads to cloud storage — no code changes needed. Leave `STORAGE_DRIVER` unset to keep local disk (fine for testing, not for production).

7. Note your backend's public URL, e.g. `https://al-sharqiyat-backend.up.railway.app`.

---

## Part 2 — Frontend on Vercel

1. **Import project** on vercel.com → New Project → select the repo → set **root directory to `frontend/`**.

2. **Environment variables** (Project Settings → Environment Variables), for Production (and Preview if desired):
   - `NEXT_PUBLIC_API_URL` = `https://al-sharqiyat-backend.up.railway.app/api`
   - `NEXT_PUBLIC_SITE_URL` = your real Vercel/custom domain, e.g. `https://al-sharqiyat.vercel.app` (used by sitemap.xml, robots.txt, and Open Graph tags)
   - `NEXT_PUBLIC_ADMIN_WHATSAPP` = real WhatsApp number
   - `NEXT_PUBLIC_SITE_NAME` = `الشرقيات`
   - `NEXT_PUBLIC_SENTRY_DSN` = from sentry.io, if you want browser/SSR error monitoring (leave empty to disable)

3. Vercel auto-detects Next.js (`frontend/vercel.json` pins the framework/build command explicitly). Click **Deploy**.

4. Once live, go back to Railway and set `CLIENT_URL` to the real Vercel domain (this is what backend CORS checks against), then redeploy the backend so CORS picks it up.

---

## Part 3 — Post-deploy checklist

- [ ] Visit `/admin/login` on the Vercel domain and confirm login works end-to-end (validates CORS + JWT + DB all connected correctly)
- [ ] Confirm `https://<backend>/health` returns `{ "status": "ok" }`
- [ ] Confirm HTTPS is enforced on both domains (Vercel/Railway provide this by default)
- [ ] Rotate `JWT_SECRET` and `ADMIN_PASSWORD` away from any placeholder values
- [ ] Set up managed Postgres backups (Railway supports scheduled backups on paid plans)
- [ ] Move `/uploads` to S3/Cloudinary before relying on product images long-term
- [ ] Add a status/uptime monitor (e.g. UptimeRobot) pointed at `/health`

---

## Local production build test (optional, before deploying)

```bash
# Backend
cd backend
npm install
npm run build
npx prisma migrate deploy
npm start

# Frontend (separate terminal)
cd frontend
npm install
npm run build
npm start
```
