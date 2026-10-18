const { test } = require('node:test');
const assert = require('node:assert/strict');
const { validateEvent, validateRegistration } = require('../validation');
const { eventInstant } = require('../event-time');

test('venue timestamps respect Sydney daylight saving and Brisbane standard time', () => {
  assert.equal(eventInstant('2026-11-21T15:00', 'Australia/Sydney'), '2026-11-21T04:00:00.000Z');
  assert.equal(eventInstant('2026-11-21T15:00', 'Australia/Brisbane'), '2026-11-21T05:00:00.000Z');
  assert.equal(eventInstant('2026-02-30T10:00', 'Australia/Sydney'), null);
  assert.equal(eventInstant('2026-10-04T02:30', 'Australia/Sydney'), null);
});

test('registration validation normalises email and rejects fractional tickets', () => {
  const payload = {
    event_id: 4,
    first_name: ' Demo ',
    last_name: ' Tester ',
    email: ' DEMO@EXAMPLE.TEST ',
    phone: '+61 400 000 000',
    ticket_count: 2,
  };
  const result = validateRegistration(payload);
  assert.deepEqual(result.errors, []);
  assert.equal(result.data.email, 'demo@example.test');
  assert.equal(result.data.first_name, 'Demo');
  assert.ok(validateRegistration({ ...payload, ticket_count: 1.5 }).errors.length);
  assert.ok(validateRegistration({ ...payload, ticket_count: true }).errors.length);
});

test('empty money, invalid dates and unsafe image paths are rejected', () => {
  const result = validateEvent({
    ticket_price: '',
    event_datetime: '2026-02-30T10:00',
    event_timezone: 'Australia/Sydney',
    image_path: 'assets/../private.png',
  });
  assert.ok(result.errors.some((value) => value.includes('ticket price')));
  assert.ok(result.errors.some((value) => value.includes('date')));
  assert.ok(result.errors.some((value) => value.includes('image')));
});
