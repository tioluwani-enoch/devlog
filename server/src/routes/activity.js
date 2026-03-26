const express = require('express');
const router = express.Router();
const db = require('../db');
const { requireAuth } = require('../middleware/auth');
const {
  fetchRecentActivity,
  groupActivities,
  generateSummary,
} = require('../services/github-activity');
const { generateAISummary } = require('../services/ai-summary');

// GET /api/activity?days=1
router.get('/', requireAuth, async (req, res) => {
  const { days = 1 } = req.query;

  try {
    const { rows: users } = await db.query(
      'SELECT access_token, username FROM users WHERE id = $1',
      [req.session.userId]
    );

    if (!users[0]) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { access_token, username } = users[0];

    const activities = await fetchRecentActivity(access_token, username, Number(days));
    console.log(`[Route] Got ${activities.length} activities from service`);

    // Store activities in DB
    for (const activity of activities) {
      await db.query(
        `INSERT INTO activities (user_id, github_event_id, type, repo_name, title, description, branch, url, raw_data, occurred_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         ON CONFLICT (user_id, github_event_id) DO NOTHING`,
        [
          req.session.userId,
          activity.github_event_id,
          activity.type,
          activity.repo_name,
          activity.title,
          activity.description,
          activity.branch,
          activity.url,
          JSON.stringify(activity.raw_data),
          activity.occurred_at,
        ]
      );
    }

    // Generate both summaries
    const grouped = groupActivities(activities);
    const rawSummary = generateSummary(grouped);

    // Try AI summary, fall back to raw if no API key or failure
    const aiSummary = await generateAISummary(activities);

    res.json({
      activities,
      grouped,
      summary: aiSummary || rawSummary,
      rawSummary,
      aiSummary,
      count: activities.length,
    });
  } catch (err) {
    console.error('Error fetching activity:', err.message);
    res.status(500).json({ error: 'Failed to fetch activity' });
  }
});

// GET /api/activity/history?limit=30
router.get('/history', requireAuth, async (req, res) => {
  const { limit = 30 } = req.query;

  try {
    const { rows } = await db.query(
      `SELECT type, repo_name, title, branch, url, occurred_at
       FROM activities
       WHERE user_id = $1
       ORDER BY occurred_at DESC
       LIMIT $2`,
      [req.session.userId, Number(limit)]
    );

    res.json({ activities: rows });
  } catch (err) {
    console.error('Error fetching history:', err.message);
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

module.exports = router;
