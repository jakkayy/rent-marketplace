import { Controller, Get, Patch, Param, Query, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { UpdateShopStatusDto } from './dto/update-shop-status.dto';
import { UpdateProductStatusDto } from './dto/update-product-status.dto';
import { ToggleUserActiveDto } from './dto/toggle-user-active.dto';

@ApiTags('Admin')
@ApiBearerAuth()
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('stats')
  @ApiOperation({ summary: 'ดูสถิติภาพรวมของแพลตฟอร์ม (เฉพาะ ADMIN)' })
  getStats() {
    return this.adminService.getStats();
  }

  @Get('shops')
  @ApiOperation({ summary: 'ดูรายการร้านทั้งหมด (เฉพาะ ADMIN)' })
  @ApiQuery({ name: 'status', required: false, enum: ['PENDING', 'APPROVED', 'SUSPENDED'] })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  listShops(
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.adminService.listShops({
      status,
      page: page ? Number(page) : 1,
      limit: limit ? Math.min(Number(limit), 100) : 20,
    });
  }

  @Patch('shops/:id/status')
  @ApiOperation({ summary: 'เปลี่ยนสถานะร้าน (เฉพาะ ADMIN)' })
  updateShopStatus(@Param('id') id: string, @Body() dto: UpdateShopStatusDto) {
    return this.adminService.updateShopStatus(id, dto.status);
  }

  @Get('users')
  @ApiOperation({ summary: 'ดูรายการ user ทั้งหมด (เฉพาะ ADMIN)' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  listUsers(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.adminService.listUsers({
      page: page ? Number(page) : 1,
      limit: limit ? Math.min(Number(limit), 100) : 20,
    });
  }

  @Patch('users/:id/active')
  @ApiOperation({ summary: 'เปิด/ปิดใช้งาน user (เฉพาะ ADMIN)' })
  toggleUserActive(@Param('id') id: string, @Body() dto: ToggleUserActiveDto) {
    return this.adminService.toggleUserActive(id, dto.isActive);
  }

  @Get('products')
  @ApiOperation({ summary: 'ดูรายการสินค้าทั้งหมด (เฉพาะ ADMIN)' })
  @ApiQuery({ name: 'status', required: false, enum: ['AVAILABLE', 'RESERVED', 'UNAVAILABLE', 'ARCHIVED'] })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  listProducts(
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.adminService.listProducts({
      status,
      page: page ? Number(page) : 1,
      limit: limit ? Math.min(Number(limit), 100) : 20,
    });
  }

  @Patch('products/:id/status')
  @ApiOperation({ summary: 'เปลี่ยนสถานะสินค้า (เฉพาะ ADMIN)' })
  updateProductStatus(@Param('id') id: string, @Body() dto: UpdateProductStatusDto) {
    return this.adminService.updateProductStatus(id, dto.status);
  }

  @Get('rentals')
  @ApiOperation({ summary: 'ดูรายการเช่าทั้งหมด (เฉพาะ ADMIN)' })
  @ApiQuery({ name: 'status', required: false, enum: ['PENDING', 'CONFIRMED', 'REJECTED', 'ACTIVE', 'COMPLETED', 'CANCELLED'] })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  listRentals(
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.adminService.listRentals({
      status,
      page: page ? Number(page) : 1,
      limit: limit ? Math.min(Number(limit), 100) : 20,
    });
  }
}
