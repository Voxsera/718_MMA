/**
 * Seeds the database with demo data for 718 MMA Gym.
 * Run with:  npm run seed
 * Safe to re-run — it wipes and reloads the seed tables (not bookings/payments).
 */
const db = require('./db');

const img = (id) => `https://images.unsplash.com/${id}?w=900&q=70&auto=format&fit=crop`;

// ---- Courses ----
const courses = [
  ['mma', 'MMA', 'Mixed Martial Arts', 'The complete combat discipline — striking, grappling and ground game blended into one. Train like a fighter, build real confidence.', img('photo-1605296867304-46d5465a13f1'), 1],
  ['muay-thai', 'Muay Thai', 'The Art of Eight Limbs', 'Fists, elbows, knees and shins. Sharpen your stand-up game with authentic Thai boxing under experienced coaches.', img('photo-1549719386-74dfcbf7dbed'), 2],
  ['kickboxing', 'Kickboxing', 'Power & Cardio', 'Explosive kicks and punches with high-intensity conditioning. Burn fat, build power, learn to fight.', img('photo-1517438476312-10d79c077509'), 3],
  ['boxing', 'Boxing', 'The Sweet Science', 'Footwork, head movement and crisp punches. From first-timers to competitors, build hands of stone.', img('photo-1599058917212-d750089bc07e'), 4],
  ['jujutsu', 'Jujutsu', 'Traditional Grappling', 'Classic Japanese jujutsu — joint locks, throws and self-defense fundamentals for every body type.', img('photo-1555597673-b21d5c935865'), 5],
  ['bjj', 'BJJ', 'Brazilian Jiu-Jitsu', 'The gentle art. Leverage and technique over strength — control any opponent on the ground.', img('photo-1574680178050-55c6a6a96e0a'), 6],
  ['wrestling', 'Wrestling', 'Takedowns & Control', 'Olympic-style wrestling. Master takedowns, scrambles and top control — the backbone of MMA.', img('photo-1517649763962-0c623066013b'), 7],
  ['crossfit', 'CrossFit', 'Functional Strength', 'Strength and conditioning built for fighters and everyone else. Move better, hit harder, last longer.', img('photo-1534438327276-14e5300c3a48'), 8],
];

// ---- Memberships & Personal Training ----
const memberships = [
  ['Day Pass', 'membership', 300, '1 day', 'Full facility & equipment access\nJoin any of the 4 daily sessions\nAll disciplines included', 0, 1],
  ['Monthly', 'membership', 3000, '1 month', 'Unlimited classes (all 8 disciplines)\n4 sessions every day, 6 AM – 12 AM\nFull facility & equipment access\nFree locker', 1, 2],
  ['Quarterly', 'membership', 8000, '3 months', 'Everything in Monthly\nSave ₹1,000 vs monthly\n1 free PT session\nPriority event booking', 0, 3],
  ['Annual', 'membership', 28000, '12 months', 'Everything in Quarterly\nSave ₹8,000 vs monthly\n4 free PT sessions\nFree 718 MMA tee\nGuest passes', 0, 4],
  // Personal training
  ['PT — Starter', 'personal_training', 6000, '8 sessions / month', '2 sessions per week\n1-on-1 coaching\nCustom training plan\nForm & technique focus', 0, 5],
  ['PT — Pro', 'personal_training', 10000, '12 sessions / month', '3 sessions per week\n1-on-1 coaching\nCustom plan + diet guidance\nFight-prep available', 1, 6],
  ['PT — Elite', 'personal_training', 16000, '20 sessions / month', '5 sessions per week\nDedicated head coach\nFull diet + recovery plan\nCompetition cornering', 0, 7],
];

// ---- Trainers ----
const trainers = [
  ['Coach Imran', 'MMA & Wrestling', 10000, 'National-level grappler. Specializes in takedowns, cage control and fight IQ.', img('photo-1567013127542-490d757e51fc')],
  ['Coach Rahul', 'Muay Thai & Kickboxing', 9000, 'A-class Muay Thai fighter. Razor-sharp striking and conditioning.', img('photo-1583454110551-21f2fa2afe61')],
  ['Coach Vikram', 'Boxing', 9000, 'Ex-amateur boxing champ. Builds clean fundamentals and knockout power.', img('photo-1594381898411-846e7d193883')],
  ['Coach Aisha', 'BJJ & Jujutsu', 9500, 'Brown belt under a renowned academy. Patient, technical ground game.', img('photo-1549476464-37392f717541')],
];

// ---- Food ----
const foods = [
  ['Grilled Chicken & Quinoa Bowl', 'Post-Workout', 'Lean protein with complex carbs to refuel and rebuild muscle after training.', '520 kcal', '48g protein', img('photo-1546069901-ba9599a7e63c'), 'https://www.swiggy.com'],
  ['Egg White Omelette', 'Pre-Workout', 'Light, high-protein and easy to digest before you hit the mats.', '280 kcal', '26g protein', img('photo-1525351484163-7529414344d8'), 'https://www.zomato.com'],
  ['Paneer & Veg Power Plate', 'Post-Workout', 'Vegetarian protein with greens for recovery and strength.', '480 kcal', '32g protein', img('photo-1565299624946-b28f40a0ae38'), 'https://www.swiggy.com'],
  ['Oats & Banana Bowl', 'Pre-Workout', 'Slow-release energy to power through 4 sessions a day.', '350 kcal', '12g protein', img('photo-1517673400267-0251440c45dc'), 'https://www.zomato.com'],
  ['Whey Protein Shake', 'Post-Workout', 'Fast-absorbing protein for the 30-minute recovery window.', '160 kcal', '25g protein', img('photo-1622484212850-eb596d769edc'), 'https://www.swiggy.com'],
  ['Grilled Fish & Sweet Potato', 'Dinner', 'Omega-3 rich lean protein with clean carbs to wind down the day.', '460 kcal', '40g protein', img('photo-1467003909585-2f8a72700288'), 'https://www.zomato.com'],
];

// ---- Reviews (static Google reviews) ----
const reviews = [
  ['Sai Teja', 5, 'Best MMA gym in Hyderabad hands down. Coaches actually care and the facility is open till midnight which is perfect for my schedule.', '6 days ago'],
  ['Muaythai Hype', 5, 'To be honest, best place for sports events. Hosted ours here and it was flawless.', '1 day ago'],
  ['Arjun Reddy', 5, 'Joined for boxing, ended up trying everything. 4 sessions a day means I never miss training. Highly recommend.', '2 weeks ago'],
  ['Priya N', 5, 'Clean mats, professional coaching and a community that pushes you. The free trial sold me instantly.', '3 weeks ago'],
  ['Karthik M', 4, 'Great equipment and flexible timings. Wrestling classes are top notch. Parking can get busy in the evening.', '1 month ago'],
  ['Sneha R', 5, 'As a woman starting out I felt safe and welcomed. BJJ coach is incredibly patient. Love this place.', '1 month ago'],
];

// ---- Events (past / ongoing / upcoming) ----
const events = [
  ['718 Grand Opening Showcase', 'Our launch event — exhibition fights, free classes and a community celebration on the mats.', '2026-01-18', '718 MMA, Shivarampally', img('photo-1547347298-4074fc3086f0'), 'past'],
  ['Inter-Gym Boxing Sparring', 'Friendly sparring meet with boxing gyms across Hyderabad. Great turnout, great energy.', '2026-03-22', '718 MMA Arena', img('photo-1581009146145-b5ef050c2e1e'), 'past'],
  ['Summer Muay Thai Camp', 'A 2-week intensive Muay Thai camp running now — pad work, clinch and conditioning every evening.', '2026-06-15', '718 MMA, Shivarampally', img('photo-1549719386-74dfcbf7dbed'), 'ongoing'],
  ['Open Mat Saturdays', 'Ongoing weekly open mat for grappling & BJJ. All levels welcome, every Saturday.', '2026-06-20', '718 MMA Mat Area', img('photo-1574680178050-55c6a6a96e0a'), 'ongoing'],
  ['718 Amateur MMA Night', 'Our first amateur MMA fight card. Watch 718 athletes compete in the cage. Tickets soon.', '2026-08-09', '718 MMA Arena', img('photo-1605296867304-46d5465a13f1'), 'upcoming'],
  ['BJJ Seminar with Black Belt', 'Special guest seminar — advanced guard systems and competition strategy.', '2026-09-14', '718 MMA, Shivarampally', img('photo-1555597673-b21d5c935865'), 'upcoming'],
];

const tx = db.transaction(() => {
  db.exec('DELETE FROM courses; DELETE FROM memberships; DELETE FROM trainers; DELETE FROM foods; DELETE FROM reviews; DELETE FROM events;');

  const c = db.prepare('INSERT INTO courses (slug,name,tagline,description,image,sort) VALUES (?,?,?,?,?,?)');
  courses.forEach((r) => c.run(...r));

  const m = db.prepare('INSERT INTO memberships (name,type,price,duration,features,popular,sort) VALUES (?,?,?,?,?,?,?)');
  memberships.forEach((r) => m.run(...r));

  const t = db.prepare('INSERT INTO trainers (name,specialty,fee,bio,image) VALUES (?,?,?,?,?)');
  trainers.forEach((r) => t.run(...r));

  const f = db.prepare('INSERT INTO foods (name,category,description,calories,protein,image,order_url) VALUES (?,?,?,?,?,?,?)');
  foods.forEach((r) => f.run(...r));

  const rv = db.prepare('INSERT INTO reviews (author,rating,text,relative_time) VALUES (?,?,?,?)');
  reviews.forEach((r) => rv.run(...r));

  const e = db.prepare('INSERT INTO events (title,description,event_date,location,image,status) VALUES (?,?,?,?,?,?)');
  events.forEach((r) => e.run(...r));
});

tx();
console.log('✅ Seeded: courses, memberships, trainers, foods, reviews, events.');
