import {
  Controller,
  Get,
  Patch,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Users')
@ApiBearerAuth()
@ApiResponse({ status: 401, description: 'ไม่ได้ login หรือ token หมดอายุ' })
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'ดูข้อมูลโปรไฟล์ของตัวเอง' })
  @ApiResponse({ status: 200, description: 'ข้อมูล user (ไม่รวม password)' })
  @UseGuards(JwtAuthGuard)
  async getMe(@CurrentUser() user: { userId: string }) {
    const found = await this.usersService.findByIdOrThrow(user.userId);
    const { password, ...result } = found;
    return result;
  }

  @Patch('me')
  @ApiOperation({ summary: 'แก้ไขโปรไฟล์ของตัวเอง' })
  @ApiResponse({ status: 200, description: 'ข้อมูล user ที่อัปเดตแล้ว' })
  @UseGuards(JwtAuthGuard)
  async updateMe(
    @CurrentUser() user: { userId: string },
    @Body() dto: UpdateProfileDto,
  ) {
    return this.usersService.updateProfile(user.userId, dto);
  }

  @Get('me/favorites')
  @ApiOperation({ summary: 'ดูรายการสินค้าที่บันทึกไว้' })
  @ApiResponse({ status: 200, description: 'รายการสินค้าโปรด' })
  @UseGuards(JwtAuthGuard)
  async getFavorites(@CurrentUser() user: { userId: string }) {
    return this.usersService.getFavorites(user.userId);
  }

  @Post('me/favorites/:productId')
  @ApiOperation({ summary: 'เพิ่มสินค้าในรายการโปรด' })
  @ApiResponse({ status: 201, description: 'เพิ่มสำเร็จ' })
  @ApiResponse({ status: 409, description: 'มีสินค้านี้ในรายการโปรดแล้ว' })
  @UseGuards(JwtAuthGuard)
  async addFavorite(
    @CurrentUser() user: { userId: string },
    @Param('productId') productId: string,
  ) {
    return this.usersService.addFavorite(user.userId, productId);
  }

  @Delete('me/favorites/:productId')
  @ApiOperation({ summary: 'ลบสินค้าออกจากรายการโปรด' })
  @ApiResponse({ status: 200, description: 'ลบสำเร็จ' })
  @UseGuards(JwtAuthGuard)
  async removeFavorite(
    @CurrentUser() user: { userId: string },
    @Param('productId') productId: string,
  ) {
    return this.usersService.removeFavorite(user.userId, productId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'ดูข้อมูล user ตาม ID (เฉพาะโปรไฟล์ตัวเองหรือ ADMIN)' })
  @ApiResponse({ status: 200, description: 'ข้อมูล user' })
  @ApiResponse({ status: 403, description: 'ไม่มีสิทธิ์ดูข้อมูล user คนอื่น' })
  @ApiResponse({ status: 404, description: 'ไม่พบ user' })
  @UseGuards(JwtAuthGuard)
  async findOne(
    @Param('id') id: string,
    @CurrentUser() requester: { userId: string; role: UserRole },
  ) {
    if (requester.userId !== id && requester.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Access denied');
    }
    const user = await this.usersService.findByIdOrThrow(id);
    const { password, ...result } = user;
    return result;
  }
}
