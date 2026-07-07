/**
 * whatsapp.js — send invoice + renewal messages over WhatsApp Cloud API (Meta).
 *   Docs: https://developers.facebook.com/docs/whatsapp/cloud-api
 *
 * Business-initiated messages (invoice / reminder) MUST use pre-approved templates.
 * Create these templates in Meta Business Manager (WhatsApp Manager > Message Templates),
 * get them APPROVED, then put their names in .env. See .env.example for the exact
 * template bodies to submit.
 *
 * If not configured, `whatsappReady` is false and everything silently no-ops —
 * email still works, nothing breaks.
 */
const TOKEN = (process.env.WHATSAPP_TOKEN || '').trim();
const PHONE_ID = (process.env.WHATSAPP_PHONE_NUMBER_ID || '').trim();
const VERSION = (process.env.WHATSAPP_API_VERSION || 'v21.0').trim();
const LANG = (process.env.WHATSAPP_TEMPLATE_LANG || 'en').trim();
const TPL_INVOICE = (process.env.WHATSAPP_TEMPLATE_INVOICE || '').trim();
const TPL_RENEWAL = (process.env.WHATSAPP_TEMPLATE_RENEWAL || '').trim();
const DEFAULT_CC = (process.env.WHATSAPP_DEFAULT_COUNTRY_CODE || '91').replace(/\D/g, '');

const whatsappReady = !!(TOKEN && PHONE_ID);

// Normalise an Indian phone to WhatsApp format (digits, with country code, no +).
function toWa(phone) {
  let p = String(phone || '').replace(/[^\d]/g, '');
  if (!p) return null;
  if (p.length === 10) p = DEFAULT_CC + p;           // 9133xxxxxx -> 919133xxxxxx
  if (p.length === 11 && p.startsWith('0')) p = DEFAULT_CC + p.slice(1);
  return p.length >= 11 ? p : null;
}

const textParams = (arr) => (arr || []).map((t) => ({ type: 'text', text: String(t == null ? '' : t) }));

async function sendTemplate(to, templateName, bodyParams) {
  if (!whatsappReady) return { ok: false, skipped: true };
  if (!templateName) return { ok: false, error: 'template not set' };
  const wa = toWa(to);
  if (!wa) return { ok: false, error: 'no/invalid phone' };
  try {
    const res = await fetch(`https://graph.facebook.com/${VERSION}/${PHONE_ID}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${TOKEN}` },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: wa,
        type: 'template',
        template: {
          name: templateName,
          language: { code: LANG },
          components: [{ type: 'body', parameters: textParams(bodyParams) }],
        },
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok) { console.log('[whatsapp] sent', templateName, 'to', wa); return { ok: true, data }; }
    console.error('[whatsapp] send failed:', JSON.stringify(data));
    return { ok: false, status: res.status, error: (data.error && data.error.message) || `HTTP ${res.status}` };
  } catch (e) { console.error('[whatsapp] error:', e.message); return { ok: false, error: e.message }; }
}

const inr = (n) => '₹' + Number(n || 0).toLocaleString('en-IN');
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '';

// Body params order MUST match the approved template's {{1}},{{2}}… — see .env.example.
async function sendInvoiceWhatsApp(to, d = {}) {
  return sendTemplate(to, TPL_INVOICE, [d.name || 'there', d.plan || 'Membership', d.invoiceNo || '', inr(d.amount)]);
}
async function sendRenewalWhatsApp(to, d = {}) {
  const days = Number(d.daysLeft);
  const whenTxt = days > 0 ? `in ${days} day${days > 1 ? 's' : ''} (${fmtDate(d.expiresAt)})` : (days === 0 ? `today (${fmtDate(d.expiresAt)})` : `on ${fmtDate(d.expiresAt)}`);
  return sendTemplate(to, TPL_RENEWAL, [d.name || 'there', d.plan || 'membership', whenTxt]);
}

module.exports = { whatsappReady, sendInvoiceWhatsApp, sendRenewalWhatsApp, toWa };
