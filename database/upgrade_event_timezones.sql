-- Apply once to an A3 database created before venue timezone support.
USE charityevents_db;
ALTER TABLE charity_events
  ADD COLUMN event_timezone VARCHAR(40) NOT NULL DEFAULT 'Australia/Brisbane';
UPDATE charity_events SET event_timezone = 'Australia/Sydney' WHERE location LIKE '%Sydney%';
