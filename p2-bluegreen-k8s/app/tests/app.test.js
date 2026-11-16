'use strict';
const test = require('node:test');
const assert = require('node:assert');
process.env.DEPLOY_COLOR = 'green';
process.env.APP_VERSION = 'build-test';
const { createServer, MENU } = require('../server');

let server, base;
test.before(async () => { server = createServer(); await new Promise(r => server.listen(0, r)); base = `http://127.0.0.1:${server.address().port}`; });
test.after(() => server.close());

test('health reports colour and version', async () => {
  const h = await (await fetch(`${base}/health`)).json();
  assert.deepStrictEqual([h.status, h.color, h.version], ['UP', 'green', 'build-test']);
});
test('menu API lists all items', async () => {
  assert.strictEqual((await (await fetch(`${base}/api/menu`)).json()).length, MENU.length);
});
test('page shows the environment banner', async () => {
  assert.match(await (await fetch(`${base}/`)).text(), /GREEN ENVIRONMENT/);
});
