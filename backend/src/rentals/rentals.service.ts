import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateRentalDto } from './dto/create-rental.dto';
import { UpdateRentalStatusDto } from './dto/update-rental-status.dto';
import { RentalStatus } from '@prisma/client';

@Injectable()
export class RentalsService {
  constructor(private prisma: PrismaService) {}

  async create(renterId: string, dto: CreateRentalDto) {
    const product = await this.prisma.product.findUnique({
      where: { id: dto.productId },
      include: { shop: true },
    });
    if (!product) throw new NotFoundException('Product not found');

    const start = new Date(dto.startDate);
    const end = new Date(dto.endDate);
    if (start >= end) throw new BadRequestException('End date must be after start date');

    const totalDays =
      Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const totalPrice = Number(product.pricePerDay) * totalDays;

    const dates: Date[] = [];
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      dates.push(new Date(d));
    }

    // Wrap availability check + rental creation in a transaction to prevent double booking
    return this.prisma.$transaction(async (tx) => {
      const blocked = await tx.availability.findMany({
        where: { productId: dto.productId, date: { gte: start, lte: end }, isBooked: true },
      });
      if (blocked.length > 0) throw new ConflictException('Some dates are already booked');

      const rental = await tx.rental.create({
        data: {
          renterId,
          shopId: product.shopId,
          productId: dto.productId,
          startDate: start,
          endDate: end,
          totalDays,
          totalPrice,
          status: RentalStatus.PENDING,
          notes: dto.notes,
        },
      });

      await tx.availability.createMany({
        data: dates.map((date) => ({ productId: dto.productId, date, isBooked: true })),
        skipDuplicates: true,
      });

      return rental;
    });
  }

  async findMyRentals(renterId: string) {
    return this.prisma.rental.findMany({
      where: { renterId },
      include: {
        product: { select: { id: true, name: true, images: true } },
        shop: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findShopRentals(userId: string) {
    const shop = await this.prisma.shop.findUnique({ where: { ownerId: userId } });
    if (!shop) throw new ForbiddenException('You do not have a shop');

    return this.prisma.rental.findMany({
      where: { shopId: shop.id },
      include: {
        product: { select: { id: true, name: true, images: true } },
        renter: { select: { id: true, firstName: true, lastName: true, phone: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateStatus(userId: string, rentalId: string, dto: UpdateRentalStatusDto) {
    const shop = await this.prisma.shop.findUnique({ where: { ownerId: userId } });
    if (!shop) throw new ForbiddenException('You do not have a shop');

    const rental = await this.prisma.rental.findFirst({
      where: { id: rentalId, shopId: shop.id },
    });
    if (!rental) throw new NotFoundException('Rental not found');

    this.validateStatusTransition(rental.status, dto.status);

    const updated = await this.prisma.rental.update({
      where: { id: rentalId },
      data: { status: dto.status },
    });

    // Free blocked dates when shop rejects the booking
    if (dto.status === RentalStatus.REJECTED) {
      await this.prisma.availability.deleteMany({
        where: {
          productId: rental.productId,
          date: { gte: rental.startDate, lte: rental.endDate },
        },
      });
    }

    return updated;
  }

  private validateStatusTransition(from: RentalStatus, to: RentalStatus) {
    const allowed: Partial<Record<RentalStatus, RentalStatus[]>> = {
      [RentalStatus.PENDING]: [RentalStatus.CONFIRMED, RentalStatus.REJECTED],
      [RentalStatus.CONFIRMED]: [RentalStatus.ACTIVE],
      [RentalStatus.ACTIVE]: [RentalStatus.COMPLETED],
    };
    if (!allowed[from]?.includes(to)) {
      throw new BadRequestException(`Cannot transition rental from ${from} to ${to}`);
    }
  }

  async cancelRental(userId: string, rentalId: string) {
    const rental = await this.prisma.rental.findUnique({ where: { id: rentalId } });
    if (!rental) throw new NotFoundException('Rental not found');
    if (rental.renterId !== userId) throw new ForbiddenException('Not your rental');
    if (rental.status === RentalStatus.COMPLETED || rental.status === RentalStatus.ACTIVE) {
      throw new BadRequestException(`Cannot cancel a ${rental.status.toLowerCase()} rental`);
    }

    const result = await this.prisma.rental.update({
      where: { id: rentalId },
      data: { status: RentalStatus.CANCELLED },
    });

    await this.prisma.availability.deleteMany({
      where: { productId: rental.productId, date: { gte: rental.startDate, lte: rental.endDate } },
    });

    return result;
  }
}
