# Deploying ServiGo to a Hostinger VPS

Target: Ubuntu 22.04 / 24.04 VPS with root SSH access.

**This does not work on Hostinger's shared "Web Hosting" or "Cloud Hosting"
plans.** Those run PHP only — they can't keep a Node.js process alive and
don't support WebSockets, so the real-time notifications would not work.
Check hPanel: a **VPS** entry under *Dev tools* is what you need.

What runs where:

```
Browser ──HTTPS──> Nginx (VPS :80/:443)
                     ├── /          → frontend/dist   (static React build)
                     ├── /api/v1    → localhost:5000  (Node backend)
                     └── /socket.io → localhost:5000  (WebSocket)
                                           │
                                           └──> MongoDB Atlas (stays in the cloud)
```

---

## Before you start

| Need | Where from |
|---|---|
| Server IP | hPanel → VPS → Overview |
| Root password | hPanel → VPS → Settings → Root Password |
| Domain name | Must point at the server IP (A record) |
| Atlas: server IP allowlisted | Atlas → Network Access → Add IP Address |
| Credentials | See `backend/.env.example` |

DNS can take up to an hour to propagate. Do it first so it's ready by the
time you reach the SSL step.

---

## 1. Connect

```bash
ssh root@YOUR_SERVER_IP
```

## 2. Install Node.js, Nginx, PM2, Git

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt install -y nodejs nginx git
npm install -g pm2
```

Check: `node -v` should print v22.x.

## 3. Get the code

```bash
mkdir -p /var/www && cd /var/www
git clone YOUR_REPO_URL servigo
cd servigo
```

No Git remote? Upload the folder over SFTP instead — but **exclude
`node_modules`** from the upload and let step 4 install them.

## 4. Backend

```bash
cd /var/www/servigo/backend
npm install --omit=dev
cp .env.example .env
nano .env          # fill in real values, then Ctrl+O, Enter, Ctrl+X
```

Generate the two JWT secrets:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Set `CLIENT_URL=https://your-domain.com` — without it the browser blocks
every API call and the Socket.IO connection.

Verify it connects before going further:

```bash
node src/server.js
```

Expect `✅ MongoDB Connected Successfully`. Ctrl+C once you see it.

Times out instead? The server's IP isn't in Atlas → Network Access.

## 5. Run the backend under PM2

```bash
pm2 start src/server.js --name servigo-api
pm2 save
pm2 startup        # run the command it prints, so it survives a reboot
```

Useful later: `pm2 logs servigo-api`, `pm2 restart servigo-api`, `pm2 status`.

## 6. Build the frontend

```bash
cd /var/www/servigo/frontend
npm install
VITE_API_BASE_URL=https://your-domain.com/api/v1 npm run build
```

`VITE_*` values are baked in at build time, so changing it later means
rebuilding. Getting it wrong leaves the deployed site calling
`localhost:5000` from your visitors' browsers.

## 7. Nginx

```bash
nano /etc/nginx/sites-available/servigo
```

```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    root /var/www/servigo/frontend/dist;
    index index.html;

    # React Router owns the client-side routes, so unknown paths must fall
    # back to index.html instead of returning 404.
    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/v1 {
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # The Upgrade/Connection headers are what turn this into a WebSocket.
    # Without them Socket.IO silently falls back to slow polling, or fails —
    # and the live notifications stop arriving.
    location /socket.io/ {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_read_timeout 86400;
    }

    client_max_body_size 20M;   # chat/job-request attachments
}
```

```bash
ln -s /etc/nginx/sites-available/servigo /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx
```

## 8. HTTPS

```bash
apt install -y certbot python3-certbot-nginx
certbot --nginx -d your-domain.com -d www.your-domain.com
```

Not optional: browsers refuse insecure WebSocket connections from an HTTPS
page, and most will block a plain-HTTP site outright.

Certbot renews automatically. Confirm with `certbot renew --dry-run`.

## 9. Firewall

```bash
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw enable
```

Port 5000 stays closed to the internet on purpose — Nginx reaches the
backend over localhost.

---

## Test it works

1. `https://your-domain.com` loads
2. Register, then log in
3. Create a booking as a customer
4. **Real-time check:** log in as the provider in a second browser, accept
   the booking, and the customer's tab should show a toast and the bell
   count should change **without a refresh**
5. Upload a profile image (Cloudinary)
6. Trigger an OTP email

Step 4 is the one that proves the WebSocket proxy is right.

---

## When something breaks

| Symptom | Cause |
|---|---|
| 502 Bad Gateway | Backend isn't running — `pm2 status`, `pm2 logs servigo-api` |
| CORS error in console | `CLIENT_URL` missing/mismatched in `.env` (exact scheme, no trailing slash) |
| Notifications need a refresh | WebSocket proxy — recheck the `/socket.io/` block |
| DB connection times out | Server IP not in Atlas → Network Access |
| `MODULE_NOT_FOUND` on boot | A filename's letter-case doesn't match its import (Linux is case-sensitive) |
| API calls go to localhost | Frontend built without `VITE_API_BASE_URL` — rebuild |

## Deploying an update

```bash
cd /var/www/servigo && git pull
cd backend && npm install --omit=dev && pm2 restart servigo-api
cd ../frontend && npm install && VITE_API_BASE_URL=https://your-domain.com/api/v1 npm run build
```

Nginx serves the new `dist/` immediately — no reload needed.
