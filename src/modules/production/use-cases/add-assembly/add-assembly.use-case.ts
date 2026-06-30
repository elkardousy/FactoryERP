import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PackingOrderStatusEnum } from '@prisma/client';
import { AuditService } from '../../../../core/audit/audit.service';
import { ProductionPackingRepository } from '../../repositories/production-packing.repository';
import { ProductionEventPublisher } from '../../events/production-event.publisher';
import { PackingAssemblyAddedEvent } from '../../events/production.events';
import {
  mapPackingOrder,
  type AddAssemblyDto,
  type PackingOrderResponseDto,
} from '../../dto/production-packing.dto';
import type { JwtPayload } from '../../../auth/use-cases/login';

const ALLOWED_STATUSES = new Set<string>([
  PackingOrderStatusEnum.DRAFT,
  PackingOrderStatusEnum.IN_PROCESS,
]);

@Injectable()
export class AddAssemblyUseCase {
  constructor(
    private readonly packingRepo: ProductionPackingRepository,
    private readonly publisher: ProductionEventPublisher,
    private readonly auditService: AuditService,
  ) {}

  async execute(
    packingOrderId: string,
    dto: AddAssemblyDto,
    actor: JwtPayload,
  ): Promise<PackingOrderResponseDto> {
    const packingOrderBigInt = BigInt(packingOrderId);

    const packingOrder =
      await this.packingRepo.findPackingOrderById(packingOrderBigInt);
    if (!packingOrder) {
      throw new NotFoundException(`Packing order ${packingOrderId} not found`);
    }

    if (!ALLOWED_STATUSES.has(packingOrder.status)) {
      throw new BadRequestException(
        `Cannot add assembly to a packing order in status ${packingOrder.status} — must be DRAFT or IN_PROCESS`,
      );
    }

    if (!dto.lines || dto.lines.length === 0) {
      throw new BadRequestException('At least one assembly line is required');
    }

    // Compute dozens assembled from pieces (ED-P08-005)
    const dozensAssembled =
      dto.lines.reduce((sum, l) => sum + l.pieces_consumed, 0) / 12.0;

    const now = new Date();
    const result = await this.packingRepo.addAssembly({
      packingOrderId: packingOrderBigInt,
      productionOrderId: packingOrder.production_order_id,
      lines: dto.lines.map((l) => ({
        qualityBoxId: BigInt(l.quality_box_id),
        colorId: BigInt(l.color_id),
        sizeId: BigInt(l.size_id),
        patternLineId: BigInt(l.pattern_line_id),
        piecesConsumed: l.pieces_consumed,
      })),
      dozensAssembled,
      assembledBy: actor.sub,
      now,
      notes: dto.notes,
    });

    this.publisher.emitPackingAssemblyAdded(
      new PackingAssemblyAddedEvent(
        packingOrderId,
        result.assemblyId.toString(),
        result.assemblySequence,
        result.dozensAssembled,
        result.updatedAssembledDozens,
        actor.sub.toString(),
        now,
      ),
    );

    await this.auditService.log({
      eventType: 'packing_order.assembly_added',
      entityType: 'packing_orders',
      entityId: packingOrderId,
      userId: actor.sub,
      payload: {
        assembly_id: result.assemblyId.toString(),
        assembly_sequence: result.assemblySequence,
        dozens_assembled: result.dozensAssembled,
        updated_assembled_dozens: result.updatedAssembledDozens,
      },
    });

    const updated =
      await this.packingRepo.findPackingOrderById(packingOrderBigInt);
    return mapPackingOrder(updated!);
  }
}
