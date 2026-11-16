// CampusEvents - a small Dockerized web app deployed to Kubernetes by Jenkins (Project 1)
'use strict';
const http = require('http');
const os = require('os');

const PORT = Number(process.env.PORT || 3000);
const VERSION = process.env.APP_VERSION || 'dev';
const POD = process.env.POD_NAME || os.hostname();

const EVENTS = [
  { id: 1, title: 'Cloud & DevOps Workshop', date: '2026-11-20', venue: 'Tech Park, Room 601', seats: 60 },
  { id: 2, title: 'Kubernetes Hands-on Lab', date: '2026-11-24', venue: 'UB Lab 3', seats: 40 },
  { id: 3, title: 'Hackathon: Build for Bharat', date: '2026-11-29', venue: 'Main Auditorium', seats: 200 },
  { id: 4, title: 'AWS Cloud Practitioner Prep', date: '2026-12-03', venue: 'Online', seats: 150 },
  { id: 5, title: 'Open Source Contribution Day', date: '2026-12-08', venue: 'Library Seminar Hall', seats: 80 }
];

function json(res, code, data) {
  res.writeHead(code, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(data));
}

function page() {
  const rows = EVENTS.map(e => `<li><div><strong>${e.title}</strong><span>${e.venue}</span></div><time>${new Date(e.date).toDateString().slice(4)}</time><em>${e.seats} seats</em></li>`).join('');
  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>CampusEvents</title><style>
body{margin:0;font-family:Segoe UI,system-ui,sans-serif;background:#f3f5fb;color:#14213d}
header{background:#14213d;color:#fff;padding:28px 40px}h1{margin:0;font-size:28px}header p{margin:6px 0 0;opacity:.8}
main{max-width:860px;margin:32px auto;padding:0 24px}ul{list-style:none;padding:0;margin:0;display:grid;gap:12px}
li{background:#fff;border-radius:14px;padding:18px 22px;display:grid;grid-template-columns:1fr auto auto;gap:24px;align-items:center;box-shadow:0 1px 3px rgba(20,33,61,.08)}
li span{display:block;color:#5c6784;font-size:14px;margin-top:2px}time{font-weight:600}em{font-style:normal;background:#e8edff;color:#2742a8;padding:4px 10px;border-radius:99px;font-size:13px}
.k8s{margin-top:28px;background:#fff;border:2px dashed #326ce5;border-radius:14px;padding:18px 22px}.k8s b{color:#326ce5}
</style></head><body><header><h1>CampusEvents</h1><p>Upcoming tech events on campus</p></header><main><ul>${rows}</ul>
<div class="k8s">Served by Kubernetes pod <b>${POD}</b> &nbsp;|&nbsp; version <b>${VERSION}</b> &nbsp;|&nbsp; refresh to see load balancing across replicas</div>
</main></body></html>`;
}

function handler(req, res) {
  const url = new URL(req.url, 'http://x');
  if (url.pathname === '/health') return json(res, 200, { status: 'UP', version: VERSION, pod: POD });
  if (url.pathname === '/api/events') return json(res, 200, EVENTS);
  if (url.pathname === '/') { res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }); return res.end(page()); }
  return json(res, 404, { error: 'Not found' });
}

const createServer = () => http.createServer(handler);
if (require.main === module) {
  const s = createServer().listen(PORT, () => console.log(`CampusEvents ${VERSION} on :${PORT} (pod ${POD})`));
  process.on('SIGTERM', () => s.close(() => process.exit(0)));
}
module.exports = { createServer, EVENTS };
