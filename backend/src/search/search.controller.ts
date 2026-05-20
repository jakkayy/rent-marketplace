import { Controller, Post, UseGuards } from '@nestjs/common';
import { SearchService } from './search.service';
import { PrismaService } from '../database/prisma.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('search')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class SearchController {
  constructor(
    private searchService: SearchService,
    private prisma: PrismaService,
  ) {}

  @Post('reindex')
  async reindex() {
    const products = await this.prisma.product.findMany({
      include: { shop: true },
    });

    const docs = products.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description ?? null,
      brand: p.brand ?? null,
      occasion: p.occasion ?? null,
      color: p.color ?? null,
      size: p.size ?? null,
      tags: p.tags ?? [],
      pricePerDay: Number(p.pricePerDay),
      categoryId: p.categoryId ?? null,
      shopId: p.shopId,
      shopName: p.shop?.name ?? '',
      status: p.status,
    }));

    await this.searchService.bulkUpsert(docs);
    return { message: `Reindexed ${docs.length} products` };
  }
}
