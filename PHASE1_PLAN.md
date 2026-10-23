# Phase 1 Plan: Basic Working Application

## Objective
Create a simple, working three-tier application locally that demonstrates:
- Frontend (HTML/CSS/JS) → Backend API (Node.js/Express) → Database (MySQL)
- Core API endpoints: GET /api/health, GET /api/users, POST /api/users
- Health endpoint provides useful status info (app status, DB connectivity, instance identity)
- All layers connected and functional locally
- Ready for deployment to EC2 and integration with RDS

## Application Requirements
- **Frontend**: Single-page HTML with:
  - Home/status page showing app health
  - Form to add users (name, email)
  - List/view users from database
  - Clean, simple styling (no frameworks)
- **Backend**: Node.js + Express with:
  - GET /api/health - returns JSON with status, timestamp, DB connectivity, server info
  - GET /api/users - returns all users from database
  - POST /api/users - adds new user, returns created user
  - Database connection via MySQL2 (promise-based)
  - Environment variables for DB config (no hard-coded credentials)
  - Error handling and logging
- **Database**: MySQL with `users` table (id, name, email, created_at)

## Exact Files to Create

### Project Structure
```
CloudBusters/
├── CAD-review1.pdf              (existing - proposal)
├── PROJECT_UNDERSTANDING.md     (existing - updated)
├── PHASE1_PLAN.md              (this file)
├── package.json                (Node.js dependencies)
├── .gitignore                  (exclude node_modules, .env, etc.)
├── .env.example                (template for environment variables)
├── README.md                   (project documentation)
├── server/
│   ├── index.js                (Express app entry point)
│   ├── db.js                   (Database connection & queries)
│   ├── routes/
│   │   ├── health.js           (GET /api/health)
│   │   └── users.js            (GET/POST /api/users)
│   └── config/
│       └── database.js         (DB config from env vars)
├── public/
│   ├── index.html              (Frontend HTML)
│   ├── style.css               (Frontend CSS)
│   └── app.js                  (Frontend JavaScript)
└── scripts/
    └── init-db.sql             (SQL to create users table)
```

## File Contents Specification

### 1. package.json
```json
{
  "name": "cloudbusters-app",
  "version": "1.0.0",
  "description": "Scalable Multi-Tier Web Application - Cloud Busters",
  "main": "server/index.js",
  "scripts": {
    "start": "node server/index.js",
    "dev": "node server/index.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "mysql2": "^3.6.0",
    "dotenv": "^16.3.1"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
```

### 2. .gitignore
```
node_modules/
.env
*.log
.DS_Store
coverage/
.nyc_output/
```

### 3. .env.example
```
# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=cloudapp

# Server Configuration
PORT=3000
NODE_ENV=development
```

### 4. server/config/database.js
```javascript
require('dotenv').config();

module.exports = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'cloudapp',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};
```

### 5. server/db.js
```javascript
const mysql = require('mysql2/promise');
const dbConfig = require('./config/database');

let pool;

async function getPool() {
  if (!pool) {
    pool = mysql.createPool(dbConfig);
  }
  return pool;
}

async function query(sql, params) {
  const pool = await getPool();
  const [rows] = await pool.execute(sql, params);
  return rows;
}

async function testConnection() {
  try {
    const pool = await getPool();
    const connection = await pool.getConnection();
    connection.release();
    return true;
  } catch (error) {
    console.error('Database connection failed:', error.message);
    return false;
  }
}

module.exports = {
  query,
  testConnection,
  getPool
};
```

### 6. server/routes/health.js
```javascript
const express = require('express');
const router = express.Router();
const db = require('../db');
const os = require('os');

router.get('/api/health', async (req, res) => {
  const startTime = Date.now();
  const dbConnected = await db.testConnection();
  const responseTime = Date.now() - startTime;

  const health = {
    status: dbConnected ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: {
      connected: dbConnected,
      responseTimeMs: responseTime
    },
    server: {
      hostname: os.hostname(),
      platform: os.platform(),
      arch: os.arch(),
      nodeVersion: process.version,
      memoryUsage: process.memoryUsage(),
      cpus: os.cpus().length
    },
    environment: process.env.NODE_ENV || 'development'
  };

  const statusCode = dbConnected ? 200 : 503;
  res.status(statusCode).json(health);
});

module.exports = router;
```

### 7. server/routes/users.js
```javascript
const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/users - Get all users
router.get('/api/users', async (req, res) => {
  try {
    const users = await db.query(
      'SELECT id, name, email, created_at FROM users ORDER BY created_at DESC'
    );
    res.json({ users, count: users.length });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// POST /api/users - Create new user
router.post('/api/users', async (req, res) => {
  try {
    const { name, email } = req.body;

    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required' });
    }

    // Simple email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    const result = await db.query(
      'INSERT INTO users (name, email) VALUES (?, ?)',
      [name, email]
    );

    const newUser = {
      id: result.insertId,
      name,
      email,
      created_at: new Date().toISOString()
    };

    res.status(201).json({ user: newUser });
  } catch (error) {
    console.error('Error creating user:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Email already exists' });
    }
    res.status(500).json({ error: 'Failed to create user' });
  }
});

module.exports = router;
```

### 8. server/index.js
```javascript
require('dotenv').config();
const express = require('express');
const path = require('path');
const healthRoutes = require('./routes/health');
const userRoutes = require('./routes/users');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from public directory
app.use(express.static(path.join(__dirname, '../public')));

// API Routes
app.use('/', healthRoutes);
app.use('/', userRoutes);

// Frontend route - serve index.html for root
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
```

### 9. public/index.html
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Cloud Busters - Scalable Multi-Tier Web App</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <div class="container">
    <header>
      <h1>Cloud Busters</h1>
      <p class="subtitle">Scalable Multi-Tier Web Application</p>
    </header>

    <main>
      <!-- Health Status Section -->
      <section class="card">
        <h2>Application Health</h2>
        <div id="health-status" class="loading">Loading health status...</div>
        <button id="refresh-health" class="btn btn-secondary">Refresh</button>
      </section>

      <!-- Add User Section -->
      <section class="card">
        <h2>Add User</h2>
        <form id="user-form">
          <div class="form-group">
            <label for="name">Name</label>
            <input type="text" id="name" name="name" required placeholder="John Doe">
          </div>
          <div class="form-group">
            <label for="email">Email</label>
            <input type="email" id="email" name="email" required placeholder="john@example.com">
          </div>
          <button type="submit" class="btn btn-primary">Add User</button>
        </form>
        <div id="form-message"></div>
      </section>

      <!-- Users List Section -->
      <section class="card">
        <h2>Users</h2>
        <div class="table-container">
          <table id="users-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Created At</th>
              </tr>
            </thead>
            <tbody id="users-body">
              <tr><td colspan="4" class="loading">Loading users...</td></tr>
            </tbody>
          </table>
        </div>
        <button id="refresh-users" class="btn btn-secondary">Refresh Users</button>
      </section>
    </main>

    <footer>
      <p>Cloud Architecture Design Course Project - Team Cloud Busters</p>
    </footer>
  </div>
  <script src="app.js"></script>
</body>
</html>
```

### 10. public/style.css
```css
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
  background-color: #f5f5f5;
  color: #333;
  line-height: 1.6;
}

.container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

header {
  text-align: center;
  margin-bottom: 30px;
  padding: 20px 0;
}

header h1 {
  color: #2c3e50;
  font-size: 2.5rem;
  margin-bottom: 5px;
}

.subtitle {
  color: #7f8c8d;
  font-size: 1.1rem;
}

.card {
  background: white;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.card h2 {
  color: #2c3e50;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px solid #eee;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: 500;
}

.form-group input {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
}

.form-group input:focus {
  outline: none;
  border-color: #3498db;
  box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.2);
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  transition: background-color 0.2s;
}

.btn-primary {
  background-color: #3498db;
  color: white;
}

.btn-primary:hover {
  background-color: #2980b9;
}

.btn-secondary {
  background-color: #95a5a6;
  color: white;
}

.btn-secondary:hover {
  background-color: #7f8c8d;
}

.table-container {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th, td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #eee;
}

th {
  background-color: #f8f9fa;
  font-weight: 600;
  color: #2c3e50;
}

tr:hover {
  background-color: #f8f9fa;
}

.loading {
  color: #7f8c8d;
  font-style: italic;
  text-align: center;
  padding: 20px;
}

#form-message {
  margin-top: 10px;
  padding: 10px;
  border-radius: 4px;
  display: none;
}

#form-message.success {
  display: block;
  background-color: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

#form-message.error {
  display: block;
  background-color: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

.health-status {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  margin-top: 10px;
}

.health-item {
  flex: 1;
  min-width: 200px;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 4px;
}

.health-item h3 {
  font-size: 0.9rem;
  color: #7f8c8d;
  margin-bottom: 5px;
}

.health-item .value {
  font-size: 1.1rem;
  font-weight: 500;
  color: #2c3e50;
}

.health-status-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 500;
}

.health-status-badge.healthy {
  background-color: #d4edda;
  color: #155724;
}

.health-status-badge.degraded {
  background-color: #fff3cd;
  color: #856404;
}

footer {
  text-align: center;
  padding: 20px;
  color: #7f8c8d;
  font-size: 0.9rem;
}
```

### 11. public/app.js
```javascript
const API_BASE = '/api';

// DOM Elements
const healthStatus = document.getElementById('health-status');
const refreshHealthBtn = document.getElementById('refresh-health');
const userForm = document.getElementById('user-form');
const formMessage = document.getElementById('form-message');
const usersBody = document.getElementById('users-body');
const refreshUsersBtn = document.getElementById('refresh-users');

// Health Check
async function fetchHealth() {
  try {
    healthStatus.innerHTML = '<div class="loading">Checking health...</div>';
    const response = await fetch(`${API_BASE}/health`);
    const data = await response.json();
    renderHealth(data);
  } catch (error) {
    healthStatus.innerHTML = `<div class="health-status-badge degraded">Error: ${error.message}</div>`;
  }
}

function renderHealth(data) {
  const badgeClass = data.status === 'healthy' ? 'healthy' : 'degraded';
  healthStatus.innerHTML = `
    <div class="health-status">
      <div class="health-item">
        <h3>Overall Status</h3>
        <span class="health-status-badge ${badgeClass}">${data.status.toUpperCase()}</span>
      </div>
      <div class="health-item">
        <h3>Database</h3>
        <span class="value">${data.database.connected ? 'Connected' : 'Disconnected'}</span>
      </div>
      <div class="health-item">
        <h3>DB Response Time</h3>
        <span class="value">${data.database.responseTimeMs}ms</span>
      </div>
      <div class="health-item">
        <h3>Server</h3>
        <span class="value">${data.server.hostname}</span>
      </div>
      <div class="health-item">
        <h3>Uptime</h3>
        <span class="value">${Math.floor(data.uptime)}s</span>
      </div>
      <div class="health-item">
        <h3>Node.js</h3>
        <span class="value">${data.server.nodeVersion}</span>
      </div>
    </div>
  `;
}

// Users
async function fetchUsers() {
  try {
    usersBody.innerHTML = '<tr><td colspan="4" class="loading">Loading users...</td></tr>';
    const response = await fetch(`${API_BASE}/users`);
    const data = await response.json();
    renderUsers(data.users);
  } catch (error) {
    usersBody.innerHTML = `<tr><td colspan="4" class="loading">Error: ${error.message}</td></tr>`;
  }
}

function renderUsers(users) {
  if (users.length === 0) {
    usersBody.innerHTML = '<tr><td colspan="4" class="loading">No users yet</td></tr>';
    return;
  }
  usersBody.innerHTML = users.map(user => `
    <tr>
      <td>${user.id}</td>
      <td>${escapeHtml(user.name)}</td>
      <td>${escapeHtml(user.email)}</td>
      <td>${formatDate(user.created_at)}</td>
    </tr>
  `).join('');
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleString();
}

// Add User
userForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  formMessage.style.display = 'none';
  
  const name = document.getElementById('name').value.trim();
  const email = document.getElementById('email').value.trim();

  try {
    const response = await fetch(`${API_BASE}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email })
    });
    const data = await response.json();

    if (response.ok) {
      showMessage('User added successfully!', 'success');
      userForm.reset();
      fetchUsers();
    } else {
      showMessage(data.error || 'Failed to add user', 'error');
    }
  } catch (error) {
    showMessage(`Error: ${error.message}`, 'error');
  }
});

function showMessage(message, type) {
  formMessage.textContent = message;
  formMessage.className = type;
  formMessage.style.display = 'block';
}

// Event Listeners
refreshHealthBtn.addEventListener('click', fetchHealth);
refreshUsersBtn.addEventListener('click', fetchUsers);

// Initial Load
fetchHealth();
fetchUsers();
```

### 12. scripts/init-db.sql
```sql
-- Initialize database for Cloud Busters application
-- Run this on your MySQL/RDS instance

CREATE DATABASE IF NOT EXISTS cloudapp;
USE cloudapp;

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sample data for testing
INSERT IGNORE INTO users (name, email) VALUES 
  ('Alice Johnson', 'alice@example.com'),
  ('Bob Smith', 'bob@example.com'),
  ('Carol Williams', 'carol@example.com');
```

### 13. README.md
```markdown
# Cloud Busters - Scalable Multi-Tier Web Application

Cloud Architecture Design course project demonstrating a production-style, scalable, highly available three-tier web application on AWS.

## Architecture

```
Users
      ↓
Application Load Balancer
      ↓
Target Group
      ↓
EC2 instances (Auto Scaling Group)
      ↓
Amazon RDS MySQL
```

Supporting: VPC, Security Groups, IAM, CloudWatch, S3, CloudFront

## Tech Stack

- **Frontend**: HTML, CSS, JavaScript (vanilla)
- **Backend**: Node.js + Express
- **Database**: MySQL (Amazon RDS)
- **Infrastructure**: AWS (EC2, ALB, ASG, RDS, VPC, S3, CloudFront, CloudWatch, IAM)

## Local Development

### Prerequisites
- Node.js 18+
- MySQL 8.0+ (local or remote)

### Setup
```bash
# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your database credentials

# Initialize database
mysql -u root -p < scripts/init-db.sql

# Start server
npm start
```

Server runs at `http://localhost:3000`

### API Endpoints
- `GET /api/health` - Health check with DB connectivity
- `GET /api/users` - List all users
- `POST /api/users` - Create user (JSON: name, email)

## AWS Deployment
See [DEPLOYMENT.md](DEPLOYMENT.md) for step-by-step AWS deployment guide.

## Project Structure
```
├── server/          # Backend API
│   ├── index.js     # Express app entry
│   ├── db.js        # Database connection
│   ├── routes/      # API routes
│   └── config/      # Configuration
├── public/          # Frontend assets
│   ├── index.html
│   ├── style.css
│   └── app.js
├── scripts/         # Database scripts
└── package.json
```

## Team
**Cloud Busters** - Cloud Architecture Design Course
```

## Implementation Steps

1. Create project directory structure
2. Create `package.json` and install dependencies
3. Create `.gitignore` and `.env.example`
4. Create server configuration and database modules
5. Create API routes (health, users)
6. Create Express server entry point
7. Create frontend files (HTML, CSS, JS)
8. Create database initialization script
9. Create README.md
10. Test locally with local MySQL
11. Verify all endpoints work

## Testing Checklist (Local)
- [ ] `npm install` completes without errors
- [ ] `npm start` starts server on port 3000
- [ ] `GET /api/health` returns JSON with status, DB connectivity, server info
- [ ] `GET /api/users` returns array of users
- [ ] `POST /api/users` creates new user and returns it
- [ ] Frontend loads at `http://localhost:3000`
- [ ] Frontend health check displays correctly
- [ ] Frontend can add users and display them
- [ ] No hard-coded credentials in source code

## Next Phase
Once Phase 1 is complete and tested locally, we'll proceed to Phase 2: RDS Configuration in AWS.