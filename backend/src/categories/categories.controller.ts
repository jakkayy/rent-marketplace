import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { CategoriesService } from './categories.service';

@ApiTags('Categories')
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  @ApiOperation({ summary: 'ดูหมวดหมู่ทั้งหมดที่เปิดใช้งาน' })
  async findAll() {
    return this.categoriesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'ดูหมวดหมู่ตาม ID' })
  async findOne(@Param('id') id: string) {
    return this.categoriesService.findOne(id);
  }
}
