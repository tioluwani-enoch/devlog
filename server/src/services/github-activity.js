const axios = require('axios');

const GITHUB_API = 'https://api.github.com';

function createClient(accessToken) {
  return axios.create({
    baseURL: GITHUB_API,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/vnd.github.v3+json',
    },
  });
}

async function fetchRecentActivity(accessToken, username, daysBack = 1) {
  const client = createClient(accessToken);
  const since = new Date();
  since.setDate(since.getDate() - daysBack);
  since.setHours(0, 0, 0, 0);

  const activities = [];
  const seenShas = new Set();
  const repoCommitCache = {};

  try {
    const { data: events } = await client.get(
      `/users/${username}/events?per_page=100`
    );

    console.log(`[DevLog] Fetched ${events.length} events, filtering since ${since.toISOString()}`);

    for (const event of events) {
      const eventDate = new Date(event.created_at);
      if (eventDate < since) continue;

      if (event.type === 'PushEvent') {
        let commits = event.payload.commits || [];
        const repoName = event.repo.name;
        const branch = event.payload.ref?.replace('refs/heads/', '') || 'main';

        // Fallback: fetch from repo API if payload is empty (cached per repo:branch)
        if (commits.length === 0) {
          const cacheKey = `${repoName}:${branch}`;

          if (!repoCommitCache[cacheKey]) {
            try {
              const { data: repoCommits } = await client.get(
                `/repos/${repoName}/commits?sha=${branch}&since=${since.toISOString()}&per_page=100`
              );
              repoCommitCache[cacheKey] = repoCommits.map(c => ({
                sha: c.sha,
                message: c.commit.message,
              }));
              console.log(`[DevLog] Fetched ${repoCommitCache[cacheKey].length} commits from repo API for ${cacheKey}`);
            } catch (err) {
              console.log(`[DevLog] Could not fetch commits from repo API: ${err.message}`);
              repoCommitCache[cacheKey] = [];
            }
          }
          commits = repoCommitCache[cacheKey];
        }

        for (const commit of commits) {
          if (seenShas.has(commit.sha)) continue;
          seenShas.add(commit.sha);

          activities.push({
            type: 'commit',
            github_event_id: `commit-${commit.sha}`,
            repo_name: repoName,
            title: commit.message.split('\n')[0],
            description: commit.message,
            branch,
            url: `https://github.com/${repoName}/commit/${commit.sha}`,
            occurred_at: event.created_at,
            raw_data: commit,
          });
        }

        // Last resort
        if (commits.length === 0) {
          const pushId = `push-${event.id}`;
          if (!seenShas.has(pushId)) {
            seenShas.add(pushId);
            activities.push({
              type: 'commit',
              github_event_id: pushId,
              repo_name: repoName,
              title: `Pushed to ${branch}`,
              description: `Push event with ${event.payload.size || 0} commits`,
              branch,
              url: `https://github.com/${repoName}`,
              occurred_at: event.created_at,
              raw_data: event.payload,
            });
          }
        }
      }

      if (event.type === 'PullRequestEvent') {
        const pr = event.payload.pull_request;
        activities.push({
          type: 'pr',
          github_event_id: `pr-${pr.id}`,
          repo_name: event.repo.name,
          title: pr.title,
          description: pr.body?.slice(0, 500),
          branch: pr.head?.ref,
          url: pr.html_url,
          occurred_at: event.created_at,
          raw_data: { action: event.payload.action, number: pr.number },
        });
      }

      if (event.type === 'PullRequestReviewEvent') {
        const review = event.payload.review;
        activities.push({
          type: 'review',
          github_event_id: `review-${review.id}`,
          repo_name: event.repo.name,
          title: `Review on PR #${event.payload.pull_request.number}: ${event.payload.pull_request.title}`,
          description: review.body?.slice(0, 500),
          url: review.html_url,
          occurred_at: event.created_at,
          raw_data: { state: review.state, pr_number: event.payload.pull_request.number },
        });
      }
    }
  } catch (err) {
    console.error('Error fetching GitHub events:', err.message);
    throw err;
  }

  console.log(`[DevLog] Returning ${activities.length} deduplicated activities`);
  return activities;
}

function groupActivities(activities) {
  const grouped = {};

  for (const activity of activities) {
    const repo = activity.repo_name;
    if (!grouped[repo]) {
      grouped[repo] = { commits: [], prs: [], reviews: [] };
    }

    if (activity.type === 'commit') grouped[repo].commits.push(activity);
    if (activity.type === 'pr') grouped[repo].prs.push(activity);
    if (activity.type === 'review') grouped[repo].reviews.push(activity);
  }

  return grouped;
}

function generateSummary(grouped) {
  const lines = [];
  const repos = Object.keys(grouped);

  if (repos.length === 0) {
    return 'No activity found for this period.';
  }

  for (const repo of repos) {
    const { commits, prs, reviews } = grouped[repo];
    const shortRepo = repo.split('/').pop();
    lines.push(`**${shortRepo}**`);

    if (commits.length > 0) {
      const byBranch = {};
      for (const c of commits) {
        const branch = c.branch || 'unknown';
        if (!byBranch[branch]) byBranch[branch] = [];
        byBranch[branch].push(c);
      }

      for (const [branch, branchCommits] of Object.entries(byBranch)) {
        if (branchCommits.length === 1) {
          lines.push(`- Pushed to \`${branch}\`: ${branchCommits[0].title}`);
        } else {
          lines.push(`- Pushed ${branchCommits.length} commits to \`${branch}\`:`);
          for (const c of branchCommits) {
            lines.push(`  - ${c.title}`);
          }
        }
      }
    }

    if (prs.length > 0) {
      for (const pr of prs) {
        const action = pr.raw_data?.action || 'updated';
        lines.push(`- ${action === 'opened' ? 'Opened' : 'Updated'} PR: ${pr.title}`);
      }
    }

    if (reviews.length > 0) {
      for (const review of reviews) {
        const state = review.raw_data?.state || 'reviewed';
        const stateLabel =
          state === 'approved' ? 'Approved' :
          state === 'changes_requested' ? 'Requested changes on' :
          'Reviewed';
        lines.push(`- ${stateLabel}: ${review.title}`);
      }
    }

    lines.push('');
  }

  return lines.join('\n').trim();
}

module.exports = { fetchRecentActivity, groupActivities, generateSummary };
