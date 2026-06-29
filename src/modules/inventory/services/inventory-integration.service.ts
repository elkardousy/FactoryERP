import { Injectable } from '@nestjs/common';
import type { physical_bags, wip_inventory } from '@prisma/client';
import { InventoryIntegrationRepository } from '../repositories/inventory-integration.repository';
import {
  OrderBagSummaryDto,
  OrderInventoryContextDto,
  WipPositionDto,
} from '../dto/inventory-integration.dto';

@Injectable()
export class InventoryIntegrationService {
  constructor(
    private readonly integrationRepo: InventoryIntegrationRepository,
  ) {}

  async getOrderInventoryContext(
    orderId: bigint,
  ): Promise<OrderInventoryContextDto> {
    const [bags, wipPositions] = await Promise.all([
      this.integrationRepo.findPhysicalBagsForOrder(orderId),
      this.integrationRepo.findWipPositionsForOrder(orderId),
    ]);

    const totalDozensInWip = wipPositions.reduce(
      (sum, w) => sum + Number(w.dozens_in_wip),
      0,
    );

    const dto = new OrderInventoryContextDto();
    dto.order_id = orderId.toString();
    dto.physical_bags = bags.map((b) => this.toBagSummary(b));
    dto.wip_positions = wipPositions.map((w) => this.toWipDto(w));
    dto.total_bags_in_wip = bags.length;
    dto.total_dozens_in_wip = totalDozensInWip.toFixed(3);
    return dto;
  }

  async listWipPositions(orderId?: bigint): Promise<WipPositionDto[]> {
    const positions = await this.integrationRepo.findAllWipPositions(orderId);
    return positions.map((w) => this.toWipDto(w));
  }

  private toBagSummary(b: physical_bags): OrderBagSummaryDto {
    const dto = new OrderBagSummaryDto();
    dto.bag_id = b.bag_id.toString();
    dto.bag_code = b.bag_code;
    dto.part_id = b.part_id.toString();
    dto.status = b.status;
    dto.current_dozens = b.current_dozens.toString();
    dto.current_warehouse_id = b.current_warehouse_id
      ? b.current_warehouse_id.toString()
      : null;
    return dto;
  }

  private toWipDto(w: wip_inventory): WipPositionDto {
    const dto = new WipPositionDto();
    dto.wip_id = w.wip_id.toString();
    dto.order_id = w.order_id.toString();
    dto.line_id = w.line_id.toString();
    dto.part_id = w.part_id.toString();
    dto.dozens_in_wip = w.dozens_in_wip.toString();
    dto.last_updated = w.last_updated.toISOString();
    return dto;
  }
}
