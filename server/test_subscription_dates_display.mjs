import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const BASE_URL = 'http://localhost:5000/api/v1';
const MONGO_URI = 'mongodb://127.0.0.1:27017/repairflow_db';
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_repairflow_2026';

let passed = 0;
let total = 0;

function assert(cond, msg) {
  total++;
  if (cond) {
    console.log(`  ✅ [PASS] ${msg}`);
    passed++;
  } else {
    console.error(`  ❌ [FAIL] ${msg}`);
    throw new Error(`Assertion failed: ${msg}`);
  }
}

// Client formatter simulation (exact logic in client/src/utils/formatters.js)
function formatDateDMY(dateInput) {
  if (!dateInput) return '—';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return '—';
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

function formatTime12h(dateInput) {
  if (!dateInput) return '—';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return '—';
  let hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  const formattedHours = String(hours).padStart(2, '0');
  return `${formattedHours}:${minutes} ${ampm}`;
}

function calculateRemainingDays(expiresAt, nowInput = new Date()) {
  if (!expiresAt) return 0;
  const expiryMs = new Date(expiresAt).getTime();
  const nowMs = new Date(nowInput).getTime();
  if (isNaN(expiryMs) || isNaN(nowMs)) return 0;
  const diffMs = expiryMs - nowMs;
  if (diffMs <= 0) return 0;
  return Math.ceil(diffMs / (24 * 60 * 60 * 1000));
}

async function verifyAll() {
  console.log('\n===============================================================');
  console.log('🧪 VERIFYING SUBSCRIPTION DATES DISPLAY & LIFECYCLE REQUIREMENTS');
  console.log('===============================================================\n');

  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB:', MONGO_URI);

  const Shop = mongoose.model('Shop', new mongoose.Schema({}, { strict: false }));
  const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
  const Plan = mongoose.model('Plan', new mongoose.Schema({}, { strict: false }));

  // Admin login token
  const adminHash = await bcrypt.hash('123456', 10);
  await User.updateOne({ email: 'admin@gmail.com' }, { $set: { password: adminHash } });
  const adminLoginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: 'admin@gmail.com', password: '123456' }),
  });
  const adminLoginData = await adminLoginRes.json();
  const adminToken = adminLoginData.token || adminLoginData.data?.token;
  assert(Boolean(adminToken), 'Super Admin logged in successfully');

  // ─────────────────────────────────────────────────────────────
  // 1. VERIFY SUPER ADMIN -> ALL WORKSHOPS API (GET /shops)
  // ─────────────────────────────────────────────────────────────
  console.log('\n--- 1. Testing GET /shops (All Workshops Date Fields) ---');
  const shopsRes = await fetch(`${BASE_URL}/shops`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const shopsJson = await shopsRes.json();
  const apiShops = Array.isArray(shopsJson) ? shopsJson : shopsJson.data;
  assert(Array.isArray(apiShops) && apiShops.length > 0, `GET /shops returned ${apiShops.length} workshops`);

  for (const shop of apiShops) {
    console.log(`\n  Checking workshop: "${shop.name}" (${shop.code})`);
    const dbShop = await Shop.findById(shop._id);
    assert(Boolean(dbShop), `Workshop ${shop.name} exists in MongoDB`);

    // Actual DB dates verification
    assert(Boolean(shop.subscriptionStartDate), 'shop.subscriptionStartDate is present');
    assert(Boolean(shop.subscriptionExpiresAt), 'shop.subscriptionExpiresAt is present');

    const dbStart = new Date(dbShop.subscriptionStartDate).toISOString();
    const apiStart = new Date(shop.subscriptionStartDate).toISOString();
    assert(dbStart === apiStart, `Start date matches DB record (${apiStart})`);

    const dbExpiry = new Date(dbShop.subscriptionExpiresAt).toISOString();
    const apiExpiry = new Date(shop.subscriptionExpiresAt).toISOString();
    assert(dbExpiry === apiExpiry, `Expiry date matches DB record (${apiExpiry})`);

    // Verify DD/MM/YYYY formatting
    const dmyStart = formatDateDMY(shop.subscriptionStartDate);
    const dmyExpiry = formatDateDMY(shop.subscriptionExpiresAt);
    const timeExpiry = formatTime12h(shop.subscriptionExpiresAt);

    assert(/^\d{2}\/\d{2}\/\d{4}$/.test(dmyStart), `Plan Start Date matches DD/MM/YYYY format: "${dmyStart}"`);
    assert(/^\d{2}\/\d{2}\/\d{4}$/.test(dmyExpiry), `Plan Expiry Date matches DD/MM/YYYY format: "${dmyExpiry}"`);
    assert(/^\d{2}:\d{2}\s(AM|PM)$/.test(timeExpiry), `Expiry Time matches HH:MM AM/PM format: "${timeExpiry}"`);

    // Verify Days Remaining calculation
    assert(typeof shop.daysRemaining === 'number', `Days remaining is a number: ${shop.daysRemaining}`);
    const expectedDays = calculateRemainingDays(shop.subscriptionExpiresAt, shop.serverTime || new Date());
    assert(
      Math.abs(shop.daysRemaining - expectedDays) <= 1,
      `Calculated days remaining matches server formula (${shop.daysRemaining} vs expected ${expectedDays})`
    );

    // Verify Subscription Status
    assert(
      ['ACTIVE', 'EXPIRING_SOON', 'EXPIRED', 'SUSPENDED'].includes(shop.calculatedStatus || shop.subscriptionStatus),
      `Subscription Status is valid: "${shop.calculatedStatus || shop.subscriptionStatus}"`
    );
  }

  // ─────────────────────────────────────────────────────────────
  // 2. VERIFY WORKSHOP SUBSCRIPTION DETAILS PAGE (GET /admin/shops/:id)
  // ─────────────────────────────────────────────────────────────
  console.log('\n--- 2. Testing Workshop Details Dossier (GET /admin/shops/:id) ---');
  const targetShop = apiShops[0];
  const detailRes = await fetch(`${BASE_URL}/admin/shops/${targetShop._id}`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const detailJson = await detailRes.json();
  const detailData = detailJson.data || detailJson;
  const detailedShop = detailData.shop;
  const subscription = detailData.subscription;

  assert(Boolean(detailedShop), 'Returned shop dossier object');
  assert(Boolean(subscription), 'Returned detailed subscription object');

  const detailDmyStart = formatDateDMY(detailedShop.subscriptionStartDate || subscription.startDate);
  const detailDmyExpiry = formatDateDMY(detailedShop.subscriptionExpiresAt || subscription.expiresAt);
  const detailTimeExpiry = formatTime12h(detailedShop.subscriptionExpiresAt || subscription.expiresAt);

  assert(/^\d{2}\/\d{2}\/\d{4}$/.test(detailDmyStart), `Dossier Plan Start Date formatted as DD/MM/YYYY: "${detailDmyStart}"`);
  assert(/^\d{2}\/\d{2}\/\d{4}$/.test(detailDmyExpiry), `Dossier Plan Expiry Date formatted as DD/MM/YYYY: "${detailDmyExpiry}"`);
  assert(/^\d{2}:\d{2}\s(AM|PM)$/.test(detailTimeExpiry), `Dossier Expiry Time formatted as HH:MM AM/PM: "${detailTimeExpiry}"`);
  assert(typeof (detailedShop.daysRemaining ?? subscription.daysRemaining) === 'number', 'Dossier contains live daysRemaining count');

  // ─────────────────────────────────────────────────────────────
  // 3. VERIFY EXPIRED SUBSCRIPTION HIGHLIGHT & ACCESS BLOCKING
  // ─────────────────────────────────────────────────────────────
  console.log('\n--- 3. Testing Expired Subscription Highlighting & Access Blocking ---');
  const testUser = await User.findOne({ email: 'keshav@gmail.com' });
  const testShop = await Shop.findOne({ name: /keshav/i });
  const pastExpiry = new Date(Date.now() - 3600000); // 1 hour ago
  await Shop.updateOne(
    { _id: testShop._id },
    { $set: { subscriptionExpiresAt: pastExpiry, subscriptionStatus: 'EXPIRED' } }
  );

  // Check /shops reflects expired status
  const expiredCheckRes = await fetch(`${BASE_URL}/shops`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const expiredCheckList = await expiredCheckRes.json();
  const shopsList = Array.isArray(expiredCheckList) ? expiredCheckList : expiredCheckList.data;
  const expiredShopInList = shopsList.find((s) => s._id.toString() === testShop._id.toString());

  assert(expiredShopInList.calculatedStatus === 'EXPIRED', 'GET /shops calculates status as EXPIRED');
  assert(expiredShopInList.daysRemaining === 0, 'GET /shops reports 0 days remaining for expired shop');
  assert(
    formatDateDMY(expiredShopInList.subscriptionExpiresAt) === formatDateDMY(pastExpiry),
    `Expired shop displays exact expiry date in DD/MM/YYYY (${formatDateDMY(pastExpiry)})`
  );

  // Expired user login rejection
  const expiredLogin = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: 'keshav@gmail.com', password: '123456' }),
  });
  assert(expiredLogin.status === 403, `Expired workshop owner login blocked with 403 (got ${expiredLogin.status})`);
  const expData = await expiredLogin.json();
  assert(expData.isExpired === true, 'Login rejection includes isExpired: true');
  assert(expData.shopId === testShop._id.toString(), 'Rejection returns shopId for renewal modal');

  // ─────────────────────────────────────────────────────────────
  // 4. VERIFY RENEWAL RESTORES ACCESS & UPDATES EXPIRY DATE
  // ─────────────────────────────────────────────────────────────
  console.log('\n--- 4. Testing Renewal & New Expiry Date Display ---');
  const plan = await Plan.findOne({ active: true });
  const ownerToken = jwt.sign(
    { id: testUser._id, email: testUser.email, role: testUser.role, shopId: testShop._id },
    JWT_SECRET,
    { expiresIn: '1h' }
  );

  const initialHistoryCount = (await Shop.findById(testShop._id)).subscriptionHistory.length;

  const renewRes = await fetch(`${BASE_URL}/shops/${testShop._id}/renew`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${ownerToken}`,
    },
    body: JSON.stringify({
      planId: plan._id.toString(),
      billingCycle: 'monthly',
      paymentMethod: 'UPI Payment',
      referenceId: `TEST-VERIFY-${Date.now()}`,
    }),
  });
  assert(renewRes.status === 200, `Renewal returned 200 OK (got ${renewRes.status})`);
  const renewJson = await renewRes.json();
  assert(renewJson.success === true, 'Renewal response success: true');

  // Verify new expiry date in DB
  const renewedShopDb = await Shop.findById(testShop._id);
  const newExpiryTime = new Date(renewedShopDb.subscriptionExpiresAt).getTime();
  assert(newExpiryTime > Date.now() + 25 * 86400000, 'New expiry date set ~30 days in future');
  assert(renewedShopDb.subscriptionStatus === 'ACTIVE', 'Renewed subscriptionStatus is ACTIVE');
  assert(renewedShopDb.subscriptionHistory.length === initialHistoryCount + 1, 'Subscription history preserved and updated');

  // Verify /shops reflects new expiry date and days remaining
  const postRenewShopsRes = await fetch(`${BASE_URL}/shops`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const postRenewShops = (await postRenewShopsRes.json()).data || (await postRenewShopsRes.json());
  const renewedShopInList = postRenewShops.find((s) => s._id.toString() === testShop._id.toString());

  assert(renewedShopInList.calculatedStatus === 'ACTIVE', 'GET /shops now reports ACTIVE status');
  assert(renewedShopInList.daysRemaining >= 29, `GET /shops reports live days remaining: ${renewedShopInList.daysRemaining}`);
  const postRenewDmy = formatDateDMY(renewedShopInList.subscriptionExpiresAt);
  const expectedDmy = formatDateDMY(renewedShopDb.subscriptionExpiresAt);
  assert(postRenewDmy === expectedDmy, `Displayed expiry date (${postRenewDmy}) matches renewed DB record (${expectedDmy})`);

  // Verify workshop login access restored
  const reLogin = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: 'keshav@gmail.com', password: '123456' }),
  });
  assert(reLogin.status === 200, 'Post-renewal workshop owner login succeeds with 200 OK');

  console.log('\n===============================================================');
  console.log(`🎉 ALL ${passed} OF ${total} SUBSCRIPTION DATE VERIFICATION TESTS PASSED!`);
  console.log('===============================================================\n');

  await mongoose.disconnect();
}

verifyAll().catch((err) => {
  console.error('\n❌ Verification failed:', err);
  process.exit(1);
});
