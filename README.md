# 🥊 718 MMA Gym — React + Vite site, Express API, Google auth, Razorpay (UPI)

Seven One Eight Active MMA · Shivarampally, Hyderabad.
A full-stack build inspired by fenriz-gym.com, in the 718 black-and-red theme — with a cinematic animated hero, Framer Motion animations, Google sign-in gated to paying members, Razorpay (UPI) payments, and an Admin CRM.

## Stack
- **Frontend:** React 18 + Vite, React Router, Framer Motion, @react-oauth/google
- **Backend:** Node + Express, **Supabase (PostgreSQL)** via `pg`, google-auth-library, jsonwebtoken, Razorpay
- **Admin CRM:** self-contained HTML/CSS/JS served at `/admin`

## Requirements
- **Node.js v18 or newer.**
- A **Supabase** project (free) for the PostgreSQL database — its connection string goes in `DATABASE_URL`.

## Pages
Home (cinematic hero), Courses (MMA, Muay Thai, Kickboxing, Boxing, Jujutsu, BJJ, Wrestling, CrossFit), Personal Training, Memberships, Events (Past/Ongoing/Upcoming), Food (Swiggy/Zomato), Collaboration, Free Trial, About, Merchandise (coming soon), Physio/Rehab (coming soon), Member Login, Member Dashboard.

## Key features
- **Cinematic hero** — full-bleed photographic hero with a slow Ken Burns zoom, layered dark/red gradients and chevron motifs.
- **Accounts** — email/password **or** Google sign-in. Buying a membership is gated behind login and attaches to the account; the same credentials will work in the mobile app. An active membership unlocks member-only features.
- **Razorpay with UPI** — checkout shows UPI first, plus cards/netbanking/wallets. Falls back to a safe **mock mode** without keys.
- **Admin CRM** at `/admin` — dashboard, move events `Upcoming → Ongoing → Past`, manage trials, collaborations, payments, members and plan prices.
- **Mobile responsive** throughout.

## Setup & run

```bash
# 0. Set DATABASE_URL in .env (your Supabase connection string) first!

# 1. Install everything (backend + client)
npm run setup        # = npm install && npm --prefix client install

# 2a. Development (two terminals)
npm start            # API on http://localhost:3000  (also serves /admin)
npm run client       # React dev server on http://localhost:5173  (proxies /api → 3000)

# 2b. Production (single server)
npm run build        # builds client/dist
npm start            # serves the built site + API + admin at http://localhost:3000
```

Open:
- **Site (dev):** http://localhost:5173  ·  **Site (prod):** http://localhost:3000
- **Admin CRM:** http://localhost:3000/admin  (default `admin` / `718mma`)

## Configuration — copy `.env.example` to `.env`

```
PORT=3000
ADMIN_USERNAME=admin
ADMIN_PASSWORD=718mma
SESSION_SECRET=long-random-string
JWT_SECRET=another-long-random-string
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
RAZORPAY_KEY_ID=rzp_test_xxxx
RAZORPAY_KEY_SECRET=xxxx
```

The React client reads the Google Client ID from the server via `/api/config`, so setting `GOOGLE_CLIENT_ID` in the root `.env` is enough. (Optionally set `VITE_GOOGLE_CLIENT_ID` in `client/.env`.)

### Supabase (database)
1. Create a free project at https://supabase.com.
2. **Project → Settings → Database → Connection string → URI**. Copy it and put it in `.env` as `DATABASE_URL` (replace `[PASSWORD]` with your DB password). The connection **pooler** URI (port 6543) is recommended for hosting.
3. That's it — tables are created automatically on first run, and demo content seeds itself if the DB is empty. (Run `npm run seed` anytime to reset demo content.)

### Google OAuth setup
1. Go to https://console.cloud.google.com/apis/credentials → **Create Credentials → OAuth client ID → Web application**.
2. **Authorized JavaScript origins:** add `http://localhost:5173` and `http://localhost:3000`.
3. Copy the **Client ID** and **Client Secret** into `.env`.
4. Sign-in only succeeds for an email that has an **active membership** — buy one first (Memberships page) using the same email, then log in.

### Razorpay (UPI)
- Add **test keys** from https://dashboard.razorpay.com (Test Mode) to `.env`. The checkout popup shows **UPI** first, plus cards, netbanking and wallets.
- Test UPI success VPA: `success@razorpay`.
- With placeholder keys, the app runs in **mock mode**: it simulates a successful payment, activates the membership (so you can test the Google login gate end-to-end), and logs it in the CRM.

## Account → membership → app flow (account-first)
1. Visitor **creates an account** (email + password) or **signs in with Google** on the website.
2. While logged in, they **buy a membership** (or PT package) → it attaches to their account (expiry by plan: Day 1d, Monthly 30d, Quarterly 90d, Annual 365d, PT 30d).
3. The **same email + password** logs into the website member area **and the upcoming 718 mobile app**.
4. Login is open to anyone; an **active membership** unlocks member-only features. Buying is gated behind login, so every payment is tied to a real account.

## Notes
- Images load from Unsplash (need internet); they degrade gracefully if offline.
- Tables are created automatically on first boot. `npm run seed` resets demo content (courses/events/etc.) but keeps bookings, payments, users and memberships.

## Troubleshooting

**`npm install` hangs on `better-sqlite3` / `node-gyp`:** This project no longer uses better-sqlite3. If you have an old install, clean it:
```bash
# (Windows) press Ctrl+C to stop the stuck install, then:
rmdir /s /q node_modules
del package-lock.json
npm install        # now fast - no native compilation
npm run seed
npm start
```

**`DATABASE_URL is not set`:** add your Supabase connection string to `.env` (or the host's env vars).

**Connection/SSL errors to Supabase:** make sure you used the **pooler** URI; the app already enables SSL for non-localhost connections.

## Deploying
See **DEPLOY.md** for a step-by-step guide (Render / Railway, with persistent SQLite).
