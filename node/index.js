const express = require('express');
const RSSParser = require('rss-parser');
const fetch = require('node-fetch');

const app = express();
const parser = new RSSParser();
const path = require('path');

// Serve files from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));

// Simple endpoint: GET /rss?url=<feed_url>
app.get('/rss', async (req, res) => {
  const feedUrl = req.query.url;
  const titleFilter = req.query.title; // Optional title filter
  // Support multiple comma-separated title filters
  const titleFilters = titleFilter
    ? titleFilter.split(',').map(t => t.trim()).filter(t => t)
    : [];
  if (!feedUrl) {
    return res.status(400).json({ error: 'Missing URL parameter' });
  }

  try {
    const feed = await parser.parseURL(feedUrl);
    // If title filters are provided, only include items whose title contains any filter
    let items = feed.items;
    if (titleFilters.length) {
      items = items.filter(item => titleFilters.some(filter => item.title.toLowerCase().includes(filter.toLowerCase())));
    }
    // Return the feed as JSON
    res.json({
      title: feed.title,
      link: feed.link,
      items: items.map(item => ({
        title:       item.title,
        link:        item.link,
        pubDate:     item.pubDate,
        content:     item.content,
        contentSnippet: item.contentSnippet,
      }))
    });
  } catch (err) {
    console.error('Failed to fetch RSS:', err.message);
    res.status(500).json({ error: 'Failed to fetch RSS feed' });
  }
});

// Endpoint: GET /diff?url=<gitlab_commit_url>
app.get('/diff', async (req, res) => {
  const commitUrl = req.query.url;
  if (!commitUrl) {
    return res.status(400).json({ error: 'Missing url parameter' });
  }
  try {
    // Parse the GitLab commit URL to extract project path and SHA
    const parsed = new URL(commitUrl);
    const parts = parsed.pathname.split('/-/commit/');
    if (parts.length !== 2) {
      return res.status(400).json({ error: 'Invalid GitLab commit URL' });
    }
    const projectPath = parts[0].slice(1); // remove leading slash
    const commitSha = parts[1];
    const projectId = encodeURIComponent(projectPath);
    const apiUrl = `https://gitlab.com/api/v4/projects/${projectId}/repository/commits/${commitSha}/diff`;
    
    // Fetch the diff from GitLab API
    const response = await fetch(apiUrl);
    if (!response.ok) {
      return res.status(response.status).json({ error: 'Failed to fetch diff from GitLab API' });
    }
    const diff = await response.json();
    res.json({ project: projectPath, commit: commitSha, diffs: diff });
  } catch (err) {
    console.error('Error fetching GitLab diff:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`RSS-fetcher listening on http://localhost:${PORT}`);
});
