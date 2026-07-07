import React from 'react';
import { motion } from 'framer-motion';

/**
 * Adapted from React Bits "testimonials-columns-1" for this project's stack
 * (JavaScript + framer-motion + custom CSS, no Tailwind). A column of cards
 * that scrolls vertically in an infinite loop. The list is duplicated so the
 * -50% translate loops seamlessly.
 *
 * Each testimonial: { text, name, role, rating }.
 */
export function TestimonialsColumn({ className = '', testimonials = [], duration = 10 }) {
  return (
    <div className={className}>
      <motion.div
        animate={{ translateY: '-50%' }}
        transition={{ duration, repeat: Infinity, ease: 'linear', repeatType: 'loop' }}
        className="tcol"
      >
        {[...new Array(2).fill(0)].map((_, index) => (
          <React.Fragment key={index}>
            {testimonials.map(({ text, name, role, rating }, i) => (
              <div className="tcard" key={i}>
                {rating ? (
                  <div className="tcard-stars">{'★'.repeat(rating)}{'☆'.repeat(5 - rating)}</div>
                ) : null}
                <div className="tcard-text">“{text}”</div>
                <div className="tcard-who">
                  <div className="tcard-av">{name ? name[0] : '?'}</div>
                  <div>
                    <div className="tcard-name">{name}</div>
                    <div className="tcard-role">{role}</div>
                  </div>
                </div>
              </div>
            ))}
          </React.Fragment>
        ))}
      </motion.div>
    </div>
  );
}

export default TestimonialsColumn;
