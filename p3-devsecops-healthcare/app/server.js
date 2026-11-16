// MediSecure - patient records service built with security controls (Project 3: DevSecOps)
'use strict';
const http = require('http');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const PORT = Number(process.env.PORT || 3000);
const VERSION = process.env.APP_VERSION || 'dev';
const API_KEY = process.env.API_KEY || '';                 // injected from a Kubernetes Secret, never hard-coded
const RATE_LIMIT = Number(process.env.RATE_LIMIT || 60);    // requests per minute per client
const PUBLIC = path.join(__dirname, 'public');
const PATIENTS = require('./patients.json');

// ---------- security helpers ----------
const SECURITY_HEADERS = {
  'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; object-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'",
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'no-referrer',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Resource-Policy': 'same-origin',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains'
};

function maskPhone(p) { return p.replace(/\d(?=\d{4})/g, '*'); }
function maskAadhaar(a) { return 'XXXX-XXXX-' + a.slice(-4); }
function redact(p) {
  return { id: p.id, name: p.name, age: p.age, gender: p.gender, bloodGroup: p.bloodGroup, ward: p.ward, condition: p.condition, phone: maskPhone(p.phone), aadhaar: maskAadhaar(p.aadhaar) };
}

function validKey(given) {
  if (!API_KEY || typeof given !== 'string') return false;
  const a = crypto.createHash('sha256').update(given).digest();
  const b = crypto.createHash('sha256').update(API_KEY).digest();
  return crypto.timingSafeEqual(a, b);
}

const hits = new Map();
function rateLimited(ip) {
  const now = Date.now();
  const rec = hits.get(ip) || { start: now, count: 0 };
  if (now - rec.start > 60000) { rec.start = now; rec.count = 0; }
  rec.count++; hits.set(ip, rec);
  return rec.count > RATE_LIMIT;
}

function audit(event, req, extra = {}) {
  console.log(JSON.stringify({ ts: new Date().toISOString(), event, ip: req.socket.remoteAddress, path: req.url.split('?')[0], ...extra }));
}

function send(res, code, body, type = 'application/json') {
  res.writeHead(code, { ...SECURITY_HEADERS, 'Content-Type': type, 'Cache-Control': 'no-store' });
  res.end(type === 'application/json' ? JSON.stringify(body) : body);
}

const STATIC = { '/': ['index.html', 'text/html; charset=utf-8'], '/app.js': ['app.js', 'application/javascript'], '/styles.css': ['styles.css', 'text/css'] };

function handler(req, res) {
  const { pathname } = new URL(req.url, 'http://x');
  if (req.method !== 'GET') return send(res, 405, { error: 'Method not allowed' });
  if (rateLimited(req.socket.remoteAddress)) { audit('rate_limited', req); return send(res, 429, { error: 'Too many requests' }); }

  if (pathname === '/health') return send(res, 200, { status: 'UP', version: VERSION });
  if (STATIC[pathname]) {
    const [file, type] = STATIC[pathname];
    return send(res, 200, fs.readFileSync(path.join(PUBLIC, file), 'utf8'), type);
  }
  if (pathname.startsWith('/api/')) {
    if (!validKey(req.headers['x-api-key'])) { audit('auth_failed', req); return send(res, 401, { error: 'A valid X-API-Key header is required' }); }
    if (pathname === '/api/patients') { audit('phi_list', req, { count: PATIENTS.length }); return send(res, 200, PATIENTS.map(redact)); }
    const m = pathname.match(/^\/api\/patients\/([^/]+)$/);
    if (m) {
      if (!/^P\d{3}$/.test(m[1])) return send(res, 400, { error: 'Patient ID must look like P001' });
      const p = PATIENTS.find(x => x.id === m[1]);
      audit('phi_read', req, { patientId: m[1], found: !!p });
      return p ? send(res, 200, redact(p)) : send(res, 404, { error: 'Patient not found' });
    }
  }
  return send(res, 404, { error: 'Not found' });
}

const createServer = () => http.createServer(handler);
if (require.main === module) {
  if (!API_KEY) { console.error('API_KEY is not set - refusing to start'); process.exit(1); }
  const s = createServer().listen(PORT, () => console.log(`MediSecure ${VERSION} listening on :${PORT}`));
  process.on('SIGTERM', () => s.close(() => process.exit(0)));
}
module.exports = { createServer, maskPhone, maskAadhaar };
