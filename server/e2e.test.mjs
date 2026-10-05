import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { server } from './index.mjs';

const PORT = 4055;
const BASE_URL = `http://127.0.0.1:${PORT}`;

test('E2E Gateway & Honcho Live Integration Suite', async (t) => {
  // Start server
  await new Promise((resolve) => server.listen(PORT, '127.0.0.1', resolve));

  t.after(() => {
    return new Promise((resolve) => server.close(resolve));
  });

  await t.test('1. Static assets and SPA routing fallback', async () => {
    const rootRes = await fetch(`${BASE_URL}/`);
    assert.equal(rootRes.status, 200);
    assert.equal(rootRes.headers.get('content-type')?.includes('text/html'), true);
    const html = await rootRes.text();
    assert.equal(html.includes('Honcho Cognition Studio'), true);

    // Client-side route should fallback to index.html
    const routeRes = await fetch(`${BASE_URL}/sessions/custom-view`);
    assert.equal(routeRes.status, 200);
    assert.equal(routeRes.headers.get('content-type')?.includes('text/html'), true);

    // Non-existent static asset should return 404 NOT fallback to index.html
    const missingAssetRes = await fetch(`${BASE_URL}/assets/missing-file.js`);
    assert.equal(missingAssetRes.status, 404);
  });

  await t.test('2. Security headers are applied to all responses', async () => {
    const res = await fetch(`${BASE_URL}/`);
    assert.equal(res.headers.get('x-content-type-options'), 'nosniff');
    assert.equal(res.headers.get('x-frame-options'), 'DENY');
    assert.equal(res.headers.get('referrer-policy'), 'strict-origin-when-cross-origin');
  });

  await t.test('3. Security allowlist blocks unauthorized routes, methods, and traversal', async () => {
    const disallowedMethod = await fetch(`${BASE_URL}/api/v3/workspaces`, { method: 'DELETE' });
    assert.equal(disallowedMethod.status, 403);

    const traversal = await fetch(`${BASE_URL}/api/v3/workspaces/../admin`, { method: 'POST', body: '{}' });
    assert.equal(traversal.status, 403);

    const arbitrary = await fetch(`${BASE_URL}/api/some/random/endpoint`);
    assert.equal(arbitrary.status, 403);

    // Out of scope schedule_dream rejected
    const dreamRes = await fetch(`${BASE_URL}/api/v3/workspaces/test/schedule_dream`, { method: 'POST', body: '{}' });
    assert.equal(dreamRes.status, 403);
  });

  await t.test('4. Host and Origin validation against DNS rebinding and CSRF', async () => {
    // Bad host (via raw http.request because fetch overrides Host)
    const badHostStatus = await new Promise((resolve) => {
      const req = http.request({
        hostname: '127.0.0.1',
        port: PORT,
        path: '/api/health',
        headers: { Host: 'attacker.evil.com' },
      }, (res) => {
        resolve(res.statusCode);
      });
      req.end();
    });
    assert.equal(badHostStatus, 403);

    // Bad origin
    const badOriginRes = await fetch(`${BASE_URL}/api/health`, {
      headers: { Origin: 'http://evil.com' },
    });
    assert.equal(badOriginRes.status, 403);
  });

  await t.test('5. Request body size limit enforcement', async () => {
    const oversizedBody = 'A'.repeat(3 * 1024 * 1024); // 3MB > 2MB limit
    const res = await fetch(`${BASE_URL}/api/v3/workspaces/list?page=1&size=10&reverse=false`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: oversizedBody,
    });
    assert.equal(res.status, 413);
  });

  await t.test('6. Live Honcho /health endpoint smoke check', async () => {
    const res = await fetch(`${BASE_URL}/api/health`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.status, 'ok');
  });

  await t.test('7. Live Honcho workspaces list query pagination', async () => {
    const res = await fetch(`${BASE_URL}/api/v3/workspaces/list?page=1&size=10&reverse=false`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{}',
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(typeof body.total, 'number');
    assert.equal(Array.isArray(body.items), true);
    assert.equal(body.page, 1);
  });

  await t.test('8. Dedicated test workspace lifecycle (creation, batch message, verification)', async () => {
    // Generate a unique workspace ID dedicated strictly to this test run
    const testWsId = `hcs-verify-${Date.now()}`;

    // Create test workspace
    const wsRes = await fetch(`${BASE_URL}/api/v3/workspaces`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: testWsId,
        metadata: { purpose: 'automated-hcs-e2e-verification' },
      }),
    });
    assert.equal([200, 201].includes(wsRes.status), true, `Failed to create workspace: ${await wsRes.text()}`);

    // Create test peer
    const peerRes = await fetch(`${BASE_URL}/api/v3/workspaces/${testWsId}/peers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: 'e2e-tester',
        metadata: { role: 'integration-agent' },
      }),
    });
    assert.equal([200, 201].includes(peerRes.status), true, `Failed to create peer: ${await peerRes.text()}`);

    // Create test session
    const sessRes = await fetch(`${BASE_URL}/api/v3/workspaces/${testWsId}/sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: 'sess-e2e-01',
        peers: { 'e2e-tester': {} },
      }),
    });
    assert.equal([200, 201].includes(sessRes.status), true, `Failed to create session: ${await sessRes.text()}`);

    // Create batch messages (MessageBatchCreate)
    const msgRes = await fetch(`${BASE_URL}/api/v3/workspaces/${testWsId}/sessions/sess-e2e-01/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [
          {
            content: 'Test message for Honcho Cognition Studio verification',
            peer_id: 'e2e-tester',
            metadata: { step: 'e2e-step-1' },
          },
        ],
      }),
    });
    const createdMsgs = await msgRes.json();
    assert.equal([200, 201].includes(msgRes.status), true, `Failed: ${JSON.stringify(createdMsgs)}`);
    assert.equal(Array.isArray(createdMsgs), true);
    assert.equal(createdMsgs.length, 1);
    assert.equal(createdMsgs[0].peer_id, 'e2e-tester');

    // List messages to confirm persistence
    const listMsgRes = await fetch(
      `${BASE_URL}/api/v3/workspaces/${testWsId}/sessions/sess-e2e-01/messages/list?page=1&size=10&reverse=false`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{}',
      }
    );
    assert.equal(listMsgRes.status, 200);
    const msgListBody = await listMsgRes.json();
    assert.equal(msgListBody.total >= 1, true);
    assert.equal(msgListBody.items[0].content, 'Test message for Honcho Cognition Studio verification');

    // Verify queue status on dedicated test workspace
    const queueRes = await fetch(`${BASE_URL}/api/v3/workspaces/${testWsId}/queue/status`);
    assert.equal(queueRes.status, 200);
    const queueBody = await queueRes.json();
    assert.equal(typeof queueBody.total_work_units, 'number');
  });
});
