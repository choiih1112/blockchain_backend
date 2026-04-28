import { prisma } from '../../config/database';
import { AppError } from '../../middleware/errorHandler';

export const organizationsService = {
  async getAll() {
    return prisma.organization.findMany({
      where: { approvalStatus: 'APPROVED' },
      select: {
        id: true,
        name: true,
        description: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  },

  async getById(id: string) {
    const org = await prisma.organization.findFirst({
      where: { id, approvalStatus: 'APPROVED' },
      select: {
        id: true,
        name: true,
        description: true,
        createdAt: true,
        sessions: {
          where: { approvalStatus: 'APPROVED' },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
    if (!org) throw new AppError('기관을 찾을 수 없습니다.', 404);
    return org;
  },
};
