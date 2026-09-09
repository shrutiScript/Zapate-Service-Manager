import http from 'http';

function request(options, data = null) {
  return new Promise((resolve, reject) => {
    const payload = data ? (typeof data === 'string' ? data : JSON.stringify(data)) : null;
    const reqOptions = { ...options, headers: { ...(options.headers || {}) } };
    if (payload) {
      reqOptions.headers['Content-Length'] = Buffer.byteLength(payload);
    }
    const req = http.request(reqOptions, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        let parsed = null;
        try { parsed = JSON.parse(body); } catch (_) { parsed = body; }
        resolve({ status: res.statusCode, data: parsed, headers: res.headers });
      });
    });
    req.on('error', reject);
    if (payload) {
      req.write(payload);
    }
    req.end();
  });
}

async function runTests() {
  console.log('--- STARTING SUPER ADMIN ACTIVITY & AUDIT LOG TESTS ---');
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

  // 1. Super Admin Login
  let adminToken = null;
  try {
    const res = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/v1/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    }, { identifier: 'admin@gmail.com', password: 'admin@123' });

    assert(res.status === 200, 'Super Admin login must return 200 OK');
    adminToken = res.data?.token || res.data?.data?.token;
    assert(!!adminToken, 'Super Admin token must be present');
  } catch (e) {
    console.error('Login error:', e.message);
    failed++;
  }

  // 2. Fetch Activity Logs
  try {
    const res = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/v1/admin/activity',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`,
      },
    });

    assert(res.status === 200, 'GET /api/v1/admin/activity returns 200 OK', `Status: ${res.status}`);
    const logs = res.data?.data?.logs || res.data?.logs;
    const pagination = res.data?.data?.pagination || res.data?.pagination;
    const metrics = res.data?.data?.metrics || res.data?.metrics;

    assert(Array.isArray(logs), 'Response includes array of activity logs');
    assert(!!pagination, 'Response includes pagination metadata');
    assert(!!metrics, 'Response includes KPI summary metrics');

    // Check if the Super Admin login was logged
    const loginLog = logs.find((l) => l.action === 'LOGIN' && l.category === 'Authentication');
    assert(!!loginLog, 'Super Admin LOGIN action was automatically recorded in audit logs');
  } catch (e) {
    console.error('Activity logs fetch error:', e.message);
    failed++;
  }

  // 3. Create Workshop via Super Admin
  let testShopId = null;
  const uniqueCode = `TEST-${Date.now().toString().slice(-4)}`;
  const testEmail = `testowner_${Date.now()}@workshop.com`;

  try {
    const res = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/v1/shops',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`,
      },
    }, {
      code: uniqueCode,
      name: 'Gurukul Repairing Shop',
      ownerName: 'Ramesh Kumar',
      ownerEmail: testEmail,
      ownerMobile: `98${Date.now().toString().slice(-8)}`,
      city: 'Mumbai',
      state: 'Maharashtra',
    });

    assert(res.status === 201 || res.status === 200, 'Super Admin creates workshop (200/201)', `Status: ${res.status}`);
    const shop = res.data?.data || res.data;
    testShopId = shop?._id;
    assert(!!testShopId, 'Created workshop ID is present');
  } catch (e) {
    console.error('Create workshop error:', e.message);
    failed++;
  }

  // 4. Create User for that Workshop
  let shopOwnerToken = null;
  try {
    const res = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/v1/users',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`,
      },
    }, {
      name: 'Ramesh Kumar',
      email: testEmail,
      mobile: `98${Date.now().toString().slice(-8)}`,
      password: 'OwnerPassword@123',
      role: 'SHOP_OWNER',
      shopId: testShopId,
      status: 'ACTIVE',
    });

    assert(res.status === 201 || res.status === 200, 'Super Admin creates shop owner', `Status: ${res.status}`);
  } catch (e) {
    console.error('Create user error:', e.message);
    failed++;
  }

  // 5. Login as the Shop Owner
  try {
    const res = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/v1/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    }, { identifier: testEmail, password: 'OwnerPassword@123' });

    assert(res.status === 200, 'Shop Owner login returns 200 OK');
    shopOwnerToken = res.data?.token || res.data?.data?.token;
    assert(!!shopOwnerToken, 'Shop Owner token acquired');
  } catch (e) {
    console.error('Shop Owner login error:', e.message);
    failed++;
  }

  // 6. Block Workshop as Super Admin
  try {
    const res = await request({
      hostname: 'localhost',
      port: 5000,
      path: `/api/v1/shops/${testShopId}/block`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`,
      },
    }, { reason: 'Policy non-compliance and suspicious activity' });

    assert(res.status === 200, 'POST /shops/:id/block returns 200 OK', `Status: ${res.status}`);
    const shopData = res.data?.data || res.data;
    assert(shopData?.status === 'BLOCKED', 'Shop status is set to BLOCKED');
  } catch (e) {
    console.error('Block workshop error:', e.message);
    failed++;
  }

  // 7. Verify Shop Owner Token is Invalidated (Returns 401 with exact message)
  try {
    const res = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/v1/repairs',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${shopOwnerToken}`,
      },
    });

    assert(res.status === 401, 'Blocked workshop active session must return 401 Unauthorized', `Got status: ${res.status}`);
    const msg = res.data?.message || '';
    assert(
      msg.includes('blocked by the administrator') && msg.includes('logged out'),
      'Must return message: "Your shop has been blocked by the administrator. You have been logged out. Please contact support."',
      `Got: "${msg}"`
    );
  } catch (e) {
    console.error('Session invalidation check error:', e.message);
    failed++;
  }

  // 8. Verify Future Login Attempts are Rejected with 403
  try {
    const res = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/v1/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    }, { identifier: testEmail, password: 'OwnerPassword@123' });

    assert(res.status === 403, 'Login for blocked workshop must return 403 Forbidden', `Got status: ${res.status}`);
    const msg = res.data?.message || '';
    assert(
      msg.includes('blocked by the administrator'),
      'Must return message: "Your shop account has been blocked by the administrator. Please contact support for more information."',
      `Got: "${msg}"`
    );
  } catch (e) {
    console.error('Blocked login attempt error:', e.message);
    failed++;
  }

  // 9. Unblock Workshop as Super Admin
  try {
    const res = await request({
      hostname: 'localhost',
      port: 5000,
      path: `/api/v1/shops/${testShopId}/unblock`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`,
      },
    }, { reason: 'Compliance issues resolved' });

    assert(res.status === 200, 'POST /shops/:id/unblock returns 200 OK', `Status: ${res.status}`);
    const shopData = res.data?.data || res.data;
    assert(shopData?.status === 'ACTIVE', 'Shop status is restored to ACTIVE');
  } catch (e) {
    console.error('Unblock workshop error:', e.message);
    failed++;
  }

  // 10. Verify Shop Owner Can Login Again
  try {
    const res = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/v1/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    }, { identifier: testEmail, password: 'OwnerPassword@123' });

    assert(res.status === 200, 'Shop Owner can log in after unblocking (200 OK)');
  } catch (e) {
    console.error('Re-login after unblock error:', e.message);
    failed++;
  }

  // 11. Create and Update Subscription Plan (Testing Diff Logging)
  let planId = null;
  try {
    const createRes = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/v1/admin/plans',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`,
      },
    }, {
      name: `Special Plan ${Date.now().toString().slice(-4)}`,
      price: 1999,
      features: ['Feature A', 'Feature B'],
    });

    assert(createRes.status === 201 || createRes.status === 200, 'Create plan returns 201/200');
    planId = createRes.data?.data?._id || createRes.data?._id;

    if (planId) {
      const updateRes = await request({
        hostname: 'localhost',
        port: 5000,
        path: `/api/v1/admin/plans/${planId}`,
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`,
        },
      }, {
        price: 2499,
      });

      assert(updateRes.status === 200, 'Update plan returns 200 OK');
    }
  } catch (e) {
    console.error('Plan test error:', e.message);
    failed++;
  }

  // 12. Verify Activity Logs contain the created logs with diffs
  try {
    const res = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/v1/admin/activity?limit=50',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`,
      },
    });

    const logs = res.data?.data?.logs || res.data?.logs || [];
    const blockLog = logs.find((l) => l.action === 'WORKSHOP_BLOCKED');
    const unblockLog = logs.find((l) => l.action === 'WORKSHOP_UNBLOCKED');
    const planUpdateLog = logs.find((l) => l.action === 'PLAN_UPDATED');

    assert(!!blockLog, 'WORKSHOP_BLOCKED action is present in audit logs');
    assert(!!unblockLog, 'WORKSHOP_UNBLOCKED action is present in audit logs');
    assert(!!planUpdateLog, 'PLAN_UPDATED action is present in audit logs');
    assert(
      planUpdateLog?.changedFields?.includes('price'),
      'PLAN_UPDATED log has "price" in changedFields array',
      `Got: ${JSON.stringify(planUpdateLog?.changedFields)}`
    );
  } catch (e) {
    console.error('Audit diff verification error:', e.message);
    failed++;
  }

  console.log(`\nTEST SUMMARY: ${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
}

runTests();
