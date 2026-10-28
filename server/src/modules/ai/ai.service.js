import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import mongoose from 'mongoose';
import { Repair } from '../repairs/repair.model.js';
import { SparePart } from '../inventory/inventory.model.js';
import { AiFeedback } from './aiFeedback.model.js';
import { DiagnosticSession } from './diagnosticSession.model.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_SERVER_DIR = path.resolve(__dirname, '../../../');
const PYTHON_MAIN_SCRIPT = path.join(ROOT_SERVER_DIR, 'ai', 'main.py');

export class AiService {
  /**
   * Executes the Python Hybrid Diagnosis Agent with shop-isolated historical context.
   */
  async runDiagnosis(payload, shopId = null) {
    const {
      deviceBrand = '',
      deviceModel = '',
      symptoms = '',
      confirmedSymptoms = [],
      followUpAnswers = {},
      repairJobId = null,
    } = payload;

    // 1. Strictly isolate shop historical data: query ONLY completed repairs for this shop
    let historicalCases = [];
    let inventoryParts = [];

    if (shopId) {
      try {
        const pastRepairs = await Repair.find({
          shopId,
          status: { $in: ['Completed', 'Delivered', 'Ready for Pickup', 'Quality Check'] },
        })
          .select('number device issue diagnosisNotes status parts finalAmount estimatedAmount createdAt')
          .sort({ createdAt: -1 })
          .limit(40)
          .lean();

        // Anonymize completely: no customer names, mobile, or private identifiers
        historicalCases = pastRepairs.map((r) => ({
          _id: r._id.toString(),
          number: r.number,
          device: {
            brand: r.device?.brand || '',
            model: r.device?.model || '',
          },
          issue: r.issue,
          diagnosisNotes: r.diagnosisNotes,
          status: r.status,
          parts: (r.parts || []).map((p) => p.name || 'Component'),
          finalAmount: r.finalAmount || r.estimatedAmount || 0,
        }));

        // Fetch shop inventory parts for real cost calculation
        const parts = await SparePart.find({
          shopId,
          quantity: { $gt: 0 },
        })
          .select('name compatibleModel brand sellingPrice purchasePrice quantity status')
          .limit(60)
          .lean();

        inventoryParts = parts.map((p) => ({
          id: p._id.toString(),
          name: p.name,
          compatibleModel: p.compatibleModel,
          brand: p.brand,
          sellingPrice: p.sellingPrice,
          quantity: p.quantity,
          status: p.status,
        }));
      } catch (dbErr) {
        console.warn('[AiService] Failed to query shop history or inventory:', dbErr.message);
      }
    }

    const testResults = payload.testResults || payload.test_results || [];
    const whatIfSimulation = payload.whatIfSimulation || payload.what_if_simulation || null;

    const pythonPayload = {
      shopId: shopId ? shopId.toString() : null,
      repairJobId: repairJobId ? repairJobId.toString() : null,
      deviceBrand,
      deviceModel,
      symptoms,
      confirmedSymptoms,
      followUpAnswers,
      testResults,
      whatIfSimulation,
      historicalCases,
      inventoryParts,
    };

    // 2. Execute Python Diagnosis Engine
    const pythonResult = await this._invokePythonEngine(pythonPayload);

    // 3. Transparent Dynamic Cost Estimation Calculation
    const dynamicCostEstimate = this._calculateDynamicCost(
      pythonResult,
      inventoryParts,
      historicalCases,
      deviceModel
    );

    pythonResult.costEstimate = dynamicCostEstimate;

    // 4. Synchronize DiagnosticSession for traceability if repairJobId is present
    if (shopId && repairJobId) {
      try {
        await DiagnosticSession.findOneAndUpdate(
          { shopId, repairJobId },
          {
            $set: {
              deviceBrand,
              deviceModel,
              symptoms,
              confirmedSymptoms,
              followUpAnswers,
              diagnosticJourney: pythonResult.diagnosticJourney || [],
              knowledgeGaps: pythonResult.knowledgeGaps || [],
              latestDiagnosis: {
                confidence: pythonResult.diagnosticConfidence,
                hypotheses: pythonResult.hypotheses,
                recommendedNextTest: pythonResult.recommendedNextTest,
                updatedAt: new Date(),
              },
            },
          },
          { upsert: true, new: true }
        );
      } catch (syncErr) {
        console.warn('[AiService] Failed to sync DiagnosticSession:', syncErr.message);
      }
    }

    return pythonResult;
  }

  /**
   * Resolves the working Python executable across Windows / Linux environments.
   */
  _resolvePythonBinary() {
    if (this._cachedPythonBin) return this._cachedPythonBin;

    const candidates = [
      process.env.PYTHON_PATH,
      'D:\\SOFTWARE\\PYTHON\\python.exe',
      'python',
      'py',
      'python3',
    ].filter(Boolean);

    for (const bin of candidates) {
      if (fs.existsSync(bin)) {
        this._cachedPythonBin = bin;
        return bin;
      }
    }

    this._cachedPythonBin = process.platform === 'win32' ? 'python' : 'python3';
    return this._cachedPythonBin;
  }

  /**
   * Spawns Python process with JSON streaming over stdin.
   */
  _invokePythonEngine(payload) {
    return new Promise((resolve, reject) => {
      const pythonBin = this._resolvePythonBinary();
      const isWin = process.platform === 'win32';

      const pythonProcess = spawn(pythonBin, [PYTHON_MAIN_SCRIPT], {
        cwd: path.dirname(PYTHON_MAIN_SCRIPT),
        env: { ...process.env, PYTHONIOENCODING: 'utf-8' },
      });

      let stdoutData = '';
      let stderrData = '';

      pythonProcess.stdout.on('data', (chunk) => {
        stdoutData += chunk.toString('utf-8');
      });

      pythonProcess.stderr.on('data', (chunk) => {
        stderrData += chunk.toString('utf-8');
      });

      pythonProcess.on('error', (err) => {
        if (pythonBin !== 'py' && isWin) {
          const fallbackProc = spawn('py', [PYTHON_MAIN_SCRIPT], {
            cwd: path.dirname(PYTHON_MAIN_SCRIPT),
            shell: true,
            env: { ...process.env, PYTHONIOENCODING: 'utf-8' },
          });
          let fbOut = '';
          let fbErr = '';
          fallbackProc.stdout.on('data', (c) => { fbOut += c.toString('utf-8'); });
          fallbackProc.stderr.on('data', (c) => { fbErr += c.toString('utf-8'); });
          fallbackProc.on('close', (code) => {
            if (code === 0 && fbOut.trim()) {
              try {
                return resolve(JSON.parse(fbOut.trim()));
              } catch (e) {}
            }
            reject(new Error(`Failed to start Python diagnosis engine: ${err.message}`));
          });
          fallbackProc.stdin.write(JSON.stringify(payload));
          fallbackProc.stdin.end();
          return;
        }
        reject(new Error(`Failed to start Python diagnosis engine: ${err.message}`));
      });

      pythonProcess.on('close', (code) => {
        if (code !== 0 && !stdoutData.trim()) {
          return reject(new Error(`Python diagnosis engine exited with code ${code}: ${stderrData}`));
        }

        try {
          const parsed = JSON.parse(stdoutData.trim());
          resolve(parsed);
        } catch (parseErr) {
          console.error('[AiService] Python raw stdout parse error. Output was:', stdoutData);
          reject(new Error(`Invalid JSON response from diagnosis engine: ${parseErr.message}`));
        }
      });

      // Send payload via stdin and close stream
      pythonProcess.stdin.write(JSON.stringify(payload));
      pythonProcess.stdin.end();
    });
  }

  /**
   * Calculates dynamic cost from real shop data (inventory parts + historical repairs + labor).
   */
  _calculateDynamicCost(diagnosisResult, inventoryParts, historicalCases, deviceModel) {
    const topHypothesis = diagnosisResult.hypotheses?.[0];
    if (!topHypothesis) {
      return {
        amount: null,
        formatted: 'Insufficient shop data for reliable cost estimate.',
        isEstimated: false,
        breakdown: { partsCost: 0, laborCost: 0 },
        confidenceText: 'No viable hypothesis generated.',
      };
    }

    let partsCost = 0;
    let matchedParts = [];
    const modelLower = (deviceModel || '').toLowerCase();

    // Check inventory matches
    if (inventoryParts && inventoryParts.length > 0) {
      for (const item of inventoryParts) {
        const itemCompat = (item.compatibleModel || '').toLowerCase();
        const itemName = (item.name || '').toLowerCase();
        if (
          modelLower &&
          (itemCompat.includes(modelLower) || modelLower.includes(itemCompat)) &&
          topHypothesis.recommendedParts?.some((p) => itemName.includes(p.toLowerCase()))
        ) {
          partsCost += item.sellingPrice || 0;
          matchedParts.push({ name: item.name, price: item.sellingPrice });
          break;
        }
      }
    }

    // Check historical completed repair average for similar model / fault
    let historicalAverage = 0;
    let matchingHistCount = 0;
    if (historicalCases && historicalCases.length > 0) {
      for (const h of historicalCases) {
        const hModel = (h.device?.model || '').toLowerCase();
        const hNotes = (h.diagnosisNotes || '').toLowerCase();
        if (
          (modelLower && (hModel.includes(modelLower) || modelLower.includes(hModel))) ||
          hNotes.includes(topHypothesis.name.toLowerCase()) ||
          hNotes.includes(topHypothesis.category.toLowerCase())
        ) {
          if (h.finalAmount > 0) {
            historicalAverage += h.finalAmount;
            matchingHistCount += 1;
          }
        }
      }
      if (matchingHistCount > 0) {
        historicalAverage = Math.round(historicalAverage / matchingHistCount);
      }
    }

    // Base labor benchmark based on bench time
    const laborCost = topHypothesis.riskLevel === 'HIGH' ? 800 : topHypothesis.riskLevel === 'MEDIUM' ? 500 : 350;

    let totalEstimate = 0;
    let explanation = '';

    if (partsCost > 0) {
      totalEstimate = partsCost + laborCost;
      explanation = `Calculated from in-stock shop inventory part (₹${partsCost}) + standard bench labor (₹${laborCost}).`;
    } else if (historicalAverage > 0) {
      totalEstimate = historicalAverage;
      explanation = `Calculated from ${matchingHistCount} similar historical repair(s) completed in this workshop (Avg: ₹${historicalAverage}).`;
    } else {
      return {
        amount: null,
        formatted: 'Insufficient shop data for reliable cost estimate.',
        isEstimated: false,
        breakdown: { partsCost: 0, laborCost },
        confidenceText: 'Requires manual technician bench inspection to quote parts and labor.',
      };
    }

    return {
      amount: totalEstimate,
      formatted: `₹${totalEstimate.toLocaleString('en-IN')}`,
      isEstimated: true,
      breakdown: {
        partsCost,
        laborCost,
        matchedParts,
      },
      confidenceText: explanation,
    };
  }

  /**
   * Records technician outcome feedback to improve future case weighting.
   */
  async recordFeedback(feedbackData, shopId) {
    return AiFeedback.create({
      shopId,
      repairJobId: feedbackData.repairJobId,
      deviceBrand: feedbackData.deviceBrand,
      deviceModel: feedbackData.deviceModel,
      symptoms: feedbackData.symptoms,
      predictedHypotheses: feedbackData.predictedHypotheses || [],
      confirmedFault: feedbackData.confirmedFault,
      repairPerformed: feedbackData.repairPerformed,
      partsUsed: feedbackData.partsUsed || [],
      wasAiUseful: feedbackData.wasAiUseful,
      technicianNotes: feedbackData.technicianNotes,
    });
  }

  /**
   * Applies confirmed AI recommendations selectively to an existing repair job card.
   */
  async applyToJobCard(repairJobId, selections, shopId = null) {
    const filter = { _id: repairJobId };
    if (shopId) filter.shopId = shopId;

    const job = await Repair.findOne(filter);
    if (!job) throw new Error('Repair job card not found or unauthorized');

    if (selections.applyDiagnosisNotes && selections.diagnosisNotes) {
      job.diagnosisNotes = selections.diagnosisNotes;
    }

    if (selections.applyEstimatedAmount && selections.estimatedAmount > 0) {
      job.estimatedAmount = Number(selections.estimatedAmount);
      job.finalAmount = Number(job.finalAmount || job.estimatedAmount);
      job.pendingAmount = Math.max(0, job.finalAmount - (job.advancePayment || 0));
    }

    if (selections.applyParts && Array.isArray(selections.parts)) {
      if (!job.parts) job.parts = [];
      for (const p of selections.parts) {
        job.parts.push({
          name: p.name || 'Diagnosed Replacement Part',
          quantity: p.quantity || 1,
          unitPrice: Number(p.unitPrice || 0),
          totalPrice: Number((p.quantity || 1) * (p.unitPrice || 0)),
        });
      }
    }

    if (!job.history) job.history = [];
    job.history.push({
      status: job.status,
      changedAt: new Date(),
      notes: `Applied confirmed diagnostic recommendations: ${selections.selectedFaultName || 'Hardware Inspection'}`,
    });

    await job.save();
    return job;
  }

  /**
   * Fetches curated test procedures.
   */
  getCuratedProcedures() {
    const testProceduresPath = path.join(ROOT_SERVER_DIR, 'ai_data', 'test_procedures.json');
    if (fs.existsSync(testProceduresPath)) {
      const data = JSON.parse(fs.readFileSync(testProceduresPath, 'utf-8'));
      return data.test_procedures || {};
    }
    return {};
  }

  /**
   * Records an actual bench test outcome performed by the technician.
   * Validates result type, prevents duplicate submissions, updates evidence,
   * recalculates fault scores using the Python engine, and logs to repair history.
   */
  async recordActualTestResult(payload, shopId, user = null) {
    const {
      repairJobId = null,
      sessionId = null,
      testId,
      testName = '',
      result,
      observedValue = '',
      notes = '',
      deviceBrand = '',
      deviceModel = '',
      symptoms = '',
    } = payload;

    if (!testId) {
      throw new Error('Test ID is required.');
    }

    const validResults = ['PASS', 'FAIL', 'OBSERVED_VALUE', 'INCONCLUSIVE', 'NOT_PERFORMED'];
    const normalizedResult = (result || '').toUpperCase().trim();
    if (!validResults.includes(normalizedResult)) {
      throw new Error(`Invalid test result '${result}'. Allowed: ${validResults.join(', ')}`);
    }

    // 1. Locate or create DiagnosticSession
    let session = null;
    if (sessionId) {
      session = await DiagnosticSession.findOne({ _id: sessionId, shopId });
    } else if (repairJobId) {
      session = await DiagnosticSession.findOne({ repairJobId, shopId });
    }

    if (!session) {
      session = new DiagnosticSession({
        shopId,
        repairJobId: repairJobId || null,
        deviceBrand,
        deviceModel,
        symptoms,
        actualTestResults: [],
        diagnosticJourney: [],
        knowledgeGaps: [],
      });
    }

    // 2. Prevent duplicate submissions for the same test on this session (Idempotency)
    const isDuplicate = session.actualTestResults.some(
      (t) => t.testId === testId && t.result === normalizedResult && t.observedValue === observedValue
    );
    if (isDuplicate) {
      throw new Error(`Test '${testId}' with result '${normalizedResult}' has already been recorded for this session.`);
    }

    // 3. Append the validated actual test result
    const newTestRecord = {
      testId,
      testName: testName || testId,
      result: normalizedResult,
      observedValue: (observedValue || '').trim(),
      notes: (notes || '').trim(),
      technicianId: user?._id || null,
      technicianName: user?.name || 'Technician',
      createdAt: new Date(),
    };
    session.actualTestResults.push(newTestRecord);

    // 4. Update device info and symptoms if provided or pull from Repair
    let resolvedBrand = deviceBrand || session.deviceBrand;
    let resolvedModel = deviceModel || session.deviceModel;
    let resolvedSymptoms = symptoms || session.symptoms;

    let repairJob = null;
    if (repairJobId) {
      repairJob = await Repair.findOne({ _id: repairJobId, shopId });
      if (repairJob) {
        resolvedBrand = resolvedBrand || repairJob.device?.brand || '';
        resolvedModel = resolvedModel || repairJob.device?.model || '';
        resolvedSymptoms = resolvedSymptoms || repairJob.issue || '';
      }
    }

    session.deviceBrand = resolvedBrand;
    session.deviceModel = resolvedModel;
    session.symptoms = resolvedSymptoms;

    // 5. Re-evaluate diagnosis through Python engine with all accumulated actual test results
    const diagnosisPayload = {
      deviceBrand: resolvedBrand,
      deviceModel: resolvedModel,
      symptoms: resolvedSymptoms,
      confirmedSymptoms: session.confirmedSymptoms || [],
      followUpAnswers: session.followUpAnswers || {},
      testResults: session.actualTestResults.map((t) => ({
        test_id: t.testId,
        result: t.result,
        observed_value: t.observedValue,
        notes: t.notes,
        timestamp: t.createdAt,
      })),
      repairJobId,
    };

    const updatedDiagnosis = await this.runDiagnosis(diagnosisPayload, shopId);

    // 6. Update session state
    session.diagnosticJourney = updatedDiagnosis.diagnosticJourney || [];
    session.knowledgeGaps = updatedDiagnosis.knowledgeGaps || [];
    session.latestDiagnosis = {
      confidence: updatedDiagnosis.diagnosticConfidence,
      hypotheses: updatedDiagnosis.hypotheses,
      recommendedNextTest: updatedDiagnosis.recommendedNextTest,
      updatedAt: new Date(),
    };
    session.status = (updatedDiagnosis.knowledgeGaps && updatedDiagnosis.knowledgeGaps.length > 0)
      ? 'KNOWLEDGE_GAP'
      : 'TESTS_IN_PROGRESS';

    await session.save();

    // 7. Audit log in Repair Job Card if linked
    if (repairJob) {
      if (!repairJob.history) repairJob.history = [];
      repairJob.history.push({
        status: repairJob.status,
        changedAt: new Date(),
        notes: `AI Diagnostic Test Recorded: ${newTestRecord.testName} -> ${newTestRecord.result}${observedValue ? ` (${observedValue})` : ''}`,
        updatedBy: user?.name || 'Technician',
      });
      await repairJob.save();
    }

    return {
      session,
      diagnosis: updatedDiagnosis,
      recommendedNextTest: updatedDiagnosis.recommendedNextTest,
      testPlan: updatedDiagnosis.testPlan,
      diagnosticJourney: updatedDiagnosis.diagnosticJourney,
      knowledgeGaps: updatedDiagnosis.knowledgeGaps,
    };
  }

  /**
   * Runs non-persistent what-if simulation exploring hypothetical test outcomes.
   * NEVER saves or modifies database or repair records.
   */
  async runWhatIfSimulation(payload, shopId = null) {
    const {
      deviceBrand = '',
      deviceModel = '',
      symptoms = '',
      confirmedSymptoms = [],
      followUpAnswers = {},
      completedTests = [],
      testId,
      hypotheticalOutcome = 'PASS',
      observedValue = '',
    } = payload;

    if (!testId) {
      throw new Error('Test ID is required for what-if simulation.');
    }

    const pythonPayload = {
      shopId: shopId ? shopId.toString() : null,
      deviceBrand,
      deviceModel,
      symptoms,
      confirmedSymptoms,
      followUpAnswers,
      testResults: completedTests,
      whatIfSimulation: {
        testId,
        hypotheticalOutcome,
        observedValue,
      },
    };

    const pythonResult = await this._invokePythonEngine(pythonPayload);
    return pythonResult.whatIfSimulation;
  }

  /**
   * Retrieves explainable diagnostic journey for a specific repair job or session.
   */
  async getDiagnosticJourney(identifier, shopId) {
    if (!identifier || !mongoose.Types.ObjectId.isValid(identifier)) {
      return [];
    }
    const session = await DiagnosticSession.findOne({
      $or: [{ repairJobId: identifier }, { _id: identifier }],
      shopId,
    }).lean();

    if (!session) {
      return [];
    }
    return session.diagnosticJourney || [];
  }

  /**
   * Retrieves knowledge gap records for authorized shop review.
   */
  async getKnowledgeGaps(shopId, status = null) {
    const filter = { shopId };
    const sessions = await DiagnosticSession.find(filter)
      .select('deviceBrand deviceModel symptoms knowledgeGaps createdAt updatedAt')
      .sort({ updatedAt: -1 })
      .lean();

    const allGaps = [];
    for (const s of sessions) {
      for (const g of s.knowledgeGaps || []) {
        if (!status || g.status === status) {
          allGaps.push({
            ...g,
            sessionId: s._id,
            deviceBrand: s.deviceBrand,
            deviceModel: s.deviceModel,
            symptoms: s.symptoms,
          });
        }
      }
    }
    return allGaps;
  }

  /**
   * Reviews and approves/dismisses a knowledge gap.
   */
  async reviewKnowledgeGap(gapId, action, reviewNotes, shopId, userId) {
    const validActions = ['APPROVE', 'DISMISS'];
    const normAction = (action || '').toUpperCase().trim();
    if (!validActions.includes(normAction)) {
      throw new Error("Action must be 'APPROVE' or 'DISMISS'.");
    }

    const session = await DiagnosticSession.findOne({
      shopId,
      'knowledgeGaps.gapId': gapId,
    });

    if (!session) {
      throw new Error(`Knowledge gap '${gapId}' not found in workshop records.`);
    }

    const gap = session.knowledgeGaps.find((g) => g.gapId === gapId);
    if (gap) {
      gap.status = normAction === 'APPROVE' ? 'APPROVED' : 'DISMISSED';
      gap.reviewedBy = userId;
      gap.reviewNotes = reviewNotes || '';
    }

    await session.save();
    return gap;
  }
}

export const aiService = new AiService();
