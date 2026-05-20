import {
  Controller,
  Get,
  Patch,
  Param,
  Query,
  Body,
  UseGuards,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole, ShopStatus, ProductStatus } from '@prisma/client';
import { IsEnum, IsBoolean } from 'class-validator';

class UpdateShopStatusDto {
  @IsEnum(ShopStatus)
  status!: ShopStatus;
}

class UpdateProductStatusDto {
  @IsEnum(ProductStatus)
  status!: ProductStatus;
}

class ToggleUserActiveDto {
  @IsBoolean()
  isActive!: boolean;
}

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // ─── Stats ───────────────────────────────────────────────────────────────

  @Get('stats')
  getStats() {
    return this.adminService.getStats();
  }

  // ─── Shops ───────────────────────────────────────────────────────────────

  @Get('shops')
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
  updateShopStatus(@Param('id') id: string, @Body() dto: UpdateShopStatusDto) {
    return this.adminService.updateShopStatus(id, dto.status);
  }

  // ─── Users ───────────────────────────────────────────────────────────────

  @Get('users')
  listUsers(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.adminService.listUsers({
      page: page ? Number(page) : 1,
      limit: limit ? Math.min(Number(limit), 100) : 20,
    });
  }

  @Patch('users/:id/active')
  toggleUserActive(@Param('id') id: string, @Body() dto: ToggleUserActiveDto) {
    return this.adminService.toggleUserActive(id, dto.isActive);
  }

  // ─── Products ────────────────────────────────────────────────────────────

  @Get('products')
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
  updateProductStatus(@Param('id') id: string, @Body() dto: UpdateProductStatusDto) {
    return this.adminService.updateProductStatus(id, dto.status);
  }

  // ─── Rentals ─────────────────────────────────────────────────────────────

  @Get('rentals')
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
