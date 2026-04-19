import { authService } from '../auth.service';

jest.mock('../../../config/database', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  },
}));

jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('hashed_password'),
  compare: jest.fn(),
}));

jest.mock('../../../config/env', () => ({
  env: { JWT_SECRET: 'test-secret', JWT_EXPIRES_IN: '7d' },
}));

import { prisma } from '../../../config/database';
import bcrypt from 'bcryptjs';

describe('authService.register', () => {
  beforeEach(() => jest.clearAllMocks());

  it('이미 존재하는 이메일이면 409 에러를 던진다', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: '1' });

    await expect(
      authService.register({ email: 'dup@test.com', password: 'pass', role: 'INDIVIDUAL' })
    ).rejects.toMatchObject({ statusCode: 409 });
  });

  it('ORGANIZATION 역할인데 orgName이 없으면 400 에러를 던진다', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

    await expect(
      authService.register({ email: 'org@test.com', password: 'pass', role: 'ORGANIZATION' })
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it('개인 회원가입 성공 시 token과 role을 반환한다', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
    (prisma.user.create as jest.Mock).mockResolvedValue({ id: 'user-1', role: 'INDIVIDUAL' });

    const result = await authService.register({
      email: 'new@test.com',
      password: 'pass',
      role: 'INDIVIDUAL',
    });

    expect(result).toHaveProperty('token');
    expect(result.role).toBe('INDIVIDUAL');
  });
});

describe('authService.login', () => {
  beforeEach(() => jest.clearAllMocks());

  it('존재하지 않는 이메일이면 401 에러를 던진다', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

    await expect(
      authService.login({ email: 'notfound@test.com', password: 'pass' })
    ).rejects.toMatchObject({ statusCode: 401 });
  });

  it('비밀번호가 틀리면 401 에러를 던진다', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: '1',
      passwordHash: 'hashed',
      role: 'INDIVIDUAL',
    });
    (bcrypt.compare as jest.Mock).mockResolvedValue(false);

    await expect(
      authService.login({ email: 'test@test.com', password: 'wrongpass' })
    ).rejects.toMatchObject({ statusCode: 401 });
  });

  it('로그인 성공 시 token과 role을 반환한다', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: 'user-1',
      passwordHash: 'hashed',
      role: 'INDIVIDUAL',
    });
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);

    const result = await authService.login({ email: 'test@test.com', password: 'pass' });

    expect(result).toHaveProperty('token');
    expect(result.role).toBe('INDIVIDUAL');
  });
});
