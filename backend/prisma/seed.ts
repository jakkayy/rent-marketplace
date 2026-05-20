import { PrismaClient, UserRole, ShopStatus, ProductStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

function img(seed: string) {
  return `https://picsum.photos/seed/${seed}/600/800`;
}

async function main() {
  // ─── Categories ───────────────────────────────────────────────────────────

  const categories = [
    { name: 'กล้องถ่ายรูป',    slug: 'camera',      icon: 'camera' },
    { name: 'อุปกรณ์แคมป์ปิ้ง', slug: 'camping',     icon: 'tent' },
    { name: 'ชุดราตรี / สูท',   slug: 'formal-wear', icon: 'shirt' },
    { name: 'อุปกรณ์กีฬา',      slug: 'sports',      icon: 'dumbbell' },
    { name: 'เครื่องมือช่าง',    slug: 'tools',       icon: 'wrench' },
    { name: 'อุปกรณ์จัดงาน',     slug: 'event',       icon: 'party-popper' },
    { name: 'คอนโซลเกม',         slug: 'gaming',      icon: 'gamepad-2' },
    { name: 'อุปกรณ์เสียง',      slug: 'audio',       icon: 'speaker' },
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
    create: { email: 'seller1@example.com', password, firstName: 'สมชาย', lastName: 'กล้องดี', phone: '081-111-1111', role: UserRole.SELLER },
  });
  const seller2 = await prisma.user.upsert({
    where: { email: 'seller2@example.com' },
    update: {},
    create: { email: 'seller2@example.com', password, firstName: 'สมหญิง', lastName: 'ชุดสวย', phone: '082-222-2222', role: UserRole.SELLER },
  });
  const seller3 = await prisma.user.upsert({
    where: { email: 'seller3@example.com' },
    update: {},
    create: { email: 'seller3@example.com', password, firstName: 'วิชัย', lastName: 'เกียร์เยอะ', phone: '083-333-3333', role: UserRole.SELLER },
  });
  const seller4 = await prisma.user.upsert({
    where: { email: 'seller4@example.com' },
    update: {},
    create: { email: 'seller4@example.com', password, firstName: 'นิดา', lastName: 'เสียงดี', phone: '084-444-4444', role: UserRole.SELLER },
  });
  const seller5 = await prisma.user.upsert({
    where: { email: 'seller5@example.com' },
    update: {},
    create: { email: 'seller5@example.com', password, firstName: 'บอย', lastName: 'เกมส์', phone: '085-555-5555', role: UserRole.SELLER },
  });

  await prisma.user.upsert({
    where: { email: 'buyer1@example.com' },
    update: {},
    create: { email: 'buyer1@example.com', password, firstName: 'มานี', lastName: 'ใจดี', phone: '086-666-6666', role: UserRole.BUYER },
  });
  await prisma.user.upsert({
    where: { email: 'buyer2@example.com' },
    update: {},
    create: { email: 'buyer2@example.com', password, firstName: 'วิไล', lastName: 'รักสนุก', phone: '087-777-7777', role: UserRole.BUYER },
  });

  // ─── Shops ────────────────────────────────────────────────────────────────

  const shop1 = await prisma.shop.upsert({
    where: { ownerId: seller1.id },
    update: {},
    create: {
      ownerId: seller1.id,
      name: 'CameraHub เช่ากล้อง',
      description: 'ให้เช่ากล้อง DSLR, Mirrorless และอุปกรณ์ถ่ายภาพครบครัน พร้อมคำแนะนำการใช้งาน',
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
      description: 'เช่าชุดราตรี ชุดสูท ชุดงานแต่ง ดูแลรักษาดี พร้อมบริการแก้ชุด',
      district: 'อโศก',
      phone: '082-222-2222',
      lineId: '@dressandgo',
      instagram: 'dressandgo.th',
      openingHours: 'ทุกวัน 11:00-20:00',
      status: ShopStatus.APPROVED,
    },
  });

  const shop3 = await prisma.shop.upsert({
    where: { ownerId: seller3.id },
    update: {},
    create: {
      ownerId: seller3.id,
      name: 'GearUp เช่าอุปกรณ์',
      description: 'เช่าอุปกรณ์กีฬา แคมป์ปิ้ง และเครื่องมือช่าง สำหรับทุกกิจกรรม',
      district: 'เอกมัย',
      phone: '083-333-3333',
      lineId: '@gearup',
      instagram: 'gearup.rental',
      openingHours: 'ทุกวัน 09:00-20:00',
      status: ShopStatus.APPROVED,
    },
  });

  const shop4 = await prisma.shop.upsert({
    where: { ownerId: seller4.id },
    update: {},
    create: {
      ownerId: seller4.id,
      name: 'Sound & Stage อุปกรณ์เสียง',
      description: 'เช่าลำโพง ไมค์ โปรเจคเตอร์ และอุปกรณ์จัดงานครบวงจร',
      district: 'ลาดพร้าว',
      phone: '084-444-4444',
      lineId: '@soundstage',
      instagram: 'soundstage.th',
      openingHours: 'จันทร์-เสาร์ 09:00-19:00',
      status: ShopStatus.APPROVED,
    },
  });

  const shop5 = await prisma.shop.upsert({
    where: { ownerId: seller5.id },
    update: {},
    create: {
      ownerId: seller5.id,
      name: 'GameZone เช่าเกม',
      description: 'เช่าคอนโซลเกมและเกมล่าสุด PS5, Xbox, Nintendo Switch',
      district: 'จตุจักร',
      phone: '085-555-5555',
      lineId: '@gamezone',
      instagram: 'gamezone.rental',
      openingHours: 'ทุกวัน 12:00-22:00',
      status: ShopStatus.APPROVED,
    },
  });

  // ─── Products ─────────────────────────────────────────────────────────────

  type ProductSeed = {
    name: string;
    description: string;
    images: string[];
    pricePerDay: number;
    deposit?: number;
    brand?: string;
    size?: string;
    color?: string;
    occasion?: string;
    tags?: string[];
    condition: string;
  };

  const allProducts: { prefix: string; shopId: string; categorySlug: string; items: ProductSeed[] }[] = [
    {
      prefix: 'camera',
      shopId: shop1.id,
      categorySlug: 'camera',
      items: [
        {
          name: 'Sony A7III + Lens 24-70mm',
          description: 'Mirrorless full-frame ความละเอียดสูง เหมาะสำหรับงานแต่งงานและพอร์ตเทรต',
          images: [img('sony-a7iii'), img('sony-lens')],
          pricePerDay: 1500, deposit: 10000, brand: 'Sony', occasion: 'photography', condition: 'ดีมาก',
        },
        {
          name: 'Canon EOS R6 Mark II',
          description: 'Mirrorless autofocus เร็ว เหมาะกับถ่ายกีฬาและ event',
          images: [img('canon-r6'), img('canon-body')],
          pricePerDay: 1800, deposit: 12000, brand: 'Canon', occasion: 'photography', condition: 'ดีมาก',
        },
        {
          name: 'DJI Mavic 3 Pro โดรน',
          description: 'โดรนถ่ายภาพ 4K มีระบบกันสั่น Hasselblad เหมาะถ่ายวิดีโอมุมสูง',
          images: [img('dji-mavic3'), img('drone-aerial')],
          pricePerDay: 1200, deposit: 15000, brand: 'DJI', occasion: 'photography', condition: 'ดีมาก',
        },
        {
          name: 'GoPro Hero 12 Black',
          description: 'Action camera 5.3K กันน้ำ เหมาะสำหรับกีฬา extreme และดำน้ำ',
          images: [img('gopro-hero12'), img('gopro-mount')],
          pricePerDay: 350, deposit: 2500, brand: 'GoPro', occasion: 'sports', condition: 'ดี',
        },
        {
          name: 'Nikon Z6II + 50mm f/1.8',
          description: 'Mirrorless สำหรับถ่ายภาพนิ่งและวิดีโอ ใช้งานง่าย เหมาะสำหรับมือใหม่',
          images: [img('nikon-z6ii'), img('nikon-lens')],
          pricePerDay: 1100, deposit: 8000, brand: 'Nikon', occasion: 'photography', condition: 'ดี',
        },
      ],
    },
    {
      prefix: 'dress',
      shopId: shop2.id,
      categorySlug: 'formal-wear',
      items: [
        {
          name: 'ชุดราตรียาว สีแดงเข้ม',
          description: 'ชุดราตรียาว ผ้าไหมแท้ เหมาะสำหรับงานแต่งงานและงานเลี้ยง',
          images: [img('red-evening-dress'), img('red-dress-detail')],
          pricePerDay: 600, deposit: 2000, color: 'แดง', size: 'M', occasion: 'wedding', brand: 'Thai Silk House', condition: 'ดีมาก',
        },
        {
          name: 'สูทดำ Classic Fit',
          description: 'สูท 2 ชิ้น ทรง Classic สีดำ เหมาะสำหรับงานแต่งงานและงานทางการ',
          images: [img('black-suit-classic'), img('suit-detail')],
          pricePerDay: 500, deposit: 3000, color: 'ดำ', size: 'L', occasion: 'formal', brand: 'Elegance', condition: 'ดี',
        },
        {
          name: 'ชุดราตรีสั้น สีทอง',
          description: 'ชุดราตรีสั้นประดับเลื่อม เหมาะสำหรับงานปาร์ตี้และ New Year',
          images: [img('gold-party-dress'), img('glitter-dress')],
          pricePerDay: 450, deposit: 1500, color: 'ทอง', size: 'S', occasion: 'party', brand: 'Glitter Studio', condition: 'ดีมาก',
        },
        {
          name: 'ชุดเวดดิ้ง สีขาวครีม',
          description: 'ชุดแต่งงาน ผ้าลูกไม้ พร้อมผ้าคลุม เหมาะสำหรับถ่ายภาพ pre-wedding',
          images: [img('white-wedding-dress'), img('bridal-lace')],
          pricePerDay: 1200, deposit: 5000, color: 'ขาว', size: 'M', occasion: 'wedding', brand: 'Bridal Studio', condition: 'ดีมาก',
        },
        {
          name: 'ชุดค็อกเทล สีกรมท่า',
          description: 'ชุดค็อกเทลผ้าซาติน ทรงสวย เหมาะสำหรับงานเลี้ยงและงาน corporate',
          images: [img('navy-cocktail'), img('cocktail-detail')],
          pricePerDay: 380, deposit: 1200, color: 'กรมท่า', size: 'S', occasion: 'cocktail', brand: 'Chic Label', condition: 'ดี',
        },
        {
          name: 'สูทสีเทา Slim Fit',
          description: 'สูท 2 ชิ้น ทรง Slim สีเทา สำหรับงานสัมภาษณ์และงาน formal',
          images: [img('grey-slim-suit'), img('suit-grey-detail')],
          pricePerDay: 450, deposit: 2500, color: 'เทา', size: 'M', occasion: 'formal', brand: 'Gentleman', condition: 'ดีมาก',
        },
      ],
    },
    {
      prefix: 'gear',
      shopId: shop3.id,
      categorySlug: 'camping',
      items: [
        {
          name: 'เต็นท์ Coleman 4 คน',
          description: 'เต็นท์กันน้ำ 4 คน น้ำหนักเบา ติดตั้งง่าย เหมาะสำหรับแคมป์ปิ้งครอบครัว',
          images: [img('coleman-tent'), img('camping-tent-setup')],
          pricePerDay: 350, deposit: 2000, brand: 'Coleman', occasion: 'camping', condition: 'ดี',
        },
        {
          name: 'ถุงนอน The North Face -5°C',
          description: 'ถุงนอนไฮคิง ทนอุณหภูมิ -5°C เหมาะสำหรับเขาสูง น้ำหนักเบา',
          images: [img('north-face-sleeping-bag'), img('sleeping-bag-detail')],
          pricePerDay: 150, deposit: 1000, brand: 'The North Face', condition: 'ดีมาก',
        },
        {
          name: 'จักรยานเสือหมอบ Trek',
          description: 'จักรยานเสือหมอบ Trek กรอบอลูมิเนียม 21 สปีด เหมาะสำหรับปั่นออกกำลังกาย',
          images: [img('trek-road-bike'), img('bike-detail')],
          pricePerDay: 400, deposit: 5000, brand: 'Trek', occasion: 'sports', condition: 'ดีมาก',
        },
        {
          name: 'สกีบอร์ด Rossignol',
          description: 'สกีบอร์ดพร้อมบูท เหมาะสำหรับผู้เริ่มต้น-ระดับกลาง',
          images: [img('rossignol-ski'), img('ski-detail')],
          pricePerDay: 500, deposit: 8000, brand: 'Rossignol', occasion: 'sports', condition: 'ดี',
        },
        {
          name: 'SUP Board พาย Stand-up',
          description: 'บอร์ดพายยืน inflatable น้ำหนักเบา พับเก็บได้ เหมาะสำหรับทะเลและแม่น้ำ',
          images: [img('sup-board'), img('paddleboard-water')],
          pricePerDay: 600, deposit: 4000, occasion: 'sports', condition: 'ดีมาก',
        },
      ],
    },
    {
      prefix: 'gear-sports',
      shopId: shop3.id,
      categorySlug: 'sports',
      items: [
        {
          name: 'ชุดดำน้ำ Wetsuit 3mm',
          description: 'ชุดดำน้ำ 3mm เหมาะสำหรับน้ำอุ่น ใส่สบาย ยืดหยุ่นดี',
          images: [img('wetsuit-diving'), img('diving-gear')],
          pricePerDay: 250, deposit: 1500, occasion: 'sports', condition: 'ดี',
        },
        {
          name: 'ไม้เทนนิส Wilson Pro Staff',
          description: 'ไม้เทนนิส Wilson Pro Staff สำหรับผู้เล่นระดับกลาง-สูง',
          images: [img('wilson-tennis'), img('tennis-racket')],
          pricePerDay: 120, deposit: 800, brand: 'Wilson', occasion: 'sports', condition: 'ดีมาก',
        },
      ],
    },
    {
      prefix: 'audio',
      shopId: shop4.id,
      categorySlug: 'audio',
      items: [
        {
          name: 'ลำโพง JBL EON715 15 นิ้ว',
          description: 'ลำโพง PA 1300W พร้อม DSP ในตัว เหมาะสำหรับงาน event และคอนเสิร์ตเล็ก',
          images: [img('jbl-eon715'), img('speaker-setup')],
          pricePerDay: 800, deposit: 5000, brand: 'JBL', condition: 'ดีมาก',
        },
        {
          name: 'ไมค์ Wireless Shure BLX24',
          description: 'ไมค์ไร้สาย Shure คู่หนึ่ง ระยะ 100 เมตร เหมาะงานประชุมและงานแสดง',
          images: [img('shure-blx24'), img('wireless-mic')],
          pricePerDay: 500, deposit: 3000, brand: 'Shure', condition: 'ดีมาก',
        },
        {
          name: 'โปรเจคเตอร์ Epson 4000 Lumens',
          description: 'โปรเจคเตอร์ Full HD 4000 Lumens เหมาะสำหรับห้องประชุมและงาน presentation',
          images: [img('epson-projector'), img('projector-screen')],
          pricePerDay: 700, deposit: 5000, brand: 'Epson', condition: 'ดี',
        },
        {
          name: 'มิกเซอร์ Yamaha MG10',
          description: 'มิกเซอร์ 10 Channel พร้อม USB เหมาะสำหรับบันทึกเสียงและงาน live',
          images: [img('yamaha-mg10'), img('mixer-detail')],
          pricePerDay: 400, deposit: 2500, brand: 'Yamaha', condition: 'ดี',
        },
      ],
    },
    {
      prefix: 'event',
      shopId: shop4.id,
      categorySlug: 'event',
      items: [
        {
          name: 'โต๊ะพับ + เก้าอี้ชุด 10',
          description: 'โต๊ะพับสแตนเลส 10 ตัว และเก้าอี้ 10 ตัว สำหรับจัดงานเลี้ยงหรือสัมมนา',
          images: [img('folding-table-chairs'), img('event-setup')],
          pricePerDay: 600, deposit: 0, condition: 'ดี',
        },
        {
          name: 'ไฟ LED Uplighting ชุด 8',
          description: 'ไฟ LED 8 ดวง ปรับสีได้ เหมาะสำหรับตกแต่งงานแต่งงานและงาน event',
          images: [img('led-uplighting'), img('event-lights')],
          pricePerDay: 800, deposit: 3000, condition: 'ดีมาก',
        },
      ],
    },
    {
      prefix: 'gaming',
      shopId: shop5.id,
      categorySlug: 'gaming',
      items: [
        {
          name: 'PlayStation 5 + 2 จอย',
          description: 'PS5 Digital Edition พร้อมจอย DualSense 2 อัน และเกม 5 แผ่น',
          images: [img('ps5-console'), img('ps5-controller')],
          pricePerDay: 400, deposit: 8000, brand: 'Sony', condition: 'ดีมาก',
        },
        {
          name: 'Xbox Series X + Game Pass',
          description: 'Xbox Series X พร้อม Game Pass Ultimate 1 เดือน เล่นได้ทุกเกม',
          images: [img('xbox-series-x'), img('xbox-controller')],
          pricePerDay: 380, deposit: 7500, brand: 'Microsoft', condition: 'ดีมาก',
        },
        {
          name: 'Nintendo Switch OLED',
          description: 'Nintendo Switch OLED พร้อมเกม Mario Kart 8, Zelda BOTW และ Splatoon 3',
          images: [img('nintendo-switch-oled'), img('switch-games')],
          pricePerDay: 280, deposit: 5000, brand: 'Nintendo', condition: 'ดี',
        },
        {
          name: 'VR Headset Meta Quest 3',
          description: 'Meta Quest 3 standalone VR พร้อมแอปและเกม VR กว่า 10 รายการ',
          images: [img('meta-quest3'), img('vr-headset')],
          pricePerDay: 500, deposit: 10000, brand: 'Meta', condition: 'ดีมาก',
        },
        {
          name: 'Gaming PC RTX 4070',
          description: 'Gaming PC RTX 4070, i7-13700K, 32GB RAM เหมาะสำหรับเล่นเกม AAA',
          images: [img('gaming-pc'), img('rtx-gaming')],
          pricePerDay: 800, deposit: 20000, brand: 'Custom Build', condition: 'ดีมาก',
        },
      ],
    },
  ];

  for (const group of allProducts) {
    for (const p of group.items) {
      await prisma.product.upsert({
        where: { id: `seed-${group.prefix}-${p.name}` },
        update: { images: p.images },
        create: {
          id: `seed-${group.prefix}-${p.name}`,
          ...p,
          shopId: group.shopId,
          categoryId: categoryMap[group.categorySlug],
          status: ProductStatus.AVAILABLE,
        },
      });
    }
  }

  console.log('Seed completed successfully');
  console.log('');
  console.log('Shops:  5 shops');
  console.log('Products:', allProducts.reduce((n, g) => n + g.items.length, 0), 'items');
  console.log('');
  console.log('Test accounts:');
  console.log('  Admin:    admin@marketplace.com / admin1234');
  console.log('  Seller 1: seller1@example.com  — CameraHub');
  console.log('  Seller 2: seller2@example.com  — Dress & Go');
  console.log('  Seller 3: seller3@example.com  — GearUp');
  console.log('  Seller 4: seller4@example.com  — Sound & Stage');
  console.log('  Seller 5: seller5@example.com  — GameZone');
  console.log('  Buyer 1:  buyer1@example.com   — password123');
  console.log('  Buyer 2:  buyer2@example.com   — password123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
