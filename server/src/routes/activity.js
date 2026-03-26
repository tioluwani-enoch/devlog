const express = require("express");
const router = express.Router();
const db = require("../db");
const { requireAuth } = require("../middleware/auth");
const {
  fetchRecentActivity,
  groupActivities,
  generateSummary,
} = require("../services/github-activity");

// GET /api/activity?date=2024-01-15&days=1
// Fetches activity from GitHub, stores it, returns grouped + summary
router.get("/", requireAuth, async (req, res) => {
  const { days = 1 } = req.query;

  try {
    // Get user's access token and username
    const { rows: users } = await db.query(
      "SELECT access_token, username FROM users WHERE id = $1",
      [req.session.userId],
    );

    if (!users[0]) {
      return res.status(404).json({ error: "User not found" });
    }

    const { access_token, username } = users[0];

    // Fetch from GitHub
    const activities = await fetchRecentActivity(
      access_token,
      username,
      Number(days),
    );
    console.log(`[Route] Got ${activities.length} activities from service`);

    // Store activities in DB (upsert to avoid duplicates)
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
        ],
      );
    }

    // Group and summarize
    const grouped = groupActivities(activities);
    const summary = generateSummary(grouped);

    res.json({ activities, grouped, summary, count: activities.length });
  } catch (err) {
    console.error("Error fetching activity:", err.message);
    res.status(500).json({ error: "Failed to fetch activity" });
  }
});

// GET /api/activity/history?limit=30
// Returns stored activities from the database
router.get("/history", requireAuth, async (req, res) => {
  const { limit = 30 } = req.query;

  try {
    const { rows } = await db.query(
      `SELECT type, repo_name, title, branch, url, occurred_at
       FROM activities
       WHERE user_id = $1
       ORDER BY occurred_at DESC
       LIMIT $2`,
      [req.session.userId, Number(limit)],
    );

    res.json({ activities: rows });
  } catch (err) {
    console.error("Error fetching history:", err.message);
    res.status(500).json({ error: "Failed to fetch history" });
  }
});

module.exports = router;
