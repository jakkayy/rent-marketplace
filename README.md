# Marketplace Rental Platform

แพลตฟอร์มเช่าสินค้าออนไลน์ เชื่อมต่อร้านค้ากับลูกค้าผ่าน LINE

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | NestJS, TypeScript, Prisma ORM |
| Frontend | Next.js, TypeScript |
| Database | PostgreSQL |
| Storage | MinIO (S3-compatible) |
| Auth | JWT |

## Prerequisites

- Node.js 20+
- Docker + Docker Compose

## Getting Started

### 1. Clone และติดตั้ง dependencies

```bash
make setup
```

### 2. ตั้งค่า environment variables

```bash
cp backend/.env.example backend/.env
```

แก้ไขค่าใน `backend/.env` ตามต้องการ (โดยเฉพาะ `JWT_SECRET`)

### 3. Start services (PostgreSQL + MinIO)

```bash
make db
```

### 4. Run database migrations และ seed

```bash
make prisma-migrate
make prisma-seed
```

### 5. Start development servers

```bash
make dev
```

- Backend: http://localhost:3001/api
- Frontend: http://localhost:3000
- MinIO Console: http://localhost:9001 (login: `marketplace` / `marketplace123`)

## Available Commands

```bash
make db              # Start Docker services
make db-down         # Stop Docker services
make db-reset        # Reset database (ลบข้อมูลทั้งหมด)
make backend         # Start backend only
make frontend        # Start frontend only
make dev             # Start backend + frontend
make prisma-migrate  # Run migrations
make prisma-studio   # Open Prisma Studio GUI
make prisma-seed     # Seed initial data
make clean           # Remove node_modules and build artifacts
```

## API Endpoints

### Auth
| Method | Path | Description |
|---|---|---|
| POST | `/api/auth/register` | สมัครสมาชิก (role: BUYER/SELLER) |
| POST | `/api/auth/login` | เข้าสู่ระบบ |
| POST | `/api/auth/logout` | ออกจากระบบ |
| POST | `/api/auth/forgot-password` | ขอรีเซ็ตรหัสผ่าน |
| POST | `/api/auth/reset-password` | รีเซ็ตรหัสผ่าน |

### Users
| Method | Path | Description |
|---|---|---|
| GET | `/api/users/me` | ดูโปรไฟล์ตัวเอง |
| PATCH | `/api/users/me` | แก้ไขโปรไฟล์ |
| GET | `/api/users/me/favorites` | รายการโปรด |
| POST | `/api/users/me/favorites/:productId` | เพิ่มรายการโปรด |
| DELETE | `/api/users/me/favorites/:productId` | ลบรายการโปรด |

### Shops
| Method | Path | Description |
|---|---|---|
| GET | `/api/shops` | รายการร้านค้า (filter: district, q, page, limit) |
| POST | `/api/shops` | สร้างร้านค้า (ต้องเป็น SELLER) |
| GET | `/api/shops/my` | ร้านของฉัน |
| PATCH | `/api/shops/my` | แก้ไขร้าน |
| GET | `/api/shops/:id` | รายละเอียดร้าน |

### Products
| Method | Path | Description |
|---|---|---|
| GET | `/api/products` | รายการสินค้า (filter: categoryId, shopId, brand, size, color, occasion, priceMin, priceMax, sort, page, limit) |
| POST | `/api/products` | เพิ่มสินค้า |
| GET | `/api/products/:id` | รายละเอียดสินค้า |
| PATCH | `/api/products/:id` | แก้ไขสินค้า |
| DELETE | `/api/products/:id` | ลบสินค้า |
| GET | `/api/products/:id/availability` | ตรวจสอบวันว่าง |
| POST | `/api/products/:id/contact` | Track การกด LINE |

### Rentals
| Method | Path | Description |
|---|---|---|
| POST | `/api/rentals` | สร้างคำขอจอง |
| GET | `/api/rentals/my` | ประวัติการจองของฉัน |
| GET | `/api/rentals/shop` | คำขอจองของร้าน |
| PATCH | `/api/rentals/:id/status` | อัปเดตสถานะ (ร้านค้า) |
| DELETE | `/api/rentals/:id` | ยกเลิกการจอง |

### Admin (ต้องเป็น ADMIN)
| Method | Path | Description |
|---|---|---|
| GET | `/api/admin/stats` | สถิติรวม |
| GET | `/api/admin/shops` | จัดการร้านค้าทั้งหมด |
| PATCH | `/api/admin/shops/:id/status` | Approve/Suspend ร้าน |
| GET | `/api/admin/users` | จัดการผู้ใช้ |
| PATCH | `/api/admin/users/:id/active` | เปิด/ปิดบัญชีผู้ใช้ |
| GET | `/api/admin/products` | จัดการสินค้า |
| PATCH | `/api/admin/products/:id/status` | เปลี่ยนสถานะสินค้า |
| GET | `/api/admin/rentals` | ดูการจองทั้งหมด |

### Other
| Method | Path | Description |
|---|---|---|
| POST | `/api/upload` | อัปโหลดรูปภาพ (jpg, png, webp, max 5MB) |
| GET | `/api/categories` | รายการหมวดหมู่ |

## Rental Status Flow

```
PENDING → CONFIRMED → ACTIVE → COMPLETED
       ↘ REJECTED
PENDING/CONFIRMED → CANCELLED (โดยลูกค้า)
```

## Shop Status Flow

```
PENDING → APPROVED  (โดย Admin)
        → SUSPENDED (โดย Admin)
```

## Default Admin Account

หลัง `make prisma-seed`:
- Email: `admin@marketplace.com`
- Password: `admin1234`

> เปลี่ยนรหัสผ่านก่อนใช้งานจริง
