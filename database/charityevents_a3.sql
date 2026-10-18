-- PROG2002 A3 - Charity Events schema and fictional sample data
-- All records below are fictional and created for local assessment testing.

CREATE DATABASE IF NOT EXISTS charityevents_db;
USE charityevents_db;

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS event_registrations;
DROP TABLE IF EXISTS charity_events;
DROP TABLE IF EXISTS event_categories;
DROP TABLE IF EXISTS charitable_organisations;
SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE charitable_organisations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL UNIQUE,
  mission TEXT NOT NULL,
  email VARCHAR(150) NOT NULL,
  phone VARCHAR(40) NOT NULL,
  website VARCHAR(200) NULL
);

CREATE TABLE event_categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(80) NOT NULL UNIQUE,
  description VARCHAR(255) NOT NULL
);

CREATE TABLE charity_events (
  id INT AUTO_INCREMENT PRIMARY KEY,
  organisation_id INT NOT NULL,
  category_id INT NOT NULL,
  name VARCHAR(180) NOT NULL,
  description TEXT NOT NULL,
  event_datetime DATETIME NOT NULL,
  event_timezone VARCHAR(40) NOT NULL DEFAULT 'Australia/Brisbane',
  location VARCHAR(180) NOT NULL,
  purpose VARCHAR(255) NOT NULL,
  image_path VARCHAR(255) NOT NULL,
  ticket_price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  charity_goal DECIMAL(12, 2) NOT NULL,
  current_progress DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  is_suspended TINYINT(1) NOT NULL DEFAULT 0,
  latitude DECIMAL(9, 6) NOT NULL DEFAULT -27.469800,
  longitude DECIMAL(9, 6) NOT NULL DEFAULT 153.025100,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_events_organisation FOREIGN KEY (organisation_id) REFERENCES charitable_organisations(id),
  CONSTRAINT fk_events_category FOREIGN KEY (category_id) REFERENCES event_categories(id),
  CONSTRAINT chk_ticket_price CHECK (ticket_price >= 0),
  CONSTRAINT chk_charity_goal CHECK (charity_goal > 0),
  CONSTRAINT chk_current_progress CHECK (current_progress >= 0),
  CONSTRAINT chk_progress_within_goal CHECK (current_progress <= charity_goal),
  CONSTRAINT chk_suspension_flag CHECK (is_suspended IN (0, 1)),
  INDEX idx_public_event_datetime (is_suspended, event_datetime)
);

CREATE TABLE event_registrations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  event_id INT NOT NULL,
  first_name VARCHAR(80) NOT NULL,
  last_name VARCHAR(80) NOT NULL,
  email VARCHAR(150) NOT NULL,
  phone VARCHAR(30) NOT NULL,
  ticket_count TINYINT UNSIGNED NOT NULL DEFAULT 1,
  unit_price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  registered_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_registrations_event FOREIGN KEY (event_id) REFERENCES charity_events(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT uq_registration_event_email UNIQUE (event_id, email),
  CONSTRAINT chk_registration_tickets CHECK (ticket_count BETWEEN 1 AND 10),
  CONSTRAINT chk_registration_unit_price CHECK (unit_price >= 0),
  INDEX idx_registration_event_date (event_id, registered_at)
);

INSERT INTO charitable_organisations (id, name, mission, email, phone, website) VALUES
  (1, 'Sunshine Community Aid', 'Helping local young people access meals, mentoring and safe learning spaces.', 'hello@sunshinecommunityaid.example', '+61 7 4100 2288', 'www.sunshinecommunityaid.example'),
  (2, 'Harbour Hope Network', 'Supporting families facing housing stress with practical short-term assistance.', 'connect@harbourhope.example', '+61 7 4100 3377', 'www.harbourhope.example'),
  (3, 'Green Steps Collective', 'Building healthier neighbourhoods through community gardens and environmental education.', 'team@greensteps.example', '+61 7 4100 4499', 'www.greensteps.example');

INSERT INTO event_categories (id, name, description) VALUES
  (1, 'fun run', 'Community runs and walks for a healthy cause.'),
  (2, 'gala dinner', 'An evening of food, stories and fundraising.'),
  (3, 'silent auction', 'Bid quietly on donated experiences and goods.'),
  (4, 'concert', 'Live music events that turn tickets into donations.');

INSERT INTO charity_events
  (id, organisation_id, category_id, name, description, event_datetime, location, purpose, image_path, ticket_price, charity_goal, current_progress, is_suspended)
VALUES
  (1, 1, 1, 'Riverloop Fun Run 2026', 'A relaxed community run beside the Brisbane River with short and long routes, water stations and a family finish-line picnic.', '2026-08-15 08:00:00', 'South Bank Parklands, Brisbane', 'Fund mentoring and school meal support for Brisbane teenagers.', 'assets/event-riverloop-fun-run.png', 0.00, 18000.00, 18000.00, 0),
  (2, 2, 4, 'Lanterns by the Harbour', 'A past-evening concert featuring fictional local artists, acoustic sets and a community choir celebrating practical neighbourhood support.', '2026-09-05 18:30:00', 'Harbour Esplanade, Sydney', 'Provide emergency household packs for families facing housing stress.', 'assets/event-lanterns-harbour.png', 22.00, 24000.00, 19650.00, 0),
  (3, 1, 1, 'Coastal Fun Run 2026', 'Run or walk along a marked Gold Coast route with accessible participation options, volunteer cheer points and a sunrise warm-up.', '2026-10-12 06:30:00', 'Broadwater Parklands, Gold Coast', 'Help local young people access mentoring and safe after-school activities.', 'assets/event-coastal-colour-run.png', 35.00, 25000.00, 8200.00, 0),
  (4, 2, 2, 'Table for Tomorrow', 'A shared-table charity dinner with fictional chefs, short impact stories and a quiet pledge moment for local housing support.', '2026-10-24 19:00:00', 'The Glasshouse, Brisbane', 'Keep temporary accommodation support available through summer.', 'assets/event-table-for-tomorrow.png', 95.00, 42000.00, 17400.00, 0),
  (5, 3, 3, 'Second Chance Silent Auction', 'Browse donated art, weekend experiences and handmade goods at your own pace while supporting greener community spaces.', '2026-11-07 10:00:00', 'The Foundry Rooms, Brisbane', 'Create two new community garden learning spaces.', 'assets/event-second-chance-auction.png', 0.00, 12000.00, 6450.00, 0),
  (6, 3, 4, 'Green Notes Charity Concert', 'An energetic afternoon of fictional indie, jazz and folk performances with refill stations and a low-waste venue plan.', '2026-11-21 15:00:00', 'The Enmore Green, Sydney', 'Fund environmental workshops for primary school students.', 'assets/event-green-notes-concert.png', 48.00, 30000.00, 11300.00, 0),
  (7, 2, 2, 'Moonlight Giving Gala', 'A formal but welcoming evening with shared stories, a seasonal menu and a live community impact update.', '2026-12-05 18:00:00', 'Ocean View Pavilion, Gold Coast', 'Expand the family food and rent-relief programme.', 'assets/event-moonlight-gala.png', 120.00, 55000.00, 29800.00, 0),
  (8, 1, 1, 'Sunrise Steps Brisbane', 'A free, gentle morning walk for all ages, followed by breakfast, music and information about youth wellbeing services.', '2027-01-16 07:30:00', 'Roma Street Parkland, Brisbane', 'Build a transport fund for students attending mentoring sessions.', 'assets/event-sunrise-steps.png', 0.00, 16000.00, 3100.00, 0),
  (9, 3, 3, 'City Lights Auction Night', 'A ticketed auction night with fictional donated packages and a late-night supper. This event is not currently available to the public.', '2026-10-31 19:30:00', 'Civic Exchange, Sydney', 'Support neighbourhood sustainability grants.', 'assets/event-community-kitchen-v2.jpg', 18.00, 14000.00, 5200.00, 1),
  (10, 1, 4, 'Unverified Charity Showcase', 'This record is intentionally suspended for API filtering tests and must never appear in public results.', '2026-11-14 20:00:00', 'Private venue, Brisbane', 'Suspended test event.', 'assets/event-learning.jpg', 10.00, 5000.00, 250.00, 1);

UPDATE charity_events SET latitude = -27.469800, longitude = 153.025100 WHERE id IN (1, 4, 5, 8, 10);
UPDATE charity_events SET latitude = -33.868800, longitude = 151.209300 WHERE id IN (2, 6, 9);
UPDATE charity_events SET event_timezone = 'Australia/Sydney' WHERE location LIKE '%Sydney%';
UPDATE charity_events SET latitude = -27.955500, longitude = 153.384100 WHERE id IN (3, 7);

INSERT INTO event_registrations
  (id, event_id, first_name, last_name, email, phone, ticket_count, unit_price, registered_at)
VALUES
  (1, 1, 'Ava', 'Morgan', 'ava.morgan@example.test', '+61 400 110 201', 2, 0.00, '2026-08-01 09:10:00'),
  (2, 2, 'Noah', 'Patel', 'noah.patel@example.test', '+61 400 110 202', 1, 22.00, '2026-08-18 13:25:00'),
  (3, 3, 'Mia', 'Chen', 'mia.chen@example.test', '+61 400 110 203', 3, 35.00, '2026-09-20 16:40:00'),
  (4, 4, 'Jack', 'Williams', 'jack.williams@example.test', '+61 400 110 204', 2, 95.00, '2026-10-02 10:05:00'),
  (5, 4, 'Isla', 'Brown', 'isla.brown@example.test', '+61 400 110 205', 1, 95.00, '2026-10-12 19:20:00'),
  (6, 5, 'Leo', 'Nguyen', 'leo.nguyen@example.test', '+61 400 110 206', 4, 0.00, '2026-10-05 08:30:00'),
  (7, 6, 'Ruby', 'Taylor', 'ruby.taylor@example.test', '+61 400 110 207', 2, 48.00, '2026-10-08 15:15:00'),
  (8, 7, 'Oliver', 'Singh', 'oliver.singh@example.test', '+61 400 110 208', 2, 120.00, '2026-10-11 11:45:00'),
  (9, 8, 'Grace', 'Wilson', 'grace.wilson@example.test', '+61 400 110 209', 5, 0.00, '2026-10-13 07:55:00'),
  (10, 6, 'Ethan', 'Lee', 'ethan.lee@example.test', '+61 400 110 210', 1, 48.00, '2026-10-15 18:05:00'),
  (11, 7, 'Sophie', 'Martin', 'sophie.martin@example.test', '+61 400 110 211', 3, 120.00, '2026-10-16 12:10:00'),
  (12, 5, 'Henry', 'Davis', 'henry.davis@example.test', '+61 400 110 212', 2, 0.00, '2026-10-17 09:00:00');
