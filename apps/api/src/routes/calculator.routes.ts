import { Router, Request, Response, NextFunction } from 'express';
import { CalculatorService } from '../services/calculator.service.js';
import { sendSuccess, sendError } from '../utils/response.js';

const router = Router();

/**
 * GET /api/v1/calculator/config
 * Returns live rate cards, city multipliers, and IS-456 CPWD benchmarks
 */
router.get('/config', (req: Request, res: Response) => {
  const config = CalculatorService.getConfig();
  return sendSuccess(res, config, 'Calculator configuration and live rate cards retrieved successfully.');
});

/**
 * POST /api/v1/calculator/estimate
 * Dynamically computes civil construction cost, stage breakdown & material BOQ
 */
router.post('/estimate', (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = CalculatorService.calculateEstimate(req.body);
    return sendSuccess(res, result, 'Construction estimate and BOQ calculated successfully.');
  } catch (err: any) {
    next(err);
  }
});

/**
 * POST /api/v1/calculator/save
 * Persists an estimate so it can be converted into an official RFQ
 */
router.post('/save', (req: Request, res: Response, next: NextFunction) => {
  try {
    const estimateData = req.body;
    if (!estimateData) {
      return sendError(res, 'Estimate data payload is required to save.', 400);
    }
    const userId = (req as any).user?.id;
    const saved = CalculatorService.saveEstimate(estimateData, userId);
    return sendSuccess(res, saved, 'Estimate saved successfully. Ready for RFQ dispatch.', 201);
  } catch (err: any) {
    next(err);
  }
});

/**
 * GET /api/v1/calculator/estimate/:id
 * Retrieve a previously saved estimate by ID
 */
router.get('/estimate/:id', (req: Request, res: Response) => {
  const estimate = CalculatorService.getEstimateById(req.params.id);
  if (!estimate) {
    return sendError(res, `Estimate with ID "${req.params.id}" not found.`, 404, 'NOT_FOUND');
  }
  return sendSuccess(res, estimate, 'Saved estimate retrieved successfully.');
});

export default router;
