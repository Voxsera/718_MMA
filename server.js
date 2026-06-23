/**
 * 718 MMA Gym - Express API + server.
 * Serves the React build (client/dist) + Admin CRM, and exposes a JSON API with
 * Google sign-in, an active-membership login gate, and Razorpay (UPI) payments.
 */
require('dotenv').config();
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const express = require('express');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const db = require('./db');

// Auto-seed demo content on first boot (e.g. a fresh deploy) if the DB is empty.
try { if (db.prepare('SELECT COUNT(*) n FROM courses').get().n === 0) { console.log('Empty DB - seeding demo content...'); require('./seed'); } } catch (e) { console.warn('Seed check skipped:', e.message); }

const app = express();
const PORT = process.env.PORT || 3000;

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '718mma';
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

// ----------------------------- Helpers -----------------------------------
const PLAN_DAYS = { 'Day Pass': 1, 'Monthly': 30, 'Quarterly': 90, 'Annual': 365 };
function planDuration(plan) {
  if (!plan) return 30;
  if (PLAN_DAYS[plan]) return PLAN_DAYS[plan];
  if (/annual/i.test(plan)) return 365;
  if (/quarter/i.test(plan)) return 90;
  return 30;
}
function grantMembership(email, plan, amount, orderId) {
  if (!email) return;
  const expires = new Date(Date.now() + planDuration(plan) * 86400000).toISOString();
  db.prepare('INSERT INTO user_memberships (email, plan, amount, expires_at, razorpay_order_id) VALUES (?,?,?,?,?)')
    .run(email.toLowerCase(), plan, amount, expires, orderId || null);
}
function activeMembership(email) {
  if (!email) return null;
  return db.prepare("SELECT * FROM user_memberships WHERE email = ? AND expires_at > datetime('now') ORDER BY expires_at DESC LIMIT 1")
    .get(email.toLowerCase());
}
function makeAdminToken() {
  const payload = `admin.${Date.now()}`;
  const sig = crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('hex');
  return `${Buffer.from(payload).toString('base64')}.${sig}`;
}
function verifyAdminToken(token) {
  if (!token) return false;
  const [b64, sig] = token.split('.');
  if (!b64 || !sig) return false;
  const payload = Buffer.from(b64, 'base64').toString();
  const expected = crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('hex');
  try { return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected)); } catch { return false; }
}
function requireAdmin(req, res, next) {
  const token = req.cookies.admin_token || (req.headers.authorization || '').replace('Bearer ', '');
  if (verifyAdminToken(token)) return next();
  return res.status(401).json({ error: 'Unauthorized' });
}
function currentUser(req) {
  const token = req.cookies.user_token;
  if (!token) return null;
  try { return jwt.verify(token, JWT_SECRET); } catch { return null; }
}

// ----------------------------- Config + content --------------------------
app.get('/api/config', (req, res) =>
  res.json({ googleClientId: GOOGLE_CLIENT_ID, razorpayKey: RZP_KEY_ID, razorpayLive: RZP_LIVE }));

app.get('/api/courses', (req, res) => res.json(db.prepare('SELECT * FROM courses ORDER BY sort').all()));
app.get('/api/memberships', (req, res) => res.json(db.prepare('SELECT * FROM memberships ORDER BY sort').all()));
app.get('/api/trainers', (req, res) => res.json(db.prepare('SELECT * FROM trainers ORDER BY id').all()));
app.get('/api/foods', (req, res) => res.json(db.prepare('SELECT * FROM foods ORDER BY id').all()));
app.get('/api/reviews', (req, res) => res.json(db.prepare('SELECT * FROM reviews ORDER BY id').all()));
app.get('/api/events', (req, res) => {
  const { status } = req.query;
  res.json(status
    ? db.prepare('SELECT * FROM events WHERE status = ? ORDER BY event_date').all(status)
    : db.prepare('SELECT * FROM events ORDER BY event_date').all());
});

app.post('/api/trial', (req, res) => {
  const { name, email, phone, discipline, preferred_date, message } = req.body || {};
  if (!name || !phone) return res.status(400).json({ error: 'Name and phone are required.' });
  const info = db.prepare('INSERT INTO trial_bookings (name,email,phone,discipline,preferred_date,message) VALUES (?,?,?,?,?,?)')
    .run(name, email || '', phone, discipline || '', preferred_date || '', message || '');
  res.json({ ok: true, id: info.lastInsertRowid, message: 'Your free trial request is in! We will call you to confirm.' });
});

app.post('/api/collaborate', (req, res) => {
  const { name, organization, email, phone, type, message } = req.body || {};
  if (!name || !email) return res.status(400).json({ error: 'Name and email are required.' });
  const info = db.prepare('INSERT INTO collaborations (name,organization,email,phone,type,message) VALUES (?,?,?,?,?,?)')
    .run(name, organization || '', email, phone || '', type || '', message || '');
  res.json({ ok: true, id: info.lastInsertRowid, message: 'Thanks! Our team will reach out about your collaboration.' });
});

// ----------------------------- Payments (Razorpay + UPI) ------------------
app.post('/api/payment/order', async (req, res) => {
  const { plan, amount, name, email, phone } = req.body || {};
  const amt = parseInt(amount, 10);
  if (!amt || amt <= 0) return res.status(400).json({ error: 'Invalid amount.' });
  if (!email) return res.status(400).json({ error: 'Email is required to activate your membership.' });
  let order;
  try {
    if (razorpay) order = await razorpay.orders.create({ amount: amt * 100, currency: 'INR', receipt: `rcpt_${Date.now()}` });
    else order = { id: `order_mock_${Date.now()}`, amount: amt * 100, currency: 'INR', mock: true };
  } catch (e) { return res.status(500).json({ error: 'Could not create order: ' + e.message }); }
  db.prepare('INSERT INTO payments (name,email,phone,plan,amount,razorpay_order_id,status) VALUES (?,?,?,?,?,?,?)')
    .run(name || '', email, phone || '', plan || '', amt, order.id, 'created');
  res.json({ order, key: RZP_KEY_ID, mock: !razorpay });
});

app.post('/api/payment/verify', (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body || {};
  let verified = false;
  if (razorpay && razorpay_signature) {
    const expected = crypto.createHmac('sha256', RZP_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`).digest('hex');
    verified = expected === razorpay_signature;
  } else verified = true; // mock mode
  const pay = db.prepare('SELECT * FROM payments WHERE razorpay_order_id = ?').get(razorpay_order_id);
  db.prepare('UPDATE payments SET razorpay_payment_id = ?, status = ? WHERE razorpay_order_id = ?')
    .run(razorpay_payment_id || 'mock_pay', verified ? 'paid' : 'failed', razorpay_order_id);
  if (verified && pay) grantMembership(pay.email, pay.plan, pay.amount, razorpay_order_id);
  res.json({ ok: verified, email: pay ? pay.email : null });
});

// ----------------------------- Google auth + member gate ------------------
app.post('/api/auth/google', async (req, res) => {
  const { credential } = req.body || {};
  if (!credential) return res.status(400).json({ error: 'Missing Google credential.' });
  if (!googleClient) return res.status(500).json({ error: 'Google login is not configured. Set GOOGLE_CLIENT_ID in .env.' });
  let payload;
  try {
    const ticket = await googleClient.verifyIdToken({ idToken: credential, audience: GOOGLE_CLIENT_ID });
    payload = ticket.getPayload();
  } catch (e) { return res.status(401).json({ error: 'Invalid Google token.' }); }
  const email = (payload.email || '').toLowerCase();
  const membership = activeMembership(email);
  if (!membership) return res.status(403).json({ error: 'no_membership', message: 'No active membership for ' + email + '. Purchase a membership to access your account.' });
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) db.prepare("UPDATE users SET name=?, picture=?, google_sub=?, last_login=datetime('now') WHERE email=?").run(payload.name || '', payload.picture || '', payload.sub || '', email);
  else db.prepare("INSERT INTO users (email,name,picture,google_sub,last_login) VALUES (?,?,?,?,datetime('now'))").run(email, payload.name || '', payload.picture || '', payload.sub || '');
  const user = { email, name: payload.name, picture: payload.picture };
  const token = jwt.sign(user, JWT_SECRET, { expiresIn: '7d' });
  res.cookie('user_token', token, { httpOnly: true, sameSite: 'lax', maxAge: 7 * 86400 * 1000 });
  res.json({ ok: true, user, membership: { plan: membership.plan, expires_at: membership.expires_at } });
});

app.get('/api/auth/me', (req, res) => {
  const user = currentUser(req);
  if (!user) return res.status(401).json({ error: 'Not signed in' });
  res.json({ user: { email: user.email, name: user.name, picture: user.picture }, membership: activeMembership(user.email) });
});

app.post('/api/auth/logout', (req, res) => { res.clearCookie('user_token'); res.json({ ok: true }); });

// ----------------------------- Admin --------------------------------------
app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body || {};
  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    res.cookie('admin_token', makeAdminToken(), { httpOnly: true, sameSite: 'lax', maxAge: 8 * 3600 * 1000 });
    return res.json({ ok: true });
  }
  res.status(401).json({ error: 'Invalid credentials.' });
});
app.post('/api/admin/logout', (req, res) => { res.clearCookie('admin_token'); res.json({ ok: true }); });
app.get('/api/admin/me', requireAdmin, (req, res) => res.json({ ok: true }));

app.get('/api/admin/summary', requireAdmin, (req, res) => {
  const count = (q) => db.prepare(q).get().n;
  res.json({
    trials: count('SELECT COUNT(*) n FROM trial_bookings'),
    newTrials: count("SELECT COUNT(*) n FROM trial_bookings WHERE status='new'"),
    collaborations: count('SELECT COUNT(*) n FROM collaborations'),
    newCollaborations: count("SELECT COUNT(*) n FROM collaborations WHERE status='new'"),
    payments: count("SELECT COUNT(*) n FROM payments WHERE status='paid'"),
    revenue: db.prepare("SELECT COALESCE(SUM(amount),0) n FROM payments WHERE status='paid'").get().n,
    members: count("SELECT COUNT(DISTINCT email) n FROM user_memberships WHERE expires_at > datetime('now')"),
    events: count('SELECT COUNT(*) n FROM events'),
    upcoming: count("SELECT COUNT(*) n FROM events WHERE status='upcoming'"),
  });
});

app.get('/api/admin/events', requireAdmin, (req, res) => res.json(db.prepare('SELECT * FROM events ORDER BY event_date').all()));
app.post('/api/admin/events', requireAdmin, (req, res) => {
  const { title, description, event_date, location, image, status } = req.body || {};
  if (!title) return res.status(400).json({ error: 'Title required.' });
  const info = db.prepare('INSERT INTO events (title,description,event_date,location,image,status) VALUES (?,?,?,?,?,?)')
    .run(title, description || '', event_date || '', location || '', image || '', status || 'upcoming');
  res.json({ ok: true, id: info.lastInsertRowid });
});
app.patch('/api/admin/events/:id', requireAdmin, (req, res) => {
  const { status, title, description, event_date, location, image } = req.body || {};
  const ev = db.prepare('SELECT * FROM events WHERE id = ?').get(req.params.id);
  if (!ev) return res.status(404).json({ error: 'Not found.' });
  if (status && !['upcoming', 'ongoing', 'past'].includes(status)) return res.status(400).json({ error: 'Bad status.' });
  db.prepare('UPDATE events SET status=?, title=?, description=?, event_date=?, location=?, image=? WHERE id=?')
    .run(status || ev.status, title ?? ev.title, description ?? ev.description, event_date ?? ev.event_date, location ?? ev.location, image ?? ev.image, req.params.id);
  res.json({ ok: true });
});
app.delete('/api/admin/events/:id', requireAdmin, (req, res) => { db.prepare('DELETE FROM events WHERE id = ?').run(req.params.id); res.json({ ok: true }); });

app.get('/api/admin/trials', requireAdmin, (req, res) => res.json(db.prepare('SELECT * FROM trial_bookings ORDER BY created_at DESC').all()));
app.patch('/api/admin/trials/:id', requireAdmin, (req, res) => { db.prepare('UPDATE trial_bookings SET status = ? WHERE id = ?').run(req.body.status, req.params.id); res.json({ ok: true }); });

app.get('/api/admin/collaborations', requireAdmin, (req, res) => res.json(db.prepare('SELECT * FROM collaborations ORDER BY created_at DESC').all()));
app.patch('/api/admin/collaborations/:id', requireAdmin, (req, res) => { db.prepare('UPDATE collaborations SET status = ? WHERE id = ?').run(req.body.status, req.params.id); res.json({ ok: true }); });

app.get('/api/admin/payments', requireAdmin, (req, res) => res.json(db.prepare('SELECT * FROM payments ORDER BY created_at DESC').all()));
app.get('/api/admin/members', requireAdmin, (req, res) => res.json(db.prepare('SELECT * FROM user_memberships ORDER BY expires_at DESC').all()));

app.get('/api/admin/memberships', requireAdmin, (req, res) => res.json(db.prepare('SELECT * FROM memberships ORDER BY sort').all()));
app.patch('/api/admin/memberships/:id', requireAdmin, (req, res) => {
  const { price, name, duration } = req.body || {};
  const m = db.prepare('SELECT * FROM memberships WHERE id = ?').get(req.params.id);
  if (!m) return res.status(404).json({ error: 'Not found.' });
  db.prepare('UPDATE memberships SET price=?, name=?, duration=? WHERE id=?').run(price ?? m.price, name ?? m.name, duration ?? m.duration, req.params.id);
  res.json({ ok: true });
});

// ----------------------------- Static / SPA -------------------------------
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

app.listen(PORT, () => {
  console.log(`\n718 MMA Gym API at http://localhost:${PORT}`);
  console.log(`   Admin CRM:  http://localhost:${PORT}/admin`);
  console.log(`   React dev:  run "npm run client" -> http://localhost:5173`);
  console.log(`   Google:     ${GOOGLE_CLIENT_ID ? 'configured' : 'NOT set (add GOOGLE_CLIENT_ID in .env)'}`);
  console.log(`   Razorpay:   ${RZP_LIVE ? 'LIVE test keys (UPI enabled)' : 'MOCK mode (set keys in .env)'}\n`);
});
