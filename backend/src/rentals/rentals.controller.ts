import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { RentalsService } from './rentals.service';
import { CreateRentalDto } from './dto/create-rental.dto';
import { UpdateRentalStatusDto } from './dto/update-rental-status.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('rentals')
export class RentalsController {
  constructor(private readonly rentalsService: RentalsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@CurrentUser() user: { userId: string }, @Body() dto: CreateRentalDto) {
    return this.rentalsService.create(user.userId, dto);
  }

  @Get('my')
  @UseGuards(JwtAuthGuard)
  async findMyRentals(@CurrentUser() user: { userId: string }) {
    return this.rentalsService.findMyRentals(user.userId);
  }

  @Get('shop')
  @UseGuards(JwtAuthGuard)
  async findShopRentals(@CurrentUser() user: { userId: string }) {
    return this.rentalsService.findShopRentals(user.userId);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard)
  async updateStatus(@CurrentUser() user: { userId: string }, @Param('id') id: string, @Body() dto: UpdateRentalStatusDto) {
    return this.rentalsService.updateStatus(user.userId, id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async cancel(@CurrentUser() user: { userId: string }, @Param('id') id: string) {
    return this.rentalsService.cancelRental(user.userId, id);
  }
}
