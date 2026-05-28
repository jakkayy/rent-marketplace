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
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
  ApiResponse,
} from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { SetAvailabilityDto } from './dto/availability.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  @ApiOperation({ summary: 'ดูรายการสินค้าทั้งหมด พร้อมกรองและค้นหา' })
  @ApiQuery({
    name: 'categoryId',
    required: false,
    description: 'กรองตามหมวดหมู่',
  })
  @ApiQuery({ name: 'shopId', required: false, description: 'กรองตามร้าน' })
  @ApiQuery({ name: 'q', required: false, description: 'ค้นหาแบบ full-text' })
  @ApiQuery({ name: 'brand', required: false, description: 'กรองตามแบรนด์' })
  @ApiQuery({ name: 'size', required: false, description: 'กรองตามไซส์' })
  @ApiQuery({ name: 'color', required: false, description: 'กรองตามสี' })
  @ApiQuery({
    name: 'occasion',
    required: false,
    description: 'กรองตามโอกาส เช่น งานแต่งงาน',
  })
  @ApiQuery({
    name: 'priceMin',
    required: false,
    description: 'ราคาต่อวันขั้นต่ำ',
  })
  @ApiQuery({
    name: 'priceMax',
    required: false,
    description: 'ราคาต่อวันสูงสุด',
  })
  @ApiQuery({
    name: 'sort',
    required: false,
    enum: ['priceAsc', 'priceDesc', 'popular', 'newest'],
  })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  @ApiResponse({
    status: 200,
    description: '{ data, total, page, limit, totalPages }',
  })
  async findAll(
    @Query('categoryId') categoryId?: string,
    @Query('shopId') shopId?: string,
    @Query('q') search?: string,
    @Query('brand') brand?: string,
    @Query('size') size?: string,
    @Query('color') color?: string,
    @Query('occasion') occasion?: string,
    @Query('priceMin') priceMin?: string,
    @Query('priceMax') priceMax?: string,
    @Query('sort') sort?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.productsService.findAll({
      categoryId,
      shopId,
      search,
      brand,
      size,
      color,
      occasion,
      priceMin: priceMin ? Number(priceMin) : undefined,
      priceMax: priceMax ? Number(priceMax) : undefined,
      sort,
      page: page ? Number(page) : 1,
      limit: limit ? Math.min(Number(limit), 100) : 20,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'ดูข้อมูลสินค้าตาม ID (รวมข้อมูลร้านและรีวิว)' })
  @ApiResponse({
    status: 200,
    description: 'ข้อมูลสินค้า พร้อม shop info, reviews',
  })
  @ApiResponse({ status: 404, description: 'ไม่พบสินค้า' })
  async findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  @Get(':id/availability')
  @ApiOperation({ summary: 'ดูตารางวันว่างของสินค้า' })
  @ApiQuery({
    name: 'month',
    required: false,
    description: 'รูปแบบ YYYY-MM เช่น 2026-06',
  })
  @ApiResponse({ status: 200, description: 'รายการวันที่พร้อม isBooked flag' })
  @ApiResponse({ status: 404, description: 'ไม่พบสินค้า' })
  async getAvailability(
    @Param('id') id: string,
    @Query('month') month?: string,
  ) {
    return this.productsService.getAvailability(id, month);
  }

  @Post(':id/contact')
  @ApiOperation({ summary: 'บันทึกการกดติดต่อ LINE และรับ lineId ของร้าน' })
  @ApiQuery({
    name: 'source',
    required: false,
    description: 'แหล่งที่มา เช่น product_detail, search',
  })
  @ApiResponse({
    status: 201,
    description: '{ lineId } — นำไปสร้าง line://ti/p/<lineId>',
  })
  @ApiResponse({ status: 404, description: 'ไม่พบสินค้า' })
  @UseGuards(OptionalJwtAuthGuard)
  async trackContact(
    @Param('id') id: string,
    @Query('source') source?: string,
    @CurrentUser() user?: { userId: string } | null,
  ) {
    return this.productsService.trackContact(id, user?.userId ?? null, source);
  }

  @Post()
  @ApiOperation({ summary: 'เพิ่มสินค้าใหม่ (เฉพาะ SELLER)' })
  @ApiResponse({ status: 201, description: 'สินค้าที่สร้างแล้ว' })
  @ApiResponse({ status: 403, description: 'ยังไม่มีร้าน' })
  @ApiResponse({ status: 401, description: 'ไม่ได้ login' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async create(
    @CurrentUser() user: { userId: string },
    @Body() dto: CreateProductDto,
  ) {
    return this.productsService.create(user.userId, dto);
  }

  @Post(':id/availability')
  @ApiOperation({
    summary: 'ตั้งค่าวันว่างของสินค้า (เฉพาะ SELLER เจ้าของสินค้า)',
  })
  @ApiResponse({ status: 201, description: 'บันทึกวันว่างสำเร็จ' })
  @ApiResponse({ status: 403, description: 'ไม่ใช่เจ้าของสินค้า' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async setAvailability(
    @CurrentUser() user: { userId: string },
    @Param('id') id: string,
    @Body() dto: SetAvailabilityDto[],
  ) {
    return this.productsService.setAvailability(user.userId, id, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'แก้ไขข้อมูลสินค้า (เฉพาะเจ้าของ)' })
  @ApiResponse({ status: 200, description: 'สินค้าที่อัปเดตแล้ว' })
  @ApiResponse({ status: 403, description: 'ไม่ใช่เจ้าของสินค้า' })
  @ApiResponse({ status: 404, description: 'ไม่พบสินค้า' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async update(
    @CurrentUser() user: { userId: string },
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
  ) {
    return this.productsService.update(user.userId, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'ลบสินค้า (เฉพาะเจ้าของ)' })
  @ApiResponse({ status: 200, description: 'ลบสินค้าสำเร็จ' })
  @ApiResponse({ status: 403, description: 'ไม่ใช่เจ้าของสินค้า' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async remove(
    @CurrentUser() user: { userId: string },
    @Param('id') id: string,
  ) {
    return this.productsService.remove(user.userId, id);
  }
}
