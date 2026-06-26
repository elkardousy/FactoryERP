import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuditService } from '../../../core/audit/audit.service';
import { CustomersRepository } from '../repositories/customers.repository';
import { UpdateCustomerDto } from '../dto/customer.dto';

@Injectable()
export class UpdateCustomerUseCase {
  constructor(
    private readonly repo: CustomersRepository,
    private readonly auditService: AuditService,
  ) {}

  async execute(id: number, dto: UpdateCustomerDto, actorId: bigint) {
    const customerId = BigInt(id);
    const customer = await this.repo.findById(customerId);
    if (!customer) throw new NotFoundException(`Customer ${id} not found.`);

    if (dto.customer_code && dto.customer_code !== customer.customer_code) {
      const conflict = await this.repo.findByCode(dto.customer_code);
      if (conflict)
        throw new ConflictException(
          `Customer code '${dto.customer_code}' already exists.`,
        );
    }

    const updated = await this.repo.update(customerId, {
      customer_code: dto.customer_code,
      customer_name: dto.customer_name,
    });

    void this.auditService.log({
      eventType: 'CUSTOMER_UPDATED',
      entityType: 'customers',
      entityId: String(id),
      userId: actorId,
      payload: dto as Record<string, unknown>,
    });

    return updated;
  }
}
