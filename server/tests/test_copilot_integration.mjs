/**
 * Zapate AI Diagnostic Copilot - Node.js Backend Integration Test Suite
 * Tests:
 *  1. Actual Test Result Recording & Idempotent Duplicate Prevention
 *  2. Workshop Data Isolation (Shop A vs Shop B)
 *  3. Non-Persistent What-If Simulation (Zero DB side effects)
 *  4. Explainable Diagnostic Journey Retrieval
 *  5. Knowledge Gap Detection & Supervisor Review
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { aiService } from '../src/modules/ai/ai.service.js';
import { DiagnosticSession } from '../src/modules/ai/diagnosticSession.model.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/repair-shop-mern';

async function runTests() {
  console.log('\n==================================================================');
  console.log('RUNNING ZAPATE AI DIAGNOSTIC COPILOT NODE.JS INTEGRATION TESTS');
  console.log('==================================================================\n');

  let passed = 0;
  let failed = 0;

  try {
    await mongoose.connect(MONGO_URI);
    console.log('[DB] Connected to MongoDB for integration testing.');
  } catch (err) {
    console.error('[Error] Could not connect to MongoDB:', err.message);
    process.exit(1);
  }

  const shopA = new mongoose.Types.ObjectId();
  const shopB = new mongoose.Types.ObjectId();
  const techUser = { _id: new mongoose.Types.ObjectId(), name: 'Senior Tech Jane' };

  try {
    // -------------------------------------------------------------
    // TEST 1: Record Actual Test Result (PASS) & State Update
    // -------------------------------------------------------------
    const recordPayload = {
      deviceBrand: 'Samsung',
      deviceModel: 'Galaxy S21',
      symptoms: 'Phone dropped on floor and now it does not charge.',
      testId: 'TEST_CHARGING_PORT_MICROSCOPE_PIN_CHECK',
      testName: 'Microscope Visual Inspection of Charging Port Pins',
      result: 'PASS',
      observedValue: 'Pins straight and gold plated with no lint',
    };

    const res1 = await aiService.recordActualTestResult(recordPayload, shopA, techUser);
    const session1Id = res1.session._id;

    if (
      res1.session &&
      res1.session.actualTestResults.length === 1 &&
      res1.session.actualTestResults[0].result === 'PASS' &&
      res1.diagnosis.hypotheses.length > 0
    ) {
      console.log(`[PASS] Test 1: Actual test result recorded and diagnostic hypotheses updated for Shop A. Session ID: ${session1Id}`);
      passed++;
    } else {
      console.log('[FAIL] Test 1: Record test result failed or unexpected structure');
      failed++;
    }

    // -------------------------------------------------------------
    // TEST 2: Duplicate Prevention (Idempotency)
    // -------------------------------------------------------------
    let duplicatePrevented = false;
    try {
      await aiService.recordActualTestResult(
        { ...recordPayload, sessionId: session1Id },
        shopA,
        techUser
      );
    } catch (err) {
      if (err.message.includes('has already been recorded')) {
        duplicatePrevented = true;
      }
    }

    if (duplicatePrevented) {
      console.log('[PASS] Test 2: Idempotency enforced. Duplicate test result was cleanly rejected.');
      passed++;
    } else {
      console.log('[FAIL] Test 2: Duplicate test submission was not prevented.');
      failed++;
    }

    // -------------------------------------------------------------
    // TEST 3: Workshop Data Isolation
    // -------------------------------------------------------------
    // Shop B should NOT be able to see or access Shop A's session
    const journeyShopB = await aiService.getDiagnosticJourney(session1Id, shopB);
    const sessionInShopB = await DiagnosticSession.findOne({ _id: session1Id, shopId: shopB });

    if (journeyShopB.length === 0 && !sessionInShopB) {
      console.log('[PASS] Test 3: Workshop isolation verified. Shop B cannot access Shop A diagnostic journey.');
      passed++;
    } else {
      console.log('[FAIL] Test 3: Workshop isolation breached. Shop B accessed Shop A session data.');
      failed++;
    }

    // -------------------------------------------------------------
    // TEST 4: Diagnostic Journey Traceability
    // -------------------------------------------------------------
    const journeyShopA = await aiService.getDiagnosticJourney(session1Id, shopA);
    if (journeyShopA && journeyShopA.length >= 2) {
      console.log(`[PASS] Test 4: Diagnostic journey retrieved with ${journeyShopA.length} traceable timeline steps.`);
      passed++;
    } else {
      console.log(`[FAIL] Test 4: Expected >= 2 journey steps, got ${journeyShopA ? journeyShopA.length : 0}`);
      failed++;
    }

    // -------------------------------------------------------------
    // TEST 5: Non-Persistent What-If Simulation
    // -------------------------------------------------------------
    const initialSessionCount = await DiagnosticSession.countDocuments();
    const simResult = await aiService.runWhatIfSimulation({
      deviceBrand: 'Samsung',
      deviceModel: 'Galaxy S21',
      symptoms: 'Phone dropped on floor and now it does not charge.',
      testId: 'TEST_CHARGING_PORT_MICROSCOPE_PIN_CHECK',
      hypotheticalOutcome: 'FAIL',
      observedValue: 'Pins bent',
    });
    const postSessionCount = await DiagnosticSession.countDocuments();

    if (
      simResult &&
      simResult.isHypothetical === true &&
      simResult.hypotheticalOutcome === 'FAIL' &&
      initialSessionCount === postSessionCount
    ) {
      console.log('[PASS] Test 5: What-if simulation executed non-persistently. Zero DB side effects confirmed.');
      passed++;
    } else {
      console.log('[FAIL] Test 5: What-if simulation failed or modified database state.');
      failed++;
    }

    // -------------------------------------------------------------
    // TEST 6: Knowledge Gap Detection and Supervisor Review
    // -------------------------------------------------------------
    // Trigger a session with an unknown device and unrecognized symptoms
    const gapPayload = {
      deviceBrand: 'AlienBrandX',
      deviceModel: 'CosmoZero',
      symptoms: 'Device makes strange ultrasonic whistling noises during full moon.',
      testId: 'TEST_CHARGING_PORT_MICROSCOPE_PIN_CHECK',
      result: 'INCONCLUSIVE',
    };

    const gapRes = await aiService.recordActualTestResult(gapPayload, shopA, techUser);
    const shopAGaps = await aiService.getKnowledgeGaps(shopA);

    if (shopAGaps.length > 0) {
      const targetGap = shopAGaps[0];
      console.log(`[PASS] Test 6a: Knowledge gap automatically detected: '${targetGap.title}' for ${targetGap.deviceBrand}`);
      passed++;

      // Supervisor Review: Approve gap
      const reviewedGap = await aiService.reviewKnowledgeGap(
        targetGap.gapId,
        'APPROVE',
        'Verified on bench: new acoustic sensor defect requires new fault rule addition.',
        shopA,
        techUser._id
      );

      if (reviewedGap && reviewedGap.status === 'APPROVED') {
        console.log(`[PASS] Test 6b: Knowledge gap reviewed and status updated to APPROVED by authorized user.`);
        passed++;
      } else {
        console.log('[FAIL] Test 6b: Knowledge gap review failed.');
        failed++;
      }
    } else {
      console.log('[FAIL] Test 6a: Knowledge gap was not detected for unrecognized symptoms.');
      failed++;
    }

    // Clean up test sessions created during test
    await DiagnosticSession.deleteMany({ shopId: { $in: [shopA, shopB] } });
    console.log('[Cleanup] Test sessions successfully removed.');

  } catch (err) {
    console.error('[Error during test execution]:', err);
    failed++;
  } finally {
    await mongoose.disconnect();
    console.log('\n==================================================================');
    console.log(`INTEGRATION TEST RESULTS: ${passed} PASSED, ${failed} FAILED (TOTAL: ${passed + failed})`);
    console.log('==================================================================\n');
    process.exit(failed > 0 ? 1 : 0);
  }
}

runTests();
