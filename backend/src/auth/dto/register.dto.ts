import {
  IsEmail,
  IsString,
  MinLength,
  IsOptional,
  IsIn,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';

export class RegisterDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'password123', minLength: 8 })
  @IsString()
  @MinLength(8)
  password!: string;

  @ApiProperty({ example: 'สมชาย' })
  @IsString()
  firstName!: string;

  @ApiProperty({ example: 'ใจดี' })
  @IsString()
  lastName!: string;

  @ApiPropertyOptional({ example: '0812345678' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: 'somchai_line' })
  @IsOptional()
  @IsString()
  lineId?: string;

  @ApiProperty({ enum: [UserRole.BUYER, UserRole.SELLER] })
  @IsIn([UserRole.BUYER, UserRole.SELLER])
  role!: UserRole;
}
