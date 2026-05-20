import { PrismaClient, UserRole, ShopStatus, ProductStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // ─── Categories ───────────────────────────────────────────────────────────

  const categories = [
    { name: 'กล้องถ่ายรูป', slug: 'camera', icon: 'camera' },
    { name: 'อุปกรณ์แคมป์ปิ้ง', slug: 'camping', icon: 'tent' },
    { name: 'ชุดราตรี / สูท', slug: 'formal-wear', icon: 'shirt' },
    { name: 'อุปกรณ์กีฬา', slug: 'sports', icon: 'dumbbell' },
    { name: 'เครื่องมือช่าง', slug: 'tools', icon: 'wrench' },
    { name: 'อุปกรณ์จัดงาน', slug: 'event', icon: 'party-popper' },
    { name: 'คอนโซลเกม', slug: 'gaming', icon: 'gamepad-2' },
    { name: 'อุปกรณ์เสียง', slug: 'audio', icon: 'speaker' },
  ];

  const categoryMap: Record<string, string> = {};
  for (const cat of categories) {
    const result = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    });
    categoryMap[cat.slug] = result.id;
  }

  // ─── Users ────────────────────────────────────────────────────────────────

  const password = await bcrypt.hash('password123', 12);

  await prisma.user.upsert({
    where: { email: 'admin@marketplace.com' },
    update: {},
    create: {
      email: 'admin@marketplace.com',
      password: await bcrypt.hash('admin1234', 12),
      firstName: 'Admin',
      lastName: 'System',
      role: UserRole.ADMIN,
    },
  });

  const seller1 = await prisma.user.upsert({
    where: { email: 'seller1@example.com' },
    update: {},
    create: {
      email: 'seller1@example.com',
      password,
      firstName: 'สมชาย',
      lastName: 'ร้านกล้อง',
      phone: '081-111-1111',
      role: UserRole.SELLER,
    },
  });

  const seller2 = await prisma.user.upsert({
    where: { email: 'seller2@example.com' },
    update: {},
    create: {
      email: 'seller2@example.com',
      password,
      firstName: 'สมหญิง',
      lastName: 'ร้านชุด',
      phone: '082-222-2222',
      role: UserRole.SELLER,
    },
  });

  await prisma.user.upsert({
    where: { email: 'buyer1@example.com' },
    update: {},
    create: {
      email: 'buyer1@example.com',
      password,
      firstName: 'มานี',
      lastName: 'ใจดี',
      phone: '083-333-3333',
      role: UserRole.BUYER,
    },
  });

  // ─── Shops ────────────────────────────────────────────────────────────────

  const shop1 = await prisma.shop.upsert({
    where: { ownerId: seller1.id },
    update: {},
    create: {
      ownerId: seller1.id,
      name: 'CameraHub เช่ากล้อง',
      description: 'ให้เช่ากล้อง DSLR, Mirrorless, และอุปกรณ์ถ่ายภาพครบครัน',
      district: 'สยาม',
      phone: '081-111-1111',
      lineId: '@camerahub',
      instagram: 'camerahub.th',
      openingHours: 'จันทร์-ศุกร์ 10:00-19:00, เสาร์-อาทิตย์ 10:00-17:00',
      status: ShopStatus.APPROVED,
    },
  });

  const shop2 = await prisma.shop.upsert({
    where: { ownerId: seller2.id },
    update: {},
    create: {
      ownerId: seller2.id,
      name: 'Dress & Go เช่าชุด',
      description: 'ให้เช่าชุดราตรี ชุดสูท สำหรับงานแต่งงาน งานเลี้ยง และถ่ายภาพ',
      district: 'อโศก',
      phone: '082-222-2222',
      lineId: '@dressandgo',
      instagram: 'dressandgo.th',
      openingHours: 'ทุกวัน 11:00-20:00',
      status: ShopStatus.APPROVED,
    },
  });

  // ─── Products ─────────────────────────────────────────────────────────────

  const cameraProducts = [
    {
      name: 'Sony A7III + Lens 24-70mm',
      description: 'Mirrorless full-frame ความละเอียดสูง เหมาะสำหรับงานแต่งงานและพอร์ตเทรต',
      pricePerDay: 1500,
      deposit: 10000,
      brand: 'Sony',
      occasion: 'photography',
      condition: 'ดีมาก',
    },
    {
      name: 'Canon EOS R6 Mark II',
      description: 'Mirrorless autofocus เร็ว เหมาะกับถ่ายกีฬาและ event',
      pricePerDay: 1800,
      deposit: 12000,
      brand: 'Canon',
      occasion: 'photography',
      condition: 'ดีมาก',
    },
    {
      name: 'DJI Osmo Action 4',
      description: 'Action camera กันน้ำ เหมาะสำหรับกีฬา outdoor',
      pricePerDay: 400,
      deposit: 3000,
      brand: 'DJI',
      occasion: 'sports',
      condition: 'ดี',
    },
  ];

  for (const p of cameraProducts) {
    await prisma.product.upsert({
      where: { id: `seed-camera-${p.name}` },
      update: {},
      create: {
        id: `seed-camera-${p.name}`,
        ...p,
        shopId: shop1.id,
        categoryId: categoryMap['camera'],
        status: ProductStatus.AVAILABLE,
      },
    });
  }

  const dressProducts = [
    {
      name: 'ชุดราตรียาว สีแดงเข้ม',
      description: 'ชุดราตรียาว ผ้าไหมแท้ เหมาะสำหรับงานแต่งงานและงานเลี้ยง',
      pricePerDay: 600,
      deposit: 2000,
      color: 'แดง',
      size: 'M',
      occasion: 'wedding',
      brand: 'Thai Silk House',
      condition: 'ดีมาก',
    },
    {
      name: 'สูทดำ Classic Fit',
      description: 'สูท 2 ชิ้น ทรง Classic สีดำ เหมาะสำหรับงานแต่งงานและงานทางการ',
      pricePerDay: 500,
      deposit: 3000,
      color: 'ดำ',
      size: 'L',
      occasion: 'formal',
      brand: 'Elegance',
      condition: 'ดี',
    },
    {
      name: 'ชุดราตรีสั้น สีทอง',
      description: 'ชุดราตรีสั้นประดับเลื่อม เหมาะสำหรับงานปาร์ตี้และ New Year',
      pricePerDay: 450,
      deposit: 1500,
      color: 'ทอง',
      size: 'S',
      occasion: 'party',
      brand: 'Glitter Studio',
      condition: 'ดีมาก',
    },
  ];

  for (const p of dressProducts) {
    await prisma.product.upsert({
      where: { id: `seed-dress-${p.name}` },
      update: {},
      create: {
        id: `seed-dress-${p.name}`,
        ...p,
        shopId: shop2.id,
        categoryId: categoryMap['formal-wear'],
        status: ProductStatus.AVAILABLE,
      },
    });
  }

  console.log('Seed completed successfully');
  console.log('');
  console.log('Test accounts (password: password123):');
  console.log('  Admin:  admin@marketplace.com / admin1234');
  console.log('  Seller: seller1@example.com (CameraHub)');
  console.log('  Seller: seller2@example.com (Dress & Go)');
  console.log('  Buyer:  buyer1@example.com');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
