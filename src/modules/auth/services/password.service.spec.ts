import { Test } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { PasswordService } from './password.service';

describe('PasswordService', () => {
  let service: PasswordService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [PasswordService],
    }).compile();

    service = module.get(PasswordService);
  });

  describe('hash', () => {
    it('returns a bcrypt hash of the password', async () => {
      const hash = await service.hash('secret123');
      expect(hash).toMatch(/^\$2b\$/);
      expect(await bcrypt.compare('secret123', hash)).toBe(true);
    });

    it('produces different hashes for the same input (salt randomness)', async () => {
      const h1 = await service.hash('same');
      const h2 = await service.hash('same');
      expect(h1).not.toBe(h2);
    });
  });

  describe('verify', () => {
    it('returns true when plain matches hash', async () => {
      const hash = await bcrypt.hash('correct', 10);
      await expect(service.verify('correct', hash)).resolves.toBe(true);
    });

    it('returns false when plain does not match hash', async () => {
      const hash = await bcrypt.hash('correct', 10);
      await expect(service.verify('wrong', hash)).resolves.toBe(false);
    });
  });
});
