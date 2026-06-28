import { Injectable, NotFoundException } from '@nestjs/common';
import { ReservationStatusEnum } from '@prisma/client';
import { LoggerService } from '../../../core/logger/logger.service';
import { PaginatedResult } from '../../../common/interfaces/paginated-result.interface';
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
    private readonly factory: ReservationFactory,
    private readonly mapper: ReservationMapper,
    private readonly validator: ReservationValidator,
    private readonly logger: LoggerService,
  ) {}

  async reserve(cmd: CreateReservationCommand): Promise<ReservationResult> {
    await this.validator.validateCreate(cmd);
    const data = this.factory.fromCreate(cmd);
    const reservation = await this.reservationsRepo.create(data);
    this.logger.info(
      `Reservation created: id=${reservation.reservation_id}, bag=${cmd.bag_id}, order=${cmd.order_id}`,
    );
    return { success: true, reservation: this.mapper.toResponse(reservation) };
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
    this.logger.info(`Reservation released: id=${cmd.reservation_id}`);
    return { success: true, reservation: this.mapper.toResponse(updated) };
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
    this.logger.info(`Reservation cancelled: id=${cmd.reservation_id}`);
    return { success: true, reservation: this.mapper.toResponse(updated) };
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
