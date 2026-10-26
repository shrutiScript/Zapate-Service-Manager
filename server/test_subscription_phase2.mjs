import mongoose from 'mongoose';
import { Shop } from './src/modules/shops/shop.model.js';
import { Plan } from './src/modules/admin/plan.model.js';
import { User } from './src/modules/users/user.model.js';
import { Notification } from './src/modules/notifications/notification.model.js';
import { ActivityLog } from './src/modules/admin/activityLog.model.js';
import { subscriptionService } from './src/modules/shops/subscription.service.js';
import { AdminService } from './src/modules/admin/admin.service.js';
import { ShopService } from './src/modules/shops/shop.service.js';

const adminService = new AdminService();

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/repairflow_db';
const BASE_URL = 'http://localhost:5000/api/v1';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ [PASS] ${message}`);
    passed++;
  } else {
    console.error(`  ❌ [FAIL] ${message}`);
    failed++;
  }
}

async function runTests() {
  console.log('\n===============================================================');
  console.log('🧪 RUNNING SUBSCRIPTION ENHANCEMENTS & VALIDATION SUITE');
  console.log('===============================================================\n');

  await mongoose.connect(MONGO_URI);
  console.log(`Connected to MongoDB: ${MONGO_URI}`);

  const shopService = new ShopService();

  // Find Super Admin and Shop for testing
  const superAdmin = await User.findOne({ role: 'SUPER_ADMIN' });
  const testShop = await Shop.findOne({ status: 'ACTIVE' });
  assert(superAdmin, 'Super Admin user found');
  assert(testShop, 'Active test workshop found: ' + testShop?.name);

  // Fake request mock for audit logging
  const mockSuperAdminReq = {
    user: {
      id: superAdmin._id.toString(),
      _id: superAdmin._id,
      email: superAdmin.email,
      name: superAdmin.name,
      role: 'SUPER_ADMIN',
    },
    ip: '127.0.0.1',
    headers: { 'user-agent': 'Automated-Test-Runner/1.0' },
  };

  // -------------------------------------------------------------
  // TEST SUITE 1: DYNAMIC PLAN MANAGEMENT (CRUD, ARCHIVE, UNARCHIVE, POPULAR)
  // -------------------------------------------------------------
  console.log('\n--- 1. Testing Dynamic Plan Management & Archiving ---');
  const uniquePlanName = `Enterprise Cloud Tier ${Date.now()}`;
  
  // 1.1 Create Plan
  const createdPlan = await adminService.createPlan({
    name: uniquePlanName,
    price: 3999,
    yearlyPrice: 39990,
    billingCycle: 'monthly',
    limitUsers: 15,
    limitTechs: 10,
    repairTicketLimit: -1,
    supportLevel: 'Dedicated 24/7 Priority',
    features: ['Unlimited Repairs', 'Multi-Branch', 'VIP Support'],
    isPopular: false,
    active: true,
  }, mockSuperAdminReq);

  assert(createdPlan && createdPlan._id, `Plan created: ${createdPlan.name}`);
  assert(createdPlan.price === 3999, 'Plan monthly price is 3999');
  assert(createdPlan.isArchived === false, 'New plan isArchived defaults to false');

  // Verify Audit Log for PLAN_CREATED
  const planCreatedLog = await ActivityLog.findOne({
    action: 'PLAN_CREATED',
    targetId: createdPlan._id.toString(),
  });
  assert(planCreatedLog, 'Audit log PLAN_CREATED successfully recorded');

  // 1.2 Public plans should include active unarchived plan
  const publicPlansBeforeArchive = await adminService.getPublicPlans();
  const isFoundInPublic = publicPlansBeforeArchive.some(p => p._id.toString() === createdPlan._id.toString());
  assert(isFoundInPublic, 'New active plan is present in public plans listing');

  // 1.3 Archive Plan
  const archivedPlan = await adminService.archivePlan(createdPlan._id, mockSuperAdminReq);
  assert(archivedPlan.isArchived === true, 'Plan isArchived flag set to true');
  assert(archivedPlan.active === false, 'Archived plan is automatically deactivated');

  // Verify Audit Log for PLAN_ARCHIVED
  const planArchivedLog = await ActivityLog.findOne({
    action: 'PLAN_ARCHIVED',
    targetId: createdPlan._id.toString(),
  });
  assert(planArchivedLog, 'Audit log PLAN_ARCHIVED successfully recorded');

  // 1.4 Public plans MUST NOT include archived plan
  const publicPlansAfterArchive = await adminService.getPublicPlans();
  const isFoundInPublicAfterArchive = publicPlansAfterArchive.some(p => p._id.toString() === createdPlan._id.toString());
  assert(!isFoundInPublicAfterArchive, 'Archived plan is excluded from public plans listing');

  // 1.5 Unarchive Plan
  const unarchivedPlan = await adminService.unarchivePlan(createdPlan._id, mockSuperAdminReq);
  assert(unarchivedPlan.isArchived === false, 'Plan isArchived flag restored to false');
  assert(unarchivedPlan.active === true, 'Unarchived plan is automatically reactivated');

  // Verify Audit Log for PLAN_UNARCHIVED
  const planUnarchivedLog = await ActivityLog.findOne({
    action: 'PLAN_UNARCHIVED',
    targetId: createdPlan._id.toString(),
  });
  assert(planUnarchivedLog, 'Audit log PLAN_UNARCHIVED successfully recorded');

  // 1.6 Mark Plan as Most Popular
  const updatedPopularPlan = await adminService.updatePlan(createdPlan._id, { isPopular: true }, mockSuperAdminReq);
  assert(updatedPopularPlan.isPopular === true, 'Plan successfully set as isPopular');

  // Clean up created test plan
  await Plan.findByIdAndDelete(createdPlan._id);

  // -------------------------------------------------------------
  // TEST SUITE 2: STRICT RENEWAL & PAYMENT VERIFICATION
  // -------------------------------------------------------------
  console.log('\n--- 2. Testing Strict Renewal & Payment Verification ---');
  
  // Backup test shop subscription state
  const originalExpiresAt = testShop.subscriptionExpiresAt;
  const originalStatus = testShop.subscriptionStatus;
  const originalPaymentStatus = testShop.subscriptionPaymentStatus;

  // 2.1 Attempt Renewal with PENDING Payment Status (Must Fail)
  let pendingFailed = false;
  try {
    await subscriptionService.renewSubscription(testShop._id, {
      planName: 'Starter Tier',
      billingCycle: 'monthly',
      paymentMethod: 'UPI',
      paymentStatus: 'PENDING',
      referenceId: 'TEST-UNVERIFIED-PENDING-REF',
    }, mockSuperAdminReq);
  } catch (err) {
    pendingFailed = true;
    assert(err.message.includes('Payment must be verified') || err.message.includes('Payment verification failed'), `Rejected pending payment renewal with error: "${err.message}"`);
  }
  assert(pendingFailed, 'Renewal with PENDING payment was strictly rejected');

  // Verify Shop was NOT extended by pending payment
  const shopAfterPending = await Shop.findById(testShop._id);
  assert(
    new Date(shopAfterPending.subscriptionExpiresAt).getTime() === new Date(originalExpiresAt).getTime(),
    'Shop expiry date was NOT modified by pending payment attempt'
  );

  // Verify unverified attempt recorded in subscriptionHistory with paymentStatus = PENDING
  const pendingHistoryItem = shopAfterPending.subscriptionHistory.find(h => h.referenceId === 'TEST-UNVERIFIED-PENDING-REF');
  assert(pendingHistoryItem && pendingHistoryItem.paymentStatus === 'PENDING', 'Pending payment attempt safely logged in subscription history');

  // 2.2 Attempt Renewal with FAILED Payment Status (Must Fail)
  let failedPaymentFailed = false;
  try {
    await subscriptionService.renewSubscription(testShop._id, {
      planName: 'Starter Tier',
      billingCycle: 'monthly',
      paymentMethod: 'Net Banking',
      paymentStatus: 'FAILED',
      referenceId: 'TEST-UNVERIFIED-FAILED-REF',
    }, mockSuperAdminReq);
  } catch (err) {
    failedPaymentFailed = true;
    assert(err.message.includes('Payment must be verified') || err.message.includes('Payment verification failed'), `Rejected failed payment renewal with error: "${err.message}"`);
  }
  assert(failedPaymentFailed, 'Renewal with FAILED payment was strictly rejected');

  // 2.3 Successful Renewal with PAID Payment Status
  const successfulRenewal = await subscriptionService.renewSubscription(testShop._id, {
    planName: 'Starter Tier',
    billingCycle: 'monthly',
    paymentMethod: 'Razorpay UPI',
    paymentStatus: 'PAID',
    referenceId: `TEST-PAID-REF-${Date.now()}`,
  }, mockSuperAdminReq);

  assert(successfulRenewal.success === true, 'Successful renewal returned success: true');
  assert(successfulRenewal.shop.subscriptionStatus === 'ACTIVE', 'Renewed subscriptionStatus is ACTIVE');
  assert(successfulRenewal.shop.subscriptionPaymentStatus === 'PAID', 'Renewed paymentStatus is PAID');
  assert(new Date(successfulRenewal.newExpiresAt).getTime() > Date.now(), 'Expiry date extended into future');

  // -------------------------------------------------------------
  // TEST SUITE 3: SUPER ADMIN MANUAL EXTENSION WITH AUDIT TRAIL
  // -------------------------------------------------------------
  console.log('\n--- 3. Testing Super Admin Manual Extension & Audit Trail ---');

  const extensionReason = 'Authorized complimentary extension for technical review';
  const extendedShop = await subscriptionService.extendSubscription(testShop._id, {
    days: 14,
    reason: extensionReason,
    notes: 'Granted by Lead Administrator',
  }, mockSuperAdminReq);

  assert(extendedShop.success === true, 'Manual extension returned success: true');
  assert(extendedShop.daysExtended === 14, '14 days added to subscription');

  // Verify Audit Log for SUBSCRIPTION_EXTENDED
  const extensionLog = await ActivityLog.findOne({
    action: 'SUBSCRIPTION_EXTENDED',
    targetId: testShop._id.toString(),
  }).sort({ createdAt: -1 });

  assert(extensionLog, 'Audit log SUBSCRIPTION_EXTENDED successfully recorded');
  assert(extensionLog?.reason === extensionReason, 'Extension reason preserved in audit log');
  assert(extensionLog?.category === 'Subscription', 'Audit log category is Subscription');

  // -------------------------------------------------------------
  // TEST SUITE 4: MULTI-STAGE IN-APP NOTIFICATIONS & DUPLICATE PREVENTION
  // -------------------------------------------------------------
  console.log('\n--- 4. Testing Multi-Stage Notifications & Duplicate Prevention ---');

  // Clear previous notifications for test shop
  await Notification.deleteMany({ shopId: testShop._id });
  await Shop.findByIdAndUpdate(testShop._id, { subscriptionNotificationsSent: [] });

  // Simulate shop expiring in 7 days (6.9 days)
  const now = new Date();
  const inSevenDays = new Date(now.getTime() + 6.9 * 24 * 60 * 60 * 1000);
  await Shop.findByIdAndUpdate(testShop._id, {
    subscriptionExpiresAt: inSevenDays,
    subscriptionStatus: 'ACTIVE',
  });

  // Run sweeper
  await subscriptionService.checkAndExpireSubscriptions();

  // Check that 7-day alert was created
  const notif7d = await Notification.findOne({
    shopId: testShop._id,
    channel: 'In-App',
    title: { $regex: /7 Days/i },
  });
  assert(notif7d, '7-day subscription alert notification successfully created');

  // Run sweeper a second time immediately - verify DUPLICATE PREVENTION
  await subscriptionService.checkAndExpireSubscriptions();
  const notifCountAfterSecondSweep = await Notification.countDocuments({
    shopId: testShop._id,
    channel: 'In-App',
    title: { $regex: /7 Days/i },
  });
  assert(notifCountAfterSecondSweep === 1, `Duplicate prevention verified: only 1 notification exists (got ${notifCountAfterSecondSweep})`);

  // Simulate shop expiring in 3 days (2.9 days)
  const inThreeDays = new Date(now.getTime() + 2.9 * 24 * 60 * 60 * 1000);
  await Shop.findByIdAndUpdate(testShop._id, { subscriptionExpiresAt: inThreeDays });
  await subscriptionService.checkAndExpireSubscriptions();

  const notif3d = await Notification.findOne({
    shopId: testShop._id,
    channel: 'In-App',
    title: { $regex: /3 Days/i },
  });
  assert(notif3d, '3-day subscription alert notification successfully created');

  // Simulate shop expiring in 1 day (0.9 days)
  const inOneDay = new Date(now.getTime() + 0.9 * 24 * 60 * 60 * 1000);
  await Shop.findByIdAndUpdate(testShop._id, { subscriptionExpiresAt: inOneDay });
  await subscriptionService.checkAndExpireSubscriptions();

  const notif1d = await Notification.findOne({
    shopId: testShop._id,
    channel: 'In-App',
    title: { $regex: /24 Hours|1 Day/i },
  });
  assert(notif1d, '1-day / 24-hours subscription alert notification successfully created');

  // Simulate shop already expired (1 hour in past)
  const pastTime = new Date(now.getTime() - 1 * 60 * 60 * 1000);
  await Shop.findByIdAndUpdate(testShop._id, { subscriptionExpiresAt: pastTime, subscriptionStatus: 'EXPIRING_SOON' });
  await subscriptionService.checkAndExpireSubscriptions();

  const notifExpired = await Notification.findOne({
    shopId: testShop._id,
    channel: 'In-App',
    title: { $regex: /Expired/i },
  });
  assert(notifExpired, 'On-expiry subscription alert notification successfully created');

  const shopAfterExpirySweep = await Shop.findById(testShop._id);
  assert(shopAfterExpirySweep.subscriptionStatus === 'EXPIRED', 'Sweeper automatically marked expired shop status as EXPIRED');

  // -------------------------------------------------------------
  // TEST SUITE 5: WORKSHOP FILTERING BY PAYMENT STATUS
  // -------------------------------------------------------------
  console.log('\n--- 5. Testing Workshop Filtering by Payment Status ---');

  // Set test shop payment status to OVERDUE
  await Shop.findByIdAndUpdate(testShop._id, { subscriptionPaymentStatus: 'OVERDUE' });
  const overdueShops = await shopService.getAll({ paymentStatus: 'OVERDUE' });
  const isFoundOverdue = overdueShops.some(s => s._id.toString() === testShop._id.toString());
  assert(isFoundOverdue, 'Filtering shops by paymentStatus: "OVERDUE" returned the test workshop');

  // Filter by PAID
  const paidShops = await shopService.getAll({ paymentStatus: 'PAID' });
  const isFoundPaid = paidShops.some(s => s._id.toString() === testShop._id.toString());
  assert(!isFoundPaid, 'Filtering shops by paymentStatus: "PAID" properly excluded the OVERDUE workshop');

  // -------------------------------------------------------------
  // TEST SUITE 6: SUPER ADMIN OVERVIEW SUBSCRIPTION METRICS
  // -------------------------------------------------------------
  console.log('\n--- 6. Testing Super Admin Subscription Dashboard Metrics ---');

  const overview = await adminService.getOverview();
  const stats = overview.stats || {};
  assert(typeof stats.totalWorkshops === 'number', `totalWorkshops is a number: ${stats.totalWorkshops}`);
  assert(typeof stats.activeSubscriptions === 'number', `activeSubscriptions is a number: ${stats.activeSubscriptions}`);
  assert(typeof stats.expiringSoonSubscriptions === 'number', `expiringSoonSubscriptions is a number: ${stats.expiringSoonSubscriptions}`);
  assert(typeof stats.expiredSubscriptions === 'number', `expiredSubscriptions is a number: ${stats.expiredSubscriptions}`);
  assert(typeof stats.suspendedSubscriptions === 'number', `suspendedSubscriptions is a number: ${stats.suspendedSubscriptions}`);
  assert(typeof stats.verifiedSubscriptionRevenue === 'number', `verifiedSubscriptionRevenue is verified from DB: ₹${stats.verifiedSubscriptionRevenue}`);

  // Restore test shop original state
  await Shop.findByIdAndUpdate(testShop._id, {
    subscriptionExpiresAt: originalExpiresAt,
    subscriptionStatus: originalStatus,
    subscriptionPaymentStatus: originalPaymentStatus,
  });

  console.log('\n===============================================================');
  console.log(`Summary: ${passed} Passed, ${failed} Failed`);
  if (failed === 0) {
    console.log('🎉 ALL SUBSCRIPTION PHASE 2 ENHANCEMENT TESTS PASSED!');
  } else {
    console.error('⚠️ SOME TESTS FAILED');
  }
  console.log('===============================================================\n');

  await mongoose.disconnect();
  process.exit(failed === 0 ? 0 : 1);
}

runTests().catch((err) => {
  console.error('Test execution error:', err);
  process.exit(1);
});
