import { useEffect, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import './SplashScreen.css';

/**
 * 718 MMA — CRT "power-on" splash (Nike-app inspired, original sequence).
 *
 * The entire FRAME behaves like a tube TV, not just the logo:
 * power-on line → flash into static → the whole picture rolls vertically
 * as the signal catches → brightness blooms/dips (phosphor flicker) →
 * logo tunes in through the noise → one hard full-frame glitch jolt with
 * slice tearing + RGB split → signal locks → dissolve into the site.
 *
 * Plays once per browser session. Respects prefers-reduced-motion.
 */

// ─── Tweak everything here (times in seconds) ────────────────────────
export const SPLASH_CONFIG = {
  enabled: true,                    // master switch
  duration: 1.6,                    // total time before the overlay dissolves
  exitDuration: 0.4,                // overlay dissolve
  logoSrc: '/718mma-logo.png',
  logoWidth: 'min(340px, 68vw)',
  background: '#000000',
  accentGlow: 'rgba(232, 17, 45, 0.4)',
  storageKey: '718-splash-seen',
  powerOnDelay: 0.08,               // when the TV line appears
  powerOnDuration: 0.5,             // line snap + vertical expansion
  logoDelay: 0.48,                  // logo starts tuning in
  logoDuration: 0.55,               // blur→sharp reveal
  pulseAt: 1.05,                    // the hard glitch pulse
  pulseDuration: 0.14,
};
// ─────────────────────────────────────────────────────────────────────

export default function SplashScreen(props) {
  const cfg = { ...SPLASH_CONFIG, ...props };
  const reduced = useReducedMotion();

  const [show, setShow] = useState(() => {
    if (!cfg.enabled) return false;
    try { return sessionStorage.getItem(cfg.storageKey) !== '1'; } catch { return true; }
  });

  useEffect(() => {
    if (!show) return undefined;
    try { sessionStorage.setItem(cfg.storageKey, '1'); } catch { /* private mode */ }
    document.body.style.overflow = 'hidden';
    const total = (reduced ? 0.7 : cfg.duration) * 1000;
    const t = setTimeout(() => {
      document.body.style.overflow = '';
      setShow(false);
    }, total);
    return () => { clearTimeout(t); document.body.style.overflow = ''; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show, reduced]);

  if (!cfg.enabled) return null;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="splash"
          className="splash"
          style={{ '--splash-bg': cfg.background, '--splash-accent': cfg.accentGlow }}
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: cfg.exitDuration, ease: [0.4, 0, 0.2, 1] } }}
          aria-hidden="true"
        >
          {reduced ? (
            <motion.img
              className="splash-logo"
              src={cfg.logoSrc}
              alt=""
              style={{ width: cfg.logoWidth }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.45, ease: 'easeOut' }}
            />
          ) : (
            <>
              {/* ══ THE PICTURE ══ everything inside behaves like one TV image:
                  it rolls vertically when the signal catches, blooms and dips
                  in brightness, and jolts sideways on the glitch pulse. */}
              <motion.div
                className="splash-frame"
                initial={{ y: 26, x: 0, opacity: 0, filter: 'brightness(1)' }}
                animate={{
                  opacity: [0, 0, 1, 1],
                  /* vertical hold slipping, then locking */
                  y: [26, 26, -14, 6, -2, 0, 0],
                  /* full-frame sideways jolt on the pulse */
                  x: [0, 0, 0, 0, 0, -11, 9, -4, 0, 0],
                  /* phosphor bloom: bright when static hits, dip, bloom on pulse */
                  filter: [
                    'brightness(1)',
                    'brightness(1)',
                    'brightness(1.45)',
                    'brightness(0.8)',
                    'brightness(1.15)',
                    'brightness(1)',
                    'brightness(1.35)',
                    'brightness(0.9)',
                    'brightness(1)',
                  ],
                }}
                transition={{
                  duration: cfg.duration,
                  ease: 'linear',
                  opacity: { duration: cfg.duration, times: [0, 0.28, 0.34, 1] },
                  y: { duration: cfg.duration, times: [0, 0.3, 0.38, 0.45, 0.5, 0.56, 1] },
                  x: { duration: cfg.duration, times: [0, 0.64, 0.655, 0.675, 0.69, 0.7, 0.715, 0.73, 0.74, 1] },
                  filter: { duration: cfg.duration, times: [0, 0.3, 0.34, 0.42, 0.5, 0.62, 0.67, 0.71, 1] },
                }}
              >
                {/* analog static — loud when the tube fires up, settles as signal locks */}
                <motion.div
                  className="splash-noise"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0, 0, 0.5, 0.2, 0.1, 0] }}
                  transition={{ duration: cfg.duration, times: [0, 0.26, 0.32, 0.52, 0.85, 1], ease: 'linear' }}
                />
                <motion.div
                  className="splash-scanlines"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0, 0, 1, 0.75, 0] }}
                  transition={{ duration: cfg.duration, times: [0, 0.26, 0.32, 0.8, 1], ease: 'linear' }}
                />
                <motion.div
                  className="splash-sweep"
                  initial={{ y: '-12vh', opacity: 0 }}
                  animate={{ y: '110vh', opacity: [0, 0, 1, 1, 0] }}
                  transition={{ delay: 0.35, duration: cfg.duration * 0.7, times: [0, 0.05, 0.15, 0.85, 1], ease: 'linear' }}
                />

                {/* logo stage */}
                <div className="splash-stage">
                  <motion.div
                    className="splash-glow"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0, 0.65, 0.15, 0.45, 0] }}
                    transition={{ delay: cfg.logoDelay + 0.08, duration: 0.9, times: [0, 0.3, 0.6, 0.8, 1], ease: 'easeOut' }}
                  />
                  <motion.img
                    className="splash-logo"
                    src={cfg.logoSrc}
                    alt=""
                    style={{ width: cfg.logoWidth }}
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      const f = e.currentTarget.parentElement.querySelector('.splash-fallback');
                      if (f) f.style.display = 'block';
                    }}
                    initial={{ opacity: 0, scale: 0.96, filter: 'blur(10px)' }}
                    animate={{
                      opacity: [0, 0.85, 0.35, 0.95, 0.6, 1],
                      scale: 1,
                      filter: 'blur(0px)',
                    }}
                    transition={{
                      delay: cfg.logoDelay,
                      duration: cfg.logoDuration,
                      ease: [0.22, 1, 0.36, 1],
                      opacity: {
                        delay: cfg.logoDelay,
                        duration: cfg.logoDuration,
                        times: [0, 0.22, 0.34, 0.55, 0.68, 1],
                        ease: 'linear',
                      },
                    }}
                  />
                  <div className="splash-fallback">
                    7<span style={{ color: 'var(--red)' }}>18</span>
                    <small>MMA CLUB</small>
                  </div>

                  {/* chromatic ghosts — flick while tuning, again on the pulse */}
                  <motion.img
                    className="splash-ghost splash-ghost-r"
                    src={cfg.logoSrc}
                    alt=""
                    initial={{ opacity: 0, x: 0 }}
                    animate={{ opacity: [0, 0.55, 0, 0, 0.7, 0], x: [0, 5, 0, 0, 7, 0] }}
                    transition={{ delay: 0.72, duration: 0.52, times: [0, 0.09, 0.18, 0.6, 0.78, 1], ease: 'linear' }}
                  />
                  <motion.img
                    className="splash-ghost splash-ghost-c"
                    src={cfg.logoSrc}
                    alt=""
                    initial={{ opacity: 0, x: 0 }}
                    animate={{ opacity: [0, 0.55, 0, 0, 0.7, 0], x: [0, -5, 0, 0, -7, 0] }}
                    transition={{ delay: 0.72, duration: 0.52, times: [0, 0.09, 0.18, 0.6, 0.78, 1], ease: 'linear' }}
                  />

                  {/* slice tearing on the pulse */}
                  <motion.img
                    className="splash-slice splash-slice-t"
                    src={cfg.logoSrc}
                    alt=""
                    initial={{ opacity: 0, x: 0 }}
                    animate={{ opacity: [0, 1, 1, 0], x: [0, 13, -8, 0] }}
                    transition={{ delay: cfg.pulseAt - 0.02, duration: cfg.pulseDuration + 0.06, times: [0, 0.3, 0.7, 1], ease: 'linear' }}
                  />
                  <motion.img
                    className="splash-slice splash-slice-b"
                    src={cfg.logoSrc}
                    alt=""
                    initial={{ opacity: 0, x: 0 }}
                    animate={{ opacity: [0, 1, 1, 0], x: [0, -14, 9, 0] }}
                    transition={{ delay: cfg.pulseAt - 0.02, duration: cfg.pulseDuration + 0.06, times: [0, 0.3, 0.7, 1], ease: 'linear' }}
                  />
                </div>

                {/* full-width tear bands — the whole picture rips on the pulse */}
                <motion.div
                  className="splash-tear splash-tear-1"
                  initial={{ opacity: 0, x: 0 }}
                  animate={{ opacity: [0, 1, 0.7, 0], x: [0, 18, -10, 0] }}
                  transition={{ delay: cfg.pulseAt - 0.01, duration: cfg.pulseDuration + 0.04, times: [0, 0.35, 0.7, 1], ease: 'linear' }}
                />
                <motion.div
                  className="splash-tear splash-tear-2"
                  initial={{ opacity: 0, x: 0 }}
                  animate={{ opacity: [0, 1, 0.7, 0], x: [0, -22, 12, 0] }}
                  transition={{ delay: cfg.pulseAt, duration: cfg.pulseDuration + 0.04, times: [0, 0.35, 0.7, 1], ease: 'linear' }}
                />
              </motion.div>

              {/* ══ THE GLASS ══ static overlays that sit on top like a tube:
                  phosphor RGB stripes + curvature/corner shading */}
              <div className="splash-phosphor" />
              <div className="splash-curve" />

              {/* power-on: thin line snaps across, expands into the picture */}
              <motion.div
                className="splash-poweron"
                initial={{ scaleX: 0, scaleY: 0.004, opacity: 1 }}
                animate={{
                  scaleX: [0, 1, 1, 1],
                  scaleY: [0.004, 0.004, 0.02, 1],
                  opacity: [1, 1, 1, 0],
                }}
                transition={{
                  delay: cfg.powerOnDelay,
                  duration: cfg.powerOnDuration,
                  times: [0, 0.34, 0.5, 1],
                  ease: [0.7, 0, 0.3, 1],
                }}
              />
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
