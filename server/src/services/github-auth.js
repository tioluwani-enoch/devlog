const axios = require('axios');

const GITHUB_AUTH_URL = 'https://github.com/login/oauth/authorize';
const GITHUB_TOKEN_URL = 'https://github.com/login/oauth/access_token';
const GITHUB_API = 'https://api.github.com';

/**
 * Build the GitHub OAuth authorization URL
 */
function getAuthUrl() {
  const params = new URLSearchParams({
    client_id: process.env.GITHUB_CLIENT_ID,
    redirect_uri: `${process.env.CLIENT_URL}/auth/callback`,
    scope: 'read:user repo',
  });
  return `${GITHUB_AUTH_URL}?${params}`;
}

/**
 * Exchange the temporary code for an access token
 */
async function exchangeCodeForToken(code) {
  const { data } = await axios.post(
    GITHUB_TOKEN_URL,
    {
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code,
    },
    { headers: { Accept: 'application/json' } }
  );

  if (data.error) {
    throw new Error(`GitHub OAuth error: ${data.error_description}`);
  }

  return data.access_token;
}

/**
 * Get the authenticated user's GitHub profile
 */
async function getGitHubUser(accessToken) {
  const { data } = await axios.get(`${GITHUB_API}/user`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return data;
}

module.exports = { getAuthUrl, exchangeCodeForToken, getGitHubUser };
