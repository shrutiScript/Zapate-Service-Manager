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
}
