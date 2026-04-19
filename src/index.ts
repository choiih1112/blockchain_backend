import express from 'express';
import cors from 'cors';
import path from 'path';
import { env } from './config/env';
import { errorHandler } from './middleware/errorHandler';
import { authRouter } from './domains/auth/auth.router';
import { usersRouter } from './domains/users/users.router';
import { organizationsRouter } from './domains/organizations/organizations.router';
import { sessionsRouter } from './domains/sessions/sessions.router';
import { donationsRouter } from './domains/donations/donations.router';
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

app.get('/api/stats', async (_, res, next) => {
  try {
    const { prisma } = await import('./config/database');
    const [totalResult, sessionCount, donorCount] = await Promise.all([
      prisma.donationRecord.aggregate({ _sum: { amount: true } }),
      prisma.donationSession.count({ where: { approvalStatus: 'APPROVED', status: 'ACTIVE' } }),
      prisma.donationRecord.groupBy({ by: ['donorId'] }).then((r) => r.length),
    ]);
    res.json({
      success: true,
      data: {
        totalDonated: Number(totalResult._sum.amount ?? 0),
        activeSessionCount: sessionCount,
        donorCount,
      },
    });
  } catch (e) {
    next(e);
  }
});

app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);
app.use('/api/organizations', organizationsRouter);
app.use('/api/sessions', sessionsRouter);
app.use('/api/donations', donationsRouter);
app.use('/api/admin', adminRouter);

app.use(errorHandler);

if (require.main === module) {
  app.listen(env.PORT, () => {
    console.log(`Server running on port ${env.PORT}`);
  });
}

export { app };
