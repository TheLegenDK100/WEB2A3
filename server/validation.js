const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^[+()\d\s-]{8,30}$/;
const DATE_TIME_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;
const { eventInstant } = require('./event-time');

function number(value) {
  return typeof value === 'number' || (typeof value === 'string' && value.trim() !== '')
    ? Number(value)
    : NaN;
}

function text(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function positiveId(value) {
  const id = number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

function validateRegistration(body) {
  const data = {
    event_id: positiveId(body.event_id),
    first_name: text(body.first_name),
    last_name: text(body.last_name),
    email: text(body.email).toLowerCase(),
    phone: text(body.phone),
    ticket_count: number(body.ticket_count),
  };
  const errors = [];
  if (!data.event_id) errors.push('A valid event is required.');
  if (data.first_name.length < 2 || data.first_name.length > 80)
    errors.push('First name must be 2 to 80 characters.');
  if (data.last_name.length < 2 || data.last_name.length > 80)
    errors.push('Last name must be 2 to 80 characters.');
  if (!EMAIL_PATTERN.test(data.email) || data.email.length > 150)
    errors.push('Enter a valid email address.');
  if (!PHONE_PATTERN.test(data.phone)) errors.push('Enter a valid phone number.');
  if (!Number.isInteger(data.ticket_count) || data.ticket_count < 1 || data.ticket_count > 10)
    errors.push('Tickets must be between 1 and 10.');
  return { data, errors };
}

function validateEvent(body) {
  const data = {
    organisation_id: positiveId(body.organisation_id),
    category_id: positiveId(body.category_id),
    name: text(body.name),
    description: text(body.description),
    event_datetime: text(body.event_datetime),
    event_timezone: text(body.event_timezone),
    location: text(body.location),
    purpose: text(body.purpose),
    image_path: text(body.image_path),
    ticket_price: number(body.ticket_price),
    charity_goal: number(body.charity_goal),
    current_progress: number(body.current_progress),
    is_suspended:
      body.is_suspended === true || body.is_suspended === 1 || body.is_suspended === '1' ? 1 : 0,
    latitude: number(body.latitude),
    longitude: number(body.longitude),
  };
  const errors = [];
  if (!data.organisation_id) errors.push('Select an organisation.');
  if (!data.category_id) errors.push('Select a category.');
  if (data.name.length < 4 || data.name.length > 180)
    errors.push('Name must be 4 to 180 characters.');
  if (data.description.length < 20 || data.description.length > 10000)
    errors.push('Description must contain 20 to 10000 characters.');
  if (
    !DATE_TIME_PATTERN.test(data.event_datetime) ||
    !eventInstant(data.event_datetime, data.event_timezone)
  )
    errors.push('Enter a valid event date, time and Australian timezone.');
  if (data.location.length < 4 || data.location.length > 180)
    errors.push('Location must be 4 to 180 characters.');
  if (data.purpose.length < 10 || data.purpose.length > 255)
    errors.push('Purpose must be 10 to 255 characters.');
  if (
    !/^assets\/[a-zA-Z0-9_/-]+\.(png|jpe?g|webp)$/i.test(data.image_path) ||
    data.image_path.includes('..') ||
    data.image_path.length > 255
  )
    errors.push('Choose a valid image file inside assets/.');
  const validMoney = (value, max) =>
    Number.isFinite(value) &&
    value >= 0 &&
    value <= max &&
    Math.abs(value * 100 - Math.round(value * 100)) < 0.0001;
  if (!validMoney(data.ticket_price, 99999999.99))
    errors.push('Enter a non-negative ticket price with at most two decimal places.');
  if (!validMoney(data.charity_goal, 9999999999.99) || data.charity_goal <= 0)
    errors.push('Enter a positive charity goal with at most two decimal places.');
  if (
    !validMoney(data.current_progress, 9999999999.99) ||
    data.current_progress > data.charity_goal
  )
    errors.push(
      'Current progress must be between zero and the charity goal, with at most two decimal places.',
    );
  if (![true, false, 0, 1, '0', '1'].includes(body.is_suspended))
    errors.push('Suspension must be true or false.');
  if (!Number.isFinite(data.latitude) || data.latitude < -90 || data.latitude > 90)
    errors.push('Latitude must be between -90 and 90.');
  if (!Number.isFinite(data.longitude) || data.longitude < -180 || data.longitude > 180)
    errors.push('Longitude must be between -180 and 180.');
  return { data, errors };
}

module.exports = { positiveId, validateEvent, validateRegistration };
