import { Injectable, NotFoundException } from '@nestjs/common';
import { BagStatusEnum, ReservationStatusEnum } from '@prisma/client';
import { LoggerService } from '../../../core/logger/logger.service';
import { InventoryEventPublisher } from '../events/inventory-event.publisher';
import {
  BagReservedEvent,
  ReservationReleasedEvent,
} from '../events/inventory.events';
import { PaginatedResult } from '../../../common/interfaces/paginated-result.interface';
import { PhysicalBagsRepository } from '../repositories/physical-bags.repository';
import { PhysicalBagReservationsRepository } from '../repositories/physical-bag-reservations.repository';
import { ReservationFactory } from './reservation.factory';
import { ReservationMapper } from './reservation.mapper';
import { ReservationValidator } from './reservation.validator';
import { ReservationResponseDto } from '../dto/reservation-response.dto';
import { ReservationHistoryDto } from '../dto/reservation-history.dto';
import type { ReservationResult } from '../contracts/reservation-result.interface';
import type { CreateReservationCommand } from '../use-cases/create-reservation/commands/create-reservation.command';
import type { ReleaseReservationCommand } from '../use-cases/create-reservation/commands/release-reservation.command';
import type { CancelReservationCommand } from '../use-cases/create-reservation/commands/cancel-reservation.command';
import type { ExpireReservationCommand } from '../use-cases/create-reservation/commands/expire-reservation.command';
import type { GetReservationQuery } from '../use-cases/get-reservation/queries/get-reservation.query';
import type { GetReservationsQuery } from '../use-cases/list-reservations/queries/get-reservations.query';
import type { GetReservationsByBagQuery } from '../use-cases/list-reservations/queries/get-reservations-by-bag.query';
import type { GetReservationsByOrderQuery } from '../use-cases/list-reservations/queries/get-reservations-by-order.query';

@Injectable()
export class ReservationService {
  constructor(
    private readonly reservationsRepo: PhysicalBagReservationsRepository,
    private readonly bagsRepo: PhysicalBagsRepository,
    private readonly factory: ReservationFactory,
    private readonly mapper: ReservationMapper,
    private readonly validator: ReservationValidator,
    private readonly logger: LoggerService,
    private readonly eventPublisher: InventoryEventPublisher,
  ) {}

  async reserve(cmd: CreateReservationCommand): Promise<ReservationResult> {
    await this.validator.validateCreate(cmd);
    const data = this.factory.fromCreate(cmd);
    const reservation = await this.reservationsRepo.create(data);
    await this.bagsRepo.updateBagStatus(cmd.bag_id, BagStatusEnum.RESERVED);
    this.logger.info(
      `Reservation created: id=${reservation.reservation_id}, bag=${cmd.bag_id}, order=${cmd.order_id}`,
    );
    const reserveResult: ReservationResult = {
      success: true,
      reservation: this.mapper.toResponse(reservation),
    };
    this.eventPublisher.emitBagReserved(
      new BagReservedEvent(
        reservation.reservation_id.toString(),
        cmd.bag_id.toString(),
        cmd.order_id.toString(),
        cmd.reserved_dozens,
        cmd.reserved_by.toString(),
        new Date(),
      ),
    );
    return reserveResult;
  }

  async release(cmd: ReleaseReservationCommand): Promise<ReservationResult> {
    const reservation = await this.reservationsRepo.findById(
      cmd.reservation_id,
    );
    if (!reservation) {
      throw new NotFoundException(
        `Reservation ${cmd.reservation_id} not found`,
      );
    }
    this.validator.assertActive(reservation, 'release');
    const updated = await this.reservationsRepo.updateStatus(
      cmd.reservation_id,
      ReservationStatusEnum.RELEASED,
      new Date(),
    );
    const remainingAfterRelease =
      await this.reservationsRepo.sumActiveReservedDozens(reservation.bag_id);
    if (remainingAfterRelease === 0) {
      await this.bagsRepo.updateBagStatus(
        reservation.bag_id,
        BagStatusEnum.RECEIVED,
      );
    }
    this.logger.info(`Reservation released: id=${cmd.reservation_id}`);
    const releaseResult: ReservationResult = {
      success: true,
      reservation: this.mapper.toResponse(updated),
    };
    this.eventPublisher.emitReservationReleased(
      new ReservationReleasedEvent(
        cmd.reservation_id.toString(),
        reservation.bag_id.toString(),
        reservation.order_id.toString(),
        cmd.released_by.toString(),
        new Date(),
      ),
    );
    return releaseResult;
  }

  async cancel(cmd: CancelReservationCommand): Promise<ReservationResult> {
    const reservation = await this.reservationsRepo.findById(
      cmd.reservation_id,
    );
    if (!reservation) {
      throw new NotFoundException(
        `Reservation ${cmd.reservation_id} not found`,
      );
    }
    this.validator.assertActive(reservation, 'cancel');
    const updated = await this.reservationsRepo.updateStatus(
      cmd.reservation_id,
      ReservationStatusEnum.CANCELLED,
    );
    const remainingAfterCancel =
      await this.reservationsRepo.sumActiveReservedDozens(reservation.bag_id);
    if (remainingAfterCancel === 0) {
      await this.bagsRepo.updateBagStatus(
        reservation.bag_id,
        BagStatusEnum.RECEIVED,
      );
    }
    this.logger.info(`Reservation cancelled: id=${cmd.reservation_id}`);
    const cancelResult: ReservationResult = {
      success: true,
      reservation: this.mapper.toResponse(updated),
    };
    this.eventPublisher.emitReservationReleased(
      new ReservationReleasedEvent(
        cmd.reservation_id.toString(),
        reservation.bag_id.toString(),
        reservation.order_id.toString(),
        cmd.cancelled_by.toString(),
        new Date(),
      ),
    );
    return cancelResult;
  }

  async expire(cmd: ExpireReservationCommand): Promise<ReservationResult> {
    const reservation = await this.reservationsRepo.findById(
      cmd.reservation_id,
    );
    if (!reservation) {
      throw new NotFoundException(
        `Reservation ${cmd.reservation_id} not found`,
      );
    }
    this.validator.assertActive(reservation, 'expire');
    // ReservationStatusEnum has no EXPIRED value; expired reservations are set to CANCELLED
    const updated = await this.reservationsRepo.updateStatus(
      cmd.reservation_id,
      ReservationStatusEnum.CANCELLED,
    );
    this.logger.info(`Reservation expired: id=${cmd.reservation_id}`);
    return { success: true, reservation: this.mapper.toResponse(updated) };
  }

  async get(query: GetReservationQuery): Promise<ReservationResponseDto> {
    const reservation = await this.reservationsRepo.findById(
      query.reservation_id,
    );
    if (!reservation) {
      throw new NotFoundException(
        `Reservation ${query.reservation_id} not found`,
      );
    }
    return this.mapper.toResponse(reservation);
  }

  async list(
    query: GetReservationsQuery,
  ): Promise<PaginatedResult<ReservationResponseDto>> {
    const result = await this.reservationsRepo.findAllWithPagination(
      { status: query.status, bag_id: query.bag_id, order_id: query.order_id },
      query.page,
      query.limit,
    );
    return {
      items: this.mapper.toResponseList(result.items),
      meta: result.meta,
    };
  }

  async listByBag(
    query: GetReservationsByBagQuery,
  ): Promise<PaginatedResult<ReservationHistoryDto>> {
    const result = await this.reservationsRepo.findAllByBag(
      query.bag_id,
      query.page,
      query.limit,
    );
    return {
      items: this.mapper.toHistoryList(result.items),
      meta: result.meta,
    };
  }

  async listByOrder(
    query: GetReservationsByOrderQuery,
  ): Promise<PaginatedResult<ReservationHistoryDto>> {
    const result = await this.reservationsRepo.findAllByOrder(
      query.order_id,
      query.page,
      query.limit,
    );
    return {
      items: this.mapper.toHistoryList(result.items),
      meta: result.meta,
    };
  }
}
