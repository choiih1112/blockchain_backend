import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { AuthRequest } from '../../middleware/auth';
import { donationsService } from './donations.service';
import { AppError } from '../../middleware/errorHandler';

const createDonationSchema = z.object({
  sessionId: z.string().uuid('유효하지 않은 세션 ID입니다.'),
  amount: z.number().positive('기부 금액은 0보다 커야 합니다.'),
  txHash: z.string().min(1, 'txHash를 입력해주세요.').max(256),
});

export const donationsController = {
  async create(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (req.user!.role !== 'INDIVIDUAL') {
        throw new AppError('개인 기부자만 기부할 수 있습니다.', 403);
      }
      const parsed = createDonationSchema.safeParse(req.body);
      if (!parsed.success) {
        const message = parsed.error.errors[0]?.message ?? '입력값이 올바르지 않습니다.';
        throw new AppError(message, 400);
      }
      const donation = await donationsService.create(req.user!.userId, parsed.data);
      res.status(201).json({ success: true, data: donation });
    } catch (err) {
      next(err);
    }
  },

  async getMyDonations(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const donations = await donationsService.getMyDonations(req.user!.userId);
      res.json({ success: true, data: donations });
    } catch (err) {
      next(err);
    }
  },
};
