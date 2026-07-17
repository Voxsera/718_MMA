/**
 * Seeds the database (Supabase/Postgres) with demo data for 718 MMA Gym.
 * Run directly:  npm run seed
 * Or imported by server.js and awaited on first boot.
 * Wipes and reloads the seed tables (courses/memberships/trainers/foods/reviews/events);
 * it does NOT touch bookings, payments, users or memberships.
 */
require('dotenv').config();
const db = require('./db');

const img = (id) => `https://images.unsplash.com/${id}?w=900&q=70&auto=format&fit=crop`;

const courses = [
  ['mma', 'MMA', 'Mixed Martial Arts', 'The complete combat discipline — striking, grappling and ground game blended into one. Train like a fighter, build real confidence.', '/course-mma.png', 1],
  ['muay-thai', 'Muay Thai', 'The Art of Eight Limbs', 'Fists, elbows, knees and shins. Sharpen your stand-up game with authentic Thai boxing under experienced coaches.', '/course-muay-thai.png', 2],
  ['kickboxing', 'Kickboxing', 'Power & Cardio', 'Explosive kicks and punches with high-intensity conditioning. Burn fat, build power, learn to fight.', '/course-kickboxing.png', 3],
  ['boxing', 'Boxing', 'The Sweet Science', 'Footwork, head movement and crisp punches. From first-timers to competitors, build hands of stone.', '/course-boxing.png', 4],
  ['jujutsu', 'Jujutsu', 'Traditional Grappling', 'Classic Japanese jujutsu — joint locks, throws and self-defense fundamentals for every body type.', '/course-jujutsu.png', 5],
  ['wrestling', 'Wrestling', 'Takedowns & Control', 'Olympic-style wrestling. Master takedowns, scrambles and top control — the backbone of MMA.', '/course-wrestling.png', 7],
  ['crossfit', 'CrossFit', 'Functional Strength', 'Strength and conditioning built for fighters and everyone else. Move better, hit harder, last longer.', '/course-crossfit.png', 8],
];

const memberships = [
  // ---- MMA ----
  ['MMA — 1 Month', 'membership', 2499, '1 Month', 'MMA — all striking & grappling\nChoose your daily session\nFull facility & equipment access', 0, 1],
  ['MMA — 3 Months', 'membership', 5999, '3 Months', 'MMA — all striking & grappling\nChoose your daily session\nSave vs monthly', 0, 2],
  ['MMA — 6 Months', 'membership', 8999, '6 Months', 'MMA — all striking & grappling\nChoose your daily session\nGreat for regulars', 0, 3],
  ['MMA — 1 Year', 'membership', 14000, '1 Year', 'MMA — all striking & grappling\nChoose your daily session\nMaximum savings', 0, 4],
  // ---- CrossFit ----
  ['CrossFit — 1 Month', 'membership', 1999, '1 Month', 'CrossFit strength & conditioning\nChoose your daily session\nFull facility access', 0, 5],
  ['CrossFit — 3 Months', 'membership', 4500, '3 Months', 'CrossFit strength & conditioning\nChoose your daily session\nSave vs monthly', 0, 6],
  ['CrossFit — 6 Months', 'membership', 7500, '6 Months', 'CrossFit strength & conditioning\nChoose your daily session', 0, 7],
  ['CrossFit — 1 Year', 'membership', 12000, '1 Year', 'CrossFit strength & conditioning\nChoose your daily session\nMaximum savings', 0, 8],
  // ---- Both MMA & CrossFit ----
  ['MMA + CrossFit — 1 Month', 'membership', 2999, '1 Month', 'Full access — MMA + CrossFit\nChoose your daily session\nEverything included', 0, 9],
  ['MMA + CrossFit — 3 Months', 'membership', 6999, '3 Months', 'Full access — MMA + CrossFit\nChoose your daily session\nBest value', 1, 10],
  ['MMA + CrossFit — 6 Months', 'membership', 10500, '6 Months', 'Full access — MMA + CrossFit\nChoose your daily session', 0, 11],
  ['MMA + CrossFit — 1 Year', 'membership', 18000, '1 Year', 'Full access — MMA + CrossFit\nChoose your daily session\nMaximum savings', 0, 12],
];

const trainers = [
  ['Coach Saif "Thai Boxer"', 'Muay Thai & Striking', 9000, 'Professional Muay Thai coach certified in Bangkok with 10+ years in martial arts. National Muay Thai & MMA champion who has trained 500+ students across Telangana. Leads the 718 stand-up, clinch and striking program for all levels.', '/saif_thai_boxer.png'],
];

const foods = [
  ['Grilled Chicken & Quinoa Bowl', 'Post-Workout', 'Lean protein with complex carbs to refuel and rebuild muscle after training.', '520 kcal', '48g protein', img('photo-1546069901-ba9599a7e63c'), 'https://www.swiggy.com'],
  ['Egg White Omelette', 'Pre-Workout', 'Light, high-protein and easy to digest before you hit the mats.', '280 kcal', '26g protein', img('photo-1525351484163-7529414344d8'), 'https://www.zomato.com'],
  ['Paneer & Veg Power Plate', 'Post-Workout', 'Vegetarian protein with greens for recovery and strength.', '480 kcal', '32g protein', img('photo-1565299624946-b28f40a0ae38'), 'https://www.swiggy.com'],
  ['Oats & Banana Bowl', 'Pre-Workout', 'Slow-release energy to power through 4 sessions a day.', '350 kcal', '12g protein', img('photo-1517673400267-0251440c45dc'), 'https://www.zomato.com'],
  ['Whey Protein Shake', 'Post-Workout', 'Fast-absorbing protein for the 30-minute recovery window.', '160 kcal', '25g protein', img('photo-1622484212850-eb596d769edc'), 'https://www.swiggy.com'],
  ['Grilled Fish & Sweet Potato', 'Dinner', 'Omega-3 rich lean protein with clean carbs to wind down the day.', '460 kcal', '40g protein', img('photo-1467003909585-2f8a72700288'), 'https://www.zomato.com'],
];

const reviews = [
  ['Sai Teja', 5, 'Best MMA gym in Hyderabad hands down. Coaches actually care and the facility is open till midnight which is perfect for my schedule.', '6 days ago'],
  ['Muaythai Hype', 5, 'To be honest, best place for sports events. Hosted ours here and it was flawless.', '1 day ago'],
  ['Arjun Reddy', 5, 'Joined for boxing, ended up trying everything. 4 sessions a day means I never miss training. Highly recommend.', '2 weeks ago'],
  ['Priya N', 5, 'Clean mats, professional coaching and a community that pushes you. The free trial sold me instantly.', '3 weeks ago'],
  ['Karthik M', 4, 'Great equipment and flexible timings. Wrestling classes are top notch. Parking can get busy in the evening.', '1 month ago'],
  ['Sneha R', 5, 'As a woman starting out I felt safe and welcomed. BJJ coach is incredibly patient. Love this place.', '1 month ago'],
];

const events = [
  ['718 Grand Opening Showcase', 'Our launch event — exhibition fights, free classes and a community celebration on the mats.', '2026-01-18', '718 MMA, Shivarampally', img('photo-1547347298-4074fc3086f0'), 'past'],
  ['Inter-Gym Boxing Sparring', 'Friendly sparring meet with boxing gyms across Hyderabad. Great turnout, great energy.', '2026-03-22', '718 MMA Arena', img('photo-1581009146145-b5ef050c2e1e'), 'past'],
  ['Summer Muay Thai Camp', 'A 2-week intensive Muay Thai camp running now — pad work, clinch and conditioning every evening.', '2026-06-15', '718 MMA, Shivarampally', img('photo-1549719386-74dfcbf7dbed'), 'ongoing'],
  ['Open Mat Saturdays', 'Ongoing weekly open mat for grappling & BJJ. All levels welcome, every Saturday.', '2026-06-20', '718 MMA Mat Area', img('photo-1574680178050-55c6a6a96e0a'), 'ongoing'],
  ['718 Amateur MMA Night', 'Our first amateur MMA fight card. Watch 718 athletes compete in the cage. Tickets soon.', '2026-08-09', '718 MMA Arena', img('photo-1605296867304-46d5465a13f1'), 'upcoming'],
  ['BJJ Seminar with Black Belt', 'Special guest seminar — advanced guard systems and competition strategy.', '2026-09-14', '718 MMA, Shivarampally', img('photo-1555597673-b21d5c935865'), 'upcoming'],
];

const classes = [
  // day_of_week: 0=Sun ... 6=Sat
  ['Morning MMA', 'MMA', 1, '06:30', '08:00', 20, 'Coach Imran'],
  ['Muay Thai', 'Muay Thai', 1, '18:30', '20:00', 20, 'Coach Saif'],
  ['Boxing Fundamentals', 'Boxing', 2, '06:30', '08:00', 18, 'Coach Vikram'],
  ['BJJ All Levels', 'BJJ', 2, '20:00', '21:30', 16, 'Coach Aisha'],
  ['Wrestling', 'Wrestling', 3, '18:30', '20:00', 16, 'Coach Imran'],
  ['Kickboxing Cardio', 'Kickboxing', 4, '06:30', '08:00', 24, 'Coach Saif'],
  ['MMA Sparring', 'MMA', 5, '18:30', '20:00', 16, 'Coach Imran'],
  ['Open Mat (BJJ)', 'BJJ', 6, '08:00', '09:30', 30, 'All Coaches'],
];

const videos = [
  ['Jab-Cross Fundamentals', 'Boxing', 'Beginner', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/BigBuckBunny.jpg', '6:12', 1],
  ['Teep & Roundhouse', 'Muay Thai', 'Beginner', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/ElephantsDream.jpg', '8:40', 2],
  ['Closed Guard Basics', 'BJJ', 'Beginner', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/ForBiggerBlazes.jpg', '5:05', 3],
  ['Double-Leg Takedown', 'Wrestling', 'Intermediate', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/ForBiggerEscapes.jpg', '7:18', 4],
  ['MMA Clinch Work', 'MMA', 'Intermediate', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/ForBiggerFun.jpg', '9:50', 5],
  ['Conditioning Circuit', 'CrossFit', 'All levels', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/ForBiggerJoyrides.jpg', '12:00', 6],
];

async function seed() {
  await db.init();
  await db.run('DELETE FROM courses');
  await db.run('DELETE FROM memberships');
  await db.run('DELETE FROM trainers');
  await db.run('DELETE FROM foods');
  await db.run('DELETE FROM reviews');
  await db.run('DELETE FROM events');
  await db.run('DELETE FROM classes');
  await db.run('DELETE FROM videos');

  for (const r of courses) await db.run('INSERT INTO courses (slug,name,tagline,description,image,sort) VALUES ($1,$2,$3,$4,$5,$6)', r);
  for (const r of memberships) await db.run('INSERT INTO memberships (name,type,price,duration,features,popular,sort) VALUES ($1,$2,$3,$4,$5,$6,$7)', r);
  for (const r of trainers) await db.run('INSERT INTO trainers (name,specialty,fee,bio,image) VALUES ($1,$2,$3,$4,$5)', r);
  for (const r of foods) await db.run('INSERT INTO foods (name,category,description,calories,protein,image,order_url) VALUES ($1,$2,$3,$4,$5,$6,$7)', r);
  for (const r of reviews) await db.run('INSERT INTO reviews (author,rating,text,relative_time) VALUES ($1,$2,$3,$4)', r);
  for (const r of events) await db.run('INSERT INTO events (title,description,event_date,location,image,status) VALUES ($1,$2,$3,$4,$5,$6)', r);
  for (const r of classes) await db.run('INSERT INTO classes (title,discipline,day_of_week,start_time,end_time,capacity,coach) VALUES ($1,$2,$3,$4,$5,$6,$7)', r);
  for (const r of videos) await db.run('INSERT INTO videos (title,discipline,level,url,thumbnail,duration,sort) VALUES ($1,$2,$3,$4,$5,$6,$7)', r);

  console.log('✅ Seeded: courses, memberships, trainers, foods, reviews, events.');
}

module.exports = seed;

// Allow running directly: `node seed.js`
if (require.main === module) {
  seed().then(() => db.pool.end()).then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
}
