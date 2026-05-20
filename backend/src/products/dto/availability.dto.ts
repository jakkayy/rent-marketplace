import { IsDateString, IsBoolean, IsOptional } from 'class-validator';

export class SetAvailabilityDto {
  @IsDateString()
  date!: string;

  @IsOptional()
  @IsBoolean()
  isBooked?: boolean;
}
