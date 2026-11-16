'use strict';
const test = require('node:test');
const assert = require('node:assert');
process.env.API_KEY = 'test-key-not-a-real-secret';
process.env.RATE_LIMIT = '30';
const { createServer, maskPhone, maskAadhaar } = require('../server');

let server, base;
const KEY = { 'X-API-Key': process.env.API_KEY };
test.before(async () => { server = createServer(); await new Promise(r => server.listen(0, r)); base = `http://127.0.0.1:${server.address().port}`; });
test.after(() => server.close());

test('health endpoint is public', async () => {
  assert.strictEqual((await fetch(`${base}/health`)).status, 200);
});
test('patient API rejects requests without a key', async () => {
  assert.strictEqual((await fetch(`${base}/api/patients`)).status, 401);
});
test('patient API rejects a wrong key', async () => {
  assert.strictEqual((await fetch(`${base}/api/patients`, { headers: { 'X-API-Key': 'wrong' } })).status, 401);
});
test('patient data is masked', async () => {
  const list = await (await fetch(`${base}/api/patients`, { headers: KEY })).json();
  assert.ok(list.length > 0);
  for (const p of list) {
    assert.match(p.phone, /^\*{6}\d{4}$/);
    assert.match(p.aadhaar, /^XXXX-XXXX-\d{4}$/);
  }
});
test('invalid patient id is rejected', async () => {
  assert.strictEqual((await fetch(`${base}/api/patients/1%20OR%201=1`, { headers: KEY })).status, 400);
});
test('security headers are present', async () => {
  const r = await fetch(`${base}/`);
  assert.match(r.headers.get('content-security-policy'), /default-src 'self'/);
  assert.strictEqual(r.headers.get('x-frame-options'), 'DENY');
  assert.strictEqual(r.headers.get('x-content-type-options'), 'nosniff');
});
test('only GET is allowed', async () => {
  assert.strictEqual((await fetch(`${base}/api/patients`, { method: 'DELETE', headers: KEY })).status, 405);
});
test('masking helpers', () => {
  assert.strictEqual(maskPhone('9840012345'), '******2345');
  assert.strictEqual(maskAadhaar('123456781234'), 'XXXX-XXXX-1234');
});
test('rate limiting returns 429', async () => {
  let last = 200;
  for (let i = 0; i < 40; i++) last = (await fetch(`${base}/health`)).status;
  assert.strictEqual(last, 429);
});
