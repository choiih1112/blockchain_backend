import { prisma } from '../../config/database';
import { AppError } from '../../middleware/errorHandler';

export const usersService = {
  async getMe(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        nickname: true,
        role: true,
        createdAt: true,
        organization: {
          select: { id: true, name: true, approvalStatus: true, rejectReason: true },
        },
      },
    });
    if (!user) throw new AppError('사용자를 찾을 수 없습니다.', 404);
    return user;
  },
};
