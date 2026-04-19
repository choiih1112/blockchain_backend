import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { usersController } from './users.controller';

export const usersRouter = Router();

usersRouter.get('/me', authenticate, usersController.getMe);
usersRouter.patch('/me', authenticate, usersController.updateMe);
usersRouter.patch('/me/wallet', authenticate, usersController.updateWallet);
