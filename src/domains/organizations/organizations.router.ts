import { Router } from 'express';
import { organizationsController } from './organizations.controller';

export const organizationsRouter = Router();

organizationsRouter.get('/', organizationsController.getAll);
organizationsRouter.get('/:id', organizationsController.getById);
