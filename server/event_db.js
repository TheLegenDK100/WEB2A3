const mysql = require('mysql2/promise');
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

/** Shared MySQL connection pool used by every API controller. */
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'charityevents_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  dateStrings: true,
  decimalNumbers: true,
});

async function testConnection() {
  let connection;
  try {
    connection = await pool.getConnection();
    await connection.ping();
    console.log(`MySQL connected: ${process.env.DB_NAME || 'charityevents_db'}`);
  } catch (error) {
    console.error('Unable to connect to MySQL. Check the service and .env settings.');
    console.error(`Database error: ${error.message}`);
    throw error;
  } finally {
    connection?.release();
  }
}

module.exports = pool;
module.exports.testConnection = testConnection;
