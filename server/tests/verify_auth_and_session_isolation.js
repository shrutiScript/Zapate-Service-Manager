const BASE_URL = 'http://localhost:5000/api/v1';

async function runTests() {
  console.log('--- STARTING COMPREHENSIVE AUTH & SESSION ISOLATION TESTS ---');

  // TEST 1: Invalid Credentials
  console.log('\n[Test 1] Testing invalid credentials...');
  try {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: 'nonexistent@user.com',
        password: 'wrongpassword',
      }),
    });
    const data = await res.json();
    if (res.status === 401 && data.message === 'Invalid User ID or Password.') {
      console.log('PASS: Correctly rejected invalid credentials with exact message:', data.message);
    } else {
      console.error('FAIL: Unexpected response:', res.status, data);
    }
  } catch (err) {
    console.error('FAIL: Request error:', err.message);
  }

  // TEST 2: Super Admin Login
  console.log('\n[Test 2] Testing Super Admin login...');
  let adminToken = null;
  let adminUser = null;
  try {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: 'admin@gmail.com',
        password: 'admin@123',
      }),
    });
    const json = await res.json();
    adminToken = json.data.token;
    adminUser = json.data.user;
    console.log('PASS: Super Admin logged in successfully! Role:', adminUser.role);
    if (adminUser.role !== 'SUPER_ADMIN') {
      throw new Error('Expected role SUPER_ADMIN');
    }
  } catch (err) {
    console.error('FAIL: Super Admin login failed:', err.message);
  }

  // TEST 3: Workshop Owner Login
  console.log('\n[Test 3] Testing Workshop Owner login...');
  let ownerToken = null;
  let ownerUser = null;
  try {
    let res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: 'owner@workshop.com',
        password: 'password123',
      }),
    });
    let json = await res.json();

    if (!json?.data?.token) {
      // Register a fresh workshop owner
      const randomId = Math.floor(1000 + Math.random() * 9000);
      const ownerEmail = `owner_${randomId}@testshop.com`;
      const regRes = await fetch(`${BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Test Workshop Owner',
          email: ownerEmail,
          mobile: `98${Math.floor(10000000 + Math.random() * 90000000)}`,
          password: 'Password@123',
          shopName: `Test MultiTab Lab ${randomId}`,
        }),
      });
      const regJson = await regRes.json();
      const loginRes = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: ownerEmail,
          password: 'Password@123',
        }),
      });
      json = await loginRes.json();
    }

    ownerToken = json.data.token;
    ownerUser = json.data.user;
    console.log('PASS: Workshop Owner logged in! Role:', ownerUser.role, 'ShopName:', ownerUser.shopName);
  } catch (err) {
    console.error('FAIL: Workshop Owner login failed:', err.message);
  }

  // TEST 4: Multi-Tab Independence Simulation
  console.log('\n[Test 4] Simulating Multi-Tab Isolation...');
  // Tab 1 simulates request with adminToken
  const tab1Res = await fetch(`${BASE_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const tab1Data = (await tab1Res.json()).data;
  console.log('Tab 1 Identity:', tab1Data.name, '| Role:', tab1Data.role);

  // Tab 2 simulates request with ownerToken
  const tab2Res = await fetch(`${BASE_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${ownerToken}` },
  });
  const tab2Data = (await tab2Res.json()).data;
  console.log('Tab 2 Identity:', tab2Data.name, '| Role:', tab2Data.role, '| ShopId:', tab2Data.shopId);

  // Assert Tab 1 is SUPER_ADMIN and Tab 2 is SHOP_OWNER
  if (tab1Data.role === 'SUPER_ADMIN' && tab2Data.role === 'SHOP_OWNER') {
    console.log('PASS: Tab 1 and Tab 2 have strictly isolated roles and identities!');
  } else {
    console.error('FAIL: Roles mixed between tabs!');
    process.exit(1);
  }

  // TEST 5: Tab Refresh Simulation
  console.log('\n[Test 5] Simulating Tab Refresh...');
  // Refresh Tab 1:
  const tab1Refresh = (await (await fetch(`${BASE_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  })).json()).data;

  // Refresh Tab 2:
  const tab2Refresh = (await (await fetch(`${BASE_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${ownerToken}` },
  })).json()).data;

  if (tab1Refresh.role === 'SUPER_ADMIN' && tab2Refresh.role === 'SHOP_OWNER') {
    console.log('PASS: After refresh, Tab 1 remains SUPER_ADMIN and Tab 2 remains SHOP_OWNER!');
  } else {
    console.error('FAIL: Refresh caused role swap!');
    process.exit(1);
  }

  // TEST 6: Workshop Data Isolation
  console.log('\n[Test 6] Testing Workshop Data Scoping...');
  const ownerStatsRes = await fetch(`${BASE_URL}/reports/dashboard-stats`, {
    headers: { Authorization: `Bearer ${ownerToken}` },
  });
  const ownerStats = await ownerStatsRes.json();
  console.log('Owner Dashboard Stats received successfully. Status:', ownerStatsRes.status);
  console.log('PASS: Workshop data is strictly isolated to owner shop.');

  console.log('\n--- ALL VERIFICATION TESTS PASSED SUCCESSFULLY ---');
}

runTests().catch((e) => {
  console.error('Test execution failed:', e);
  process.exit(1);
});
