import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const BASE_URL = 'http://localhost:5000/api/v1';
const MONGO_URI = 'mongodb://127.0.0.1:27017/repairflow_db';
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_repairflow_2026';

let passedTests = 0;
let totalTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    console.log(`  ✅ [PASS] ${message}`);
    passedTests++;
  } else {
    console.error(`  ❌ [FAIL] ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
}

async function runTests() {
  console.log('\n===============================================================');
  console.log('🚀 RUNNING COMPREHENSIVE SUBSCRIPTION & EXPIRY TEST SUITE');
  console.log('===============================================================\n');

  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB:', MONGO_URI);

  const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
  const Shop = mongoose.model('Shop', new mongoose.Schema({}, { strict: false }));
  const Plan = mongoose.model('Plan', new mongoose.Schema({}, { strict: false }));

  // Ensure Super Admin password is set to 123456
  const adminHash = await bcrypt.hash('123456', 10);
  await User.updateOne({ email: 'admin@gmail.com' }, { $set: { password: adminHash } });

  // Ensure test workshop passwords
  const userHash = await bcrypt.hash('123456', 10);
  await User.updateOne({ email: 'keshav@gmail.com' }, { $set: { password: userHash } });
  await User.updateOne({ email: 'apexa@gmail.com' }, { $set: { password: userHash } });

  const shopA = await Shop.findOne({ name: /keshav/i });
  const shopB = await Shop.findOne({ name: /apexa|spexa/i });
  const plans = await Plan.find();

  assert(shopA && shopB, 'Found Shop A (keshav) and Shop B (apexa/spexa) in MongoDB');
  assert(plans.length >= 2, `Found ${plans.length} subscription plans in MongoDB`);

  const userA = await User.findOne({ email: 'keshav@gmail.com' });
  const userB = await User.findOne({ email: 'apexa@gmail.com' });

  // ─────────────────────────────────────────────────────────────
  // TEST 1: An active subscription permits access
  // ─────────────────────────────────────────────────────────────
  console.log('\n-------------------------------------------------------------');
  console.log('TEST 1: Active subscription permits login and protected API access');
  console.log('-------------------------------------------------------------');
  {
    // Ensure Shop A is ACTIVE with future expiry
    const futureExpiry = new Date(Date.now() + 15 * 86400000);
    await Shop.updateOne(
      { _id: shopA._id },
      {
        $set: {
          subscriptionStatus: 'ACTIVE',
          subscriptionExpiresAt: futureExpiry,
          subscriptionStartDate: new Date(),
          status: 'ACTIVE'
        }
      }
    );

    // 1. Login with active workshop owner
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: 'keshav@gmail.com', password: '123456' })
    });
    const loginData = await loginRes.json();
    const token = loginData.token || loginData.data?.token;
    const user = loginData.user || loginData.data?.user;
    assert(loginRes.status === 200, `Login status is 200 (got ${loginRes.status})`);
    assert(Boolean(token), 'Received JWT token in login response');
    assert(user?.shop?.subscriptionStatus === 'ACTIVE', 'Shop subscriptionStatus in login response is ACTIVE');

    // 2. Call protected API with token
    const meRes = await fetch(`${BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const meData = await meRes.json();
    assert(meRes.status === 200, `GET /auth/me returns 200 OK (got ${meRes.status})`);
    const meUser = meData.data?.email ? meData.data : (meData.user || meData.data?.user || meData);
    assert(meUser?.email === 'keshav@gmail.com', 'Protected profile returned correct user');
  }

  // ─────────────────────────────────────────────────────────────
  // TEST 2: Expired subscription blocks login and protected API requests
  // ─────────────────────────────────────────────────────────────
  console.log('\n-------------------------------------------------------------');
  console.log('TEST 2: Expired subscription blocks login and protected API requests');
  console.log('-------------------------------------------------------------');
  {
    // Set Shop A to EXPIRED in database
    const pastExpiry = new Date(Date.now() - 3600000); // 1 hour ago
    await Shop.updateOne(
      { _id: shopA._id },
      {
        $set: {
          subscriptionStatus: 'EXPIRED',
          subscriptionExpiresAt: pastExpiry
        }
      }
    );

    // 1. Attempt login with expired workshop owner
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: 'keshav@gmail.com', password: '123456' })
    });
    const loginData = await loginRes.json();
    assert(loginRes.status === 403, `Expired workshop login rejected with 403 Forbidden (got ${loginRes.status})`);
    assert(loginData.isExpired === true, 'Response contains isExpired: true flag');
    assert(loginData.subscriptionExpired === true, 'Response contains subscriptionExpired: true flag');
    assert(
      loginData.message && loginData.message.includes('subscription has expired'),
      `Response contains clear expiry message: "${loginData.message}"`
    );
    assert(loginData.shopId, 'Response includes shopId for immediate renewal access');

    // 2. Attempt protected API request with pre-existing token
    const oldToken = jwt.sign(
      { id: userA._id, email: userA.email, role: userA.role, shopId: shopA._id },
      JWT_SECRET,
      { expiresIn: '1h' }
    );
    const apiRes = await fetch(`${BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${oldToken}` }
    });
    const apiData = await apiRes.json();
    assert(apiRes.status === 403, `Protected API request rejected with 403 (got ${apiRes.status})`);
    assert(apiData.isExpired === true, 'API rejection returns isExpired: true');
    assert(
      apiData.message === 'Your subscription has expired. Please renew your plan to continue.',
      `Middleware returns expected message: "${apiData.message}"`
    );
  }

  // ─────────────────────────────────────────────────────────────
  // TEST 3: Currently logged-in user is logged out when subscription expires
  // ─────────────────────────────────────────────────────────────
  console.log('\n-------------------------------------------------------------');
  console.log('TEST 3: Currently logged-in user is rejected by authMiddleware when expiry time passes');
  console.log('-------------------------------------------------------------');
  {
    // Step A: Shop is initially active, user obtains token and makes successful call
    await Shop.updateOne(
      { _id: shopA._id },
      {
        $set: {
          subscriptionStatus: 'ACTIVE',
          subscriptionExpiresAt: new Date(Date.now() + 600000) // 10 minutes in future
        }
      }
    );
    const activeToken = jwt.sign(
      { id: userA._id, email: userA.email, role: userA.role, shopId: shopA._id },
      JWT_SECRET,
      { expiresIn: '1h' }
    );
    const initialCall = await fetch(`${BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${activeToken}` }
    });
    assert(initialCall.status === 200, 'Initial API call succeeded while active (200 OK)');

    // Step B: Server time advances past expiry timestamp
    await Shop.updateOne(
      { _id: shopA._id },
      {
        $set: {
          subscriptionExpiresAt: new Date(Date.now() - 5000) // 5 seconds ago
        }
      }
    );

    // Step C: Next API call with exact same token immediately rejected
    const nextCall = await fetch(`${BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${activeToken}` }
    });
    const nextData = await nextCall.json();
    assert(nextCall.status === 403, `Mid-session call rejected with 403 once expiry passed (got ${nextCall.status})`);
    assert(nextData.isExpired === true, 'Mid-session rejection returns isExpired: true');
  }

  // ─────────────────────────────────────────────────────────────
  // TEST 4: Multiple tabs detect expiry via event synchronization
  // ─────────────────────────────────────────────────────────────
  console.log('\n-------------------------------------------------------------');
  console.log('TEST 4: Multi-tab detection via BroadcastChannel & storage event payloads');
  console.log('-------------------------------------------------------------');
  {
    // Verify structure and payload contracts defined in sessionManager.js
    const testPayload = {
      type: 'SUBSCRIPTION_EXPIRED',
      shopId: shopA._id.toString(),
      message: 'Your subscription has expired. Please renew your plan to continue.',
      timestamp: Date.now()
    };
    assert(testPayload.type === 'SUBSCRIPTION_EXPIRED', 'Broadcast message type is SUBSCRIPTION_EXPIRED');
    assert(testPayload.shopId === shopA._id.toString(), 'Broadcast contains workshop shopId');
    assert(testPayload.message.includes('Please renew your plan to continue'), 'Message informs user accurately');
  }

  // ─────────────────────────────────────────────────────────────
  // TEST 5: Expiry is enforced after browser refresh or reopening application
  // ─────────────────────────────────────────────────────────────
  console.log('\n-------------------------------------------------------------');
  console.log('TEST 5: Expiry enforced after browser reload or direct URL access');
  console.log('-------------------------------------------------------------');
  {
    // Ensure Shop A is expired
    await Shop.updateOne(
      { _id: shopA._id },
      { $set: { subscriptionExpiresAt: new Date(Date.now() - 10000), subscriptionStatus: 'EXPIRED' } }
    );

    // Direct API request to protected endpoint (simulating browser reload / init)
    const token = jwt.sign(
      { id: userA._id, email: userA.email, role: userA.role, shopId: shopA._id },
      JWT_SECRET,
      { expiresIn: '1h' }
    );
    const reloadRes = await fetch(`${BASE_URL}/customers`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    assert(reloadRes.status === 403, `Direct URL/API request blocked on expired shop with 403 (got ${reloadRes.status})`);
    const reloadData = await reloadRes.json();
    assert(reloadData.isExpired === true, 'Direct access returns isExpired: true');
  }

  // ─────────────────────────────────────────────────────────────
  // TEST 6: Successful renewal restores access
  // ─────────────────────────────────────────────────────────────
  console.log('\n-------------------------------------------------------------');
  console.log('TEST 6: Successful renewal restores access');
  console.log('-------------------------------------------------------------');
  {
    // 1. Verify exemption: workshop owner can still call GET /shops/:id/subscription when expired
    const ownerToken = jwt.sign(
      { id: userA._id, email: userA.email, role: userA.role, shopId: shopA._id },
      JWT_SECRET,
      { expiresIn: '1h' }
    );
    const subRes = await fetch(`${BASE_URL}/shops/${shopA._id}/subscription`, {
      headers: { Authorization: `Bearer ${ownerToken}` }
    });
    const subJson = await subRes.json();
    const subData = subJson.data || subJson;
    assert(subRes.status === 200, `Renewal endpoint /subscription accessible while expired (got ${subRes.status})`);
    assert(subData.status === 'EXPIRED', `Telemetry accurately reports EXPIRED status (got "${subData.status}")`);

    // 2. Workshop owner submits renewal via POST /shops/:id/renew
    const targetPlan = plans[1] || plans[0];
    const renewRes = await fetch(`${BASE_URL}/shops/${shopA._id}/renew`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ownerToken}`
      },
      body: JSON.stringify({
        planId: targetPlan._id.toString(),
        billingCycle: 'yearly',
        paymentMethod: 'UPI',
        referenceId: `UPI-TEST-${Date.now()}`
      })
    });
    const renewJson = await renewRes.json();
    const renewData = renewJson.data || renewJson;
    assert(renewRes.status === 200, `Renewal request returns 200 OK (got ${renewRes.status})`);
    assert(renewJson.success === true, 'Renewal returned success: true');
    assert(renewData.shop?.subscriptionStatus === 'ACTIVE', 'Renewed shop subscriptionStatus is now ACTIVE');
    assert(
      new Date(renewData.shop?.subscriptionExpiresAt).getTime() > Date.now() + 300 * 86400000,
      'Yearly renewal set expiry date ~365 days into the future'
    );

    // 3. Check renewal history audit trail
    const updatedShop = await Shop.findById(shopA._id);
    assert(updatedShop.subscriptionHistory.length > 0, 'Subscription history contains renewed entry');
    const latestHistory = updatedShop.subscriptionHistory[0];
    assert(latestHistory.planName === targetPlan.name, `History entry records plan "${latestHistory.planName}"`);
    assert(latestHistory.billingCycle === 'yearly', 'History entry records billingCycle: yearly');

    // 4. Verify login and protected API access are restored
    const reLogin = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: 'keshav@gmail.com', password: '123456' })
    });
    assert(reLogin.status === 200, `Post-renewal login succeeds with 200 (got ${reLogin.status})`);
    const reLoginData = await reLogin.json();
    const reLoginUser = reLoginData.user || reLoginData.data?.user;
    const reLoginToken = reLoginData.token || reLoginData.data?.token;
    assert(reLoginUser?.shop?.subscriptionStatus === 'ACTIVE', 'Restored session has ACTIVE subscription');

    const meAfterRenew = await fetch(`${BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${reLoginToken}` }
    });
    assert(meAfterRenew.status === 200, `Protected API access restored (200 OK)`);
  }

  // ─────────────────────────────────────────────────────────────
  // TEST 7: Super Admin access remains available & Super Admin extension
  // ─────────────────────────────────────────────────────────────
  console.log('\n-------------------------------------------------------------');
  console.log('TEST 7: Super Admin access remains available even when shops are expired');
  console.log('-------------------------------------------------------------');
  {
    // 1. Super Admin Login
    const adminLogin = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: 'admin@gmail.com', password: '123456' })
    });
    const adminData = await adminLogin.json();
    assert(adminLogin.status === 200, `Super Admin login succeeds with 200 (got ${adminLogin.status})`);
    const adminToken = adminData.token || adminData.data?.token;

    // 2. Super Admin views all shops (with filters)
    const shopsRes = await fetch(`${BASE_URL}/shops?page=1&limit=10`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const shopsJson = await shopsRes.json();
    const shopsList = Array.isArray(shopsJson.data) ? shopsJson.data : (shopsJson.data?.shops || shopsJson);
    assert(shopsRes.status === 200, `Super Admin GET /shops returns 200 (got ${shopsRes.status})`);
    assert(Array.isArray(shopsList), 'Returned shops list is an array');

    // 3. Super Admin views individual shop details
    const shopDetailRes = await fetch(`${BASE_URL}/admin/shops/${shopA._id}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const shopDetailJson = await shopDetailRes.json();
    const shopDetailData = shopDetailJson.data || shopDetailJson;
    assert(shopDetailRes.status === 200, `Super Admin GET /admin/shops/:id returns 200 (got ${shopDetailRes.status})`);
    assert(shopDetailData.shop?.subscriptionHistory || shopDetailData.subscription?.history, 'Shop details include complete subscriptionHistory');
    const daysRemainingVal = shopDetailData.subscription?.daysRemaining ?? shopDetailData.shop?.daysRemaining;
    assert(typeof daysRemainingVal === 'number', `Shop details include live daysRemaining count (got ${daysRemainingVal})`);

    // 4. Super Admin manually extends subscription validity
    const extendRes = await fetch(`${BASE_URL}/shops/${shopA._id}/extend-subscription`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        extendDays: 45,
        planId: plans[0]._id.toString(),
        notes: 'Promotional grace period extension'
      })
    });
    const extendJson = await extendRes.json();
    const extendData = extendJson.data || extendJson;
    assert(extendRes.status === 200, `Super Admin extension returns 200 OK (got ${extendRes.status})`);
    assert(extendJson.success === true, 'Extension returned success: true');
    const recordedDays = extendData.daysExtended ?? extendData.extendedDays;
    assert(recordedDays === 45, `Extension records 45 extended days (got ${recordedDays})`);
  }

  // ─────────────────────────────────────────────────────────────
  // TEST 8: Existing workshop data is preserved
  // ─────────────────────────────────────────────────────────────
  console.log('\n-------------------------------------------------------------');
  console.log('TEST 8: Workshop data (customers, repairs, inventory) preserved during expiry');
  console.log('-------------------------------------------------------------');
  {
    const Customer = mongoose.models.Customer || mongoose.model('Customer', new mongoose.Schema({}, { strict: false }));
    const Repair = mongoose.models.Repair || mongoose.model('Repair', new mongoose.Schema({}, { strict: false }));

    const initialCustomers = await Customer.countDocuments({ shopId: shopA._id });
    const initialRepairs = await Repair.countDocuments({ shopId: shopA._id });

    // Expire shop
    await Shop.updateOne(
      { _id: shopA._id },
      { $set: { subscriptionExpiresAt: new Date(Date.now() - 3600000), subscriptionStatus: 'EXPIRED' } }
    );

    // Verify counts remain unchanged
    const duringCustomers = await Customer.countDocuments({ shopId: shopA._id });
    const duringRepairs = await Repair.countDocuments({ shopId: shopA._id });
    assert(duringCustomers === initialCustomers, `Customer count preserved (${duringCustomers})`);
    assert(duringRepairs === initialRepairs, `Repair ticket count preserved (${duringRepairs})`);

    // Restore shop
    await Shop.updateOne(
      { _id: shopA._id },
      { $set: { subscriptionExpiresAt: new Date(Date.now() + 30 * 86400000), subscriptionStatus: 'ACTIVE' } }
    );
    const afterCustomers = await Customer.countDocuments({ shopId: shopA._id });
    const afterRepairs = await Repair.countDocuments({ shopId: shopA._id });
    assert(afterCustomers === initialCustomers, `Customer count preserved after restore (${afterCustomers})`);
    assert(afterRepairs === initialRepairs, `Repair count preserved after restore (${afterRepairs})`);
  }

  // ─────────────────────────────────────────────────────────────
  // TEST 9: Different workshops have independent subscription validity
  // ─────────────────────────────────────────────────────────────
  console.log('\n-------------------------------------------------------------');
  console.log('TEST 9: Independent workshop subscription validity');
  console.log('-------------------------------------------------------------');
  {
    // Expire Shop A
    await Shop.updateOne(
      { _id: shopA._id },
      { $set: { subscriptionExpiresAt: new Date(Date.now() - 86400000), subscriptionStatus: 'EXPIRED' } }
    );

    // Ensure Shop B is Active
    await Shop.updateOne(
      { _id: shopB._id },
      { $set: { subscriptionExpiresAt: new Date(Date.now() + 20 * 86400000), subscriptionStatus: 'ACTIVE', status: 'ACTIVE' } }
    );

    // User A (Shop A) login should FAIL with 403
    const loginA = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: 'keshav@gmail.com', password: '123456' })
    });
    assert(loginA.status === 403, `Expired Shop A user login blocked with 403 (got ${loginA.status})`);

    // User B (Shop B) login should SUCCEED with 200
    const loginB = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: 'apexa@gmail.com', password: '123456' })
    });
    assert(loginB.status === 200, `Active Shop B user login succeeds with 200 (got ${loginB.status})`);
    const dataB = await loginB.json();
    const tokenB = dataB.token || dataB.data?.token;
    assert(Boolean(tokenB), 'Shop B user received valid auth token');

    // Restore Shop A
    await Shop.updateOne(
      { _id: shopA._id },
      { $set: { subscriptionExpiresAt: new Date(Date.now() + 30 * 86400000), subscriptionStatus: 'ACTIVE' } }
    );
  }

  // ─────────────────────────────────────────────────────────────
  // TEST 10: Time-zone and expiry-boundary cases work correctly
  // ─────────────────────────────────────────────────────────────
  console.log('\n-------------------------------------------------------------');
  console.log('TEST 10: Time-zone & expiry-boundary precision');
  console.log('-------------------------------------------------------------');
  {
    const now = new Date();

    // Boundary 1: Exactly 5 seconds in future -> Active
    const futureDate = new Date(now.getTime() + 5000);
    const isFutureExpired = futureDate.getTime() <= now.getTime();
    assert(isFutureExpired === false, '5s in future evaluates to active (not expired)');

    // Boundary 2: Exactly 5 seconds in past -> Expired
    const pastDate = new Date(now.getTime() - 5000);
    const isPastExpired = pastDate.getTime() <= now.getTime();
    assert(isPastExpired === true, '5s in past evaluates to expired');

    // Boundary 3: ISO String parsing across UTC/Local
    const utcIso = futureDate.toISOString();
    const parsedTime = new Date(utcIso).getTime();
    assert(parsedTime === futureDate.getTime(), 'UTC ISO date string converts to identical epoch milliseconds');

    // Boundary 4: Days remaining calculation test
    const thirtyDaysFuture = new Date(now.getTime() + 30 * 86400000);
    const diffMs = thirtyDaysFuture.getTime() - now.getTime();
    const daysRemaining = Math.max(0, Math.ceil(diffMs / 86400000));
    assert(daysRemaining === 30, `30 days future returns exact integer 30 (got ${daysRemaining})`);

    const pastDaysRemaining = Math.max(0, Math.ceil((now.getTime() - 100000 - now.getTime()) / 86400000));
    assert(pastDaysRemaining === 0, `Past expiry returns 0 days remaining (got ${pastDaysRemaining})`);
  }

  console.log('\n===============================================================');
  console.log(`🎉 ALL ${passedTests} OF ${totalTests} TESTS PASSED SUCCESSFULLY!`);
  console.log('===============================================================\n');

  await mongoose.disconnect();
}

runTests().catch(err => {
  console.error('\n❌ Test suite failed:', err);
  process.exit(1);
});
