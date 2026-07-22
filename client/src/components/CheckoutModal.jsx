import { motion, AnimatePresence } from 'framer-motion';
import { inr } from '../api';

const GYM_PHONE = '+91 91337 18718';
const GYM_PHONE_TEL = '+919133718718';
const GYM_EMAIL = '718mmahyd@gmail.com';

// plan: {name, price}. onClose(success:boolean). Memberships are purchased at the gym,
// not online — this just points the visitor to contact the front desk.
export default function CheckoutModal({ plan, onClose }) {
  if (!plan) return null;
  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={() => onClose(false)}
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 200, display: 'grid', placeItems: 'center', padding: 20 }}>
        <motion.div initial={{ scale: 0.92, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.92 }}
          onClick={(e) => e.stopPropagation()} className="form" style={{ maxWidth: 440, width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontFamily: 'var(--cond)', letterSpacing: 1, textTransform: 'uppercase' }}>{plan.name}</h2>
            <button onClick={() => onClose(false)} style={{ background: 'none', border: 0, color: '#fff', fontSize: 22, cursor: 'pointer' }}>✕</button>
          </div>
          <p style={{ color: 'var(--red)', fontFamily: 'var(--display)', fontSize: 36 }}>{inr(plan.price)}</p>

          <p style={{ color: 'var(--grey-light)', fontSize: 15, lineHeight: 1.6, marginTop: 4 }}>
            To join, please contact the gym or visit us at the front desk — our team will set up your membership and activate your account.
          </p>

          <div style={{ margin: '20px 0', display: 'grid', gap: 10 }}>
            <div style={{ color: '#fff' }}>📞 <b>{GYM_PHONE}</b></div>
            <div style={{ color: '#fff' }}>✉️ {GYM_EMAIL}</div>
            <div style={{ color: 'var(--grey)', fontSize: 14 }}>📍 Opp. National Police Academy, Shivarampally, Hyderabad</div>
          </div>

          <a href={`tel:${GYM_PHONE_TEL}`} className="btn btn-primary btn-block" style={{ marginTop: 6 }}>Call The Gym</a>
          <a href={`https://wa.me/${GYM_PHONE_TEL.replace('+', '')}`} target="_blank" rel="noreferrer" className="btn btn-outline btn-block" style={{ marginTop: 10 }}>WhatsApp Us</a>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
