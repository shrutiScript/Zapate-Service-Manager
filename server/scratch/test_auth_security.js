import http from 'http';

function request(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        let parsed = null;
        try { parsed = JSON.parse(body); } catch (_) { parsed = body; }
        resolve({ status: res.statusCode, data: parsed, headers: res.headers });
      });
    });
    req.on('error', reject);
    if (data) {
      req.write(typeof data === 'string' ? data : JSON.stringify(data));
    }
    req.end();
  });
}

async function runTests() {
  console.log('--- STARTING AUTHENTICATION & ROUTE PROTECTION TESTS ---');
  let passed = 0;
  let failed = 0;

  function assert(condition, testName, detail = '') {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName} - ${detail}`);
      failed++;
    }
  }

  // 1. Unauthenticated checks on protected routes
  const protectedEndpoints = [
    '/api/v1/repairs',
    '/api/v1/customers',
    '/api/v1/inventory',
    '/api/v1/pos/invoices',
    '/api/v1/warranties',
    '/api/v1/payments',
    '/api/v1/reports/summary',
    '/api/v1/settings',
    '/api/v1/admin/shops',
    '/api/v1/auth/me'
  ];

  for (const endpoint of protectedEndpoints) {
    try {
      const res = await request({
        hostname: 'localhost',
        port: 5000,
        path: endpoint,
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      assert(
        res.status === 401,
        `Unauthenticated GET ${endpoint} must return 401 Unauthorized`,
        `Got status: ${res.status}`
      );
    } catch (e) {
      console.error(`Error requesting ${endpoint}:`, e.message);
      failed++;
    }
  }

  // 2. Empty login credentials check
  try {
    const res = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/v1/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    }, { identifier: '', password: '' });

    assert(
      res.status === 400,
      'Login with empty credentials must return 400 Bad Request',
      `Got status: ${res.status}`
    );
  } catch (e) {
    console.error('Error on empty login:', e.message);
    failed++;
  }

  // 3. Invalid credentials check
  try {
    const res = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/v1/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    }, { identifier: 'fake_user@domain.com', password: 'wrong_password_123' });

    assert(
      res.status === 401,
      'Login with invalid credentials must return 401 Unauthorized',
      `Got status: ${res.status}`
    );
    assert(
      res.data?.message === 'Invalid User ID or Password.',
      'Failed login message must strictly equal "Invalid User ID or Password."',
      `Got message: "${res.data?.message}"`
    );
  } catch (e) {
    console.error('Error on invalid login:', e.message);
    failed++;
  }

  // 4. Valid credentials check
  let validToken = null;
  try {
    const res = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/v1/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    }, { identifier: 'admin@gmail.com', password: 'admin@123' });

    assert(
      res.status === 200,
      'Login with valid credentials must return 200 OK',
      `Got status: ${res.status}`
    );
    validToken = res.data?.token || res.data?.data?.token;
    assert(
      !!validToken,
      'Login response must return JWT token',
      `Token present: ${!!validToken}`
    );
  } catch (e) {
    console.error('Error on valid login:', e.message);
    failed++;
  }

  // 5. Authenticated access using Bearer token
  if (validToken) {
    try {
      const res = await request({
        hostname: 'localhost',
        port: 5000,
        path: '/api/v1/auth/me',
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${validToken}`
        },
      });
      assert(
        res.status === 200,
        'GET /api/v1/auth/me with valid Bearer token must return 200 OK',
        `Got status: ${res.status}`
      );
    } catch (e) {
      console.error('Error on authenticated request:', e.message);
      failed++;
    }
  }

  console.log(`\nTEST SUMMARY: ${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
}

runTests();
