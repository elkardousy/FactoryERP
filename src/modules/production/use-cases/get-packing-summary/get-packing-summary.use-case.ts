import { Injectable, NotFoundException } from '@nestjs/common';
import { ProductionPackingRepository } from '../../repositories/production-packing.repository';
import {
  mapPackingVerification,
  type PackingSummaryFilterDto,
  type PackingSummaryDto,
} from '../../dto/production-packing.dto';

@Injectable()
export class GetPackingSummaryUseCase {
  constructor(private readonly packingRepo: ProductionPackingRepository) {}

  async execute(filter: PackingSummaryFilterDto): Promise<PackingSummaryDto> {
    const productionOrderId = BigInt(filter.production_order_id);

    const packingOrder =
      await this.packingRepo.findPackingOrderByProductionOrderId(
        productionOrderId,
      );
    if (!packingOrder) {
      throw new NotFoundException(
        `No packing order found for production order ${filter.production_order_id}`,
      );
    }

    // Load with verifications
    const full = await this.packingRepo.findPackingOrderById(
      packingOrder.packing_order_id,
    );
    if (!full) {
      throw new NotFoundException(
        `Packing order ${packingOrder.packing_order_id} not found`,
      );
    }

    const verification = full.packing_verifications?.[0] ?? null;

    return {
      packing_order_id: full.packing_order_id.toString(),
      packing_order_no: full.packing_order_no,
      production_order_id: full.production_order_id.toString(),
      status: full.status,
      target_dozens: full.target_dozens.toString(),
      assembled_dozens: full.assembled_dozens.toString(),
      verified_dozens: full.verified_dozens?.toString() ?? null,
      verification: verification ? mapPackingVerification(verification) : null,
    };
  }
}
