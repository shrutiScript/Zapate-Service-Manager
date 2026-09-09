const BASE_URL = 'http://localhost:5000/api/v1';

async function testBlockFlow() {
  console.log('--- STARTING BLOCKED WORKSHOP LIFECYCLE TEST ---');

  // 1. Login Super Admin
  const adminRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: 'admin@gmail.com', password: 'admin@123' }),
  });
  const adminToken = (await adminRes.json()).data.token;

  // 2. Register & Login a workshop owner
  const rand = Math.floor(1000 + Math.random() * 9000);
  const email = `blocktest_${rand}@shop.com`;
  await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Block Target Owner',
      email: email,
      mobile: `97${Math.floor(10000000 + Math.random() * 90000000)}`,
      password: 'Password@123',
      shopName: `Block Test Workshop ${rand}`,
    }),
  });

  const ownerRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: email, password: 'Password@123' }),
  });
  const ownerData = (await ownerRes.json()).data;
  const ownerToken = ownerData.token;
  const shopId = ownerData.user.shopId;
  console.log('Registered workshop with shopId:', shopId);

  // 3. Super Admin blocks this workshop
  const blockRes = await fetch(`${BASE_URL}/shops/${shopId}/block`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({ reason: 'Compliance check violation test' }),
  });
  console.log('Admin block response status:', blockRes.status);

  // 4. Verify existing active owner session is rejected immediately
  const checkSessionRes = await fetch(`${BASE_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${ownerToken}` },
  });
  const checkSessionData = await checkSessionRes.json();
  console.log('Owner /auth/me after block status:', checkSessionRes.status, 'Message:', checkSessionData.message);

  if (
    checkSessionRes.status === 401 &&
    checkSessionData.isBlocked === true &&
    checkSessionData.message === 'Your workshop account has been blocked by the administrator. Please contact support.'
  ) {
    console.log('PASS: Existing session immediately invalidated with exact blocked message!');
  } else {
    console.error('FAIL: Unexpected session validation response:', checkSessionRes.status, checkSessionData);
    process.exit(1);
  }

  // 5. Verify future login attempts by this blocked workshop are denied
  const blockedLoginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: email, password: 'Password@123' }),
  });
  const blockedLoginData = await blockedLoginRes.json();
  console.log('Blocked login attempt status:', blockedLoginRes.status, 'Message:', blockedLoginData.message);

  if (
    blockedLoginRes.status === 403 &&
    blockedLoginData.message === 'Your workshop account has been blocked by the administrator. Please contact support.'
  ) {
    console.log('PASS: Login denied with exact blocked account message!');
  } else {
    console.error('FAIL: Unexpected blocked login response:', blockedLoginRes.status, blockedLoginData);
    process.exit(1);
  }

  // 6. Super Admin unblocks the workshop
  const unblockRes = await fetch(`${BASE_URL}/shops/${shopId}/unblock`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({ reason: 'Compliance audit resolved' }),
  });
  console.log('Admin unblock status:', unblockRes.status);

  // 7. Workshop owner can now log in again
  const restoredLoginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: email, password: 'Password@123' }),
  });
  console.log('Restored login status:', restoredLoginRes.status);
  if (restoredLoginRes.status === 200) {
    console.log('PASS: Workshop owner successfully re-authenticated after unblock!');
  } else {
    console.error('FAIL: Restored login failed');
    process.exit(1);
  }

  console.log('\n--- ALL BLOCKED WORKSHOP TESTS PASSED PERFECTLY ---');
}

testBlockFlow().catch((e) => {
  console.error('Test failed:', e);
  process.exit(1);
});
