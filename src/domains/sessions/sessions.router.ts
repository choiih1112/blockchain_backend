import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { authenticate } from '../../middleware/auth';
import { sessionsController } from './sessions.controller';
import { planUpload } from '../../config/upload';
import { AppError } from '../../middleware/errorHandler';

export const sessionsRouter = Router();

const handlePlanUpload = (req: Request, res: Response, next: NextFunction) => {
  planUpload.single('plan')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') return next(new AppError('파일 크기는 10MB 이하여야 합니다.', 400));
      return next(new AppError(err.message, 400));
    }
    if (err) return next(new AppError(err.message, 400));
    next();
  });
};

sessionsRouter.get('/', sessionsController.getAll);
sessionsRouter.get('/:id', sessionsController.getById);
sessionsRouter.post('/', authenticate, sessionsController.create);
sessionsRouter.patch('/:id', authenticate, sessionsController.update);
sessionsRouter.delete('/:id', authenticate, sessionsController.remove);
sessionsRouter.post('/:id/plan', authenticate, handlePlanUpload, sessionsController.uploadPlan);
