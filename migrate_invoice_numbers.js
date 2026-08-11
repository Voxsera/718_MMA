/**
 * One-time invoice-number migration.
 *
 * Renumbers existing stored invoices chronologically by original payment date,
 * regenerates their PDFs, and records the old-to-new mapping. It deliberately
 * does not send emails or WhatsApp messages.
 *
 * Run once: npm run migrate:invoices
 */
require('dotenv').config();

const db = require('./db');
const { generateInvoicePdf } = require('./invoice');

function financialYear(date) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Kolkata', year: 'numeric', month: 'numeric',
  }).formatToParts(new Date(date));
  const value = (type) => Number(parts.find((part) => part.type === type).value);
  const year = value('year');
  const month = value('month');
  const startYear = month >= 4 ? year : year - 1;
  return `${String(startYear).slice(-2)}/${String(startYear + 1).slice(-2)}`;
}

const invoiceNo = (fy, n) => `INV-${fy}-${String(n).padStart(3, '0')}`;

async function main() {
  await db.init();
  const alreadyRun = await db.get('SELECT 1 FROM invoice_number_migration_log LIMIT 1');
  if (alreadyRun) throw new Error('This migration has already run. No invoices were changed.');

  const payments = await db.all(`
    SELECT * FROM payments
    WHERE invoice_no IS NOT NULL OR invoice_pdf IS NOT NULL
    ORDER BY created_at ASC, id ASC`);
  if (!payments.length) {
    console.log('No existing invoices found. Nothing to migrate.');
    return;
  }

  const counters = new Map();
  const migrated = [];
  for (const payment of payments) {
    const fy = financialYear(payment.created_at);
    const next = (counters.get(fy) || 0) + 1;
    counters.set(fy, next);
    const member = payment.membership_id
      ? { membership_id: payment.membership_id }
      : await db.get("SELECT membership_id FROM user_memberships WHERE email=$1 AND COALESCE(membership_id,'')<>'' ORDER BY created_at DESC LIMIT 1", [payment.email]);
    const total = Number(payment.amount || 0);
    const gstRate = 5;
    const gst = Math.round(total * gstRate / (100 + gstRate));
    const data = {
      invoiceNo: invoiceNo(fy, next), memberId: member ? member.membership_id : '',
      name: payment.name, email: payment.email, phone: payment.phone, plan: payment.plan,
      amount: total, base: total - gst, gst, gstRate, method: payment.method || 'online',
      paymentId: payment.razorpay_payment_id || null, date: payment.created_at,
    };
    migrated.push({ payment, newInvoiceNo: data.invoiceNo, pdf: await generateInvoicePdf(data) });
  }

  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');
    for (const item of migrated) {
      await client.query('UPDATE payments SET invoice_no=$1, invoice_pdf=$2 WHERE id=$3', [item.newInvoiceNo, item.pdf, item.payment.id]);
      await client.query('INSERT INTO invoice_number_migration_log (payment_id, old_invoice_no, new_invoice_no) VALUES ($1,$2,$3)', [item.payment.id, item.payment.invoice_no, item.newInvoiceNo]);
    }
    for (const [fy, lastNumber] of counters) {
      await client.query(`
        INSERT INTO invoice_sequences (financial_year, last_number) VALUES ($1,$2)
        ON CONFLICT (financial_year) DO UPDATE SET last_number=EXCLUDED.last_number`, [fy, lastNumber]);
    }
    await client.query('COMMIT');
    console.log(`Renumbered ${migrated.length} invoice(s) without sending notifications.`);
    for (const [fy, lastNumber] of counters) console.log(`  ${fy}: INV-${fy}-${String(lastNumber).padStart(3, '0')}`);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

main()
  .then(() => db.pool.end())
  .catch(async (error) => { console.error('Invoice migration failed:', error.message); await db.pool.end(); process.exitCode = 1; });
