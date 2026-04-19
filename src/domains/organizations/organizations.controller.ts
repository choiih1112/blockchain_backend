import { Request, Response, NextFunction } from 'express';
import { organizationsService } from './organizations.service';

export const organizationsController = {
  async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const orgs = await organizationsService.getAll();
      res.json({ success: true, data: orgs });
    } catch (err) {
      next(err);
    }
  },

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const org = await organizationsService.getById(req.params.id);
      res.json({ success: true, data: org });
    } catch (err) {
      next(err);
    }
  },
};
