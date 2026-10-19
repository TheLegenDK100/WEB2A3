/** @file Database-backed REST controllers for HopeBridge events. */

const db = require('../event_db');
const { positiveId, validateEvent, validateRegistration } = require('../validation');
const { eventInstant, withEventInstant } = require('../event-time');

/** Shared projection used to keep public and admin event responses consistent. */
const EVENT_SELECT = `
  SELECT e.id, e.organisation_id, e.category_id, e.name, e.description,
    DATE_FORMAT(e.event_datetime, '%Y-%m-%dT%H:%i:%s') AS event_datetime,
    e.location, e.event_timezone, e.purpose, e.image_path, e.ticket_price, e.charity_goal,
    e.current_progress, e.is_suspended, e.latitude, e.longitude,
    c.name AS category_name, o.name AS organisation_name, o.mission AS organisation_mission,
    o.email AS organisation_email, o.phone AS organisation_phone, o.website AS organisation_website,
    COALESCE(rs.registration_count, 0) AS registration_count,
    COALESCE(rs.ticket_count, 0) AS registered_tickets,
    e.current_progress + COALESCE(rs.ticket_donations, 0) AS total_progress
  FROM charity_events e
  JOIN event_categories c ON c.id = e.category_id
  JOIN charitable_organisations o ON o.id = e.organisation_id
  LEFT JOIN (
    SELECT event_id, COUNT(*) AS registration_count, SUM(ticket_count) AS ticket_count,
      SUM(ticket_count * unit_price) AS ticket_donations
    FROM event_registrations GROUP BY event_id
  ) rs ON rs.event_id = e.id`;

/**
 * Convert an internal database failure into a safe API response.
 *
 * @param {import('express').Response} res Express response object.
 * @param {Error} error Internal error for server-side logging.
 * @returns {import('express').Response} The 500 response.
 */
function sendDatabaseError(res, error) {
  console.error(error);
  return res.status(500).json({ error: 'The database request could not be completed.' });
}

/** @type {import('express').RequestHandler} */
async function getCategories(_req, res) {
  try {
    const [rows] = await db.query(
      'SELECT id, name, description FROM event_categories ORDER BY name',
    );
    res.json(rows);
  } catch (error) {
    sendDatabaseError(res, error);
  }
}

/** @type {import('express').RequestHandler} */
async function getOrganisations(_req, res) {
  try {
    const [rows] = await db.query(
      'SELECT id, name, mission, email, phone, website FROM charitable_organisations ORDER BY name',
    );
    res.json(rows);
  } catch (error) {
    sendDatabaseError(res, error);
  }
}

/**
 * Return non-suspended events, optionally filtered by date, location and category.
 *
 * @type {import('express').RequestHandler}
 */
async function getPublicEvents(req, res) {
  // Build a parameterised query so optional filters never become executable SQL.
  const conditions = ['e.is_suspended = 0'];
  const values = [];
  if (req.query.date) {
    if (
      typeof req.query.date !== 'string' ||
      !eventInstant(`${req.query.date}T12:00`, 'Australia/Brisbane')
    )
      return res.status(400).json({ error: 'Enter a valid date in YYYY-MM-DD format.' });
    conditions.push('DATE(e.event_datetime) = ?');
    values.push(req.query.date);
  }
  if (req.query.location) {
    if (typeof req.query.location !== 'string' || req.query.location.length > 180)
      return res.status(400).json({ error: 'Location must be text of at most 180 characters.' });
    conditions.push('e.location LIKE ?');
    values.push(`%${req.query.location.trim()}%`);
  }
  if (req.query.category) {
    const id = positiveId(req.query.category);
    if (!id) return res.status(400).json({ error: 'Category must be a positive number.' });
    conditions.push('e.category_id = ?');
    values.push(id);
  }
  try {
    const [rows] = await db.query(
      `${EVENT_SELECT} WHERE ${conditions.join(' AND ')} ORDER BY e.event_datetime ASC`,
      values,
    );
    res.json(rows.map(withEventInstant));
  } catch (error) {
    sendDatabaseError(res, error);
  }
}

/**
 * Return one public event and privacy-safe registration summaries.
 *
 * @type {import('express').RequestHandler}
 */
async function getPublicEvent(req, res) {
  const id = positiveId(req.params.id);
  if (!id) return res.status(400).json({ error: 'Event ID must be a positive number.' });
  try {
    const [events] = await db.query(`${EVENT_SELECT} WHERE e.id = ? AND e.is_suspended = 0`, [id]);
    if (!events.length)
      return res.status(404).json({ error: 'Sorry, no matching event was found.' });
    const [registrations] = await db.query(
      `SELECT id, CONCAT(first_name, ' ', LEFT(last_name, 1), '.') AS display_name,
       ticket_count, DATE_FORMAT(registered_at, '%Y-%m-%dT%H:%i:%sZ') AS registered_at
       FROM event_registrations WHERE event_id = ? ORDER BY registered_at DESC, id DESC`,
      [id],
    );
    res.json({ ...withEventInstant(events[0]), registrations });
  } catch (error) {
    sendDatabaseError(res, error);
  }
}

/**
 * Create a visitor registration inside a transaction locked to the event row.
 *
 * @type {import('express').RequestHandler}
 */
async function createRegistration(req, res) {
  const { data, errors } = validateRegistration(req.body || {});
  if (errors.length) return res.status(400).json({ error: errors[0], details: errors });
  let connection;
  try {
    // Lock the event until insertion completes so its availability and ticket price
    // cannot change between validation and the registration snapshot.
    connection = await db.getConnection();
    await connection.beginTransaction();
    const [events] = await connection.query(
      'SELECT id, name, event_datetime, event_timezone, ticket_price, is_suspended FROM charity_events WHERE id = ? FOR UPDATE',
      [data.event_id],
    );
    if (!events.length || events[0].is_suspended) {
      await connection.rollback();
      return res.status(404).json({ error: 'This event is not available.' });
    }
    if (new Date(eventInstant(events[0].event_datetime, events[0].event_timezone)) <= new Date()) {
      await connection.rollback();
      return res
        .status(409)
        .json({ error: 'Registration has closed because this event has already taken place.' });
    }
    const [result] = await connection.query(
      `INSERT INTO event_registrations
       (event_id, first_name, last_name, email, phone, ticket_count, unit_price, registered_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, UTC_TIMESTAMP())`,
      [
        data.event_id,
        data.first_name,
        data.last_name,
        data.email,
        data.phone,
        data.ticket_count,
        events[0].ticket_price,
      ],
    );
    await connection.commit();
    res.status(201).json({
      id: result.insertId,
      event_id: data.event_id,
      event_name: events[0].name,
      message: 'Registration confirmed.',
    });
  } catch (error) {
    if (connection) await connection.rollback().catch(() => {});
    if (error.code === 'ER_DUP_ENTRY')
      return res
        .status(409)
        .json({ error: 'This email address is already registered for this event.' });
    sendDatabaseError(res, error);
  } finally {
    connection?.release();
  }
}

/** @type {import('express').RequestHandler} */
async function getAdminEvents(_req, res) {
  try {
    const [rows] = await db.query(`${EVENT_SELECT} ORDER BY e.event_datetime DESC`);
    res.json(rows.map(withEventInstant));
  } catch (error) {
    sendDatabaseError(res, error);
  }
}

/** @type {import('express').RequestHandler} */
async function getAdminEvent(req, res) {
  const id = positiveId(req.params.id);
  if (!id) return res.status(400).json({ error: 'Event ID must be a positive number.' });
  try {
    const [events] = await db.query(`${EVENT_SELECT} WHERE e.id = ?`, [id]);
    if (!events.length) return res.status(404).json({ error: 'Event not found.' });
    const [registrations] = await db.query(
      `SELECT id, first_name, last_name, email, phone, ticket_count, unit_price,
       DATE_FORMAT(registered_at, '%Y-%m-%dT%H:%i:%sZ') AS registered_at
       FROM event_registrations WHERE event_id = ? ORDER BY registered_at DESC, id DESC`,
      [id],
    );
    res.json({ ...withEventInstant(events[0]), registrations });
  } catch (error) {
    sendDatabaseError(res, error);
  }
}

const EVENT_COLUMNS = `organisation_id, category_id, name, description, event_datetime, location,
  purpose, image_path, ticket_price, charity_goal, current_progress, is_suspended, latitude, longitude, event_timezone`;

/**
 * Map a validated event object to the database column order.
 *
 * @param {Record<string, unknown>} data Validated event data.
 * @returns {unknown[]} Values matching `EVENT_COLUMNS`.
 */
function eventValues(data) {
  return [
    data.organisation_id,
    data.category_id,
    data.name,
    data.description,
    data.event_datetime.replace('T', ' '),
    data.location,
    data.purpose,
    data.image_path,
    data.ticket_price,
    data.charity_goal,
    data.current_progress,
    data.is_suspended,
    data.latitude,
    data.longitude,
    data.event_timezone,
  ];
}

/** @type {import('express').RequestHandler} */
async function createEvent(req, res) {
  const { data, errors } = validateEvent(req.body || {});
  if (errors.length) return res.status(400).json({ error: errors[0], details: errors });
  try {
    const placeholders = Array(15).fill('?').join(', ');
    const [result] = await db.query(
      `INSERT INTO charity_events (${EVENT_COLUMNS}) VALUES (${placeholders})`,
      eventValues(data),
    );
    res.status(201).json({ id: result.insertId, message: 'Event created.' });
  } catch (error) {
    if (error.code === 'ER_NO_REFERENCED_ROW_2')
      return res
        .status(400)
        .json({ error: 'The selected category or organisation does not exist.' });
    sendDatabaseError(res, error);
  }
}

/** @type {import('express').RequestHandler} */
async function updateEvent(req, res) {
  const id = positiveId(req.params.id);
  if (!id) return res.status(400).json({ error: 'Event ID must be a positive number.' });
  const { data, errors } = validateEvent(req.body || {});
  if (errors.length) return res.status(400).json({ error: errors[0], details: errors });
  try {
    const assignments = EVENT_COLUMNS.split(',')
      .map((column) => `${column.trim()} = ?`)
      .join(', ');
    const [result] = await db.query(`UPDATE charity_events SET ${assignments} WHERE id = ?`, [
      ...eventValues(data),
      id,
    ]);
    if (!result.affectedRows) return res.status(404).json({ error: 'Event not found.' });
    res.json({ id, message: 'Event updated.' });
  } catch (error) {
    if (error.code === 'ER_NO_REFERENCED_ROW_2')
      return res
        .status(400)
        .json({ error: 'The selected category or organisation does not exist.' });
    sendDatabaseError(res, error);
  }
}

/** @type {import('express').RequestHandler} */
async function deleteEvent(req, res) {
  const id = positiveId(req.params.id);
  if (!id) return res.status(400).json({ error: 'Event ID must be a positive number.' });
  try {
    // Give the administrator a useful conflict response before the foreign key
    // provides the final database-level protection.
    const [[count]] = await db.query(
      'SELECT COUNT(*) AS total FROM event_registrations WHERE event_id = ?',
      [id],
    );
    if (count.total > 0)
      return res.status(409).json({
        error: `This event cannot be deleted because it has ${count.total} registration(s).`,
      });
    const [result] = await db.query('DELETE FROM charity_events WHERE id = ?', [id]);
    if (!result.affectedRows) return res.status(404).json({ error: 'Event not found.' });
    res.json({ message: 'Event deleted.' });
  } catch (error) {
    if (error.code === 'ER_ROW_IS_REFERENCED_2')
      return res
        .status(409)
        .json({ error: 'This event cannot be deleted because registrations exist.' });
    sendDatabaseError(res, error);
  }
}

module.exports = {
  createEvent,
  createRegistration,
  deleteEvent,
  getAdminEvent,
  getAdminEvents,
  getCategories,
  getOrganisations,
  getPublicEvent,
  getPublicEvents,
  updateEvent,
};
