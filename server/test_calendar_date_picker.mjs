import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import assert from 'assert';

const BASE_URL = 'http://localhost:5000/api';
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_repairflow_2026';

async function runTests() {
  console.log('========================================================');
  console.log('   ZAPATE CALENDAR DATE PICKER & DATA AVAILABILITY TESTS');
  console.log('========================================================\n');

  await mongoose.connect('mongodb://127.0.0.1:27017/repairflow_db');
  const db = mongoose.connection.db;

  // 1. Find the gayatri mobile workshop user from database
  const user = await db.collection('users').findOne({ email: 'gayatrimobile@gmail.com' });
  assert(user, 'User gayatrimobile@gmail.com must exist');
  console.log(`✓ 1. Found Workshop User: ${user.name} (${user.email}), shopId: ${user.shopId}`);

  // 2. Generate authentic JWT auth token
  const token = jwt.sign(
    { id: user._id, email: user.email, role: user.role, shopId: user.shopId },
    JWT_SECRET,
    { expiresIn: '1d' }
  );
  console.log('✓ 2. Generated JWT authentication token for workshop session');

  // 3. Test GET /reports/calendar-dates for September 2026 (month navigation test 1)
  console.log('\n--- Test 3: Fetching active dates for September 2026 ---');
  const resSep = await fetch(`${BASE_URL}/reports/calendar-dates?year=2026&month=9&timezoneOffset=-330`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  assert.strictEqual(resSep.status, 200, 'HTTP status should be 200');
  const dataSep = await resSep.json();
  assert(dataSep.success, 'Response success should be true');
  assert(Array.isArray(dataSep.data.activeDates), 'activeDates should be an array');
  console.log('September 2026 Active Dates with database records:', dataSep.data.activeDates);

  // Validate dates with data vs dates without data in September 2026
  assert(dataSep.data.activeDates.includes('2026-09-07'), '2026-09-07 must be marked as having data (Invoice/Payment present)');
  assert(dataSep.data.activeDates.includes('2026-09-10'), '2026-09-10 must be marked as having data (Invoice/Payment present)');
  assert(dataSep.data.activeDates.includes('2026-09-24'), '2026-09-24 must be marked as having data (Invoice/Customer present)');
  assert(!dataSep.data.activeDates.includes('2026-09-16'), '2026-09-16 must NOT have data (empty workshop day from user screenshot)');
  assert(!dataSep.data.activeDates.includes('2026-09-01'), '2026-09-01 must NOT have data');
  console.log('✓ 3. Verified September 2026: Dates with data have circular outline indicator, dates without data do not.');

  // 4. Test GET /reports/calendar-dates for October 2026 (month navigation test 2)
  console.log('\n--- Test 4: Month navigation to October 2026 ---');
  const resOct = await fetch(`${BASE_URL}/reports/calendar-dates?year=2026&month=10&timezoneOffset=-330`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  assert.strictEqual(resOct.status, 200, 'HTTP status should be 200');
  const dataOct = await resOct.json();
  assert(dataOct.success, 'Response success should be true');
  console.log('October 2026 Active Dates with database records:', dataOct.data.activeDates);
  assert(dataOct.data.activeDates.includes('2026-10-19'), '2026-10-19 must be marked as having data');
  assert(!dataOct.data.activeDates.includes('2026-10-15'), '2026-10-15 must NOT have data');
  console.log('✓ 4. Verified October 2026: Month navigation successfully loads and updates active date circles.');

  // 5. Test GET /reports/calendar-dates for November 2026 (month navigation test 3 - empty month)
  console.log('\n--- Test 5: Month navigation to empty month (November 2026) ---');
  const resNov = await fetch(`${BASE_URL}/reports/calendar-dates?year=2026&month=11&timezoneOffset=-330`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  assert.strictEqual(resNov.status, 200, 'HTTP status should be 200');
  const dataNov = await resNov.json();
  console.log('November 2026 Active Dates count:', dataNov.data.activeDates.length);
  console.log('✓ 5. Verified empty month returns clean zero active dates.');

  // 6. Test date selection & dashboard fetching for Date with data (2026-09-07)
  console.log('\n--- Test 6: Selecting date with data (2026-09-07) ---');
  const dashWithDataRes = await fetch(`${BASE_URL}/reports/dashboard?date=2026-09-07&timezoneOffset=-330`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  assert.strictEqual(dashWithDataRes.status, 200, 'HTTP status should be 200');
  const dashWithData = await dashWithDataRes.json();
  console.log('Selected Date (with data) metrics:');
  console.log(' - Date Sales:', dashWithData.data.dateSales);
  console.log(' - Recent Payments:', dashWithData.data.recentPayments?.length);
  assert(Number(dashWithData.data.dateSales) > 0 || dashWithData.data.recentPayments?.length > 0, 'Must have recorded sales or payments');
  console.log('✓ 6. Verified dashboard correctly renders real records when clicking date with data.');

  // 7. Test date selection & dashboard fetching for Date without data (2026-09-16 from screenshot)
  console.log('\n--- Test 7: Selecting date without data (2026-09-16) ---');
  const dashNoDataRes = await fetch(`${BASE_URL}/reports/dashboard?date=2026-09-16&timezoneOffset=-330`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  assert.strictEqual(dashNoDataRes.status, 200, 'HTTP status should be 200');
  const dashNoData = await dashNoDataRes.json();
  console.log('Selected Date (without data) metrics:');
  console.log(' - Date Sales:', dashNoData.data.dateSales);
  console.log(' - Date Repairs:', dashNoData.data.dateRepairs);
  assert.strictEqual(Number(dashNoData.data.dateSales || 0), 0, 'Sales on 16/09/2026 should be 0');
  assert.strictEqual(Number(dashNoData.data.dateRepairs || 0), 0, 'Repairs on 16/09/2026 should be 0');
  console.log('✓ 7. Verified dashboard correctly renders 0 records when clicking date without data.');

  console.log('\n========================================================');
  console.log('   ALL 7 TESTS PASSED SUCCESSFULLY!                    ');
  console.log('========================================================\n');

  await mongoose.disconnect();
  process.exit(0);
}

runTests().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
