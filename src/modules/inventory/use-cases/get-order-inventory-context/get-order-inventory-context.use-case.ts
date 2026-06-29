import { Injectable } from '@nestjs/common';
import { InventoryIntegrationService } from '../../services/inventory-integration.service';
import type { OrderInventoryContextDto } from '../../dto/inventory-integration.dto';

@Injectable()
export class GetOrderInventoryContextUseCase {
  constructor(
    private readonly integrationService: InventoryIntegrationService,
  ) {}

  async execute(orderId: bigint): Promise<OrderInventoryContextDto> {
    return this.integrationService.getOrderInventoryContext(orderId);
  }
}
