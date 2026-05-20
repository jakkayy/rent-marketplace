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
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { SetAvailabilityDto } from './dto/availability.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(
    @CurrentUser() user: { userId: string },
    @Body() dto: CreateProductDto,
  ) {
    return this.productsService.create(user.userId, dto);
  }

  @Get()
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
  async findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  @Get(':id/availability')
  async getAvailability(
    @Param('id') id: string,
    @Query('month') month?: string,
  ) {
    return this.productsService.getAvailability(id, month);
  }

  @Post(':id/availability')
  @UseGuards(JwtAuthGuard)
  async setAvailability(
    @CurrentUser() user: { userId: string },
    @Param('id') id: string,
    @Body() dto: SetAvailabilityDto[],
  ) {
    return this.productsService.setAvailability(user.userId, id, dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async update(
    @CurrentUser() user: { userId: string },
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
  ) {
    return this.productsService.update(user.userId, id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async remove(
    @CurrentUser() user: { userId: string },
    @Param('id') id: string,
  ) {
    return this.productsService.remove(user.userId, id);
  }
}
