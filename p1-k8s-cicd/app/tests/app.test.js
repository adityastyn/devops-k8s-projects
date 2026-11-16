'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { createServer, EVENTS } = require('../server');

let server, base;
test.before(async () => { server = createServer(); await new Promise(r => server.listen(0, r)); base = `http://127.0.0.1:${server.address().port}`; });
test.after(() => server.close());

test('health endpoint is UP', async () => {
  const body = await (await fetch(`${base}/health`)).json();
  assert.strictEqual(body.status, 'UP');
});
test('events API returns all events', async () => {
  const list = await (await fetch(`${base}/api/events`)).json();
  assert.strictEqual(list.length, EVENTS.length);
});
test('home page shows the pod name', async () => {
  const html = await (await fetch(`${base}/`)).text();
  assert.match(html, /Served by Kubernetes pod/);
});
test('unknown route returns 404', async () => {
  assert.strictEqual((await fetch(`${base}/nope`)).status, 404);
});
