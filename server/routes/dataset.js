const express = require('express');
const fs = require('fs');
const path = require('path');

const router = express.Router();

// Function to get dataset info from file
function getDatasetInfo(datasetName) {
  const infoFilePath = path.join(__dirname, '../uploads/datasets', datasetName, 'info.json');
  if (fs.existsSync(infoFilePath)) {
    const data = fs.readFileSync(infoFilePath, 'utf8');
    return JSON.parse(data);
  }
  return null;
}

// Function to get all datasets
function getAllDatasets() {
  const datasetsDir = path.join(__dirname, '../uploads/datasets');
  const datasetDirs = fs.readdirSync(datasetsDir);

  const datasets = datasetDirs
    .map(datasetName => getDatasetInfo(datasetName))
    .filter(info => info !== null);

  return datasets;
}

// Route to render the datasets page
router.get('/', (req, res) => {
  const datasets = getAllDatasets();
  res.render('datasets', { title: 'Datasets', datasets });
});

// Route to get dataset info as JSON
router.get('/:datasetName/info', (req, res) => {
  const datasetName = req.params.datasetName;
  const info = getDatasetInfo(datasetName);
  if (info) {
    res.json(info);
  } else {
    res.status(404).json({ error: 'Dataset not found' });
  }
});

module.exports = router;
