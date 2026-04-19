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
  deadline?: string;
}

export const sessionsService = {
  async create(userId: string, dto: CreateSessionDto) {
    const org = await prisma.organization.findUnique({ where: { userId } });
    if (!org) throw new AppError('단체 정보를 찾을 수 없습니다.', 404);
    if (org.approvalStatus !== 'APPROVED') {
      throw new AppError('승인된 단체만 기부 세션을 생성할 수 있습니다.', 403);
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
    await prisma.donationSession.updateMany({
      where: { status: 'ACTIVE', deadline: { lt: new Date() } },
      data: { status: 'CLOSED' },
    });
    return prisma.donationSession.findMany({
      where: { approvalStatus: 'APPROVED' },
      include: { organization: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    });
  },

  async getById(id: string) {
    await prisma.donationSession.updateMany({
      where: { id, status: 'ACTIVE', deadline: { lt: new Date() } },
      data: { status: 'CLOSED' },
    });
    const session = await prisma.donationSession.findUnique({
      where: { id },
      include: {
        organization: { select: { id: true, name: true } },
        donations: {
          include: { donor: { select: { nickname: true, email: true } } },
          orderBy: { amount: 'desc' },
        },
      },
    });
    if (!session) throw new AppError('기부 세션을 찾을 수 없습니다.', 404);
    return session;
  },

  async update(sessionId: string, userId: string, dto: UpdateSessionDto) {
    const org = await prisma.organization.findUnique({ where: { userId } });
    if (!org) throw new AppError('단체 정보를 찾을 수 없습니다.', 404);

    const session = await prisma.donationSession.findUnique({ where: { id: sessionId } });
    if (!session) throw new AppError('기부 세션을 찾을 수 없습니다.', 404);
    if (session.organizationId !== org.id) throw new AppError('수정 권한이 없습니다.', 403);
    if (session.status !== 'ACTIVE') throw new AppError('진행 중인 세션만 수정할 수 있습니다.', 400);

    return prisma.donationSession.update({
      where: { id: sessionId },
      data: {
        ...(dto.title && { title: dto.title }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.deadline && { deadline: new Date(dto.deadline) }),
      },
    });
  },

  async uploadPlan(sessionId: string, userId: string, fileUrl: string) {
    const org = await prisma.organization.findUnique({ where: { userId } });
    if (!org) throw new AppError('단체 정보를 찾을 수 없습니다.', 404);

    const session = await prisma.donationSession.findUnique({ where: { id: sessionId } });
    if (!session) throw new AppError('기부 세션을 찾을 수 없습니다.', 404);
    if (session.organizationId !== org.id) throw new AppError('해당 세션에 대한 권한이 없습니다.', 403);

    return prisma.donationSession.update({
      where: { id: sessionId },
      data: { planFileUrl: fileUrl, approvalStatus: 'PENDING', rejectReason: null },
    });
  },

  async remove(sessionId: string, userId: string) {
    const org = await prisma.organization.findUnique({ where: { userId } });
    if (!org) throw new AppError('단체 정보를 찾을 수 없습니다.', 404);

    const session = await prisma.donationSession.findUnique({ where: { id: sessionId } });
    if (!session) throw new AppError('기부 세션을 찾을 수 없습니다.', 404);
    if (session.organizationId !== org.id) throw new AppError('삭제 권한이 없습니다.', 403);
    if (session.status === 'COMPLETED') throw new AppError('완료된 세션은 삭제할 수 없습니다.', 400);

    const hasDonations = await prisma.donationRecord.count({ where: { sessionId } });
    if (hasDonations > 0) throw new AppError('기부 기록이 있는 세션은 삭제할 수 없습니다.', 400);

    await prisma.donationSession.delete({ where: { id: sessionId } });
  },
};
