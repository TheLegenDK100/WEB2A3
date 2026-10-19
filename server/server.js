/** @file Express application bootstrap and static Angular hosting entry point. */

const express = require('express');
const cors = require('cors');
const path = require('path');
const apiRoutes = require('./routes/apiRoutes');
const db = require('./event_db');

/** @type {import('express').Express} */
const app = express();
const browserDirectory = path.join(__dirname, '..', 'dist', 'hopebridge-a3', 'browser');

app.disable('x-powered-by');
app.use(cors());
app.use(express.json({ limit: '100kb' }));
app.use('/api', apiRoutes);
app.get('/api/health', async (_req, res) => {
  try {
    await db.query('SELECT 1');
    res.json({ status: 'ok', service: 'hopebridge-a3-api', database: 'connected' });
  } catch (error) {
    console.error('Database health check failed:', error.code);
    res.status(503).json({ status: 'unavailable', database: 'disconnected' });
  }
});
app.use('/api', (_req, res) => res.status(404).json({ error: 'API endpoint not found.' }));

app.use(express.static(browserDirectory));
app.get('*', (_req, res, next) => {
  res.sendFile(path.join(browserDirectory, 'index.html'), (error) => error && next(error));
});

app.use((error, _req, res, _next) => {
  console.error(error);
  if (error instanceof SyntaxError)
    return res.status(400).json({ error: 'Request body must contain valid JSON.' });
  res.status(500).json({ error: 'Internal server error.' });
});

const port = Number(process.env.PORT || 3070);
/**
 * Test the database and start the HTTP server.
 *
 * @returns {Promise<import('http').Server|null>} The listening server, or null
 * when startup is stopped by a database or port error.
 */
async function startServer() {
  try {
    await db.testConnection();
    return app
      .listen(port, () => console.log(`HopeBridge A3 running at http://127.0.0.1:${port}`))
      .on('error', (error) => {
        console.error(`Server could not start: ${error.code}. Check the configured port.`);
        db.end();
        process.exitCode = 1;
      });
  } catch (_error) {
    console.error('Server startup stopped because the database connection failed.');
    process.exitCode = 1;
    return null;
  }
}

if (require.main === module) startServer();
module.exports = { app, startServer };
