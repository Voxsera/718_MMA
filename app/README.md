# 📱 718 MMA — Member App (Expo / React Native)

Member-exclusive app: only accounts with an **active membership** can use it. Includes class
schedule + booking/waitlist, on-demand video library (favorites, continue-watching, offline
download), diet plans from coaches, events with reminders, membership status + one-tap renew +
receipts, and in-app / local notifications (incl. "gym closed today").

It talks to the **same backend + Supabase database** as the website.

## Run it on your phone (no app store needed)

1. **Start the backend** (in the project root, not this folder):
   ```
   npm start          # API on http://localhost:3000 (needs DATABASE_URL set)
   ```
2. **Find your PC's LAN IP** (phone + PC must be on the SAME Wi-Fi):
   - Windows: run `ipconfig` → look for **IPv4 Address**, e.g. `192.168.1.5`
3. **Point the app at it:** edit `app/src/config.js` →
   ```js
   export const API_URL = 'http://192.168.1.5:3000';   // your IP, NOT localhost
   ```
4. **Install + start Expo** (in this `app/` folder):
   ```
   cd app
   npm install
   npx expo start
   ```
5. On your phone, install **Expo Go** (Play Store / App Store), then **scan the QR code**
   shown in the terminal. The app loads live on your device.

> Can I run it on my own phone locally? **Yes** — that's exactly what Expo Go does. No build,
> no store upload. (To later publish to the stores you'd run `eas build`.)

## Test the gate
- Log in with an account that has an active membership → full app.
- Log in with an account with no membership → "Membership Required" screen with a Renew button.
- Create the membership on the website (mock or live Razorpay), then tap "I already paid — refresh".

## Notifications
Uses **local/in-app notifications** (work in Expo Go): "gym closed today", booking confirmations,
and event reminders you set. True remote push (when app is closed) needs an EAS dev build — a later step.

## Google sign-in (optional)
Email/password works out of the box. For Google in the app, create OAuth client IDs in Google
Cloud Console (Web + Android + iOS) and paste them into `app/src/config.js`. Leave blank to hide
the Google button.

## Notes
- Videos stream from their URL; "Save" downloads for offline playback (expo-file-system).
- Renew opens the website's Memberships page in the browser (Razorpay web checkout) — no native
  payment SDK needed.
