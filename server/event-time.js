/** @file Australian event-time validation and UTC conversion helpers. */

/** @type {readonly string[]} Supported IANA time zones for Australian venues. */
const EVENT_TIMEZONES = [
  'Australia/Brisbane',
  'Australia/Sydney',
  'Australia/Melbourne',
  'Australia/Adelaide',
  'Australia/Perth',
  'Australia/Darwin',
  'Australia/Hobart',
];

/** Convert an Australian venue's wall-clock DATETIME into an unambiguous UTC instant. */
/**
 * Convert a venue-local DATETIME to an unambiguous UTC ISO instant.
 *
 * @param {string} value A `YYYY-MM-DD HH:mm` or `YYYY-MM-DDTHH:mm` value.
 * @param {string} timezone A supported Australian IANA time zone.
 * @returns {string|null} The UTC ISO timestamp, or null for invalid/skipped times.
 */
function eventInstant(value, timezone) {
  const source = value.replace(' ', 'T').slice(0, 16);
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(source) || !EVENT_TIMEZONES.includes(timezone))
    return null;
  const wall = Date.parse(`${source}:00Z`);
  if (!Number.isFinite(wall) || new Date(wall).toISOString().slice(0, 16) !== source) return null;
  const formatter = new Intl.DateTimeFormat('sv-SE', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  });
  const localText = (instant) => formatter.format(new Date(instant)).replace(' ', 'T');
  let instant = wall;
  for (let index = 0; index < 3; index++) {
    const represented = Date.parse(`${localText(instant)}:00Z`);
    instant += wall - represented;
  }
  // A skipped clock time during the daylight-saving transition is not a valid event time.
  return localText(instant) === source ? new Date(instant).toISOString() : null;
}

/**
 * Add the UTC instant used by the frontend for past/upcoming comparisons.
 *
 * @param {{event_datetime: string, event_timezone: string}} event Database event row.
 * @returns {object} A copy of the event row with a `starts_at` property.
 */
function withEventInstant(event) {
  return { ...event, starts_at: eventInstant(event.event_datetime, event.event_timezone) };
}

module.exports = { EVENT_TIMEZONES, eventInstant, withEventInstant };
