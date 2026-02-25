import { Request, Response, NextFunction } from 'express';
import { HealthService } from '../services/health.service';
import logger from '../utils/logger';

const healthService = new HealthService();

export const checkHealth = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const status = await healthService.getHealthStatus();
        res.status(200).json(status);
    } catch (error) {
        logger.error('Health check failed', error);
        next(error);
    }
};
