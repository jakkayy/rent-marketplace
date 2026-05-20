import { IsDateString, IsString, IsOptional, IsUUID } from 'class-validator';

export class CreateRentalDto {
  @IsUUID()
  productId!: string;

  @IsDateString()
  startDate!: string;

  @IsDateString()
  endDate!: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
