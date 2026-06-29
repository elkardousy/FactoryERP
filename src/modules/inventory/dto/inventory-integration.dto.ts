import { IsOptional, IsString } from 'class-validator';

export class OrderBagSummaryDto {
  bag_id: string;
  bag_code: string;
  part_id: string;
  status: string;
  current_dozens: string;
  current_warehouse_id: string | null;
}

export class WipPositionDto {
  wip_id: string;
  order_id: string;
  line_id: string;
  part_id: string;
  dozens_in_wip: string;
  last_updated: string;
}

export class OrderInventoryContextDto {
  order_id: string;
  physical_bags: OrderBagSummaryDto[];
  wip_positions: WipPositionDto[];
  total_bags_in_wip: number;
  total_dozens_in_wip: string;
}

export class WipPositionsQueryDto {
  @IsOptional()
  @IsString()
  order_id?: string;
}
