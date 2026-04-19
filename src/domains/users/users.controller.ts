import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { AuthRequest } from '../../middleware/auth';
import { usersService } from './users.service';
import { AppError } from '../../middleware/errorHandler';

const updateProfileSchema = z.object({
  nickname: z.string().min(2, '닉네임은 2자 이상이어야 합니다.').max(20, '닉네임은 20자 이하여야 합니다.').optional(),
});

const updateWalletSchema = z.object({
  walletAddress: z.string().regex(/^0x[0-9a-fA-F]{40}$/, '올바른 이더리움 지갑 주소를 입력해주세요.'),
});

export const usersController = {
  async getMe(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await usersService.getMe(req.user!.userId);
      res.json({ success: true, data: user });
    } catch (err) {
      next(err);
    }
  },

  async updateMe(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = updateProfileSchema.safeParse(req.body);
      if (!parsed.success) {
        const message = parsed.error.errors[0]?.message ?? '입력값이 올바르지 않습니다.';
        throw new AppError(message, 400);
      }
      const user = await usersService.updateMe(req.user!.userId, parsed.data);
      res.json({ success: true, data: user });
    } catch (err) {
      next(err);
    }
  },

  async updateWallet(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = updateWalletSchema.safeParse(req.body);
      if (!parsed.success) {
        const message = parsed.error.errors[0]?.message ?? '입력값이 올바르지 않습니다.';
        throw new AppError(message, 400);
      }
      const result = await usersService.updateWallet(req.user!.userId, parsed.data);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  },
};
