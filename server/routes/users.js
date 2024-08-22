const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const router = express.Router();
const pool = require('../db');  // Import the database pool

const SECRET_KEY = process.env.JWT_SECRET;  // Ensure you set this in your environment variables

// User Registration
router.post('/register', async (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) {
    return res.status(400).json({ error: true, message: 'Request body incomplete, username, email, and password are required' });
  }

  try {
    const existingUser = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(409).json({ error: true, message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await pool.query('INSERT INTO users (username, email, password_hash, user_type) VALUES ($1, $2, $3, $4)',
                     [username, email, hashedPassword, 'regular']);  // Default user type is 'regular'

    // Redirect to login page after successful registration
    res.redirect('/users/login');
  } catch (err) {
    console.error('Error registering user:', err);
    res.status(500).json({ error: 'Failed to register user' });
  }
});

// User Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: true, message: 'Request body incomplete, both email and password are required' });
  }

  try {
    const user = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (user.rows.length === 0) {
      return res.status(401).json({ error: true, message: 'Incorrect email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.rows[0].password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: true, message: 'Incorrect email or password' });
    }

    // Generate JWT
    const token = jwt.sign(
      { id: user.rows[0].id, username: user.rows[0].username, email: user.rows[0].email, userType: user.rows[0].user_type },
      SECRET_KEY,
      { expiresIn: '1h' }  // Token expires in 1 hour
    );

    // Send the JWT as a cookie
    res.cookie('token', token, { httpOnly: true });

    // Redirect to home page after successful login
    res.redirect('/');
  } catch (err) {
    console.error('Error logging in user:', err);
    res.status(500).json({ error: 'Failed to log in' });
  }
});

// Serve the registration form
router.get('/register', (req, res) => {
  res.render('register', { title: 'Register' });
});

// Serve the login form
router.get('/login', (req, res) => {
  res.render('login', { title: 'Login', error: null });
});


// Admin User List (Protected Route)
router.get('/list', async (req, res) => {
  const token = req.cookies.token;  // Assuming you're storing JWT in cookies

  if (!token) {
    return res.status(401).json({ error: true, message: 'Access denied, no token provided' });
  }

  try {
    const decoded = jwt.verify(token, SECRET_KEY);

    if (decoded.userType !== 'admin') {
      return res.status(403).json({ error: true, message: 'Access denied, not an admin' });
    }

    // Sort by user_type with a specific order and then by username alphabetically
    const result = await pool.query(`
      SELECT id, username, email, user_type
      FROM users
      ORDER BY
        CASE
          WHEN user_type = 'admin' THEN 1
          WHEN user_type = 'premium' THEN 2
          WHEN user_type = 'regular' THEN 3
        END,
        username ASC
    `);

    const users = result.rows;

    res.render('users', { title: 'User List', users });
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});


// Logout Route
router.get('/logout', (req, res) => {
  res.clearCookie('token', { path: '/' });  // Clear the JWT cookie
  res.redirect('/users/login');  // Redirect to the login page after logout
});

// Delete User (Admin Only)
router.post('/delete/:id', async (req, res) => {
  const { id } = req.params;
  const token = req.cookies.token;  // Assuming you're storing JWT in cookies

  if (!token) {
    return res.status(401).json({ error: true, message: 'Access denied, no token provided' });
  }

  try {
    const decoded = jwt.verify(token, SECRET_KEY);

    if (decoded.userType !== 'admin') {
      return res.status(403).json({ error: true, message: 'Access denied, not an admin' });
    }

    await pool.query('DELETE FROM users WHERE id = $1', [id]);
    res.redirect('/users/list');  // Redirect to the user list after deletion
  } catch (err) {
    console.error('Error deleting user:', err);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// Change User Type (Admin Only)
router.post('/changeType/:id', async (req, res) => {
  const { id } = req.params;
  const { user_type } = req.body;
  const token = req.cookies.token;  // Assuming you're storing JWT in cookies

  if (!token) {
    return res.status(401).json({ error: true, message: 'Access denied, no token provided' });
  }

  try {
    const decoded = jwt.verify(token, SECRET_KEY);

    if (decoded.userType !== 'admin') {
      return res.status(403).json({ error: true, message: 'Access denied, not an admin' });
    }

    // Ensure valid user type
    if (!['regular', 'premium', 'admin'].includes(user_type)) {
      return res.status(400).json({ error: true, message: 'Invalid user type' });
    }

    await pool.query('UPDATE users SET user_type = $1 WHERE id = $2', [user_type, id]);
    res.redirect('/users/list');  // Redirect to the user list after updating the user type
  } catch (err) {
    console.error('Error changing user type:', err);
    res.status(500).json({ error: 'Failed to change user type' });
  }
});



module.exports = router;
