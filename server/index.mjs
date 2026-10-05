import http from 'node:http';
import https from 'node:https';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration with secure defaults
const PORT = parseInt(process.env.PORT || '3000', 10);
const HOST = process.env.HOST || '127.0.0.1'; // Binds loopback by default
const STATIC_DIR = path.resolve(__dirname, '../dist');
const MAX_BODY_SIZE = parseInt(process.env.MAX_BODY_SIZE || (2 * 1024 * 1024).toString(), 10); // 2MB default

// Validate upstream target configuration (protocol and credentials check)
const rawTarget = process.env.HONCHO_TARGET_URL || 'http://192.168.4.91:8000';
let targetConfigParsed;
try {
  targetConfigParsed = new URL(rawTarget);
} catch (err) {
  throw new Error(`Invalid HONCHO_TARGET_URL: ${err.message}`);
}
if (targetConfigParsed.protocol !== 'http:' && targetConfigParsed.protocol !== 'https:') {
  throw new Error(`HONCHO_TARGET_URL must use http: or https: protocol, got '${targetConfigParsed.protocol}'`);
}
if (targetConfigParsed.username || targetConfigParsed.password) {
  throw new Error('HONCHO_TARGET_URL must not contain credentials (userinfo)');
}
const HONCHO_TARGET_URL = rawTarget.replace(/\/+$/, '');

const HONCHO_API_KEY = process.env.HONCHO_API_KEY || '';

// Allowed hostnames for DNS rebinding and Host/Origin validation
const ALLOWED_HOSTS = new Set(
  (process.env.ALLOWED_HOSTS || '127.0.0.1,localhost,::1')
    .split(',')
    .map(h => h.trim().toLowerCase())
    .filter(Boolean)
);
if (HOST) {
  ALLOWED_HOSTS.add(HOST.toLowerCase());
}
// Normalize IPv6 hosts (support both bracketed and unbracketed forms)
for (const host of Array.from(ALLOWED_HOSTS)) {
  if (host.includes(':')) {
    if (host.startsWith('[') && host.endsWith(']')) {
      ALLOWED_HOSTS.add(host.slice(1, -1));
    } else {
      ALLOWED_HOSTS.add(`[${host}]`);
    }
  }
}

/**
 * Returns the exact set of trusted origins (protocol + host + port).
 * Configurable via TRUSTED_ORIGINS env var (comma-separated, e.g. http://127.0.0.1:3000,http://localhost:3000).
 * Defaults to exact match of ALLOWED_HOSTS with current gateway port.
 */
function getTrustedOrigins() {
  const currentPort = server.address()?.port || PORT;
  if (process.env.TRUSTED_ORIGINS) {
    return new Set(
      process.env.TRUSTED_ORIGINS.split(',')
        .map(o => o.trim().replace(/\/+$/, ''))
        .filter(Boolean)
    );
  }
  const defaults = new Set();
  for (const host of ALLOWED_HOSTS) {
    const formattedHost = host.includes(':') && !host.startsWith('[') ? `[${host}]` : host;
    defaults.add(`http://${formattedHost}:${currentPort}`);
    if (currentPort === 80) {
      defaults.add(`http://${formattedHost}`);
    }
  }
  return defaults;
}

// MIME types for static assets
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
};

// Route Allowlist Pattern Definitions
// Only alphanumeric, hyphens, underscores, dots allowed in path segments
const ID_PATTERN = '[a-zA-Z0-9_\\-\\.]+';

const ROUTE_ALLOWLIST = [
  // Health
  { method: 'GET', regex: /^\/health\/?$/ },
  // Docs & OpenAPI
  { method: 'GET', regex: /^\/docs\/?$/ },
  { method: 'GET', regex: /^\/openapi\.json\/?$/ },
  // Workspaces
  { method: 'POST', regex: /^\/v3\/workspaces\/list\/?$/ },
  { method: 'POST', regex: /^\/v3\/workspaces\/?$/ },
  { method: 'GET', regex: new RegExp(`^\\/v3\\/workspaces\\/(${ID_PATTERN})\\/queue\\/status\\/?$`) },
  // Sessions
  { method: 'POST', regex: new RegExp(`^\\/v3\\/workspaces\\/(${ID_PATTERN})\\/sessions\\/list\\/?$`) },
  { method: 'POST', regex: new RegExp(`^\\/v3\\/workspaces\\/(${ID_PATTERN})\\/sessions\\/?$`) },
  { method: 'GET', regex: new RegExp(`^\\/v3\\/workspaces\\/(${ID_PATTERN})\\/sessions\\/(${ID_PATTERN})\\/context\\/?$`) },
  { method: 'GET', regex: new RegExp(`^\\/v3\\/workspaces\\/(${ID_PATTERN})\\/sessions\\/(${ID_PATTERN})\\/summaries\\/?$`) },
  // Messages
  { method: 'POST', regex: new RegExp(`^\\/v3\\/workspaces\\/(${ID_PATTERN})\\/sessions\\/(${ID_PATTERN})\\/messages\\/list\\/?$`) },
  { method: 'POST', regex: new RegExp(`^\\/v3\\/workspaces\\/(${ID_PATTERN})\\/sessions\\/(${ID_PATTERN})\\/messages\\/?$`) },
  { method: 'GET', regex: new RegExp(`^\\/v3\\/workspaces\\/(${ID_PATTERN})\\/sessions\\/(${ID_PATTERN})\\/messages\\/(${ID_PATTERN})\\/?$`) },
  // Peers
  { method: 'POST', regex: new RegExp(`^\\/v3\\/workspaces\\/(${ID_PATTERN})\\/peers\\/list\\/?$`) },
  { method: 'POST', regex: new RegExp(`^\\/v3\\/workspaces\\/(${ID_PATTERN})\\/peers\\/?$`) },
  { method: 'GET', regex: new RegExp(`^\\/v3\\/workspaces\\/(${ID_PATTERN})\\/peers\\/(${ID_PATTERN})\\/card\\/?$`) },
  { method: 'GET', regex: new RegExp(`^\\/v3\\/workspaces\\/(${ID_PATTERN})\\/peers\\/(${ID_PATTERN})\\/context\\/?$`) },
  { method: 'POST', regex: new RegExp(`^\\/v3\\/workspaces\\/(${ID_PATTERN})\\/peers\\/(${ID_PATTERN})\\/representation\\/?$`) },
  // Conclusions
  { method: 'POST', regex: new RegExp(`^\\/v3\\/workspaces\\/(${ID_PATTERN})\\/conclusions\\/list\\/?$`) },
  { method: 'POST', regex: new RegExp(`^\\/v3\\/workspaces\\/(${ID_PATTERN})\\/conclusions\\/query\\/?$`) },
  { method: 'GET', regex: new RegExp(`^\\/v3\\/workspaces\\/(${ID_PATTERN})\\/conclusions\\/(${ID_PATTERN})\\/?$`) },
  // Scopes
  { method: 'POST', regex: new RegExp(`^\\/v3\\/workspaces\\/(${ID_PATTERN})\\/scopes\\/list\\/?$`) },
  // Dialectic Chat
  { method: 'POST', regex: new RegExp(`^\\/v3\\/workspaces\\/(${ID_PATTERN})\\/peers\\/(${ID_PATTERN})\\/chat\\/?$`) },
  { method: 'POST', regex: new RegExp(`^\\/v3\\/workspaces\\/(${ID_PATTERN})\\/chat\\/?$`) },
];

/**
 * Normalizes URL path, decodes percent-encoding, removes null bytes,
 * and checks for path traversal.
 */
function normalizeAndValidatePath(rawPath) {
  if (typeof rawPath !== 'string') return null;

  // Reject null bytes immediately
  if (rawPath.includes('\0') || rawPath.includes('%00')) {
    return null;
  }

  // Percent-decode
  let decoded;
  try {
    decoded = decodeURIComponent(rawPath);
  } catch {
    return null;
  }

  if (decoded.includes('\0')) {
    return null;
  }

  // Reject backslashes, multiple consecutive slashes, or null bytes
  if (rawPath.includes('//') || decoded.includes('//') || decoded.includes('\\')) {
    return null;
  }

  // Normalize path
  const normalized = path.posix.normalize(decoded);

  // Traversal checks: reject if path contains .. segments or escapes root
  if (
    decoded.split('/').includes('..') ||
    normalized.split('/').includes('..') ||
    normalized.startsWith('../') ||
    normalized === '..'
  ) {
    return null;
  }

  return normalized;
}

function isRouteAllowed(method, rawPath) {
  const normalized = normalizeAndValidatePath(rawPath);
  if (!normalized) {
    return false;
  }
  return ROUTE_ALLOWLIST.some(rule => rule.method === method && rule.regex.test(normalized));
}

function validateHostHeader(req) {
  const hostHeader = req.headers['host'];
  if (!hostHeader) {
    return false;
  }

  let hostname;
  let port;
  try {
    const dummyUrl = new URL(`http://${hostHeader}`);
    hostname = dummyUrl.hostname.toLowerCase();
    port = dummyUrl.port ? parseInt(dummyUrl.port, 10) : 80;
  } catch {
    return false;
  }

  if (!ALLOWED_HOSTS.has(hostname)) {
    return false;
  }

  const externalPort = process.env.EXTERNAL_PORT ? parseInt(process.env.EXTERNAL_PORT, 10) : null;
  const currentPort = server.address()?.port || PORT;
  if (port !== currentPort && (!externalPort || port !== externalPort)) {
    return false;
  }

  return true;
}

function validateOriginHeader(req) {
  const origin = req.headers['origin'];
  if (!origin) {
    return true; // No Origin header sent (e.g. direct GET/same-origin navigation)
  }

  // Reject literal "null" (used in sandboxed iframes or privacy exploits)
  if (origin === 'null') {
    return false;
  }

  let originUrl;
  try {
    originUrl = new URL(origin);
  } catch {
    return false;
  }

  // Reject non-http/https protocols (javascript:, file:, data:, etc.)
  if (originUrl.protocol !== 'http:' && originUrl.protocol !== 'https:') {
    return false;
  }

  const trusted = getTrustedOrigins();
  // Exact match of protocol + host (which includes port if non-default)
  const normalizedOrigin = `${originUrl.protocol}//${originUrl.host.toLowerCase()}`;
  return trusted.has(normalizedOrigin);
}

function handleStatic(req, res, pathname) {
  const normalizedPath = normalizeAndValidatePath(pathname);
  if (!normalizedPath) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('Forbidden');
    return;
  }

  let safePath = normalizedPath;
  if (safePath === '/' || safePath === '') {
    safePath = '/index.html';
  }

  const filePath = path.join(STATIC_DIR, safePath);

  // Path traversal check against static root
  if (!filePath.startsWith(STATIC_DIR)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('Forbidden');
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      // If the request path has a file extension or is under /assets/, it's an asset: return 404!
      // Only extensionless navigation paths should fallback to index.html for SPA routing.
      const hasExtension = path.extname(safePath) !== '';
      const isAssetPath = safePath.startsWith('/assets/') || hasExtension;

      if (isAssetPath) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not Found');
        return;
      }

      // SPA Fallback: serve index.html for client-side routing
      const indexPath = path.join(STATIC_DIR, 'index.html');
      fs.readFile(indexPath, (err2, content) => {
        if (err2) {
          res.writeHead(404, { 'Content-Type': 'text/plain' });
          res.end('Not Found - Build SPA first via "npm run build"');
          return;
        }
        res.writeHead(200, {
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'no-cache',
        });
        res.end(content);
      });
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    const isImmutable = filePath.includes('/assets/');

    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': isImmutable ? 'public, max-age=31536000, immutable' : 'no-cache',
    });

    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  });
}

function proxyToHoncho(req, res, targetPath, search) {
  const method = req.method;
  const normalizedPath = normalizeAndValidatePath(targetPath);
  if (!normalizedPath || !isRouteAllowed(method, normalizedPath)) {
    res.writeHead(403, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Route or method not allowed by gateway security policy' }));
    return;
  }

  // Request Body Size Limit Check (Content-Length)
  const clHeader = req.headers['content-length'];
  if (clHeader) {
    const cl = parseInt(clHeader, 10);
    if (Number.isFinite(cl) && cl > MAX_BODY_SIZE) {
      res.writeHead(413, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Payload Too Large: exceeds 2MB limit' }));
      return;
    }
  }

  const targetUrlStr = `${HONCHO_TARGET_URL}${normalizedPath}${search || ''}`;
  let targetParsed;
  try {
    targetParsed = new URL(targetUrlStr);
  } catch (err) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Invalid URL formulation' }));
    return;
  }

  const isStreamRequest = normalizedPath.endsWith('/chat');

  const outgoingHeaders = {
    'accept': isStreamRequest ? 'text/event-stream, application/json, */*' : (req.headers['accept'] || 'application/json'),
  };

  if (req.headers['content-type']) {
    outgoingHeaders['content-type'] = req.headers['content-type'];
  } else if (method === 'POST' || method === 'PUT') {
    outgoingHeaders['content-type'] = 'application/json';
  }

  if (req.headers['content-length']) {
    outgoingHeaders['content-length'] = req.headers['content-length'];
  }
  if (req.headers['transfer-encoding']) {
    outgoingHeaders['transfer-encoding'] = req.headers['transfer-encoding'];
  }

  if (HONCHO_API_KEY) {
    outgoingHeaders['authorization'] = `Bearer ${HONCHO_API_KEY}`;
  }

  const requestOptions = {
    protocol: targetParsed.protocol,
    hostname: targetParsed.hostname,
    port: targetParsed.port || (targetParsed.protocol === 'https:' ? 443 : 80),
    path: `${targetParsed.pathname}${targetParsed.search}`,
    method: method,
    headers: outgoingHeaders,
    timeout: isStreamRequest ? 180000 : 30000, // 30s for non-stream, 3m for stream
  };

  const isHttps = targetParsed.protocol === 'https:';
  const transport = isHttps ? https : http;

  const upstreamReq = transport.request(requestOptions, upstreamRes => {
    const isSse = (upstreamRes.headers['content-type'] || '').includes('text/event-stream');

    // Forward response headers
    const resHeaders = {
      'content-type': upstreamRes.headers['content-type'] || 'application/json',
    };

    if (isSse) {
      resHeaders['cache-control'] = 'no-cache, no-transform';
      resHeaders['connection'] = 'keep-alive';
      resHeaders['x-accel-buffering'] = 'no'; // Disable proxy buffering (Nginx/etc.)
    }

    res.writeHead(upstreamRes.statusCode || 500, resHeaders);
    if (res.flushHeaders) {
      res.flushHeaders();
    }

    upstreamRes.on('data', chunk => {
      res.write(chunk);
      if (typeof res.flush === 'function') {
        res.flush();
      }
    });

    upstreamRes.on('end', () => {
      res.end();
    });

    upstreamRes.on('error', err => {
      if (!res.headersSent) {
        res.writeHead(502, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Upstream gateway error', detail: err.message }));
      } else {
        res.end();
      }
    });
  });

  upstreamReq.on('timeout', () => {
    upstreamReq.destroy();
    if (!res.headersSent) {
      res.writeHead(504, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Gateway timeout talking to Honcho' }));
    } else {
      res.end();
    }
  });

  upstreamReq.on('error', err => {
    if (!res.headersSent) {
      res.writeHead(502, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Unable to reach Honcho upstream', detail: err.message }));
    } else {
      res.end();
    }
  });

  // Enforce body size limit during stream transfer
  let receivedBytes = 0;
  req.on('data', chunk => {
    receivedBytes += chunk.length;
    if (receivedBytes > MAX_BODY_SIZE) {
      upstreamReq.destroy();
      if (!res.headersSent) {
        res.writeHead(413, { 'Content-Type': 'application/json', 'Connection': 'close' });
        res.end(JSON.stringify({ error: `Payload Too Large: exceeds ${MAX_BODY_SIZE} bytes limit` }));
      }
      req.unpipe();
      req.resume();
    }
  });

  // Abort upstream if client disconnects prematurely before response ends
  res.on('close', () => {
    if (!res.writableEnded && !upstreamReq.destroyed) {
      upstreamReq.destroy();
    }
  });

  if (method === 'GET' || method === 'HEAD') {
    upstreamReq.end();
  } else {
    req.pipe(upstreamReq);
  }
}

const server = http.createServer((req, res) => {
  // Security Headers on all responses
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // 1. Host Header Validation (anti-DNS rebinding)
  if (!validateHostHeader(req)) {
    res.writeHead(403, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Invalid Host header: protection against DNS rebinding' }));
    return;
  }

  // 2. Origin Header Validation (anti-CSRF)
  if (!validateOriginHeader(req)) {
    res.writeHead(403, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Cross-origin request rejected: Origin not allowed' }));
    return;
  }

  const parsed = new URL(req.url || '/', `http://${req.headers.host || '127.0.0.1'}`);
  const pathname = parsed.pathname;

  // Handle API requests
  if (pathname.startsWith('/api/')) {
    const targetPath = pathname.substring(4); // Strip '/api' prefix -> '/v3/...' or '/health'
    proxyToHoncho(req, res, targetPath, parsed.search);
    return;
  }

  // Direct v3 API pass-through
  if (pathname.startsWith('/v3/')) {
    proxyToHoncho(req, res, pathname, parsed.search);
    return;
  }

  // Direct health and docs pass-through
  if (pathname === '/health' || pathname === '/docs' || pathname === '/openapi.json') {
    proxyToHoncho(req, res, pathname, parsed.search);
    return;
  }

  // Handle static assets and SPA fallback
  if (req.method === 'GET' || req.method === 'HEAD') {
    handleStatic(req, res, pathname);
    return;
  }

  // Reject unexpected non-GET static requests
  res.writeHead(405, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Method Not Allowed' }));
});

export {
  server,
  isRouteAllowed,
  normalizeAndValidatePath,
  validateHostHeader,
  validateOriginHeader,
  getTrustedOrigins,
  ROUTE_ALLOWLIST,
  MAX_BODY_SIZE,
};

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  server.listen(PORT, HOST, () => {
    console.log(`[Honcho Gateway] Running on http://${HOST}:${PORT}`);
    console.log(`[Honcho Gateway] Upstream target: ${HONCHO_TARGET_URL}`);
    console.log(`[Honcho Gateway] Serving static from: ${STATIC_DIR}`);
  });
}
