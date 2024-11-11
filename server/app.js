
const express = require('express');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const path = require('path');
const cookieParser = require('cookie-parser');
const { authenticateJWT, ensureAuthenticated, ensurePremiumOrAdmin, ensureAdmin } = require('./auth');
const { Pool } = require('pg');
const { SSMClient } = require('@aws-sdk/client-ssm');
const { SecretsManagerClient, GetSecretValueCommand } = require('@aws-sdk/client-secrets-manager');
const { createProxyMiddleware } = require('http-proxy-middleware');

dotenv.config({ path: path.resolve(__dirname, '.env') });

const app = express();
const port = process.env.PORT || 3000;

// Initialize AWS SSM and Secrets Manager Clients
const ssmClient = new SSMClient({ region: 'ap-southeast-2' });
const secretsClient = new SecretsManagerClient({ region: 'ap-southeast-2' });
const parameterName = '/n11357428/traintrack/api-url';

// Function to fetch parameter value
async function getParameter(parameterName) {
    try {
        const response = await ssmClient.send(new SSMClient.GetParameterCommand({ Name: parameterName }));
        return response.Parameter.Value;
    } catch (error) {
        console.error('Error fetching parameter:', error);
        return null;
    }
}

// Database setup using AWS Secrets Manager
let pool;
async function getSecrets() {
    const secretName = "n11357428-traintrack-db-credentials";
    try {
        const response = await secretsClient.send(new GetSecretValueCommand({ SecretId: secretName, VersionStage: "AWSCURRENT" }));
        if ('SecretString' in response) {
            return JSON.parse(response.SecretString);
        }
    } catch (error) {
        console.error('Error fetching secret:', error);
        throw error;
    }
}

(async () => {
    try {
        const secrets = await getSecrets();
        const { DB_USER, DB_PASSWORD, DB_HOST, DB_PORT, DB_DATABASE } = secrets;
        pool = new Pool({
            user: DB_USER,
            host: DB_HOST,
            database: DB_DATABASE,
            password: DB_PASSWORD,
            port: DB_PORT,
        });
        console.log('Database connected successfully!');
    } catch (error) {
        console.error('Failed to connect to database:', error);
    }
})();

// Set up EJS as the template engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../efs/Client/views'));

// Middleware setup
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

// Serve static files
app.use(express.static(path.join(__dirname, '../efs/Client/public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/efs/datasets', express.static(path.join(__dirname, '../efs/datasets')));
app.use('/efs/ml-models', express.static(path.join(__dirname, '../efs/ml-models')));


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

//health checks
app.get('/health', (req, res) => {
    res.status(200).send('OK');
});

// Route imports
const userRoutes = require('./routes/users');
const datasetRoutes = require('./routes/dataset');

// Apply the authentication middleware
app.use("/users", userRoutes);
app.use("/datasets", datasetRoutes);


// Route for the home page
app.get('/', async (req, res) => {
    const errorMessage = req.query.error;
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
