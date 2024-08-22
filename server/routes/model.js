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
function getModelInfo(modelName) {
  const infoFilePath = path.join(__dirname, '../uploads/ml-models', modelName, 'info.json');
  if (fs.existsSync(infoFilePath)) {
    const data = fs.readFileSync(infoFilePath, 'utf8');
    return JSON.parse(data);
  }
  return null;
}

// Function to get all models
function getAllModels() {
  const modelsDir = path.join(__dirname, '../uploads/ml-models');
  const modelDirs = fs.readdirSync(modelsDir);

  const models = modelDirs
    .map(modelName => getModelInfo(modelName))
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
router.get('/:modelName/info', (req, res) => {
  ensureAuthenticated(req, res, () => {
    const modelName = req.params.modelName;
    const info = getModelInfo(modelName);
    if (info) {
      res.json(info);
    } else {
      res.status(404).json({ error: 'Model not found' });
    }
  }, '/users/login', "You are not logged in. Please log in to access the model information.");
});

module.exports = router;
