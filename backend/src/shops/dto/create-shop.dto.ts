import { IsString, IsOptional, IsNotEmpty } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateShopDto {
  @ApiProperty({ example: 'Dress By Nina' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiPropertyOptional({ example: 'ร้านเช่าชุดราตรีและชุดแต่งงานในกรุงเทพ' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'https://...' })
  @IsOptional()
  @IsString()
  logo?: string;

  @ApiPropertyOptional({ example: 'https://...' })
  @IsOptional()
  @IsString()
  banner?: string;

  @ApiPropertyOptional({ example: '123 ถนนสีลม' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ example: 'สาทร' })
  @IsOptional()
  @IsString()
  district?: string;

  @ApiPropertyOptional({ example: '0812345678' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: 'dressbynina' })
  @IsOptional()
  @IsString()
  lineId?: string;

  @ApiPropertyOptional({ example: 'dressbynina' })
  @IsOptional()
  @IsString()
  instagram?: string;

  @ApiPropertyOptional({ example: 'https://...' })
  @IsOptional()
  @IsString()
  qrCodeUrl?: string;

  @ApiPropertyOptional({ example: 'จ-ส 10:00-20:00' })
  @IsOptional()
  @IsString()
  openingHours?: string;
}
