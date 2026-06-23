import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api, inr } from '../api';

function loadRazorpay() {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const s = document.createElement('script');
    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.head.appendChild(s);
  });
}

// plan: {name, price}. onClose(success:boolean)
export default function CheckoutModal({ plan, onClose }) {
  const [form, setForm] = useState({ name: '', email: '', phone: '' });
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);
  if (!plan) return null;
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const pay = async (e) => {
    e.preventDefault();
    if (!form.email) { setMsg({ t: 'err', m: 'Email is required to activate your membership.' }); return; }
    setBusy(true); setMsg(null);
    const res = await api.post('/api/payment/order', { plan: plan.name, amount: plan.price, ...form });
    if (res.error) { setBusy(false); setMsg({ t: 'err', m: res.error }); return; }
    const { order, key, mock } = res;

    if (mock) {
      await api.post('/api/payment/verify', { razorpay_order_id: order.id });
      setBusy(false);
      setMsg({ t: 'ok', m: 'Test payment recorded (mock mode). Your membership is active — you can now log in with Google using ' + form.email + '. Add real Razorpay keys in .env for live UPI/cards.' });
      return;
    }

    const ok = await loadRazorpay();
    if (!ok) { setBusy(false); setMsg({ t: 'err', m: 'Could not load Razorpay. Check your connection.' }); return; }

    const rzp = new window.Razorpay({
      key, amount: order.amount, currency: order.currency,
      name: '718 MMA Gym', description: plan.name + ' membership', order_id: order.id,
      prefill: { name: form.name, email: form.email, contact: form.phone },
      theme: { color: '#e8112d' },
      // UPI, cards, netbanking & wallets are all enabled; this keeps UPI first.
      config: { display: { sequence: ['block.upi', 'block.banks'], preferences: { show_default_blocks: true } } },
      handler: async (response) => {
        const v = await api.post('/api/payment/verify', response);
        setBusy(false);
        setMsg(v.ok
          ? { t: 'ok', m: 'Payment successful! Your membership is active. Log in with Google using ' + form.email + '.' }
          : { t: 'err', m: 'Payment could not be verified.' });
      },
      modal: { ondismiss: () => setBusy(false) },
    });
    rzp.open();
  };

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={() => onClose(msg?.t === 'ok')}
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 200, display: 'grid', placeItems: 'center', padding: 20 }}>
        <motion.div initial={{ scale: 0.92, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.92 }}
          onClick={(e) => e.stopPropagation()} className="form" style={{ maxWidth: 440, width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontFamily: 'var(--cond)', letterSpacing: 1, textTransform: 'uppercase' }}>Join {plan.name}</h2>
            <button onClick={() => onClose(msg?.t === 'ok')} style={{ background: 'none', border: 0, color: '#fff', fontSize: 22, cursor: 'pointer' }}>✕</button>
          </div>
          <p style={{ color: 'var(--red)', fontFamily: 'var(--display)', fontSize: 36 }}>{inr(plan.price)}</p>
          {msg?.t === 'ok' ? (
            <>
              <p className="form-msg ok">✅ {msg.m}</p>
              <button className="btn btn-primary btn-block" style={{ marginTop: 18 }} onClick={() => onClose(true)}>Done</button>
            </>
          ) : (
            <form onSubmit={pay}>
              <label>Full Name</label><input value={form.name} onChange={set('name')} required />
              <label>Email *</label><input type="email" value={form.email} onChange={set('email')} required />
              <label>Phone</label><input value={form.phone} onChange={set('phone')} />
              <p style={{ color: 'var(--grey)', fontSize: 13, marginTop: 12 }}>Pay by UPI, card, netbanking or wallet via Razorpay. Your membership unlocks Google login.</p>
              {msg?.t === 'err' && <p className="form-msg err">⚠️ {msg.m}</p>}
              <button className="btn btn-primary btn-block" style={{ marginTop: 14 }} disabled={busy}>
                {busy ? 'Processing…' : `Pay ${inr(plan.price)}`}
              </button>
            </form>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
