-- ============================================================
-- 718 MMA — apply new membership prices + keep only Coach Saif
-- Run in Supabase → SQL Editor.
-- SAFE: does not touch members, payments, videos, classes, events.
-- (The new "session" columns + handovers table are created automatically
--  when you restart the server, so nothing to do for those here.)
-- ============================================================

BEGIN;

-- 1) Replace membership plans with the new price list
DELETE FROM memberships;
INSERT INTO memberships (name, type, price, duration, features, popular, sort) VALUES
('MMA — 1 Month','membership',2499,'1 Month', E'MMA — all striking & grappling\nChoose your daily session\nFull facility & equipment access',0,1),
('MMA — 3 Months','membership',5999,'3 Months', E'MMA — all striking & grappling\nChoose your daily session\nSave vs monthly',0,2),
('MMA — 6 Months','membership',8999,'6 Months', E'MMA — all striking & grappling\nChoose your daily session\nGreat for regulars',0,3),
('MMA — 1 Year','membership',14000,'1 Year', E'MMA — all striking & grappling\nChoose your daily session\nMaximum savings',0,4),
('CrossFit — 1 Month','membership',1999,'1 Month', E'CrossFit strength & conditioning\nChoose your daily session\nFull facility access',0,5),
('CrossFit — 3 Months','membership',4500,'3 Months', E'CrossFit strength & conditioning\nChoose your daily session\nSave vs monthly',0,6),
('CrossFit — 6 Months','membership',7500,'6 Months', E'CrossFit strength & conditioning\nChoose your daily session',0,7),
('CrossFit — 1 Year','membership',12000,'1 Year', E'CrossFit strength & conditioning\nChoose your daily session\nMaximum savings',0,8),
('MMA + CrossFit — 1 Month','membership',2999,'1 Month', E'Full access — MMA + CrossFit\nChoose your daily session\nEverything included',0,9),
('MMA + CrossFit — 3 Months','membership',6999,'3 Months', E'Full access — MMA + CrossFit\nChoose your daily session\nBest value',1,10),
('MMA + CrossFit — 6 Months','membership',10500,'6 Months', E'Full access — MMA + CrossFit\nChoose your daily session',0,11),
('MMA + CrossFit — 1 Year','membership',18000,'1 Year', E'Full access — MMA + CrossFit\nChoose your daily session\nMaximum savings',0,12);

-- 2) Keep only Coach Saif
DELETE FROM trainers;
INSERT INTO trainers (name, specialty, fee, bio, image) VALUES
('Coach Saif "Thai Boxer"','Muay Thai & Striking',9000,'Professional Muay Thai coach certified in Bangkok with 10+ years in martial arts. National Muay Thai & MMA champion who has trained 500+ students across Telangana. Leads the 718 stand-up, clinch and striking program for all levels.','/saif_thai_boxer.png');

COMMIT;
