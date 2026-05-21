import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { ShopsService } from './shops.service';
import { CreateShopDto } from './dto/create-shop.dto';
import { UpdateShopDto } from './dto/update-shop.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Shops')
@Controller('shops')
export class ShopsController {
  constructor(private readonly shopsService: ShopsService) {}

  @Get()
  @ApiOperation({ summary: 'ดูรายการร้านทั้งหมด พร้อมกรองและแบ่งหน้า' })
  @ApiQuery({ name: 'district', required: false, description: 'กรองตามเขต/อำเภอ' })
  @ApiQuery({ name: 'q', required: false, description: 'ค้นหาจากชื่อร้าน' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  @ApiResponse({ status: 200, description: '{ data, total, page, limit, totalPages }' })
  async findAll(
    @Query('district') district?: string,
    @Query('q') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.shopsService.findAll({
      district,
      search,
      page: page ? Number(page) : 1,
      limit: limit ? Math.min(Number(limit), 100) : 20,
    });
  }

  @Get('my')
  @ApiOperation({ summary: 'ดูร้านของตัวเอง' })
  @ApiResponse({ status: 200, description: 'ข้อมูลร้าน' })
  @ApiResponse({ status: 404, description: 'ยังไม่มีร้าน' })
  @ApiResponse({ status: 401, description: 'ไม่ได้ login' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async findMyShop(
    @CurrentUser() user: { userId: string; email: string; role: string },
  ) {
    return this.shopsService.findMyShop(user.userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'ดูข้อมูลร้านตาม ID' })
  @ApiResponse({ status: 200, description: 'ข้อมูลร้าน พร้อมสินค้าล่าสุด' })
  @ApiResponse({ status: 404, description: 'ไม่พบร้าน' })
  async findOne(@Param('id') id: string) {
    return this.shopsService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'สร้างร้าน (เฉพาะ SELLER — สร้างได้ร้านเดียว)' })
  @ApiResponse({ status: 201, description: 'สร้างร้านสำเร็จ' })
  @ApiResponse({ status: 403, description: 'ไม่ใช่ SELLER หรือมีร้านอยู่แล้ว' })
  @ApiResponse({ status: 401, description: 'ไม่ได้ login' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async create(
    @CurrentUser() user: { userId: string; email: string; role: string },
    @Body() dto: CreateShopDto,
  ) {
    return this.shopsService.create(user.userId, user.role as any, dto);
  }

  @Patch('my')
  @ApiOperation({ summary: 'แก้ไขข้อมูลร้านของตัวเอง' })
  @ApiResponse({ status: 200, description: 'ข้อมูลร้านที่อัปเดตแล้ว' })
  @ApiResponse({ status: 404, description: 'ยังไม่มีร้าน' })
  @ApiResponse({ status: 401, description: 'ไม่ได้ login' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async update(
    @CurrentUser() user: { userId: string; email: string; role: string },
    @Body() dto: UpdateShopDto,
  ) {
    return this.shopsService.update(user.userId, dto);
  }

  @Delete('my')
  @ApiOperation({ summary: 'ลบร้านของตัวเอง' })
  @ApiResponse({ status: 200, description: 'ลบร้านสำเร็จ' })
  @ApiResponse({ status: 401, description: 'ไม่ได้ login' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async remove(
    @CurrentUser() user: { userId: string; email: string; role: string },
  ) {
    return this.shopsService.remove(user.userId);
  }
}
