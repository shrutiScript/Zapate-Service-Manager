import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { Shop } from './src/modules/shops/shop.model.js';
import { User } from './src/modules/users/user.model.js';
import { SPARE_CATEGORIES } from '../client/src/modules/inventory/constants/categories.js';

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

function makeToken(user) {
  return jwt.sign(
    {
      id: user._id.toString(),
      email: user.email,
      role: user.role,
      shopId: user.shopId ? user.shopId.toString() : null,
    },
    JWT_SECRET,
    { expiresIn: '1d' }
  );
}

async function apiRequest(endpoint, method = 'GET', body = null, token = null) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const options = { method, headers };
  if (body) options.body = JSON.stringify(body);

  const res = await fetch(`${BASE_URL}${endpoint}`, options);
  const data = await res.json().catch(() => ({}));
  return { status: res.status, ok: res.ok, data };
}

async function runTests() {
  console.log('\n================================================================');
  console.log('🧪 SPARE PARTS CATEGORIES VALIDATION SUITE');
  console.log('================================================================\n');

  await mongoose.connect(MONGO_URI);
  console.log(`Connected to MongoDB: ${MONGO_URI}\n`);

  // 1. Verify all 8 categories exist
  console.log('--- Step 1: Category Structure & Asset Verification ---');
  const expectedCategories = [
    'Screens & LCD Displays',
    'Batteries',
    'Charging Ports & Flex Cable',
    'Camera Modules',
    'Back Glass & Housing',
    'IC Chips & Board Components',
    'Speakers & Microphones',
    'Tools & Consumables',
  ];

  assert(SPARE_CATEGORIES.length === 8, `Exactly 8 spare parts categories defined (got ${SPARE_CATEGORIES.length})`);
  expectedCategories.forEach((catName) => {
    const found = SPARE_CATEGORIES.find((c) => c.name === catName);
    assert(found !== undefined, `Category "${catName}" is configured`);
    assert(Boolean(found.bgColor), `Category "${catName}" has soft pastel background: ${found.bgColor}`);
    assert(Boolean(found.image), `Category "${catName}" has designated image asset: ${found.image}`);
  });

  // Verify image accessibility over HTTP
  console.log('\n--- Step 2: Image Asset HTTP Accessibility ---');
  for (const cat of SPARE_CATEGORIES) {
    const res = await fetch(`http://localhost:3000${cat.image}`);
    assert(res.ok && res.status === 200, `Image asset for "${cat.name}" is accessible at http://localhost:3000${cat.image} (status: ${res.status})`);
  }

  // 2. Workshop & Inventory Isolation and SKU Counting
  console.log('\n--- Step 3: Dynamic Database SKU Counting & Workshop Isolation ---');
  const userA = await User.findOne({ email: 'apexa@gmail.com' });
  const userB = await User.findOne({ email: 'shree@gmail.com' });
  assert(userA, `Found test user A: ${userA.email}`);
  assert(userB, `Found test user B: ${userB.email}`);

  const tokenA = makeToken(userA);
  const tokenB = makeToken(userB);

  // Check baseline inventory for Shop A
  const baselineA = await apiRequest('/inventory', 'GET', null, tokenA);
  assert(baselineA.ok, `Fetched inventory for Shop A (status: ${baselineA.status})`);
  const initialPartsA = Array.isArray(baselineA.data) ? baselineA.data : baselineA.data?.data || [];

  // Register a new test part in Category "Screens & LCD Displays"
  const testPart = {
    name: 'iPhone 15 Pro OLED Super Retina Screen Assembly',
    sku: `DISP-IP15P-${Date.now()}`,
    brand: 'Apple',
    compatibleModel: 'iPhone 15 Pro',
    category: 'Screens & LCD Displays',
    locationRack: 'Shelf A-01',
    quantity: 12,
    purchasePrice: 4500,
    sellingPrice: 7200,
    minimumQuantity: 3,
  };

  const addRes = await apiRequest('/inventory', 'POST', testPart, tokenA);
  assert(addRes.ok, `Created spare part in Shop A: "${testPart.name}"`);
  const createdPartId = addRes.data?.data?._id || addRes.data?._id;

  try {
    // Re-fetch Shop A inventory
    const updatedA = await apiRequest('/inventory', 'GET', null, tokenA);
    const partsListA = Array.isArray(updatedA.data) ? updatedA.data : updatedA.data?.data || [];

    // Helper calculation matching frontend logic
    const screensCat = SPARE_CATEGORIES.find((c) => c.name === 'Screens & LCD Displays');
    const screensParts = partsListA.filter((p) => {
      const pCat = (p.category || '').toLowerCase().trim();
      const pName = (p.name || '').toLowerCase().trim();
      return (
        pCat === screensCat.name.toLowerCase() ||
        pCat === screensCat.shortName.toLowerCase() ||
        screensCat.matchTerms.some((term) => pCat.includes(term) || pName.includes(term))
      );
    });

    assert(screensParts.length >= 1, `Screens & LCD Displays SKU count accurately reflects database items (count: ${screensParts.length})`);

    // Verify Workshop B does NOT see Shop A's inventory
    const resB = await apiRequest('/inventory', 'GET', null, tokenB);
    const partsListB = Array.isArray(resB.data) ? resB.data : resB.data?.data || [];
    const leakedPart = partsListB.find((p) => p.sku === testPart.sku);
    assert(!leakedPart, `Workshop data isolation verified: Shop B does not see Shop A's part`);

  } finally {
    // Cleanup created test part
    if (createdPartId) {
      await apiRequest(`/inventory/${createdPartId}`, 'DELETE', null, tokenA);
      console.log(`Cleaned up test part ${createdPartId}`);
    }
    await mongoose.disconnect();
  }

  console.log('\n================================================================');
  console.log(`🎉 ALL TESTS PASSED: ${passed} passed, ${failed} failed`);
  console.log('================================================================\n');
}

runTests().catch((err) => {
  console.error('\n❌ TEST RUN FAILED:', err);
  process.exit(1);
});
