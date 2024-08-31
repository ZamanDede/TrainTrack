const jwt = require('jsonwebtoken');

// Middleware to authenticate JWT
const authenticateJWT = (req, res, next) => {
  const token = req.cookies.token;

  if (token) {
    try {
      const secretKey = process.env.JWT_SECRET;
      if (!secretKey) {
        console.error('JWT_SECRET is not defined in environment variables.');
        res.locals.user = null;
        return next();
      }

      const decoded = jwt.verify(token, secretKey);
      res.locals.user = decoded;
    } catch (err) {
      console.error('Invalid token:', err);
      res.locals.user = null;
    }
  } else {
    res.locals.user = null;
  }
  next();
};

// Function to generate JWT
function generateJWT(user) {
  const secretKey = process.env.JWT_SECRET;
  return jwt.sign(
    { id: user.id, username: user.username, email: user.email, userType: user.user_type },
    secretKey,
    { expiresIn: '1h' }
  );
}

// Middleware to ensure the user is authenticated
function ensureAuthenticated(req, res, next, redirectUrl = '/users/login', errorMessage = "You are not logged in.") {
  const user = res.locals.user;

  if (!user) {
    return res.redirect(`${redirectUrl}?error=${encodeURIComponent(errorMessage)}`);
  }

  next();
}

// Middleware to ensure the user is either premium or admin
function ensurePremiumOrAdmin(req, res, next, deniedErrorMessage = "Access denied, upgrade to premium.") {
  const user = res.locals.user;

  if (user.userType !== 'premium' && user.userType !== 'admin') {
    return res.render('index', {
      title: 'Home',
      error: deniedErrorMessage
    });
  }

  next();
}

// Middleware to ensure the user is an admin
function ensureAdmin(req, res, next) {
  const user = res.locals.user;

  if (user.userType !== 'admin') {
    return res.status(403).json({ error: "Access denied. Admins only." });
  }

  next();
}

module.exports = {
  authenticateJWT,
  generateJWT,
  ensureAuthenticated,
  ensurePremiumOrAdmin,
  ensureAdmin
};
