import { authenticate, AuthRequest } from '../auth';
import { Response, NextFunction } from 'express';

jest.mock('../../config/env', () => ({
  env: { JWT_SECRET: 'test-secret' },
}));

import jwt from 'jsonwebtoken';
jest.mock('jsonwebtoken');

describe('authenticate middleware', () => {
  const mockNext = jest.fn() as jest.MockedFunction<NextFunction>;

  beforeEach(() => jest.clearAllMocks());

  it('should return 401 if no Authorization header', () => {
    const req = { headers: {} } as AuthRequest;
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as unknown as Response;

    authenticate(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: '인증 토큰이 필요합니다.',
    });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should return 401 if token is invalid', () => {
    const req = {
      headers: { authorization: 'Bearer invalid-token' },
    } as AuthRequest;
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as unknown as Response;
    (jwt.verify as jest.Mock).mockImplementation(() => {
      throw new Error('invalid signature');
    });

    authenticate(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should attach user to req and call next() if token is valid', () => {
    const req = {
      headers: { authorization: 'Bearer valid-token' },
    } as AuthRequest;
    const res = {} as Response;
    (jwt.verify as jest.Mock).mockReturnValue({ userId: 'user-1', role: 'INDIVIDUAL' });

    authenticate(req, res, mockNext);

    expect(req.user).toEqual({ userId: 'user-1', role: 'INDIVIDUAL' });
    expect(mockNext).toHaveBeenCalled();
  });
});
