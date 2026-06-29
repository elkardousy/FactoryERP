import { Injectable } from '@nestjs/common';
import { InventoryIntegrationService } from '../../services/inventory-integration.service';
import type { WipPositionDto } from '../../dto/inventory-integration.dto';

@Injectable()
export class ListWipPositionsUseCase {
  constructor(
    private readonly integrationService: InventoryIntegrationService,
  ) {}

  async execute(orderId?: bigint): Promise<WipPositionDto[]> {
    return this.integrationService.listWipPositions(orderId);
  }
}
