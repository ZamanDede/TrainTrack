const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();
const { exec } = require('child_process');

// Authentication Middleware
function ensureAuthenticated(req, res, next, redirectUrl = '/users/login', errorMessage = "You are not logged in.", deniedErrorMessage = "Access denied, upgrade to premium.") {
  const user = res.locals.user;

  if (!user) {
    return res.redirect(`${redirectUrl}?error=${encodeURIComponent(errorMessage)}`);
  }

  if (user.userType === 'regular') {
    return res.render('index', {
      title: 'Home',
      error: deniedErrorMessage
    });
  }

  next();
}

// Helper Functions
function getModelInfo(modelId) {
  const infoFilePath = path.join(__dirname, '../uploads/ml-models', modelId, 'info.json');
  if (fs.existsSync(infoFilePath)) {
    const data = fs.readFileSync(infoFilePath, 'utf8');
    return JSON.parse(data);
  }
  return null;
}

function getModelVisualizations(modelId) {
  const visualsDir = path.join(__dirname, '../uploads/ml-models', modelId);
  if (fs.existsSync(visualsDir)) {
    return fs.readdirSync(visualsDir).filter(file => file.endsWith('.png')).map(file => `/uploads/ml-models/${modelId}/${file}`);
  }
  return [];
}

function getModelMetrics(modelId) {
  const metricsDir = path.join(__dirname, '../uploads/ml-models', modelId);
  if (fs.existsSync(metricsDir)) {
    return fs.readdirSync(metricsDir).filter(file => file.endsWith('.txt')).map(file => `/uploads/ml-models/${modelId}/${file}`);
  }
  return [];
}

function getAllModels() {
  const modelsDir = path.join(__dirname, '../uploads/ml-models');
  const modelDirs = fs.readdirSync(modelsDir);

  return modelDirs
    .filter(dir => dir.startsWith('m'))
    .map(modelId => {
      const modelInfo = getModelInfo(modelId);
      if (modelInfo) {
        return { id: modelId, ...modelInfo };
      }
      return null;
    })
    .filter(info => info !== null);
}

// Routes
router.get('/', (req, res) => {
  ensureAuthenticated(req, res, () => {
    const models = getAllModels();
    res.render('models', { title: 'Models', models });
  }, '/users/login', "You are not logged in. Please log in to access the Models page.");
});

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

router.get('/:modelId', (req, res) => {
  ensureAuthenticated(req, res, () => {
    const modelId = req.params.modelId;
    const modelInfo = getModelInfo(modelId);
    if (modelInfo) {
      const visuals = getModelVisualizations(modelId);
      const metrics = getModelMetrics(modelId);

      const metricsContent = metrics.map(metricPath => {
        return {
          path: metricPath,
          content: fs.readFileSync(path.join(__dirname, '../uploads/ml-models', modelId, path.basename(metricPath)), 'utf8')
        };
      });

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


router.post('/:modelId/execute', (req, res) => {
  ensureAuthenticated(req, res, () => {
    const modelId = req.params.modelId;
    const scriptName = req.body.script;
    const scriptPath = path.join(__dirname, '../uploads/ml-models', modelId, scriptName);
    const pythonPath = path.join(__dirname, '../uploads/ml-models/venv/bin/python3'); // Path to your virtual environment's Python

    if (fs.existsSync(scriptPath)) {
      // Execute the Python script using the virtual environment's Python
      exec(`${pythonPath} ${scriptPath}`, (error, stdout, stderr) => {
        if (error) {
          console.error(`Error executing script: ${stderr}`);
          return res.status(500).json({ error: 'Error executing script', details: stderr });
        }
        console.log(`Script output: ${stdout}`);

        // Redirect back to the same model page
        res.redirect(`/models/${modelId}`);
      });
    } else {
      res.status(404).json({ error: 'Script not found' });
    }
  }, '/users/login', "You are not logged in. Please log in to execute the model.");
});


module.exports = router;
