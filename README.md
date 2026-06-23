# 🥊 718 MMA Gym — React + Vite site, Express API, Google auth, Razorpay (UPI)

Seven One Eight Active MMA · Shivarampally, Hyderabad.
A full-stack build inspired by fenriz-gym.com, in the 718 black-and-red theme — with a cinematic animated hero, Framer Motion animations, Google sign-in gated to paying members, Razorpay (UPI) payments, and an Admin CRM.

## Stack
- **Frontend:** React 18 + Vite, React Router, Framer Motion, @react-oauth/google
- **Backend:** Node + Express, **built-in `node:sqlite`** (no native build!), google-auth-library, jsonwebtoken, Razorpay
- **Admin CRM:** self-contained HTML/CSS/JS served at `/admin`

## Requirements
- **Node.js v22.5 or newer** (LTS 22 or 24). The database uses Node's built-in SQLite, so there is **nothing to compile** and `npm install` is fast. Check with `node -v`.

## Pages
Home (cinematic hero), Courses (MMA, Muay Thai, Kickboxing, Boxing, Jujutsu, BJJ, Wrestling, CrossFit), Personal Training, Memberships, Events (Past/Ongoing/Upcoming), Food (Swiggy/Zomato), Collaboration, Free Trial, About, Merchandise (coming soon), Physio/Rehab (coming soon), Member Login, Member Dashboard.

## Key features
- **Cinematic hero** — full-bleed photographic hero with a slow Ken Burns zoom, layered dark/red gradients and chevron motifs.
- **Google sign-in + member gate** — login only succeeds for an email with an **active (non-expired) membership**. Buying a membership creates/extends that membership automatically.
- **Razorpay with UPI** — checkout shows UPI first, plus cards/netbanking/wallets. Falls back to a safe **mock mode** without keys.
- **Admin CRM** at `/admin` — dashboard, move events `Upcoming → Ongoing → Past`, manage trials, collaborations, payments, members and plan prices.
- **Mobile responsive** throughout.

## Setup & run

```bash
# 1. Install everything (backend + client) and seed demo data
npm run setup        # = npm install && npm --prefix client install && npm run seed

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

### Google OAuth setup
1. Go to https://console.cloud.google.com/apis/credentials → **Create Credentials → OAuth client ID → Web application**.
2. **Authorized JavaScript origins:** add `http://localhost:5173` and `http://localhost:3000`.
3. Copy the **Client ID** and **Client Secret** into `.env`.
4. Sign-in only succeeds for an email that has an **active membership** — buy one first (Memberships page) using the same email, then log in.

### Razorpay (UPI)
- Add **test keys** from https://dashboard.razorpay.com (Test Mode) to `.env`. The checkout popup shows **UPI** first, plus cards, netbanking and wallets.
- Test UPI success VPA: `success@razorpay`.
- With placeholder keys, the app runs in **mock mode**: it simulates a successful payment, activates the membership (so you can test the Google login gate end-to-end), and logs it in the CRM.

## Membership → login flow
1. Visitor buys a plan on **Memberships** (or a PT package) with their email.
2. Payment success → server stores an active `user_membership` for that email (expiry by plan: Day 1d, Monthly 30d, Quarterly 90d, Annual 365d, PT 30d).
3. Visitor goes to **Login**, signs in with the Google account for that email → access granted to the member **Dashboard**.
4. Expired members are blocked until they renew.

## Notes
- Images load from Unsplash (need internet); they degrade gracefully if offline.
- `data.db` is created automatically. Re-running `npm run seed` resets demo content but keeps bookings/payments/members.

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

**`node:sqlite` not found:** upgrade to Node v22.5+ (`node -v`). Download LTS from https://nodejs.org.

## Deploying
See **DEPLOY.md** for a step-by-step guide (Render / Railway, with persistent SQLite).
