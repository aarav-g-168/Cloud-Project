const { test } = require('node:test');
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const path = require('node:path');

async function withServer(environment, check) {
  const port = 35000 + Math.floor(Math.random() * 20000);
  const child = spawn(process.execPath, [path.join(__dirname, 'fixture.cjs')], {
    env: { ...process.env, PORT: String(port), STATIC_ASSET_BASE: '', ...environment }, stdio: 'ignore'
  });
  const base = `http://127.0.0.1:${port}`;
  try {
    let ready = false;
    for (let i = 0; i < 60; i++) {
      try { await fetch(base); ready = true; break; } catch { await new Promise(r => setTimeout(r, 50)); }
    }
    assert.ok(ready, 'HTTP server started');
    await check(base);
  } finally {
    child.kill();
    if (child.exitCode === null) await new Promise(r => child.once('exit', r));
  }
}

test('HTTP application: health, CRUD, validation, frontend and assets with mock database', async () => {
  await withServer({}, async base => {
    const health = await fetch(`${base}/api/health`);
    assert.equal(health.status, 200);
    const data = await health.json();
    assert.equal(data.database.connected, true);
    assert.ok(data.database.responseTimeMs >= 0);
    const post = body => fetch(`${base}/api/users`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    assert.equal((await post({})).status, 400);
    assert.equal((await post({ name: {}, email: 'x@example.com' })).status, 400);
    assert.equal((await post({ name: 'x', email: 'bad' })).status, 400);
    assert.equal((await post({ name: 'x'.repeat(256), email: 'x@example.com' })).status, 400);
    assert.equal((await post({ name: ' Test ', email: 'TEST@EXAMPLE.COM' })).status, 201);
    assert.equal((await post({ name: 'Test', email: 'test@example.com' })).status, 409);
    const list = await (await fetch(`${base}/api/users`)).json();
    assert.equal(list.count, 1);
    assert.equal(list.users[0].name, 'Test');
    assert.equal(list.users[0].email, 'test@example.com');
    assert.match(await (await fetch(base)).text(), /href="\/style.css"/);
    for (const file of ['/style.css', '/app.js']) assert.equal((await fetch(base + file)).status, 200);
    assert.equal((await fetch(base + '/missing')).status, 404);
    assert.equal((await fetch(base + '/api/users', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{' })).status, 400);
  });
});

test('health returns 503 when database unavailable', async () => {
  await withServer({ TEST_DB_DOWN: '1' }, async base => {
    const result = await fetch(base + '/api/health');
    assert.equal(result.status, 503);
    assert.equal((await result.json()).database.connected, false);
  });
});

test('frontend points to HTTPS CDN while API stays same origin', async () => {
  await withServer({ STATIC_ASSET_BASE: 'https://example.cloudfront.net/assets' }, async base => {
    const html = await (await fetch(base)).text();
    assert.match(html, /https:\/\/example.cloudfront.net\/assets\/style.css/);
    assert.match(html, /https:\/\/example.cloudfront.net\/assets\/app.js/);
  });
});
