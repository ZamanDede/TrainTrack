const express = require('express');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const path = require('path');
const cookieParser = require('cookie-parser');
const pool = require('./db');
const { authenticateJWT, ensureAuthenticated, ensurePremiumOrAdmin, ensureAdmin } = require('./auth');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '.env') });

const app = express();
const port = process.env.PORT || 3000;

// Set up EJS as the template engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../Client/views'));

// Middleware setup
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

// Serve static files
app.use(express.static(path.join(__dirname, '../Client/public')));
// Serve static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Middleware to log requests
app.use((req, res, next) => {
  console.log(`Request received: ${req.method} ${req.originalUrl}`);
  next();
});

// Use the authentication middleware globally
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

// Apply the authentication middleware
app.use("/users", userRoutes);
app.use("/models", modelRoutes);
app.use("/datasets", datasetRoutes);


// Route for the home page
app.get('/', (req, res) => {
  const errorMessage = req.query.error;
  res.render('index', { title: 'Home', error: errorMessage });
});

// Catch-all route
app.use((req, res) => {
  console.log(`Route not found: ${req.originalUrl}`);
  res.status(404).send('Not Found');
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

module.exports = app;
