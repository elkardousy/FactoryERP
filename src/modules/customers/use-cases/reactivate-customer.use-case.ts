import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuditService } from '../../../core/audit/audit.service';
import { CustomersRepository } from '../repositories/customers.repository';

@Injectable()
export class ReactivateCustomerUseCase {
  constructor(
    private readonly repo: CustomersRepository,
    private readonly auditService: AuditService,
  ) {}

  async execute(id: number, actorId: bigint) {
    const customerId = BigInt(id);
    const customer = await this.repo.findById(customerId);
    if (!customer) throw new NotFoundException(`Customer ${id} not found.`);
    if (customer.is_active)
      throw new BadRequestException(`Customer ${id} is already active.`);

    const result = await this.repo.restore(customerId);

    void this.auditService.log({
      eventType: 'CUSTOMER_REACTIVATED',
      entityType: 'customers',
      entityId: String(id),
      userId: actorId,
      payload: { customer_id: String(id) },
    });

    return result;
  }
}
