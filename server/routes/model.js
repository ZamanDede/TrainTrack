const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  // Check if the user is logged in (authenticateJWT should have set res.locals.user)
  const user = res.locals.user;

  if (!user) {
    const errorMessage = "You are not logged in. Please log in to access the Models page.";
    return res.redirect('/users/login?error=' + encodeURIComponent(errorMessage));
  }

  // Check if the user is admin or premium
  if (user.userType !== 'admin' && user.userType !== 'premium') {
    const errorMessage = "You do not have access to the Models page.";
    return res.redirect('/?error=' + encodeURIComponent(errorMessage));
  }

  // If user is admin or premium, render the Models page
  res.render('models', { title: 'Models' });
});

module.exports = router;
