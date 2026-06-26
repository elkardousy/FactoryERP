import { Injectable } from '@nestjs/common';
import { AuditRepository, CreateAuditEventInput } from './audit.repository';

@Injectable()
export class AuditService {
  constructor(private readonly repo: AuditRepository) {}

  async log(input: CreateAuditEventInput): Promise<void> {
    try {
      await this.repo.create(input);
    } catch {
      // Audit failures must never break the caller's business flow
    }
  }
}
