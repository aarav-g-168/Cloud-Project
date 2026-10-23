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
    try {
      await connection.query('SELECT 1');
    } finally {
      connection.release();
    }
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
