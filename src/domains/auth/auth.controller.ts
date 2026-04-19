import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authService } from './auth.service';
import { AppError } from '../../middleware/errorHandler';

const registerSchema = z
  .object({
    email: z.string().email('유효한 이메일 형식이 아닙니다.'),
    password: z.string().min(8, '비밀번호는 8자 이상이어야 합니다.'),
    nickname: z.preprocess((v) => (v === '' ? undefined : v), z.string().min(2, '닉네임은 2자 이상이어야 합니다.').max(20).optional()),
    role: z.enum(['INDIVIDUAL', 'ORGANIZATION']),
    orgName: z.preprocess((v) => (v === '' ? undefined : v), z.string().min(1, '단체명을 입력해주세요.').max(100).optional()),
    orgDescription: z.preprocess((v) => (v === '' ? undefined : v), z.string().max(500).optional()),
  })
  .refine(
    (d) => d.role !== 'ORGANIZATION' || (d.orgName && d.orgName.trim().length > 0),
    { message: '단체명은 필수입니다.', path: ['orgName'] }
  );

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const authController = {
  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = registerSchema.safeParse(req.body);
      if (!parsed.success) {
        const message = parsed.error.errors[0]?.message ?? '입력값이 올바르지 않습니다.';
        throw new AppError(message, 400);
      }
      const result = await authService.register(parsed.data);
      res.status(201).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  },

  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = loginSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new AppError('이메일 또는 비밀번호를 확인해주세요.', 400);
      }
      const result = await authService.login(parsed.data);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  },
};
