/**
 * Database layer - Supabase / PostgreSQL via node-postgres (pg).
 * Set DATABASE_URL in .env to your Supabase connection string.
 * Exposes async helpers: get(one row), all(rows), run(result), init(schema).
 */
const { Pool } = require('pg');

const url = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL || '';
const pool = new Pool({
  connectionString: url,
  ssl: !url || url.includes('localhost') ? false : { rejectUnauthorized: false },
  max: 5,
});

const all = async (text, params = []) => (await pool.query(text, params)).rows;
const get = async (text, params = []) => (await pool.query(text, params)).rows[0] || null;
const run = async (text, params = []) => pool.query(text, params);

async function init() {
  if (!url) throw new Error('DATABASE_URL is not set. Add your Supabase connection string to .env');
  await pool.query(`
    CREATE TABLE IF NOT EXISTS courses (
      id SERIAL PRIMARY KEY, slug TEXT UNIQUE NOT NULL, name TEXT NOT NULL,
      tagline TEXT, description TEXT, image TEXT, sort INTEGER DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS events (
      id SERIAL PRIMARY KEY, title TEXT NOT NULL, description TEXT, event_date TEXT,
      location TEXT, image TEXT, status TEXT NOT NULL DEFAULT 'upcoming', created_at TIMESTAMPTZ DEFAULT now()
    );
    CREATE TABLE IF NOT EXISTS memberships (
      id SERIAL PRIMARY KEY, name TEXT NOT NULL, type TEXT NOT NULL DEFAULT 'membership',
      price INTEGER NOT NULL, duration TEXT, features TEXT, popular INTEGER DEFAULT 0, sort INTEGER DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS trainers (
      id SERIAL PRIMARY KEY, name TEXT NOT NULL, specialty TEXT, fee INTEGER, bio TEXT, image TEXT
    );
    CREATE TABLE IF NOT EXISTS foods (
      id SERIAL PRIMARY KEY, name TEXT NOT NULL, category TEXT, description TEXT,
      calories TEXT, protein TEXT, image TEXT, order_url TEXT
    );
    CREATE TABLE IF NOT EXISTS reviews (
      id SERIAL PRIMARY KEY, author TEXT NOT NULL, rating INTEGER DEFAULT 5, text TEXT, relative_time TEXT
    );
    CREATE TABLE IF NOT EXISTS trial_bookings (
      id SERIAL PRIMARY KEY, name TEXT NOT NULL, email TEXT, phone TEXT, discipline TEXT,
      preferred_date TEXT, message TEXT, status TEXT DEFAULT 'new', created_at TIMESTAMPTZ DEFAULT now()
    );
    CREATE TABLE IF NOT EXISTS collaborations (
      id SERIAL PRIMARY KEY, name TEXT NOT NULL, organization TEXT, email TEXT, phone TEXT,
      type TEXT, message TEXT, status TEXT DEFAULT 'new', created_at TIMESTAMPTZ DEFAULT now()
    );
    CREATE TABLE IF NOT EXISTS payments (
      id SERIAL PRIMARY KEY, name TEXT, email TEXT, phone TEXT, plan TEXT, amount INTEGER,
      razorpay_order_id TEXT, razorpay_payment_id TEXT, status TEXT DEFAULT 'created', created_at TIMESTAMPTZ DEFAULT now()
    );
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY, email TEXT UNIQUE NOT NULL, name TEXT, picture TEXT,
      google_sub TEXT, password_hash TEXT, last_login TIMESTAMPTZ, created_at TIMESTAMPTZ DEFAULT now()
    );
    CREATE TABLE IF NOT EXISTS classes (
      id SERIAL PRIMARY KEY, title TEXT NOT NULL, discipline TEXT, day_of_week INTEGER,
      start_time TEXT, end_time TEXT, capacity INTEGER DEFAULT 20, coach TEXT, sort INTEGER DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS class_bookings (
      id SERIAL PRIMARY KEY, email TEXT NOT NULL, class_id INTEGER NOT NULL, slot_date TEXT,
      status TEXT DEFAULT 'booked', created_at TIMESTAMPTZ DEFAULT now()
    );
    CREATE TABLE IF NOT EXISTS videos (
      id SERIAL PRIMARY KEY, title TEXT NOT NULL, discipline TEXT, level TEXT,
      url TEXT, thumbnail TEXT, duration TEXT, sort INTEGER DEFAULT 0, created_at TIMESTAMPTZ DEFAULT now()
    );
    CREATE TABLE IF NOT EXISTS video_state (
      id SERIAL PRIMARY KEY, email TEXT NOT NULL, video_id INTEGER NOT NULL,
      favorite INTEGER DEFAULT 0, progress_seconds INTEGER DEFAULT 0, updated_at TIMESTAMPTZ DEFAULT now(),
      UNIQUE(email, video_id)
    );
    CREATE TABLE IF NOT EXISTS diet_posts (
      id SERIAL PRIMARY KEY, title TEXT, image_url TEXT NOT NULL, note TEXT, created_at TIMESTAMPTZ DEFAULT now()
    );
    CREATE TABLE IF NOT EXISTS app_settings (
      key TEXT PRIMARY KEY, value TEXT
    );
    CREATE TABLE IF NOT EXISTS user_memberships (
      id SERIAL PRIMARY KEY, email TEXT NOT NULL, plan TEXT, amount INTEGER,
      starts_at TIMESTAMPTZ DEFAULT now(), expires_at TIMESTAMPTZ, razorpay_order_id TEXT, created_at TIMESTAMPTZ DEFAULT now()
    );
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS handovers (
      id SERIAL PRIMARY KEY, amount INTEGER NOT NULL DEFAULT 0, note TEXT,
      created_by TEXT, created_at TIMESTAMPTZ DEFAULT now()
    );
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS renewal_reminders (
      id SERIAL PRIMARY KEY, email TEXT, membership_id INTEGER, days_before INTEGER,
      sent_at TIMESTAMPTZ DEFAULT now(), UNIQUE(membership_id, days_before)
    );
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS invoice_sequences (
      financial_year TEXT PRIMARY KEY, last_number INTEGER NOT NULL DEFAULT 0
    );
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS invoice_number_migration_log (
      payment_id INTEGER PRIMARY KEY, old_invoice_no TEXT, new_invoice_no TEXT NOT NULL,
      migrated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS expenses (
      id SERIAL PRIMARY KEY, expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
      category TEXT NOT NULL DEFAULT 'General', description TEXT, amount INTEGER NOT NULL CHECK (amount >= 0),
      created_by TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS certificates (
      id SERIAL PRIMARY KEY, cert_id TEXT UNIQUE NOT NULL, name TEXT NOT NULL,
      course TEXT, cert_date TEXT, image TEXT, photo TEXT, created_at TIMESTAMPTZ DEFAULT now()
    );
  `);
  await pool.query(`ALTER TABLE certificates ADD COLUMN IF NOT EXISTS photo TEXT`);
  // --- Migrations (safe to run every boot) ---
  await pool.query(`ALTER TABLE payments ADD COLUMN IF NOT EXISTS invoice_no TEXT`);
  await pool.query(`ALTER TABLE payments ADD COLUMN IF NOT EXISTS method TEXT DEFAULT 'online'`);
  await pool.query(`ALTER TABLE payments ADD COLUMN IF NOT EXISTS invoice_pdf BYTEA`);
  await pool.query(`ALTER TABLE payments ADD COLUMN IF NOT EXISTS session TEXT`);
  await pool.query(`ALTER TABLE user_memberships ADD COLUMN IF NOT EXISTS session TEXT`);
  await pool.query(`ALTER TABLE payments ADD COLUMN IF NOT EXISTS terminal_ref TEXT`);
  await pool.query(`ALTER TABLE payments ADD COLUMN IF NOT EXISTS membership_id TEXT`);
  await pool.query(`ALTER TABLE payments ADD COLUMN IF NOT EXISTS note TEXT`);
  await pool.query(`ALTER TABLE payments ADD COLUMN IF NOT EXISTS bill_amount INTEGER`);
  await pool.query(`ALTER TABLE payments ADD COLUMN IF NOT EXISTS due_amount INTEGER DEFAULT 0`);
  await pool.query(`ALTER TABLE user_memberships ADD COLUMN IF NOT EXISTS discount INTEGER DEFAULT 0`);
  await pool.query(`ALTER TABLE user_memberships ADD COLUMN IF NOT EXISTS discount_note TEXT`);
  await pool.query(`ALTER TABLE user_memberships ADD COLUMN IF NOT EXISTS membership_id TEXT`);
  await pool.query(`ALTER TABLE user_memberships ADD COLUMN IF NOT EXISTS method TEXT`);
  await pool.query(`ALTER TABLE user_memberships ADD COLUMN IF NOT EXISTS name TEXT`);
  await pool.query(`ALTER TABLE user_memberships ADD COLUMN IF NOT EXISTS phone TEXT`);
  await pool.query(`ALTER TABLE user_memberships ADD COLUMN IF NOT EXISTS paid_amount INTEGER`);
  await pool.query(`ALTER TABLE user_memberships ADD COLUMN IF NOT EXISTS pending_amount INTEGER DEFAULT 0`);
  await pool.query(`ALTER TABLE user_memberships ADD COLUMN IF NOT EXISTS cash_amount INTEGER DEFAULT 0`);
  await pool.query(`ALTER TABLE user_memberships ADD COLUMN IF NOT EXISTS online_amount INTEGER DEFAULT 0`);
  await pool.query(`ALTER TABLE user_memberships ADD COLUMN IF NOT EXISTS pending_cleared_at TIMESTAMPTZ`);
  await pool.query(`ALTER TABLE user_memberships ADD COLUMN IF NOT EXISTS membership_fee INTEGER NOT NULL DEFAULT 0`);
  await pool.query(`ALTER TABLE payments ADD COLUMN IF NOT EXISTS membership_fee INTEGER NOT NULL DEFAULT 0`);
}

module.exports = { pool, all, get, run, init };
