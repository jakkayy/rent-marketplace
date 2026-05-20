import { IsDateString, IsString, IsOptional, IsNotEmpty } from 'class-validator';

export class CreateRentalDto {
  @IsString()
  @IsNotEmpty()
  productId!: string;

  @IsDateString()
  startDate!: string;

  @IsDateString()
  endDate!: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
