const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();
const { exec } = require('child_process');
const { ensureAuthenticated, ensurePremiumOrAdmin } = require('../auth');  // Use the updated auth.js functions

let modelStatus = {}; // This object will track the status of each model by ID

// Function to get model metrics
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

// Function to get model info
function getModelInfo(modelId) {
  const infoFilePath = path.join(__dirname, '../uploads/ml-models', modelId, 'info.json');
  if (fs.existsSync(infoFilePath)) {
    const data = fs.readFileSync(infoFilePath, 'utf8');
    return JSON.parse(data);
  }
  return null;
}

// Function to get model visualizations
function getModelVisualizations(modelId) {
  const visualsDir = path.join(__dirname, '../uploads/ml-models', modelId);
  if (fs.existsSync(visualsDir)) {
    return fs.readdirSync(visualsDir).filter(file => file.endsWith('.png')).map(file => `/uploads/ml-models/${modelId}/${file}`);
  }
  return [];
}

// Route to render the models page (View Only, requires login)
router.get('/', ensureAuthenticated, (req, res) => {
  const models = getAllModels();
  res.render('models', { title: 'Models', models });
});

// Route to get model info as JSON (View Only, requires login)
router.get('/:modelId/info', ensureAuthenticated, ensurePremiumOrAdmin, (req, res) => {
  const modelId = req.params.modelId;
  const info = getModelInfo(modelId);
  if (info) {
    res.json(info);
  } else {
    res.status(404).json({ error: 'Model not found' });
  }
});

// Route to render a specific model's details (View Only, requires login)
router.get('/:modelId', ensureAuthenticated, ensurePremiumOrAdmin, (req, res) => {
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
});

// Route to execute a model script (Requires premium or admin access)
router.post('/:modelId/execute', ensureAuthenticated, ensurePremiumOrAdmin, (req, res) => {
  const modelId = req.params.modelId;
  const scriptName = req.body.script;
  const scriptPath = path.join(__dirname, '../uploads/ml-models', modelId, scriptName);
  const pythonPath = path.join(__dirname, '../uploads/ml-models/venv/bin/python3'); // Path to your virtual environment's Python

  // Set status to 'running'
  modelStatus[modelId] = 'running';

  if (fs.existsSync(scriptPath)) {
    exec(`${pythonPath} ${scriptPath}`, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error executing script: ${stderr}`);
        modelStatus[modelId] = 'error'; // Set status to 'error' if the script fails
        return res.status(500).json({ error: 'Error executing script', details: stderr });
      }
      console.log(`Script output: ${stdout}`);
      modelStatus[modelId] = 'finished'; // Set status to 'finished' when done
      res.redirect(`/models/${modelId}`);
    });
  } else {
    modelStatus[modelId] = 'not found';
    res.status(404).json({ error: 'Script not found' });
  }
});

// Route to get the execution status of a model (Requires premium or admin access)
router.get('/:modelId/status', ensureAuthenticated, ensurePremiumOrAdmin, (req, res) => {
  const modelId = req.params.modelId;
  const status = modelStatus[modelId] || 'not started';
  res.json({ status });
});

module.exports = router;
