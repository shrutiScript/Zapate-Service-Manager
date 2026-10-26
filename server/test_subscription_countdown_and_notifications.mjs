import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Shop } from './src/modules/shops/shop.model.js';
import { Plan } from './src/modules/admin/plan.model.js';
import { User } from './src/modules/users/user.model.js';
import { Notification } from './src/modules/notifications/notification.model.js';
import { subscriptionService } from './src/modules/shops/subscription.service.js';

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/repairflow_db';
const BASE_URL = 'http://localhost:5000/api/v1';
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_repairflow_2026';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ [PASS] ${message}`);
    passed++;
  } else {
    console.error(`  ❌ [FAIL] ${message}`);
    failed++;
    throw new Error(`Assertion failed: ${message}`);
  }
}

async function runComprehensiveTests() {
  console.log('\n===============================================================');
  console.log('🚀 TESTING SUBSCRIPTION COUNTDOWN, DAILY NOTIFICATIONS & LOGOUT');
  console.log('===============================================================\n');

  await mongoose.connect(MONGO_URI);
  console.log(`Connected to MongoDB: ${MONGO_URI}`);

  const testShop = await Shop.findOne({ status: 'ACTIVE' });
  const testUser = await User.findOne({ shopId: testShop._id, role: 'SHOP_OWNER' });
  const superAdmin = await User.findOne({ role: 'SUPER_ADMIN' });

  assert(testShop, `Found test workshop: ${testShop?.name} (${testShop?.code})`);
  assert(testUser, `Found workshop owner: ${testUser?.email}`);
  assert(superAdmin, `Found super admin: ${superAdmin?.email}`);

  // Backup original state
  const originalExpiresAt = testShop.subscriptionExpiresAt;
  const originalStartDate = testShop.subscriptionStartDate;
  const originalStatus = testShop.subscriptionStatus;
  const originalNotifications = testShop.subscriptionNotificationsSent || [];

  try {
    // -------------------------------------------------------------
    // 1. TEST CONFIGURABLE DURATIONS (1, 2, 3, 4, 5, 6, 7 DAYS)
    // -------------------------------------------------------------
    console.log('\n--- 1. Testing Subscriptions of Configured Durations (1 to 7 Days) ---');
    for (let d = 1; d <= 7; d++) {
      const now = new Date();
      const renewRes = await subscriptionService.renewSubscription(testShop._id, {
        durationDays: d,
        billingCycle: `${d}_days`,
        resetStartDate: true,
        paymentStatus: 'PAID',
        paymentMethod: 'UPI',
        referenceId: `TEST-DURATION-${d}D-${Date.now()}`,
      });

      assert(renewRes.success === true, `Successfully activated ${d}-day subscription`);
      const updatedShop = await Shop.findById(testShop._id);
      const diffMs = new Date(updatedShop.subscriptionExpiresAt).getTime() - new Date(updatedShop.subscriptionStartDate).getTime();
      const expectedDays = Math.round(diffMs / (24 * 60 * 60 * 1000));
      assert(expectedDays === d, `Subscription duration is exactly ${d} days (got ${expectedDays}d)`);
      assert(updatedShop.subscriptionStatus === 'ACTIVE', `${d}-day subscription status is ACTIVE`);
    }

    // -------------------------------------------------------------
    // 2. TEST DAILY NOTIFICATIONS FOR EXACTLY 7, 6, 5, 4, 3, 2, 1 DAYS
    // -------------------------------------------------------------
    console.log('\n--- 2. Testing Daily Expiry Notifications for 7, 6, 5, 4, 3, 2, 1 Days ---');

    for (let d = 7; d >= 1; d--) {
      // Clear notifications for this test shop
      await Notification.deleteMany({ shopId: testShop._id });
      await Shop.findByIdAndUpdate(testShop._id, { subscriptionNotificationsSent: [] });

      const now = new Date();
      const targetExpiry = new Date(now.getTime() + (d - 0.1) * 24 * 60 * 60 * 1000);
      const startDate = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000); // 10 days ago (standard plan)

      await Shop.findByIdAndUpdate(testShop._id, {
        subscriptionStartDate: startDate,
        subscriptionExpiresAt: targetExpiry,
        subscriptionStatus: 'ACTIVE',
      });

      // Run Sweeper
      await subscriptionService.checkAndExpireSubscriptions();

      // Check notification created
      const notif = await Notification.findOne({
        shopId: testShop._id,
        channel: 'In-App',
        type: 'Subscription Expiry',
      });

      assert(Boolean(notif), `Notification generated when ${d} days remaining`);

      if (d === 1) {
        assert(
          notif.message.includes('Your subscription expires tomorrow. Please renew your plan to continue using Zapate Service Manager.'),
          `Day 1 final reminder message matches requirement: "${notif.message}"`
        );
      } else {
        assert(
          notif.title.includes(`${d} Days`) || notif.message.includes(`${d} days`),
          `Day ${d} reminder correctly mentions ${d} days (title: "${notif.title}")`
        );
      }

      // Verify delivery status recorded
      assert(notif.status === 'Delivered', `Notification delivery status is marked as "Delivered"`);

      // Verify deduplication: second sweeper run must NOT create duplicate notification
      await subscriptionService.checkAndExpireSubscriptions();
      const count = await Notification.countDocuments({
        shopId: testShop._id,
        channel: 'In-App',
        type: 'Subscription Expiry',
      });
      assert(count === 1, `Duplicate prevented: exactly 1 notification exists for ${d}-day reminder (got ${count})`);
    }

    // -------------------------------------------------------------
    // 3. TEST FEWER THAN 7 DAYS REMAINING ON PURCHASE (e.g. 3-DAY PLAN)
    // -------------------------------------------------------------
    console.log('\n--- 3. Testing Applicable Reminders Only (e.g. 3-Day Plan Purchase) ---');
    {
      await Notification.deleteMany({ shopId: testShop._id });
      await Shop.findByIdAndUpdate(testShop._id, { subscriptionNotificationsSent: [] });

      const now = new Date();
      // 3-day plan purchased
      const threeDayExpiry = new Date(now.getTime() + 2.9 * 24 * 60 * 60 * 1000);
      await Shop.findByIdAndUpdate(testShop._id, {
        subscriptionStartDate: now,
        subscriptionExpiresAt: threeDayExpiry,
        subscriptionStatus: 'ACTIVE',
      });

      // Sweeper runs on day 1 (3 days remaining)
      await subscriptionService.checkAndExpireSubscriptions();

      const notif3d = await Notification.findOne({ shopId: testShop._id, title: /3 Days/i });
      const notif7d = await Notification.findOne({ shopId: testShop._id, title: /7 Days/i });
      const notif5d = await Notification.findOne({ shopId: testShop._id, title: /5 Days/i });

      assert(Boolean(notif3d), 'Applicable 3-day reminder was dispatched');
      assert(!notif7d, '7-day reminder was NOT dispatched for 3-day plan');
      assert(!notif5d, '5-day reminder was NOT dispatched for 3-day plan');
    }

    // -------------------------------------------------------------
    // 4. TEST SHORT DURATION (< 24 HOURS) SUBSCRIPTIONS
    // -------------------------------------------------------------
    console.log('\n--- 4. Testing Short-Duration (< 24 Hours) Subscriptions ---');
    {
      await Notification.deleteMany({ shopId: testShop._id });
      await Shop.findByIdAndUpdate(testShop._id, { subscriptionNotificationsSent: [] });

      const now = new Date();
      // Subscription with 6 hours total duration (starts now, expires in 6 hours)
      const sixHoursFuture = new Date(now.getTime() + 6 * 60 * 60 * 1000);
      await Shop.findByIdAndUpdate(testShop._id, {
        subscriptionStartDate: now,
        subscriptionExpiresAt: sixHoursFuture,
        subscriptionStatus: 'ACTIVE',
      });

      // Sweeper runs
      await subscriptionService.checkAndExpireSubscriptions();

      const notifShort = await Notification.findOne({ shopId: testShop._id });
      assert(Boolean(notifShort), 'Short-duration alert successfully generated');
      assert(
        notifShort.title.includes('Today') || notifShort.message.includes('expires today'),
        `Short-duration notification uses actual expiry timestamp and says "expires today": "${notifShort.message}"`
      );
      assert(
        !notifShort.message.includes('tomorrow') && !notifShort.message.includes('7 days'),
        'Short-duration notification did NOT send incorrect day-count or "tomorrow" wording'
      );
    }

    // -------------------------------------------------------------
    // 5. TEST RENEWAL BEFORE EXPIRY RESETS NOTIFICATIONS
    // -------------------------------------------------------------
    console.log('\n--- 5. Testing Renewal Before Expiry Resets Notification Tracker ---');
    {
      const now = new Date();
      const soonExpiry = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);
      await Shop.findByIdAndUpdate(testShop._id, {
        subscriptionExpiresAt: soonExpiry,
        subscriptionNotificationsSent: [{ event: '2_DAYS', expiresAt: soonExpiry, sentAt: now }],
      });

      // Renew subscription for 30 days
      const renewRes = await subscriptionService.renewSubscription(testShop._id, {
        durationDays: 30,
        billingCycle: 'monthly',
        paymentStatus: 'PAID',
        paymentMethod: 'UPI',
        referenceId: `TEST-EARLY-RENEW-${Date.now()}`,
      });

      const renewedShop = await Shop.findById(testShop._id);
      assert(
        renewedShop.subscriptionNotificationsSent.length === 0,
        'Notification sent tracker was cleanly reset for new subscription cycle'
      );
      assert(
        new Date(renewedShop.subscriptionExpiresAt).getTime() > soonExpiry.getTime() + 28 * 24 * 60 * 60 * 1000,
        'Expiry extended from current expiry date rather than truncating'
      );
    }

    // -------------------------------------------------------------
    // 6. TEST AUTOMATIC LOGOUT & ACCESS BLOCKING AT EXPIRY
    // -------------------------------------------------------------
    console.log('\n--- 6. Testing Immediate Access Blocking & Automatic Logout at Expiry ---');
    {
      // 6.1 Set shop to expired in DB
      const pastTime = new Date(Date.now() - 10000); // 10 seconds ago
      await Shop.findByIdAndUpdate(testShop._id, {
        subscriptionExpiresAt: pastTime,
        subscriptionStatus: 'EXPIRED',
      });

      // 6.2 Test Direct API request with valid JWT
      const ownerToken = jwt.sign(
        { id: testUser._id, email: testUser.email, role: testUser.role, shopId: testShop._id },
        JWT_SECRET,
        { expiresIn: '1h' }
      );

      const protectedApiRes = await fetch(`${BASE_URL}/repairs`, {
        headers: { Authorization: `Bearer ${ownerToken}` },
      });
      assert(protectedApiRes.status === 403, `Direct API access blocked with 403 Forbidden (got ${protectedApiRes.status})`);
      const apiJson = await protectedApiRes.json();
      assert(apiJson.isExpired === true, 'API response contains isExpired: true flag');
      assert(apiJson.message.includes('subscription has expired'), `Message indicates subscription expiry: "${apiJson.message}"`);

      // 6.3 Test Login Rejection when expired
      const userHash = await bcrypt.hash('123456', 10);
      await User.updateOne({ _id: testUser._id }, { $set: { password: userHash } });

      const loginRes = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: testUser.email, password: '123456' }),
      });
      assert(loginRes.status === 403, `Login rejected with 403 when subscription expired (got ${loginRes.status})`);
      const loginData = await loginRes.json();
      assert(loginData.isExpired === true, 'Login rejection includes isExpired: true');
      assert(loginData.shopId === testShop._id.toString(), 'Login rejection provides shopId for instant renewal');

      // 6.4 Renewal endpoint exemption
      const subInfoRes = await fetch(`${BASE_URL}/shops/${testShop._id}/subscription`, {
        headers: { Authorization: `Bearer ${ownerToken}` },
      });
      assert(subInfoRes.status === 200, `Renewal endpoint /subscription remains accessible when expired (got ${subInfoRes.status})`);

      // 6.5 Super Admin Immunity
      const adminToken = jwt.sign(
        { id: superAdmin._id, email: superAdmin.email, role: 'SUPER_ADMIN' },
        JWT_SECRET,
        { expiresIn: '1h' }
      );
      const adminApiRes = await fetch(`${BASE_URL}/admin/shops/${testShop._id}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      assert(adminApiRes.status === 200, `Super Admin retains full API access even when shops are expired (got ${adminApiRes.status})`);
    }

    // -------------------------------------------------------------
    // 7. TEST RESTORATION OF ACCESS AFTER RENEWAL
    // -------------------------------------------------------------
    console.log('\n--- 7. Testing Restoration of Access After Renewal ---');
    {
      const renewPostRes = await subscriptionService.renewSubscription(testShop._id, {
        durationDays: 30,
        billingCycle: 'monthly',
        paymentStatus: 'PAID',
        paymentMethod: 'UPI Gate',
        referenceId: `TEST-RESTORE-${Date.now()}`,
      });

      assert(renewPostRes.success === true, 'Renewal succeeded');
      assert(renewPostRes.shop.subscriptionStatus === 'ACTIVE', 'Subscription status restored to ACTIVE');

      // Login succeeds again
      const postRenewLogin = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: testUser.email, password: '123456' }),
      });
      assert(postRenewLogin.status === 200, `Login restored after renewal (got ${postRenewLogin.status})`);
      const postData = await postRenewLogin.json();
      const freshToken = postData.token || postData.data?.token;

      // Protected API works again
      const freshApiRes = await fetch(`${BASE_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${freshToken}` },
      });
      assert(freshApiRes.status === 200, `Protected API access restored after renewal (200 OK)`);
    }

    // -------------------------------------------------------------
    // 8. TEST SERVER TIME & REMAINING DAYS IN TELEMETRY
    // -------------------------------------------------------------
    console.log('\n--- 8. Testing Server Time & Countdown Days in Dashboard Telemetry ---');
    {
      const shopOwnerToken = jwt.sign(
        { id: testUser._id, email: testUser.email, role: testUser.role, shopId: testShop._id },
        JWT_SECRET,
        { expiresIn: '1h' }
      );

      // 8.1 /auth/me returns daysRemaining and serverTime
      const meRes = await fetch(`${BASE_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${shopOwnerToken}` },
      });
      const meData = await meRes.json();
      const userPayload = meData.data || meData;
      assert(Boolean(userPayload.serverTime), 'GET /auth/me returns synchronized serverTime');
      assert(typeof userPayload.shop?.daysRemaining === 'number', `GET /auth/me returns daysRemaining: ${userPayload.shop?.daysRemaining}`);

      // 8.2 /reports/dashboard returns subscription & serverTime
      const dashRes = await fetch(`${BASE_URL}/reports/dashboard`, {
        headers: { Authorization: `Bearer ${shopOwnerToken}` },
      });
      const dashData = await dashRes.json();
      const reportPayload = dashData.data || dashData;
      assert(Boolean(reportPayload.serverTime), 'GET /reports/dashboard returns synchronized serverTime');
      assert(Boolean(reportPayload.subscription), 'GET /reports/dashboard returns subscription info');
      assert(typeof reportPayload.subscription?.daysRemaining === 'number', `Dashboard returns daysRemaining: ${reportPayload.subscription?.daysRemaining}`);
      assert(Boolean(reportPayload.subscription?.expiresAt), 'Dashboard returns actual expiry timestamp');
      assert(Boolean(reportPayload.subscription?.startDate), 'Dashboard returns actual start date');
    }

  } finally {
    // Restore original workshop state
    await Shop.findByIdAndUpdate(testShop._id, {
      subscriptionExpiresAt: originalExpiresAt,
      subscriptionStartDate: originalStartDate,
      subscriptionStatus: originalStatus,
      subscriptionNotificationsSent: originalNotifications,
    });
  }

  console.log('\n===============================================================');
  console.log(`🎉 ALL ${passed} OF ${passed + failed} TEST CHECKS PASSED SUCCESSFULLY!`);
  console.log('===============================================================\n');

  await mongoose.disconnect();
}

runComprehensiveTests().catch((err) => {
  console.error('\n❌ Test execution failed:', err);
  process.exit(1);
});
