// zumo public counters: a tiny, dependency-free service.
//
// The browser sends only totals after a download (how many images, bytes
// before and after, output format). Nothing about the images themselves,
// no identifiers and no IPs are stored: just running sums in one JSON file.
//
//   GET  /api/stats  -> public totals
//   POST /api/stats  -> { images, before, after, format, zip }

import { createServer } from 'node:http';
import { readFileSync, writeFileSync, renameSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

const FILE = process.env.STATS_FILE || '/data/stats.json';
const PORT = Number(process.env.PORT || 8080);
const FORMATS = ['JPEG', 'WebP', 'AVIF', 'PNG', 'JPEG XL', 'GIF', 'QOI', 'WebP 2'];
const MAX_IMAGES = 5000; // per report
const MAX_IMAGE_BYTES = 300 * 1024 * 1024; // per image, on average
const WINDOW_MS = 10 * 60 * 1000;
const MAX_REPORTS_PER_WINDOW = 60;

const empty = () => ({
  since: new Date().toISOString().slice(0, 10),
  images: 0,
  bytesBefore: 0,
  bytesAfter: 0,
  zips: 0,
  formats: {},
});

let stats;
try {
  stats = { ...empty(), ...JSON.parse(readFileSync(FILE, 'utf8')) };
} catch {
  stats = empty();
}

let dirty = false;
function save() {
  if (!dirty) return;
  dirty = false;
  mkdirSync(dirname(FILE), { recursive: true });
  const tmp = `${FILE}.tmp`;
  writeFileSync(tmp, JSON.stringify(stats));
  renameSync(tmp, FILE);
}
setInterval(save, 5000).unref();
for (const signal of ['SIGTERM', 'SIGINT']) {
  process.on(signal, () => {
    save();
    process.exit(0);
  });
}

// Rate limit in memory only (forgotten after the window, never written)
const hits = new Map();
setInterval(() => hits.clear(), WINDOW_MS).unref();
function limited(req) {
  const key =
    req.headers['cf-connecting-ip'] ||
    String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() ||
    req.socket.remoteAddress;
  const count = (hits.get(key) || 0) + 1;
  hits.set(key, count);
  return count > MAX_REPORTS_PER_WINDOW;
}

function publicStats() {
  const saved = Math.max(0, stats.bytesBefore - stats.bytesAfter);
  const favourite = Object.entries(stats.formats).sort((a, b) => b[1] - a[1])[0];
  return {
    since: stats.since,
    images: stats.images,
    bytesSaved: saved,
    averageReduction: stats.bytesBefore
      ? Math.round((saved / stats.bytesBefore) * 1000) / 10
      : 0,
    zips: stats.zips,
    favouriteFormat: favourite ? favourite[0] : null,
  };
}

const isInt = (n, min, max) => Number.isInteger(n) && n >= min && n <= max;

function record(body) {
  const { images, before, after, format, zip } = body || {};
  if (!isInt(images, 1, MAX_IMAGES)) return false;
  const maxBytes = images * MAX_IMAGE_BYTES;
  if (!isInt(before, 1, maxBytes) || !isInt(after, 1, maxBytes)) return false;
  if (!FORMATS.includes(format)) return false;
  stats.images += images;
  stats.bytesBefore += before;
  stats.bytesAfter += after;
  if (zip === true) stats.zips += 1;
  stats.formats[format] = (stats.formats[format] || 0) + images;
  dirty = true;
  return true;
}

function send(res, status, data) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': status === 200 ? 'public, max-age=30' : 'no-store',
  });
  res.end(data === undefined ? '' : JSON.stringify(data));
}

createServer((req, res) => {
  const path = req.url.split('?')[0];
  if (path === '/healthz') return send(res, 200, { ok: true });
  if (path !== '/api/stats') return send(res, 404, { error: 'not found' });

  if (req.method === 'GET') return send(res, 200, publicStats());
  if (req.method !== 'POST') return send(res, 405, { error: 'method' });

  let size = 0;
  const chunks = [];
  req.on('data', (chunk) => {
    size += chunk.length;
    if (size > 1024) req.destroy();
    else chunks.push(chunk);
  });
  req.on('end', () => {
    if (limited(req)) return send(res, 429, { error: 'slow down' });
    let body;
    try {
      body = JSON.parse(Buffer.concat(chunks).toString('utf8'));
    } catch {
      return send(res, 400, { error: 'json' });
    }
    if (!record(body)) return send(res, 400, { error: 'invalid' });
    res.writeHead(204, { 'Cache-Control': 'no-store' });
    res.end();
  });
}).listen(PORT, () => console.log(`zumo stats on :${PORT}, file ${FILE}`));
