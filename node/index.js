require('dotenv').config();
const express = require('express');
const RSSParser = require('rss-parser');

const app = express();
const parser = new RSSParser();
const path = require('path');
const Anthropic = require("@anthropic-ai/sdk");

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

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



async function sendAnthropicMessage(message) {
  try {
    const msg = await anthropic.messages.create({
      model: "claude-3-7-sonnet-20250219",
      max_tokens: 1000,
      temperature: 1,
      system: `Adblock Plus filters consist of two main categories: blocking and cosmetic (element-hiding) rules. Blocking rules use URL-matching syntax to prevent unwanted requests. You write a pattern—using * as a wildcard, ^ as a separator placeholder, and || to anchor at the start of a hostname—then optionally append $-options (e.g. script, image, third-party, domain=…) to limit by resource type or scope. Prepending @@ turns a blocking rule into an exception (whitelist). You can also use literal start/end anchors |…| for exact-URL matches. Comments begin with !.
  Element-hiding (cosmetic) filters target DOM nodes via CSS or XPath. A simple rule looks like example.com##.advert to hide all <.advert> elements on example.com. Use #@# to exempt elements from hiding. For more complex relations you can inject snippet helpers:
    •	override-property-read lets you stub or disable JavaScript globals (e.g. override-property-read Symbol.for noopFunc false).
    •	hide-if-matches-xpath watches for nodes matching an XPath and hides them dynamically.
    •	There are also snippet-type filters (#$#) for custom behaviors or small JS injections.
  Together, these constructs let you precisely block network requests, surgically remove unwanted page elements, and neutralize anti-adblock or tracking scripts.`,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Explain the following Adblock Plus filter rule:
  ${message}
  ` 
            }
          ]
        }
      ]
    });
    const data = msg;
    return data;
//   const response = await fetch(url, {
//     method: 'POST',
//     headers: {
//       'Authorization': `Bearer ${apiKey}`,
//       'Anthropic-Version': '2023-06-01',
//       'Content-Type': 'application/json',
//     },
//     body: JSON.stringify({
//       model: 'claude-3-7-sonnet-20250219',
//       max_tokens: 1024,
//       messages: [
//         { role: 'user', content: `
// Adblock Plus filters consist of two main categories: blocking and cosmetic (element-hiding) rules. Blocking rules use URL-matching syntax to prevent unwanted requests. You write a pattern—using * as a wildcard, ^ as a separator placeholder, and || to anchor at the start of a hostname—then optionally append $-options (e.g. script, image, third-party, domain=…) to limit by resource type or scope. Prepending @@ turns a blocking rule into an exception (whitelist). You can also use literal start/end anchors |…| for exact-URL matches. Comments begin with !.
// Element-hiding (cosmetic) filters target DOM nodes via CSS or XPath. A simple rule looks like example.com##.advert to hide all <.advert> elements on example.com. Use #@# to exempt elements from hiding. For more complex relations you can inject snippet helpers:
// 	•	override-property-read lets you stub or disable JavaScript globals (e.g. override-property-read Symbol.for noopFunc false).
// 	•	hide-if-matches-xpath watches for nodes matching an XPath and hides them dynamically.
// 	•	There are also snippet-type filters (#$#) for custom behaviors or small JS injections.
// Together, these constructs let you precisely block network requests, surgically remove unwanted page elements, and neutralize anti-adblock or tracking scripts.

// Explain the following Adblock Plus filter rule:
// ${message}
// ` }]
//     })
//   });

  } catch(err){
    throw new Error(`Anthropic API error: ${err}`);
  }


}

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Endpoint: GET /anthropic - invoke the Claude API with a fixed "Hello, world" message
app.get('/anthropic', async (req, res) => {
  try {
    const result = await sendAnthropicMessage(req.query.message);
    res.json(result);
  } catch (err) {
    console.error('Anthropic API error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`RSS-fetcher listening on http://localhost:${PORT}`);
});


