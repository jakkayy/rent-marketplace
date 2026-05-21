import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { RentalsService } from './rentals.service';
import { CreateRentalDto } from './dto/create-rental.dto';
import { UpdateRentalStatusDto } from './dto/update-rental-status.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Rentals')
@ApiBearerAuth()
@ApiResponse({ status: 401, description: 'ไม่ได้ login หรือ token หมดอายุ' })
@Controller('rentals')
export class RentalsController {
  constructor(private readonly rentalsService: RentalsService) {}

  @Get('my')
  @ApiOperation({ summary: 'ดูรายการเช่าของฉัน (ฝั่ง BUYER)' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  @ApiResponse({ status: 200, description: '{ data, total, page, limit, totalPages }' })
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
  @ApiOperation({ summary: 'ดูรายการเช่าที่เข้ามาในร้าน (ฝั่ง SELLER)' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  @ApiResponse({ status: 200, description: '{ data, total, page, limit, totalPages }' })
  @ApiResponse({ status: 403, description: 'ยังไม่มีร้าน' })
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

  @Post()
  @ApiOperation({ summary: 'สร้างคำขอเช่าสินค้า' })
  @ApiResponse({ status: 201, description: 'สร้างคำขอเช่าสำเร็จ สถานะ PENDING' })
  @ApiResponse({ status: 409, description: 'วันที่เลือกมีการจองอยู่แล้ว' })
  @ApiResponse({ status: 400, description: 'วันที่ไม่ถูกต้อง (end ต้องหลัง start)' })
  @ApiResponse({ status: 404, description: 'ไม่พบสินค้า' })
  @UseGuards(JwtAuthGuard)
  async create(@CurrentUser() user: { userId: string }, @Body() dto: CreateRentalDto) {
    return this.rentalsService.create(user.userId, dto);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'อัปเดตสถานะการเช่า (SELLER เท่านั้น)' })
  @ApiResponse({ status: 200, description: 'สถานะที่อัปเดตแล้ว' })
  @ApiResponse({ status: 400, description: 'เปลี่ยนสถานะนี้ไม่ได้ เช่น COMPLETED → PENDING' })
  @ApiResponse({ status: 403, description: 'ไม่ใช่เจ้าของร้านที่รับออเดอร์นี้' })
  @UseGuards(JwtAuthGuard)
  async updateStatus(@CurrentUser() user: { userId: string }, @Param('id') id: string, @Body() dto: UpdateRentalStatusDto) {
    return this.rentalsService.updateStatus(user.userId, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'ยกเลิกการเช่า (BUYER — ยกเลิกได้เฉพาะสถานะ PENDING หรือ CONFIRMED)' })
  @ApiResponse({ status: 200, description: 'ยกเลิกสำเร็จ วันที่ถูก unblock อัตโนมัติ' })
  @ApiResponse({ status: 400, description: 'ไม่สามารถยกเลิกสถานะ ACTIVE หรือ COMPLETED' })
  @ApiResponse({ status: 403, description: 'ไม่ใช่การเช่าของตัวเอง' })
  @UseGuards(JwtAuthGuard)
  async cancel(@CurrentUser() user: { userId: string }, @Param('id') id: string) {
    return this.rentalsService.cancelRental(user.userId, id);
  }
}
