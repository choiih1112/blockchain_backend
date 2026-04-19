import { prisma } from '../../config/database';
import { AppError } from '../../middleware/errorHandler';

export interface UpdateProfileDto {
  nickname?: string;
}

export interface UpdateWalletDto {
  walletAddress: string;
}

export const usersService = {
  async getMe(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        nickname: true,
        role: true,
        walletAddress: true,
        createdAt: true,
        organization: {
          select: { id: true, name: true, approvalStatus: true, rejectReason: true },
        },
      },
    });
    if (!user) throw new AppError('사용자를 찾을 수 없습니다.', 404);
    return user;
  },

  async updateWallet(userId: string, dto: UpdateWalletDto) {
    return prisma.user.update({
      where: { id: userId },
      data: { walletAddress: dto.walletAddress },
      select: { id: true, walletAddress: true },
    });
  },

  async updateMe(userId: string, dto: UpdateProfileDto) {
    return prisma.user.update({
      where: { id: userId },
      data: { nickname: dto.nickname },
      select: {
        id: true,
        email: true,
        nickname: true,
        role: true,
        walletAddress: true,
        createdAt: true,
        organization: {
          select: { id: true, name: true, approvalStatus: true, rejectReason: true },
        },
      },
    });
  },
};
