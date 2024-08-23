const express = require('express');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const path = require('path');
const cookieParser = require('cookie-parser');
const pool = require('./db');  // Import the database pool from db.js

// Import the authentication middleware
const authenticateJWT = require('./auth');

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '.env') });

const app = express();
const port = process.env.PORT || 3000;

// Set up EJS as the template engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../Client/views'));


// Middleware setup
app.use(bodyParser.json());  // Parse JSON bodies
app.use(bodyParser.urlencoded({ extended: true }));  // Parse URL-encoded bodies
app.use(cookieParser());  // Parse cookies

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, '../Client/public')));

// Serve static files from the "uploads" directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Middleware to log requests
app.use((req, res, next) => {
  console.log(`Request received: ${req.method} ${req.originalUrl}`);
  next();
});

// Use the authentication middleware
app.use(authenticateJWT);

// Database connection middleware
app.use((req, res, next) => {
  req.db = pool;
  next();
});

// Route imports
const userRoutes = require('./routes/users');
const modelRoutes = require('./routes/model');
const datasetRoutes = require('./routes/dataset');

// Route mounts
app.use("/users", userRoutes);
app.use("/models", modelRoutes);
app.use("/datasets", datasetRoutes);

// Route for the home page
app.get('/', (req, res) => {
  const errorMessage = req.query.error;  // Get error message from query parameter
  res.render('index', { title: 'Home', error: errorMessage });
});



// Test DB connection route
app.get('/test-db', async (req, res) => {
  try {
    console.log('DB_USER:', process.env.DB_USER);
    console.log('DB_PASSWORD:', process.env.DB_PASSWORD);
    console.log('DB_HOST:', process.env.DB_HOST);
    console.log('DB_DATABASE:', process.env.DB_DATABASE);

    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    client.release();
    res.send(`Database connected: ${result.rows[0].now}`);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error connecting to the database');
  }
});

// Catch-all route to handle any other requests
app.use((req, res) => {
  console.log(`Route not found: ${req.originalUrl}`);
  res.status(404).send('Not Found');
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

module.exports = app;
