const express = require('express');
const fs = require('fs');
const path = require('path');

const router = express.Router();

// Route to get dataset info as JSON
router.get('/:datasetName/info', (req, res) => {
  const datasetName = req.params.datasetName;
  const infoFilePath = path.join(__dirname, '../uploads/datasets', datasetName, 'info.json');

  fs.readFile(infoFilePath, 'utf8', (err, data) => {
    if (err) {
      console.error(`Error reading info.json for dataset ${datasetName}:`, err);
      return res.status(404).json({ error: 'Dataset not found' });
    }

    try {
      const info = JSON.parse(data);
      res.json(info);
    } catch (parseErr) {
      console.error(`Error parsing info.json for dataset ${datasetName}:`, parseErr);
      res.status(500).json({ error: 'Error parsing dataset information' });
    }
  });
});

module.exports = router;
