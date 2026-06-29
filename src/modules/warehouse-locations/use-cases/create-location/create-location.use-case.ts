import { Injectable } from '@nestjs/common';
import { WarehouseLocationService } from '../../services/warehouse-location.service';
import type {
  CreateWarehouseLocationDto,
  LocationResponseDto,
} from '../../dto/warehouse-location.dto';

@Injectable()
export class CreateWarehouseLocationUseCase {
  constructor(private readonly service: WarehouseLocationService) {}

  execute(dto: CreateWarehouseLocationDto): Promise<LocationResponseDto> {
    return this.service.createLocation(dto);
  }
}
