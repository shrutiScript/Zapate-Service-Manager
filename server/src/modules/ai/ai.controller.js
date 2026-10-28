import { AiService } from './ai.service.js';

const aiService = new AiService();

export class AiController {
  /**
   * POST /api/v1/ai/diagnose
   * Runs the hybrid AI diagnostic agent.
   */
  async diagnose(req, res, next) {
    try {
      const { deviceBrand, deviceModel, symptoms, confirmedSymptoms, followUpAnswers, repairJobId } = req.body;

      if (!symptoms && !confirmedSymptoms?.length) {
        return res.status(400).json({
          success: false,
          message: 'Please provide observed symptoms or confirm observed fault states.',
        });
      }

      const shopId = req.shopId || req.user?.shopId || null;

      const result = await aiService.runDiagnosis(
        {
          deviceBrand: deviceBrand || '',
          deviceModel: deviceModel || '',
          symptoms: symptoms || '',
          confirmedSymptoms: confirmedSymptoms || [],
          followUpAnswers: followUpAnswers || {},
          repairJobId: repairJobId || null,
        },
        shopId
      );

      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error('[AiController.diagnose] Error:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Diagnostic engine encountered an unexpected error.',
      });
    }
  }

  /**
   * POST /api/v1/ai/feedback
   * Records technician outcome feedback for learning & validation.
   */
  async recordFeedback(req, res, next) {
    try {
      const shopId = req.shopId || req.user?.shopId;
      if (!shopId) {
        return res.status(403).json({
          success: false,
          message: 'Shop identification required to record diagnosis feedback.',
        });
      }

      const feedback = await aiService.recordFeedback(req.body, shopId);

      return res.status(201).json({
        success: true,
        message: 'Technician diagnostic feedback recorded successfully.',
        data: feedback,
      });
    } catch (error) {
      console.error('[AiController.recordFeedback] Error:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to record diagnostic feedback.',
      });
    }
  }

  /**
   * POST /api/v1/ai/apply-to-job/:id
   * Selectively applies confirmed AI recommendations to a specific repair job card.
   */
  async applyToJob(req, res, next) {
    try {
      const { id } = req.params;
      const shopId = req.shopId || req.user?.shopId || null;
      const selections = req.body;

      const updatedJob = await aiService.applyToJobCard(id, selections, shopId);

      return res.status(200).json({
        success: true,
        message: 'Confirmed diagnostic recommendations applied to job card.',
        data: updatedJob,
      });
    } catch (error) {
      console.error('[AiController.applyToJob] Error:', error);
      return res.status(400).json({
        success: false,
        message: error.message || 'Failed to apply diagnosis to job card.',
      });
    }
  }

  /**
   * GET /api/v1/ai/procedures
   * Returns curated confirmation test procedures.
   */
  async getProcedures(req, res, next) {
    try {
      const procedures = aiService.getCuratedProcedures();
      return res.status(200).json({
        success: true,
        data: procedures,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to load test procedures.',
      });
    }
  }

  /**
   * POST /api/v1/ai/test-planner/record-result
   * Records technician's actual bench test observation and updates evidence.
   */
  async recordTestResult(req, res, next) {
    try {
      const shopId = req.shopId || req.user?.shopId;
      if (!shopId) {
        return res.status(403).json({
          success: false,
          message: 'Workshop identification required to record test results.',
        });
      }

      const result = await aiService.recordActualTestResult(req.body, shopId, req.user);

      return res.status(200).json({
        success: true,
        message: 'Test result recorded and diagnostic evidence updated.',
        data: result,
      });
    } catch (error) {
      console.error('[AiController.recordTestResult] Error:', error);
      return res.status(400).json({
        success: false,
        message: error.message || 'Failed to record test result.',
      });
    }
  }

  /**
   * POST /api/v1/ai/test-planner/simulate
   * Runs non-persistent what-if simulation for a hypothetical test outcome.
   */
  async simulateWhatIf(req, res, next) {
    try {
      const shopId = req.shopId || req.user?.shopId || null;
      const simulation = await aiService.runWhatIfSimulation(req.body, shopId);

      return res.status(200).json({
        success: true,
        data: simulation,
      });
    } catch (error) {
      console.error('[AiController.simulateWhatIf] Error:', error);
      return res.status(400).json({
        success: false,
        message: error.message || 'What-if simulation encountered an error.',
      });
    }
  }

  /**
   * GET /api/v1/ai/test-planner/journey/:id
   * Retrieves explainable chronological diagnostic journey.
   */
  async getDiagnosticJourney(req, res, next) {
    try {
      const { id } = req.params;
      const shopId = req.shopId || req.user?.shopId;
      if (!shopId) {
        return res.status(403).json({
          success: false,
          message: 'Workshop identification required.',
        });
      }

      const journey = await aiService.getDiagnosticJourney(id, shopId);

      return res.status(200).json({
        success: true,
        data: journey,
      });
    } catch (error) {
      console.error('[AiController.getDiagnosticJourney] Error:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to retrieve diagnostic journey.',
      });
    }
  }

  /**
   * GET /api/v1/ai/knowledge-gaps
   * Retrieves identified diagnostic limitations and gaps for authorized review.
   */
  async getKnowledgeGaps(req, res, next) {
    try {
      const shopId = req.shopId || req.user?.shopId;
      if (!shopId) {
        return res.status(403).json({
          success: false,
          message: 'Workshop identification required.',
        });
      }

      const gaps = await aiService.getKnowledgeGaps(shopId, req.query.status);

      return res.status(200).json({
        success: true,
        data: gaps,
      });
    } catch (error) {
      console.error('[AiController.getKnowledgeGaps] Error:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to retrieve knowledge gaps.',
      });
    }
  }

  /**
   * POST /api/v1/ai/knowledge-gaps/:gapId/review
   * Authorizes or dismisses a knowledge gap record.
   */
  async reviewKnowledgeGap(req, res, next) {
    try {
      const { gapId } = req.params;
      const { action, reviewNotes } = req.body;
      const shopId = req.shopId || req.user?.shopId;
      const userId = req.user?._id;

      if (!shopId) {
        return res.status(403).json({
          success: false,
          message: 'Workshop identification required.',
        });
      }

      const updatedGap = await aiService.reviewKnowledgeGap(gapId, action, reviewNotes, shopId, userId);

      return res.status(200).json({
        success: true,
        message: `Knowledge gap marked as ${updatedGap.status}.`,
        data: updatedGap,
      });
    } catch (error) {
      console.error('[AiController.reviewKnowledgeGap] Error:', error);
      return res.status(400).json({
        success: false,
        message: error.message || 'Failed to review knowledge gap.',
      });
    }
  }
}
