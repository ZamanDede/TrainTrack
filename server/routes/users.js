// users.js

const express = require('express');
const router = express.Router();
const { ensureAuthenticated, ensureAdmin } = require('../auth');
const {
  CognitoIdentityProviderClient,
  SignUpCommand,
  InitiateAuthCommand,
  AdminAddUserToGroupCommand,
  AdminListGroupsForUserCommand,
  ListUsersCommand,
  AdminDeleteUserCommand,
  AdminRemoveUserFromGroupCommand,
} = require('@aws-sdk/client-cognito-identity-provider');
const dotenv = require('dotenv');
dotenv.config();

// Initialize Cognito Identity Provider Client
const cognitoClient = new CognitoIdentityProviderClient({ region: process.env.COGNITO_REGION });

// Helper function to add a user to a Cognito group
async function addUserToGroup(username, groupName) {
  const params = {
    GroupName: groupName,
    UserPoolId: process.env.COGNITO_USER_POOL_ID,
    Username: username,
  };

  const command = new AdminAddUserToGroupCommand(params);
  return cognitoClient.send(command);
}

// Helper function to remove a user from all groups
async function removeUserFromAllGroups(username) {
  const params = {
    UserPoolId: process.env.COGNITO_USER_POOL_ID,
    Username: username,
  };

  const listGroupsCommand = new AdminListGroupsForUserCommand(params);
  const groupsData = await cognitoClient.send(listGroupsCommand);
  const groups = groupsData.Groups || [];

  // Remove user from each group
  await Promise.all(
    groups.map((group) => {
      const removeParams = {
        GroupName: group.GroupName,
        UserPoolId: process.env.COGNITO_USER_POOL_ID,
        Username: username,
      };

      const removeCommand = new AdminRemoveUserFromGroupCommand(removeParams);
      return cognitoClient.send(removeCommand);
    })
  );
}

// User Registration
router.post('/register', async (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) {
    return res.render('register', {
      title: 'Register',
      error: 'All fields are required.',
    });
  }

  const params = {
    ClientId: process.env.COGNITO_APP_CLIENT_ID,
    Username: username,
    Password: password,
    UserAttributes: [{ Name: 'email', Value: email }],
  };

  const command = new SignUpCommand(params);

  try {
    await cognitoClient.send(command);

    // Since email confirmation is disabled, the user should be auto-confirmed.
    // Assign user to 'regular' group
    try {
      await addUserToGroup(username, 'regular');
    } catch (groupErr) {
      console.error('Error adding user to group:', groupErr);
      // Handle the error as needed
    }

    // Redirect to login page
    res.redirect('/users/login');
  } catch (err) {
    console.error('Error during sign up:', err);
    res.render('register', {
      title: 'Register',
      error: err.message || 'Failed to register user. Please try again.',
    });
  }
});

// Serve the registration form
router.get('/register', (req, res) => {
  res.render('register', { title: 'Register', error: null });
});

// User Login
router.post('/login', (req, res) => {
  const { username, password } = req.body; // Assuming we're using username for login
  if (!username || !password) {
    return res.render('login', {
      title: 'Login',
      error: 'Both username and password are required.',
    });
  }

  const params = {
    AuthFlow: 'USER_PASSWORD_AUTH',
    ClientId: process.env.COGNITO_APP_CLIENT_ID,
    AuthParameters: {
      USERNAME: username,
      PASSWORD: password,
    },
  };

  const command = new InitiateAuthCommand(params);

  cognitoClient
    .send(command)
    .then((result) => {
      const idToken = result.AuthenticationResult.IdToken;

      // Set the token in an HTTP-only cookie
      res.cookie('token', idToken, { httpOnly: true, secure: false }); // Set 'secure: true' if using HTTPS

      // Redirect to the homepage or dashboard
      res.redirect('/');
    })
    .catch((err) => {
      console.error('Login error:', err);
      res.render('login', {
        title: 'Login',
        error: err.message || 'Invalid username or password.',
      });
    });
});

// Serve the login form
router.get('/login', (req, res) => {
  const errorMessage = req.query.error || null;
  res.render('login', { title: 'Login', error: errorMessage });
});


// Admin User List (Protected Route)
router.get('/list', ensureAuthenticated, ensureAdmin, async (req, res) => {
	try {
		const params = {
			UserPoolId: process.env.COGNITO_USER_POOL_ID,
		};

		const listUsersCommand = new ListUsersCommand(params);
		const usersData = await cognitoClient.send(listUsersCommand);
		const users = usersData.Users;

		// For each user, get their groups to determine user_type
		const usersWithTypes = await Promise.all(
			users.map(async (user) => {
				// Get user's groups
				const groupsParams = {
					UserPoolId: process.env.COGNITO_USER_POOL_ID,
					Username: user.Username,
				};

				const listGroupsCommand = new AdminListGroupsForUserCommand(groupsParams);
				const groupsData = await cognitoClient.send(listGroupsCommand);
				const groups = groupsData.Groups.map((group) => group.GroupName);

				// Determine user_type based on groups
				let user_type = 'regular';
				if (groups.includes('admin')) {
					user_type = 'admin';
				} else if (groups.includes('premium')) {
					user_type = 'premium';
				}

				return {
					username: user.Username,
					email: user.Attributes.find((attr) => attr.Name === 'email')?.Value || '',
					user_type: user_type,
				};
			})
		);

		// Sort users based on user_type and username
		usersWithTypes.sort((a, b) => {
			const typeOrder = { admin: 1, premium: 2, regular: 3 };
			if (typeOrder[a.user_type] !== typeOrder[b.user_type]) {
				return typeOrder[a.user_type] - typeOrder[b.user_type];
			} else {
				return a.username.localeCompare(b.username);
			}
		});

		res.render('users', { title: 'User List', users: usersWithTypes });
	} catch (err) {
		console.error('Error fetching users:', err);
		res.status(500).json({ error: 'Failed to fetch users' });
	}
});

// Logout Route
router.get('/logout', (req, res) => {
	res.clearCookie('token', { path: '/' });
	res.redirect('/users/login');
});

// Delete User (Admin Only)
router.post('/delete/:username', ensureAuthenticated, ensureAdmin, async (req, res) => {
	const { username } = req.params;

	const params = {
		UserPoolId: process.env.COGNITO_USER_POOL_ID,
		Username: username,
	};

	const command = new AdminDeleteUserCommand(params);

	try {
		await cognitoClient.send(command);
		res.redirect('/users/list');
	} catch (err) {
		console.error('Error deleting user:', err);
		res.status(500).json({ error: 'Failed to delete user' });
	}
});

// Change User Type (Admin Only)
router.post('/changeType/:username', ensureAuthenticated, ensureAdmin, async (req, res) => {
	const { username } = req.params;
	const { user_type } = req.body;

	// Ensure valid user type
	if (!['regular', 'premium', 'admin'].includes(user_type)) {
		return res.status(400).json({ error: true, message: 'Invalid user type' });
	}

	try {
		// Remove user from all groups
		await removeUserFromAllGroups(username);

		// Add user to the new group
		await addUserToGroup(username, user_type);

		res.redirect('/users/list');
	} catch (err) {
		console.error('Error changing user type:', err);
		res.status(500).json({ error: 'Failed to change user type' });
	}
});

module.exports = router;
