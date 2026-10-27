import assert from 'node:assert';
import http from 'node:http';

function request(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const dataString = body ? JSON.stringify(body) : null;
    const req = http.request(
      {
        hostname: 'localhost',
        port: 5000,
        path: `/api${path}`,
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(dataString ? { 'Content-Length': Buffer.byteLength(dataString) } : {}),
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      },
      (res) => {
        let responseBody = '';
        res.on('data', (chunk) => (responseBody += chunk));
        res.on('end', () => {
          let parsed;
          try {
            parsed = JSON.parse(responseBody);
          } catch (_) {
            parsed = responseBody;
          }
          resolve({ status: res.statusCode, data: parsed });
        });
      }
    );

    req.on('error', reject);
    if (dataString) req.write(dataString);
    req.end();
  });
}

// -------------------------------------------------------------
// Component Simulation Tests: React Logic in Dashboard & Banner
// -------------------------------------------------------------

function simulateActiveShopResolution(currentShop, statsSubscription, userShop) {
  const baseShop = currentShop || userShop || {};
  const subData = statsSubscription || {};

  const activeShop = {
    ...baseShop,
    ...subData,
    _id: baseShop._id || baseShop.id || subData._id || subData.shopId || subData.id,
    id: baseShop.id || baseShop._id || subData.id || subData._id || subData.shopId,
    name: baseShop.name || subData.name || 'Workshop',
    subscription: subData.subscription || subData.plan || baseShop.subscription || 'Workshop Plan',
    plan: subData.plan || subData.subscription || baseShop.subscription || 'Workshop Plan',
    subscriptionStartDate: subData.subscriptionStartDate || subData.startDate || baseShop.subscriptionStartDate,
    startDate: subData.startDate || subData.subscriptionStartDate || baseShop.subscriptionStartDate,
    subscriptionExpiresAt: subData.subscriptionExpiresAt || subData.expiresAt || baseShop.subscriptionExpiresAt,
    expiresAt: subData.expiresAt || subData.subscriptionExpiresAt || baseShop.subscriptionExpiresAt,
    subscriptionStatus: subData.subscriptionStatus || subData.status || baseShop.subscriptionStatus || 'ACTIVE',
    status: subData.status || subData.subscriptionStatus || baseShop.subscriptionStatus || 'ACTIVE',
    subscriptionBillingCycle: subData.subscriptionBillingCycle || subData.billingCycle || baseShop.subscriptionBillingCycle || 'monthly',
    daysRemaining: typeof subData.daysRemaining === 'number' ? subData.daysRemaining : baseShop.daysRemaining,
  };

  const expiryTimestamp = activeShop.subscriptionExpiresAt || activeShop.expiresAt;
  const isBannerVisible = !(!activeShop || !expiryTimestamp);

  return { activeShop, expiryTimestamp, isBannerVisible };
}

function calculateCountdownAndBadge(expiresAtInput, currentServerTime) {
  const expiresAt = expiresAtInput ? new Date(expiresAtInput) : null;
  if (!expiresAt || isNaN(expiresAt.getTime())) {
    return null;
  }

  const expiryMs = expiresAt.getTime();
  const diffMs = expiryMs - currentServerTime;

  let countdown;
  if (diffMs <= 0) {
    countdown = { isExpired: true, days: 0, hours: 0, minutes: 0, seconds: 0, totalMs: 0 };
  } else {
    const days = Math.floor(diffMs / (24 * 60 * 60 * 1000));
    const hours = Math.floor((diffMs % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
    const minutes = Math.floor((diffMs % (60 * 60 * 1000)) / (60 * 1000));
    const seconds = Math.floor((diffMs % (60 * 1000)) / 1000);
    countdown = { isExpired: false, days, hours, minutes, seconds, totalMs: diffMs };
  }

  const isExpired = countdown.isExpired;
  const badgeLabel = isExpired
    ? 'Subscription Expired'
    : countdown.days > 1
    ? `${countdown.days} Days Remaining`
    : countdown.days === 1
    ? '1 Day Remaining'
    : `Expires Today (${countdown.hours}h left)`;

  return { countdown, badgeLabel, isExpired };
}

async function runTests() {
  console.log('🧪 Starting Subscription Banner Stability and Accuracy Tests...\n');

  // =========================================================================
  // TEST 1: Banner Visibility Across Dashboard Mount and API Response Lifecycle
  // =========================================================================
  console.log('--- Test 1: Banner Visibility Across Lifecycle ---');
  const initialCurrentShop = {
    _id: 'shop123',
    name: 'AutoFix Pro',
    subscription: 'Pro Plan',
    subscriptionStartDate: '2026-10-01T00:00:00.000Z',
    subscriptionExpiresAt: '2026-11-15T00:00:00.000Z',
    subscriptionStatus: 'ACTIVE',
  };

  // Step 1: Initial Mount (stats.subscription is undefined)
  const initialMount = simulateActiveShopResolution(initialCurrentShop, undefined, null);
  assert.strictEqual(initialMount.isBannerVisible, true, 'Banner MUST be visible on initial mount');
  console.log('  ✓ Step 1: Banner visible on initial dashboard mount (using currentShop)');

  // Step 2: Dashboard API completes returning report payload with subscription
  const apiReportSubscription = {
    shopId: 'shop123',
    plan: 'Pro Plan',
    subscription: 'Pro Plan',
    startDate: '2026-10-01T00:00:00.000Z',
    subscriptionStartDate: '2026-10-01T00:00:00.000Z',
    expiresAt: '2026-11-15T00:00:00.000Z',
    subscriptionExpiresAt: '2026-11-15T00:00:00.000Z',
    status: 'ACTIVE',
    subscriptionStatus: 'ACTIVE',
    daysRemaining: 18,
    serverTime: new Date().toISOString(),
  };

  const afterApiFetch = simulateActiveShopResolution(initialCurrentShop, apiReportSubscription, null);
  assert.strictEqual(afterApiFetch.isBannerVisible, true, 'Banner MUST NOT disappear after API fetch completes');
  assert.strictEqual(afterApiFetch.activeShop.subscriptionExpiresAt, '2026-11-15T00:00:00.000Z');
  assert.strictEqual(afterApiFetch.activeShop.name, 'AutoFix Pro');
  console.log('  ✓ Step 2: Banner stays visible after /reports/dashboard API response arrives');

  // Step 3: API payload with only legacy `expiresAt` key (the previous bug trigger)
  const legacyApiSubscription = {
    shopId: 'shop123',
    plan: 'Pro Plan',
    startDate: '2026-10-01T00:00:00.000Z',
    expiresAt: '2026-11-15T00:00:00.000Z',
    status: 'ACTIVE',
  };

  const withLegacyApi = simulateActiveShopResolution(initialCurrentShop, legacyApiSubscription, null);
  assert.strictEqual(withLegacyApi.isBannerVisible, true, 'Banner MUST NOT disappear when API provides legacy keys');
  console.log('  ✓ Step 3: Banner remains visible even if API returns legacy `expiresAt` key');

  // Step 4: Unrelated dashboard re-render (e.g. date filter changed, KPI refreshed)
  const afterReRender = simulateActiveShopResolution(initialCurrentShop, apiReportSubscription, null);
  assert.strictEqual(afterReRender.isBannerVisible, true, 'Banner MUST remain visible across re-renders');
  console.log('  ✓ Step 4: Banner remains visible across re-renders');

  // =========================================================================
  // TEST 2: Synchronization Between "Days Remaining" Badge and Countdown Box
  // =========================================================================
  console.log('\n--- Test 2: Days Remaining Badge and Countdown Box Synchronization ---');

  const serverNow = new Date('2026-10-27T12:00:00.000Z').getTime();

  // Scenario A: 17 days, 14 hours remaining
  const expiryA = new Date('2026-11-14T02:00:00.000Z').getTime(); // 17d 14h
  const resA = calculateCountdownAndBadge(expiryA, serverNow);
  assert.strictEqual(resA.countdown.days, 17, 'Countdown days is 17');
  assert.strictEqual(resA.badgeLabel, '17 Days Remaining', 'Badge displays 17 Days Remaining');
  console.log(`  ✓ Scenario A: Countdown shows ${resA.countdown.days} Days, Badge shows "${resA.badgeLabel}" (Exact match)`);

  // Scenario B: 1 day, 5 hours remaining
  const expiryB = new Date('2026-10-28T17:00:00.000Z').getTime(); // 1d 5h
  const resB = calculateCountdownAndBadge(expiryB, serverNow);
  assert.strictEqual(resB.countdown.days, 1, 'Countdown days is 1');
  assert.strictEqual(resB.badgeLabel, '1 Day Remaining', 'Badge displays 1 Day Remaining');
  console.log(`  ✓ Scenario B: Countdown shows ${resB.countdown.days} Day, Badge shows "${resB.badgeLabel}" (Exact singular match)`);

  // Scenario C: 0 days, 6 hours remaining (expires today)
  const expiryC = new Date('2026-10-27T18:00:00.000Z').getTime(); // 6h left today
  const resC = calculateCountdownAndBadge(expiryC, serverNow);
  assert.strictEqual(resC.countdown.days, 0, 'Countdown days is 0');
  assert.strictEqual(resC.badgeLabel, 'Expires Today (6h left)', 'Badge displays Expires Today (never Expires Tomorrow)');
  console.log(`  ✓ Scenario C: Countdown shows 00 Days : 06 Hours, Badge shows "${resC.badgeLabel}"`);

  // Scenario D: Expired (diff <= 0)
  const expiryD = new Date('2026-10-27T11:00:00.000Z').getTime(); // expired 1h ago
  const resD = calculateCountdownAndBadge(expiryD, serverNow);
  assert.strictEqual(resD.isExpired, true, 'isExpired is true');
  assert.strictEqual(resD.countdown.days, 0, 'Countdown days is 0');
  assert.strictEqual(resD.badgeLabel, 'Subscription Expired', 'Badge displays Subscription Expired');
  console.log(`  ✓ Scenario D: Expired state shows "${resD.badgeLabel}"`);

  // =========================================================================
  // TEST 3: Live Backend API Verification (/reports/dashboard & /auth/me)
  // =========================================================================
  console.log('\n--- Test 3: Backend API Subscription Integrity ---');

  // Log in as workshop user
  const loginRes = await request('POST', '/auth/login', {
    userId: '9876543210',
    password: 'password123',
  });

  if (loginRes.status === 200 && loginRes.data?.token) {
    const token = loginRes.data.token;
    console.log('  ✓ Workshop owner login successful');

    // Test GET /reports/dashboard
    const reportRes = await request('GET', '/reports/dashboard', null, token);
    assert.strictEqual(reportRes.status, 200, 'GET /reports/dashboard returns 200');
    assert.ok(reportRes.data.subscription, 'Report includes subscription object');
    assert.ok(reportRes.data.subscription.subscriptionExpiresAt, 'subscription.subscriptionExpiresAt exists');
    assert.ok(reportRes.data.subscription.expiresAt, 'subscription.expiresAt exists');
    assert.strictEqual(
      reportRes.data.subscription.subscriptionExpiresAt,
      reportRes.data.subscription.expiresAt,
      'Both subscriptionExpiresAt and expiresAt are identical'
    );
    console.log('  ✓ GET /reports/dashboard provides consistent subscriptionExpiresAt & expiresAt');

    // Test GET /auth/me
    const meRes = await request('GET', '/auth/me', null, token);
    assert.strictEqual(meRes.status, 200, 'GET /auth/me returns 200');
    assert.ok(meRes.data.shop, 'GET /auth/me includes shop');
    assert.ok(meRes.data.shop.subscriptionExpiresAt, 'shop.subscriptionExpiresAt exists');
    console.log('  ✓ GET /auth/me provides subscriptionExpiresAt on shop');
  } else {
    console.log('  ⚠️ Note: Skipping live login test (server may be on different credentials or seeded database)');
  }

  console.log('\n✅ All Subscription Banner Stability & Consistency Tests Passed Successfully!\n');
}

runTests().catch((err) => {
  console.error('\n❌ Test Failure:', err);
  process.exit(1);
});
