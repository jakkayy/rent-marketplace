import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(helmet());
  app.enableCors({
    origin: process.env.FRONTEND_URL ?? 'http://localhost:3000',
    credentials: true,
  });

  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('Marketplace API')
    .setDescription(
      '## วิธีใช้งาน\n' +
      '1. เรียก **Auth → เข้าสู่ระบบ** แล้ว copy `access_token`\n' +
      '2. กดปุ่ม **Authorize 🔒** ด้านบน แล้ววาง token\n' +
      '3. ทดสอบ endpoint ที่ต้องการได้เลย\n\n' +
      '> endpoint ที่มีไอคอน 🔒 ต้องการ token ก่อนใช้งาน',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('Auth', 'สมัครสมาชิก / เข้าสู่ระบบ / รีเซ็ตรหัสผ่าน — เริ่มต้นที่นี่')
    .addTag('Users', 'จัดการโปรไฟล์และรายการโปรด')
    .addTag('Categories', 'หมวดหมู่สินค้า (ข้อมูลอ้างอิง)')
    .addTag('Shops', 'สร้างและจัดการร้าน')
    .addTag('Products', 'สินค้า ตารางวันว่าง และการติดต่อ LINE')
    .addTag('Rentals', 'การเช่า — จอง / ยืนยัน / ยกเลิก')
    .addTag('Upload', 'อัปโหลดรูปภาพ')
    .addTag('Admin', 'จัดการแพลตฟอร์ม (เฉพาะ ADMIN)')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  const port = process.env.PORT ?? 3001;
  await app.listen(port);
  console.log(`Server running on http://localhost:${port}/api`);
  console.log(`Swagger docs at http://localhost:${port}/docs`);
}
bootstrap();
