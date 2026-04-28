import { prisma } from '../../config/database';
import { AppError } from '../../middleware/errorHandler';

export const adminService = {
  async getOrganizations() {
    return prisma.organization.findMany({
      include: { user: { select: { email: true, nickname: true, createdAt: true } } },
      orderBy: { createdAt: 'desc' },
    });
  },

  async approveOrganization(orgId: string) {
    const org = await prisma.organization.findUnique({ where: { id: orgId } });
    if (!org) throw new AppError('기관을 찾을 수 없습니다.', 404);
    if (org.approvalStatus === 'APPROVED') throw new AppError('이미 승인된 기관입니다.', 400);

    return prisma.organization.update({
      where: { id: orgId },
      data: { approvalStatus: 'APPROVED', rejectReason: null },
    });
  },

  async rejectOrganization(orgId: string, reason: string) {
    const org = await prisma.organization.findUnique({ where: { id: orgId } });
    if (!org) throw new AppError('기관을 찾을 수 없습니다.', 404);

    return prisma.organization.update({
      where: { id: orgId },
      data: { approvalStatus: 'REJECTED', rejectReason: reason },
    });
  },

  async getSessions() {
    return prisma.donationSession.findMany({
      include: { organization: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    });
  },

  async approveSession(sessionId: string) {
    const session = await prisma.donationSession.findUnique({ where: { id: sessionId } });
    if (!session) throw new AppError('캠페인을 찾을 수 없습니다.', 404);
    if (session.approvalStatus === 'APPROVED') throw new AppError('이미 승인된 캠페인입니다.', 400);
    if (!session.planFileUrl) throw new AppError('캠페인 계획서가 제출되어야 승인할 수 있습니다.', 400);

    return prisma.donationSession.update({
      where: { id: sessionId },
      data: { approvalStatus: 'APPROVED', rejectReason: null },
    });
  },

  async rejectSession(sessionId: string, reason: string) {
    const session = await prisma.donationSession.findUnique({ where: { id: sessionId } });
    if (!session) throw new AppError('캠페인을 찾을 수 없습니다.', 404);

    return prisma.donationSession.update({
      where: { id: sessionId },
      data: { approvalStatus: 'REJECTED', rejectReason: reason },
    });
  },

  async deleteSession(sessionId: string) {
    const session = await prisma.donationSession.findUnique({ where: { id: sessionId } });
    if (!session) throw new AppError('캠페인을 찾을 수 없습니다.', 404);

    await prisma.donationRecord.deleteMany({ where: { sessionId } });
    await prisma.donationSession.delete({ where: { id: sessionId } });
  },
};
