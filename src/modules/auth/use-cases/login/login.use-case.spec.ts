import { Test } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { LoginUseCase } from './login.use-case';
import { AuthService } from '../../services/auth.service';
import { TokenService } from '../../services/token.service';
import { SessionService } from '../../services/session.service';
import { AuditRepository } from '../../repositories/audit.repository';

const MOCK_USER = {
  user_id:             BigInt(1),
  username:            'alice',
  full_name:           'Alice Smith',
  role_id:             BigInt(2),
  must_change_password: false,
  locked_at:           null,
};

const MOCK_TOKEN_PAIR = {
  accessToken:      'access.token',
  refreshToken:     'raw-uuid-token',
  accessExpiresAt:  new Date(Date.now() + 15 * 60 * 1000),
  refreshExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
};

const MOCK_SESSION = { session_id: BigInt(42) };
const CTX          = { deviceId: 'dev-001', devicePlatform: 'web' };

describe('LoginUseCase', () => {
  let useCase:          LoginUseCase;
  let authService:      jest.Mocked<AuthService>;
  let tokenService:     jest.Mocked<TokenService>;
  let sessionService:   jest.Mocked<SessionService>;
  let auditRepository:  jest.Mocked<AuditRepository>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        LoginUseCase,
        {
          provide: AuthService,
          useValue: {
            validateUser: jest.fn().mockResolvedValue(MOCK_USER),
          },
        },
        {
          provide: TokenService,
          useValue: {
            generateTokenPair:   jest.fn().mockResolvedValue(MOCK_TOKEN_PAIR),
            hashRefreshToken:    jest.fn().mockResolvedValue('hashed-token'),
            generateAccessToken: jest.fn().mockResolvedValue('final.access.token'),
          },
        },
        {
          provide: SessionService,
          useValue: {
            createSession: jest.fn().mockResolvedValue(MOCK_SESSION),
          },
        },
        {
          provide: AuditRepository,
          useValue: {
            create: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    }).compile();

    useCase         = module.get(LoginUseCase);
    authService     = module.get(AuthService);
    tokenService    = module.get(TokenService);
    sessionService  = module.get(SessionService);
    auditRepository = module.get(AuditRepository);
  });

  it('returns a LoginResult with composite refresh token on success', async () => {
    const result = await useCase.execute(
      { username: 'alice', password: 'pass' },
      CTX,
    );

    expect(result.user.username).toBe('alice');
    expect(result.user.userId).toBe(BigInt(1));
    expect(result.sessionId).toBe(BigInt(42));
    expect(result.tokens.accessToken).toBe('final.access.token');
    expect(result.tokens.refreshToken).toBe('42:raw-uuid-token');
    expect(result.mustChangePassword).toBe(false);
  });

  it('re-signs the access token with the real sessionId after session creation', async () => {
    await useCase.execute({ username: 'alice', password: 'pass' }, CTX);

    expect(tokenService.generateAccessToken).toHaveBeenCalledWith(
      expect.objectContaining({ sessionId: BigInt(42) }),
    );
  });

  it('creates session with hashed refresh token', async () => {
    await useCase.execute({ username: 'alice', password: 'pass' }, CTX);

    expect(sessionService.createSession).toHaveBeenCalledWith(
      BigInt(1),
      MOCK_TOKEN_PAIR,
      'hashed-token',
      CTX,
    );
  });

  it('propagates UnauthorizedException from validateUser', async () => {
    authService.validateUser.mockRejectedValue(
      new UnauthorizedException('Invalid credentials'),
    );

    await expect(
      useCase.execute({ username: 'bad', password: 'bad' }, CTX),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('does not throw when audit write fails', async () => {
    auditRepository.create.mockRejectedValue(new Error('DB timeout'));

    await expect(
      useCase.execute({ username: 'alice', password: 'pass' }, CTX),
    ).resolves.toBeDefined();
  });
});
