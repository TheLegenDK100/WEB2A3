# HopeBridge Charity Events

HopeBridge is a full-stack charity event platform developed for PROG2002 Assignment 3. Visitors can discover public events, search by multiple criteria, view live weather forecasts, and register their interest. Administrators can manage all event records and review registration details.

All organisations, events, registrations, contact details and fundraising figures in this project are fictional assessment data.

## Technology

- Angular 22, TypeScript 6, RxJS and Angular Reactive Forms
- Custom HTML and CSS with Lucide icons; no CSS framework or Angular UI framework
- Node.js 24 and Express 4 REST API
- MySQL 8 with `mysql2` connection pooling
- Open-Meteo forecast API for event-day weather

## Main features

- Responsive home, search, details and registration pages
- Search by date, partial location and database-provided category
- English-only calendar and 24-hour time controls, independent of the browser's language
- Public API always excludes suspended events
- Upcoming and past status uses each venue's Australian timezone
- Real registration creation with validation, duplicate protection and confirmation number
- Public registration list hides email and phone details
- Administrative event list includes upcoming, past and suspended records
- Administrative create, edit and delete workflows
- Registered events cannot be deleted at either the interface or database/API level
- Fundraising totals combine recorded progress with registration ticket pledges
- Loading, empty, success, validation and server error states

## Code documentation

Project-owned JavaScript and TypeScript source includes JSDoc/TSDoc-style comments explaining module responsibilities, parameters, return values and key validation or asynchronous workflows.

- `server/event_db.js` documents the shared MySQL pool and connection error handling.
- `server/routes/apiRoutes.js` and `server/controllers/eventController.js` document the REST API and database operations.
- `src/app/core/` documents typed API communication, shared models and event status handling.
- `src/app/pages/` and `src/app/shared/` document page workflows, form validation, the English calendar and weather requests.

## Database setup

The complete schema contains four categories, three organisations, ten events and twelve registrations. Two events are suspended and are available only in the administrative interface.

For a new local MySQL installation, import:

```text
database/charityevents_a3.sql
```

This file recreates `charityevents_db`, its constraints and all fictional seed data. It drops the four project tables before rebuilding them, so do not run it over data that must be retained.

For an existing A2 database, use the one-time migration instead:

```text
database/upgrade_from_a2.sql
```

For cPanel/phpMyAdmin, first select the database assigned by cPanel and then import:

```text
database/cpanel_import.sql
```

The cPanel version does not attempt to create or select a database, which avoids shared-host permission errors.

## Environment setup

1. Install Node.js 24 and MySQL 8.
2. Run `npm ci` in this directory.
3. Copy `.env.example` to `.env`.
4. Enter the MySQL host, port, username, password and database name in `.env`.
5. Never commit or submit the real `.env` file.

Example variable names:

```dotenv
DB_HOST=localhost
DB_PORT=3306
DB_USER=your_database_user
DB_PASSWORD=your_database_password
DB_NAME=charityevents_db
PORT=3070
```

## Local development

Start the API in the first terminal:

```bash
npm run start:api
```

Start Angular in a second terminal:

```bash
npm start
```

Open `http://localhost:4200/`. The Angular development proxy sends `/api` requests to `http://127.0.0.1:3070`.

Visitor pages:

- `/` home and public event list
- `/search` multi-criteria search
- `/events/:id` event details, fundraising, forecast and registrations
- `/register?event_id=:id` registration form

Administration pages:

- `/admin/events` event management list
- `/admin/events/new` create event
- `/admin/events/:id/edit` edit event and review registrations

Authentication is outside the assessment scope, so the administrative pages intentionally do not implement login security.

## REST API

| Method | Endpoint                | Purpose                                                  |
| ------ | ----------------------- | -------------------------------------------------------- |
| GET    | `/api/health`           | Service health response                                  |
| GET    | `/api/events`           | Public, non-suspended events                             |
| GET    | `/api/events/search`    | Public events filtered by date, location and/or category |
| GET    | `/api/events/:id`       | One public event and privacy-safe registrations          |
| GET    | `/api/categories`       | Event categories                                         |
| GET    | `/api/organisations`    | Charity organisations                                    |
| POST   | `/api/registrations`    | Create one event registration                            |
| GET    | `/api/admin/events`     | All events including past and suspended records          |
| GET    | `/api/admin/events/:id` | Event and complete registration contacts                 |
| POST   | `/api/admin/events`     | Create an event                                          |
| PUT    | `/api/admin/events/:id` | Update an event                                          |
| DELETE | `/api/admin/events/:id` | Delete an event with no registrations                    |

Example search:

```text
GET /api/events/search?location=Brisbane&category=2&date=2026-10-24
```

## Verification

Run the Angular component tests:

```bash
npm test -- --watch=false
```

Run the isolated API and database tests:

```bash
npm run test:api
```

The API test creates and removes its own temporary database. The MySQL test account therefore requires `CREATE DATABASE` and `DROP DATABASE` permissions. Do not run that test command with a restricted cPanel database account.

Build the optimised Angular application:

```bash
npm run build
```

## Production and cPanel deployment

1. Build Angular locally with Node.js 24 using `npm ci` and `npm run build`.
2. Create a separate database in cPanel. For a fresh installation, select that database in phpMyAdmin and import `database/cpanel_first_install.sql`. The alternative `cpanel_import.sql` resets its tables and must only be used when intentionally replacing existing data.
3. Create a dedicated database user and grant only SELECT, INSERT, UPDATE and DELETE on that database. Configure its credentials in a private `.env` in the deployed application root, outside `public_html`, or in the Node.js environment settings.
4. Upload the application, including `dist/hopebridge-a3/browser`, without local `.env`, `node_modules`, `.angular` or database backups.
5. On the deployed copy only, replace root `package.json` and `package-lock.json` with the versions from `server/`. These contain backend dependencies compatible with the SCU Node.js 18 runtime. Keep the original Angular root manifests in the local source project.
6. Create a Production Node.js application with root `hopebridge-a3`, startup file `app.js`, and the assigned domain root. Run NPM Install in cPanel. A subdirectory URL requires matching Angular base href and API base configuration before building.
7. Restart the application and verify `/api/health`, `/api/events`, visitor pages and administration pages, including direct navigation and refresh.

After `npm run build`, Express serves the Angular browser build and the REST API from the same port. This avoids CORS and hard-coded host problems in production.

The deployment archive includes prebuilt Angular files. Angular is built locally; the hosted Node.js process runs Express and serves those files. SCU deployment was verified on 18 October 2026 with Node.js 18.20.8 and MySQL 5.7.44. `/api/health` returns HTTP 200 only when a live MySQL query succeeds, and HTTP 503 when the database is unavailable.

Hosted website: https://24833183.it.scu.edu.au/

MySQL 5.7 does not enforce CHECK constraints. Foreign keys, NOT NULL, unique keys and server-side validation provide the applicable hosted integrity protections. The application account does not have schema creation or deletion privileges.

## Data design notes

- `charity_events` references `charitable_organisations` and `event_categories` through foreign keys.
- `event_registrations` references `charity_events` with `ON DELETE RESTRICT`.
- `DATETIME` stores venue wall-clock times and registration timestamps; `event_timezone` preserves the venue timezone.
- `DECIMAL` stores ticket prices and fundraising amounts without floating-point rounding.
- `NOT NULL`, defaults, unique keys, check constraints and indexes enforce data integrity.
- `UNIQUE (event_id, email)` allows one email address to register once for each event.
