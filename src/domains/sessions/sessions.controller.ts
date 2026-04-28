import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { AuthRequest } from '../../middleware/auth';
import { sessionsService } from './sessions.service';
import { AppError } from '../../middleware/errorHandler';

const futureDate = (value: string) => {
  const date = new Date(value);
  return !Number.isNaN(date.getTime()) && date.getTime() > Date.now();
};

const createSessionSchema = z.object({
  title: z.string().min(1, '제목을 입력해주세요.').max(200),
  description: z.string().max(2000).optional(),
  goalAmount: z.number().positive('목표 금액은 0보다 커야 합니다.'),
  deadline: z.string().refine(futureDate, '마감일은 현재보다 이후여야 합니다.'),
});

const updateSessionSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
  goalAmount: z.number().positive('목표 금액은 0보다 커야 합니다.').optional(),
  deadline: z.string().refine(futureDate, '마감일은 현재보다 이후여야 합니다.').optional(),
});

export const sessionsController = {
  async create(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (req.user!.role !== 'ORGANIZATION') {
        throw new AppError('기관만 캠페인을 생성할 수 있습니다.', 403);
      }
      const parsed = createSessionSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new AppError(parsed.error.errors[0]?.message ?? '입력값이 올바르지 않습니다.', 400);
      }
      const session = await sessionsService.create(req.user!.userId, parsed.data);
      res.status(201).json({ success: true, data: session });
    } catch (err) {
      next(err);
    }
  },

  async getAll(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const sessions = await sessionsService.getAll();
      res.json({ success: true, data: sessions });
    } catch (err) {
      next(err);
    }
  },

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const session = await sessionsService.getById(req.params.id);
      res.json({ success: true, data: session });
    } catch (err) {
      next(err);
    }
  },

  async update(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (req.user!.role !== 'ORGANIZATION') {
        throw new AppError('기관만 캠페인을 수정할 수 있습니다.', 403);
      }
      const parsed = updateSessionSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new AppError(parsed.error.errors[0]?.message ?? '입력값이 올바르지 않습니다.', 400);
      }
      const session = await sessionsService.update(req.params.id, req.user!.userId, parsed.data);
      res.json({ success: true, data: session });
    } catch (err) {
      next(err);
    }
  },

  async remove(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (req.user!.role !== 'ORGANIZATION') {
        throw new AppError('기관만 캠페인을 삭제할 수 있습니다.', 403);
      }
      await sessionsService.remove(req.params.id, req.user!.userId);
      res.json({ success: true, data: null });
    } catch (err) {
      next(err);
    }
  },

  async uploadPlan(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (req.user!.role !== 'ORGANIZATION') {
        throw new AppError('기관만 캠페인 계획서를 제출할 수 있습니다.', 403);
      }
      if (!req.file) {
        throw new AppError('파일을 첨부해주세요.', 400);
      }
      const fileUrl = `/uploads/plans/${req.file.filename}`;
      const session = await sessionsService.uploadPlan(req.params.id, req.user!.userId, fileUrl);
      res.json({ success: true, data: session });
    } catch (err) {
      next(err);
    }
  },
};
