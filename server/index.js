require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs');
const healthRoutes = require('./routes/health');
const userRoutes = require('./routes/users');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.disable('x-powered-by');
app.use((req, res, next) => {
  const started = Date.now();
  res.on('finish', () => console.log(JSON.stringify({
    event: 'request', method: req.method, path: req.path,
    status: res.statusCode, durationMs: Date.now() - started
  })));
  next();
});
app.use(express.json({ limit: '16kb' }));
app.use(express.urlencoded({ extended: false, limit: '16kb' }));

const template = fs.readFileSync(path.join(__dirname, '../public/index.html'), 'utf8');
const assetBase = (process.env.STATIC_ASSET_BASE || '').replace(/\/$/, '');
if (assetBase && !/^https:\/\/[a-z0-9.-]+(?:\/[a-z0-9/_-]*)?$/i.test(assetBase)) {
  throw new Error('STATIC_ASSET_BASE must be an HTTPS URL without query parameters');
}
const home = template.replace('href="style.css"', `href="${assetBase}/style.css"`)
  .replace('src="app.js"', `src="${assetBase}/app.js"`);
app.get(['/', '/index.html'], (req, res) => res.type('html').send(home));

// Serve static files from public directory
app.use(express.static(path.join(__dirname, '../public')));

// API Routes
app.use('/', healthRoutes);
app.use('/', userRoutes);

// Frontend route - serve index.html for root

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'Invalid JSON' });
  if (err.type === 'entity.too.large') return res.status(413).json({ error: 'Request too large' });
  console.error('Request failed:', err.code || err.name);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
