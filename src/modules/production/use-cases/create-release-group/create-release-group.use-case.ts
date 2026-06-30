import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  BagStatusEnum,
  OrderStatusEnum,
  PartStatusEnum,
  ReservationStatusEnum,
  TxnTypeEnum,
} from '@prisma/client';
import { AuditService } from '../../../../core/audit/audit.service';
import { LoggerService } from '../../../../core/logger/logger.service';
import { ProductionOrdersRepository } from '../../repositories/production-orders.repository';
import { MaterialReleaseRepository } from '../../repositories/material-release.repository';
import { ProductionEventPublisher } from '../../events/production-event.publisher';
import { MaterialReleaseCreatedEvent } from '../../events/production.events';
import { PhysicalBagsRepository } from '../../../inventory/repositories/physical-bags.repository';
import { PhysicalBagReservationsRepository } from '../../../inventory/repositories/physical-bag-reservations.repository';
import {
  mapReleaseGroup,
  type CreateReleaseGroupDto,
  type ReleaseGroupResponseDto,
} from '../../dto/material-release.dto';
import type { PrismaService } from '../../../../core/database/prisma/prisma.service';
import type { JwtPayload } from '../../../auth/use-cases/login';

const CMO_RETRY_LIMIT = 3;

interface LineData {
  bagId: bigint;
  orderPartId: bigint;
  sourceWarehouseId: bigint;
  modelId: bigint;
  partId: bigint;
  dozensToRelease: number;
}

@Injectable()
export class CreateReleaseGroupUseCase {
  constructor(
    private readonly ordersRepo: ProductionOrdersRepository,
    private readonly releaseRepo: MaterialReleaseRepository,
    private readonly bagsRepo: PhysicalBagsRepository,
    private readonly reservationsRepo: PhysicalBagReservationsRepository,
    private readonly publisher: ProductionEventPublisher,
    private readonly auditService: AuditService,
    private readonly logger: LoggerService,
  ) {}

  async execute(
    orderId: string,
    dto: CreateReleaseGroupDto,
    actor: JwtPayload,
  ): Promise<ReleaseGroupResponseDto> {
    const id = BigInt(orderId);

    // Validate production order
    const order = await this.ordersRepo.findById(id);
    if (!order) {
      throw new NotFoundException(`Production order ${orderId} not found`);
    }
    if (order.status !== OrderStatusEnum.PLANNED) {
      throw new BadRequestException(
        `Cannot release material: order must be PLANNED, current status is ${order.status}`,
      );
    }

    // Check for duplicate bag_ids in the same request
    const requestedBagIds = dto.lines.map((l) => l.bag_id);
    if (new Set(requestedBagIds).size !== requestedBagIds.length) {
      throw new BadRequestException(
        'Duplicate bag_id entries in release lines',
      );
    }

    // Validate each bag and collect line data
    const lineData: LineData[] = [];

    for (const line of dto.lines) {
      const bagId = BigInt(line.bag_id);
      const sourceWarehouseId = BigInt(line.source_warehouse_id);

      const bag = await this.bagsRepo.findById(bagId);
      if (!bag) {
        throw new NotFoundException(`Physical bag ${line.bag_id} not found`);
      }
      if (bag.status !== BagStatusEnum.RESERVED) {
        throw new BadRequestException(
          `Bag ${line.bag_id} is not RESERVED (current status: ${bag.status})`,
        );
      }
      if (!bag.current_warehouse_id) {
        throw new BadRequestException(
          `Bag ${line.bag_id} has no current warehouse — cannot determine source`,
        );
      }
      if (bag.current_warehouse_id !== sourceWarehouseId) {
        throw new BadRequestException(
          `source_warehouse_id ${line.source_warehouse_id} does not match bag ${line.bag_id} current warehouse ${bag.current_warehouse_id}`,
        );
      }

      const reservation = await this.reservationsRepo.findByBagAndOrder(
        bagId,
        id,
      );
      if (!reservation) {
        throw new NotFoundException(
          `No reservation found for bag ${line.bag_id} on order ${orderId}`,
        );
      }
      if (reservation.status !== ReservationStatusEnum.ACTIVE) {
        throw new BadRequestException(
          `Reservation for bag ${line.bag_id} is not ACTIVE (status: ${reservation.status})`,
        );
      }

      const reservedDozens = Number(reservation.reserved_dozens);
      if (line.dozens_to_release !== reservedDozens) {
        throw new BadRequestException(
          `dozens_to_release (${line.dozens_to_release}) must equal reserved_dozens (${reservedDozens}) for bag ${line.bag_id} — partial releases require schema extension`,
        );
      }

      const orderPartId = await this.ordersRepo.findOrderPartId(
        id,
        bag.part_id,
      );
      if (!orderPartId) {
        throw new NotFoundException(
          `Part ${bag.part_id} from bag ${line.bag_id} is not assigned to production order ${orderId}`,
        );
      }

      lineData.push({
        bagId,
        orderPartId,
        sourceWarehouseId,
        modelId: bag.model_id,
        partId: bag.part_id,
        dozensToRelease: line.dozens_to_release,
      });
    }

    const actorId = actor.sub;
    const now = new Date();
    const totalDozens = lineData.reduce((sum, l) => sum + l.dozensToRelease, 0);

    // Execute atomic release transaction
    const group = await this.releaseRepo.executeInTransaction(
      async (tx: PrismaService) => {
        // Get next group number for this order (atomic within tx)
        const maxAgg = await tx.release_groups.aggregate({
          _max: { group_number: true },
          where: { order_id: id },
        });
        const groupNumber = (maxAgg._max.group_number ?? 0) + 1;

        // Create release group
        const releaseGroup = await tx.release_groups.create({
          data: {
            order_id: id,
            group_number: groupNumber,
            released_by: actorId,
            released_at: now,
          },
        });

        const lines: import('@prisma/client').release_group_lines[] = [];

        for (const ld of lineData) {
          // Create release group line
          const rl = await tx.release_group_lines.create({
            data: {
              release_group_id: releaseGroup.release_group_id,
              order_part_id: ld.orderPartId,
              source_warehouse_id: ld.sourceWarehouseId,
              dozens_released: ld.dozensToRelease,
            },
          });
          lines.push(rl);

          // Update reservation → RELEASED
          await tx.physical_bag_reservations.update({
            where: {
              bag_id_order_id: { bag_id: ld.bagId, order_id: id },
            },
            data: { status: ReservationStatusEnum.RELEASED, released_at: now },
          });

          // Update physical bag → RELEASED, move custody to production order
          await tx.physical_bags.update({
            where: { bag_id: ld.bagId },
            data: {
              status: BagStatusEnum.RELEASED,
              current_order_id: id,
              current_warehouse_id: null,
            },
          });

          // Record physical bag movement
          await tx.physical_bag_movements.create({
            data: {
              bag_id: ld.bagId,
              from_status: BagStatusEnum.RESERVED,
              to_status: BagStatusEnum.RELEASED,
              from_warehouse_id: ld.sourceWarehouseId,
              to_warehouse_id: null,
              from_order_id: null,
              to_order_id: id,
              dozens_moved: ld.dozensToRelease,
              movement_reason: 'PRODUCTION_RELEASE',
              performed_by: actorId,
              notes: null,
            },
          });

          // Decrement inventory_bags ledger balance
          await tx.inventory_bags.updateMany({
            where: {
              warehouse_id: ld.sourceWarehouseId,
              model_id: ld.modelId,
              part_id: ld.partId,
            },
            data: {
              dozens_on_hand: { decrement: ld.dozensToRelease },
              last_updated: now,
            },
          });

          // Create inventory transaction (RELEASE)
          await tx.inventory_transactions.create({
            data: {
              txn_reference: `RG-${releaseGroup.release_group_id}`,
              txn_type: TxnTypeEnum.RELEASE,
              model_id: ld.modelId,
              part_id: ld.partId,
              from_location_type: 'WAREHOUSE',
              from_location_id: ld.sourceWarehouseId,
              to_location_type: 'PRODUCTION',
              to_location_id: id,
              dozens_qty: ld.dozensToRelease,
              executed_by: actorId,
              notes: null,
            },
          });
        }

        // BR-R07: Update production_order_parts.status → RELEASED for fully released parts
        const distinctPartIds = [...new Set(lineData.map((l) => l.partId))];
        for (const partId of distinctPartIds) {
          const remainingActive = await tx.physical_bag_reservations.count({
            where: {
              order_id: id,
              status: ReservationStatusEnum.ACTIVE,
              physical_bags: { part_id: partId },
            },
          });
          if (remainingActive === 0) {
            await tx.production_order_parts.update({
              where: {
                order_id_part_id: { order_id: id, part_id: partId },
              },
              data: {
                status: PartStatusEnum.RELEASED,
                released_at: now,
                released_by: actorId,
              },
            });
          }
        }

        return { ...releaseGroup, release_group_lines: lines };
      },
    );

    // BR-R04: Increment CMO line released_dozens with optimistic lock retry
    if (order.cmo_line_id) {
      await this.incrementCmoLine(order.cmo_line_id, totalDozens);
    }

    // Publish event
    this.publisher.emitMaterialReleased(
      new MaterialReleaseCreatedEvent(
        group.release_group_id.toString(),
        orderId,
        group.group_number,
        dto.lines.length,
        totalDozens,
        actorId.toString(),
        now,
      ),
    );

    // Audit log
    await this.auditService.log({
      eventType: 'production.release_group.created',
      entityType: 'release_groups',
      entityId: group.release_group_id.toString(),
      userId: actorId,
      payload: {
        order_id: orderId,
        group_number: group.group_number,
        lines_count: dto.lines.length,
        total_dozens: totalDozens,
      },
    });

    this.logger.info(
      `Release group ${group.release_group_id} created for order ${orderId}: ${dto.lines.length} bags, ${totalDozens} dozens`,
    );

    return mapReleaseGroup(group);
  }

  private async incrementCmoLine(
    cmoLineId: bigint,
    delta: number,
  ): Promise<void> {
    for (let attempt = 0; attempt < CMO_RETRY_LIMIT; attempt++) {
      const cmoLine = await this.releaseRepo.findCmoLine(cmoLineId);
      if (!cmoLine) return;

      const updated = await this.releaseRepo.incrementCmoReleasedDozens(
        cmoLineId,
        delta,
        cmoLine.version,
      );
      if (updated) return;

      this.logger.warn(
        `CMO line ${cmoLineId} version conflict on attempt ${attempt + 1}/${CMO_RETRY_LIMIT}`,
      );
    }
    throw new ConflictException(
      `CMO line ${cmoLineId} update failed after ${CMO_RETRY_LIMIT} retries — please retry the release`,
    );
  }
}
