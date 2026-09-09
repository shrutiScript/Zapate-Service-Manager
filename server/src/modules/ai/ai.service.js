import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { Repair } from '../repairs/repair.model.js';
import { SparePart } from '../inventory/inventory.model.js';
import { AiFeedback } from './aiFeedback.model.js';

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

    const pythonPayload = {
      shopId: shopId ? shopId.toString() : null,
      repairJobId: repairJobId ? repairJobId.toString() : null,
      deviceBrand,
      deviceModel,
      symptoms,
      confirmedSymptoms,
      followUpAnswers,
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
}
