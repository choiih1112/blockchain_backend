import { prisma } from '../../config/database';
import { AppError } from '../../middleware/errorHandler';

export const organizationsService = {
  async getAll() {
    return prisma.organization.findMany({
      include: { user: { select: { email: true } } },
      orderBy: { createdAt: 'desc' },
    });
  },

  async getById(id: string) {
    const org = await prisma.organization.findUnique({
      where: { id },
      include: {
        user: { select: { email: true } },
        sessions: { where: { approvalStatus: 'APPROVED' }, orderBy: { createdAt: 'desc' } },
      },
    });
    if (!org) throw new AppError('단체를 찾을 수 없습니다.', 404);
    return org;
  },
};
