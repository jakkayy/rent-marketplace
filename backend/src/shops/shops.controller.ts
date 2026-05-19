import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ShopsService } from './shops.service';
import { CreateShopDto } from './dto/create-shop.dto';
import { UpdateShopDto } from './dto/update-shop.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('shops')
export class ShopsController {
  constructor(private readonly shopsService: ShopsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(
    @CurrentUser() user: { userId: string; email: string; role: string },
    @Body() dto: CreateShopDto,
  ) {
    return this.shopsService.create(user.userId, user.role as any, dto);
  }

  @Get()
  async findAll() {
    return this.shopsService.findAll();
  }

  @Get('my')
  @UseGuards(JwtAuthGuard)
  async findMyShop(
    @CurrentUser() user: { userId: string; email: string; role: string },
  ) {
    return this.shopsService.findMyShop(user.userId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.shopsService.findOne(id);
  }

  @Patch('my')
  @UseGuards(JwtAuthGuard)
  async update(
    @CurrentUser() user: { userId: string; email: string; role: string },
    @Body() dto: UpdateShopDto,
  ) {
    return this.shopsService.update(user.userId, dto);
  }

  @Delete('my')
  @UseGuards(JwtAuthGuard)
  async remove(
    @CurrentUser() user: { userId: string; email: string; role: string },
  ) {
    return this.shopsService.remove(user.userId);
  }
}
