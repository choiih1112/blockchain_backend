import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { requireAdmin } from '../../middleware/admin';
import { adminController } from './admin.controller';

export const adminRouter = Router();

adminRouter.use(authenticate, requireAdmin);

adminRouter.get('/organizations', adminController.getOrganizations);
adminRouter.patch('/organizations/:id/approve', adminController.approveOrganization);
adminRouter.patch('/organizations/:id/reject', adminController.rejectOrganization);

adminRouter.get('/sessions', adminController.getSessions);
adminRouter.patch('/sessions/:id/approve', adminController.approveSession);
adminRouter.patch('/sessions/:id/reject', adminController.rejectSession);
adminRouter.delete('/sessions/:id', adminController.deleteSession);
