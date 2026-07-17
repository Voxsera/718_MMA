/**
 * worldline.js — push a payment to a physical Worldline terminal (Antera)
 * via the Terminal API "cloud-to-cloud" integration.
 *   Docs: https://docs.terminal.worldline-solutions.com/explore-our-solutions/cloud-integration
 *
 * Model: our server -> HTTPS (Bearer API key) -> Worldline cloud -> your terminal (by TID).
 * The customer pays on the machine; Worldline POSTs the result to our webhook.
 *
 * Configure in .env (see .env.example). If not configured, `worldlineReady` is false
 * and the app silently falls back to manual "record online" — nothing breaks.
 *
 * ⚠️ The EXACT request body + webhook payload come from YOUR Worldline API Reference.
 *    buildPaymentBody() and parseWebhook() are built to the standard Terminal API and
 *    marked "ADJUST" where your account's schema may differ. Once you share the API
 *    reference (or a sample request/response), these are the only two spots to tweak.
 */
const BASE = (process.env.WORLDLINE_API_BASE_URL || '').trim().replace(/\/+$/, '');
const API_KEY = (process.env.WORLDLINE_API_KEY || '').trim();
const TID = (process.env.WORLDLINE_TID || '').trim();        // POIID (terminal id)
const MID = (process.env.WORLDLINE_MID || '').trim();        // merchant id (if required)
const SALE_ID = (process.env.WORLDLINE_SALE_ID || '718-crm').trim();
const CURRENCY = (process.env.WORLDLINE_CURRENCY || 'INR').trim();
const PAY_PATH = (process.env.WORLDLINE_PAYMENT_PATH || '/payments').trim(); // ADJUST to API ref

const worldlineReady = !!(BASE && API_KEY && TID);

// ---- Build the payment request body. ADJUST field names to your API Reference. ----
function buildPaymentBody({ amount, reference, callbackUrl }) {
  return {
    // Standard Terminal API (Nexo SaleToPOIRequest) shape:
    SaleToPOIRequest: {
      MessageHeader: {
        ProtocolVersion: '5.1',
        MessageClass: 'Service',
        MessageCategory: 'Payment',
        MessageType: 'Request',
        ServiceID: String(reference).slice(-10),
        SaleID: SALE_ID,
        POIID: TID,
      },
      PaymentRequest: {
        SaleData: {
          SaleTransactionID: { TransactionID: reference, TimeStamp: new Date().toISOString() },
        },
        PaymentTransaction: {
          AmountsReq: { Currency: CURRENCY, RequestedAmount: Number(amount) },
        },
      },
    },
    // Flat convenience fields (some Worldline cloud profiles use these instead):
    terminalId: TID,
    merchantId: MID || undefined,
    amount: Number(amount),
    currency: CURRENCY,
    reference,
    callbackUrl,
  };
}

// ---- Send the sale to the terminal. Returns { ok, sent?, status?, error? }. ----
async function pushSale({ amount, reference, callbackUrl }) {
  if (!worldlineReady) return { ok: false, error: 'Worldline terminal is not configured.' };
  try {
    const res = await fetch(`${BASE}${PAY_PATH}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${API_KEY}` },
      body: JSON.stringify(buildPaymentBody({ amount, reference, callbackUrl })),
    });
    const text = await res.text();
    let data = {}; try { data = JSON.parse(text); } catch (e) {}
    if (res.ok) return { ok: true, sent: true, data };
    return { ok: false, status: res.status, error: (data && (data.message || data.error)) || text || `HTTP ${res.status}` };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

// ---- Parse the webhook Worldline POSTs to our callback URL. ADJUST to your payload. ----
// Must return { reference, approved, transactionId }.
function parseWebhook(body) {
  const b = body || {};
  const pr = b.SaleToPOIResponse && b.SaleToPOIResponse.PaymentResponse;
  const reference =
    b.reference || b.transactionReference || b.SaleTransactionID ||
    (pr && pr.SaleData && pr.SaleData.SaleTransactionID && pr.SaleData.SaleTransactionID.TransactionID) || null;
  const resultRaw = String(
    b.result || b.status || (pr && pr.Response && pr.Response.Result) || ''
  ).toLowerCase();
  const approved = b.approved === true ||
    ['success', 'approved', 'authorised', 'authorized', 'ok', 'completed'].includes(resultRaw);
  const transactionId =
    b.transactionId || b.paymentId ||
    (pr && pr.POIData && pr.POIData.POITransactionID && pr.POIData.POITransactionID.TransactionID) || null;
  return { reference, approved, transactionId, raw: b };
}

module.exports = { worldlineReady, pushSale, parseWebhook, TID, MID };
