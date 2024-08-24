const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const router = express.Router();
const pool = require('../db');


// Utility function to ensure user is authenticated
function ensureAuthenticated(req, res, next, redirectUrl = '/users/login', errorMessage = "You are not logged in.") {
  const user = res.locals.user;

  if (!user) {
    return res.redirect(`${redirectUrl}?error=${encodeURIComponent(errorMessage)}`);
  }

  next();  // Proceed to the next middleware/route handler if the user is authenticated
}

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
  // Use the authentication utility
  ensureAuthenticated(req, res, () => {
    const datasets = getAllDatasets();
    res.render('datasets', { title: 'Datasets', datasets });
  }, '/users/login', "You are not logged in. Please log in to access the Datasets page.");
});

// Route to get dataset info as JSON
router.get('/:datasetName/info', (req, res) => {
  // Use the authentication utility
  ensureAuthenticated(req, res, () => {
    const datasetName = req.params.datasetName;
    const info = getDatasetInfo(datasetName);
    if (info) {
      res.json(info);
    } else {
      res.status(404).json({ error: 'Dataset not found' });
    }
  }, '/users/login', "You are not logged in. Please log in to access the dataset information.");
});


// New rotues

// Multer storage configuration without `destination` for now
const storage = multer.memoryStorage();  // Temporarily store files in memory

const upload = multer({ storage: storage });

// Route to render the dataset upload form
router.get('/upload', (req, res) => {
  res.render('upload-datasets', { title: 'Upload Dataset' });
});

// Route to handle dataset upload and info submission
router.post('/upload', upload.fields([{ name: 'files', maxCount: 10 }]), async (req, res) => {
  const {
    heading, description, purposes, task_type, source, dataset_size,
    data_format, license, author, retrieval_link
  } = req.body;

  const infoJson = {
    heading,
    description,
    purposes,  // Now it's a single string
    task_type,
    source,
    dataset_size,
    data_format,
    license,
    author,
    retrieval_link
  };

  try {
    // Use relative path for initial insert
    const relativePath = path.join('uploads/datasets', 'initial');
    const insertQuery = `
      INSERT INTO datasets (path, file_path, info)
      VALUES ($1, $1, $2)
      RETURNING id, created_at`;
    const values = [relativePath, infoJson];
    const insertResult = await pool.query(insertQuery, values);
    const datasetId = insertResult.rows[0].id;

    // Create the new directory with the datasetId as its name using relative path
    const datasetPath = path.join('uploads/datasets', String(datasetId));
    const absoluteDatasetPath = path.join(__dirname, '../', datasetPath);  // Convert to absolute path for file operations
    if (!fs.existsSync(absoluteDatasetPath)) {
      fs.mkdirSync(absoluteDatasetPath, { recursive: true });
    }

    // Update the path in the database with the correct relative datasetId path
    const updateQuery = `
      UPDATE datasets
      SET path = $1, file_path = $1
      WHERE id = $2`;
    await pool.query(updateQuery, [datasetPath, datasetId]);

    // Save the files to the correct directory
    req.files['files'].forEach(file => {
      const filePath = path.join(absoluteDatasetPath, file.originalname);
      fs.writeFileSync(filePath, file.buffer);
    });

    // Redirect to the upload page
    res.redirect(`/datasets/upload`);
  } catch (err) {
    console.error('Error saving dataset:', err);
    res.status(500).send('Error saving dataset');
  }
});

module.exports = router;
