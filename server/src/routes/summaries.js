const express = require('express');
const router = express.Router();
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

// POST /api/summaries — save or update a summary for a given date
router.post('/', requireAuth, async (req, res) => {
  const { date, content } = req.body;

  if (!date || !content) {
    return res.status(400).json({ error: 'Date and content are required' });
  }

  try {
    const { rows } = await db.query(
      `INSERT INTO summaries (user_id, summary_date, content)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, summary_date)
       DO UPDATE SET
         content = EXCLUDED.content,
         is_edited = TRUE,
         updated_at = NOW()
       RETURNING *`,
      [req.session.userId, date, content]
    );

    res.json({ summary: rows[0] });
  } catch (err) {
    console.error('Error saving summary:', err.message);
    res.status(500).json({ error: 'Failed to save summary' });
  }
});

// GET /api/summaries?limit=14 — list recent summaries
router.get('/', requireAuth, async (req, res) => {
  const { limit = 14 } = req.query;

  try {
    const { rows } = await db.query(
      `SELECT id, summary_date, content, is_edited, created_at
       FROM summaries
       WHERE user_id = $1
       ORDER BY summary_date DESC
       LIMIT $2`,
      [req.session.userId, Number(limit)]
    );

    res.json({ summaries: rows });
  } catch (err) {
    console.error('Error fetching summaries:', err.message);
    res.status(500).json({ error: 'Failed to fetch summaries' });
  }
});

// GET /api/summaries/:date — get summary for a specific date
router.get('/:date', requireAuth, async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT id, summary_date, content, is_edited, created_at
       FROM summaries
       WHERE user_id = $1 AND summary_date = $2`,
      [req.session.userId, req.params.date]
    );

    res.json({ summary: rows[0] || null });
  } catch (err) {
    console.error('Error fetching summary:', err.message);
    res.status(500).json({ error: 'Failed to fetch summary' });
  }
});

module.exports = router;
