const { Pool } = require('pg');
const dotenv = require('dotenv');

dotenv.config();  // Load environment variables

let pool;

function createPool() {
  pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_DATABASE,
    password: process.env.DB_PASSWORD,
    port: parseInt(process.env.DB_PORT, 10),
  });

  pool.on('connect', () => {
    console.log('Connected to the database');
  });

  pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
    reconnect();  // Handle reconnection logic
  });

  return pool;
}

// Reconnect function (in case of error)
function reconnect() {
  console.log('Attempting to reconnect to the database...');
  setTimeout(() => {
    pool = createPool();
  }, 5000); // Attempt to reconnect after 5 seconds
}

// Create the pool initially
createPool();

module.exports = pool;
