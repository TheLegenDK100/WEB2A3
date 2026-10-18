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

function withEventInstant(event) {
  return { ...event, starts_at: eventInstant(event.event_datetime, event.event_timezone) };
}

module.exports = { EVENT_TIMEZONES, eventInstant, withEventInstant };
