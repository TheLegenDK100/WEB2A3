-- Non-destructive A2 to A3 upgrade for an existing charityevents_db database.
USE charityevents_db;
ALTER TABLE charity_events
  ADD COLUMN event_timezone VARCHAR(40) NOT NULL DEFAULT 'Australia/Brisbane';
UPDATE charity_events SET event_timezone = 'Australia/Sydney' WHERE location LIKE '%Sydney%';

ALTER TABLE charity_events
  ADD COLUMN latitude DECIMAL(9, 6) NOT NULL DEFAULT -27.469800 AFTER is_suspended,
  ADD COLUMN longitude DECIMAL(9, 6) NOT NULL DEFAULT 153.025100 AFTER latitude;

CREATE TABLE IF NOT EXISTS event_registrations (
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

UPDATE charity_events SET latitude = -27.469800, longitude = 153.025100 WHERE id IN (1, 4, 5, 8, 10);
UPDATE charity_events SET latitude = -33.868800, longitude = 151.209300 WHERE id IN (2, 6, 9);
UPDATE charity_events SET latitude = -27.955500, longitude = 153.384100 WHERE id IN (3, 7);

INSERT IGNORE INTO event_registrations
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
