import {
  ConflictException,
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { AuditService } from '../../../core/audit/audit.service';
import { ModelsRepository } from '../repositories/models.repository';
import { CustomersRepository } from '../../customers/repositories/customers.repository';
import { CreateModelDto } from '../dto/model.dto';

@Injectable()
export class CreateModelUseCase {
  constructor(
    private readonly modelsRepo: ModelsRepository,
    private readonly customersRepo: CustomersRepository,
    private readonly auditService: AuditService,
  ) {}

  async execute(dto: CreateModelDto, actorId: bigint) {
    const customerId = BigInt(dto.customer_id);

    const customer = await this.customersRepo.findById(customerId);
    if (!customer)
      throw new NotFoundException(`Customer ${dto.customer_id} not found.`);
    if (!customer.is_active)
      throw new BadRequestException(
        `Customer ${dto.customer_id} is not active.`,
      );

    const existing = await this.modelsRepo.findByCustomerAndCode(
      customerId,
      dto.model_code,
    );
    if (existing)
      throw new ConflictException(
        `Model code '${dto.model_code}' already exists for this customer.`,
      );

    const model = await this.modelsRepo.create({
      customer_id: customerId,
      model_code: dto.model_code,
      model_name: dto.model_name,
    });

    void this.auditService.log({
      eventType: 'MODEL_CREATED',
      entityType: 'garment_models',
      entityId: String(model.model_id),
      userId: actorId,
      payload: {
        model_code: model.model_code,
        customer_id: String(dto.customer_id),
      },
    });

    return model;
  }
}
