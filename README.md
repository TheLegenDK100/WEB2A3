# HopeBridge Charity Events

HopeBridge is a full-stack charity event platform developed for PROG2002 Assignment 3. Visitors can discover public events, search by multiple criteria, view live weather forecasts, and register their interest. Administrators can manage all event records and review registration details.

All organisations, events, registrations, contact details and fundraising figures in this project are fictional assessment data.

## Repository status

The existing A3 application was imported from the supplied project archive on 18 October 2026. The import commit records a source snapshot; it does not reconstruct the project's earlier development history. Subsequent commits should describe the actual files changed and the checks performed.

This repository contains the visitor application, administration application and API in one project. The two website interfaces use separate Angular routes and share the same Express API. No online payment processing is implemented.

## Project structure

```text
src/app/pages/          Visitor and administration page components
src/app/core/           API client, models, navigation and shared helpers
src/app/shared/         Date input, event cards, icons and weather component
public/assets/         Event images and other public assets
server/controllers/    Event queries, registration transactions and event CRUD
server/routes/         Express endpoint definitions
server/event_db.js     MySQL connection pool and connection check
server/validation.js   Server-side input validation
server/event-time.js   Venue-time conversion utilities
server/tests/          Validation and isolated database/API tests
database/              Complete SQL exports and migration scripts
app.js                 Production startup entry point
```

Generated builds, installed dependencies, database backups and local credentials are not source deliverables. Build the application before attempting to serve its production pages.

## Technology

- Angular 22, TypeScript 6, RxJS and Angular Reactive Forms
- Custom HTML and CSS with Lucide icons; no CSS framework or Angular UI framework
- Node.js 24 and Express 4 REST API
- MySQL 8 with `mysql2` connection pooling
- Open-Meteo forecast API for event-day weather

This project uses modern Angular, not AngularJS 1.x. Any assessment bonus that specifically requires AngularJS must be confirmed with the lecturer.

## Main features

- Responsive home, search, details and registration pages
- Search by date, partial location and database-provided category
- English-only calendar and 24-hour time controls, independent of the browser's language
- Public API always excludes suspended events
- Upcoming and past status uses each venue's Australian timezone
- Real registration creation with validation, duplicate protection and confirmation number
- Public registration responses omit email and phone details; unauthenticated administration endpoints still expose those fields
- Administrative event list includes upcoming, past and suspended records
- Administrative create, edit and delete workflows
- Registered events cannot be deleted at either the interface or database/API level
- Fundraising totals combine recorded progress with registration ticket pledges
- Loading, empty, success, validation and server error states

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
database/cpanel_first_install.sql
```

This fresh-install script does not attempt to create or select a database, which avoids shared-host permission errors. Use it with a new, empty database. `database/cpanel_import.sql` is a separate reset script that drops and recreates the project tables; use it only when intentionally replacing their contents. The upgrade scripts are migrations for the stated earlier schema, not general-purpose reset scripts.

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

During the source review on 18 October 2026, the three existing standalone backend validation tests passed:

```bash
node --test server/tests/validation.test.js
```

Read-only checks of the hosted application confirmed a connected database, eight public events, ten administrative events and twelve registrations. Combined date/location/category search, suspended-event filtering and event-detail weather display were also checked. These observations are a dated snapshot, not a guarantee of ongoing availability.

The full database/API suite and Angular build/component suite were not rerun as part of this repository import. The test commands below are available for a properly configured development environment. The current tests do not cover every known issue listed later in this document.

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

The supplied deployment archive includes prebuilt Angular files; this source repository excludes `dist/`. Angular is built locally, and the hosted Node.js process runs Express and serves those files. The supplied deployment notes report Node.js 18.20.8 and MySQL 5.7.44; the hosting control-panel settings were not independently rechecked during this import. `/api/health` returns HTTP 200 only when a live MySQL query succeeds, and HTTP 503 when the database is unavailable.

Hosted website: https://24833183.it.scu.edu.au/

MySQL 5.7 does not enforce CHECK constraints. Foreign keys, NOT NULL, unique keys and server-side validation provide the applicable hosted integrity protections. The supplied deployment notes describe a restricted application account; verify actual grants in your own hosting account.

## Data design notes

- `charity_events` references `charitable_organisations` and `event_categories` through foreign keys.
- `event_registrations` references `charity_events` with `ON DELETE RESTRICT`.
- `DATETIME` stores venue wall-clock times and registration timestamps; `event_timezone` preserves the venue timezone.
- `DECIMAL` stores ticket prices and fundraising amounts without floating-point rounding.
- `NOT NULL`, defaults, unique keys, check constraints and indexes enforce data integrity.
- `UNIQUE (event_id, email)` allows one email address to register once for each event.

## Known issues and follow-up work

The following issues were found during source review and remain unresolved in this imported snapshot:

- **Date error handling:** some out-of-range years cause `eventInstant()` to throw. Date validation runs outside the controller's `try/catch` in affected handlers, and Express 4 routes do not forward rejected promises automatically. Reject unsupported years and consistently handle asynchronous route errors.
- **Phone validation:** punctuation-only values such as `--------` pass the current client and server patterns. Validate the number of digits as well as the permitted formatting characters.
- **Search date format:** the timestamp helper truncates its input, allowing a malformed date such as `2026-10-24T12:00garbage` through the API validation. Validate the complete date parameter before conversion.
- **Event images:** validation checks path syntax but not whether the image exists. A nonexistent `assets/*.png` path can pass validation and produce a broken image. Prefer a verified image list and a display fallback.
- **Weather descriptions:** Open-Meteo codes 85 and 86 represent snow showers but currently map to thunderstorms. Use an explicit weather-code mapping.

Authentication is intentionally omitted for this assessment. Public response redaction does not make registration contact information private while administration endpoints remain unauthenticated. Use fictional records only.

## Submission and contribution evidence

- Each team member must deploy the application and API to their own SCU cPanel account. Only one hosted URL is currently documented here.
- Supply the actual GitHub repository link and ensure the marker can access it. Commit messages should describe real changes; an imported snapshot does not replace evidence of earlier teamwork.
- Provide each required demonstration video and peer evaluation through the assessment's designated channels. Their completion has not been verified in this repository review.
- Follow the brief's final archive naming requirements and resolve its inconsistent archive count with the tutor. Exclude credentials, caches, installed dependencies and private configuration archives.
- Keep `.env` local. It was removed from the tracked files during this import, but removing it from the current branch does not remove credentials from older commits. Any real credentials previously committed must be rotated.
