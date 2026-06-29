import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from '../../authorization/decorators/roles.decorator';
import { SystemRoles } from '../../../core/constants/system-roles.constants';
import {
  CreateWarehouseLocationDto,
  LocationFilterDto,
  LocationResponseDto,
  UpdateLocationStatusDto,
  ValidateLocationQueryDto,
  WarehouseHierarchyDto,
} from '../dto/warehouse-location.dto';
import { CreateWarehouseLocationUseCase } from '../use-cases/create-location/create-location.use-case';
import { GetWarehouseLocationUseCase } from '../use-cases/get-location/get-location.use-case';
import { ListWarehouseLocationsUseCase } from '../use-cases/list-locations/list-locations.use-case';
import { UpdateLocationStatusUseCase } from '../use-cases/update-location-status/update-location-status.use-case';
import { GetWarehouseHierarchyUseCase } from '../use-cases/get-warehouse-hierarchy/get-warehouse-hierarchy.use-case';
import { ValidateLocationUseCase } from '../use-cases/validate-location/validate-location.use-case';
import type { ValidationResult } from '../use-cases/validate-location/validate-location.use-case';

@ApiBearerAuth('JWT')
@ApiTags('Warehouse Locations')
@Roles(
  SystemRoles.SYSTEM_ADMIN,
  SystemRoles.ADMIN,
  SystemRoles.MANAGER,
  SystemRoles.SUPERVISOR,
  SystemRoles.STAFF,
)
@Controller({ path: 'warehouse-locations', version: '1' })
export class WarehouseLocationsController {
  constructor(
    private readonly createUseCase: CreateWarehouseLocationUseCase,
    private readonly getUseCase: GetWarehouseLocationUseCase,
    private readonly listUseCase: ListWarehouseLocationsUseCase,
    private readonly updateStatusUseCase: UpdateLocationStatusUseCase,
    private readonly hierarchyUseCase: GetWarehouseHierarchyUseCase,
    private readonly validateUseCase: ValidateLocationUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles(SystemRoles.SYSTEM_ADMIN, SystemRoles.ADMIN, SystemRoles.MANAGER)
  @ApiOperation({
    summary: 'Create a new warehouse location (zone/rack/shelf/bin)',
  })
  @ApiResponse({
    status: 201,
    description: 'Location created',
    type: LocationResponseDto,
  })
  create(
    @Body() dto: CreateWarehouseLocationDto,
  ): Promise<LocationResponseDto> {
    return this.createUseCase.execute(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List warehouse locations with optional filters' })
  @ApiResponse({
    status: 200,
    description: 'Location list',
    type: [LocationResponseDto],
  })
  list(@Query() filter: LocationFilterDto): Promise<LocationResponseDto[]> {
    return this.listUseCase.execute(filter);
  }

  @Get('warehouse/:warehouseId/hierarchy')
  @ApiOperation({
    summary: 'Get zone/rack/shelf/bin hierarchy for a warehouse',
  })
  @ApiParam({ name: 'warehouseId', description: 'Warehouse ID' })
  @ApiResponse({
    status: 200,
    description: 'Warehouse location hierarchy',
    type: WarehouseHierarchyDto,
  })
  hierarchy(
    @Param('warehouseId') warehouseId: string,
  ): Promise<WarehouseHierarchyDto> {
    return this.hierarchyUseCase.execute(warehouseId);
  }

  @Get(':locationId')
  @ApiOperation({ summary: 'Get a single warehouse location by ID' })
  @ApiParam({ name: 'locationId', description: 'Location ID' })
  @ApiResponse({
    status: 200,
    description: 'Location details',
    type: LocationResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Location not found' })
  getOne(
    @Param('locationId') locationId: string,
  ): Promise<LocationResponseDto> {
    return this.getUseCase.execute(locationId);
  }

  @Get(':locationId/validate')
  @ApiOperation({
    summary: 'Validate that a location is active and has sufficient capacity',
  })
  @ApiParam({ name: 'locationId', description: 'Location ID' })
  @ApiResponse({ status: 200, description: 'Validation result' })
  validate(
    @Param('locationId') locationId: string,
    @Query('warehouse_id') warehouseId: string,
    @Query() query: ValidateLocationQueryDto,
  ): Promise<ValidationResult> {
    return this.validateUseCase.execute(
      locationId,
      warehouseId ?? null,
      query.required_dozens,
    );
  }

  @Patch(':locationId/status')
  @Roles(SystemRoles.SYSTEM_ADMIN, SystemRoles.ADMIN, SystemRoles.MANAGER)
  @ApiOperation({ summary: 'Activate or deactivate a warehouse location' })
  @ApiParam({ name: 'locationId', description: 'Location ID' })
  @ApiResponse({
    status: 200,
    description: 'Updated location',
    type: LocationResponseDto,
  })
  updateStatus(
    @Param('locationId') locationId: string,
    @Body() dto: UpdateLocationStatusDto,
  ): Promise<LocationResponseDto> {
    return this.updateStatusUseCase.execute(locationId, dto.is_active);
  }
}
