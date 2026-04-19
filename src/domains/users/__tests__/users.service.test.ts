import { usersService } from '../users.service';

jest.mock('../../../config/database', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
  },
}));

import { prisma } from '../../../config/database';

describe('usersService.getMe', () => {
  beforeEach(() => jest.clearAllMocks());

  it('사용자가 없으면 404 에러를 던진다', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

    await expect(usersService.getMe('nonexistent-id')).rejects.toMatchObject({
      statusCode: 404,
    });
  });

  it('존재하는 사용자 정보를 반환한다 (passwordHash 제외)', async () => {
    const mockUser = {
      id: 'user-1',
      email: 'test@test.com',
      role: 'INDIVIDUAL',
      walletAddress: null,
      createdAt: new Date(),
    };
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

    const result = await usersService.getMe('user-1');

    expect(result).toEqual(mockUser);
    expect(result).not.toHaveProperty('passwordHash');
  });
});
