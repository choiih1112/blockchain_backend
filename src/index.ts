import express from 'express';
import cors from 'cors';
import path from 'path';
import { env } from './config/env';
import { errorHandler } from './middleware/errorHandler';
import { authRouter } from './domains/auth/auth.router';
import { usersRouter } from './domains/users/users.router';
import { organizationsRouter } from './domains/organizations/organizations.router';
import { sessionsRouter } from './domains/sessions/sessions.router';
import { adminRouter } from './domains/admin/admin.router';

const app = express();

const allowedOrigins = env.FRONTEND_URL
  ? env.FRONTEND_URL.split(',').map((u) => u.trim())
  : ['http://localhost:3001'];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('CORS policy violation'));
    }
  },
  credentials: true,
}));

app.use(express.json({ limit: '10kb' }));

app.get('/health', (_, res) => res.json({ status: 'ok' }));

app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);
app.use('/api/organizations', organizationsRouter);
app.use('/api/sessions', sessionsRouter);
app.use('/api/admin', adminRouter);

app.use(errorHandler);

if (require.main === module) {
  app.listen(env.PORT, () => {
    console.log(`Server running on port ${env.PORT}`);
  });
}

export { app };
