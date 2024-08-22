const jwt = require('jsonwebtoken');

const authenticateJWT = (req, res, next) => {
  const token = req.cookies.token;  // Assuming JWT is stored in cookies

  if (token) {
    try {
      const secretKey = process.env.JWT_SECRET;
      if (!secretKey) {
        console.error('JWT_SECRET is not defined in environment variables.');
        res.locals.user = null;
        return next();
      }

      const decoded = jwt.verify(token, secretKey);
      res.locals.user = decoded;  // Pass user info to the views
    } catch (err) {
      console.error('Invalid token:', err);
      res.locals.user = null;
    }
  } else {
    res.locals.user = null;
  }
  next();
};

module.exports = authenticateJWT;
