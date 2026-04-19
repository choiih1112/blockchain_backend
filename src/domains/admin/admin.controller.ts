import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { AuthRequest } from '../../middleware/auth';
import { adminService } from './admin.service';

const rejectSchema = z.object({ reason: z.string().min(1, '거절 사유를 입력해주세요.') });

export const adminController = {
  async getOrganizations(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await adminService.getOrganizations();
      res.json({ success: true, data });
    } catch (e) {
      next(e);
    }
  },

  async approveOrganization(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await adminService.approveOrganization(req.params.id);
      res.json({ success: true, data });
    } catch (e) {
      next(e);
    }
  },

  async rejectOrganization(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const parsed = rejectSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ success: false, message: parsed.error.errors[0].message });
        return;
      }
      const data = await adminService.rejectOrganization(req.params.id, parsed.data.reason);
      res.json({ success: true, data });
    } catch (e) {
      next(e);
    }
  },

  async getSessions(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await adminService.getSessions();
      res.json({ success: true, data });
    } catch (e) {
      next(e);
    }
  },

  async approveSession(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await adminService.approveSession(req.params.id);
      res.json({ success: true, data });
    } catch (e) {
      next(e);
    }
  },

  async rejectSession(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const parsed = rejectSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ success: false, message: parsed.error.errors[0].message });
        return;
      }
      const data = await adminService.rejectSession(req.params.id, parsed.data.reason);
      res.json({ success: true, data });
    } catch (e) {
      next(e);
    }
  },

  async deleteSession(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await adminService.deleteSession(req.params.id);
      res.json({ success: true, data: null });
    } catch (e) {
      next(e);
    }
  },
};
