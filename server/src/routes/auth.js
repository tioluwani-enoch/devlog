const express = require('express');
const router = express.Router();
const db = require('../db');
const { getAuthUrl, exchangeCodeForToken, getGitHubUser } = require('../services/github-auth');

// GET /auth/github — redirect user to GitHub's OAuth page
router.get('/github', (req, res) => {
  res.json({ url: getAuthUrl() });
});

// POST /auth/github/callback — exchange code for token, create/update user
router.post('/github/callback', async (req, res) => {
  const { code } = req.body;

  if (!code) {
    return res.status(400).json({ error: 'Missing authorization code' });
  }

  try {
    // Exchange code for access token
    const accessToken = await exchangeCodeForToken(code);

    // Get user profile from GitHub
    const ghUser = await getGitHubUser(accessToken);

    // Upsert user in database
    const { rows } = await db.query(
      `INSERT INTO users (github_id, username, display_name, avatar_url, access_token)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (github_id)
       DO UPDATE SET
         username = EXCLUDED.username,
         display_name = EXCLUDED.display_name,
         avatar_url = EXCLUDED.avatar_url,
         access_token = EXCLUDED.access_token,
         updated_at = NOW()
       RETURNING id, username, display_name, avatar_url`,
      [ghUser.id, ghUser.login, ghUser.name, ghUser.avatar_url, accessToken]
    );

    const user = rows[0];

    // Store user ID in session
    req.session.userId = user.id;

    res.json({ user });
  } catch (err) {
    console.error('OAuth callback error:', err.message);
    res.status(500).json({ error: 'Authentication failed' });
  }
});

// GET /auth/me — get current user
router.get('/me', async (req, res) => {
  if (!req.session?.userId) {
    return res.json({ user: null });
  }

  try {
    const { rows } = await db.query(
      'SELECT id, username, display_name, avatar_url FROM users WHERE id = $1',
      [req.session.userId]
    );

    res.json({ user: rows[0] || null });
  } catch (err) {
    console.error('Error fetching user:', err.message);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// POST /auth/logout
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Logout failed' });
    }
    res.json({ success: true });
  });
});

module.exports = router;
