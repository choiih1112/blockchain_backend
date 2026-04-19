import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { donationsController } from './donations.controller';

export const donationsRouter = Router();

donationsRouter.get('/me', authenticate, donationsController.getMyDonations);
donationsRouter.post('/', authenticate, donationsController.create);
