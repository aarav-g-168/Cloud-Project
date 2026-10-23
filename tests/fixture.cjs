const dbPath = require.resolve('../server/db');
const users = [];
require.cache[dbPath] = { id: dbPath, filename: dbPath, loaded: true, exports: {
  testConnection: async () => process.env.TEST_DB_DOWN !== '1',
  query: async (sql, params) => {
    if (sql.startsWith('SELECT')) return users;
    if (users.some(user => user.email === params[1])) {
      const error = new Error('Duplicate'); error.code = 'ER_DUP_ENTRY'; throw error;
    }
    const user = { id: users.length + 1, name: params[0], email: params[1], created_at: new Date().toISOString() };
    users.push(user);
    return { insertId: user.id };
  }
}};
require('../server/index');
