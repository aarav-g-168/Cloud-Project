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
    console.error('Error fetching users:', error.code || error.name);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// POST /api/users - Create new user
router.post('/api/users', async (req, res) => {
  try {
    const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
    const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';

    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required' });
    }
    if (name.length > 255 || email.length > 255) {
      return res.status(400).json({ error: 'Name and email must be at most 255 characters' });
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
    console.error('Error creating user:', error.code || error.name);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Email already exists' });
    }
    res.status(500).json({ error: 'Failed to create user' });
  }
});

module.exports = router;
