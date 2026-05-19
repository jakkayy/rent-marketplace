import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
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

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    });
  }

  const adminExists = await prisma.user.findUnique({
    where: { email: 'admin@marketplace.com' },
  });

  if (!adminExists) {
    await prisma.user.create({
      data: {
        email: 'admin@marketplace.com',
        password: await bcrypt.hash('admin1234', 12),
        firstName: 'Admin',
        lastName: 'System',
        role: UserRole.ADMIN,
      },
    });
  }

  console.log('Seed completed successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
