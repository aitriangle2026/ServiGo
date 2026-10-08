# ServiGo

A service marketplace connecting customers with verified local professionals in
Sri Lanka. Customers browse services, book a slot, chat with the provider, pay,
and review. Providers list services, get verified, manage bookings and get paid
through an admin-vetted escrow flow.

---

## Stack

| | |
|---|---|
| **Backend** | Node 22, Express 5, Mongoose 9, Socket.IO, MongoDB Atlas |
| **Frontend** | React 19, Vite 8, Tailwind 4, Framer Motion, React Router 7 |
| **Media** | Cloudinary (images, chat attachments, voice notes) |
| **Email** | Nodemailer (OTP, password reset) |

```bash
# backend  → http://localhost:5000
cd backend && npm install && npm run dev

# frontend → http://localhost:5173
cd frontend && npm install && npm run dev
```

Copy `backend/.env.example` to `backend/.env` and fill it in. Only the 13
variables listed there are actually read by the code.

---

## Design system

Defined once in `frontend/src/index.css` as `@theme` tokens. **Use the tokens,
never raw Tailwind palette classes** (`bg-blue-600`, `text-slate-700`), or the
page won't follow a future rebrand.

| Token | Value | Use |
|---|---|---|
| `--color-primary` | `#3A5A40` | Forest green — every action |
| `--color-secondary` | `#1F2A22` | Headings, dark buttons |
| `--color-background` | `#F7F4EE` | Warm cream page |
| `--color-surface-warm` | `#F0EBE2` | Inset panels, hero bands |
| `--color-accent` | `#C8901F` | Stars, "available tomorrow" |
| `--font-display` | Playfair Display | Headlines (serif) |
| `--font-body` | Inter | Everything else |

Currency is **LKR** throughout, via `utils/formatCurrency.js`.

### Page conventions

- Serif headline with one italic green word — `You're <em>almost</em> there.`
- Uppercase tracked eyebrow (`.22em`) followed by a short rule
- Hero photos bleed behind a gradient scrim. **The image and its scrim must
  live in the same box** — a full-width scrim over a part-width photo leaves a
  hard vertical seam at the photo's edge.
- Grid children need `min-w-0`. CSS Grid defaults to `min-width: auto`, so one
  `auto` column will starve its siblings and overflow the container.
- Effects must not call `setState` synchronously — the repo's lint config
  rejects it. Use `queueMicrotask`, or derive the value instead of mirroring
  props into state.

---

## What works

### Public pages (redesigned)
`/` · `/services` · `/services/:id` · `/find-pros` · `/providers/:id` ·
`/how-it-works` · `/book/:serviceId` · `/booking/:bookingId/confirmed`

Services and Find Pros share a full-height left filter rail (`FilterSidebar`)
with an apply-model — ticking five boxes fires one request, not five — and
applying scrolls the results into view.

### Booking
Slot picker backed by real availability, saved addresses, payment method, and a
confirmation screen with a readable booking reference.

### Real-time notifications
39-type catalog in `backend/src/config/notificationTypes.js` is the single
source of truth — the Mongoose enum derives from it, and the service refuses to
send a type to an audience it isn't declared for.

Flow: persist to Mongo → emit to the recipient's private Socket.IO room →
`NotificationContext` (mounted once above all routes) updates the bell, the list
and fires a toast. One socket, no polling, no per-page listeners. Deduped by
`_id`, and a reconnect refetches anything missed while offline.

32 triggers are wired (booking lifecycle, payments, reviews, verification,
registrations). ~13 more are defined but dormant because their underlying
feature doesn't exist yet — see **Known gaps**.

### Escrow / invoices
Chat → provider sends invoice → admin vets it → customer approves and pays →
commission snapshotted → admin releases payout. "Request a Quote" and "Custom
Request" both route into this.

### Job Requests
Customer posts a job → matched providers (same category + country) are notified
in real time. `Proposal` model exists but the submit/accept flow is not built.

---

## Known gaps — don't invent data for these

| Gap | Why |
|---|---|
| **No map anywhere** | No lat/lng in the schema. Location shows city + radius + area chips instead. |
| **"On-time rate"** | Not computable — nothing records promised vs actual arrival. Replaced with `completionRate` = completed ÷ (completed + cancelled + rejected). |
| `tagline`, `faqs`, `inclusions`, `serviceAreas`, `introVideoUrl` | Fields exist and render, but are **empty** — no provider UI to fill them. Pages show honest fallbacks. |
| **Booking time format** | Bookings made before the slot picker store `"09:00"`; new ones store `"09:00 AM"`. The availability check matches exactly, so old bookings don't block slots. Needs a migration. |
| **Card payment** | Rendered disabled. Schema accepts `card` so no migration is needed later, but no gateway is connected. |
| **Availability / Service Type / Pro Type filters** | In the UI, nothing to filter on. No calendar model, no service-type or individual/company field. |
| **Provider stats like "120+ jobs"** | Counted live from Bookings. Real, but small — the designs show aspirational numbers. |
| **Homepage stats** | `8,400+` / `152,000+` are hardcoded from the design. Swap for real counts before launch. |

### Data inconsistency to fix
Providers currently have mismatched locations (one `country: "United Kingdom"`,
cities `""` / `"jaffna"` / `"Jaffna"`). The backend scopes results by the
logged-in customer's saved country **and** city — so a customer who sets their
location to Colombo will see **nothing**. Blank cities act as a wildcard, which
is the only reason it looks fine today.

---

## Still to do

1. **Verify the booking flow in a browser** — `/book/:serviceId` and the
   confirmation page are customer-only and were never seen rendered.
2. **Redesign remaining pages**: auth (login / register / OTP), customer /
   provider / admin dashboards, chat.
3. **Mobile nav for dashboards** — `components/layout/Sidebar.jsx` is
   `hidden lg:block` with no fallback, so below 1024px a logged-in user has no
   navigation at all. The public navbar already has a hamburger.
4. **Provider editor** for tagline / FAQs / inclusions / service areas.
5. **Admin tables** have no `overflow-x` wrapper — they break narrow screens.
6. **Proposal flow** — submit, accept, and the `Order` the JobRequest model's
   `awarded` status implies.
7. **Code splitting** — one ~750 KB bundle; every customer downloads the admin
   dashboard.

---

## Deployment

Prepared but not executed. See **`DEPLOY.md`** (single VPS) and
**`DEPLOY-SPLIT.md`** (backend on Render + frontend on Hostinger).

**The Hostinger plan is "Cloud Startup" — shared hosting.** It serves PHP and
static files only: no Node process, no SSH, no WebSockets. The backend cannot
run there. Either upgrade to a VPS (a `KVM` plan) or use the split deploy.

Already done for deployment:
- 20 filename case mismatches fixed (Windows resolves them, Linux doesn't —
  the server would have crashed on boot with `MODULE_NOT_FOUND`)
- CORS reads `CLIENT_URL` from env instead of a hardcoded placeholder
- Socket.IO CORS narrowed from `origin: "*"` to the same allowlist
- `backend/.env.example` documents the 13 variables actually used
- `engines: { node: ">=20" }` so hosts pick a correct runtime

Still needed: real `CLIENT_URL`, `VITE_API_BASE_URL` at build time, and the
server's IP allowlisted in Atlas → Network Access.

---

## Working notes

- Verify changes in the browser; say plainly when something couldn't be
  verified rather than implying it was.
- Don't fabricate numbers or features with no data behind them — render an
  honest fallback and flag it.
- Run `npm run build` and `npx eslint <changed files>` before calling something
  done.
- **Pre-existing lint errors** live in `RegisterForm`, `Navbar`,
  `ServiceDetail`, `FindPros`, `Services`, `AuthContext`, `CallContext`,
  `useFetch`, `useSocket`, `ChatRoom`, `Provider/Profile`,
  `Provider/Verification`, `ProviderDetail`, `SupportChatPanel`,
  `Confettiburst`. Don't claim those as newly introduced.
- If a Vite page shows no data but the API returns some, **check the browser
  console first** — a failed HMR reload looks exactly like a logic bug.
