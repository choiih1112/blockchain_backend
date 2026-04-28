import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/auth';
import { usersService } from './users.service';

export const usersController = {
  async getMe(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await usersService.getMe(req.user!.userId);
      res.json({ success: true, data: user });
    } catch (err) {
      next(err);
    }
  },
};
