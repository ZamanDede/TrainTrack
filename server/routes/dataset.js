const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const router = express.Router();
const pool = require('../db');
const unzipper = require('unzipper');
const { ensureAuthenticated, ensurePremiumOrAdmin, ensureAdmin } = require('../auth'); // Import necessary middlewares

// Function to get dataset info from the database
async function getDatasetInfo(datasetId) {
  try {
    const result = await pool.query('SELECT info FROM datasets WHERE id = $1', [datasetId]);
    if (result.rows.length > 0) {
      return result.rows[0].info;
    }
    return null;
  } catch (err) {
    console.error('Error fetching dataset info:', err);
    return null;
  }
}

// Function to get all datasets from the database
async function getAllDatasets() {
  try {
    const result = await pool.query('SELECT id, info FROM datasets');
    return result.rows.map(row => {
      const datasetId = row.id;
      const datasetPath = path.join('uploads/datasets', String(datasetId), 'cover.jpg');
      const imageUrl = fs.existsSync(path.join(__dirname, '../', datasetPath))
        ? `/${datasetPath}`  // Use the actual image if it exists
        : '/img/default.jpg';  // Use the default image if the cover.jpg doesn't exist

      return {
        id: datasetId,
        task_type: row.info.task_type,
        ...row.info,
        imageUrl: imageUrl  // Set the imageUrl to the correct value
      };
    });
  } catch (err) {
    console.error('Error fetching datasets:', err);
    return [];
  }
}


// Route to render the datasets page (View Only, accessible to all logged-in users)
router.get('/', ensureAuthenticated, async (req, res) => {
  const datasets = await getAllDatasets();
  res.render('datasets', { title: 'Datasets', datasets });
});

// Route to get dataset info as JSON (View Only, accessible to all logged-in users)
router.get('/:datasetId/info', ensureAuthenticated, async (req, res) => {
  const datasetId = req.params.datasetId;
  const info = await getDatasetInfo(datasetId);
  if (info) {
    res.json(info);
  } else {
    res.status(404).json({ error: 'Dataset not found' });
  }
});

// Function to delete dataset directory from the file system
function deleteDatasetDirectory(datasetId) {
  const datasetPath = path.join(__dirname, '../uploads/datasets', String(datasetId));
  if (fs.existsSync(datasetPath)) {
    fs.rmSync(datasetPath, { recursive: true, force: true });  // Remove the directory and its contents
  }
}

// Route to delete a dataset (Admin Only)
router.post('/:datasetId/delete', ensureAuthenticated, ensureAdmin, async (req, res) => {
  const datasetId = req.params.datasetId;

  try {
    // Delete the dataset from the database
    await pool.query('DELETE FROM datasets WHERE id = $1', [datasetId]);

    // Remove the dataset directory from the file system
    deleteDatasetDirectory(datasetId);

    // Redirect to the datasets page after successful deletion
    res.redirect('/datasets');
  } catch (err) {
    console.error('Error deleting dataset:', err);
    res.status(500).json({ error: 'Failed to delete dataset' });
  }
});


// Routes we are working on

// Set up multer with memory storage and file limits
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: { fileSize: 2 * 1024 * 1024 * 1024 },  // Set file size limit to 2GB
}).fields([
    { name: 'zipFile', maxCount: 1 },  // Expect a single ZIP file
    { name: 'image', maxCount: 1 }     // Optional image file
]);

// Route to render the dataset upload form (Requires premium or admin access)
router.get('/upload', ensureAuthenticated, ensurePremiumOrAdmin, (req, res) => {
    res.render('upload-datasets', { title: 'Upload Dataset' });
});

// Route to handle ZIP file upload and info submission (Requires premium or admin access)
router.post('/upload', ensureAuthenticated, ensurePremiumOrAdmin, upload, async (req, res) => {
    const {
        heading, description, purposes, task_type, source, dataset_size,
        data_format, license, author, retrieval_link
    } = req.body;

    const infoJson = {
        heading,
        description,
        purposes,
        task_type,
        source,
        dataset_size,
        data_format,
        license,
        author,
        retrieval_link
    };

    try {
        // Insert dataset info into the database and get the new ID
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

        // Unzip the uploaded file into the created directory
        const zipBuffer = req.files['zipFile'][0].buffer;
        await unzipper.Open.buffer(zipBuffer).then(d => {
            return d.extract({ path: absoluteDatasetPath });
        });

        // Save the uploaded image as cover.jpg if it exists
        if (req.files['image']) {
            const image = req.files['image'][0];
            const imagePath = path.join(absoluteDatasetPath, 'cover.jpg');  // Save image as cover.jpg
            fs.writeFileSync(imagePath, image.buffer);
        }

        // Update the path in the database with the correct relative datasetId path
        const updateQuery = `
            UPDATE datasets
            SET path = $1, file_path = $1
            WHERE id = $2`;
        await pool.query(updateQuery, [datasetPath, datasetId]);

        // Redirect to the upload page
        res.redirect(`/datasets/upload`);
    } catch (err) {
        console.error('Error processing dataset:', err);
        res.status(500).send('Error processing dataset');
    }
});

module.exports = router;
