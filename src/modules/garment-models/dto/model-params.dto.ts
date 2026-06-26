import { Type } from 'class-transformer';
import { IsInt, Min } from 'class-validator';

export class ModelIdParamDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  id!: number;
}

export class ModelPartParamDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  id!: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  partId!: number;
}

export class ModelColorParamDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  id!: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  colorId!: number;
}

export class ModelSizeParamDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  id!: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  sizeId!: number;
}
