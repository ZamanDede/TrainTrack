// auth.js
const { CognitoJwtVerifier } = require('aws-jwt-verify');
const dotenv = require('dotenv');
dotenv.config();

// Initialize the Cognito JWT Verifier
const verifier = CognitoJwtVerifier.create({
  userPoolId: process.env.COGNITO_USER_POOL_ID,
  clientId: process.env.COGNITO_APP_CLIENT_ID,
  tokenUse: 'id',
});

// Middleware to authenticate JWT using Cognito
const authenticateJWT = async (req, res, next) => {
  const token = req.cookies.token;

  if (!token) {
    res.locals.user = null;
    return next();
  }

  try {
    const payload = await verifier.verify(token);

    // Extract user info
    const username = payload['cognito:username'];
    const email = payload.email;
    const groups = payload['cognito:groups'] || [];

    // Determine userType based on group membership
    let userType = 'regular';
    if (groups.includes('admin')) {
      userType = 'admin';
    } else if (groups.includes('premium')) {
      userType = 'premium';
    }

    // Set res.locals.user with the userType
    res.locals.user = {
      username: username,
      email: email,
      groups: groups,
      userType: userType,
    };

  } catch (err) {
    console.error('Invalid token:', err);
    res.locals.user = null;
  }
  next();
};

// Middleware to ensure the user is authenticated
function ensureAuthenticated(req, res, next, redirectUrl = '/users/login', errorMessage = 'You are not logged in.') {
  const user = res.locals.user;

  if (!user) {
    return res.redirect(`${redirectUrl}?error=${encodeURIComponent(errorMessage)}`);
  }

  next();
}

// Middleware to ensure the user is either premium or admin
function ensurePremiumOrAdmin(req, res, next, deniedErrorMessage = 'Access denied, upgrade to premium.') {
  const user = res.locals.user;

  if (!user) {
    return res.redirect(`/users/login?error=${encodeURIComponent('You are not logged in.')}`);
  }

  const groups = user.groups || []; // Corrected access

  if (!groups.includes('premium') && !groups.includes('admin')) {
    return res.render('index', {
      title: 'Home',
      error: deniedErrorMessage,
    });
  }

  next();
}

// Middleware to ensure the user is an admin
function ensureAdmin(req, res, next) {
  const user = res.locals.user;

  if (!user) {
    return res.status(403).json({ error: 'Access denied. Admins only.' });
  }

  const groups = user.groups || []; // Corrected access

  if (!groups.includes('admin')) {
    return res.status(403).json({ error: 'Access denied. Admins only.' });
  }

  next();
}

module.exports = {
  authenticateJWT,
  ensureAuthenticated,
  ensurePremiumOrAdmin,
  ensureAdmin,
};
