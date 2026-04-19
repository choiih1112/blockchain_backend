import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import { Role } from '@prisma/client';
import { prisma } from '../../config/database';
import { env } from '../../config/env';
import { AppError } from '../../middleware/errorHandler';

export interface RegisterDto {
  email: string;
  password: string;
  nickname?: string;
  role: Role;
  orgName?: string;
  orgDescription?: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export const authService = {
  async register(dto: RegisterDto) {
    const existing = await prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new AppError('이미 사용 중인 이메일입니다.', 409);

    if (dto.role === 'ORGANIZATION' && !dto.orgName) {
      throw new AppError('단체명은 필수입니다.', 400);
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        nickname: dto.nickname,
        role: dto.role,
        ...(dto.role === 'ORGANIZATION' && {
          organization: {
            create: {
              name: dto.orgName!,
              description: dto.orgDescription,
            },
          },
        }),
      },
    });

    const signOptions: SignOptions = { expiresIn: env.JWT_EXPIRES_IN as SignOptions['expiresIn'] };
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      env.JWT_SECRET,
      signOptions
    );
    return { token, userId: user.id, role: user.role };
  },

  async login(dto: LoginDto) {
    const user = await prisma.user.findUnique({ where: { email: dto.email } });
    if (!user) throw new AppError('이메일 또는 비밀번호가 올바르지 않습니다.', 401);

    const isValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isValid) throw new AppError('이메일 또는 비밀번호가 올바르지 않습니다.', 401);

    const signOptions: SignOptions = { expiresIn: env.JWT_EXPIRES_IN as SignOptions['expiresIn'] };
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      env.JWT_SECRET,
      signOptions
    );
    return { token, userId: user.id, role: user.role };
  },
};
