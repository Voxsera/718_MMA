/**
 * mailer.js — sends invoice emails via Gmail SMTP (nodemailer).
 * Configure in .env:
 *   SMTP_HOST=smtp.gmail.com
 *   SMTP_PORT=465
 *   SMTP_USER=718mmahyd@gmail.com
 *   SMTP_PASS=<16-char Google App Password>
 *   MAIL_FROM="718 MMA Gym <718mmahyd@gmail.com>"
 * If SMTP_USER/SMTP_PASS are missing, email is skipped gracefully (logged).
 */
const nodemailer = require('nodemailer');

const HOST = (process.env.SMTP_HOST || 'smtp.gmail.com').trim();
const PORT = parseInt(process.env.SMTP_PORT || '465', 10);
const USER = (process.env.SMTP_USER || '').trim();
const PASS = (process.env.SMTP_PASS || '').replace(/\s+/g, ''); // app passwords are shown with spaces
const FROM = (process.env.MAIL_FROM || (USER ? `718 MMA Gym <${USER}>` : '')).trim();

const mailerReady = !!(USER && PASS);

let transporter = null;
if (mailerReady) {
  transporter = nodemailer.createTransport({
    host: HOST,
    port: PORT,
    secure: PORT === 465, // 465 = SSL, 587 = STARTTLS
    auth: { user: USER, pass: PASS },
  });
}

const inr = (n) => '₹' + Number(n || 0).toLocaleString('en-IN');

function invoiceHtml(d = {}) {
  return `
  <div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:auto;color:#111">
    <div style="background:#0c0c0e;padding:22px 26px;border-radius:8px 8px 0 0">
      <span style="font-size:26px;font-weight:800;font-style:italic;color:#fff">7<span style="color:#e8112d">18</span></span>
      <span style="color:#fff;font-weight:700;letter-spacing:1px"> MMA GYM</span>
    </div>
    <div style="border:1px solid #eee;border-top:0;padding:26px;border-radius:0 0 8px 8px">
      <p style="font-size:16px">Hi ${d.name || 'there'},</p>
      <p style="color:#444;line-height:1.6">Thank you for your payment. Your <b>${d.plan || 'membership'}</b> is now active${d.expiresAt ? ` and valid until <b>${new Date(d.expiresAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</b>` : ''}. Your invoice is attached as a PDF.</p>
      <table style="width:100%;border-collapse:collapse;margin:20px 0">
        <tr><td style="padding:8px 0;color:#888">Invoice No.</td><td style="padding:8px 0;text-align:right;font-weight:700">${d.invoiceNo || '—'}</td></tr>
        <tr><td style="padding:8px 0;color:#888">Plan</td><td style="padding:8px 0;text-align:right;font-weight:700">${d.plan || '—'}</td></tr>
        <tr><td style="padding:8px 0;color:#888">Fees (taxable value)</td><td style="padding:8px 0;text-align:right;font-weight:700">${inr(d.base != null ? d.base : d.amount)}</td></tr>
        <tr><td style="padding:8px 0;color:#888">GST @ ${d.gstRate != null ? d.gstRate : 5}%</td><td style="padding:8px 0;text-align:right;font-weight:700">${inr(d.gst != null ? d.gst : 0)}</td></tr>
        <tr style="border-top:2px solid #e8112d"><td style="padding:12px 0;color:#888">Total Paid (incl. GST)</td><td style="padding:12px 0;text-align:right;font-weight:800;color:#e8112d;font-size:18px">${inr(d.amount)}</td></tr>
      </table>
      <p style="color:#444;line-height:1.6">See you on the mats. Open the app any time to book classes, watch technique videos and track your membership.</p>
      <p style="color:#888;font-size:13px;margin-top:24px">718 MMA Gym · Shivarampally, Hyderabad · +91 91337 18718</p>
    </div>
  </div>`;
}

/**
 * Send an invoice email with the PDF attached.
 * returns { ok, skipped?, error? }
 */
async function sendInvoiceEmail(to, data = {}, pdfBuffer) {
  if (!mailerReady) { console.log('[mailer] SMTP not configured — skipping invoice email to', to); return { ok: false, skipped: true }; }
  if (!to) return { ok: false, error: 'no recipient' };
  try {
    await transporter.sendMail({
      from: FROM,
      to,
      subject: `718 MMA Gym — Invoice ${data.invoiceNo || ''} (${data.plan || 'Membership'})`,
      html: invoiceHtml(data),
      attachments: pdfBuffer ? [{ filename: `${data.invoiceNo || 'invoice'}.pdf`, content: pdfBuffer, contentType: 'application/pdf' }] : [],
    });
    console.log('[mailer] invoice sent to', to);
    return { ok: true };
  } catch (e) {
    console.error('[mailer] send failed:', e.message);
    return { ok: false, error: e.message };
  }
}

function renewalHtml(d = {}) {
  const days = Number(d.daysLeft);
  const when = days > 0 ? `in <b>${days} day${days > 1 ? 's' : ''}</b>` : (days === 0 ? '<b>today</b>' : '<b>has expired</b>');
  const expDate = d.expiresAt ? new Date(d.expiresAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '';
  const cta = d.renewUrl ? `<a href="${d.renewUrl}" style="display:inline-block;background:#e8112d;color:#fff;text-decoration:none;font-weight:700;padding:13px 26px;border-radius:4px;margin-top:8px">Renew Membership</a>` : `<p style="color:#444">Renew at the gym front desk or on the 718 website.</p>`;
  return `
  <div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:auto;color:#111">
    <div style="background:#0c0c0e;padding:22px 26px;border-radius:8px 8px 0 0">
      <span style="font-size:26px;font-weight:800;font-style:italic;color:#fff">7<span style="color:#e8112d">18</span></span>
      <span style="color:#fff;font-weight:700;letter-spacing:1px"> MMA GYM</span>
    </div>
    <div style="border:1px solid #eee;border-top:0;padding:26px;border-radius:0 0 8px 8px">
      <p style="font-size:16px">Hi ${d.name || 'there'},</p>
      <p style="color:#444;line-height:1.6">Your <b>${d.plan || 'membership'}</b> ${when}${expDate ? ` (${days < 0 ? 'expired' : 'valid until'} <b>${expDate}</b>)` : ''}. Renew now so you don't miss a session${d.session ? ` — your slot is <b>${d.session}</b>` : ''}.</p>
      <p style="margin:22px 0">${cta}</p>
      <p style="color:#888;font-size:13px;margin-top:24px">718 MMA Gym · Shivarampally, Hyderabad · +91 91337 18718</p>
    </div>
  </div>`;
}

async function sendRenewalEmail(to, data = {}) {
  if (!mailerReady) { console.log('[mailer] SMTP not configured — skipping renewal email to', to); return { ok: false, skipped: true }; }
  if (!to) return { ok: false, error: 'no recipient' };
  const days = Number(data.daysLeft);
  const subj = days <= 0 ? `718 MMA — your ${data.plan || 'membership'} has expired` : `718 MMA — your ${data.plan || 'membership'} expires ${days === 1 ? 'tomorrow' : 'in ' + days + ' days'}`;
  try {
    await transporter.sendMail({ from: FROM, to, subject: subj, html: renewalHtml(data) });
    console.log('[mailer] renewal reminder sent to', to);
    return { ok: true };
  } catch (e) {
    console.error('[mailer] renewal send failed:', e.message);
    return { ok: false, error: e.message };
  }
}

module.exports = { mailerReady, sendInvoiceEmail, sendRenewalEmail };
