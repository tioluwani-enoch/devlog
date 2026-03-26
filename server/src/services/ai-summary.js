const axios = require('axios');

/**
 * Generate a smart standup summary using Claude API
 * Takes raw activities and returns a clean, human-readable standup
 */
async function generateAISummary(activities) {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    console.log('[DevLog] No ANTHROPIC_API_KEY set, falling back to raw summary');
    return null;
  }

  // Build a compact representation of activities for the prompt
  const activityText = buildActivityText(activities);

  try {
    const { data } = await axios.post(
      'https://api.anthropic.com/v1/messages',
      {
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: `You are a standup note generator for a software developer. Below is a list of their GitHub activity (commits, PRs, reviews) from their recent work.

Write a clean, concise standup summary that:
- Groups work by project/repo
- Summarizes what was actually done (don't list every commit, describe the work)
- Filters out noise like merge commits, "ran files again", duplicate messages
- Uses bullet points with short, clear descriptions
- Keeps it to something you'd actually say in a 1-2 minute standup
- Uses past tense ("Fixed", "Updated", "Worked on")

Here's the raw activity:

${activityText}

Write the standup summary now. No preamble, just the summary.`,
          },
        ],
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
      }
    );

    const summary = data.content
      .filter((block) => block.type === 'text')
      .map((block) => block.text)
      .join('\n');

    console.log('[DevLog] AI summary generated successfully');
    return summary;
  } catch (err) {
    console.error('[DevLog] AI summary failed:', err.response?.data?.error?.message || err.message);
    return null;
  }
}

/**
 * Build a compact text representation of activities for the AI prompt
 */
function buildActivityText(activities) {
  const byRepo = {};

  for (const a of activities) {
    const repo = a.repo_name.split('/').pop() || a.repo_name;
    if (!byRepo[repo]) byRepo[repo] = [];
    byRepo[repo].push(a);
  }

  const lines = [];

  for (const [repo, items] of Object.entries(byRepo)) {
    lines.push(`Repository: ${repo}`);

    const commits = items.filter((i) => i.type === 'commit');
    const prs = items.filter((i) => i.type === 'pr');
    const reviews = items.filter((i) => i.type === 'review');

    if (commits.length > 0) {
      lines.push(`  Commits (${commits.length}):`);
      // Deduplicate by title to reduce token usage
      const seen = new Set();
      for (const c of commits) {
        if (!seen.has(c.title)) {
          seen.add(c.title);
          lines.push(`    - ${c.title} (branch: ${c.branch || 'main'})`);
        }
      }
    }

    if (prs.length > 0) {
      lines.push(`  Pull Requests:`);
      for (const pr of prs) {
        lines.push(`    - ${pr.raw_data?.action || 'updated'}: ${pr.title}`);
      }
    }

    if (reviews.length > 0) {
      lines.push(`  Reviews:`);
      for (const r of reviews) {
        lines.push(`    - ${r.title}`);
      }
    }

    lines.push('');
  }

  return lines.join('\n');
}

module.exports = { generateAISummary };
