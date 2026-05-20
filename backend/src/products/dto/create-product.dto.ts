import {
  IsString,
  IsOptional,
  IsNotEmpty,
  IsNumber,
  IsArray,
  IsIn,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  images?: string[];

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Type(() => Number)
  pricePerDay!: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Type(() => Number)
  deposit?: number;

  @IsOptional()
  @IsString()
  brand?: string;

  @IsOptional()
  @IsString()
  size?: string;

  @IsOptional()
  @IsString()
  color?: string;

  @IsOptional()
  @IsString()
  occasion?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @IsOptional()
  @IsString()
  condition?: string;

  @IsOptional()
  @IsIn(['AVAILABLE', 'RESERVED', 'UNAVAILABLE', 'ARCHIVED'])
  status?: string;

  @IsString()
  @IsNotEmpty()
  categoryId!: string;
}
