const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const mysql = require('mysql2/promise');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

/** Import and exercise the actual application against a disposable, isolated database. */
test('SQL import and complete API lifecycle', async (t) => {
  const database = `charityevents_a3_test_${Date.now()}_${process.pid}`;
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    multipleStatements: true,
  });
  let server;
  let pool;
  try {
    const sql = fs.readFileSync(
      path.join(__dirname, '..', '..', 'database', 'charityevents_a3.sql'),
      'utf8',
    );
    await connection.query(sql.replaceAll('charityevents_db', database));
    process.env.DB_NAME = database;
    const { app } = require('../server');
    pool = require('../event_db');
    server = await new Promise((resolve) => {
      const instance = app.listen(0, '127.0.0.1', () => resolve(instance));
    });
    const base = `http://127.0.0.1:${server.address().port}/api`;
    const request = async (url, method = 'GET', body) => {
      const response = await fetch(base + url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : undefined,
      });
      return { status: response.status, body: await response.json() };
    };
    await t.test('health checks the live database connection', async () => {
      const health = await request('/health');
      assert.equal(health.status, 200);
      assert.equal(health.body.database, 'connected');
    });
    await t.test(
      'complete SQL contains 10 events, 4 categories, 3 organisations and 12 registrations',
      async () => {
        for (const [table, expected] of Object.entries({
          charity_events: 10,
          event_categories: 4,
          charitable_organisations: 3,
          event_registrations: 12,
        })) {
          const [[row]] = await connection.query(`SELECT COUNT(*) AS total FROM ${table}`);
          assert.equal(row.total, expected);
        }
      },
    );
    await t.test(
      'public filtering excludes suspended events including direct ID requests',
      async () => {
        const events = await request('/events');
        assert.equal(events.status, 200);
        assert.equal(events.body.length, 8);
        assert.ok(events.body.every((event) => event.is_suspended === 0 && event.starts_at));
        assert.equal((await request('/events/9')).status, 404);
        const filtered = await request(
          '/events/search?date=2026-10-24&location=Brisbane&category=2',
        );
        assert.equal(filtered.body.length, 1);
        assert.equal(filtered.body[0].id, 4);
        assert.equal((await request('/events/search?location=Nowhere')).body.length, 0);
        assert.equal((await request('/events/search?date=2026-02-30')).status, 400);
        assert.equal((await request('/events/search?category=1%20OR%201=1')).status, 400);
      },
    );
    const registrant = {
      event_id: 4,
      first_name: 'Demo',
      last_name: 'Tester',
      email: 'demo@example.test',
      phone: '+61 400 000 000',
      ticket_count: 2,
    };
    await t.test('registration validation, duplicate race protection and privacy', async () => {
      assert.equal(
        (await request('/registrations', 'POST', { ...registrant, ticket_count: 1.5 })).status,
        400,
      );
      assert.equal(
        (await request('/registrations', 'POST', { ...registrant, event_id: 1 })).status,
        409,
      );
      assert.equal(
        (await request('/registrations', 'POST', { ...registrant, event_id: 9 })).status,
        404,
      );
      const responses = await Promise.all([
        request('/registrations', 'POST', registrant),
        request('/registrations', 'POST', registrant),
      ]);
      assert.deepEqual(responses.map((item) => item.status).sort(), [201, 409]);
      assert.equal(
        (await request('/registrations', 'POST', { ...registrant, email: 'DEMO@EXAMPLE.TEST' }))
          .status,
        409,
      );
      const event = (await request('/events/4')).body;
      assert.equal(event.registrations[0].display_name, 'Demo T.');
      assert.equal(event.registrations[0].email, undefined);
      assert.equal(event.registrations[0].phone, undefined);
      assert.equal(event.registration_count, 3);
      assert.equal(event.total_progress, 17875);
    });
    await t.test('admin CRUD and registration deletion restriction', async () => {
      assert.equal((await request('/admin/events')).body.length, 10);
      assert.equal((await request('/admin/events/4', 'DELETE')).status, 409);
      const event = {
        organisation_id: 1,
        category_id: 1,
        name: 'Test Community Walk',
        description: 'A fictional walk created for automated lifecycle verification.',
        event_datetime: '2030-11-21T10:00',
        event_timezone: 'Australia/Brisbane',
        location: 'Test Park, Brisbane',
        purpose: 'Support fictional community gardens.',
        image_path: 'assets/event-riverloop-fun-run.png',
        ticket_price: 0,
        charity_goal: 10000,
        current_progress: 0,
        is_suspended: false,
        latitude: -27.4698,
        longitude: 153.0251,
      };
      assert.equal(
        (await request('/admin/events', 'POST', { ...event, ticket_price: null })).status,
        400,
      );
      const created = await request('/admin/events', 'POST', event);
      assert.equal(created.status, 201);
      const id = created.body.id;
      assert.equal(
        (
          await request(`/admin/events/${id}`, 'PUT', {
            ...event,
            name: 'Updated Community Walk',
            is_suspended: true,
          })
        ).status,
        200,
      );
      assert.equal((await request(`/events/${id}`)).status, 404);
      assert.equal((await request(`/admin/events/${id}`, 'DELETE')).status, 200);
      assert.equal((await request(`/admin/events/${id}`)).status, 404);
    });
  } finally {
    if (server) await new Promise((resolve) => server.close(resolve));
    if (pool) await pool.end();
    await connection.query(`DROP DATABASE IF EXISTS ${database}`);
    await connection.end();
  }
});
