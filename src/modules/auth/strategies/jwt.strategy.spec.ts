import { Test } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtStrategy } from './jwt.strategy';
import { AuthService } from '../services/auth.service';
import type { JwtSignPayload } from '../contracts/jwt-sign-payload.interface';

const SIGN_PAYLOAD: JwtSignPayload = {
  sub: '1',
  username: 'alice',
  roleId: '2',
  sessionId: '10',
};

const ACTIVE_USER = {
  user_id: BigInt(1),
  username: 'alice',
  locked_at: null,
  is_active: true,
};

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let authService: jest.Mocked<AuthService>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        {
          provide: AuthService,
          useValue: {
            findActiveById: jest.fn().mockResolvedValue(ACTIVE_USER),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            getOrThrow: jest.fn().mockReturnValue('test-secret'),
          },
        },
      ],
    }).compile();

    strategy = module.get(JwtStrategy);
    authService = module.get(AuthService);
  });

  describe('validate', () => {
    it('reconstructs BigInt claims and returns JwtPayload for active user', async () => {
      const result = await strategy.validate(SIGN_PAYLOAD);
      expect(result.sub).toBe(BigInt(1));
      expect(result.username).toBe('alice');
      expect(result.roleId).toBe(BigInt(2));
      expect(result.sessionId).toBe(BigInt(10));
    });

    it('calls findActiveById with BigInt sub from decoded token', async () => {
      await strategy.validate(SIGN_PAYLOAD);
      expect(authService.findActiveById).toHaveBeenCalledWith(BigInt(1));
    });

    it('throws UnauthorizedException when user is not found', async () => {
      authService.findActiveById.mockResolvedValue(null);
      await expect(strategy.validate(SIGN_PAYLOAD)).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });

    it('throws UnauthorizedException when user account is locked', async () => {
      authService.findActiveById.mockResolvedValue({
        ...ACTIVE_USER,
        locked_at: new Date(),
      } as never);
      await expect(strategy.validate(SIGN_PAYLOAD)).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });
  });
});
