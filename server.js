/**
 * 718 MMA Gym - Express API + server (Supabase / PostgreSQL).
 * Serves the React build (client/dist) + Admin CRM, and exposes a JSON API with
 * email/password + Google accounts, account-attached memberships, and Razorpay (UPI).
 */
require('dotenv').config();
const path = require('path');
const fs = require('fs');
const os = require('os');
const crypto = require('crypto');
const express = require('express');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const db = require('./db');
const multer = require('multer');
const { generateInvoicePdf } = require('./invoice');
const { sendInvoiceEmail, sendRenewalEmail, mailerReady } = require('./mailer');
const worldline = require('./worldline');
const wa = require('./whatsapp');
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 8 * 1024 * 1024 } });

// Supabase Storage (for diet screenshots / videos)
const SUPABASE_URL = (process.env.SUPABASE_URL || '').trim().replace(/\/+$/, '').replace(/\/rest\/v1$/, '').replace(/\/+$/, '');
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const STORAGE_BUCKET = process.env.SUPABASE_BUCKET || 'media';
async function uploadToStorage(buffer, filename, contentType) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) throw new Error('Supabase Storage not configured (set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY).');
  const safe = (filename || 'file').replace(/[^a-zA-Z0-9._-]/g, '');
  const objPath = `diet/${Date.now()}_${safe}`;
  const r = await fetch(`${SUPABASE_URL}/storage/v1/object/${STORAGE_BUCKET}/${objPath}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`, apikey: SUPABASE_SERVICE_ROLE_KEY, 'Content-Type': contentType || 'application/octet-stream', 'x-upsert': 'true' },
    body: buffer,
  });
  if (!r.ok) throw new Error('Storage upload failed: ' + (await r.text()));
  return `${SUPABASE_URL}/storage/v1/object/public/${STORAGE_BUCKET}/${objPath}`;
}

// Larger limit for video file uploads
const uploadBig = multer({ storage: multer.memoryStorage(), limits: { fileSize: 200 * 1024 * 1024 } });

// Local file storage fallback (used when Supabase Storage is not configured).
const UPLOADS_DIR = path.join(__dirname, 'uploads');
try { fs.mkdirSync(UPLOADS_DIR, { recursive: true }); } catch {}
function lanIp() {
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name] || []) {
      if (net.family === 'IPv4' && !net.internal) return net.address;
    }
  }
  return 'localhost';
}
function saveLocal(buffer, filename) {
  const safe = (filename || 'file').replace(/[^a-zA-Z0-9._-]/g, '');
  const name = `${Date.now()}_${safe}`;
  fs.writeFileSync(path.join(UPLOADS_DIR, name), buffer);
  return `http://${lanIp()}:${PORT}/uploads/${name}`;
}
async function storeFile(file, fallbackName) {
  if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) return uploadToStorage(file.buffer, file.originalname || fallbackName, file.mimetype);
  return saveLocal(file.buffer, file.originalname || fallbackName);
}

const app = express();
const PORT = process.env.PORT || 3000;

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '718mma';
const RECEPTION_USERNAME = process.env.RECEPTION_USERNAME || 'reception';
const RECEPTION_PASSWORD = process.env.RECEPTION_PASSWORD || '718front';
const COACH_USERNAME = process.env.COACH_USERNAME || 'coach';
const COACH_PASSWORD = process.env.COACH_PASSWORD || '718coach';
// Password login is OFF by default — admin portals use Google sign-in with an allow-list.
// Set ADMIN_PASSWORD_LOGIN=true in .env only for local/emergency access.
const ADMIN_PASSWORD_LOGIN = process.env.ADMIN_PASSWORD_LOGIN === 'true';
// Allow-list: which Google accounts get which portal. Comma-separated emails per role.
function adminRoleForEmail(email) {
  const e = String(email || '').toLowerCase().trim();
  if (!e) return null;
  const lists = {
    owner: process.env.ADMIN_OWNER_EMAILS || '',
    reception: process.env.ADMIN_RECEPTION_EMAILS || '',
    coach: process.env.ADMIN_COACH_EMAILS || '',
  };
  for (const [role, csv] of Object.entries(lists)) {
    const arr = csv.split(',').map((s) => s.toLowerCase().trim()).filter(Boolean);
    if (arr.includes(e)) return role;
  }
  return null;
}
const SESSION_SECRET = process.env.SESSION_SECRET || 'dev-secret-718';
const JWT_SECRET = process.env.JWT_SECRET || 'dev-jwt-718';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const googleClient = GOOGLE_CLIENT_ID ? new OAuth2Client(GOOGLE_CLIENT_ID) : null;

const RZP_KEY_ID = process.env.RAZORPAY_KEY_ID || 'rzp_test_xxxxxxxxxxxxxx';
const RZP_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || '';
const RZP_LIVE = RZP_KEY_ID.startsWith('rzp_') && !RZP_KEY_ID.includes('xxxx') && RZP_KEY_SECRET.length > 5;

let razorpay = null;
if (RZP_LIVE) {
  try {
    const Razorpay = require('razorpay');
    razorpay = new Razorpay({ key_id: RZP_KEY_ID, key_secret: RZP_KEY_SECRET });
  } catch (e) { console.warn('Razorpay SDK not initialised:', e.message); }
}

app.use(express.json());
app.use(cookieParser());

// Allow the Vite dev server (5173) to talk to the API with cookies in dev.
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && /^http:\/\/localhost:(5173|3000)$/.test(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.header('Access-Control-Allow-Methods', 'GET,POST,PATCH,DELETE,OPTIONS');
  }
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

// async error wrapper so a rejected promise becomes a clean 500 instead of crashing
const h = (fn) => (req, res) => Promise.resolve(fn(req, res)).catch((e) => {
  console.error(e);
  if (!res.headersSent) res.status(500).json({ error: 'Server error' });
});

// ----------------------------- Helpers -----------------------------------
// Days a plan grants. Handles "MMA — 6 Months", "MMA-12 M", "Combo-3M", "CFT-1M", "MMA-PT".
function planDuration(plan) {
  const p = String(plan || '').toLowerCase();
  const m = p.match(/(\d+)\s*m(?:onth)?s?\b/); // "12 m", "3m", "1 month"
  if (m) {
    const mo = parseInt(m[1], 10);
    if (mo === 12) return 365;
    if (mo === 6) return 180;
    if (mo === 3) return 90;
    if (mo === 1) return 30;
    return mo * 30;
  }
  if (/1\s*year|annual/.test(p)) return 365;
  if (/quarter/.test(p)) return 90;
  if (/day\s*pass/.test(p)) return 1;
  if (/\bpt\b|personal|training/.test(p)) return 30; // personal training ≈ 1 month
  return 30;
}
// How many whole months a plan grants (null if it isn't month-based, e.g. day pass).
function planMonths(plan) {
  const p = String(plan || '').toLowerCase();
  const m = p.match(/(\d+)\s*m(?:onth)?s?\b/);
  if (m) return parseInt(m[1], 10);
  if (/1\s*year|annual/.test(p)) return 12;
  if (/quarter/.test(p)) return 3;
  if (/\bpt\b|personal|training/.test(p)) return 1;
  return null;
}
// Add whole calendar months, keeping the day-of-month (clamps for short months: Jan 31 +1 => Feb 28/29).
function addMonths(date, n) {
  const d = new Date(date.getTime());
  const day = d.getDate();
  d.setMonth(d.getMonth() + n);
  if (d.getDate() < day) d.setDate(0);
  return d;
}
// Expiry from a start date: calendar months when the plan is month-based, else day-count.
function expiryFrom(start, plan, durationDays) {
  const base = (start instanceof Date && !isNaN(start)) ? start : new Date();
  if (durationDays) return new Date(base.getTime() + durationDays * 86400000);
  const months = planMonths(plan);
  if (months != null) return addMonths(base, months);
  return new Date(base.getTime() + planDuration(plan) * 86400000);
}
// Robust date parser for imported sheets: handles Excel serials, Date objects, ISO, US, and Indian DD-MM-YYYY.
function parseSheetDate(v) {
  if (v == null || v === '') return null;
  // Excel serial number (days since 1899-12-30) → fixed UTC calendar date (no timezone drift).
  if (typeof v === 'number' && isFinite(v) && v > 59 && v < 100000) {
    const d = new Date(Math.round((v - 25569) * 86400000) + 43200000); // noon UTC → day is stable in any timezone
    return isNaN(d) ? null : d;
  }
  if (v instanceof Date) {
    if (isNaN(v)) return null;
    // Normalise a timezone-shifted Date to a clean UTC calendar date.
    return new Date(Date.UTC(v.getUTCFullYear(), v.getUTCMonth(), v.getUTCDate(), 12));
  }
  const s = String(v).trim();
  const m = s.match(/^(\d{1,2})[-\/.](\d{1,2})[-\/.](\d{2,4})$/);
  if (m) {
    let a = +m[1], b = +m[2], y = +m[3]; if (y < 100) y += 2000;
    // Prefer DD-MM-YYYY (Indian). Fall back to MM-DD only when the first field can't be a day.
    let day = a, mon = b;
    if (a > 12 && b <= 12) { day = a; mon = b; }
    else if (b > 12 && a <= 12) { day = b; mon = a; }
    const d = new Date(y, mon - 1, day);
    return isNaN(d) ? null : d;
  }
  const d = new Date(s);
  return isNaN(d) ? null : d;
}
// Sequential member id like 718MMA2, 718MMA3 … (next = highest existing number + 1).
async function nextMemberId() {
  const r = await db.get("SELECT membership_id FROM user_memberships WHERE membership_id ~ '^718MMA[0-9]+$' ORDER BY substring(membership_id from 7)::int DESC LIMIT 1");
  const n = r && r.membership_id ? (parseInt(r.membership_id.slice(6), 10) || 0) : 0;
  return '718MMA' + (n + 1);
}
// Members keep the same id across renewals.
async function memberIdFor(email) {
  const r = await db.get("SELECT membership_id FROM user_memberships WHERE email=$1 AND COALESCE(membership_id,'')<>'' ORDER BY created_at LIMIT 1", [email]);
  return (r && r.membership_id) || await nextMemberId();
}
async function grantMembership(email, plan, amount, orderId, durationDays, session, method, name, phone) {
  if (!email) return null;
  const e = email.toLowerCase();
  const days = durationDays || planDuration(plan);
  // Renewals stack: extend from the current expiry if still active, else from now.
  const cur = await db.get("SELECT MAX(expires_at) m FROM user_memberships WHERE email=$1 AND expires_at > now()", [e]);
  const base = cur && cur.m ? new Date(cur.m).getTime() : Date.now();
  const expires = new Date(base + days * 86400000).toISOString();
  const memberId = await memberIdFor(e);
  await db.run('INSERT INTO user_memberships (email, name, phone, plan, amount, paid_amount, pending_amount, expires_at, razorpay_order_id, session, membership_id, method) VALUES ($1,$2,$3,$4,$5,$6,0,$7,$8,$9,$10,$11)',
    [e, name || '', phone || '', plan, amount, amount, expires, orderId || null, session || null, memberId, method || null]);
  return expires;
}
async function activeMembership(email) {
  if (!email) return null;
  return db.get("SELECT * FROM user_memberships WHERE email = $1 AND expires_at > now() ORDER BY expires_at DESC LIMIT 1",
    [email.toLowerCase()]);
}
// One-time: give any existing member without an ID a unique one (same id per email).
async function backfillMemberIds() {
  try {
    const emails = await db.all("SELECT email, MIN(created_at) mc FROM user_memberships WHERE COALESCE(membership_id,'')='' GROUP BY email ORDER BY mc");
    for (const row of emails) {
      const mid = await memberIdFor(row.email);
      await db.run("UPDATE user_memberships SET membership_id=$1 WHERE email=$2 AND COALESCE(membership_id,'')=''", [mid, row.email]);
    }
    if (emails.length) console.log(`[members] assigned IDs to ${emails.length} existing member(s)`);
  } catch (e) { console.error('[members] backfill failed:', e.message); }
}

// ----- Invoicing -----
function invoiceNoFor(id) {
  return `INV-${new Date().getFullYear()}-${String(id).padStart(4, '0')}`;
}
// Generate PDF + store on payment row + email it (best-effort, non-blocking).
async function issueInvoice(payment, expiresAt) {
  if (!payment) return { invoiceNo: null };
  const invoiceNo = payment.invoice_no || invoiceNoFor(payment.id);
  // GST is inclusive: the paid amount already contains 5% GST.
  const GST_RATE = 5;
  const total = payment.amount || 0;
  const gst = Math.round(total * GST_RATE / 100); // e.g. 10000 -> 500
  const base = total - gst;                        // fees -> 9500
  const mrow = await db.get("SELECT membership_id FROM user_memberships WHERE email=$1 AND COALESCE(membership_id,'')<>'' ORDER BY created_at DESC LIMIT 1", [payment.email]);
  const data = {
    invoiceNo, memberId: mrow ? mrow.membership_id : '', name: payment.name, email: payment.email, phone: payment.phone,
    plan: payment.plan, amount: total, base, gst, gstRate: GST_RATE, method: payment.method || 'online',
    paymentId: payment.razorpay_payment_id || null, date: payment.created_at || new Date(), expiresAt,
  };
  let pdf = null;
  try { pdf = await generateInvoicePdf(data); } catch (e) { console.error('[invoice] pdf failed:', e.message); }
  await db.run('UPDATE payments SET invoice_no=$1, invoice_pdf=$2 WHERE id=$3', [invoiceNo, pdf, payment.id]);
  sendInvoiceEmail(payment.email, data, pdf).catch((e) => console.error('[invoice] email failed:', e.message));
  if (payment.phone) wa.sendInvoiceWhatsApp(payment.phone, data).catch((e) => console.error('[invoice] whatsapp failed:', e.message));
  return { invoiceNo, pdf };
}
// Offline / admin-created paid membership: payment row + membership + invoice + email.
async function recordMembershipPayment({ name, email, phone, plan, amount, method, durationDays, session }) {
  const e = (email || '').toLowerCase();
  const amt = parseInt(amount, 10) || 0;
  const pay = await db.get(
    "INSERT INTO payments (name,email,phone,plan,amount,status,method,session) VALUES ($1,$2,$3,$4,$5,'paid',$6,$7) RETURNING *",
    [name || '', e, phone || '', plan || 'Membership', amt, method || 'offline', session || null]);
  const expires = await grantMembership(e, plan, amt, null, durationDays, session, method || 'offline', name, phone);
  const inv = await issueInvoice(pay, expires);
  return { payment: pay, expires, invoiceNo: inv.invoiceNo };
}

// Email members whose membership is nearing expiry: 7 / 3 / 1 days before, and on expiry.
// Deduped so each stage is sent once per membership. Runs on a daily-ish schedule.
async function sendRenewalReminders() {
  if (!mailerReady) return;
  const rows = await db.all(`
    SELECT DISTINCT ON (email) id, email, plan, session, expires_at,
      ((expires_at AT TIME ZONE 'Asia/Kolkata')::date - (now() AT TIME ZONE 'Asia/Kolkata')::date) AS days_left
    FROM user_memberships
    WHERE expires_at > now() - interval '1 day'
    ORDER BY email, expires_at DESC`);
  const site = (process.env.SITE_URL || process.env.PUBLIC_BASE_URL || '').replace(/\/+$/, '');
  let sent = 0;
  for (const m of rows) {
    const dl = Number(m.days_left);
    let t = null;
    if (dl === 7) t = 7; else if (dl === 3) t = 3; else if (dl === 1) t = 1; else if (dl <= 0) t = 0;
    if (t === null) continue;
    const already = await db.get('SELECT 1 FROM renewal_reminders WHERE membership_id=$1 AND days_before=$2', [m.id, t]);
    if (already) continue;
    const u = await db.get('SELECT name FROM users WHERE email=$1', [m.email]);
    const ph = await db.get("SELECT phone FROM payments WHERE email=$1 AND COALESCE(phone,'')<>'' ORDER BY created_at DESC LIMIT 1", [m.email]);
    const data = { name: u ? u.name : '', plan: m.plan, session: m.session, expiresAt: m.expires_at, daysLeft: dl, renewUrl: site ? site + '/memberships' : '' };
    const r = await sendRenewalEmail(m.email, data);
    if (ph && ph.phone) wa.sendRenewalWhatsApp(ph.phone, data).catch((e) => console.error('[reminders] whatsapp failed:', e.message));
    if (r.ok) { await db.run('INSERT INTO renewal_reminders (email, membership_id, days_before) VALUES ($1,$2,$3)', [m.email, m.id, t]).catch(() => {}); sent++; }
  }
  if (sent) console.log(`[reminders] sent ${sent} renewal email(s)`);
  return sent;
}
function makeAdminToken(role) {
  const payload = `admin.${role || 'owner'}.${Date.now()}`;
  const sig = crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('hex');
  return `${Buffer.from(payload).toString('base64')}.${sig}`;
}
// Returns { role } if valid, else null.
function verifyAdminToken(token) {
  if (!token) return null;
  const [b64, sig] = token.split('.');
  if (!b64 || !sig) return null;
  const payload = Buffer.from(b64, 'base64').toString();
  const expected = crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('hex');
  let ok = false;
  try { ok = crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected)); } catch { ok = false; }
  if (!ok) return null;
  const parts = payload.split('.'); // ['admin', role, timestamp]
  return { role: ['reception', 'coach'].includes(parts[1]) ? parts[1] : 'owner' };
}
function adminInfo(req) {
  const token = req.cookies.admin_token || (req.headers.authorization || '').replace('Bearer ', '');
  return verifyAdminToken(token);
}
function requireAdmin(req, res, next) {
  const info = adminInfo(req);
  if (info) { req.adminRole = info.role; return next(); }
  return res.status(401).json({ error: 'Unauthorized' });
}
// Owner-only (money: payments, plan pricing).
function requireOwner(req, res, next) {
  const info = adminInfo(req);
  if (info && info.role === 'owner') { req.adminRole = 'owner'; return next(); }
  return res.status(403).json({ error: 'Owner access required.' });
}
function currentUser(req) {
  const token = req.cookies.user_token || (req.headers.authorization || '').replace('Bearer ', '');
  if (!token) return null;
  try { return jwt.verify(token, JWT_SECRET); } catch { return null; }
}
function hashPassword(pw) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(pw, salt, 64).toString('hex');
  return salt + ':' + hash;
}
function verifyPassword(pw, stored) {
  if (!stored || !stored.includes(':')) return false;
  const [salt, hash] = stored.split(':');
  const x = crypto.scryptSync(pw, salt, 64).toString('hex');
  try { return crypto.timingSafeEqual(Buffer.from(x, 'hex'), Buffer.from(hash, 'hex')); } catch { return false; }
}
function issueUserSession(res, user) {
  const token = jwt.sign({ email: user.email, name: user.name, picture: user.picture || '' }, JWT_SECRET, { expiresIn: '30d' });
  res.cookie('user_token', token, { httpOnly: true, sameSite: 'lax', maxAge: 30 * 86400 * 1000 });
  return token;
}
function requireUser(req, res, next) {
  const u = currentUser(req);
  if (!u) return res.status(401).json({ error: 'Please log in to continue.' });
  req.user = u;
  next();
}
// Member gate: logged in AND has an active membership (the app's exclusive content).
function requireMember(req, res, next) {
  const u = currentUser(req);
  if (!u) return res.status(401).json({ error: 'Please log in to continue.' });
  activeMembership(u.email).then((m) => {
    if (!m) return res.status(403).json({ error: 'membership_required', message: 'An active 718 membership is required.' });
    req.user = u; req.membership = m; next();
  }).catch((e) => { console.error(e); res.status(500).json({ error: 'Server error' }); });
}
async function getSetting(key) { const r = await db.get('SELECT value FROM app_settings WHERE key=$1', [key]); return r ? r.value : null; }
async function setSetting(key, value) {
  await db.run('INSERT INTO app_settings (key,value) VALUES ($1,$2) ON CONFLICT (key) DO UPDATE SET value=$2', [key, value]);
}

// ----------------------------- Config + content --------------------------
// The 4 daily training sessions members choose from.
const SESSIONS = [
  'Session 1 · 6:30–8:00 AM',
  'Session 2 · 8:00–9:30 AM',
  'Session 3 · 6:30–8:00 PM',
  'Session 4 · 8:00–9:30 PM',
];
app.get('/api/config', (req, res) =>
  res.json({ googleClientId: GOOGLE_CLIENT_ID, razorpayKey: RZP_KEY_ID, razorpayLive: RZP_LIVE, sessions: SESSIONS, adminPasswordLogin: ADMIN_PASSWORD_LOGIN, terminalEnabled: worldline.worldlineReady }));
app.get('/api/sessions', (req, res) => res.json(SESSIONS));
// Keep-alive: touches the DB so a single ping keeps Render awake AND Supabase from pausing.
app.get('/api/keepalive', h(async (req, res) => {
  try { await db.get('SELECT 1 AS ok'); res.json({ ok: true, ts: new Date().toISOString() }); }
  catch (e) { res.status(500).json({ ok: false }); }
}));

app.get('/api/courses', h(async (req, res) => res.json(await db.all('SELECT * FROM courses ORDER BY sort'))));
app.get('/api/memberships', h(async (req, res) => res.json(await db.all('SELECT * FROM memberships ORDER BY sort'))));
app.get('/api/trainers', h(async (req, res) => res.json(await db.all('SELECT * FROM trainers ORDER BY id'))));
app.get('/api/foods', h(async (req, res) => res.json(await db.all('SELECT * FROM foods ORDER BY id'))));
app.get('/api/reviews', h(async (req, res) => res.json(await db.all('SELECT * FROM reviews ORDER BY id'))));
// Auto-set event status from its date (IST): future=upcoming, today=ongoing, past=past.
// Only touches rows with a valid YYYY-MM-DD date; undated events keep their manual status.
async function reconcileEventStatuses() {
  try {
    await db.run(`UPDATE events SET status = CASE
        WHEN event_date::date > (now() AT TIME ZONE 'Asia/Kolkata')::date THEN 'upcoming'
        WHEN event_date::date = (now() AT TIME ZONE 'Asia/Kolkata')::date THEN 'ongoing'
        ELSE 'past' END
      WHERE event_date ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$'
        AND status IS DISTINCT FROM (CASE
        WHEN event_date::date > (now() AT TIME ZONE 'Asia/Kolkata')::date THEN 'upcoming'
        WHEN event_date::date = (now() AT TIME ZONE 'Asia/Kolkata')::date THEN 'ongoing'
        ELSE 'past' END)`);
  } catch (e) { console.error('[events] reconcile failed:', e.message); }
}
app.get('/api/events', h(async (req, res) => {
  await reconcileEventStatuses();
  const { status } = req.query;
  res.json(status
    ? await db.all('SELECT * FROM events WHERE status = $1 ORDER BY event_date', [status])
    : await db.all('SELECT * FROM events ORDER BY event_date'));
}));

app.post('/api/trial', h(async (req, res) => {
  const { name, email, phone, discipline, preferred_date, message } = req.body || {};
  if (!name || !phone) return res.status(400).json({ error: 'Name and phone are required.' });
  const row = await db.get('INSERT INTO trial_bookings (name,email,phone,discipline,preferred_date,message) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id',
    [name, email || '', phone, discipline || '', preferred_date || '', message || '']);
  res.json({ ok: true, id: row.id, message: 'Your free trial request is in! We will call you to confirm.' });
}));

app.post('/api/collaborate', h(async (req, res) => {
  const { name, organization, email, phone, type, message } = req.body || {};
  if (!name || !email) return res.status(400).json({ error: 'Name and email are required.' });
  const row = await db.get('INSERT INTO collaborations (name,organization,email,phone,type,message) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id',
    [name, organization || '', email, phone || '', type || '', message || '']);
  res.json({ ok: true, id: row.id, message: 'Thanks! Our team will reach out about your collaboration.' });
}));

// ----------------------------- Payments (Razorpay + UPI) ------------------
app.post('/api/payment/order', requireUser, h(async (req, res) => {
  const { plan, amount, phone, session } = req.body || {};
  const email = req.user.email;
  const name = req.user.name || '';
  const amt = parseInt(amount, 10);
  if (!amt || amt <= 0) return res.status(400).json({ error: 'Invalid amount.' });
  if (!session) return res.status(400).json({ error: 'Please choose a session.' });
  let order;
  if (razorpay) order = await razorpay.orders.create({ amount: amt * 100, currency: 'INR', receipt: `rcpt_${Date.now()}` });
  else order = { id: `order_mock_${Date.now()}`, amount: amt * 100, currency: 'INR', mock: true };
  await db.run('INSERT INTO payments (name,email,phone,plan,amount,razorpay_order_id,status,session) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)',
    [name, email, phone || '', plan || '', amt, order.id, 'created', session]);
  res.json({ order, key: RZP_KEY_ID, mock: !razorpay });
}));

app.post('/api/payment/verify', h(async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body || {};
  let verified = false;
  if (razorpay && razorpay_signature) {
    const expected = crypto.createHmac('sha256', RZP_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`).digest('hex');
    verified = expected === razorpay_signature;
  } else verified = true; // mock mode
  const pay = await db.get('SELECT * FROM payments WHERE razorpay_order_id = $1', [razorpay_order_id]);
  await db.run('UPDATE payments SET razorpay_payment_id = $1, status = $2 WHERE razorpay_order_id = $3',
    [razorpay_payment_id || 'mock_pay', verified ? 'paid' : 'failed', razorpay_order_id]);
  if (verified && pay) {
    const expires = await grantMembership(pay.email, pay.plan, pay.amount, razorpay_order_id, undefined, pay.session, pay.method || 'online');
    const fresh = await db.get('SELECT * FROM payments WHERE id=$1', [pay.id]);
    await issueInvoice(fresh, expires); // generates PDF + emails member
  }
  res.json({ ok: verified, email: pay ? pay.email : null });
}));

// ----------------------------- Member auth (account-first) ----------------
app.post('/api/auth/register', h(async (req, res) => {
  const { name, email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'Email and password are required.' });
  if (String(password).length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters.' });
  const e = String(email).toLowerCase().trim();
  const existing = await db.get('SELECT id, password_hash FROM users WHERE email = $1', [e]);
  if (existing && existing.password_hash) return res.status(409).json({ error: 'An account with this email already exists. Please log in.' });
  const ph = hashPassword(password);
  if (existing) await db.run('UPDATE users SET name=$1, password_hash=$2, last_login=now() WHERE email=$3', [name || '', ph, e]);
  else await db.run('INSERT INTO users (email,name,password_hash,last_login) VALUES ($1,$2,$3,now())', [e, name || '', ph]);
  const user = { email: e, name: name || '', picture: '' };
  const token = issueUserSession(res, user);
  res.json({ ok: true, user, token, membership: await activeMembership(e) });
}));

app.post('/api/auth/login', h(async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'Email and password are required.' });
  const e = String(email).toLowerCase().trim();
  const u = await db.get('SELECT * FROM users WHERE email = $1', [e]);
  if (!u || !verifyPassword(password, u.password_hash)) return res.status(401).json({ error: 'Invalid email or password.' });
  await db.run('UPDATE users SET last_login=now() WHERE email=$1', [e]);
  const user = { email: e, name: u.name, picture: u.picture || '' };
  const token = issueUserSession(res, user);
  res.json({ ok: true, user, token, membership: await activeMembership(e) });
}));

app.post('/api/auth/google', h(async (req, res) => {
  const { credential } = req.body || {};
  if (!credential) return res.status(400).json({ error: 'Missing Google credential.' });
  if (!googleClient) return res.status(500).json({ error: 'Google login is not configured. Set GOOGLE_CLIENT_ID in .env.' });
  let payload;
  try {
    const ticket = await googleClient.verifyIdToken({ idToken: credential, audience: GOOGLE_CLIENT_ID });
    payload = ticket.getPayload();
  } catch (e) { return res.status(401).json({ error: 'Invalid Google token.' }); }
  const email = (payload.email || '').toLowerCase();
  const existing = await db.get('SELECT id FROM users WHERE email = $1', [email]);
  if (existing) await db.run('UPDATE users SET name=$1, picture=$2, google_sub=$3, last_login=now() WHERE email=$4', [payload.name || '', payload.picture || '', payload.sub || '', email]);
  else await db.run('INSERT INTO users (email,name,picture,google_sub,last_login) VALUES ($1,$2,$3,$4,now())', [email, payload.name || '', payload.picture || '', payload.sub || '']);
  const user = { email, name: payload.name, picture: payload.picture };
  const token = issueUserSession(res, user);
  res.json({ ok: true, user, token, membership: await activeMembership(email) });
}));

app.get('/api/auth/me', h(async (req, res) => {
  const user = currentUser(req);
  if (!user) return res.status(401).json({ error: 'Not signed in' });
  res.json({ user: { email: user.email, name: user.name, picture: user.picture }, membership: await activeMembership(user.email) });
}));

app.post('/api/auth/logout', (req, res) => { res.clearCookie('user_token'); res.json({ ok: true }); });

// ----------------------------- Admin --------------------------------------
app.post('/api/admin/login', (req, res) => {
  if (!ADMIN_PASSWORD_LOGIN) return res.status(403).json({ error: 'Password login is disabled. Sign in with an authorized Google account.' });
  const { username, password } = req.body || {};
  let role = null;
  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) role = 'owner';
  else if (username === RECEPTION_USERNAME && password === RECEPTION_PASSWORD) role = 'reception';
  else if (username === COACH_USERNAME && password === COACH_PASSWORD) role = 'coach';
  if (role) {
    res.cookie('admin_token', makeAdminToken(role), { httpOnly: true, sameSite: 'lax', maxAge: 8 * 3600 * 1000 });
    return res.json({ ok: true, role });
  }
  res.status(401).json({ error: 'Invalid credentials.' });
});
// Admin portal login via Google — only allow-listed accounts, each mapped to a role.
app.post('/api/admin/google', h(async (req, res) => {
  const { credential } = req.body || {};
  if (!credential) return res.status(400).json({ error: 'Missing Google sign-in.' });
  if (!googleClient) return res.status(500).json({ error: 'Google sign-in is not configured on the server (set GOOGLE_CLIENT_ID).' });
  let payload;
  try {
    const ticket = await googleClient.verifyIdToken({ idToken: credential, audience: GOOGLE_CLIENT_ID });
    payload = ticket.getPayload();
  } catch (e) { return res.status(401).json({ error: 'Could not verify Google sign-in.' }); }
  const email = (payload.email || '').toLowerCase();
  const role = adminRoleForEmail(email);
  if (!role) return res.status(403).json({ error: `${email} is not authorized for the admin portal.` });
  res.cookie('admin_token', makeAdminToken(role), { httpOnly: true, sameSite: 'lax', maxAge: 8 * 3600 * 1000 });
  res.json({ ok: true, role, email });
}));
app.post('/api/admin/logout', (req, res) => { res.clearCookie('admin_token'); res.json({ ok: true }); });
app.get('/api/admin/me', requireAdmin, (req, res) => res.json({ ok: true, role: req.adminRole }));

app.get('/api/admin/summary', requireAdmin, h(async (req, res) => {
  await reconcileEventStatuses();
  const n = async (q) => (await db.get(q)).n;
  const owner = req.adminRole === 'owner';
  // Active members grouped by session — one member counted once (keyed by membership id, not email,
  // because many imported members share a blank email). Uses the latest membership's session.
  const sessRows = await db.all(`
    SELECT COALESCE(NULLIF(m.session,''),'Unassigned') s, COUNT(*)::int n FROM (
      SELECT DISTINCT ON (COALESCE(NULLIF(membership_id,''), NULLIF(email,''), id::text))
             session FROM user_memberships
      WHERE expires_at > now()
      ORDER BY COALESCE(NULLIF(membership_id,''), NULLIF(email,''), id::text), expires_at DESC
    ) m GROUP BY 1`);
  const sMap = {}; sessRows.forEach((r) => { sMap[r.s] = r.n; });
  const sessionCounts = SESSIONS.map((s) => ({ session: s, count: sMap[s] || 0 }));
  if (sMap['Unassigned']) sessionCounts.push({ session: 'Unassigned', count: sMap['Unassigned'] });
  res.json({
    role: req.adminRole,
    trials: await n('SELECT COUNT(*)::int n FROM trial_bookings'),
    newTrials: await n("SELECT COUNT(*)::int n FROM trial_bookings WHERE status='new'"),
    collaborations: await n('SELECT COUNT(*)::int n FROM collaborations'),
    newCollaborations: await n("SELECT COUNT(*)::int n FROM collaborations WHERE status='new'"),
    // Money stats are owner-only
    payments: owner ? await n("SELECT COUNT(*)::int n FROM payments WHERE status='paid'") : null,
    revenue: owner ? await n("SELECT COALESCE(SUM(amount),0)::int n FROM payments WHERE status='paid'") : null,
    members: await n("SELECT COUNT(DISTINCT COALESCE(NULLIF(membership_id,''), NULLIF(email,''), id::text))::int n FROM user_memberships WHERE expires_at > now()"),
    sessionCounts,
    events: await n('SELECT COUNT(*)::int n FROM events'),
    upcoming: await n("SELECT COUNT(*)::int n FROM events WHERE status='upcoming'"),
  });
}));

// Generic image upload (events, etc.) -> returns a public URL
app.post('/api/admin/upload-image', requireAdmin, upload.single('image'), h(async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No image provided.' });
  const url = await storeFile(req.file, 'image.jpg');
  res.json({ ok: true, url });
}));
app.get('/api/admin/events', requireAdmin, h(async (req, res) => { await reconcileEventStatuses(); res.json(await db.all('SELECT * FROM events ORDER BY event_date')); }));
app.post('/api/admin/events', requireAdmin, h(async (req, res) => {
  const { title, description, event_date, location, image, status } = req.body || {};
  if (!title) return res.status(400).json({ error: 'Title required.' });
  const row = await db.get('INSERT INTO events (title,description,event_date,location,image,status) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id',
    [title, description || '', event_date || '', location || '', image || '', status || 'upcoming']);
  res.json({ ok: true, id: row.id });
}));
app.patch('/api/admin/events/:id', requireAdmin, h(async (req, res) => {
  const { status, title, description, event_date, location, image } = req.body || {};
  const ev = await db.get('SELECT * FROM events WHERE id = $1', [req.params.id]);
  if (!ev) return res.status(404).json({ error: 'Not found.' });
  if (status && !['upcoming', 'ongoing', 'past'].includes(status)) return res.status(400).json({ error: 'Bad status.' });
  await db.run('UPDATE events SET status=$1, title=$2, description=$3, event_date=$4, location=$5, image=$6 WHERE id=$7',
    [status || ev.status, title ?? ev.title, description ?? ev.description, event_date ?? ev.event_date, location ?? ev.location, image ?? ev.image, req.params.id]);
  res.json({ ok: true });
}));
app.delete('/api/admin/events/:id', requireAdmin, h(async (req, res) => {
  await db.run('DELETE FROM events WHERE id = $1', [req.params.id]);
  res.json({ ok: true });
}));

app.get('/api/admin/trials', requireAdmin, h(async (req, res) => res.json(await db.all('SELECT * FROM trial_bookings ORDER BY created_at DESC'))));
app.post('/api/admin/trials', requireAdmin, h(async (req, res) => {
  const { name, phone, email, discipline, preferred_date, message, status } = req.body || {};
  if (!name) return res.status(400).json({ error: 'Name required.' });
  const row = await db.get('INSERT INTO trial_bookings (name,phone,email,discipline,preferred_date,message,status) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id',
    [name, phone || '', email || '', discipline || '', preferred_date || '', message || 'Walk-in / added by admin', status || 'new']);
  res.json({ ok: true, id: row.id });
}));
app.patch('/api/admin/trials/:id', requireAdmin, h(async (req, res) => { await db.run('UPDATE trial_bookings SET status = $1 WHERE id = $2', [req.body.status, req.params.id]); res.json({ ok: true }); }));
app.delete('/api/admin/trials/:id', requireAdmin, h(async (req, res) => { await db.run('DELETE FROM trial_bookings WHERE id=$1', [req.params.id]); res.json({ ok: true }); }));

app.get('/api/admin/collaborations', requireAdmin, h(async (req, res) => res.json(await db.all('SELECT * FROM collaborations ORDER BY created_at DESC'))));
app.post('/api/admin/collaborations', requireAdmin, h(async (req, res) => {
  const { name, organization, email, phone, type, message, status } = req.body || {};
  if (!name) return res.status(400).json({ error: 'Name required.' });
  const row = await db.get('INSERT INTO collaborations (name,organization,email,phone,type,message,status) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id',
    [name, organization || '', email || '', phone || '', type || '', message || '', status || 'new']);
  res.json({ ok: true, id: row.id });
}));
app.patch('/api/admin/collaborations/:id', requireAdmin, h(async (req, res) => { await db.run('UPDATE collaborations SET status = $1 WHERE id = $2', [req.body.status, req.params.id]); res.json({ ok: true }); }));
app.delete('/api/admin/collaborations/:id', requireAdmin, h(async (req, res) => { await db.run('DELETE FROM collaborations WHERE id=$1', [req.params.id]); res.json({ ok: true }); }));

app.get('/api/admin/payments', requireOwner, h(async (req, res) => res.json(await db.all('SELECT id,name,email,phone,plan,amount,status,method,invoice_no,created_at FROM payments ORDER BY created_at DESC'))));
// Download a stored invoice PDF (owner only)
app.get('/api/admin/payments/:id/invoice', requireOwner, h(async (req, res) => {
  const p = await db.get('SELECT * FROM payments WHERE id=$1', [req.params.id]);
  if (!p) return res.status(404).json({ error: 'Not found.' });
  let pdf = p.invoice_pdf;
  if (!pdf) { const inv = await issueInvoice(p, null); pdf = inv.pdf; } // regenerate if missing
  if (!pdf) return res.status(500).json({ error: 'Could not generate invoice.' });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="${p.invoice_no || 'invoice'}.pdf"`);
  res.send(Buffer.isBuffer(pdf) ? pdf : Buffer.from(pdf));
}));
app.get('/api/admin/members', requireAdmin, h(async (req, res) => res.json(await db.all('SELECT * FROM user_memberships ORDER BY expires_at DESC'))));
// Manually trigger renewal reminder emails now (owner only) — handy for testing.
app.post('/api/admin/reminders/run', requireOwner, h(async (req, res) => { const n = await sendRenewalReminders(); res.json({ ok: true, sent: n || 0, emailConfigured: mailerReady }); }));
// Human-readable "Mode of Payment": e.g. "₹6,000 Online + ₹2,000 Cash · ₹1,000 due"
function paymentModeNote(cash, online, pending) {
  const rup = (n) => '₹' + Number(n || 0).toLocaleString('en-IN');
  const parts = [];
  if (online > 0) parts.push(rup(online) + ' Online');
  if (cash > 0) parts.push(rup(cash) + ' Cash');
  let s = parts.join(' + ');
  if (pending > 0) s += (s ? ' · ' : '') + rup(pending) + ' due';
  return s || 'cash';
}
// Add a member (walk-in / offline). Captures date, cash+online split, and pending balance.
app.post('/api/admin/members', requireAdmin, h(async (req, res) => {
  const b = req.body || {};
  const name = (b.name || '').trim();
  const email = (b.email || '').toLowerCase().trim();
  const phone = (b.phone || '').trim();
  const plan = b.plan || 'Membership';
  const session = b.session || null;
  const total = parseInt(b.amount, 10) || 0;
  const cash = parseInt(b.cashAmount, 10) || 0;
  const online = parseInt(b.onlineAmount, 10) || 0;
  const discount = parseInt(b.discount, 10) || 0;
  const discountNote = (b.discountNote || '').trim();
  const paid = cash + online;
  const pending = Math.max(0, total - paid);
  let start = b.date ? new Date(b.date) : new Date();
  if (isNaN(start)) start = new Date();
  const startISO = start.toISOString();
  const durationDays = b.durationDays ? parseInt(b.durationDays, 10) : undefined;
  const expISO = expiryFrom(start, plan, durationDays).toISOString();
  let memberId = (b.membershipId || '').trim();
  if (!memberId && email) memberId = await memberIdFor(email);
  if (!memberId) memberId = await nextMemberId();
  const note = paymentModeNote(cash, online, pending);
  await db.run(`INSERT INTO user_memberships
     (email, name, phone, plan, amount, paid_amount, pending_amount, cash_amount, online_amount, discount, discount_note, starts_at, expires_at, session, membership_id, method)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)`,
    [email, name, phone, plan, total, paid, pending, cash, online, discount, discountNote || null, startISO, expISO, session, memberId, note]);
  const pay = await db.get(`INSERT INTO payments (name,email,phone,plan,amount,status,method,session,membership_id,note,bill_amount,due_amount,created_at) VALUES ($1,$2,$3,$4,$5,'paid',$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
    [name, email, phone, plan, paid, note, session, memberId, discountNote ? ('New membership · ' + discountNote) : 'New membership', total, pending, startISO]);
  let invoiceNo = null;
  if (email) { const inv = await issueInvoice(pay, expISO); invoiceNo = inv.invoiceNo; } // invoice only if we have an email
  res.json({ ok: true, memberId, expires: expISO, pending, invoiceNo, emailed: !!email && mailerReady });
}));
// Clear a member's pending (due) balance when they pay the rest later.
app.post('/api/admin/members/:id/clear-pending', requireAdmin, h(async (req, res) => {
  const m = await db.get('SELECT * FROM user_memberships WHERE id=$1', [req.params.id]);
  if (!m) return res.status(404).json({ error: 'Member not found.' });
  const b = req.body || {};
  const cash = parseInt(b.cashAmount, 10) || 0;
  const online = parseInt(b.onlineAmount, 10) || 0;
  const clear = (cash + online) || (parseInt(b.amount, 10) || 0);
  if (clear <= 0) return res.status(400).json({ error: 'Enter the amount received.' });
  let when = b.date ? new Date(b.date) : new Date(); if (isNaN(when)) when = new Date();
  const newPending = Math.max(0, (m.pending_amount || 0) - clear);
  const newCash = (m.cash_amount || 0) + cash;
  const newOnline = (m.online_amount || 0) + online;
  const newPaid = (m.paid_amount || 0) + clear;
  const note = paymentModeNote(newCash, newOnline, newPending);
  await db.run('UPDATE user_memberships SET paid_amount=$1, pending_amount=$2, cash_amount=$3, online_amount=$4, method=$5, pending_cleared_at=$6 WHERE id=$7',
    [newPaid, newPending, newCash, newOnline, note, newPending === 0 ? when.toISOString() : null, req.params.id]);
  await db.run("INSERT INTO payments (name,email,phone,plan,amount,status,method,session,membership_id,note,bill_amount,due_amount,created_at) VALUES ($1,$2,$3,$4,$5,'paid',$6,$7,$8,$9,$10,$11,$12)",
    [m.name || '', m.email || '', m.phone || '', m.plan || '', clear, paymentModeNote(cash, online, 0), m.session || null, m.membership_id || null, 'Balance payment', 0, newPending, when.toISOString()]);
  res.json({ ok: true, pending: newPending, clearedAt: newPending === 0 ? when.toISOString() : null });
}));
// Delete a member and ALL their data (memberships + payments) by membership id. Owner only.
app.delete('/api/admin/members/:id', requireOwner, h(async (req, res) => {
  const m = await db.get('SELECT email FROM user_memberships WHERE id=$1', [req.params.id]);
  if (!m) return res.status(404).json({ error: 'Member not found.' });
  await db.run('DELETE FROM user_memberships WHERE email=$1', [m.email]);
  await db.run('DELETE FROM payments WHERE email=$1', [m.email]);
  res.json({ ok: true, email: m.email });
}));
// Delete a single payment record. Owner only.
app.delete('/api/admin/payments/:id', requireOwner, h(async (req, res) => {
  await db.run('DELETE FROM payments WHERE id=$1', [req.params.id]);
  res.json({ ok: true });
}));
// Bulk import existing members from an Excel/CSV sheet. Owner only. No emails/invoices sent.
app.post('/api/admin/members/import', requireOwner, upload.single('file'), h(async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Upload an .xlsx or .csv file.' });
  let XLSX; try { XLSX = require('xlsx'); } catch (e) { return res.status(500).json({ error: 'Excel library not installed. Run npm install.' }); }
  let rows;
  try {
    const wb = XLSX.read(req.file.buffer, { type: 'buffer' }); // no cellDates: dates arrive as raw serials
    rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: '', raw: true });
  } catch (e) { return res.status(400).json({ error: 'Could not read the sheet: ' + e.message }); }
  const pick = (o, ...keys) => { for (const k of Object.keys(o)) { const kk = k.toLowerCase().trim().replace(/[\s_]+/g, ''); if (keys.includes(kk)) return String(o[k]).trim(); } return ''; };
  const pickRaw = (o, ...keys) => { for (const k of Object.keys(o)) { const kk = k.toLowerCase().trim().replace(/[\s_]+/g, ''); if (keys.includes(kk)) return o[k]; } return null; };
  const num = (s) => parseInt(String(s).replace(/[^\d]/g, ''), 10) || 0;
  // Process oldest-first so a member's first row registers them and later rows apply as renewals.
  const dateKeys = ['date', 'startdate', 'joindate', 'startingdate', 'joiningdate'];
  rows.sort((a, b) => { const da = parseSheetDate(pickRaw(a, ...dateKeys)); const dbb = parseSheetDate(pickRaw(b, ...dateKeys)); return (da ? da.getTime() : 0) - (dbb ? dbb.getTime() : 0); });
  let imported = 0, skipped = 0; const errors = [];
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const name = pick(r, 'name', 'membername', 'fullname');
    let memberId = pick(r, 'membershipno', 'membershipnumber', 'membershipid', 'memberid', 'id');
    const email = pick(r, 'email', 'emailid', 'mail').toLowerCase();
    // Skip a truly empty row (needs a name or a membership no)
    if (!name && !memberId) { skipped++; continue; }
    const phone = pick(r, 'phone', 'mobile', 'mobilenumber', 'contact', 'phonenumber');
    const plan = pick(r, 'package', 'plan', 'membership', 'plantype') || 'Membership';
    const session = pick(r, 'session', 'batch', 'slot');
    const amount = num(pick(r, 'amount', 'amountpaid', 'fees', 'fee', 'total'));
    const paidCol = pick(r, 'paid', 'paidamount', 'amountpaidnow');
    const pendingCol = pick(r, 'pending', 'pendingamount', 'due', 'balance');
    const cash = num(pick(r, 'cash', 'cashamount'));
    const online = num(pick(r, 'online', 'onlineamount', 'pos', 'upi'));
    const paid = paidCol !== '' ? num(paidCol) : ((cash + online) || amount); // default: fully paid
    const pending = pendingCol !== '' ? num(pendingCol) : Math.max(0, amount - paid);
    const startDate = parseSheetDate(pickRaw(r, 'date', 'startdate', 'joindate', 'startingdate', 'joiningdate')) || new Date();
    const startISO = startDate.toISOString();
    const expExplicit = parseSheetDate(pickRaw(r, 'expirydate', 'expiry', 'enddate', 'validtill', 'expirationdate'));
    const expISO = (expExplicit || expiryFrom(startDate, plan)).toISOString();
    // Renewal rows in the sheet reuse the same membership_no — find the member if they already exist.
    let existing = null;
    if (memberId) existing = await db.get('SELECT * FROM user_memberships WHERE membership_id=$1', [memberId]);
    if (!existing && email) existing = await db.get('SELECT * FROM user_memberships WHERE email=$1 ORDER BY created_at LIMIT 1', [email]);
    if (!memberId) memberId = existing ? existing.membership_id : (email ? await memberIdFor(email) : await nextMemberId());
    const mode = pick(r, 'modeofpayment', 'paymentmode', 'mode', 'method', 'paymentmethod') || paymentModeNote(cash, online, pending);
    try {
      if (existing) {
        // Treat as a renewal on the existing member: extend expiry, stack amounts, add a ledger line.
        const cur = existing.expires_at ? new Date(existing.expires_at) : startDate;
        const base = cur.getTime() > startDate.getTime() ? cur : startDate;
        const rExp = (expExplicit || expiryFrom(base, plan)).toISOString();
        await db.run(`UPDATE user_memberships SET plan=$1, amount=$2,
           paid_amount=COALESCE(paid_amount,0)+$3, pending_amount=COALESCE(pending_amount,0)+$4,
           cash_amount=COALESCE(cash_amount,0)+$5, online_amount=COALESCE(online_amount,0)+$6,
           expires_at=$7, session=COALESCE(NULLIF($8,''),session), method=$9,
           name=COALESCE(NULLIF($10,''),name), phone=COALESCE(NULLIF($11,''),phone), email=COALESCE(NULLIF($12,''),email)
           WHERE id=$13`,
          [plan, amount, paid, pending, cash, online, rExp, session || '', mode, name || '', phone || '', email || '', existing.id]);
        await db.run("INSERT INTO payments (name,email,phone,plan,amount,status,method,session,membership_id,note,bill_amount,due_amount,created_at) VALUES ($1,$2,$3,$4,$5,'paid',$6,$7,$8,$9,$10,$11,$12)",
          [name || existing.name || '', email || existing.email || '', phone || existing.phone || '', plan, paid, mode, session || null, memberId, 'Renewal (import)', amount, pending, startISO]);
      } else {
        await db.run(`INSERT INTO user_memberships (email, name, phone, plan, amount, paid_amount, pending_amount, cash_amount, online_amount, starts_at, expires_at, session, membership_id, method)
          VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`,
          [email, name, phone, plan, amount, paid, pending, cash, online, startISO, expISO, session || null, memberId, mode]);
        await db.run("INSERT INTO payments (name,email,phone,plan,amount,status,method,session,membership_id,note,bill_amount,due_amount,created_at) VALUES ($1,$2,$3,$4,$5,'paid',$6,$7,$8,$9,$10,$11,$12)",
          [name || '', email, phone || '', plan, paid, mode, session || null, memberId, 'Imported', amount, pending, startISO]);
      }
      imported++;
    } catch (e) { skipped++; errors.push(`Row ${i + 2} (${name || memberId}): ${e.message}`); }
  }
  res.json({ ok: true, imported, skipped, total: rows.length, errors: errors.slice(0, 20) });
}));
// Renew a member's subscription (offline). Extends the SAME row's expiry — no new member row.
// Logs the renewal as a payment tied to the member id (shows in Details history).
app.post('/api/admin/members/:id/renew', requireAdmin, h(async (req, res) => {
  const m = await db.get('SELECT * FROM user_memberships WHERE id=$1', [req.params.id]);
  if (!m) return res.status(404).json({ error: 'Membership not found.' });
  const b = req.body || {};
  const plan = b.plan || m.plan;
  const total = (b.amount != null && b.amount !== '') ? (parseInt(b.amount, 10) || 0) : (m.amount || 0);
  let cash = parseInt(b.cashAmount, 10) || 0;
  let online = parseInt(b.onlineAmount, 10) || 0;
  // If no split was entered, treat the whole amount as paid in cash (never silently "all pending").
  if (!cash && !online) { if ((b.method || '') === 'online') online = total; else cash = total; }
  const paidNow = cash + online;
  const renewPending = Math.max(0, total - paidNow);
  const pm = paymentModeNote(cash, online, renewPending);
  const discountNote = (b.discountNote || '').trim();
  const durationDays = b.durationDays ? parseInt(b.durationDays, 10) : undefined;
  const session = b.session || m.session || null;
  // Extend from the current expiry if still active, else from the renewal date.
  let when = b.date ? new Date(b.date) : new Date(); if (isNaN(when)) when = new Date();
  const curExp = m.expires_at ? new Date(m.expires_at).getTime() : 0;
  const base = new Date(curExp > when.getTime() ? curExp : when.getTime());
  const newExp = expiryFrom(base, plan, durationDays).toISOString();
  const newPending = (m.pending_amount || 0) + renewPending;
  await db.run(`UPDATE user_memberships SET plan=$1, amount=$2,
     paid_amount=COALESCE(paid_amount,0)+$3, pending_amount=$4,
     cash_amount=COALESCE(cash_amount,0)+$5, online_amount=COALESCE(online_amount,0)+$6,
     expires_at=$7, session=$8, method=$9, discount_note=COALESCE($10, discount_note) WHERE id=$11`,
    [plan, total, paidNow, newPending, cash, online, newExp, session, pm, discountNote || null, req.params.id]);
  const pay = await db.get(`INSERT INTO payments (name,email,phone,plan,amount,status,method,session,membership_id,note,bill_amount,due_amount,created_at) VALUES ($1,$2,$3,$4,$5,'paid',$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
    [m.name || '', m.email || '', m.phone || '', plan, paidNow, pm, session, m.membership_id || null, discountNote ? ('Renewal · ' + discountNote) : 'Renewal', total, renewPending, when.toISOString()]);
  let invoiceNo = null;
  if (m.email) { const inv = await issueInvoice(pay, newExp); invoiceNo = inv.invoiceNo; }
  res.json({ ok: true, expires: newExp, pending: renewPending, invoiceNo, emailed: !!m.email && mailerReady });
}));
// Edit any member's details by hand (owner only). Recomputes the Mode-of-payment note.
app.patch('/api/admin/members/:id', requireOwner, h(async (req, res) => {
  const m = await db.get('SELECT * FROM user_memberships WHERE id=$1', [req.params.id]);
  if (!m) return res.status(404).json({ error: 'Member not found.' });
  const b = req.body || {};
  const g = (k, dflt) => (b[k] != null && b[k] !== '') ? b[k] : dflt;
  const name = g('name', m.name);
  const email = String(g('email', m.email) || '').toLowerCase();
  const phone = g('phone', m.phone);
  const plan = g('plan', m.plan);
  const session = g('session', m.session);
  const membershipId = g('membershipId', m.membership_id);
  const amount = parseInt(g('amount', m.amount), 10) || 0;
  const cash = parseInt(g('cashAmount', m.cash_amount), 10) || 0;
  const online = parseInt(g('onlineAmount', m.online_amount), 10) || 0;
  const pending = parseInt(g('pendingAmount', m.pending_amount), 10) || 0;
  const paid = cash + online;
  const starts = b.startDate ? new Date(b.startDate).toISOString() : m.starts_at;
  const expires = b.expiryDate ? new Date(b.expiryDate).toISOString() : m.expires_at;
  const note = paymentModeNote(cash, online, pending);
  await db.run(`UPDATE user_memberships SET name=$1, email=$2, phone=$3, plan=$4, session=$5, membership_id=$6,
     amount=$7, paid_amount=$8, pending_amount=$9, cash_amount=$10, online_amount=$11, starts_at=$12, expires_at=$13, method=$14
     WHERE id=$15`,
    [name, email, phone, plan, session, membershipId, amount, paid, pending, cash, online, starts, expires, note, req.params.id]);
  // If the money figures were changed, this is a correction — reconcile the billing ledger so the
  // Details totals match exactly what was typed (replace the old entries, don't stack on top of them).
  const moneyChanged = amount !== (m.amount || 0) || paid !== (m.paid_amount || 0) || pending !== (m.pending_amount || 0)
    || cash !== (m.cash_amount || 0) || online !== (m.online_amount || 0);
  if (moneyChanged) {
    await db.run(`DELETE FROM payments WHERE status='paid' AND (
        (COALESCE(membership_id,'') <> '' AND membership_id = $1)
        OR (COALESCE($2,'') <> '' AND email = $2))`,
      [membershipId || '', email || '']);
    await db.run("INSERT INTO payments (name,email,phone,plan,amount,status,method,session,membership_id,note,bill_amount,due_amount,created_at) VALUES ($1,$2,$3,$4,$5,'paid',$6,$7,$8,$9,$10,$11,$12)",
      [name || '', email || '', phone || '', plan, paid, note, session || null, membershipId || null, 'Corrected (edit)', amount, pending, starts]);
  }
  res.json({ ok: true });
}));
// Full member detail + transaction history (with timestamps). Powers the "Details" button.
app.get('/api/admin/members/:id/details', requireAdmin, h(async (req, res) => {
  const m = await db.get('SELECT * FROM user_memberships WHERE id=$1', [req.params.id]);
  if (!m) return res.status(404).json({ error: 'Member not found.' });
  const payments = await db.all(
    `SELECT id, amount, method, note, session, bill_amount, due_amount, created_at FROM payments
     WHERE status='paid' AND (
       (COALESCE(membership_id,'') <> '' AND membership_id = $1)
       OR (COALESCE($2,'') <> '' AND email = $2)
     ) ORDER BY created_at ASC`,
    [m.membership_id || '', m.email || '']);
  res.json({ member: m, payments });
}));

// ----------------------------- Collections & cash handover ----------------
const CASH_IN_HAND_SQL = `SELECT COALESCE(SUM(amount),0)::int n FROM payments
  WHERE status='paid' AND method='cash'
    AND created_at > COALESCE((SELECT MAX(created_at) FROM handovers), 'epoch'::timestamptz)`;
// Today's collections (IST) + running cash-in-hand since last handover. Reception can see this.
app.get('/api/admin/collections/today', requireAdmin, h(async (req, res) => {
  const today = await db.all(
    `SELECT id, name, email, plan, amount, method, session, created_at FROM payments
     WHERE status='paid' AND (created_at AT TIME ZONE 'Asia/Kolkata')::date = (now() AT TIME ZONE 'Asia/Kolkata')::date
     ORDER BY created_at DESC`);
  const cash = today.filter((p) => p.method === 'cash');
  const online = today.filter((p) => p.method !== 'cash');
  const sum = (a) => a.reduce((t, p) => t + (p.amount || 0), 0);
  const cashInHand = (await db.get(CASH_IN_HAND_SQL)).n;
  const last = await db.get('SELECT amount, created_at FROM handovers ORDER BY created_at DESC LIMIT 1');
  res.json({
    date: new Date().toISOString().slice(0, 10),
    payments: today,
    todayCashTotal: sum(cash), todayCashCount: cash.length,
    todayOnlineTotal: sum(online), todayOnlineCount: online.length,
    todayTotal: sum(today), todayCount: today.length,
    cashInHand, lastHandover: last || null,
  });
}));
// Hand the accumulated cash to the owner: records it and resets cash-in-hand to 0.
app.post('/api/admin/handover', requireAdmin, h(async (req, res) => {
  const cashInHand = (await db.get(CASH_IN_HAND_SQL)).n;
  const note = (req.body && req.body.note) || '';
  const row = await db.get('INSERT INTO handovers (amount, note, created_by) VALUES ($1,$2,$3) RETURNING id, amount, created_at',
    [cashInHand, note, req.adminRole || 'admin']);
  res.json({ ok: true, handedOver: cashInHand, id: row.id });
}));
app.get('/api/admin/handovers', requireAdmin, h(async (req, res) => res.json(await db.all('SELECT * FROM handovers ORDER BY created_at DESC LIMIT 30'))));

// ----------------------------- Worldline terminal (push to Antera) --------
// Reception "Online" path: send the amount to the physical terminal.
app.post('/api/admin/terminal/charge', requireAdmin, h(async (req, res) => {
  if (!worldline.worldlineReady) return res.status(400).json({ error: 'Worldline terminal is not configured. Add the keys in .env.' });
  const { name, email, phone, plan, amount, session } = req.body || {};
  if (!email) return res.status(400).json({ error: 'Member email is required.' });
  const amt = parseInt(amount, 10) || 0;
  if (!amt) return res.status(400).json({ error: 'Amount is required.' });
  const reference = 'TERM-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7);
  // Pending payment row (status 'created'); the webhook completes it on approval.
  await db.run("INSERT INTO payments (name,email,phone,plan,amount,status,method,session,terminal_ref) VALUES ($1,$2,$3,$4,$5,'created','card',$6,$7)",
    [name || '', email.toLowerCase(), phone || '', plan || 'Membership', amt, session || null, reference]);
  const base = (process.env.PUBLIC_BASE_URL || `${req.protocol}://${req.get('host')}`).replace(/\/+$/, '');
  const callbackUrl = base + '/api/worldline/webhook';
  const r = await worldline.pushSale({ amount: amt, reference, callbackUrl });
  if (!r.ok) {
    await db.run("UPDATE payments SET status='failed' WHERE terminal_ref=$1", [reference]);
    return res.status(502).json({ error: r.error || 'The terminal did not accept the request.' });
  }
  res.json({ ok: true, reference });
}));
// Reception UI polls this until paid/failed.
app.get('/api/admin/terminal/status/:ref', requireAdmin, h(async (req, res) => {
  const p = await db.get('SELECT status, invoice_no FROM payments WHERE terminal_ref=$1', [req.params.ref]);
  if (!p) return res.status(404).json({ error: 'Not found' });
  res.json({ status: p.status, invoiceNo: p.invoice_no || null });
}));
// Public webhook — Worldline POSTs the payment result here.
app.post('/api/worldline/webhook', h(async (req, res) => {
  const { reference, approved, transactionId } = worldline.parseWebhook(req.body);
  if (!reference) return res.status(400).json({ error: 'No reference in webhook.' });
  const pay = await db.get('SELECT * FROM payments WHERE terminal_ref=$1', [reference]);
  if (!pay) return res.status(404).json({ error: 'Unknown reference.' });
  if (pay.status === 'paid') return res.json({ ok: true }); // idempotent
  if (approved) {
    await db.run("UPDATE payments SET status='paid', razorpay_payment_id=$1 WHERE terminal_ref=$2", [transactionId || 'terminal', reference]);
    const fresh = await db.get('SELECT * FROM payments WHERE terminal_ref=$1', [reference]);
    const expires = await grantMembership(fresh.email, fresh.plan, fresh.amount, null, undefined, fresh.session, fresh.method || 'online');
    await issueInvoice(fresh, expires); // GST invoice + email
  } else {
    await db.run("UPDATE payments SET status='failed' WHERE terminal_ref=$1", [reference]);
  }
  res.json({ ok: true });
}));

app.get('/api/admin/memberships', requireAdmin, h(async (req, res) => res.json(await db.all('SELECT * FROM memberships ORDER BY sort'))));
app.patch('/api/admin/memberships/:id', requireOwner, h(async (req, res) => {
  const { price, name, duration, type } = req.body || {};
  const m = await db.get('SELECT * FROM memberships WHERE id = $1', [req.params.id]);
  if (!m) return res.status(404).json({ error: 'Not found.' });
  await db.run('UPDATE memberships SET price=$1, name=$2, duration=$3, type=$4 WHERE id=$5',
    [price != null && price !== '' ? parseInt(price, 10) : m.price, name ?? m.name, duration ?? m.duration, type ?? m.type, req.params.id]);
  res.json({ ok: true });
}));

// ----------------------------- Status (gym closed today) ------------------
app.get('/api/status', h(async (req, res) => {
  const cd = await getSetting('closed_date');
  const today = new Date().toISOString().slice(0, 10);
  res.json({ closedToday: cd === today, date: cd || '', message: (await getSetting('closed_message')) || 'The gym is closed today.' });
}));
app.get('/api/admin/closure', requireAdmin, h(async (req, res) =>
  res.json({ date: (await getSetting('closed_date')) || '', message: (await getSetting('closed_message')) || '' })));
app.post('/api/admin/closure', requireAdmin, h(async (req, res) => {
  await setSetting('closed_date', (req.body && req.body.date) || '');
  await setSetting('closed_message', (req.body && req.body.message) || '');
  res.json({ ok: true });
}));

// ----------------------------- Classes & booking -------------------------
app.get('/api/classes', h(async (req, res) => res.json(await db.all('SELECT * FROM classes ORDER BY day_of_week, start_time'))));
app.get('/api/me/bookings', requireMember, h(async (req, res) => res.json(await db.all(
  "SELECT b.id, b.class_id, b.slot_date, b.status, c.title, c.discipline, c.start_time, c.end_time, c.coach FROM class_bookings b JOIN classes c ON c.id=b.class_id WHERE b.email=$1 AND b.status<>'cancelled' ORDER BY b.slot_date DESC, c.start_time", [req.user.email]))));
app.post('/api/classes/:id/book', requireMember, h(async (req, res) => {
  const cls = await db.get('SELECT * FROM classes WHERE id=$1', [req.params.id]);
  if (!cls) return res.status(404).json({ error: 'Class not found.' });
  const date = (req.body && req.body.slot_date) || new Date().toISOString().slice(0, 10);
  const existing = await db.get("SELECT * FROM class_bookings WHERE email=$1 AND class_id=$2 AND slot_date=$3 AND status<>'cancelled'", [req.user.email, cls.id, date]);
  if (existing) return res.json({ ok: true, status: existing.status, message: 'Already booked.' });
  const cnt = (await db.get("SELECT COUNT(*)::int n FROM class_bookings WHERE class_id=$1 AND slot_date=$2 AND status='booked'", [cls.id, date])).n;
  const status = cnt < (cls.capacity || 20) ? 'booked' : 'waitlist';
  await db.run('INSERT INTO class_bookings (email,class_id,slot_date,status) VALUES ($1,$2,$3,$4)', [req.user.email, cls.id, date, status]);
  res.json({ ok: true, status });
}));
app.post('/api/bookings/:id/cancel', requireMember, h(async (req, res) => {
  await db.run("UPDATE class_bookings SET status='cancelled' WHERE id=$1 AND email=$2", [req.params.id, req.user.email]);
  res.json({ ok: true });
}));

// ----------------------------- Video library -----------------------------
app.get('/api/videos', requireMember, h(async (req, res) => res.json(await db.all('SELECT * FROM videos ORDER BY sort, id'))));
app.get('/api/me/video-state', requireMember, h(async (req, res) => res.json(await db.all('SELECT video_id, favorite, progress_seconds FROM video_state WHERE email=$1', [req.user.email]))));
app.post('/api/videos/:id/favorite', requireMember, h(async (req, res) => {
  const vid = req.params.id;
  const st = await db.get('SELECT favorite FROM video_state WHERE email=$1 AND video_id=$2', [req.user.email, vid]);
  if (st) await db.run('UPDATE video_state SET favorite = CASE WHEN favorite=1 THEN 0 ELSE 1 END, updated_at=now() WHERE email=$1 AND video_id=$2', [req.user.email, vid]);
  else await db.run('INSERT INTO video_state (email,video_id,favorite) VALUES ($1,$2,1)', [req.user.email, vid]);
  const cur = await db.get('SELECT favorite FROM video_state WHERE email=$1 AND video_id=$2', [req.user.email, vid]);
  res.json({ ok: true, favorite: cur.favorite });
}));
app.post('/api/videos/:id/progress', requireMember, h(async (req, res) => {
  await db.run('INSERT INTO video_state (email,video_id,progress_seconds,updated_at) VALUES ($1,$2,$3,now()) ON CONFLICT (email,video_id) DO UPDATE SET progress_seconds=$3, updated_at=now()',
    [req.user.email, req.params.id, parseInt((req.body && req.body.seconds) || 0, 10)]);
  res.json({ ok: true });
}));

// ----------------------------- Diet & receipts (member) ------------------
app.get('/api/diet', requireMember, h(async (req, res) => res.json(await db.all('SELECT * FROM diet_posts ORDER BY created_at DESC'))));
app.get('/api/me/payments', requireMember, h(async (req, res) => res.json(await db.all(
  "SELECT plan, amount, status, created_at, razorpay_payment_id FROM payments WHERE email=$1 AND status='paid' ORDER BY created_at DESC", [req.user.email]))));

// ----------------------------- Admin: classes ----------------------------
app.get('/api/admin/classes', requireAdmin, h(async (req, res) => res.json(await db.all('SELECT * FROM classes ORDER BY day_of_week, start_time'))));
app.post('/api/admin/classes', requireAdmin, h(async (req, res) => {
  const { title, discipline, day_of_week, start_time, end_time, capacity, coach } = req.body || {};
  if (!title) return res.status(400).json({ error: 'Title required.' });
  const row = await db.get('INSERT INTO classes (title,discipline,day_of_week,start_time,end_time,capacity,coach) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id',
    [title, discipline || '', parseInt(day_of_week, 10) || 0, start_time || '', end_time || '', parseInt(capacity, 10) || 20, coach || '']);
  res.json({ ok: true, id: row.id });
}));
app.delete('/api/admin/classes/:id', requireAdmin, h(async (req, res) => { await db.run('DELETE FROM classes WHERE id=$1', [req.params.id]); res.json({ ok: true }); }));

// ----------------------------- Admin: videos -----------------------------
app.get('/api/admin/videos', requireAdmin, h(async (req, res) => res.json(await db.all('SELECT * FROM videos ORDER BY sort, id'))));
app.post('/api/admin/videos', requireAdmin, h(async (req, res) => {
  const { title, discipline, level, url, thumbnail, duration, sort } = req.body || {};
  if (!title || !url) return res.status(400).json({ error: 'Title and video URL required.' });
  const row = await db.get('INSERT INTO videos (title,discipline,level,url,thumbnail,duration,sort) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id',
    [title, discipline || '', level || 'All levels', url, thumbnail || '', duration || '', parseInt(sort, 10) || 0]);
  res.json({ ok: true, id: row.id });
}));
app.post('/api/admin/videos/upload', requireAdmin, uploadBig.fields([{ name: 'video', maxCount: 1 }, { name: 'cover', maxCount: 1 }]), h(async (req, res) => {
  const { title, discipline, level, duration } = req.body || {};
  let { thumbnail } = req.body || {};
  const videoFile = req.files && req.files.video && req.files.video[0];
  const coverFile = req.files && req.files.cover && req.files.cover[0];
  if (!title) return res.status(400).json({ error: 'Title required.' });
  if (!videoFile) return res.status(400).json({ error: 'Choose an .mp4 file.' });
  const url = await storeFile(videoFile, 'video.mp4');
  if (coverFile) thumbnail = await storeFile(coverFile, 'cover.jpg');
  const row = await db.get('INSERT INTO videos (title,discipline,level,url,thumbnail,duration,sort) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id',
    [title, discipline || '', level || 'All levels', url, thumbnail || '', duration || '', 0]);
  res.json({ ok: true, id: row.id, url });
}));
app.delete('/api/admin/videos/:id', requireAdmin, h(async (req, res) => { await db.run('DELETE FROM videos WHERE id=$1', [req.params.id]); res.json({ ok: true }); }));

// ----------------------------- Admin: diet (upload to Supabase Storage) ---
app.get('/api/admin/diet', requireAdmin, h(async (req, res) => res.json(await db.all('SELECT * FROM diet_posts ORDER BY created_at DESC'))));
app.post('/api/admin/diet', requireAdmin, upload.single('image'), h(async (req, res) => {
  const { title, note, image_url } = req.body || {};
  let url = image_url || '';
  if (req.file) url = await storeFile(req.file, 'diet.jpg');
  if (!url) return res.status(400).json({ error: 'Provide an image file or an image_url.' });
  const row = await db.get('INSERT INTO diet_posts (title,image_url,note) VALUES ($1,$2,$3) RETURNING id', [title || '', url, note || '']);
  res.json({ ok: true, id: row.id, url });
}));
app.delete('/api/admin/diet/:id', requireAdmin, h(async (req, res) => { await db.run('DELETE FROM diet_posts WHERE id=$1', [req.params.id]); res.json({ ok: true }); }));

// ----------------------------- Static / SPA -------------------------------
app.use('/uploads', express.static(UPLOADS_DIR));
app.use('/admin', express.static(path.join(__dirname, 'public', 'admin')));

const clientDist = path.join(__dirname, 'client', 'dist');
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/admin')) return next();
    res.sendFile(path.join(clientDist, 'index.html'));
  });
} else {
  app.get('/', (req, res) => res.send('<h2 style="font-family:sans-serif">718 MMA API is running.</h2><p>Build the client with <code>npm run build</code>, or run <code>npm run client</code> (http://localhost:5173).</p><p><a href="/admin">Admin CRM &rarr;</a></p>'));
}

// ----------------------------- Startup ------------------------------------
(async () => {
  await db.init();
  await backfillMemberIds(); // give existing members a Member ID
  const c = await db.get('SELECT COUNT(*)::int n FROM courses');
  if (!c || !c.n) { console.log('Empty DB - seeding demo content...'); await require('./seed')(); }
  app.listen(PORT, () => {
    console.log(`\n718 MMA Gym API at http://localhost:${PORT}`);
    console.log(`   Admin CRM:  http://localhost:${PORT}/admin`);
    console.log(`   Database:   Supabase/Postgres`);
    console.log(`   Google:     ${GOOGLE_CLIENT_ID ? 'configured' : 'NOT set'}  |  Razorpay: ${RZP_LIVE ? 'LIVE test keys' : 'MOCK mode'}`);
    console.log(`   Email:      ${mailerReady ? 'via ' + require('./mailer').provider + ' (invoices + renewal reminders)' : 'NOT set'}\n`);
  });
  // Renewal reminders: run shortly after boot, then every 6 hours (deduped so no spam).
  if (mailerReady) {
    setTimeout(() => sendRenewalReminders().catch((e) => console.error('[reminders]', e.message)), 20000);
    setInterval(() => sendRenewalReminders().catch((e) => console.error('[reminders]', e.message)), 6 * 3600 * 1000);
  }
})().catch((e) => { console.error('Startup failed:', e.message); process.exit(1); });
