const express = require('express');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const path = require('path');
const cookieParser = require('cookie-parser');
const { authenticateJWT, ensureAuthenticated, ensurePremiumOrAdmin, ensureAdmin } = require('./auth');
const pool = require('./db');  // Import the pool from db.js
// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '.env') });

// AWS SSM SDK
const SSM = require('@aws-sdk/client-ssm');
const parameterName = '/n11357428/traintrack/api-url';
const ssmClient = new SSM.SSMClient({ region: 'ap-southeast-2' });

// AWS Secrets Manager
const { SecretsManagerClient, GetSecretValueCommand } = require('@aws-sdk/client-secrets-manager');
const secretsClient = new SecretsManagerClient({ region: 'ap-southeast-2' });

// Fetch the Parameter Store value (API URL)
async function getParameter(parameterName) {
    try {
        const response = await ssmClient.send(new SSM.GetParameterCommand({ Name: parameterName }));
        return response.Parameter.Value;
    } catch (error) {
        console.error('Error fetching parameter:', error);
        return null;
    }
}

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
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/efs/datasets', express.static(path.join(__dirname, '../efs/datasets')));

// Middleware to log requests
app.use((req, res, next) => {
    console.log(`Request received: ${req.method} ${req.originalUrl}`);
    next();
});

// Use the authentication middleware globally
app.use(authenticateJWT);

// Database connection middleware
app.use((req, res, next) => {
    if (!pool) {
        return res.status(503).send('Service Unavailable: Database connection lost');
    }
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
app.get('/', async (req, res) => {
    const errorMessage = req.query.error;

    // Fetch the API URL from the Parameter Store before rendering the page
    const apiUrl = await getParameter(parameterName);
    console.log('Fetched API URL:', apiUrl);

    res.render('index', { title: 'Home', error: errorMessage, apiUrl });
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
