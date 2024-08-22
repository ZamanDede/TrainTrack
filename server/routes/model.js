const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();

// Utility function to ensure user is authenticated
function ensureAuthenticated(req, res, next, redirectUrl = '/users/login', errorMessage = "You are not logged in.") {
  const user = res.locals.user;

  if (!user) {
    return res.redirect(`${redirectUrl}?error=${encodeURIComponent(errorMessage)}`);
  }

  next();  // Proceed to the next middleware/route handler if the user is authenticated
}

// Function to get model info from file
function getModelInfo(modelId) {
  const infoFilePath = path.join(__dirname, '../uploads/ml-models', modelId, 'info.json');
  if (fs.existsSync(infoFilePath)) {
    const data = fs.readFileSync(infoFilePath, 'utf8');
    return JSON.parse(data);
  }
  return null;
}

// Function to get model visualizations (PNG files)
function getModelVisualizations(modelId) {
  const visualsDir = path.join(__dirname, '../uploads/ml-models', modelId);
  if (fs.existsSync(visualsDir)) {
    return fs.readdirSync(visualsDir).filter(file => file.endsWith('.png')).map(file => `/uploads/ml-models/${modelId}/${file}`);
  }
  return [];
}

// Function to get model metrics (TXT files)
function getModelMetrics(modelId) {
  const metricsDir = path.join(__dirname, '../uploads/ml-models', modelId);
  if (fs.existsSync(metricsDir)) {
    return fs.readdirSync(metricsDir).filter(file => file.endsWith('.txt')).map(file => `/uploads/ml-models/${modelId}/${file}`);
  }
  return [];
}

// Function to get all models
function getAllModels() {
  const modelsDir = path.join(__dirname, '../uploads/ml-models');
  const modelDirs = fs.readdirSync(modelsDir);

  // Filter directories that start with 'm'
  const models = modelDirs
    .filter(dir => dir.startsWith('m'))  // Only include directories starting with 'm'
    .map(modelName => {
      const modelInfo = getModelInfo(modelName);
      if (modelInfo) {
        return { id: modelName, ...modelInfo };  // Include directory name as id
      }
      return null;
    })
    .filter(info => info !== null);

  return models;
}

// Route to render the models page
router.get('/', (req, res) => {
  ensureAuthenticated(req, res, () => {
    const models = getAllModels();
    res.render('models', { title: 'Models', models });
  }, '/users/login', "You are not logged in. Please log in to access the Models page.");
});

// Route to get model info as JSON
router.get('/:modelId/info', (req, res) => {
  ensureAuthenticated(req, res, () => {
    const modelId = req.params.modelId;
    const info = getModelInfo(modelId);
    if (info) {
      res.json(info);
    } else {
      res.status(404).json({ error: 'Model not found' });
    }
  }, '/users/login', "You are not logged in. Please log in to access the model information.");
});

// Route to render individual model page
router.get('/:modelId', (req, res) => {
  ensureAuthenticated(req, res, () => {
    const modelId = req.params.modelId;
    const modelInfo = getModelInfo(modelId);
    if (modelInfo) {
      // Get visualizations and metrics
      const visuals = getModelVisualizations(modelId);
      const metrics = getModelMetrics(modelId);

      // Read metric files content
      const metricsContent = metrics.map(metricPath => {
        return {
          path: metricPath,
          content: fs.readFileSync(path.join(__dirname, '../uploads/ml-models', modelId, path.basename(metricPath)), 'utf8')
        };
      });

      // Pass data to the template
      res.render('model', {
        title: `Model ${modelId}`,
        model: {
          id: modelId,
          ...modelInfo,
          visuals: visuals,
          metrics: metricsContent
        }
      });
    } else {
      res.status(404).send('Model not found');
    }
  }, '/users/login', "You are not logged in. Please log in to access the model information.");
});

module.exports = router;
