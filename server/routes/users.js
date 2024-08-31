const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();
const pool = require('../db');
const { generateJWT, ensureAuthenticated, ensureAdmin } = require('../auth');

// User Registration
router.post('/register', async (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) {
    return res.render('register', {
      title: 'Register',
      error: 'All fields are required.'
    });
  }

  try {
    const existingUser = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.render('register', {
        title: 'Register',
        error: 'User already exists'
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await pool.query('INSERT INTO users (username, email, password_hash, user_type) VALUES ($1, $2, $3, $4)',
      [username, email, hashedPassword, 'regular']);  // Default user type is 'regular'

    // Redirect to login page after successful registration
    res.redirect('/users/login');
  } catch (err) {
    console.error('Error registering user:', err);
    res.render('register', {
      title: 'Register',
      error: 'Failed to register user. Please try again.'
    });
  }
});

// User Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.render('login', {
      title: 'Login',
      error: 'Both email and password are required.'
    });
  }

  try {
    const user = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (user.rows.length === 0) {
      return res.render('login', {
        title: 'Login',
        error: 'Incorrect email or password.'
      });
    }

    const isMatch = await bcrypt.compare(password, user.rows[0].password_hash);
    if (!isMatch) {
      return res.render('login', {
        title: 'Login',
        error: 'Incorrect email or password.'
      });
    }

    // Generate JWT using the centralized function
    const token = generateJWT(user.rows[0]);

    // Send the JWT as a cookie
    res.cookie('token', token, { httpOnly: true });

    // Redirect to home page after successful login
    res.redirect('/');
  } catch (err) {
    console.error('Error logging in user:', err);
    res.render('login', {
      title: 'Login',
      error: 'Failed to log in. Please try again.'
    });
  }
});

// Serve the registration form
router.get('/register', (req, res) => {
  res.render('register', { title: 'Register', error: null }); // Ensure error is defined
});

// Serve the login form
router.get('/login', (req, res) => {
  const errorMessage = req.query.error || null;  // Get error message from query parameter if it exists
  res.render('login', { title: 'Login', error: errorMessage });
});


// Admin User List (Protected Route)
router.get('/list', ensureAuthenticated, ensureAdmin, async (req, res) => {
  try {
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
router.post('/delete/:id', ensureAuthenticated, ensureAdmin, async (req, res) => {
  const { id } = req.params;

  try {
    await pool.query('DELETE FROM users WHERE id = $1', [id]);
    res.redirect('/users/list');  // Redirect to the user list after deletion
  } catch (err) {
    console.error('Error deleting user:', err);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// Change User Type (Admin Only)
router.post('/changeType/:id', ensureAuthenticated, ensureAdmin, async (req, res) => {
  const { id } = req.params;
  const { user_type } = req.body;

  // Ensure valid user type
  if (!['regular', 'premium', 'admin'].includes(user_type)) {
    return res.status(400).json({ error: true, message: 'Invalid user type' });
  }

  try {
    await pool.query('UPDATE users SET user_type = $1 WHERE id = $2', [user_type, id]);
    res.redirect('/users/list');  // Redirect to the user list after updating the user type
  } catch (err) {
    console.error('Error changing user type:', err);
    res.status(500).json({ error: 'Failed to change user type' });
  }
});

module.exports = router;
