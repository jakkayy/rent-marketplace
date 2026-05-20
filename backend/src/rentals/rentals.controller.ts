import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
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
  async findMyRentals(
    @CurrentUser() user: { userId: string },
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.rentalsService.findMyRentals(user.userId, {
      page: page ? Number(page) : 1,
      limit: limit ? Math.min(Number(limit), 100) : 20,
    });
  }

  @Get('shop')
  @UseGuards(JwtAuthGuard)
  async findShopRentals(
    @CurrentUser() user: { userId: string },
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.rentalsService.findShopRentals(user.userId, {
      page: page ? Number(page) : 1,
      limit: limit ? Math.min(Number(limit), 100) : 20,
    });
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
