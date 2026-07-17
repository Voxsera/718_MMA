import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Cinematic intro shown on first load: logo + animated loading bar with a
 * counting percentage. When it reaches 100% the whole panel slides up and
 * unmounts, revealing the site. Falls back to a styled text logo if
 * /logo.png is not present yet.
 */
export default function Preloader() {
  const [pct, setPct] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    let cur = 0;
    const tick = setInterval(() => {
      // fast at first, easing off near the end for a natural feel
      const step = cur < 70 ? Math.random() * 7 + 3 : Math.random() * 2.5 + 0.8;
      cur = Math.min(100, cur + step);
      setPct(Math.round(cur));
      if (cur >= 100) {
        clearInterval(tick);
        setTimeout(() => setDone(true), 600);
      }
    }, 80);
    return () => {
      clearInterval(tick);
      document.body.style.overflow = '';
    };
  }, []);

  // ensure scroll is restored the moment the panel begins leaving
  useEffect(() => {
    if (done) document.body.style.overflow = '';
  }, [done]);

  return (
    <AnimatePresence>
      {!done && (
        <motion.div
          key="preloader"
          className="preloader"
          initial={{ opacity: 1 }}
          exit={{ y: '-100%', transition: { duration: 0.85, ease: [0.76, 0, 0.24, 1] } }}
        >
          <div className="preloader-glow" />

          <motion.img
            src="/718mma-logo.png"
            alt="718 MMA Club"
            className="preloader-logo"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              const f = e.currentTarget.nextElementSibling;
              if (f) f.style.display = 'block';
            }}
            initial={{ opacity: 0, scale: 0.85, filter: 'blur(10px)' }}
            animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
            transition={{ duration: 0.9, ease: 'easeOut' }}
          />
          <div className="preloader-fallback" style={{ display: 'none' }}>
            7<span style={{ color: 'var(--red)' }}>18</span>
            <small>MMA CLUB</small>
          </div>

          <motion.div
            className="preloader-meta"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45, duration: 0.6 }}
          >
            <div className="preloader-track">
              <div className="preloader-fill" style={{ width: pct + '%' }} />
            </div>
            <div className="preloader-row">
              <span>Loading</span>
              <span className="preloader-pct">{pct}%</span>
            </div>
          </motion.div>

          <style>{`
            .preloader{position:fixed;inset:0;z-index:9999;background:#050505;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:42px;padding:24px;overflow:hidden}
            .preloader-glow{position:absolute;width:620px;height:620px;border-radius:50%;background:radial-gradient(circle, rgba(229,9,20,0.20), transparent 65%);filter:blur(20px);pointer-events:none}
            .preloader-logo{position:relative;width:min(380px,74vw);max-width:380px;height:auto;object-fit:contain;filter:drop-shadow(0 0 34px rgba(229,9,20,0.4))}
            .preloader-fallback{position:relative;font-family:Anton,sans-serif;font-style:italic;font-size:clamp(64px,16vw,108px);line-height:.9;color:#fff;letter-spacing:-2px;text-align:center}
            .preloader-fallback small{display:block;font-family:var(--cond),sans-serif;font-style:normal;font-size:clamp(16px,4vw,24px);letter-spacing:10px;color:var(--red);margin-top:8px}
            .preloader-meta{position:relative;width:min(380px,74vw)}
            .preloader-track{height:3px;width:100%;background:rgba(255,255,255,0.12);overflow:hidden;border-radius:2px}
            .preloader-fill{height:100%;background:var(--red);box-shadow:0 0 14px var(--red);transition:width .12s linear}
            .preloader-row{display:flex;justify-content:space-between;align-items:center;margin-top:14px;font-family:var(--cond),sans-serif;letter-spacing:3px;text-transform:uppercase;font-size:13px;color:var(--grey-light)}
            .preloader-pct{color:#fff;font-weight:700;font-size:15px}
          `}</style>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
