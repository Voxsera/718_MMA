/**
 * Database layer - uses Node's BUILT-IN SQLite (node:sqlite).
 * No native compilation, no npm dependency. Requires Node >= 22.5.
 * Exposes a tiny better-sqlite3-compatible API (prepare/run/get/all, exec, transaction).
 */
const path = require('path');

let DatabaseSync;
try {
  ({ DatabaseSync } = require('node:sqlite'));
} catch (e) {
  console.error('\n[718 MMA] Node\'s built-in SQLite is unavailable.');
  console.error('Please use Node.js v22.5 or newer (LTS 22 or 24).  Current: ' + process.version + '\n');
  throw e;
}

const DB_FILE = process.env.DB_PATH || path.join(__dirname, 'data.db');
const raw = new DatabaseSync(DB_FILE);
try { raw.exec('PRAGMA journal_mode = WAL'); } catch { /* ignore */ }

raw.exec(`
  CREATE TABLE IF NOT EXISTS courses (
    id INTEGER PRIMARY KEY AUTOINCREMENT, slug TEXT UNIQUE NOT NULL, name TEXT NOT NULL,
    tagline TEXT, description TEXT, image TEXT, sort INTEGER DEFAULT 0
  );
  CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL, description TEXT,
    event_date TEXT, location TEXT, image TEXT, status TEXT NOT NULL DEFAULT 'upcoming',
    created_at TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS memberships (
    id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, type TEXT NOT NULL DEFAULT 'membership',
    price INTEGER NOT NULL, duration TEXT, features TEXT, popular INTEGER DEFAULT 0, sort INTEGER DEFAULT 0
  );
  CREATE TABLE IF NOT EXISTS trainers (
    id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, specialty TEXT, fee INTEGER, bio TEXT, image TEXT
  );
  CREATE TABLE IF NOT EXISTS foods (
    id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, category TEXT, description TEXT,
    calories TEXT, protein TEXT, image TEXT, order_url TEXT
  );
  CREATE TABLE IF NOT EXISTS reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT, author TEXT NOT NULL, rating INTEGER DEFAULT 5, text TEXT, relative_time TEXT
  );
  CREATE TABLE IF NOT EXISTS trial_bookings (
    id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, email TEXT, phone TEXT, discipline TEXT,
    preferred_date TEXT, message TEXT, status TEXT DEFAULT 'new', created_at TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS collaborations (
    id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, organization TEXT, email TEXT, phone TEXT,
    type TEXT, message TEXT, status TEXT DEFAULT 'new', created_at TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, email TEXT, phone TEXT, plan TEXT, amount INTEGER,
    razorpay_order_id TEXT, razorpay_payment_id TEXT, status TEXT DEFAULT 'created', created_at TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT, email TEXT UNIQUE NOT NULL, name TEXT, picture TEXT,
    google_sub TEXT, last_login TEXT, created_at TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS user_memberships (
    id INTEGER PRIMARY KEY AUTOINCREMENT, email TEXT NOT NULL, plan TEXT, amount INTEGER,
    starts_at TEXT DEFAULT (datetime('now')), expires_at TEXT, razorpay_order_id TEXT, created_at TEXT DEFAULT (datetime('now'))
  );
`);

// better-sqlite3-compatible wrapper
const db = {
  prepare(sql) {
    const s = raw.prepare(sql);
    return {
      run: (...a) => {
        const r = s.run(...a);
        return { changes: Number(r.changes), lastInsertRowid: Number(r.lastInsertRowid) };
      },
      get: (...a) => s.get(...a),
      all: (...a) => s.all(...a),
    };
  },
  exec: (sql) => raw.exec(sql),
  pragma: () => {},
  transaction(fn) {
    return (...args) => {
      raw.exec('BEGIN');
      try { const r = fn(...args); raw.exec('COMMIT'); return r; }
      catch (e) { try { raw.exec('ROLLBACK'); } catch {} throw e; }
    };
  },
};

module.exports = db;
