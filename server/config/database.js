require('dotenv').config();

module.exports = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'cloudapp',
  waitForConnections: true,
  connectTimeout: 5000,
  connectionLimit: 10,
  queueLimit: 0
};
