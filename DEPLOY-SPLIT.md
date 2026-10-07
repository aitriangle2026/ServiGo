# Deploying ServiGo — backend on Render, frontend on Hostinger

Use this when the Hostinger plan is **Cloud Startup / Cloud Professional /
Premium Web Hosting** — i.e. shared hosting, not a VPS. Those plans serve
static files and PHP, but can't keep a Node.js process alive and don't
support WebSockets, so the backend has to live somewhere else.

(If you later get a **VPS** — a plan named KVM 1/2/4 — use `DEPLOY.md`
instead and put everything on the one server.)

```
Browser
  ├── https://your-domain.com            → Hostinger   (React build, static)
  └── https://servigo-api.onrender.com   → Render      (Node + Socket.IO)
                                              │
                                              └──→ MongoDB Atlas
```

The two halves are joined by exactly two settings:

| Setting | Lives in | Value |
|---|---|---|
| `VITE_API_BASE_URL` | frontend build | `https://servigo-api.onrender.com/api/v1` |
| `CLIENT_URL` | Render env vars | `https://your-domain.com` |

Get either one wrong and the browser blocks every request with a CORS error.

---

## Part 1 — Backend on Render

### 1.1 Push to GitHub

Render deploys from a repository. Make sure `.env` is **not** committed —
check that `.gitignore` covers it.

### 1.2 Create the service

[dashboard.render.com](https://dashboard.render.com) → **New** → **Web Service**
→ connect the repo, then:

| Field | Value |
|---|---|
| Root Directory | `backend` |
| Environment | Node |
| Build Command | `npm install` |
| Start Command | `npm start` |
| Instance Type | Free |

Root Directory **must** be `backend` — the repo has `backend/` and
`frontend/` side by side, and Render otherwise looks for `package.json` at
the top level and fails.

### 1.3 Environment variables

Add these under **Environment** (see `backend/.env.example` for the full
annotated list):

```
MONGODB_URI             mongodb+srv://...
CLIENT_URL              https://your-domain.com
JWT_SECRET              <generate a new one>
JWT_EXPIRES_IN          15m
JWT_REFRESH_SECRET      <generate a new one>
JWT_REFRESH_EXPIRES_IN  7d
CLOUDINARY_CLOUD_NAME   ...
CLOUDINARY_API_KEY      ...
CLOUDINARY_API_SECRET   ...
EMAIL_HOST              smtp.gmail.com
EMAIL_PORT              587
EMAIL_USER              ...
EMAIL_PASSWORD          <Gmail App Password, not the account password>
EMAIL_FROM              ServiGo <no-reply@your-domain.com>
COMMISSION_RATE         0.1
```

Generate fresh JWT secrets — don't reuse the development ones:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

**Don't set `PORT`.** Render injects its own, and `server.js` already reads
`process.env.PORT`.

Don't have the final domain yet? Put a placeholder in `CLIENT_URL` now and
correct it later — changing it only takes a redeploy.

### 1.4 Allow Render in MongoDB Atlas

Atlas → **Network Access** → **Add IP Address** → `0.0.0.0/0`.

Render's free tier doesn't give you a fixed outbound IP, so there's nothing
narrower to allowlist. Make the database password long and random to
compensate. On a VPS you'd allowlist that one IP instead.

### 1.5 Deploy and check

Render builds and gives you a URL like `https://servigo-api.onrender.com`.
Open it — you should see:

```json
{ "success": true, "message": "🚀 Service Marketplace API is running..." }
```

Then open **Logs** and confirm `✅ MongoDB Connected Successfully`.
A timeout here means step 1.4 wasn't done.

---

## Part 2 — Frontend on Hostinger

### 2.1 Build with the Render URL baked in

```bash
cd frontend
VITE_API_BASE_URL=https://servigo-api.onrender.com/api/v1 npm run build
```

Windows PowerShell:

```powershell
$env:VITE_API_BASE_URL="https://servigo-api.onrender.com/api/v1"; npm run build
```

`VITE_*` values are compiled into the bundle, **not** read at runtime — so
any time this URL changes you must rebuild and re-upload. Skip it and the
deployed site will call `localhost:5000` from your visitors' browsers.

The Socket.IO URL is derived from this automatically (`src/lib/socket.js`
strips the `/api/v1` suffix), so there's nothing separate to configure for
real-time notifications.

### 2.2 Upload

hPanel → **Files** → **File Manager** → open `public_html`.

1. Delete whatever is already there (Hostinger's default placeholder page).
2. Upload **everything inside `frontend/dist/`** — the *contents*, not the
   `dist` folder itself. `index.html` must sit directly in `public_html`.

Easiest route: zip the contents, upload the zip, then use File Manager's
**Extract**.

### 2.3 Confirm `.htaccess` made it

`frontend/public/.htaccess` is copied into `dist/` at build time, so it
uploads with everything else — but File Manager hides dotfiles by default.
Turn on **Show hidden files** (settings icon, top right) and check
`public_html/.htaccess` exists.

Without it, `https://your-domain.com` works but refreshing on
`/services/123` returns **404**, because Apache looks for a folder that
doesn't exist. The file also sets caching and compression.

---

## Part 3 — Join them up

1. Point the domain at Hostinger (hPanel → **Domains**). If it's registered
   elsewhere, set the nameservers Hostinger shows you.
2. hPanel → **SSL** → issue the free certificate and enable **Force HTTPS**.
3. Set `CLIENT_URL` in Render to the exact final URL — scheme included, no
   trailing slash:
   - ✅ `https://your-domain.com`
   - ❌ `https://your-domain.com/`
   - ❌ `your-domain.com`
4. Serving both `example.com` and `www.example.com`? List both,
   comma-separated: `https://example.com,https://www.example.com`

HTTPS isn't optional — browsers refuse insecure WebSocket connections from
an HTTPS page, which would break the live notifications.

---

## Test it works

1. `https://your-domain.com` loads
2. Navigate to a service, then **refresh** — still works (proves `.htaccess`)
3. Register and log in
4. Upload a profile image (Cloudinary)
5. Create a booking
6. **Real-time check:** log in as the provider in a second browser, accept
   the booking — the customer's tab should show a toast and the bell count
   should change **without a refresh**

Step 6 is the one that proves the WebSocket path works end to end.

---

## The free-tier catch

Render's free instance **sleeps after ~15 minutes of inactivity**. The next
request wakes it, which takes roughly 50 seconds. During that window the
site loads (it's static on Hostinger) but logins and data hang.

Before a demo: open the Render URL a minute beforehand so it's already
awake.

Options if that's not acceptable: Render's paid Starter tier removes the
sleep, or move the backend to the VPS once there is one.

Note that a cron/uptime pinger to keep it awake is against Render's free
tier terms — upgrade rather than work around it.

---

## When something breaks

| Symptom | Cause |
|---|---|
| CORS error in the console | `CLIENT_URL` on Render doesn't exactly match the site's origin |
| Requests go to `localhost:5000` | Built without `VITE_API_BASE_URL` — rebuild and re-upload |
| 404 when refreshing an inner page | `.htaccess` missing from `public_html` (hidden file) |
| First request after a pause hangs | Free instance waking up — expected |
| Notifications need a refresh | Site not on HTTPS, or `CLIENT_URL` wrong |
| DB connection times out | Atlas → Network Access missing `0.0.0.0/0` |
| Render build fails | Root Directory isn't set to `backend` |

## Deploying an update

**Backend:** push to GitHub — Render redeploys automatically.

**Frontend:** rebuild and re-upload `dist/` contents:

```bash
cd frontend
VITE_API_BASE_URL=https://servigo-api.onrender.com/api/v1 npm run build
```
