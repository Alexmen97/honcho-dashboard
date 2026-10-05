import test from 'node:test';
import assert from 'node:assert/strict';
import {
  isRouteAllowed,
  normalizeAndValidatePath,
  validateHostHeader,
  validateOriginHeader,
} from './index.mjs';

test('Gateway route allowlist allows permitted endpoints', () => {
  assert.equal(isRouteAllowed('GET', '/health'), true);
  assert.equal(isRouteAllowed('POST', '/v3/workspaces/list'), true);
  assert.equal(isRouteAllowed('POST', '/v3/workspaces'), true);
  assert.equal(isRouteAllowed('GET', '/v3/workspaces/test-workspace/queue/status'), true);
  assert.equal(isRouteAllowed('POST', '/v3/workspaces/test-workspace/sessions/list'), true);
  assert.equal(isRouteAllowed('POST', '/v3/workspaces/test-workspace/sessions'), true);
  assert.equal(isRouteAllowed('GET', '/v3/workspaces/test-workspace/sessions/sess-1/context'), true);
  assert.equal(isRouteAllowed('GET', '/v3/workspaces/test-workspace/sessions/sess-1/summaries'), true);
  assert.equal(isRouteAllowed('POST', '/v3/workspaces/test-workspace/sessions/sess-1/messages/list'), true);
  assert.equal(isRouteAllowed('POST', '/v3/workspaces/test-workspace/sessions/sess-1/messages'), true);
  assert.equal(isRouteAllowed('GET', '/v3/workspaces/test-workspace/sessions/sess-1/messages/msg-1'), true);
  assert.equal(isRouteAllowed('POST', '/v3/workspaces/test-workspace/peers/list'), true);
  assert.equal(isRouteAllowed('POST', '/v3/workspaces/test-workspace/peers'), true);
  assert.equal(isRouteAllowed('GET', '/v3/workspaces/test-workspace/peers/alex/card'), true);
  assert.equal(isRouteAllowed('GET', '/v3/workspaces/test-workspace/peers/alex/context'), true);
  assert.equal(isRouteAllowed('POST', '/v3/workspaces/test-workspace/peers/alex/representation'), true);
  assert.equal(isRouteAllowed('POST', '/v3/workspaces/test-workspace/conclusions/list'), true);
  assert.equal(isRouteAllowed('POST', '/v3/workspaces/test-workspace/conclusions/query'), true);
  assert.equal(isRouteAllowed('GET', '/v3/workspaces/test-workspace/conclusions/c-123'), true);
  assert.equal(isRouteAllowed('POST', '/v3/workspaces/test-workspace/peers/alex/chat'), true);
  assert.equal(isRouteAllowed('POST', '/v3/workspaces/test-workspace/chat'), true);
});

test('Gateway route allowlist blocks disallowed endpoints and methods', () => {
  // Disallowed methods on allowed paths
  assert.equal(isRouteAllowed('DELETE', '/v3/workspaces'), false);
  assert.equal(isRouteAllowed('PUT', '/v3/workspaces/test-workspace/queue/status'), false);
  assert.equal(isRouteAllowed('GET', '/v3/workspaces/list'), false);
  assert.equal(isRouteAllowed('DELETE', '/v3/workspaces/test-workspace/conclusions/c-123'), false); // Deletion protected

  // Disallowed paths / arbitrary routes
  assert.equal(isRouteAllowed('GET', '/v3/admin/keys'), false);
  assert.equal(isRouteAllowed('POST', '/v3/keys'), false);
  assert.equal(isRouteAllowed('GET', '/etc/passwd'), false);
  assert.equal(isRouteAllowed('POST', '/arbitrary/proxy'), false);

  // Excluded schedule_dream route (out of scope)
  assert.equal(isRouteAllowed('POST', '/v3/workspaces/test-workspace/schedule_dream'), false);
});

test('Gateway normalizes URLs and rejects traversal, null bytes, and backslashes', () => {
  // Traversal checks
  assert.equal(isRouteAllowed('GET', '/health/../../etc/passwd'), false);
  assert.equal(isRouteAllowed('POST', '/v3/workspaces/../admin'), false);
  assert.equal(isRouteAllowed('GET', '/v3/workspaces//test/queue/status'), false);
  assert.equal(isRouteAllowed('GET', '/v3/workspaces/test\\queue'), false);

  // Encoded traversal
  assert.equal(normalizeAndValidatePath('/v3/workspaces/%2e%2e/admin'), null);
  assert.equal(normalizeAndValidatePath('/v3/%2e%2e%2fetc/passwd'), null);

  // Null bytes
  assert.equal(normalizeAndValidatePath('/v3/workspaces\0test'), null);
  assert.equal(normalizeAndValidatePath('/v3/workspaces%00test'), null);

  // Valid normalization
  assert.equal(normalizeAndValidatePath('/v3/workspaces/test-ws/./queue/status'), '/v3/workspaces/test-ws/queue/status');
});

test('Gateway validates Host header against DNS rebinding', () => {
  // Valid loopback hosts with exact port
  assert.equal(validateHostHeader({ headers: { host: '127.0.0.1:3000' } }), true);
  assert.equal(validateHostHeader({ headers: { host: 'localhost:3000' } }), true);
  assert.equal(validateHostHeader({ headers: { host: '[::1]:3000' } }), true);

  // Invalid hosts / DNS rebinding attempts
  assert.equal(validateHostHeader({ headers: { host: 'attacker.com:3000' } }), false);
  assert.equal(validateHostHeader({ headers: { host: 'evil.internal:3000' } }), false);
  assert.equal(validateHostHeader({ headers: { host: '192.168.1.100:3000' } }), false);
  assert.equal(validateHostHeader({ headers: {} }), false);

  // Port mismatch on loopback (prevent rebinding / wrong service forwarding)
  assert.equal(validateHostHeader({ headers: { host: '127.0.0.1:8080' } }), false);
  assert.equal(validateHostHeader({ headers: { host: 'localhost:8080' } }), false);
  assert.equal(validateHostHeader({ headers: { host: 'localhost' } }), false); // Missing port when server on 3000
  assert.equal(validateHostHeader({ headers: { host: '127.0.0.1' } }), false);
});

test('Gateway validates Origin header against cross-origin CSRF (SEC-01b strict criteria)', () => {
  // No origin header (same-origin direct GET / curl / non-browser navigation)
  assert.equal(validateOriginHeader({ headers: {} }), true);

  // Valid exact same-origin (protocol + host + port)
  assert.equal(validateOriginHeader({ headers: { origin: 'http://127.0.0.1:3000' } }), true);
  assert.equal(validateOriginHeader({ headers: { origin: 'http://localhost:3000' } }), true);
  assert.equal(validateOriginHeader({ headers: { origin: 'http://[::1]:3000' } }), true);

  // Disallowed different ports on localhost (no port bypass)
  assert.equal(validateOriginHeader({ headers: { origin: 'http://127.0.0.1:8080' } }), false);
  assert.equal(validateOriginHeader({ headers: { origin: 'http://localhost:8080' } }), false);
  assert.equal(validateOriginHeader({ headers: { origin: 'http://localhost:80' } }), false);
  assert.equal(validateOriginHeader({ headers: { origin: 'http://localhost:443' } }), false);
  assert.equal(validateOriginHeader({ headers: { origin: 'http://localhost' } }), false);

  // Disallowed null origins (sandboxed iframes / privacy exploit bypass)
  assert.equal(validateOriginHeader({ headers: { origin: 'null' } }), false);

  // Disallowed non-HTTP/HTTPS schemes
  assert.equal(validateOriginHeader({ headers: { origin: 'javascript:alert(1)' } }), false);
  assert.equal(validateOriginHeader({ headers: { origin: 'file:///etc/passwd' } }), false);
  assert.equal(validateOriginHeader({ headers: { origin: 'data:text/html,evil' } }), false);

  // Malformed or external origins
  assert.equal(validateOriginHeader({ headers: { origin: 'http://evil.com' } }), false);
  assert.equal(validateOriginHeader({ headers: { origin: 'http://attacker.com:3000' } }), false);
  assert.equal(validateOriginHeader({ headers: { origin: 'not-a-valid-url' } }), false);
});
