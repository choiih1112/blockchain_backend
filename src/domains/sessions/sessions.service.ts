import { prisma } from '../../config/database';
import { AppError } from '../../middleware/errorHandler';

export interface CreateSessionDto {
  title: string;
  description?: string;
  goalAmount: number;
  deadline: string;
}

export interface UpdateSessionDto {
  title?: string;
  description?: string;
  goalAmount?: number;
  deadline?: string;
}

export const sessionsService = {
  async create(userId: string, dto: CreateSessionDto) {
    const org = await prisma.organization.findUnique({ where: { userId } });
    if (!org) throw new AppError('기관 정보를 찾을 수 없습니다.', 404);
    if (org.approvalStatus !== 'APPROVED') {
      throw new AppError('승인된 기관만 캠페인을 생성할 수 있습니다.', 403);
    }

    return prisma.donationSession.create({
      data: {
        organizationId: org.id,
        title: dto.title,
        description: dto.description,
        goalAmount: dto.goalAmount,
        deadline: new Date(dto.deadline),
      },
    });
  },

  async getAll() {
    return prisma.donationSession.findMany({
      where: { approvalStatus: 'APPROVED' },
      include: { organization: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    });
  },

  async getById(id: string) {
    const session = await prisma.donationSession.findFirst({
      where: { id, approvalStatus: 'APPROVED' },
      include: {
        organization: { select: { id: true, name: true, description: true } },
        donations: {
          include: { donor: { select: { nickname: true, email: true } } },
          orderBy: { amount: 'desc' },
        },
      },
    });
    if (!session) throw new AppError('캠페인을 찾을 수 없습니다.', 404);
    return session;
  },

  async update(sessionId: string, userId: string, dto: UpdateSessionDto) {
    const org = await prisma.organization.findUnique({ where: { userId } });
    if (!org) throw new AppError('기관 정보를 찾을 수 없습니다.', 404);

    const session = await prisma.donationSession.findUnique({ where: { id: sessionId } });
    if (!session) throw new AppError('캠페인을 찾을 수 없습니다.', 404);
    if (session.organizationId !== org.id) throw new AppError('수정 권한이 없습니다.', 403);

    return prisma.donationSession.update({
      where: { id: sessionId },
      data: {
        ...(dto.title && { title: dto.title }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.goalAmount !== undefined && { goalAmount: dto.goalAmount }),
        ...(dto.deadline && { deadline: new Date(dto.deadline) }),
        approvalStatus: 'PENDING',
        rejectReason: null,
      },
    });
  },

  async uploadPlan(sessionId: string, userId: string, fileUrl: string) {
    const org = await prisma.organization.findUnique({ where: { userId } });
    if (!org) throw new AppError('기관 정보를 찾을 수 없습니다.', 404);

    const session = await prisma.donationSession.findUnique({ where: { id: sessionId } });
    if (!session) throw new AppError('캠페인을 찾을 수 없습니다.', 404);
    if (session.organizationId !== org.id) throw new AppError('캠페인 관리 권한이 없습니다.', 403);

    return prisma.donationSession.update({
      where: { id: sessionId },
      data: { planFileUrl: fileUrl, approvalStatus: 'PENDING', rejectReason: null },
    });
  },

  async remove(sessionId: string, userId: string) {
    const org = await prisma.organization.findUnique({ where: { userId } });
    if (!org) throw new AppError('기관 정보를 찾을 수 없습니다.', 404);

    const session = await prisma.donationSession.findUnique({ where: { id: sessionId } });
    if (!session) throw new AppError('캠페인을 찾을 수 없습니다.', 404);
    if (session.organizationId !== org.id) throw new AppError('삭제 권한이 없습니다.', 403);

    const hasDonations = await prisma.donationRecord.count({ where: { sessionId } });
    if (hasDonations > 0) throw new AppError('기부 기록이 있는 캠페인은 삭제할 수 없습니다.', 400);

    await prisma.donationSession.delete({ where: { id: sessionId } });
  },
};
