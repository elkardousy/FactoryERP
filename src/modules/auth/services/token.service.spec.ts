import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { TokenService } from './token.service';
import { JwtService } from './jwt.service';

const PAYLOAD = {
  sub:       BigInt(1),
  username:  'alice',
  roleId:    BigInt(2),
  sessionId: BigInt(10),
};

describe('TokenService', () => {
  let service: TokenService;
  let jwtService: jest.Mocked<JwtService>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        TokenService,
        {
          provide: JwtService,
          useValue: {
            generateAccessToken: jest.fn().mockResolvedValue('signed.jwt.token'),
            verify:              jest.fn(),
            decode:              jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            getOrThrow: jest.fn((key: string) => {
              if (key === 'jwt.expiresIn')        return '15m';
              if (key === 'jwt.refreshExpiresIn') return '7d';
              throw new Error(`Unknown config key: ${key}`);
            }),
          },
        },
      ],
    }).compile();

    service    = module.get(TokenService);
    jwtService = module.get(JwtService);
  });

  describe('generateRefreshToken', () => {
    it('returns a UUID-shaped string', async () => {
      const token = await service.generateRefreshToken();
      expect(token).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
      );
    });

    it('generates a unique token each call', async () => {
      const [a, b] = await Promise.all([
        service.generateRefreshToken(),
        service.generateRefreshToken(),
      ]);
      expect(a).not.toBe(b);
    });
  });

  describe('generateTokenPair', () => {
    it('returns access token, refresh token, and expiry dates', async () => {
      const pair = await service.generateTokenPair(PAYLOAD);
      expect(pair.accessToken).toBe('signed.jwt.token');
      expect(pair.refreshToken).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
      );
      expect(pair.accessExpiresAt).toBeInstanceOf(Date);
      expect(pair.refreshExpiresAt).toBeInstanceOf(Date);
      expect(pair.refreshExpiresAt.getTime()).toBeGreaterThan(
        pair.accessExpiresAt.getTime(),
      );
    });

    it('serializes BigInt claims to strings before signing', async () => {
      await service.generateTokenPair(PAYLOAD);
      expect(jwtService.generateAccessToken).toHaveBeenCalledWith({
        sub:       '1',
        username:  'alice',
        roleId:    '2',
        sessionId: '10',
      });
    });
  });

  describe('hashRefreshToken / compareRefreshToken', () => {
    it('round-trips: compare returns true for matching token', async () => {
      const hash   = await service.hashRefreshToken('my-raw-token');
      const result = await service.compareRefreshToken('my-raw-token', hash);
      expect(result).toBe(true);
    });

    it('returns false when token does not match hash', async () => {
      const hash = await bcrypt.hash('correct-token', 10);
      await expect(service.compareRefreshToken('wrong-token', hash)).resolves.toBe(false);
    });
  });
});
