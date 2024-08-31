const { Pool } = require('pg');
const dotenv = require('dotenv');

dotenv.config();  // Load environment variables from .env

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: String(process.env.DB_PASSWORD),  // Explicitly convert to string
  port: parseInt(process.env.DB_PORT, 10),  // Ensure port is an integer
});


pool.on('connect', () => {
  console.log('Connected to the database');
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

module.exports = pool;
