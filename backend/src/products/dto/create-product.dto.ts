import {
  IsString,
  IsOptional,
  IsNotEmpty,
  IsNumber,
  IsArray,
  IsIn,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateProductDto {
  @ApiProperty({ example: 'ชุดราตรีสีทอง' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiPropertyOptional({ example: 'ชุดราตรีแขนกุด ทรง A-line เหมาะสำหรับงานแต่งงาน' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ type: [String], example: ['https://...'] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  images?: string[];

  @ApiProperty({ example: 500 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Type(() => Number)
  pricePerDay!: number;

  @ApiPropertyOptional({ example: 2000 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Type(() => Number)
  deposit?: number;

  @ApiPropertyOptional({ example: 'Zara' })
  @IsOptional()
  @IsString()
  brand?: string;

  @ApiPropertyOptional({ example: 'S' })
  @IsOptional()
  @IsString()
  size?: string;

  @ApiPropertyOptional({ example: 'ทอง' })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiPropertyOptional({ example: 'งานแต่งงาน' })
  @IsOptional()
  @IsString()
  occasion?: string;

  @ApiPropertyOptional({ type: [String], example: ['ราตรี', 'งานแต่ง'] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @ApiPropertyOptional({ example: 'ดีมาก' })
  @IsOptional()
  @IsString()
  condition?: string;

  @ApiPropertyOptional({ enum: ['AVAILABLE', 'RESERVED', 'UNAVAILABLE', 'ARCHIVED'] })
  @IsOptional()
  @IsIn(['AVAILABLE', 'RESERVED', 'UNAVAILABLE', 'ARCHIVED'])
  status?: string;

  @ApiProperty({ example: 'clxxxxx' })
  @IsString()
  @IsNotEmpty()
  categoryId!: string;
}
