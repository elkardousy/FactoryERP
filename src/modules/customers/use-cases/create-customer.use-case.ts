import { ConflictException, Injectable } from '@nestjs/common';
import { AuditService } from '../../../core/audit/audit.service';
import { CustomersRepository } from '../repositories/customers.repository';
import { CreateCustomerDto } from '../dto/customer.dto';

@Injectable()
export class CreateCustomerUseCase {
  constructor(
    private readonly repo: CustomersRepository,
    private readonly auditService: AuditService,
  ) {}

  async execute(dto: CreateCustomerDto, actorId: bigint) {
    const existing = await this.repo.findByCode(dto.customer_code);
    if (existing)
      throw new ConflictException(
        `Customer code '${dto.customer_code}' already exists.`,
      );

    const customer = await this.repo.create({
      customer_code: dto.customer_code,
      customer_name: dto.customer_name,
    });

    void this.auditService.log({
      eventType: 'CUSTOMER_CREATED',
      entityType: 'customers',
      entityId: String(customer.customer_id),
      userId: actorId,
      payload: {
        customer_code: customer.customer_code,
        customer_name: customer.customer_name,
      },
    });

    return customer;
  }
}
