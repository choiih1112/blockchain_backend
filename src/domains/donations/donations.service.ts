import { prisma } from '../../config/database';
import { AppError } from '../../middleware/errorHandler';

export interface CreateDonationDto {
  sessionId: string;
  amount: number;
  txHash: string;
}

export const donationsService = {
  async create(userId: string, dto: CreateDonationDto) {
    const session = await prisma.donationSession.findUnique({
      where: { id: dto.sessionId },
    });
    if (!session) throw new AppError('기부 세션을 찾을 수 없습니다.', 404);
    if (session.approvalStatus !== 'APPROVED') throw new AppError('관리자 승인이 완료되지 않은 세션입니다.', 403);
    if (session.status !== 'ACTIVE') throw new AppError('활성화된 세션이 아닙니다.', 400);
    if (new Date() > session.deadline) throw new AppError('마감된 세션입니다.', 400);

    const existing = await prisma.donationRecord.findUnique({ where: { txHash: dto.txHash } });
    if (existing) throw new AppError('이미 사용된 트랜잭션 해시입니다.', 409);

    const donation = await prisma.$transaction(async (tx) => {
      const record = await tx.donationRecord.create({
        data: {
          donorId: userId,
          sessionId: dto.sessionId,
          amount: dto.amount,
          txHash: dto.txHash,
        },
      });

      const updated = await tx.donationSession.update({
        where: { id: dto.sessionId },
        data: { currentAmount: { increment: dto.amount } },
      });

      if (Number(updated.currentAmount) >= Number(updated.goalAmount)) {
        await tx.donationSession.update({
          where: { id: dto.sessionId },
          data: { status: 'COMPLETED' },
        });
      }

      return record;
    });

    return donation;
  },

  async getMyDonations(userId: string) {
    return prisma.donationRecord.findMany({
      where: { donorId: userId },
      include: {
        session: {
          select: {
            id: true,
            title: true,
            status: true,
            organization: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  },
};
