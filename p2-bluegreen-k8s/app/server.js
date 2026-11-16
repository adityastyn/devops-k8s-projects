// BrewBox Cafe - demo app for automated Blue-Green deployment on Kubernetes (Project 2)
'use strict';
const http = require('http');
const os = require('os');

const PORT = Number(process.env.PORT || 3000);
const VERSION = process.env.APP_VERSION || 'dev';
const COLOR = process.env.DEPLOY_COLOR || 'local';
const POD = process.env.POD_NAME || os.hostname();
const THEME = { blue: ['#1d4ed8', '#dbeafe'], green: ['#15803d', '#dcfce7'] }[COLOR] || ['#6b7280', '#f3f4f6'];

const MENU = [
  ['Filter Coffee', 60], ['Masala Chai', 40], ['Cold Brew', 140], ['Hazelnut Latte', 180], ['Paneer Sandwich', 120], ['Banana Walnut Muffin', 90]
];

function json(res, code, data) { res.writeHead(code, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }); res.end(JSON.stringify(data)); }

function page() {
  const items = MENU.map(([n, p]) => `<li><span>${n}</span><b>&#8377;${p}</b></li>`).join('');
  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>BrewBox Cafe</title><style>
body{margin:0;font-family:Segoe UI,system-ui,sans-serif;background:${THEME[1]};color:#111827}
.banner{background:${THEME[0]};color:#fff;padding:36px 40px}.banner h1{margin:0;font-size:30px}.banner p{margin:8px 0 0;font-size:18px;opacity:.95}
.env{display:inline-block;margin-top:14px;background:#fff;color:${THEME[0]};font-weight:800;padding:8px 18px;border-radius:99px;letter-spacing:.04em}
main{max-width:640px;margin:32px auto;padding:0 24px}ul{list-style:none;margin:0;padding:0;background:#fff;border-radius:16px;overflow:hidden}
li{display:flex;justify-content:space-between;padding:16px 22px;border-bottom:1px solid #eef0f3}li:last-child{border:0}
footer{margin-top:20px;color:#374151;font-size:14px}
</style></head><body><div class="banner"><h1>BrewBox Cafe</h1><p>Today's menu</p>
<div class="env">${COLOR.toUpperCase()} ENVIRONMENT &middot; ${VERSION}</div></div>
<main><ul>${items}</ul><footer>Served by pod ${POD}</footer></main></body></html>`;
}

function handler(req, res) {
  const { pathname } = new URL(req.url, 'http://x');
  if (pathname === '/health') return json(res, 200, { status: 'UP', version: VERSION, color: COLOR, pod: POD });
  if (pathname === '/api/menu') return json(res, 200, MENU.map(([name, price]) => ({ name, price })));
  if (pathname === '/') { res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }); return res.end(page()); }
  return json(res, 404, { error: 'Not found' });
}

const createServer = () => http.createServer(handler);
if (require.main === module) {
  const s = createServer().listen(PORT, () => console.log(`BrewBox ${VERSION} (${COLOR}) on :${PORT}`));
  process.on('SIGTERM', () => s.close(() => process.exit(0)));
}
module.exports = { createServer, MENU };
