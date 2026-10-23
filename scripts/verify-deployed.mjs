import assert from 'node:assert/strict';
const base = process.env.APP_URL;
if (!base) throw new Error('Set APP_URL to the ALB HTTP URL');
const results = [];
const request = (url, options = {}) => fetch(base + url, { ...options, signal: AbortSignal.timeout(15000) });
const health = await request('/api/health');
assert.equal(health.status, 200);
const state = await health.json();
assert.equal(state.database.connected, true);
assert.ok(state.database.responseTimeMs >= 0);
results.push({ test: 'health', status: 200, hostname: state.server.hostname, databaseConnected: true });
const home = await request('/');
assert.equal(home.status, 200);
assert.match(await home.text(), /Cloud Busters/);
results.push({ test: 'frontend HTML', status: 200 });
for (const asset of ['/style.css', '/app.js']) {
  const response = await request(asset);
  assert.equal(response.status, 200);
  assert.ok((await response.text()).length > 100);
  results.push({ test: asset, status: 200 });
}
const user = { name: 'Deployment Verification', email: `deployment-${Date.now()}@example.com` };
const post = body => request('/api/users', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
const created = await post(user);
assert.equal(created.status, 201);
const saved = (await created.json()).user;
assert.equal((await post(user)).status, 409);
assert.equal((await post({})).status, 400);
const listed = await request('/api/users');
assert.equal(listed.status, 200);
assert.ok((await listed.json()).users.some(row => row.id === saved.id));
results.push({ test: 'POST /api/users + persistent GET + duplicate and invalid input', status: 'PASS', createdId: saved.id });
const hosts = new Set();
for (let i = 0; i < 16; i++) {
  const response = await request('/api/health');
  assert.equal(response.status, 200);
  hosts.add((await response.json()).server.hostname);
}
results.push({ test: 'ALB host sampling', hosts: [...hosts] });
console.log(JSON.stringify({ timestamp: new Date().toISOString(), results }, null, 2));
