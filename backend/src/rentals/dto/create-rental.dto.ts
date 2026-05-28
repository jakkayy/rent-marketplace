import {
  IsDateString,
  IsString,
  IsOptional,
  IsNotEmpty,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateRentalDto {
  @ApiProperty({ example: 'clxxxxx' })
  @IsString()
  @IsNotEmpty()
  productId!: string;

  @ApiProperty({ example: '2026-06-01' })
  @IsDateString()
  startDate!: string;

  @ApiProperty({ example: '2026-06-03' })
  @IsDateString()
  endDate!: string;

  @ApiPropertyOptional({ example: 'ต้องการชุดไซส์ M' })
  @IsOptional()
  @IsString()
  notes?: string;
}
